'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'afrat:install-dismissed-at';
const DISMISS_TTL_MS = 14 * 86_400_000; // re-ask after two weeks

/**
 * Custom A2HS prompt. Hidden inside a TWA (the app is already installed) —
 * `display-mode: standalone` covers both the TWA and an installed PWA.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // The TWA sets `android-app://` as the referrer on first navigation.
    if (document.referrer.startsWith('android-app://')) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
  };

  return (
    <div className="mb-3 flex items-center gap-3 rounded-card border border-primary/25 bg-primary/8 p-3">
      <Download className="size-5 shrink-0 text-primary-deep" aria-hidden="true" />
      <p className="flex-1 text-xs leading-6 text-ink">
        آفرت را روی صفحهٔ اصلی گوشی نصب کنید تا آفلاین هم در دسترس باشد.
      </p>
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="afrat-tap rounded-pill bg-primary-deep px-3.5 py-2 text-xs font-bold text-white"
      >
        نصب
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="بستن پیشنهاد نصب"
        className="afrat-tap text-ink-faint"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
