import type { Redis } from 'ioredis';

import type { PresenceEntry } from '../types.js';

/**
 * Presence tracking.
 *
 * Backed by Redis sets when available so presence is correct across
 * instances; falls back to process-local sets for single-node development.
 *
 * Membership is per (room, user) and reference-counted by socket, because one
 * mother often has the PWA open on her phone and the site open on a laptop —
 * closing one tab must not mark her offline.
 */
export class PresenceTracker {
  private local = new Map<string, Map<string, number>>();

  constructor(private readonly redis: Redis | null) {}

  private key(roomId: string) {
    return `afrat:presence:${roomId}`;
  }

  async join(roomId: string, userId: string): Promise<void> {
    const room = this.local.get(roomId) ?? new Map<string, number>();
    room.set(userId, (room.get(userId) ?? 0) + 1);
    this.local.set(roomId, room);

    if (this.redis) {
      await this.redis.hincrby(this.key(roomId), userId, 1);
      // Expire stale rooms so a crashed instance cannot pin presence forever.
      await this.redis.expire(this.key(roomId), 86_400);
    }
  }

  async leave(roomId: string, userId: string): Promise<void> {
    const room = this.local.get(roomId);
    if (room) {
      const next = (room.get(userId) ?? 1) - 1;
      if (next <= 0) room.delete(userId);
      else room.set(userId, next);
    }

    if (this.redis) {
      const remaining = await this.redis.hincrby(this.key(roomId), userId, -1);
      if (remaining <= 0) await this.redis.hdel(this.key(roomId), userId);
    }
  }

  async list(roomId: string): Promise<PresenceEntry[]> {
    if (this.redis) {
      const raw = await this.redis.hgetall(this.key(roomId));
      return Object.entries(raw)
        .filter(([, count]) => Number(count) > 0)
        .map(([userId]) => ({ userId, online: true }));
    }

    const room = this.local.get(roomId);
    if (!room) return [];
    return [...room.keys()].map((userId) => ({ userId, online: true }));
  }

  async isOnline(roomId: string, userId: string): Promise<boolean> {
    if (this.redis) {
      const count = await this.redis.hget(this.key(roomId), userId);
      return Number(count ?? 0) > 0;
    }
    return (this.local.get(roomId)?.get(userId) ?? 0) > 0;
  }

  /** Called on instance shutdown so presence does not leak across restarts. */
  async clearLocal(): Promise<void> {
    if (!this.redis) {
      this.local.clear();
      return;
    }
    await Promise.all(
      [...this.local.entries()].flatMap(([roomId, users]) =>
        [...users.entries()].map(([userId, count]) =>
          this.redis!.hincrby(this.key(roomId), userId, -count),
        ),
      ),
    );
    this.local.clear();
  }
}
