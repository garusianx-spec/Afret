import { randomUUID } from 'node:crypto';

import type {
  ChatMessage,
  ChatRoom,
  ChatUser,
  OutgoingMessage,
  ReadReceipt,
} from '../types.js';
import { membershipStore } from './membershipStore.js';

/**
 * Reference message store.
 *
 * This implementation is in-memory so the service runs with zero
 * infrastructure. The interface is the seam: swap `InMemoryMessageStore` for a
 * Postgres-backed one and nothing above this file changes.
 *
 * The schema it implies:
 *
 *   rooms(id, kind, title, description, locked)
 *   room_members(room_id, user_id, last_read_seq)
 *   messages(id, room_id, seq BIGSERIAL, client_id, author_id, kind, body,
 *            attachments JSONB, reply_to_id, reactions JSONB, created_at)
 *   UNIQUE (room_id, client_id)   ← the idempotency guarantee
 *   INDEX  (room_id, seq DESC)    ← cursor pagination
 *
 * `seq` is per-room and monotonic. It is what makes "give me everything after
 * X" cheap after a reconnect, and what read receipts point at.
 */
export interface MessageStore {
  listRooms(userId: string): Promise<ChatRoom[]>;
  /**
   * `viewerId`, when given, resolves a per-participant consult room's title
   * and counterpart from that viewer's side — see `createConsultRoom`.
   */
  getRoom(roomId: string, viewerId?: string): Promise<ChatRoom | undefined>;

  /** Newest-first page, walking backwards from `cursor`. */
  getMessages(params: {
    roomId: string;
    cursor?: string | null;
    limit: number;
  }): Promise<{ messages: ChatMessage[]; nextCursor: string | null }>;

  /** Everything strictly newer than `sinceSeq`, oldest-first. */
  getSince(roomId: string, sinceSeq: number): Promise<ChatMessage[]>;

  /** Idempotent on `(roomId, clientId)`. */
  append(message: OutgoingMessage, author: ChatUser): Promise<ChatMessage>;

  latestSeq(roomId: string): Promise<number>;

  toggleReaction(params: {
    roomId: string;
    messageId: string;
    userId: string;
    emoji: string;
  }): Promise<Record<string, string[]> | undefined>;

  setReadCursor(receipt: Omit<ReadReceipt, 'at'>): Promise<ReadReceipt>;

  search(params: { q: string; roomId?: string }): Promise<ChatMessage[]>;

  /**
   * Provisions (or returns the existing) private consultation room between
   * one patient and one doctor. Idempotent: calling it twice for the same
   * pair returns the same room rather than creating a duplicate.
   */
  createConsultRoom(patient: ChatUser, doctor: ChatUser): Promise<ChatRoom>;

  /** Every patient who shares a provisioned consult room with this doctor. */
  listPatientsForDoctor(
    doctorId: string,
  ): Promise<{ room: ChatRoom; patient: ChatUser }[]>;
}

/** Cursors are opaque to the client; base64 keeps them from looking editable. */
function encodeCursor(seq: number): string {
  return Buffer.from(`seq:${seq}`).toString('base64url');
}

function decodeCursor(cursor: string): number | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const match = /^seq:(\d+)$/.exec(raw);
    return match?.[1] ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

const SEED_ROOMS: ChatRoom[] = [
  {
    id: 'consult_dr_ahmadi',
    kind: 'consult',
    title: 'دکتر سارا احمدی',
    description: 'مشاورهٔ خصوصی',
    counterpart: {
      id: 'u_dr_ahmadi',
      displayName: 'دکتر سارا احمدی',
      role: 'doctor',
      roleLabel: 'متخصص زنان و زایمان',
    },
    memberCount: 2,
    unreadCount: 0,
  },
  {
    id: 'cohort_1404_azar',
    kind: 'cohort',
    title: 'مادران آذر ۱۴۰۴',
    description: 'هم‌گروهی‌های تاریخ زایمان',
    memberCount: 1840,
    unreadCount: 0,
  },
  {
    id: 'topic_nutrition',
    kind: 'topic',
    title: 'تغذیه در بارداری',
    description: 'تبادل تجربه و دستور غذایی',
    memberCount: 5210,
    unreadCount: 0,
  },
  {
    id: 'highrisk',
    kind: 'highrisk',
    title: 'بارداری پرخطر',
    description: 'پشتیبانی تخصصی و همدلی',
    memberCount: 730,
    unreadCount: 0,
  },
  {
    id: 'ttc',
    kind: 'ttc',
    title: 'در تلاش برای بارداری',
    description: 'ردیابی تخمک‌گذاری و تجربه‌ها',
    memberCount: 2410,
    unreadCount: 0,
  },
];

