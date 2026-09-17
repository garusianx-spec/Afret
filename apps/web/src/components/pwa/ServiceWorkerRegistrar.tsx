'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { config } from '@/lib/config';

/**
 * Registers `/sw.js` and surfaces an update prompt.
 *
 * Silent auto-reload is deliberately avoided: a mother mid-way through logging
 * a blood-glucose reading must not lose the form to a background update.
 */
export function ServiceWorkerRegistrar() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production' && !config.registerSwInDev) return;

    let registration: ServiceWorkerRegistration | undefined;

    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        // `controller` is null on the very first install — that is not an
        // update, it is the initial activation, so don't nag the user.
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          setWaiting(installing);
        }
      });
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg;
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', onUpdateFound);

        // Hand the worker our API origin so Background Sync knows where to
        // POST the offline outbox once connectivity returns.
        void navigator.serviceWorker.ready.then((ready) =>
          ready.active?.postMessage({ type: 'CONFIG', apiUrl: config.apiUrl }),
        );

        // Check for a new shell when the app returns to the foreground.
        const onVisible = () => {
          if (document.visibilityState === 'visible') void reg.update();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
      })
      .catch(() => {
        /* registration failures are non-fatal — the app still works online */
      });

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
      registration?.removeEventListener('updatefound', onUpdateFound);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(theme(spacing.navbar)+env(safe-area-inset-bottom,0px)+0.75rem)] z-40 mx-auto flex max-w-lg items-center gap-3 rounded-card border border-surface-border bg-surface-card p-3 shadow-raised">
      <RefreshCw className="size-5 shrink-0 text-primary-deep" aria-hidden="true" />
      <p className="flex-1 text-xs leading-6 text-ink">
        نسخهٔ جدید آفرت آماده است.
      </p>
      <button
        type="button"
        onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}
        className="afrat-tap rounded-pill bg-primary-deep px-3.5 py-2 text-xs font-bold text-white"
      >
        به‌روزرسانی
      </button>
    </div>
  );
}
