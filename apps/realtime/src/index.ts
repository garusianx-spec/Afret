import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Server as SocketServer } from 'socket.io';

import { env } from './env.js';
import { authRoutes } from './http/authRoutes.js';
import { chatRoutes } from './http/chatRoutes.js';
import { doctorRoutes } from './http/doctorRoutes.js';
import { profileRoutes } from './http/profileRoutes.js';
import { pushRoutes } from './http/pushRoutes.js';
import { seedDemoAccounts } from './auth/seed.js';
import { userStore } from './auth/userStore.js';
import { ensureDefaultMemberships } from './store/membershipStore.js';
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
  // Required for the refresh cookie to travel cross-origin between the web
  // app and this service.
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
});

/**
 * Treat an empty body on a JSON request as `{}`.
 *
 * Bodyless POSTs are legitimate here — `/auth/refresh` and `/auth/logout`
 * carry their state in a cookie — and a client that still sends
 * `Content-Type: application/json` should not get a 400 for it.
 */
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_request, body, done) => {
    const raw = typeof body === 'string' ? body.trim() : '';
    if (raw.length === 0) return done(null, {});
    try {
      done(null, JSON.parse(raw));
    } catch {
      const error = new Error('بدنهٔ درخواست معتبر نیست.') as Error & {
        statusCode?: number;
      };
      error.statusCode = 400;
      done(error, undefined);
    }
  },
);

await app.register(cookie, {
  // Refresh tokens are already opaque 256-bit randoms stored hashed, so the
  // cookie itself needs no additional signing.
  parseOptions: { path: '/' },
});

/**
 * Global ceiling. Individual credential routes tighten this considerably —
 * see `credentialRateLimit` in authRoutes.
 */
await app.register(rateLimit, {
  global: false,
  max: 300,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});

app.get('/health', async () => ({
  ok: true,
  uptime: process.uptime(),
  redis: Boolean(env.REDIS_URL),
  push: Boolean(env.VAPID_PUBLIC_KEY),
  auth: true,
}));

await app.register(authRoutes);
await app.register(chatRoutes);
await app.register(profileRoutes);
await app.register(doctorRoutes);
await app.register(pushRoutes);

if (!configurePush()) {
  app.log.warn('VAPID keys missing — web push notifications are disabled.');
}

// Demo accounts, so the app can be opened without registering. Gated out of
// production unless ALLOW_DEMO_ACCOUNTS=true — see auth/seed.ts.
await seedDemoAccounts((message) => app.log.info(message));
// Default rooms (cohorts, topic forums, the legacy demo consult room) are
// mother-facing content — a clinician joining them would show her own name
// as a room title in her own inbox. Same guard as the registration route in
// authRoutes.ts, applied here too since seeded demo accounts never go
// through that HTTP path.
for (const account of await Promise.all(
  ['+989123456789', '+989123456780'].map((m) => userStore.findByMobile(m)),
)) {
  if (account && account.role === 'mother') await ensureDefaultMemberships(account.id);
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
/**
 * Expired refresh sessions are dead rows: they can never authenticate, but
 * they grow without bound. Hourly is frequent enough to keep the table small
 * and rare enough to be invisible.
 */
const sessionSweeper = setInterval(
  () => {
    void userStore
      .purgeExpiredSessions()
      .then((count) => {
        if (count > 0) app.log.info({ count }, 'purged expired refresh sessions');
      })
      .catch((error) => app.log.error({ err: error }, 'session purge failed'));
  },
  60 * 60 * 1000,
);
sessionSweeper.unref();

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down…`);
  try {
    clearInterval(sessionSweeper);
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
