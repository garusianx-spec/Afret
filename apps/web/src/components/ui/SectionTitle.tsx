import type { ReactNode } from 'react';

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 mt-6 flex items-baseline justify-between gap-2">
      <h2 className="text-base font-bold text-ink">{children}</h2>
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </div>
  );
}
