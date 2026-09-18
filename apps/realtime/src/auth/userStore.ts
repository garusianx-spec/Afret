import { randomUUID } from 'node:crypto';

import type { RefreshSession, UserRecord, UserRole } from './types.js';

/**
 * Account and session persistence.
 *
 * Same seam as `MessageStore`: an interface with an in-memory reference
 * implementation, so the service boots with no database. Intended schema:
 *
 *   users(
 *     id UUID PRIMARY KEY,
 *     mobile TEXT NOT NULL UNIQUE,          -- canonical +989XXXXXXXXX
 *     password_hash TEXT NOT NULL,
 *     full_name TEXT,
 *     role TEXT NOT NULL DEFAULT 'mother',
 *     mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
 *     failed_attempts INT NOT NULL DEFAULT 0,
 *     locked_until TIMESTAMPTZ,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 *   )
 *
 *   refresh_sessions(
 *     token_hash TEXT PRIMARY KEY,          -- SHA-256, never the raw token
 *     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     expires_at TIMESTAMPTZ NOT NULL,
 *     revoked_at TIMESTAMPTZ,
 *     replaced_by TEXT,
 *     user_agent TEXT,
 *     ip INET
 *   )
 *   CREATE INDEX ON refresh_sessions (user_id) WHERE revoked_at IS NULL;
 */
export interface UserStore {
  findByMobile(mobile: string): Promise<UserRecord | undefined>;
  findById(id: string): Promise<UserRecord | undefined>;
  create(input: {
    mobile: string;
    passwordHash: string;
    fullName?: string;
    role?: UserRole;
  }): Promise<UserRecord>;
  update(id: string, patch: Partial<UserRecord>): Promise<UserRecord | undefined>;

  createSession(session: RefreshSession): Promise<void>;
  findSession(tokenHash: string): Promise<RefreshSession | undefined>;
  revokeSession(tokenHash: string, replacedBy?: string): Promise<void>;
  /** Used on refresh-token reuse: kill every live session for the account. */
  revokeAllSessions(userId: string): Promise<number>;
  purgeExpiredSessions(now?: Date): Promise<number>;
}

/** Lockout policy: slow an online guesser without helping them enumerate. */
export const LOCKOUT = {
  maxAttempts: 5,
  windowMinutes: 15,
};

export class InMemoryUserStore implements UserStore {
  private users = new Map<string, UserRecord>();
  private byMobile = new Map<string, string>();
  private sessions = new Map<string, RefreshSession>();

  async findByMobile(mobile: string) {
    const id = this.byMobile.get(mobile);
    return id ? this.users.get(id) : undefined;
  }

  async findById(id: string) {
    return this.users.get(id);
  }

  async create(input: {
    mobile: string;
    passwordHash: string;
    fullName?: string;
    role?: UserRole;
  }): Promise<UserRecord> {
    if (this.byMobile.has(input.mobile)) throw new Error('MOBILE_TAKEN');

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      mobile: input.mobile,
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      role: input.role ?? 'mother',
      // Flips to true once an SMS OTP is verified; the OTP provider is
      // pluggable and not wired yet, so accounts start unverified.
      mobileVerified: false,
      failedAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    this.byMobile.set(user.mobile, user.id);
    return user;
  }

  async update(id: string, patch: Partial<UserRecord>) {
    const user = this.users.get(id);
    if (!user) return undefined;

    const next: UserRecord = { ...user, ...patch, updatedAt: new Date().toISOString() };
    this.users.set(id, next);
    if (patch.mobile && patch.mobile !== user.mobile) {
      this.byMobile.delete(user.mobile);
      this.byMobile.set(patch.mobile, id);
    }
    return next;
  }

  async createSession(session: RefreshSession) {
    this.sessions.set(session.tokenHash, session);
  }

  async findSession(tokenHash: string) {
    return this.sessions.get(tokenHash);
  }

  async revokeSession(tokenHash: string, replacedBy?: string) {
    const session = this.sessions.get(tokenHash);
    if (!session) return;
    this.sessions.set(tokenHash, {
      ...session,
      revokedAt: new Date().toISOString(),
      replacedBy,
    });
  }

  async revokeAllSessions(userId: string) {
    let count = 0;
    const now = new Date().toISOString();
    for (const [hash, session] of this.sessions) {
      if (session.userId === userId && !session.revokedAt) {
        this.sessions.set(hash, { ...session, revokedAt: now });
        count += 1;
      }
    }
    return count;
  }

  async purgeExpiredSessions(now = new Date()) {
    let count = 0;
    for (const [hash, session] of this.sessions) {
      if (Date.parse(session.expiresAt) < now.getTime()) {
        this.sessions.delete(hash);
        count += 1;
      }
    }
    return count;
  }
}

export const userStore: UserStore = new InMemoryUserStore();

/** True while the account is inside its lockout window. */
export function isLockedOut(user: UserRecord, now = new Date()): boolean {
  return Boolean(user.lockedUntil && Date.parse(user.lockedUntil) > now.getTime());
}

export function nextLockout(failedAttempts: number): string | undefined {
  if (failedAttempts < LOCKOUT.maxAttempts) return undefined;
  return new Date(Date.now() + LOCKOUT.windowMinutes * 60_000).toISOString();
}
