'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createId } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';

import {
  ApiError,
  fetchMessages,
  fetchSince,
  markRead,
  sendMessageHttp,
} from '../api/chatApi';
import * as outbox from '../lib/outbox';
import {
  acquireSocket,
  currentTransport,
  installHeartbeatWatchdog,
  releaseSocket,
  type AfratSocket,
} from '../lib/socketClient';
import { selectRoom, useChatStore } from '../store/chatStore';
import type {
  Attachment,
  ChatMessage,
  ConnectionStatus,
  MessageKind,
  OutgoingMessage,
  PresenceEntry,
  ReadReceipt,
} from '../types';

interface UseChatSocketOptions {
  roomId: string;
  /** Skip connecting — e.g. the route is rendered but the room is not chosen. */
  enabled?: boolean;
  /** Messages per history page. */
  pageSize?: number;
}

export interface SendOptions {
  kind?: MessageKind;
  attachments?: Attachment[];
  replyToId?: string;
}

export interface UseChatSocketResult {
  status: ConnectionStatus;
  /** `websocket` | `polling` | null — surfaced so the UI can warn on degrade. */
  transport: string | null;
  messages: ChatMessage[];
  typingUsers: { userId: string; displayName: string }[];
  onlineUserIds: string[];
  isLoadingHistory: boolean;
  hasMoreHistory: boolean;
  /** Number of messages still waiting in the offline outbox. */
  pendingCount: number;

  sendMessage: (body: string, options?: SendOptions) => Promise<void>;
  retryMessage: (clientId: string) => Promise<void>;
  loadOlder: () => Promise<void>;
  setTyping: (typing: boolean) => void;
  markReadUpTo: (seq: number) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
}

/** Throttle for `typing:set` — one emit per window, not one per keystroke. */
const TYPING_EMIT_INTERVAL_MS = 2_500;
/** How long a lull counts as "stopped typing". */
const TYPING_STOP_DEBOUNCE_MS = 3_000;
/** HTTP send retry ladder (ms) before a message is parked as `failed`. */
const HTTP_RETRY_BACKOFF_MS = [0, 2_000, 6_000];

/**
 * Owns the realtime lifecycle of one chatroom.
 *
 * Responsibilities:
 *  - acquire the shared socket, join/leave the room, tear listeners down;
 *  - translate socket events into `chatStore` mutations;
 *  - optimistic send with an IndexedDB outbox and an HTTP fallback path;
 *  - cursor-paginated history over REST, plus a `since`-backfill on reconnect;
 *  - typing / presence / read receipts.
 */
