import type { RoomKind } from '../types.js';

/**
 * Room membership.
 *
 * This is what group-room push needs and previously did not have: without a
 * membership table the server knows who is *connected* to a room but not who
 * *belongs* to it, so it cannot notify the people who are offline — which is
 * precisely the set that needs notifying.
 *
 * Intended schema:
 *
 *   room_members(
 *     room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 *     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *     joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     role TEXT NOT NULL DEFAULT 'member',    -- member | moderator | owner
 *     muted_until TIMESTAMPTZ,                -- per-room notification mute
 *     notify TEXT NOT NULL DEFAULT 'all',     -- all | mentions | none
 *     last_read_seq BIGINT NOT NULL DEFAULT 0,
 *     PRIMARY KEY (room_id, user_id)
 *   )
 *   CREATE INDEX ON room_members (user_id);
 *
 * `last_read_seq` lives here rather than in a separate receipts table because
 * it is one row per (room, user) either way, and keeping it alongside the
 * membership makes the unread count a single indexed lookup.
 */

export type MemberRole = 'member' | 'moderator' | 'owner';
export type NotifyPreference = 'all' | 'mentions' | 'none';

export interface RoomMember {
  roomId: string;
  userId: string;
  joinedAt: string;
  role: MemberRole;
  notify: NotifyPreference;
  /** ISO timestamp; while in the future, no push for this room. */
  mutedUntil?: string;
  lastReadSeq: number;
}

export interface MembershipStore {
  join(params: {
    roomId: string;
    userId: string;
    role?: MemberRole;
  }): Promise<RoomMember>;
  leave(roomId: string, userId: string): Promise<void>;
  get(roomId: string, userId: string): Promise<RoomMember | undefined>;
  listMembers(roomId: string): Promise<RoomMember[]>;
  listRoomsForUser(userId: string): Promise<RoomMember[]>;
  setNotify(roomId: string, userId: string, notify: NotifyPreference): Promise<void>;
  mute(roomId: string, userId: string, until: string | undefined): Promise<void>;
  setLastRead(roomId: string, userId: string, seq: number): Promise<void>;
  countMembers(roomId: string): Promise<number>;

  /**
   * Who should receive a push for this message: members who are not the
   * author, not muted, and whose notify preference matches.
   *
   * `mentionedUserIds` is empty until accounts grow a unique handle — see the
   * call site in `gateway.ts`. Until then, members set to `mentions` receive
   * nothing, which is the conservative reading of their preference.
   */
  pushRecipients(params: {
    roomId: string;
    authorId: string;
    mentionedUserIds?: string[];
  }): Promise<string[]>;
}

export class InMemoryMembershipStore implements MembershipStore {
  /** `${roomId}:${userId}` → member */
  private members = new Map<string, RoomMember>();

  private key(roomId: string, userId: string) {
    return `${roomId}:${userId}`;
  }

  async join({
    roomId,
    userId,
    role = 'member',
  }: {
    roomId: string;
    userId: string;
    role?: MemberRole;
  }): Promise<RoomMember> {
    const existing = this.members.get(this.key(roomId, userId));
    // Re-joining is idempotent: it must not reset the read cursor and make
    // a year of history look unread.
    if (existing) return existing;

    const member: RoomMember = {
      roomId,
      userId,
      joinedAt: new Date().toISOString(),
      role,
      notify: 'all',
      lastReadSeq: 0,
    };
    this.members.set(this.key(roomId, userId), member);
    return member;
  }

  async leave(roomId: string, userId: string) {
    this.members.delete(this.key(roomId, userId));
  }

  async get(roomId: string, userId: string) {
    return this.members.get(this.key(roomId, userId));
  }

  async listMembers(roomId: string) {
    return [...this.members.values()].filter((m) => m.roomId === roomId);
  }

  async listRoomsForUser(userId: string) {
    return [...this.members.values()].filter((m) => m.userId === userId);
  }

  async setNotify(roomId: string, userId: string, notify: NotifyPreference) {
    const member = this.members.get(this.key(roomId, userId));
    if (member) this.members.set(this.key(roomId, userId), { ...member, notify });
  }

  async mute(roomId: string, userId: string, until: string | undefined) {
    const member = this.members.get(this.key(roomId, userId));
    if (member) {
      this.members.set(this.key(roomId, userId), { ...member, mutedUntil: until });
    }
  }

  async setLastRead(roomId: string, userId: string, seq: number) {
    const member = this.members.get(this.key(roomId, userId));
    // Read cursors only move forward — a stale event must not rewind them.
    if (member && seq > member.lastReadSeq) {
      this.members.set(this.key(roomId, userId), { ...member, lastReadSeq: seq });
    }
  }

  async countMembers(roomId: string) {
    return (await this.listMembers(roomId)).length;
  }

  async pushRecipients({
    roomId,
    authorId,
    mentionedUserIds = [],
  }: {
    roomId: string;
    authorId: string;
    mentionedUserIds?: string[];
  }): Promise<string[]> {
    const now = Date.now();
    const mentioned = new Set(mentionedUserIds);

    return (await this.listMembers(roomId))
      .filter((member) => {
        if (member.userId === authorId) return false;
        if (member.notify === 'none') return false;
        if (member.notify === 'mentions' && !mentioned.has(member.userId)) return false;
        if (member.mutedUntil && Date.parse(member.mutedUntil) > now) return false;
        return true;
      })
      .map((member) => member.userId);
  }
}

export const membershipStore: MembershipStore = new InMemoryMembershipStore();

/**
 * Rooms every account belongs to from the moment it exists.
 *
 * Cohort rooms would normally be derived from the due date; the open topic
 * rooms are opt-in in the UI but seeded here so a new account is not staring
 * at an empty hub.
 */
export const DEFAULT_ROOMS: { id: string; kind: RoomKind }[] = [
  { id: 'consult_dr_ahmadi', kind: 'consult' },
  { id: 'cohort_1404_azar', kind: 'cohort' },
  { id: 'topic_nutrition', kind: 'topic' },
];

/**
 * Enrol a new account in the default rooms.
 *
 * Called **once, at registration** — not on login and not on socket connect.
 *
 * Not on socket connect, because membership is what offline push reads:
 * deriving it from a live socket means a mother who signs up, enables
 * notifications and closes the app has no rows at all, making her the one
 * person guaranteed not to be notified.
 *
 * Not on login either, because leaving a room is a deliberate act and
 * re-adding it on the next sign-in would silently override it. Adding a new
 * default room for existing accounts is a migration, not a login side effect.
 */
export async function ensureDefaultMemberships(userId: string): Promise<void> {
  await Promise.all(
    DEFAULT_ROOMS.map((room) =>
      membershipStore.join({ roomId: room.id, userId }),
    ),
  );
}
