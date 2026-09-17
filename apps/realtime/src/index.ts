import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { Server as SocketServer } from 'socket.io';

import { env } from './env.js';
import { chatRoutes } from './http/chatRoutes.js';
import { pushRoutes } from './http/pushRoutes.js';
import { configurePush } from './push/webPush.js';
import { createGateway } from './realtime/gateway.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types.js';

declare module 'fastify' {
  interface FastifyInstance {
    io?: SocketServer<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
    >;
  }
}

const app = Fastify({
  logger: env.isProduction
    ? { level: 'info' }
    : { level: 'debug', transport: { target: 'pino-pretty' } },
  // Behind a load balancer, trust X-Forwarded-* so rate limits and logs see
  // the real client IP rather than the proxy's.
  trustProxy: true,
});

await app.register(cors, {
  origin: env.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
});

app.get('/health', async () => ({
  ok: true,
  uptime: process.uptime(),
  redis: Boolean(env.REDIS_URL),
  push: Boolean(env.VAPID_PUBLIC_KEY),
}));

await app.register(chatRoutes);
await app.register(pushRoutes);

if (!configurePush()) {
  app.log.warn('VAPID keys missing — web push notifications are disabled.');
}

// Socket.io attaches to the same HTTP server, so one port serves both the REST
// API and the realtime transport (including the long-polling fallback).
// This has to happen before `listen()`: Fastify forbids decorating a ready
// instance, and the REST fallback route needs `request.server.io` to fan out.
const io = await createGateway(app.server);
app.decorate('io', io);

await app.listen({ port: env.PORT, host: env.HOST });

app.log.info(
  `Afrat realtime listening on ${env.HOST}:${env.PORT} (socket path: ${env.SOCKET_PATH})`,
);

/* ------------------------------------------------------------------ *
 * Graceful shutdown — drain sockets before the process exits so clients
 * reconnect to a healthy instance instead of hanging on a half-closed one.
 * ------------------------------------------------------------------ */
const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down…`);
  try {
    await io.close();
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'shutdown failed');
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
