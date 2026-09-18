'use client';

import { Check, Pill, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Card, CardTitle } from '@/components/ui';
import { jalaliDayKey } from '@/lib/jalali';
import { cn } from '@/lib/utils';
import { createId } from '@/lib/utils';

import { usePillReminderStore } from '../store/pillReminderStore';

/**
 * Daily medication / vitamin reminder.
 *
 * Deliberately separate from `useChecklistStore`: that store's items are
 * fixed per mode, while this one holds a list the user names herself
 * (whatever her clinician actually prescribed), ticked off day by day.
 */
export function PillReminder() {
  const items = usePillReminderStore((s) => s.items);
  const addItem = usePillReminderStore((s) => s.addItem);
  const removeItem = usePillReminderStore((s) => s.removeItem);
  const taken = usePillReminderStore((s) => s.taken);
  const toggleTaken = usePillReminderStore((s) => s.toggleTaken);

  const [draft, setDraft] = useState('');
  const dayKey = jalaliDayKey(new Date());
  const todayTaken = taken[dayKey] ?? {};

  return (
    <Card>
      <CardTitle>یادآور دارو و مکمل</CardTitle>

      {items.length === 0 ? (
        <p className="mb-3 text-xs text-ink-faint">
          نام قرص یا مکملی که مصرف می‌کنید را اضافه کنید تا هر روز یادآوری شود.
        </p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1">
          {items.map((item) => {
            const done = Boolean(todayTaken[item.id]);
            return (
              <li key={item.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleTaken(dayKey, item.id)}
                  aria-pressed={done}
                  className="afrat-tap flex flex-1 items-center gap-3 rounded-xl px-1 py-2 text-start hover:bg-surface"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition',
                      done ? 'border-mint bg-mint text-white' : 'border-surface-border bg-surface-card',
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : <Pill className="size-3 text-ink-faint" />}
                  </span>
                  <span className={cn('text-sm', done ? 'text-ink-faint line-through' : 'text-ink')}>
                    {item.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`حذف ${item.label}`}
                  className="afrat-tap shrink-0 p-1.5 text-ink-faint hover:text-coral"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const label = draft.trim();
          if (!label) return;
          addItem({ id: createId('pill'), label });
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="مثلاً ویتامین D"
          aria-label="نام دارو یا مکمل"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="افزودن"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>
    </Card>
  );
}
