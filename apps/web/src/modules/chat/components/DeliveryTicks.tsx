import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DeliveryState } from '../types';

const LABELS: Record<DeliveryState, string> = {
  queued: 'در صف ارسال',
  sending: 'در حال ارسال',
  sent: 'ارسال شد',
  delivered: 'تحویل داده شد',
  read: 'دیده شد',
  failed: 'ارسال نشد',
};

/** WhatsApp-style status ticks. Persian labels drive the accessible name. */
export function DeliveryTicks({
  state,
  className,
}: {
  state: DeliveryState;
  className?: string;
}) {
  const shared = cn('size-3.5 shrink-0', className);

  const icon = (() => {
    switch (state) {
      case 'queued':
        return <Clock className={cn(shared, 'opacity-70')} />;
      case 'sending':
        return <Clock className={cn(shared, 'animate-pulse opacity-70')} />;
      case 'sent':
        return <Check className={shared} />;
      case 'delivered':
        return <CheckCheck className={shared} />;
      case 'read':
        return <CheckCheck className={cn(shared, 'text-mint')} />;
      case 'failed':
        return <AlertCircle className={cn(shared, 'text-coral')} />;
    }
  })();

  return (
    <span title={LABELS[state]} aria-label={LABELS[state]} role="img">
      {icon}
    </span>
  );
}