export class InMemoryMessageStore implements MessageStore {
  private rooms = new Map<string, ChatRoom>();
  private messages = new Map<string, ChatMessage[]>();
  private seqCounters = new Map<string, number>();
  /** `${roomId}:${clientId}` → messageId, for idempotent appends. */
  private clientIdIndex = new Map<string, string>();
  private receipts = new Map<string, ReadReceipt>();
  /** roomId → the two sides of a provisioned 1:1 consult room. */
  private consultParticipants = new Map<
    string,
    { patient: ChatUser; doctor: ChatUser }
  >();

  constructor() {
    SEED_ROOMS.forEach((room) => {
      this.rooms.set(room.id, { ...room });
      this.messages.set(room.id, []);
      this.seqCounters.set(room.id, 0);
    });
    this.seedWelcomeMessages();
  }

  private seedWelcomeMessages() {
    const system: ChatUser = { id: 'system', displayName: 'آفرت' };
    const doctor: ChatUser = {
      id: 'u_dr_ahmadi',
      displayName: 'دکتر سارا احمدی',
      role: 'doctor',
      roleLabel: 'متخصص زنان و زایمان',
    };

    void this.append(
      {
        clientId: 'seed_1',
        roomId: 'consult_dr_ahmadi',
        kind: 'system',
        body: 'این گفتگو خصوصی و رمزگذاری‌شده است. پاسخ معمولاً طی چند ساعت ارسال می‌شود.',
      },
      system,
    );
    void this.append(
      {
        clientId: 'seed_2',
        roomId: 'consult_dr_ahmadi',
        kind: 'text',
        body: 'سلام. نتیجهٔ آزمایش قند خون را دیدم؛ مقادیر در محدودهٔ مناسبی است. لطفاً هفتهٔ آینده هم ناشتا اندازه بگیرید.',
      },
      doctor,
    );
  }

  /**
   * A provisioned consult room has no single fixed "other side" — it depends
   * who's asking. The patient sees the doctor as the counterpart; the doctor
   * sees the patient. Every other room kind keeps its stored, fixed fields.
   */
  private resolveForViewer(room: ChatRoom, viewerId?: string): ChatRoom {
    if (!viewerId) return room;
    const pair = this.consultParticipants.get(room.id);
    if (!pair) return room;

    const isPatient = viewerId === pair.patient.id;
    const counterpart = isPatient ? pair.doctor : pair.patient;
    return { ...room, title: counterpart.displayName, counterpart };
  }

  /**
   * Fills in `lastMessage` and `unreadCount` for one room, from one viewer's
   * side. Shared by `listRooms` and `listPatientsForDoctor` — a room's
   * stored record never carries these itself, since they are meaningless
   * without knowing who's asking and what she has already read.
   */
  private withActivity(room: ChatRoom, viewerId: string): ChatRoom {
    const messages = this.messages.get(room.id) ?? [];
    const last = messages[messages.length - 1];
    const readSeq = this.receipts.get(`${room.id}:${viewerId}`)?.lastReadSeq ?? 0;

    return this.resolveForViewer(
      {
        ...room,
        lastMessage: last
          ? {
              id: last.id,
              body: last.body,
              createdAt: last.createdAt,
              authorId: last.authorId,
              kind: last.kind,
            }
          : undefined,
        unreadCount: messages.filter((m) => m.seq > readSeq && m.authorId !== viewerId)
          .length,
      },
      viewerId,
    );
  }

  async listRooms(userId: string): Promise<ChatRoom[]> {
    // Membership-scoped: without this, `listRooms` handed back every room
    // in the store to every caller — including other patients' private
    // consult rooms, which is exactly the leak a provisioned 1:1 room must
    // not have. Default (cohort/topic/…) rooms are safe here too, since
    // every account is auto-enrolled in them at registration.
    const memberships = await membershipStore.listRoomsForUser(userId);
    const memberRoomIds = new Set(memberships.map((m) => m.roomId));

    return [...this.rooms.values()]
      .filter((room) => memberRoomIds.has(room.id))
      .map((room) => this.withActivity(room, userId));
  }

  async getRoom(roomId: string, viewerId?: string): Promise<ChatRoom | undefined> {
    const room = this.rooms.get(roomId);
    return room ? this.resolveForViewer(room, viewerId) : undefined;
  }

  async createConsultRoom(patient: ChatUser, doctor: ChatUser): Promise<ChatRoom> {
    const roomId = `consult_${patient.id}_${doctor.id}`;
    const existing = this.rooms.get(roomId);
    if (existing) return this.resolveForViewer(existing, patient.id);

    const room: ChatRoom = {
      id: roomId,
      kind: 'consult',
      title: doctor.displayName, // stored default = the patient's-side view
      description: 'مشاورهٔ خصوصی',
      counterpart: doctor,
      memberCount: 2,
      unreadCount: 0,
    };

    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    this.seqCounters.set(roomId, 0);
    this.consultParticipants.set(roomId, { patient, doctor });

    // Without these, `listRooms`'s membership filter would hide this room
    // from both sides the instant it was created.
    await Promise.all([
      membershipStore.join({ roomId, userId: patient.id }),
      membershipStore.join({ roomId, userId: doctor.id }),
    ]);

    await this.append(
      {
        clientId: `seed_welcome_${roomId}`,
        roomId,
        kind: 'system',
        body: 'این گفتگو خصوصی و رمزگذاری‌شده است. پاسخ معمولاً طی چند ساعت ارسال می‌شود.',
      },
      { id: 'system', displayName: 'آفرت' },
    );

    return this.resolveForViewer(room, patient.id);
  }

