'use client';

import { create } from 'zustand';

import type {
  ChatMessage,
  ConnectionStatus,
  DeliveryState,
  PresenceEntry,
  ReadReceipt,
  TypingUser,
} from '../types';

interface RoomState {
  /** Ordered oldest → newest. Optimistic messages sit at the tail. */
  messages: ChatMessage[];
  /**
   * Cursor for the next *older* page. `null` means history is exhausted —
   * use `hasLoadedOnce` to tell "exhausted" apart from "never fetched".
   */
  nextCursor: string | null;
  hasLoadedOnce: boolean;
  latestSeq: number;
  typing: TypingUser[];
  presence: Record<string, PresenceEntry>;
  /** Other members' read cursors, keyed by userId. */
  receipts: Record<string, number>;
  /** Our own last-read sequence, mirrored to IndexedDB. */
  lastReadSeq: number;
}

interface ChatState {
  status: ConnectionStatus;
  /** `true` once a reconnect has happened at least once in this session. */
  everDropped: boolean;
  rooms: Record<string, RoomState>;

  setStatus: (status: ConnectionStatus) => void;
  ensureRoom: (roomId: string) => void;

  /** Replace or merge a page of history (prepends older messages). */
  prependHistory: (
    roomId: string,
    messages: ChatMessage[],
    nextCursor: string | null,
  ) => void;

  /** Insert/merge a single message, de-duplicating on clientId or id. */
  upsertMessage: (roomId: string, message: ChatMessage) => void;
  upsertMany: (roomId: string, messages: ChatMessage[]) => void;

  /** Promote an optimistic bubble once the server acks it. */
  ackMessage: (
    roomId: string,
    clientId: string,
    patch: { id: string; seq: number; createdAt: string },
  ) => void;

  setDelivery: (
    roomId: string,
    clientId: string,
    delivery: DeliveryState,
    error?: string,
  ) => void;

  removeMessage: (roomId: string, id: string) => void;
  setReactions: (
    roomId: string,
    messageId: string,
    reactions: Record<string, string[]>,
  ) => void;

  setTyping: (
    roomId: string,
    user: { userId: string; displayName: string },
    typing: boolean,
  ) => void;
  pruneTyping: () => void;

  setPresence: (roomId: string, entries: PresenceEntry[]) => void;
  applyReceipt: (receipt: ReadReceipt) => void;
  setLastRead: (roomId: string, seq: number) => void;
}

const emptyRoom = (): RoomState => ({
  messages: [],
  nextCursor: null,
  hasLoadedOnce: false,
  latestSeq: 0,
  typing: [],
  presence: {},
  receipts: {},
  lastReadSeq: 0,
});

/** Messages are kept sorted by `seq`; optimistic ones (no seq) stay last. */
function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    if (a.seq != null && b.seq != null) return a.seq - b.seq;
    if (a.seq == null && b.seq == null) {
      return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    }
    return a.seq == null ? 1 : -1;
  });
}

/** Highest `seq` in a list, without spreading a large array into Math.max. */
function maxSeq(messages: ChatMessage[], floor = 0): number {
  return messages.reduce((acc, m) => (m.seq != null && m.seq > acc ? m.seq : acc), floor);
}

/** Typing indicators expire on their own so a dropped socket can't freeze one. */
const TYPING_TTL_MS = 6_000;

