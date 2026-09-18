'use client';

import { CircleDot } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import { useHealthLogStore } from '@/modules/tracker/store/healthLogStore';

/**
 * LH ovulation-predictor-kit results. Kept as a `symptom` log with a fixed
 * label rather than a new store — it is a single daily positive/negative
 * reading, exactly the shape `symptom` already covers.
 */
const LH_KEY = 'lh-kit';

export function OvulationKitTracker() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.label === LH_KEY);
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = logs.find((l) => l.at.slice(0, 10) === todayKey);

  return (
    <Card id="lh-kit">
      <CardTitle>ردیاب کیت تخمک‌گذاری (LH)</CardTitle>
      <p className="mb-3 text-[11px] leading-5 text-ink-faint">
        نتیجهٔ کیت امروز را ثبت کنید. برای دمای پایه بدن به تب «تقویم» مراجعه
        کنید.
      </p>

      <div className="flex gap-2">
        {[
          { value: 0, label: 'منفی', tone: 'neutral' as const },
          { value: 1, label: 'مثبت', tone: 'mint' as const },
        ].map((option) => {
          const selected = today?.value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                add({
                  kind: 'symptom',
                  at: new Date().toISOString(),
                  value: option.value,
                  label: LH_KEY,
                })
              }
              className={cn(
                'afrat-tap flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                selected
                  ? option.value === 1
                    ? 'bg-mint text-white'
                    : 'bg-surface-border text-ink'
                  : 'bg-surface text-ink-muted',
              )}
            >
              <CircleDot className="size-4" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>

      {logs.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {logs.slice(0, 5).map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
              <span className="text-ink-muted">{jalaliShort(log.at)}</span>
              <Chip tone={log.value === 1 ? 'mint' : 'neutral'}>
                {log.value === 1 ? 'مثبت' : 'منفی'}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
