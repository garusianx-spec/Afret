import { chatDayLabel } from '@/lib/jalali';

/** Sticky Jalali day divider between message groups. */
export function DateSeparator({ date }: { date: string }) {
  return (
    <div
      className="sticky top-2 z-10 my-4 flex justify-center"
      role="separator"
      aria-label={chatDayLabel(date)}
    >
      <span className="rounded-pill border border-surface-border bg-surface-card/90 px-3 py-1 text-xs font-medium text-ink-muted shadow-sm backdrop-blur">
        {chatDayLabel(date)}
      </span>
    </div>
  );
}
