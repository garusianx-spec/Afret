import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../auth/middleware.js';
import { removeSubscription, saveSubscription } from '../push/webPush.js';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function pushRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/api/push/subscribe', async (request, reply) => {
    const user = request.authUser!;

    const parsed = subscriptionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'اشتراک اعلان معتبر نیست.' });
    }

    saveSubscription(user.id, {
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys,
    });
    return reply.code(201).send({ ok: true });
  });

  app.post<{ Body: { endpoint?: string } }>(
    '/api/push/unsubscribe',
    async (request, reply) => {
      const user = request.authUser!;

      const endpoint = request.body?.endpoint;
      if (endpoint) removeSubscription(user.id, endpoint);
      return reply.code(204).send();
    },
  );
}
