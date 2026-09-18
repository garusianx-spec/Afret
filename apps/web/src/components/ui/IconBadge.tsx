import type { ComponentType, SVGProps } from 'react';

import { cn } from '@/lib/utils';

type Tone = 'primary' | 'mint' | 'coral' | 'neutral' | 'solid';
type Size = 'sm' | 'md' | 'lg';

const TONE_CLASS: Record<Tone, string> = {
  primary: 'bg-primary-100 text-primary-deep',
  mint: 'bg-mint-soft text-mint',
  coral: 'bg-coral-soft text-coral',
  neutral: 'bg-surface text-ink-muted',
  // The one place a badge is allowed to *be* the accent rather than tint
  // toward it — reserved for a single hero action per screen (see callers).
  solid: 'bg-primary-deep text-white',
};

const SIZE_CLASS: Record<Size, { wrapper: string; icon: string }> = {
  sm: { wrapper: 'size-8', icon: 'size-4' },
  md: { wrapper: 'size-10', icon: 'size-5' },
  lg: { wrapper: 'size-12', icon: 'size-6' },
};

interface IconBadgeProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: Tone;
  size?: Size;
  /** `pill` for a perfect circle (people, status dots); default is a rounded square. */
  shape?: 'rounded' | 'pill';
  className?: string;
}

/**
 * The one icon-in-a-tinted-container pattern used everywhere: card accents,
 * quick-action tiles, empty states, list leading icons.
 *
 * Before this existed, every screen picked its own badge size (7 through 16
 * were all in use for what was conceptually the same element) and its own
 * icon size inside it. Route new icon badges through here instead of
 * hand-rolling the wrapper — consistency here is the whole point.
 */
export function IconBadge({
  icon: Icon,
  tone = 'primary',
  size = 'md',
  shape = 'rounded',
  className,
}: IconBadgeProps) {
  const { wrapper, icon } = SIZE_CLASS[size];

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center',
        shape === 'pill' ? 'rounded-full' : 'rounded-2xl',
        wrapper,
        TONE_CLASS[tone],
        className,
      )}
    >
      {/* Lucide's default stroke-width (2) is the standard everywhere; never
          override it per-instance, or the "same icon" reads as two fonts. */}
      <Icon className={icon} aria-hidden />
    </span>
  );
}
