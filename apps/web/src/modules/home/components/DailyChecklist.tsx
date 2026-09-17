'use client';

import { Check } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { jalaliDayKey } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';
import type { LifecycleMode } from '@/types';

import { DAILY_ITEMS, useChecklistStore } from '../store/checklistStore';

export function DailyChecklist({ mode }: { mode: LifecycleMode }) {
  const dayKey = jalaliDayKey(new Date());
  const progress = useChecklistStore((s) => s.progress[dayKey]);
  const toggle = useChecklistStore((s) => s.toggle);

  const items = DAILY_ITEMS[mode] ?? DAILY_ITEMS.cycle;
  const done = items.filter(
    (item) => (progress?.[item.id] ?? 0) >= (item.target ?? 1),
  ).length;

  return (
    <Card>
      <CardTitle
        action={
          <span className="text-xs font-medium text-ink-muted tabular-nums">
            {toFaDigits(done)} از {toFaDigits(items.length)}
          </span>
        }
      >
        کارهای امروز
      </CardTitle>

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const target = item.target ?? 1;
          const count = progress?.[item.id] ?? 0;
          const complete = count >= target;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(dayKey, item.id, target)}
                aria-pressed={complete}
                className="afrat-tap flex w-full items-center gap-3 rounded-xl px-1 py-2 text-start hover:bg-surface"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition',
                    complete
                      ? 'border-mint bg-mint text-white'
                      : 'border-surface-border bg-surface-card',
                  )}
                >
                  {complete ? <Check className="size-3.5" /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm',
                      complete ? 'text-ink-faint line-through' : 'text-ink',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.hint ? (
                    <span className="block text-[11px] text-ink-faint">
                      {item.hint}
                    </span>
                  ) : null}
                </span>

                {item.target ? (
                  <span className="shrink-0 rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-deep tabular-nums">
                    {toFaDigits(count)}/{toFaDigits(item.target)} {item.unit}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
