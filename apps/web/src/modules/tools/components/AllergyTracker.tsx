'use client';

import { useState } from 'react';
import { Plus, Utensils } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { cn } from '@/lib/utils';

import { COMMON_FIRST_FOODS, REACTION_LEVELS } from '../data/toolContent';
import { useAllergyStore } from '../store/allergyStore';

/** Mode D — first-food introductions and any reaction observed. */
export function AllergyTracker() {
  const entries = useAllergyStore((s) => s.entries);
  const addEntry = useAllergyStore((s) => s.addEntry);
  const [food, setFood] = useState('');
  const [reaction, setReaction] = useState(0);

  return (
    <Card id="allergy">
      <CardTitle>راهنمای غذای کمکی و پایش آلرژی</CardTitle>
      <p className="mb-3 text-[11px] leading-5 text-ink-faint">
        هر غذای جدید را تک‌به‌تک و با فاصلهٔ ۲ تا ۳ روز معرفی کنید تا در صورت
        بروز واکنش، عامل آن مشخص باشد.
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {COMMON_FIRST_FOODS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFood(item)}
            aria-pressed={food === item}
            className={cn(
              'afrat-tap rounded-pill px-2.5 py-1 text-xs font-medium transition',
              food === item ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-1.5">
        {REACTION_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => setReaction(level.value)}
            aria-pressed={reaction === level.value}
            className={cn(
              'afrat-tap flex-1 rounded-xl px-2 py-2 text-[11px] font-medium transition',
              reaction === level.value ? 'bg-coral text-ink' : 'bg-surface text-ink-muted',
            )}
          >
            {level.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const label = food.trim();
          if (!label) return;
          addEntry({ food: label, reaction, at: new Date().toISOString() });
          setFood('');
          setReaction(0);
        }}
        className="flex gap-2"
      >
        <input
          value={food}
          onChange={(event) => setFood(event.target.value)}
          placeholder="یا نام غذای دیگری بنویسید"
          aria-label="نام غذا"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      {entries.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {entries.slice(0, 6).map((entry, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-ink">
                <Utensils className="size-3.5 text-ink-faint" aria-hidden="true" />
                {entry.food}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-ink-faint">{jalaliShort(entry.at)}</span>
                <Chip tone={entry.reaction === 0 ? 'mint' : 'coral'}>
                  {REACTION_LEVELS.find((l) => l.value === entry.reaction)?.label ?? '—'}
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