export function useChatSocket({
  roomId,
  enabled = true,
  pageSize = 30,
}: UseChatSocketOptions): UseChatSocketResult {
  const token = useUserStore((s) => s.token);
  const meId = useUserStore((s) => s.profile?.id ?? 'anonymous');
  const myName = useUserStore((s) => s.profile?.displayName ?? 'شما');

  const status = useChatStore((s) => s.status);
  const room = useChatStore(useMemo(() => selectRoom(roomId), [roomId]));

  const socketRef = useRef<AfratSocket | null>(null);
  const [transport, setTransport] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Latest sequence we have, read inside callbacks without re-subscribing.
  const latestSeqRef = useRef(0);
  latestSeqRef.current = room.latestSeq;

  const lastTypingEmitRef = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);

  const store = useChatStore;

  /* ---------------------------------------------------------------- *
   * History (REST, cursor-based)
   * ---------------------------------------------------------------- */

  const loadPage = useCallback(
    async (cursor: string | null, signal?: AbortSignal) => {
      setIsLoadingHistory(true);
      try {
        const page = await fetchMessages({ roomId, cursor, limit: pageSize, signal });
        store.getState().prependHistory(roomId, page.messages, page.nextCursor);
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        // A history fetch failing is not the same as the socket being down.
        // Overwriting the status here would make a healthy connection report
        // «اتصال برقرار نشد» just because one REST call was rejected, so only
        // genuine loss of connectivity is surfaced.
        if (!navigator.onLine) store.getState().setStatus('offline');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [roomId, pageSize, store],
  );

  const loadOlder = useCallback(async () => {
    const current = store.getState().rooms[roomId];
    if (!current || isLoadingHistory) return;
    // `null` cursor after a first load means we reached the beginning.
    if (current.hasLoadedOnce && current.nextCursor === null) return;
    await loadPage(current.nextCursor);
  }, [roomId, isLoadingHistory, loadPage, store]);

  /* ---------------------------------------------------------------- *
   * Outbox flushing
   * ---------------------------------------------------------------- */

  const refreshPendingCount = useCallback(async () => {
    setPendingCount((await outbox.pending(roomId)).length);
  }, [roomId]);

  /** Push one queued message, preferring the socket and falling back to HTTP. */
  const deliver = useCallback(
    async (payload: OutgoingMessage): Promise<boolean> => {
      const socket = socketRef.current;
      store.getState().setDelivery(payload.roomId, payload.clientId, 'sending');

      if (socket?.connected) {
        const acked = await new Promise<boolean>((resolve) => {
          // Socket.io's own ack timeout; if the server never answers we fall
          // through to HTTP rather than leaving the bubble spinning forever.
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              resolve(false);
            }
          }, 10_000);

          socket.emit('message:send', payload, (res) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);

            if (res.ok) {
              store.getState().ackMessage(payload.roomId, payload.clientId, {
                id: res.id,
                seq: res.seq,
                createdAt: res.createdAt,
              });
              resolve(true);
            } else if (res.retryable) {
              resolve(false);
            } else {
              store
                .getState()
                .setDelivery(payload.roomId, payload.clientId, 'failed', res.error);
              settled = true;
              resolve(true); // terminal: stop retrying, drop from the outbox
            }
          });
        });

        if (acked) return true;
      }

      // Socket unavailable or unacked → HTTP. `Idempotency-Key: clientId`
      // means a retry after a timeout cannot produce a duplicate message.
      if (!navigator.onLine) return false;

      for (let attempt = 0; attempt < HTTP_RETRY_BACKOFF_MS.length; attempt += 1) {
        if (HTTP_RETRY_BACKOFF_MS[attempt] > 0) {
          await new Promise((r) => setTimeout(r, HTTP_RETRY_BACKOFF_MS[attempt]));
        }
        try {
          const saved = await sendMessageHttp(payload);
          store.getState().upsertMessage(payload.roomId, {
            ...saved,
            clientId: payload.clientId,
            delivery: 'sent',
          });
          return true;
        } catch (error) {
          const retryable = error instanceof ApiError ? error.retryable : true;
          await outbox.markAttempt(payload.clientId, (error as Error).message);
          if (!retryable) {
            store
              .getState()
              .setDelivery(
                payload.roomId,
                payload.clientId,
                'failed',
                (error as Error).message,
              );
            return true; // terminal
          }
        }
      }

      store
        .getState()
        .setDelivery(payload.roomId, payload.clientId, 'failed', 'ارسال ناموفق بود');
      return true; // give up; the user can retry manually
    },
    [store],
  );

  const flushOutbox = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      // Order matters: the mother's three-message burst must land in order.
      for (const record of await outbox.pending(roomId)) {
        const { queuedAt: _q, attempts: _a, lastError: _e, ...payload } = record;
        const done = await deliver(payload);
        if (!done) break; // still offline — keep the rest queued
        await outbox.dequeue(record.clientId);
      }
    } finally {
      flushingRef.current = false;
      void refreshPendingCount();
    }
  }, [roomId, deliver, refreshPendingCount]);

  /* ---------------------------------------------------------------- *
   * Socket lifecycle
   * ---------------------------------------------------------------- */

  useEffect(() => {
    if (!enabled || !roomId) return;

    store.getState().ensureRoom(roomId);
    store.getState().setStatus(navigator.onLine ? 'connecting' : 'offline');

    const socket = acquireSocket({ token: token ?? undefined });
    socketRef.current = socket;

    const controller = new AbortController();

    const joinRoom = () => {
      socket.emit(
        'room:join',
        { roomId, sinceSeq: latestSeqRef.current || undefined },
        (res) => {
          if (!res.ok) {
            store.getState().setStatus('error');
            return;
          }
          // The server tells us where the room is now; if we are behind,
          // backfill over REST rather than replaying the socket log.
          if (res.latestSeq != null && res.latestSeq > latestSeqRef.current) {
            void fetchSince({
              roomId,
              sinceSeq: latestSeqRef.current,
              signal: controller.signal,
            })
              .then(({ messages }) => store.getState().upsertMany(roomId, messages))
              .catch(() => {
                /* backfill is best-effort; the next scroll will fetch it */
              });
          }
        },
      );
    };

    const onConnect = () => {
      bindEngine();
      syncTransport();
      joinRoom();
      void flushOutbox();
    };

    const onDisconnect = (reason: string) => {
      // `io server disconnect` means the server kicked us; Socket.io will not
      // auto-reconnect in that case, so ask explicitly.
      if (reason === 'io server disconnect') socket.connect();
      store.getState().setStatus(navigator.onLine ? 'reconnecting' : 'offline');
    };

    const onConnectError = () => {
      store.getState().setStatus(navigator.onLine ? 'reconnecting' : 'offline');
    };

    // `socket.io.engine` only exists once the handshake completes, so the
    // transport listeners are (re)bound from `onConnect` and torn down here.
    let detachEngine: (() => void) | null = null;

    const syncTransport = () => {
      const name = currentTransport(socket);
      setTransport(name);
      // Long-polling still works, it is just chattier and higher-latency —
      // the UI shows a subtle «اتصال ضعیف» hint instead of an error.
      if (socket.connected) {
        store.getState().setStatus(name === 'polling' ? 'polling' : 'connected');
      }
    };

    const bindEngine = () => {
      detachEngine?.();
      const engine = socket.io.engine;
      if (!engine) return;
      engine.on('upgrade', syncTransport);
      engine.on('upgradeError', syncTransport);
      detachEngine = () => {
        engine.off('upgrade', syncTransport);
        engine.off('upgradeError', syncTransport);
        detachEngine = null;
      };
    };

    /* --- domain events --- */

    const onNewMessage = (message: ChatMessage) => {
      if (message.roomId !== roomId) return;
      store.getState().upsertMessage(roomId, {
        ...message,
        delivery: message.authorId === meId ? 'sent' : 'delivered',
      });
    };

    const onAck = (payload: {
      clientId: string;
      id: string;
      seq: number;
      createdAt: string;
    }) => {
      store.getState().ackMessage(roomId, payload.clientId, payload);
      void outbox.dequeue(payload.clientId).then(refreshPendingCount);
    };

    const onUpdated = (message: ChatMessage) => {
      if (message.roomId === roomId) store.getState().upsertMessage(roomId, message);
    };

    const onDeleted = (payload: { roomId: string; id: string }) => {
      if (payload.roomId === roomId) store.getState().removeMessage(roomId, payload.id);
    };

    const onReaction = (payload: {
      roomId: string;
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      if (payload.roomId === roomId) {
        store.getState().setReactions(roomId, payload.messageId, payload.reactions);
      }
    };

    const onTyping = (payload: {
      roomId: string;
      userId: string;
      displayName: string;
      typing: boolean;
    }) => {
      if (payload.roomId !== roomId || payload.userId === meId) return;
      store
        .getState()
        .setTyping(
          roomId,
          { userId: payload.userId, displayName: payload.displayName },
          payload.typing,
        );
    };

    const onPresence = (payload: { roomId: string; entries: PresenceEntry[] }) => {
      if (payload.roomId === roomId) store.getState().setPresence(roomId, payload.entries);
    };

    const onReceipt = (payload: ReadReceipt) => {
      if (payload.roomId === roomId) store.getState().applyReceipt(payload);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onConnectError);

    socket.on('message:new', onNewMessage);
    socket.on('message:ack', onAck);
    socket.on('message:updated', onUpdated);
    socket.on('message:deleted', onDeleted);
    socket.on('reaction:updated', onReaction);
    socket.on('typing:update', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('receipt:update', onReceipt);

    const removeWatchdog = installHeartbeatWatchdog(socket);

    if (socket.connected) onConnect();

    /* --- browser connectivity + visibility --- */

    const onOnline = () => {
      store.getState().setStatus('reconnecting');
      if (!socket.connected) socket.connect();
      void flushOutbox();
    };
    const onOffline = () => store.getState().setStatus('offline');
    const onVisibility = () => {
      // Coming back from the background on Android: the socket is often dead
      // but has not noticed yet. Nudge it and flush anything composed offline.
      if (document.visibilityState === 'visible') {
        if (!socket.connected && navigator.onLine) socket.connect();
        void flushOutbox();
      }
    };

    // The service worker flushed the outbox while we were backgrounded.
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OUTBOX_FLUSHED') void refreshPendingCount();
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);

    // Expire stale typing indicators even if the peer's "stopped" never lands.
    const typingPruner = setInterval(() => store.getState().pruneTyping(), 2_000);

    // First page of history + anything left over from a previous session.
    void loadPage(null, controller.signal);
    void flushOutbox();
    void refreshPendingCount();

    return () => {
      controller.abort();
      clearInterval(typingPruner);
      removeWatchdog();

      socket.emit('room:leave', { roomId });
      detachEngine?.();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onConnectError);

      socket.off('message:new', onNewMessage);
      socket.off('message:ack', onAck);
      socket.off('message:updated', onUpdated);
      socket.off('message:deleted', onDeleted);
      socket.off('reaction:updated', onReaction);
      socket.off('typing:update', onTyping);
      socket.off('presence:update', onPresence);
      socket.off('receipt:update', onReceipt);

      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);

      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      socketRef.current = null;
      releaseSocket();
    };
    // `flushOutbox` / `loadPage` are stable per roomId; listing them keeps the
    // exhaustive-deps lint honest without re-running on every render.
  }, [enabled, roomId, token, meId, store, flushOutbox, loadPage, refreshPendingCount]);

  /* ---------------------------------------------------------------- *
   * Public actions
   * ---------------------------------------------------------------- */

  /** Throttled typing emitter shared by `sendMessage` and the composer. */
  const setTypingInternal = useCallback(
    (typing: boolean) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;

      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      if (!typing) {
        lastTypingEmitRef.current = 0;
        socket.emit('typing:set', { roomId, typing: false });
        return;
      }

      const now = Date.now();
      if (now - lastTypingEmitRef.current > TYPING_EMIT_INTERVAL_MS) {
        lastTypingEmitRef.current = now;
        socket.emit('typing:set', { roomId, typing: true });
      }

      typingStopTimerRef.current = setTimeout(() => {
        lastTypingEmitRef.current = 0;
        socketRef.current?.emit('typing:set', { roomId, typing: false });
      }, TYPING_STOP_DEBOUNCE_MS);
    },
    [roomId],
  );

  const sendMessage = useCallback(
    async (body: string, options: SendOptions = {}) => {
      const trimmed = body.trim();
      const attachments = options.attachments ?? [];
      if (!trimmed && attachments.length === 0) return;

      const clientId = createId('msg');
      const payload: OutgoingMessage = {
        clientId,
        roomId,
        kind: options.kind ?? (attachments[0]?.kind ?? 'text'),
        body: trimmed,
        attachments: attachments.length ? attachments : undefined,
        replyToId: options.replyToId,
      };

      // 1. Optimistic bubble — the mother sees her message immediately even
      //    on a dead link; `queued` renders a clock icon.
      const optimistic: ChatMessage = {
        id: '',
        clientId,
        roomId,
        authorId: meId,
        author: { id: meId, displayName: myName },
        kind: payload.kind,
        body: trimmed,
        attachments: payload.attachments,
        createdAt: new Date().toISOString(),
        delivery: 'queued',
      };
      store.getState().upsertMessage(roomId, optimistic);

      // 2. Durable queue first, network second — a tab closed mid-send must
      //    not lose the message. Background Sync is the backstop for the case
      //    where the user leaves the app before connectivity returns.
      await outbox.enqueue(payload);
      void outbox.requestBackgroundSync();
      void refreshPendingCount();

      // 3. Stop the typing indicator, then attempt delivery.
      setTypingInternal(false);
      await flushOutbox();
    },
    [roomId, meId, myName, flushOutbox, refreshPendingCount, setTypingInternal, store],
  );

  const retryMessage = useCallback(
    async (clientId: string) => {
      const record = (await outbox.pending(roomId)).find(
        (m) => m.clientId === clientId,
      );
      if (record) {
        const { queuedAt: _q, attempts: _a, lastError: _e, ...payload } = record;
        await deliver(payload);
        await outbox.dequeue(clientId);
        void refreshPendingCount();
        return;
      }

      // Not in the outbox any more (terminal failure) — rebuild from the store.
      const message = store
        .getState()
        .rooms[roomId]?.messages.find((m) => m.clientId === clientId);
      if (!message) return;

      const payload: OutgoingMessage = {
        clientId: message.clientId,
        roomId,
        kind: message.kind,
        body: message.body,
        attachments: message.attachments,
        replyToId: message.replyTo?.id,
      };
      await outbox.enqueue(payload);
      await flushOutbox();
    },
    [roomId, deliver, flushOutbox, refreshPendingCount, store],
  );

  const markReadUpTo = useCallback(
    (seq: number) => {
      if (seq <= 0) return;
      const current = store.getState().rooms[roomId]?.lastReadSeq ?? 0;
      if (seq <= current) return;

      store.getState().setLastRead(roomId, seq);
      void outbox.saveReadCursor(roomId, seq);

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('receipt:read', { roomId, lastReadSeq: seq });
      } else {
        // Receipts are not worth an outbox entry; a best-effort POST is fine.
        void markRead(roomId, seq).catch(() => undefined);
      }
    },
    [roomId, store],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      socketRef.current?.emit('reaction:toggle', { roomId, messageId, emoji });
    },
    [roomId],
  );

  const typingUsers = useMemo(
    () => room.typing.map(({ userId, displayName }) => ({ userId, displayName })),
    [room.typing],
  );

  const onlineUserIds = useMemo(
    () =>
      Object.values(room.presence)
        .filter((p) => p.online)
        .map((p) => p.userId),
    [room.presence],
  );

  return {
    status,
    transport,
    messages: room.messages,
    typingUsers,
    onlineUserIds,
    isLoadingHistory,
    hasMoreHistory: !room.hasLoadedOnce || room.nextCursor !== null,
    pendingCount,

    sendMessage,
    retryMessage,
    loadOlder,
    setTyping: setTypingInternal,
    markReadUpTo,
    toggleReaction,
  };
}