  async listPatientsForDoctor(
    doctorId: string,
  ): Promise<{ room: ChatRoom; patient: ChatUser }[]> {
    const out: { room: ChatRoom; patient: ChatUser }[] = [];
    for (const [roomId, pair] of this.consultParticipants) {
      if (pair.doctor.id !== doctorId) continue;
      const room = this.rooms.get(roomId);
      if (!room) continue;
      out.push({ room: this.withActivity(room, doctorId), patient: pair.patient });
    }
    return out;
  }

  async getMessages({
    roomId,
    cursor,
    limit,
  }: {
    roomId: string;
    cursor?: string | null;
    limit: number;
  }) {
    const all = this.messages.get(roomId) ?? [];
    const before = cursor ? decodeCursor(cursor) : null;

    const older = before == null ? all : all.filter((m) => m.seq < before);
    const page = older.slice(Math.max(0, older.length - limit));
    const exhausted = page.length === older.length;
    const oldest = page[0];

    return {
      messages: page,
      nextCursor: exhausted || !oldest ? null : encodeCursor(oldest.seq),
    };
  }

  async getSince(roomId: string, sinceSeq: number): Promise<ChatMessage[]> {
    return (this.messages.get(roomId) ?? []).filter((m) => m.seq > sinceSeq);
  }

  async append(message: OutgoingMessage, author: ChatUser): Promise<ChatMessage> {
    const idempotencyKey = `${message.roomId}:${message.clientId}`;
    const existingId = this.clientIdIndex.get(idempotencyKey);
    if (existingId) {
      const existing = (this.messages.get(message.roomId) ?? []).find(
        (m) => m.id === existingId,
      );
      // A retried send must return the original message, not a duplicate.
      if (existing) return existing;
    }

    if (!this.rooms.has(message.roomId)) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const seq = (this.seqCounters.get(message.roomId) ?? 0) + 1;
    this.seqCounters.set(message.roomId, seq);

    const replyTo = message.replyToId
      ? (this.messages.get(message.roomId) ?? []).find(
          (m) => m.id === message.replyToId,
        )
      : undefined;

    const stored: ChatMessage = {
      id: randomUUID(),
      clientId: message.clientId,
      roomId: message.roomId,
      authorId: author.id,
      author,
      kind: message.kind,
      body: message.body,
      attachments: message.attachments,
      seq,
      createdAt: new Date().toISOString(),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            body: replyTo.body,
            authorId: replyTo.authorId,
            kind: replyTo.kind,
          }
        : undefined,
      delivery: 'sent',
    };

    const list = this.messages.get(message.roomId) ?? [];
    list.push(stored);
    this.messages.set(message.roomId, list);
    this.clientIdIndex.set(idempotencyKey, stored.id);

    return stored;
  }

  async latestSeq(roomId: string): Promise<number> {
    return this.seqCounters.get(roomId) ?? 0;
  }

  async toggleReaction({
    roomId,
    messageId,
    userId,
    emoji,
  }: {
    roomId: string;
    messageId: string;
    userId: string;
    emoji: string;
  }) {
    const message = (this.messages.get(roomId) ?? []).find((m) => m.id === messageId);
    if (!message) return undefined;

    const reactions = { ...(message.reactions ?? {}) };
    const users = new Set(reactions[emoji] ?? []);

    if (users.has(userId)) users.delete(userId);
    else users.add(userId);

    if (users.size === 0) delete reactions[emoji];
    else reactions[emoji] = [...users];

    message.reactions = reactions;
    return reactions;
  }

  async setReadCursor(receipt: Omit<ReadReceipt, 'at'>): Promise<ReadReceipt> {
    const key = `${receipt.roomId}:${receipt.userId}`;
    const previous = this.receipts.get(key);
    // Receipts only move forward; a late-arriving lower value is ignored.
    const lastReadSeq = Math.max(previous?.lastReadSeq ?? 0, receipt.lastReadSeq);

    const stored: ReadReceipt = {
      ...receipt,
      lastReadSeq,
      at: new Date().toISOString(),
    };
    this.receipts.set(key, stored);
    return stored;
  }

  async search({ q, roomId }: { q: string; roomId?: string }): Promise<ChatMessage[]> {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];

    const pools = roomId
      ? [this.messages.get(roomId) ?? []]
      : [...this.messages.values()];

    return pools
      .flat()
      .filter((m) => m.body.toLowerCase().includes(needle))
      .slice(0, 50);
  }
}

export const messageStore: MessageStore = new InMemoryMessageStore();
