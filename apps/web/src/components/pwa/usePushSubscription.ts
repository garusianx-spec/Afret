'use client';

import { useCallback, useEffect, useState } from 'react';

import { config } from '@/lib/config';

/**
 * VAPID keys travel as base64url; `applicationServerKey` wants a BufferSource.
 * The array is built on an explicit `ArrayBuffer` so it satisfies the DOM
 * typing, which rejects a possibly-`SharedArrayBuffer`-backed view.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);

  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export type PushState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied'
  | 'subscribed';

/**
 * Web Push opt-in.
 *
 * Note for the TWA build: notifications delivered here appear as ordinary
 * Android notifications, because the TWA shares the browser's push service.
 * No FCM wiring is needed on the Android side.
 */
export function usePushSubscription() {
  const [state, setState] = useState<PushState>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'subscribed' : Notification.permission));
  }, []);

  const subscribe = useCallback(async () => {
    if (!config.vapidPublicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission as PushState);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        // Chrome requires this; silent pushes are not allowed on the web.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      });

      await fetch(`${config.apiUrl}/api/push/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      setState('subscribed');
    } finally {
      setBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await fetch(`${config.apiUrl}/api/push/unsubscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => undefined);

      await subscription.unsubscribe();
      setState('default');
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, subscribe, unsubscribe };
}
