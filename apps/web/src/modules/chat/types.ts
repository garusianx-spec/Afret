/** Kinds of room the hub exposes. Drives iconography and moderation rules. */
export type RoomKind =
  | 'cohort' // هم‌گروهی‌های تاریخ زایمان
  | 'topic' // اتاق موضوعی عمومی
  | 'highrisk' // بارداری پرخطر
  | 'ttc' // در تلاش برای بارداری
  | 'consult'; // مشاوره خصوصی با پزشک

export interface ChatRoom {
  id: string;
  kind: RoomKind;
  title: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  /** Only set for 1:1 consultation rooms. */
  counterpart?: ChatUser;
  lastMessage?: Pick<ChatMessage, 'id' | 'body' | 'createdAt' | 'authorId' | 'kind'>;
  unreadCount: number;
  /** Consultation rooms are read-only outside the clinician's hours. */
  locked?: boolean;
}

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  /** e.g. «متخصص زنان و زایمان» — shown as a badge next to the name. */
  role?: 'mother' | 'doctor' | 'midwife' | 'nutritionist' | 'moderator';
  roleLabel?: string;
}

export type MessageKind = 'text' | 'image' | 'voice' | 'file' | 'system';

/**
 * Delivery state of an outgoing message.
 *
 * `queued`  — composed offline, sitting in IndexedDB, not yet attempted.
 * `sending` — handed to the socket, waiting for the server ack.
 * `sent`    — server acked and assigned a canonical id + sequence.
 * `delivered` — at least one other member's client acked receipt.
 * `read`    — counterpart reported a read receipt («تیک دیده‌شده»).
 * `failed`  — retries exhausted; the user can retry or discard.
 */
export type DeliveryState =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface Attachment {
  id: string;
  kind: 'image' | 'voice' | 'file';
  url: string;
  /** Blob URL while the upload is still in flight. */
  localPreviewUrl?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  /** Seconds, for voice notes. */
  durationSec?: number;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  /** Client-generated id; survives the optimistic → acked transition. */
  clientId: string;
  roomId: string;
  authorId: string;
  author?: ChatUser;
  kind: MessageKind;
  body: string;
  attachments?: Attachment[];
  /** Server-assigned monotonic sequence within the room. */
  seq?: number;
  createdAt: string; // ISO
  editedAt?: string;
  replyTo?: Pick<ChatMessage, 'id' | 'body' | 'authorId' | 'kind'>;
  reactions?: Record<string, string[]>; // emoji -> userIds
  delivery: DeliveryState;
  /** Populated when `delivery === 'failed'`. */
  error?: string;
}

/** Cursor-paginated history page returned by the REST API. */
export interface MessagePage {
  messages: ChatMessage[];
  /** Opaque cursor for the next (older) page; null when history is exhausted. */
  nextCursor: string | null;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'polling' // degraded: HTTP long-polling fallback is active
  | 'offline'
  | 'error';

export interface TypingUser {
  userId: string;
  displayName: string;
  /** Epoch ms after which the indicator self-expires. */
  expiresAt: number;
}

export interface PresenceEntry {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
}

export interface ReadReceipt {
  roomId: string;
  userId: string;
  /** Everything with `seq <= lastReadSeq` has been read by this user. */
  lastReadSeq: number;
  at: string;
}

/* ------------------------------------------------------------------ *
 * Wire protocol
 * ------------------------------------------------------------------ */

/** Events the server pushes to the client. */
export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:ack': (payload: {
    clientId: string;
    id: string;
    seq: number;
    createdAt: string;
  }) => void;
  'message:updated': (message: ChatMessage) => void;
  'message:deleted': (payload: { roomId: string; id: string }) => void;
  'reaction:updated': (payload: {
    roomId: string;
    messageId: string;
    reactions: Record<string, string[]>;
  }) => void;
  'typing:update': (payload: {
    roomId: string;
    userId: string;
    displayName: string;
    typing: boolean;
  }) => void;
  'presence:update': (payload: { roomId: string; entries: PresenceEntry[] }) => void;
  'receipt:update': (payload: ReadReceipt) => void;
  /** Sent after a resume so the client can backfill what it missed. */
  'room:sync': (payload: { roomId: string; latestSeq: number }) => void;
  'room:error': (payload: { roomId: string; code: string; message: string }) => void;
}

/** Events the client emits. All ack-based emits use the Socket.io ack arg. */
export interface ClientToServerEvents {
  'room:join': (
    payload: { roomId: string; sinceSeq?: number },
    ack: (res: { ok: boolean; latestSeq?: number; error?: string }) => void,
  ) => void;
  'room:leave': (payload: { roomId: string }) => void;
  'message:send': (
    payload: OutgoingMessage,
    ack: (res: MessageAck) => void,
  ) => void;
  'typing:set': (payload: { roomId: string; typing: boolean }) => void;
  'receipt:read': (payload: { roomId: string; lastReadSeq: number }) => void;
  'reaction:toggle': (payload: {
    roomId: string;
    messageId: string;
    emoji: string;
  }) => void;
}

export interface OutgoingMessage {
  clientId: string;
  roomId: string;
  kind: MessageKind;
  body: string;
  attachments?: Attachment[];
  replyToId?: string;
}

export type MessageAck =
  | { ok: true; id: string; seq: number; createdAt: string }
  | { ok: false; error: string; retryable: boolean };
