import type { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <header className="afrat-safe-top sticky top-0 z-20 border-b border-surface-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  );
}
