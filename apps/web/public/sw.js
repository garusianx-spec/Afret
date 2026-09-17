/* eslint-disable no-restricted-globals */
/**
 * Afrat service worker.
 *
 * Hand-written rather than generated, because the caching rules here are
 * shaped by one specific constraint: Iranian mobile networks drop and degrade
 * constantly, so "slow" must never look like "broken". Every strategy below
 * has an explicit timeout and an explicit fallback.
 *
 * Strategy map (Workbox equivalents named for reference):
 *
 *   navigations          network-first, 3.5s timeout  → cache → /offline.html
 *   /_next/static/*      cache-first (immutable, content-hashed)
 *   /fonts/*             cache-first, 1 year
 *   /icons/*, images     stale-while-revalidate, LRU capped
 *   /audio/*             cache-first, LRU capped (lullabies must work offline)
 *   GET /api/*           network-first, 6s timeout → cache
 *   everything else      network only
 *
 * Socket.io traffic (`/realtime`) is never intercepted — long-polling frames
 * must not be buffered or replayed.
 */

const VERSION = 'v1';
const CACHE = {
  shell: `afrat-shell-${VERSION}`,
  static: `afrat-static-${VERSION}`,
  fonts: `afrat-fonts-${VERSION}`,
  images: `afrat-images-${VERSION}`,
  audio: `afrat-audio-${VERSION}`,
  api: `afrat-api-${VERSION}`,
  config: `afrat-config-${VERSION}`,
};

const OFFLINE_URL = '/offline.html';

/** Minimal, always-available shell. Hashed bundles are cached at runtime. */
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const LIMITS = {
  images: 80,
  audio: 12,
  api: 60,
};

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.shell);
      // `reload` bypasses the HTTP cache so a redeploy cannot precache a
      // stale copy of the offline page.
      await cache.addAll(
        PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })),
      );
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set(Object.values(CACHE));
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('afrat-') && !keep.has(name))
          .map((name) => caches.delete(name)),
      );

      // Speeds up first-load navigations on repeat visits.
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // The page hands us its API origin so background sync knows where to POST.
  if (data.type === 'CONFIG' && typeof data.apiUrl === 'string') {
    event.waitUntil(
      caches
        .open(CACHE.config)
        .then((cache) =>
          cache.put('/__afrat_config', new Response(JSON.stringify(data))),
        ),
    );
  }
});

/* ------------------------------------------------------------------ *
 * Fetch routing
 * ------------------------------------------------------------------ */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never touch the realtime transport or Chrome's extension URLs.
  if (url.pathname.startsWith('/realtime')) return;
  if (!url.protocol.startsWith('http')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE.static));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(request, CACHE.fonts));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/audio/')) {
    event.respondWith(cacheFirst(request, CACHE.audio, LIMITS.audio));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, CACHE.images, LIMITS.images));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE.api, 6_000, LIMITS.api));
  }
});

/**
 * Navigations: try the network briefly, fall back to whatever shell we have,
 * and only then show the offline page. The timeout matters more than the
 * order — a 30-second hang on a stalled TCP connection is worse than an
 * instant cached render.
 */
async function handleNavigation(event) {
  const cache = await caches.open(CACHE.shell);

  try {
    const preload = await event.preloadResponse;
    if (preload) {
      void cache.put(event.request, preload.clone());
      return preload;
    }

    const response = await fetchWithTimeout(event.request, 3_500);
    if (response.ok) void cache.put(event.request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(event.request)) ?? (await cache.match(OFFLINE_URL));
    return cached ?? Response.error();
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Opaque responses (no-cors) have status 0 but are still worth storing.
    if (response.ok || response.type === 'opaque') {
      void cache.put(request, response.clone()).then(() => {
        if (limit) void trimCache(cacheName, limit);
      });
    }
    return response;
  } catch (error) {
    const fallback = await cache.match(request, { ignoreSearch: true });
    if (fallback) return fallback;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        void cache.put(request, response.clone()).then(() => {
          if (limit) void trimCache(cacheName, limit);
        });
      }
      return response;
    })
    .catch(() => undefined);

  return cached ?? (await network) ?? Response.error();
}