export const useChatStore = create<ChatState>((set, get) => ({
  status: 'idle',
  everDropped: false,
  rooms: {},

  setStatus: (status) =>
    set((state) => ({
      status,
      everDropped:
        state.everDropped || status === 'reconnecting' || status === 'offline',
    })),

  ensureRoom: (roomId) =>
    set((state) =>
      state.rooms[roomId]
        ? state
        : { rooms: { ...state.rooms, [roomId]: emptyRoom() } },
    ),

  prependHistory: (roomId, messages, nextCursor) =>
    set((state) => {
      const room = state.rooms[roomId] ?? emptyRoom();
      const byKey = new Map<string, ChatMessage>();
      // Existing entries win: they may already carry a newer delivery state.
      [...messages, ...room.messages].forEach((m) => {
        byKey.set(m.id || m.clientId, { ...byKey.get(m.id || m.clientId), ...m });
      });
      const merged = sortMessages([...byKey.values()]);

      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: merged,
            nextCursor,
            hasLoadedOnce: true,
            latestSeq: maxSeq(merged, room.latestSeq),
          },
        },
      };
    }),

  upsertMessage: (roomId, message) => get().upsertMany(roomId, [message]),

  upsertMany: (roomId, incoming) =>
    set((state) => {
      const room = state.rooms[roomId] ?? emptyRoom();
      const next = [...room.messages];

      for (const message of incoming) {
        // Match the optimistic bubble first (same clientId), then the
        // canonical id — a message echoed back over a second tab arrives
        // with an id we may already hold.
        const index = next.findIndex(
          (m) =>
            (message.clientId && m.clientId === message.clientId) ||
            (message.id && m.id === message.id),
        );
        if (index >= 0) {
          next[index] = { ...next[index], ...message };
        } else {
          next.push(message);
        }
      }

      const merged = sortMessages(next);
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: merged,
            latestSeq: maxSeq(merged, room.latestSeq),
          },
        },
      };
    }),

  ackMessage: (roomId, clientId, patch) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      const messages = sortMessages(
        room.messages.map((m) =>
          m.clientId === clientId
            ? { ...m, ...patch, delivery: 'sent' as DeliveryState, error: undefined }
            : m,
        ),
      );
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages,
            latestSeq: Math.max(room.latestSeq, patch.seq),
          },
        },
      };
    }),

  setDelivery: (roomId, clientId, delivery, error) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) =>
              m.clientId === clientId ? { ...m, delivery, error } : m,
            ),
          },
        },
      };
    }),

  removeMessage: (roomId, id) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.filter((m) => m.id !== id),
          },
        },
      };
    }),

  setReactions: (roomId, messageId, reactions) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) return state;
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) =>
              m.id === messageId ? { ...m, reactions } : m,
            ),
          },
        },
      };
    }),

  setTyping: (roomId, user, typing) =>
    set((state) => {
      const room = state.rooms[roomId] ?? emptyRoom();
      const others = room.typing.filter((t) => t.userId !== user.userId);
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            typing: typing
              ? [...others, { ...user, expiresAt: Date.now() + TYPING_TTL_MS }]
              : others,
          },
        },
      };
    }),

  pruneTyping: () =>
    set((state) => {
      const now = Date.now();
      let changed = false;
      const rooms: Record<string, RoomState> = {};

      for (const [roomId, room] of Object.entries(state.rooms)) {
        const typing = room.typing.filter((t) => t.expiresAt > now);
        if (typing.length !== room.typing.length) changed = true;
        rooms[roomId] = typing.length === room.typing.length ? room : { ...room, typing };
      }
      return changed ? { rooms } : state;
    }),

  setPresence: (roomId, entries) =>
    set((state) => {
      const room = state.rooms[roomId] ?? emptyRoom();
      const presence = { ...room.presence };
      entries.forEach((entry) => {
        presence[entry.userId] = entry;
      });
      return { rooms: { ...state.rooms, [roomId]: { ...room, presence } } };
    }),

  applyReceipt: (receipt) =>
    set((state) => {
      const room = state.rooms[receipt.roomId] ?? emptyRoom();
      const previous = room.receipts[receipt.userId] ?? 0;
      if (receipt.lastReadSeq <= previous) return state;

      // Anything at or below the new cursor is now "read" for us.
      const messages = room.messages.map((m) =>
        m.seq != null && m.seq <= receipt.lastReadSeq && m.delivery !== 'read'
          ? { ...m, delivery: 'read' as DeliveryState }
          : m,
      );

      return {
        rooms: {
          ...state.rooms,
          [receipt.roomId]: {
            ...room,
            messages,
            receipts: { ...room.receipts, [receipt.userId]: receipt.lastReadSeq },
          },
        },
      };
    }),

  setLastRead: (roomId, seq) =>
    set((state) => {
      const room = state.rooms[roomId] ?? emptyRoom();
      if (seq <= room.lastReadSeq) return state;
      return {
        rooms: { ...state.rooms, [roomId]: { ...room, lastReadSeq: seq } },
      };
    }),
}));

/** Selector helper — stable empty room so components never branch on undefined. */
const EMPTY_ROOM = emptyRoom();
export function selectRoom(roomId: string) {
  return (state: ChatState): RoomState => state.rooms[roomId] ?? EMPTY_ROOM;
}
