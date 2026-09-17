import { Redis } from 'ioredis';

import { env } from './env.js';

/**
 * Two dedicated connections are required by the Socket.io Redis adapter: a
 * subscriber connection is put into subscriber mode and can no longer issue
 * ordinary commands, so the publisher must be separate.
 *
 * Redis is optional in development — a single process works fine without it.
 * In production it is what makes horizontal scaling possible: an emit on
 * instance A has to reach the sockets held by instance B.
 */
export interface RedisPair {
  pubClient: Redis;
  subClient: Redis;
}

export async function createRedisPair(): Promise<RedisPair | null> {
  if (!env.REDIS_URL) return null;

  const pubClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    // Keep retrying: a Redis blip must not take the chat down permanently.
    retryStrategy: (times) => Math.min(times * 200, 5_000),
  });
  const subClient = pubClient.duplicate();

  await Promise.all([
    pubClient.ping(),
    new Promise<void>((resolve, reject) => {
      subClient.once('ready', resolve);
      subClient.once('error', reject);
    }),
  ]);

  return { pubClient, subClient };
}
