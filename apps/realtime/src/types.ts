/**
 * Wire contract shared with the web client.
 *
 * Kept as a hand-maintained mirror of `apps/web/src/modules/chat/types.ts`.
 * If the two ever need to evolve independently, extract them into a
 * `packages/contracts` workspace rather than letting them drift.
 */

export type RoomKind = 'cohort' | 'topic' | 'highrisk' | 'ttc' | 'consult';
export type MessageKind = 'text' | 'image' | 'voice' | 'file' | 'system';

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role?: 'mother' | 'doctor' | 'midwife' | 'nutritionist' | 'moderator';
  roleLabel?: string;
}

export interface Attachment {
  id: string;
  kind: 'image' | 'voice' | 'file';
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  clientId: string;
  roomId: string;
  authorId: string;
  author?: ChatUser;
  kind: MessageKind;
  body: string;
  attachments?: Attachment[];
  seq: number;
  createdAt: string;
  editedAt?: string;
  replyTo?: Pick<ChatMessage, 'id' | 'body' | 'authorId' | 'kind'>;
  reactions?: Record<string, string[]>;
  /** The client owns delivery state; the server always reports `sent`. */
  delivery: 'sent';
}

export interface ChatRoom {
  id: string;
  kind: RoomKind;
  title: string;
  description?: string;
  memberCount: number;
  counterpart?: ChatUser;
  unreadCount: number;
  locked?: boolean;
  lastMessage?: Pick<ChatMessage, 'id' | 'body' | 'createdAt' | 'authorId' | 'kind'>;
}

export interface PresenceEntry {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
}

export interface ReadReceipt {
  roomId: string;
  userId: string;
  lastReadSeq: number;
  at: string;
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
  'room:sync': (payload: { roomId: string; latestSeq: number }) => void;
  'room:error': (payload: { roomId: string; code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (
    payload: { roomId: string; sinceSeq?: number },
    ack: (res: { ok: boolean; latestSeq?: number; error?: string }) => void,
  ) => void;
  'room:leave': (payload: { roomId: string }) => void;
  'message:send': (payload: OutgoingMessage, ack: (res: MessageAck) => void) => void;
  'typing:set': (payload: { roomId: string; typing: boolean }) => void;
  'receipt:read': (payload: { roomId: string; lastReadSeq: number }) => void;
  'reaction:toggle': (payload: {
    roomId: string;
    messageId: string;
    emoji: string;
  }) => void;
}

export interface SocketData {
  user: ChatUser;
}
