import type { Server as HttpServer } from 'node:http';

import { createAdapter } from '@socket.io/redis-adapter';
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';

import { resolveUser } from '../auth.js';
import { env } from '../env.js';
import { sendPush } from '../push/webPush.js';
import { createRedisPair } from '../redis.js';
import { messageStore } from '../store/messageStore.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types.js';

import { PresenceTracker } from './presence.js';

type AfratServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
type AfratSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const joinSchema = z.object({
  roomId: z.string().min(1).max(128),
  sinceSeq: z.number().int().nonnegative().optional(),
});

const sendSchema = z.object({
  clientId: z.string().min(1).max(128),
  roomId: z.string().min(1).max(128),
  kind: z.enum(['text', 'image', 'voice', 'file', 'system']),
  // 4000 characters is generous for a chat message and cheap to bound.
  body: z.string().max(4_000),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(['image', 'voice', 'file']),
        url: z.string().url(),
        mimeType: z.string(),
        sizeBytes: z.number().int().nonnegative(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        durationSec: z.number().nonnegative().optional(),
        fileName: z.string().optional(),
      }),
    )
    .max(6)
    .optional(),
  replyToId: z.string().optional(),
});

const typingSchema = z.object({
  roomId: z.string().min(1).max(128),
  typing: z.boolean(),
});

const receiptSchema = z.object({
  roomId: z.string().min(1).max(128),
  lastReadSeq: z.number().int().nonnegative(),
});

const reactionSchema = z.object({
  roomId: z.string().min(1).max(128),
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(16),
});

/** Per-socket token bucket. Chat is bursty, so allow a burst then drip. */
const RATE_LIMIT = { capacity: 12, refillPerSecond: 2 };

class TokenBucket {
  private tokens = RATE_LIMIT.capacity;
  private updatedAt = Date.now();

  take(): boolean {
    const now = Date.now();
    const elapsed = (now - this.updatedAt) / 1000;
    this.tokens = Math.min(
      RATE_LIMIT.capacity,
      this.tokens + elapsed * RATE_LIMIT.refillPerSecond,
    );
    this.updatedAt = now;

    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

export async function createGateway(httpServer: HttpServer): Promise<AfratServer> {
  const io: AfratServer = new Server(httpServer, {
    path: env.SOCKET_PATH,
    cors: { origin: env.corsOrigins, credentials: true },

    // Keep long-polling available: where the WebSocket upgrade is blocked or
    // mangled by a transparent proxy, clients silently stay on polling
    // instead of failing to connect at all.
    transports: ['websocket', 'polling'],
    allowUpgrades: true,

    // Heartbeat. A 25s ping with a 20s timeout detects a dead peer inside
    // roughly 45 seconds without being chatty enough to drain a phone battery.
    pingInterval: 25_000,
    pingTimeout: 20_000,

    // Allow a reconnecting client to resume its session (and its room
    // membership) for two minutes after a drop — the length of a tunnel or a
    // lift ride.
    connectionStateRecovery: {
      maxDisconnectionDuration: 120_000,
      skipMiddlewares: false,
    },

    maxHttpBufferSize: 1e6, // 1 MB; binaries go through presigned uploads
    perMessageDeflate: { threshold: 1024 },
  });

  const redisPair = await createRedisPair();
  if (redisPair) {
    io.adapter(createAdapter(redisPair.pubClient, redisPair.subClient));
  }

  const presence = new PresenceTracker(redisPair?.pubClient ?? null);

  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string } | undefined)?.token ??
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    const user = await resolveUser(token);
    if (!user) return next(new Error('UNAUTHORIZED'));

