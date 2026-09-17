'use client';

import { useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, CircleX, Search } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

import { FOOD_CATEGORIES, FOOD_SAFETY } from '../data/foodSafety';
import { searchFoodSafety, VERDICT_LABELS } from '../lib/search';
import type { FoodSafetyEntry, SafetyVerdict } from '../types';

const VERDICT_STYLE: Record<
  SafetyVerdict,
  { chip: string; Icon: typeof CircleCheck }
> = {
  safe: { chip: 'bg-mint-soft text-mint', Icon: CircleCheck },
  caution: { chip: 'bg-coral-soft text-ink', Icon: CircleAlert },
  avoid: { chip: 'bg-coral text-ink', Icon: CircleX },
};

/** «آیا مصرف این خوراکی در بارداری مجاز است؟» */
export function FoodSafetySearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    if (query.trim()) return searchFoodSafety(query).map((r) => r.entry);
    return category
      ? FOOD_SAFETY.filter((entry) => entry.category === category)
      : FOOD_SAFETY.slice(0, 6);
  }, [query, category]);

  const searching = query.trim().length > 0;

  return (
    <Card>
      <CardTitle>آیا این خوراکی مجاز است؟</CardTitle>

      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-ink-faint"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام خوراکی را بنویسید…"
          aria-label="جستجوی ایمنی خوراکی در بارداری"
          className="w-full rounded-xl border border-surface-border bg-surface py-2.5 pe-9 ps-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {!searching ? (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 afrat-scroll-hidden">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={cn(
              'afrat-tap shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium',
              category === null ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
            )}
          >
            همه
          </button>
          {FOOD_CATEGORIES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              aria-pressed={category === name}
              className={cn(
                'afrat-tap shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium',
                category === name
                  ? 'bg-primary-deep text-white'
                  : 'bg-surface text-ink-muted',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
        {results.map((entry) => (
          <SafetyRow key={entry.id} entry={entry} />
        ))}
      </ul>

      {searching && results.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface p-3 text-xs leading-6 text-ink-muted">
          این خوراکی در فهرست ما نیست. برای اطمینان با پزشک یا کارشناس تغذیهٔ خود
          مشورت کنید — می‌توانید از بخش گفتگو سؤال بپرسید.
        </p>
      ) : null}
    </Card>
  );
}

function SafetyRow({ entry }: { entry: FoodSafetyEntry }) {
  const { chip, Icon } = VERDICT_STYLE[entry.verdict];

  return (
    <li className="rounded-xl border border-surface-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{entry.name}</p>
          <p className="text-[11px] text-ink-faint">{entry.category}</p>
        </div>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold',
            chip,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {VERDICT_LABELS[entry.verdict]}
        </span>
      </div>

      <p className="mt-2 text-xs leading-6 text-ink-muted">{entry.reason}</p>
      {entry.limit ? (
        <p className="mt-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] leading-5 text-ink">
          <strong className="font-bold">حد مجاز: </strong>
          {entry.limit}
        </p>
      ) : null}
    </li>
  );
}
