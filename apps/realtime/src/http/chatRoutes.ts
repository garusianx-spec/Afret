import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth, toChatUser } from '../auth/middleware.js';
import { membershipStore } from '../store/membershipStore.js';
import { messageStore } from '../store/messageStore.js';

const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const sinceQuery = z.object({
  seq: z.coerce.number().int().nonnegative().default(0),
});

const sendBody = z.object({
  clientId: z.string().min(1).max(128),
  roomId: z.string().min(1).max(128),
  kind: z.enum(['text', 'image', 'voice', 'file', 'system']),
  body: z.string().max(4_000),
  attachments: z.array(z.record(z.unknown())).max(6).optional(),
  replyToId: z.string().optional(),
});

/**
 * REST surface for everything that is not a live event: history, search and
 * the HTTP send fallback used when the WebSocket handshake is blocked.
 */
export async function chatRoutes(app: FastifyInstance) {
  // Every chat route needs a verified identity; `requireAuth` is applied once
  // here rather than repeated on each handler, so a new route cannot
  // accidentally ship unauthenticated.
  app.addHook('preHandler', requireAuth);

  app.get('/api/chat/rooms', async (request) => {
    const user = request.authUser!;
    return { rooms: await messageStore.listRooms(user.id) };
  });

  app.get<{ Params: { roomId: string } }>(
    '/api/chat/rooms/:roomId',
    async (request, reply) => {
      const room = await messageStore.getRoom(request.params.roomId);
      if (!room) return reply.code(404).send({ message: 'اتاق یافت نشد.' });
      return room;
    },
  );

  /** Join a room — creates the membership row that offline push reads. */
  app.post<{ Params: { roomId: string } }>(
    '/api/chat/rooms/:roomId/join',
    async (request, reply) => {
      const room = await messageStore.getRoom(request.params.roomId);
      if (!room) return reply.code(404).send({ message: 'اتاق یافت نشد.' });

      const member = await membershipStore.join({
        roomId: request.params.roomId,
        userId: request.authUser!.id,
      });
      return reply.code(201).send({ member });
    },
  );

  app.delete<{ Params: { roomId: string } }>(
    '/api/chat/rooms/:roomId/membership',
    async (request, reply) => {
      await membershipStore.leave(request.params.roomId, request.authUser!.id);
      return reply.code(204).send();
    },
  );

  /** Per-room notification preference: all | mentions | none, plus mute. */
  app.patch<{
    Params: { roomId: string };
    Body: { notify?: 'all' | 'mentions' | 'none'; mutedUntil?: string | null };
  }>('/api/chat/rooms/:roomId/notifications', async (request, reply) => {
    const schema = z.object({
      notify: z.enum(['all', 'mentions', 'none']).optional(),
      mutedUntil: z.string().datetime().nullable().optional(),
    });
    const parsed = schema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ message: 'تنظیمات اعلان معتبر نیست.' });
    }

    const { roomId } = request.params;
    const userId = request.authUser!.id;

    if (!(await membershipStore.get(roomId, userId))) {
      return reply.code(404).send({ message: 'شما عضو این اتاق نیستید.' });
    }
    if (parsed.data.notify) {
      await membershipStore.setNotify(roomId, userId, parsed.data.notify);
    }
    if (parsed.data.mutedUntil !== undefined) {
      await membershipStore.mute(roomId, userId, parsed.data.mutedUntil ?? undefined);
    }

    return reply.send({ member: await membershipStore.get(roomId, userId) });
  });

  // Cursor pagination. Offsets are unusable here: a new message arriving
  // mid-scroll would shift every subsequent page by one.
  app.get<{ Params: { roomId: string }; Querystring: Record<string, string> }>(
    '/api/chat/rooms/:roomId/messages',
    async (request, reply) => {
      const parsed = listQuery.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'پارامترهای درخواست معتبر نیست.' });
      }

      const room = await messageStore.getRoom(request.params.roomId);
      if (!room) return reply.code(404).send({ message: 'اتاق یافت نشد.' });

      return messageStore.getMessages({
        roomId: request.params.roomId,
        cursor: parsed.data.cursor ?? null,
        limit: parsed.data.limit,
      });
    },
  );

  /** Reconnect backfill: everything the client missed while it was away. */
  app.get<{ Params: { roomId: string }; Querystring: Record<string, string> }>(
    '/api/chat/rooms/:roomId/messages/since',
    async (request, reply) => {
      const parsed = sinceQuery.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'پارامتر seq معتبر نیست.' });
      }
      return {
        messages: await messageStore.getSince(request.params.roomId, parsed.data.seq),
      };
    },
  );

  /**
   * HTTP send fallback.
   *
   * `Idempotency-Key` carries the client id, and the store is unique on
   * `(roomId, clientId)` — so a retry after a timeout returns the original
   * message instead of posting a duplicate.
   */
  app.post<{ Params: { roomId: string } }>(
    '/api/chat/rooms/:roomId/messages',
    async (request, reply) => {
      const user = request.authUser!;

      const parsed = sendBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'محتوای پیام معتبر نیست.' });
      }
      if (parsed.data.roomId !== request.params.roomId) {
        return reply.code(400).send({ message: 'شناسهٔ اتاق ناسازگار است.' });
      }

      const idempotencyKey =
        (request.headers['idempotency-key'] as string | undefined) ??
        parsed.data.clientId;

      try {
        const stored = await messageStore.append(
          { ...parsed.data, clientId: idempotencyKey, attachments: undefined },
          toChatUser(user),
        );

        // Fan out to live sockets so WebSocket clients see it immediately.
        request.server.io?.to(parsed.data.roomId).emit('message:new', stored);

        return reply.code(201).send(stored);
      } catch (error) {
        if ((error as Error).message === 'ROOM_NOT_FOUND') {
          return reply.code(404).send({ message: 'اتاق یافت نشد.' });
        }
        request.log.error({ err: error }, 'failed to append message');
        return reply.code(500).send({ message: 'ارسال پیام ناموفق بود.' });
      }
    },
  );

  app.post<{ Params: { roomId: string }; Body: { lastReadSeq?: number } }>(
    '/api/chat/rooms/:roomId/read',
    async (request, reply) => {
      const user = request.authUser!;

      const lastReadSeq = Number(request.body?.lastReadSeq ?? 0);
      if (!Number.isInteger(lastReadSeq) || lastReadSeq < 0) {
        return reply.code(400).send({ message: 'مقدار نامعتبر است.' });
      }

      const receipt = await messageStore.setReadCursor({
        roomId: request.params.roomId,
        userId: user.id,
        lastReadSeq,
      });
      await membershipStore.setLastRead(request.params.roomId, user.id, lastReadSeq);
      request.server.io?.to(request.params.roomId).emit('receipt:update', receipt);

      return reply.code(204).send();
    },
  );

  app.get<{ Querystring: Record<string, string> }>(
    '/api/chat/messages/search',
    async (request, reply) => {
      const q = (request.query.q ?? '').trim();
      if (q.length < 2) {
        return reply.code(400).send({ message: 'عبارت جستجو خیلی کوتاه است.' });
      }
      return {
        messages: await messageStore.search({ q, roomId: request.query.roomId }),
      };
    },
  );

  /**
   * Presigned upload.
   *
   * This reference implementation returns a local PUT endpoint. In production
   * issue a real S3/MinIO/ArvanCloud presigned URL here so binaries never pass
   * through an app server worker.
   */
  app.post('/api/uploads/presign', async (request, reply) => {
    const schema = z.object({
      roomId: z.string().min(1),
      fileName: z.string().min(1).max(256),
      mimeType: z.string().min(1).max(128),
      sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
      kind: z.enum(['image', 'voice', 'file']),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'مشخصات فایل معتبر نیست.' });
    }

    const id = randomUUID();
    const publicUrl = `${process.env.STORAGE_PUBLIC_BASE_URL ?? ''}/${id}`;

    return {
      uploadUrl: publicUrl,
      fields: {},
      attachment: {
        id,
        kind: parsed.data.kind,
        url: publicUrl,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
        fileName: parsed.data.fileName,
      },
    };
  });
}
