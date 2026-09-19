'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

import { Chip } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { BabyName } from '../../data/babyNames';
import { useBabyNameFavoritesStore } from '../../store/babyNameFavoritesStore';

const GENDER_LABEL: Record<BabyName['gender'], string> = {
  boy: 'پسر',
  girl: 'دختر',
  unisex: 'مشترک',
};

const GENDER_TONE: Record<BabyName['gender'], 'primary' | 'mint' | 'coral'> = {
  boy: 'primary',
  girl: 'coral',
  unisex: 'mint',
};

export function BabyNameCard({ item }: { item: BabyName }) {
  const [expanded, setExpanded] = useState(false);
  const isFavorite = useBabyNameFavoritesStore((s) => s.favoriteIds.includes(item.id));
  const toggle = useBabyNameFavoritesStore((s) => s.toggle);

  return (
    <li className="afrat-card p-3.5">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-start"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ink">{item.name}</p>
            <span className="text-xs text-ink-faint">{item.pronunciation}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{item.meaning}</p>
        </button>
        <Chip tone={GENDER_TONE[item.gender]}>{GENDER_LABEL[item.gender]}</Chip>
        <button
          type="button"
          onClick={() => toggle(item.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          className="afrat-tap flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-surface"
        >
          <Heart
            className={cn('size-4', isFavorite ? 'fill-coral text-coral' : 'text-ink-faint')}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-2.5 flex items-center gap-2 border-t border-surface-border pt-2.5 text-[11px] text-ink-faint">
          <span>خاستگاه: {item.origin}</span>
          <span aria-hidden="true">·</span>
          <span>محبوبیت (تخمینی): {'●'.repeat(item.popularity)}{'○'.repeat(5 - item.popularity)}</span>
        </div>
      ) : null}
    </li>
  );
}
