'use client';

import Dexie, { type Table } from 'dexie';

import type { OutgoingMessage } from '../types';

/**
 * Durable outbox for messages composed while offline or mid-reconnect.
 *
 * Kept in IndexedDB (not localStorage) because voice notes and image
 * attachments can exceed the 5 MB string quota and because writes must not
 * block the main thread while the user keeps typing.
 */
export interface OutboxRecord extends OutgoingMessage {
  /** Monotonic insertion key — preserves the user's composition order. */
  queuedAt: number;
  attempts: number;
  lastError?: string;
}

class AfratChatDb extends Dexie {
  outbox!: Table<OutboxRecord, string>;
  /** Last read sequence per room, so receipts survive a cold start. */
  receipts!: Table<{ roomId: string; lastReadSeq: number }, string>;

  constructor() {
    super('afrat-chat');
    this.version(1).stores({
      outbox: 'clientId, roomId, queuedAt',
      receipts: 'roomId',
    });
  }
}

let db: AfratChatDb | null = null;

function getDb(): AfratChatDb | null {
  if (typeof indexedDB === 'undefined') return null; // SSR / private mode
  if (!db) db = new AfratChatDb();
  return db;
}

export async function enqueue(message: OutgoingMessage): Promise<void> {
  const database = getDb();
  if (!database) return;
  await database.outbox.put({ ...message, queuedAt: Date.now(), attempts: 0 });
}

export async function dequeue(clientId: string): Promise<void> {
  await getDb()?.outbox.delete(clientId);
}

export async function markAttempt(clientId: string, error?: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  const record = await database.outbox.get(clientId);
  if (!record) return;
  await database.outbox.put({
    ...record,
    attempts: record.attempts + 1,
    lastError: error,
  });
}

/** Pending messages in composition order, optionally scoped to one room. */
export async function pending(roomId?: string): Promise<OutboxRecord[]> {
  const database = getDb();
  if (!database) return [];
  const all = await database.outbox.orderBy('queuedAt').toArray();
  return roomId ? all.filter((m) => m.roomId === roomId) : all;
}

export async function saveReadCursor(roomId: string, lastReadSeq: number) {
  await getDb()?.receipts.put({ roomId, lastReadSeq });
}

export async function loadReadCursor(roomId: string): Promise<number> {
  const entry = await getDb()?.receipts.get(roomId);
  return entry?.lastReadSeq ?? 0;
}

/**
 * Ask the browser to flush the outbox once connectivity returns — even if
 * every tab is closed by then. Falls back silently where Background Sync is
 * unavailable (Safari, Firefox); `useChatSocket` still flushes on reconnect.
 */
export async function requestBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    await registration.sync?.register('afrat-outbox-sync');
  } catch {
    /* permission denied or unsupported — non-fatal */
  }
}
