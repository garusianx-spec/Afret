'use client';

import { useMemo, useState } from 'react';

import { Card, CardTitle } from '@/components/ui';
import { toFaDigits } from '@/lib/persian';

import { BABY_NAMES } from '../data/babyNames';
import { BabyNameCard } from './babyNames/BabyNameCard';
import { BabyNameFilters, type BabyNameFilterState } from './babyNames/BabyNameFilters';

/** Mode C & D — filterable Persian baby-name catalog with local favorites. */
export function BabyNameDirectory() {
  const [filters, setFilters] = useState<BabyNameFilterState>({
    gender: 'all',
    origin: 'all',
    query: '',
  });

  const results = useMemo(() => {
    const query = filters.query.trim();
    return BABY_NAMES.filter((item) => {
      if (filters.gender !== 'all' && item.gender !== filters.gender) return false;
      if (filters.origin !== 'all' && item.origin !== filters.origin) return false;
      if (query && !item.name.includes(query) && !item.pronunciation.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <Card>
      <CardTitle
        action={
          <span className="text-xs font-medium text-ink-muted tabular-nums">
            {toFaDigits(results.length)} نام
          </span>
        }
      >
        انتخاب نام نوزاد
      </CardTitle>

      <div className="mb-3">
        <BabyNameFilters state={filters} onChange={setFilters} />
      </div>

      {results.length > 0 ? (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {results.map((item) => (
            <BabyNameCard key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-xs text-ink-faint">نامی با این فیلتر پیدا نشد.</p>
      )}
    </Card>
  );
}
