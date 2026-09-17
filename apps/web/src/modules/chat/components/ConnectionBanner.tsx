import { CloudOff, Loader2, SignalLow } from 'lucide-react';

import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '../types';

interface ConnectionBannerProps {
  status: ConnectionStatus;
  pendingCount: number;
}

/**
 * A thin strip under the header. Deliberately non-blocking: on a flaky
 * cellular link the mother should still be able to read and compose.
 */
export function ConnectionBanner({ status, pendingCount }: ConnectionBannerProps) {
  const queued =
    pendingCount > 0
      ? ` · ${toFaDigits(pendingCount)} پیام در صف ارسال`
      : '';

  const variant = (() => {
    switch (status) {
      case 'offline':
        return {
          tone: 'bg-ink/90 text-white',
          icon: <CloudOff className="size-3.5" aria-hidden="true" />,
          text: `آفلاین هستید — پیام‌ها پس از اتصال ارسال می‌شوند${queued}`,
        };
      case 'reconnecting':
      case 'connecting':
        return {
          tone: 'bg-primary/15 text-primary-deep',
          icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
          text: `در حال اتصال دوباره…${queued}`,
        };
      case 'polling':
        return {
          tone: 'bg-coral-soft text-ink',
          icon: <SignalLow className="size-3.5" aria-hidden="true" />,
          text: `اتصال ضعیف است — حالت سازگار فعال شد${queued}`,
        };
      case 'error':
        return {
          tone: 'bg-coral-soft text-ink',
          icon: <CloudOff className="size-3.5" aria-hidden="true" />,
          text: `اتصال به سرور برقرار نشد${queued}`,
        };
      default:
        return null;
    }
  })();

  if (!variant) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium',
        variant.tone,
      )}
    >
      {variant.icon}
      <span>{variant.text}</span>
    </div>
  );
}
