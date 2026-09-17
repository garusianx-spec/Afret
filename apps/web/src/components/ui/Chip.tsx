import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Tone = 'primary' | 'mint' | 'coral' | 'neutral';

const TONES: Record<Tone, string> = {
  primary: 'bg-primary/12 text-primary-deep',
  mint: 'bg-mint-soft text-mint',
  coral: 'bg-coral-soft text-ink',
  neutral: 'bg-surface text-ink-muted',
};

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
