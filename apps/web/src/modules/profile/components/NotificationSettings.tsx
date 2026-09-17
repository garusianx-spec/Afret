'use client';

import { Bell, BellOff } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { usePushSubscription } from '@/components/pwa/usePushSubscription';

const COPY: Record<string, string> = {
  unsupported: 'مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند.',
  denied: 'اعلان‌ها مسدود شده‌اند. از تنظیمات مرورگر یا اندروید دوباره فعال کنید.',
  granted: 'اعلان‌ها مجازند اما هنوز فعال نشده‌اند.',
  default: 'با فعال کردن اعلان، پاسخ پزشک و یادآوری واکسن را فوری دریافت می‌کنید.',
  subscribed: 'اعلان‌ها فعال است.',
};

export function NotificationSettings() {
  const { state, busy, subscribe, unsubscribe } = usePushSubscription();
  const active = state === 'subscribed';

  return (
    <Card>
      <CardTitle>اعلان‌ها</CardTitle>

      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            active ? 'bg-mint-soft text-mint' : 'bg-surface text-ink-muted'
          }`}
        >
          {active ? (
            <Bell className="size-5" aria-hidden="true" />
          ) : (
            <BellOff className="size-5" aria-hidden="true" />
          )}
        </span>

        <p className="flex-1 text-xs leading-6 text-ink-muted">{COPY[state]}</p>

        {state !== 'unsupported' && state !== 'denied' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void (active ? unsubscribe() : subscribe())}
            className="afrat-tap shrink-0 rounded-pill bg-primary-deep px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {active ? 'غیرفعال کردن' : 'فعال کردن'}
          </button>
        ) : null}
      </div>
    </Card>
  );
}
