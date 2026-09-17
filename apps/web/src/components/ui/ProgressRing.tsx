import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** 0 → 1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  children?: React.ReactNode;
}

/** Circular progress used for gestational week and daily checklist completion. */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  className,
  label,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        /* Start the arc at 12 o'clock and sweep counter-clockwise, which is
           the direction a Persian reader expects progress to advance. */
        style={{ transform: 'rotate(-90deg) scaleX(-1)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="stroke-primary-deep transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
