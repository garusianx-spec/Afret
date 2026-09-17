import { config } from '@/lib/config';

import type {
  Attachment,
  ChatRoom,
  ChatMessage,
  MessagePage,
  OutgoingMessage,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const retryable = res.status >= 500 || res.status === 429 || res.status === 408;
    let message = `درخواست ناموفق بود (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON error body — keep the generic Persian message */
    }
    throw new ApiError(message, res.status, retryable);
  }

  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Rooms
 * ------------------------------------------------------------------ */

export function listRooms(): Promise<{ rooms: ChatRoom[] }> {
  return request('/api/chat/rooms');
}

export function getRoom(roomId: string): Promise<ChatRoom> {
  return request(`/api/chat/rooms/${encodeURIComponent(roomId)}`);
}

/* ------------------------------------------------------------------ *
 * History — cursor-based pagination
 *
 * The cursor is an opaque, server-issued string (base64 of `seq`), not an
 * offset: offsets break the moment somebody posts while the user scrolls.
 * ------------------------------------------------------------------ */

export function fetchMessages(params: {
  roomId: string;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}): Promise<MessagePage> {
  const { roomId, cursor, limit = 30, signal } = params;
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);

  return request(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages?${query}`,
    { signal },
  );
}

/** Backfill everything newer than a sequence — used after a reconnect. */
export function fetchSince(params: {
  roomId: string;
  sinceSeq: number;
  signal?: AbortSignal;
}): Promise<{ messages: ChatMessage[] }> {
  const { roomId, sinceSeq, signal } = params;
  return request(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages/since?seq=${sinceSeq}`,
    { signal },
  );
}

export function searchMessages(params: {
  roomId?: string;
  q: string;
  signal?: AbortSignal;
}): Promise<{ messages: ChatMessage[] }> {
  const query = new URLSearchParams({ q: params.q });
  if (params.roomId) query.set('roomId', params.roomId);
  return request(`/api/chat/messages/search?${query}`, { signal: params.signal });
}

/**
 * HTTP fallback for sending. Used when the socket is down but the device is
 * online — e.g. WebSocket handshakes are blocked but plain HTTPS works.
 * Idempotent on `clientId`, so a retry after a timeout cannot duplicate.
 */
export function sendMessageHttp(message: OutgoingMessage): Promise<ChatMessage> {
  return request(
    `/api/chat/rooms/${encodeURIComponent(message.roomId)}/messages`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': message.clientId },
      body: JSON.stringify(message),
    },
  );
}

export function markRead(roomId: string, lastReadSeq: number): Promise<void> {
  return request(`/api/chat/rooms/${encodeURIComponent(roomId)}/read`, {
    method: 'POST',
    body: JSON.stringify({ lastReadSeq }),
  });
}

/* ------------------------------------------------------------------ *
 * Attachments — presigned direct-to-storage upload
 *
 * Two hops on purpose: the API never proxies binary bodies, so a 12 MB voice
 * note on a slow uplink cannot occupy an app server worker.
 * ------------------------------------------------------------------ */

interface PresignResponse {
  uploadUrl: string;
  /** Extra form fields for an S3-style POST policy; empty for a PUT URL. */
  fields?: Record<string, string>;
  attachment: Omit<Attachment, 'localPreviewUrl'>;
}

export function presignUpload(params: {
  roomId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: Attachment['kind'];
}): Promise<PresignResponse> {
  return request('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function uploadAttachment(params: {
  roomId: string;
  file: File | Blob;
  kind: Attachment['kind'];
  fileName?: string;
  durationSec?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<Attachment> {
  const fileName =
    params.fileName ?? (params.file instanceof File ? params.file.name : 'voice.webm');

  const presigned = await presignUpload({
    roomId: params.roomId,
    fileName,
    mimeType: params.file.type || 'application/octet-stream',
    sizeBytes: params.file.size,
    kind: params.kind,
  });

  await putWithProgress({
    url: presigned.uploadUrl,
    fields: presigned.fields,
    file: params.file,
    onProgress: params.onProgress,
    signal: params.signal,
  });

  return {
    ...presigned.attachment,
    durationSec: params.durationSec ?? presigned.attachment.durationSec,
  };
}

/**
 * `fetch` still has no upload-progress events, and a mother on a 3G link
 * uploading an ultrasound photo needs a progress bar — hence XHR.
 */
function putWithProgress(params: {
  url: string;
  fields?: Record<string, string>;
  file: File | Blob;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { url, fields, file, onProgress, signal } = params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const usePost = Boolean(fields && Object.keys(fields).length);

    xhr.open(usePost ? 'POST' : 'PUT', url, true);
    if (!usePost) xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError('بارگذاری فایل ناموفق بود', xhr.status, true));
    xhr.onerror = () => reject(new ApiError('خطای شبکه هنگام بارگذاری', 0, true));
    xhr.onabort = () => reject(new ApiError('بارگذاری لغو شد', 0, false));

    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    if (usePost) {
      const form = new FormData();
      Object.entries(fields!).forEach(([k, v]) => form.append(k, v));
      form.append('file', file);
      xhr.send(form);
    } else {
      xhr.send(file);
    }
  });
}