    socket.data.user = user;
    next();
  });

  io.on('connection', (socket: AfratSocket) => {
    const user = socket.data.user;
    const bucket = new TokenBucket();
    const joined = new Set<string>();

    socket.on('room:join', async (payload, ack) => {
      const parsed = joinSchema.safeParse(payload);
      if (!parsed.success) return ack({ ok: false, error: 'INVALID_PAYLOAD' });

      const { roomId } = parsed.data;
      const room = await messageStore.getRoom(roomId);
      if (!room) return ack({ ok: false, error: 'ROOM_NOT_FOUND' });

      await socket.join(roomId);
      joined.add(roomId);
      await presence.join(roomId, user.id);

      io.to(roomId).emit('presence:update', {
        roomId,
        entries: await presence.list(roomId),
      });

      ack({ ok: true, latestSeq: await messageStore.latestSeq(roomId) });
    });

    socket.on('room:leave', async ({ roomId }) => {
      if (!joined.has(roomId)) return;
      await socket.leave(roomId);
      joined.delete(roomId);
      await presence.leave(roomId, user.id);

      io.to(roomId).emit('presence:update', {
        roomId,
        entries: await presence.list(roomId),
      });
    });

    socket.on('message:send', async (payload, ack) => {
      const parsed = sendSchema.safeParse(payload);
      if (!parsed.success) {
        return ack({ ok: false, error: 'محتوای پیام معتبر نیست.', retryable: false });
      }

      const message = parsed.data;
      if (!joined.has(message.roomId)) {
        return ack({ ok: false, error: 'FORBIDDEN', retryable: false });
      }
      if (!bucket.take()) {
        return ack({ ok: false, error: 'کمی آرام‌تر ارسال کنید.', retryable: true });
      }
      if (!message.body.trim() && !message.attachments?.length) {
        return ack({ ok: false, error: 'EMPTY_MESSAGE', retryable: false });
      }

      try {
        const stored = await messageStore.append(message, user);

        // Ack the sender first so the optimistic bubble settles immediately,
        // then fan out to everyone else.
        ack({ ok: true, id: stored.id, seq: stored.seq, createdAt: stored.createdAt });
        socket.to(message.roomId).emit('message:new', stored);

        await notifyAbsentMembers({ io, presence, roomId: message.roomId, stored });
      } catch (error) {
        const code = (error as Error).message;
        ack({
          ok: false,
          error: code === 'ROOM_NOT_FOUND' ? 'اتاق یافت نشد.' : 'ارسال ناموفق بود.',
          retryable: code !== 'ROOM_NOT_FOUND',
        });
      }
    });

    socket.on('typing:set', (payload) => {
      const parsed = typingSchema.safeParse(payload);
      if (!parsed.success || !joined.has(parsed.data.roomId)) return;

      // Broadcast to others only — echoing to the sender causes a self-typing
      // indicator on a second device.
      socket.to(parsed.data.roomId).emit('typing:update', {
        roomId: parsed.data.roomId,
        userId: user.id,
        displayName: user.displayName,
        typing: parsed.data.typing,
      });
    });

    socket.on('receipt:read', async (payload) => {
      const parsed = receiptSchema.safeParse(payload);
      if (!parsed.success || !joined.has(parsed.data.roomId)) return;

      const receipt = await messageStore.setReadCursor({
        roomId: parsed.data.roomId,
        userId: user.id,
        lastReadSeq: parsed.data.lastReadSeq,
      });
      socket.to(parsed.data.roomId).emit('receipt:update', receipt);
    });

    socket.on('reaction:toggle', async (payload) => {
      const parsed = reactionSchema.safeParse(payload);
      if (!parsed.success || !joined.has(parsed.data.roomId)) return;

      const reactions = await messageStore.toggleReaction({
        ...parsed.data,
        userId: user.id,
      });
      if (!reactions) return;

      io.to(parsed.data.roomId).emit('reaction:updated', {
        roomId: parsed.data.roomId,
        messageId: parsed.data.messageId,
        reactions,
      });
    });

    socket.on('disconnect', async () => {
      await Promise.all(
        [...joined].map(async (roomId) => {
          await presence.leave(roomId, user.id);
          io.to(roomId).emit('presence:update', {
            roomId,
            entries: await presence.list(roomId),
          });
        }),
      );
      joined.clear();
    });
  });

  return io;
}

/**
 * Push is the fallback for members with no live socket in the room. The check
 * is deliberately per-room: a mother reading the nutrition room should still
 * be notified about her doctor's reply.
 */
async function notifyAbsentMembers({
  io,
  presence,
  roomId,
  stored,
}: {
  io: AfratServer;
  presence: PresenceTracker;
  roomId: string;
  stored: { authorId: string; body: string; kind: string; author?: { displayName: string } };
}) {
  const room = await messageStore.getRoom(roomId);
  if (!room) return;

  // For 1:1 consultations the recipient is unambiguous. Group rooms need a
  // real membership table — see the schema note in `messageStore.ts`.
  const recipientId =
    room.kind === 'consult' && room.counterpart && room.counterpart.id !== stored.authorId
      ? room.counterpart.id
      : null;
  if (!recipientId) return;

  if (await presence.isOnline(roomId, recipientId)) return;

  const preview =
    stored.kind === 'image'
      ? 'تصویری ارسال شد'
      : stored.kind === 'voice'
        ? 'پیام صوتی ارسال شد'
        : stored.body.slice(0, 120);

  await sendPush(recipientId, {
    title: stored.author?.displayName ?? 'آفرت',
    body: preview,
    url: `/chat/${roomId}`,
    tag: `room-${roomId}`,
  });

  void io; // reserved for future in-app fan-out
}