async function networkFirst(request, cacheName, timeoutMs, limit) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetchWithTimeout(request, timeoutMs);
    if (response.ok) {
      void cache.put(request, response.clone()).then(() => {
        if (limit) void trimCache(cacheName, limit);
      });
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // A navigation Request cannot be replayed with a different signal, so clone
  // it into a plain URL request when needed.
  const input =
    request.mode === 'navigate' ? new Request(request.url, { credentials: 'include' }) : request;

  return fetch(input, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/** Crude LRU: caches keep insertion order, so the oldest entries go first. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)),
  );
}

/* ------------------------------------------------------------------ *
 * Web Push
 * ------------------------------------------------------------------ */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'آفرت';
  const options = {
    body: payload.body || 'پیام جدیدی دارید.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    dir: 'rtl',
    lang: 'fa-IR',
    tag: payload.tag || 'afrat-general',
    // Replace rather than stack: five messages from one doctor are one alert.
    renotify: Boolean(payload.tag),
    timestamp: payload.timestamp || Date.now(),
    data: { url: payload.url || '/', ...payload.data },
    actions: payload.actions || [
      { action: 'open', title: 'مشاهده' },
      { action: 'dismiss', title: 'بستن' },
    ],
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const target = new URL(event.notification.data?.url || '/', self.location.origin);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Reuse an open tab when there is one — opening a second copy of a PWA
      // on Android is disorienting.
      for (const client of clientList) {
        if (new URL(client.url).origin === target.origin && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target.href);
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});

/* ------------------------------------------------------------------ *
 * Background Sync — flush the offline outbox
 *
 * Fires once connectivity returns, even if every tab has been closed. Reads
 * the same IndexedDB store the chat module writes to (`afrat-chat.outbox`).
 * ------------------------------------------------------------------ */

self.addEventListener('sync', (event) => {
  if (event.tag === 'afrat-outbox-sync') {
    event.waitUntil(flushOutbox());
  }
});

async function readConfig() {
  const cache = await caches.open(CACHE.config);
  const response = await cache.match('/__afrat_config');
  if (!response) return { apiUrl: self.location.origin };
  try {
    return await response.json();
  } catch {
    return { apiUrl: self.location.origin };
  }
}

function openChatDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('afrat-chat');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    // Never create or migrate from here — the page owns the schema.
    request.onupgradeneeded = () => request.transaction?.abort();
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function flushOutbox() {
  let db;
  try {
    db = await openChatDb();
  } catch {
    return; // no database yet — nothing was ever queued
  }
  if (!db.objectStoreNames.contains('outbox')) return;

  const { apiUrl } = await readConfig();
  const pending = await idbRequest(
    db.transaction('outbox', 'readonly').objectStore('outbox').getAll(),
  );

  // Preserve composition order so a three-message burst does not arrive shuffled.
  pending.sort((a, b) => (a.queuedAt ?? 0) - (b.queuedAt ?? 0));

  for (const message of pending) {
    try {
      const response = await fetch(
        `${apiUrl}/api/chat/rooms/${encodeURIComponent(message.roomId)}/messages`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // Idempotent: a retry after a timeout cannot duplicate the message.
            'Idempotency-Key': message.clientId,
          },
          body: JSON.stringify(message),
        },
      );

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        // 4xx is terminal — dropping it stops an infinite retry loop.
        await idbRequest(
          db
            .transaction('outbox', 'readwrite')
            .objectStore('outbox')
            .delete(message.clientId),
        );
      } else {
        break; // server-side problem: keep the rest queued for the next sync
      }
    } catch {
      break; // still offline
    }
  }

  const clientList = await self.clients.matchAll({ type: 'window' });
  clientList.forEach((client) => client.postMessage({ type: 'OUTBOX_FLUSHED' }));
}
