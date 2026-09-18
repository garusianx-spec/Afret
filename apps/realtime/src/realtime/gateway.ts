import type { Server as HttpServer } from 'node:http';

import { createAdapter } from '@socket.io/redis-adapter';
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';

import { authenticate, toChatUser } from '../auth/middleware.js';
import { hasPermission } from '../auth/types.js';
import { env } from '../env.js';
import { sendPush } from '../push/webPush.js';
import { createRedisPair } from '../redis.js';
import { membershipStore, DEFAULT_ROOMS } from '../store/membershipStore.js';
import { messageStore } from '../store/messageStore.js';
import type {
  ChatMessage,
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

  /**
   * Handshake authentication.
   *
   * The identity on a socket comes from a verified JWT signature and nothing
   * else — never from a client-supplied user id. Everything downstream
   * (authorship, permissions, presence) trusts `socket.data.user`, so this
   * middleware is the only place that decides who someone is.
   */
  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string } | undefined)?.token ??
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    const authUser = await authenticate(token);
    if (!authUser) {
      // A distinct code lets the client tell "token expired, refresh and
      // retry" apart from "server is down, back off and retry".
      return next(new Error('UNAUTHORIZED'));
    }

    socket.data.auth = authUser;
    socket.data.user = toChatUser(authUser);
    next();
  });

  io.on('connection', (socket: AfratSocket) => {
    const user = socket.data.user;
    const bucket = new TokenBucket();
    const joined = new Set<string>();

    // Membership is what makes offline push possible, so it must exist before
    // the first message rather than being created lazily on join.
    void Promise.all(
      DEFAULT_ROOMS.map((room) =>
        membershipStore.join({ roomId: room.id, userId: user.id }),
      ),
    ).catch((error) => {
      io.engine?.emit?.('error', error);
    });

    socket.on('room:join', async (payload, ack) => {
      const parsed = joinSchema.safeParse(payload);
      if (!parsed.success) return ack({ ok: false, error: 'INVALID_PAYLOAD' });

      const { roomId } = parsed.data;
      const room = await messageStore.getRoom(roomId);
      if (!room) return ack({ ok: false, error: 'ROOM_NOT_FOUND' });

      await socket.join(roomId);
      joined.add(roomId);
      await membershipStore.join({ roomId, userId: user.id });
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
      if (!hasPermission(socket.data.auth.permissions, 'chat:write')) {
        return ack({
          ok: false,
          error: 'اجازهٔ ارسال پیام در این بخش را ندارید.',
          retryable: false,
        });
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

        await notifyAbsentMembers({ presence, roomId: message.roomId, stored });
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
      await membershipStore.setLastRead(
        parsed.data.roomId,
        user.id,
        parsed.data.lastReadSeq,
      );
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
 * Push fan-out for everyone who will not see the message on screen.
 *
 * Recipients come from the membership table, minus the author, minus anyone
 * with a live socket in this room, minus mutes and notify preferences. Group
 * rooms work the same way as 1:1 consultations — the only difference is how
 * many rows come back.
 */
async function notifyAbsentMembers({
  presence,
  roomId,
  stored,
}: {
  presence: PresenceTracker;
  roomId: string;
  stored: ChatMessage;
}) {
  const room = await messageStore.getRoom(roomId);
  if (!room) return;

  const recipients = await membershipStore.pushRecipients({
    roomId,
    authorId: stored.authorId,
    // Mentions are not resolvable yet: accounts have no unique handle, so
    // `@sara` cannot be mapped to a user id. Passing nothing is the honest
    // behaviour — members on `notify: 'mentions'` are skipped rather than
    // notified for everything. Add a `username` column and resolve here.
    mentionedUserIds: [],
  });
  if (recipients.length === 0) return;

  // Someone watching this very room does not need a notification for a
  // message already on their screen.
  const offline = (
    await Promise.all(
      recipients.map(async (userId) =>
        (await presence.isOnline(roomId, userId)) ? null : userId,
      ),
    )
  ).filter((id): id is string => id !== null);
  if (offline.length === 0) return;

  const preview =
    stored.kind === 'image'
      ? 'تصویری ارسال شد'
      : stored.kind === 'voice'
        ? 'پیام صوتی ارسال شد'
        : stored.body.slice(0, 120);

  const author = stored.author?.displayName ?? 'آفرت';
  // A group room names the room and the speaker; a private consultation names
  // only the person, because the room title says nothing useful there.
  const title = room.kind === 'consult' ? author : room.title;
  const body = room.kind === 'consult' ? preview : `${author}: ${preview}`;

  await Promise.all(
    offline.map((userId) =>
      sendPush(userId, {
        title,
        body,
        url: `/chat/${roomId}`,
        // One notification per room, replaced as new messages arrive, rather
        // than a stack of twelve from one busy cohort room.
        tag: `room-${roomId}`,
      }),
    ),
  );
}

