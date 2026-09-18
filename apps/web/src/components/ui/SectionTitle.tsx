import type { ReactNode } from 'react';

export function SectionTitle({
  children,
  hint,
  id,
}: {
  children: ReactNode;
  hint?: ReactNode;
  /** Lets an in-page link (e.g. a QuickActions shortcut) land on this section. */
  id?: string;
}) {
  return (
    <div id={id} className="mb-3 mt-6 flex scroll-mt-20 items-baseline justify-between gap-2">
      <h2 className="text-base font-bold text-ink">{children}</h2>
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </div>
  );
}
