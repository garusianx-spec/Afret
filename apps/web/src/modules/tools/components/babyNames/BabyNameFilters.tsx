import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

import { NAME_ORIGINS, type NameGender, type NameOrigin } from '../../data/babyNames';

const GENDERS: { value: NameGender | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'girl', label: 'دختر' },
  { value: 'boy', label: 'پسر' },
  { value: 'unisex', label: 'مشترک' },
];

export interface BabyNameFilterState {
  gender: NameGender | 'all';
  origin: NameOrigin | 'all';
  query: string;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'afrat-tap shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition',
        active ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
      )}
    >
      {children}
    </button>
  );
}

export function BabyNameFilters({
  state,
  onChange,
}: {
  state: BabyNameFilterState;
  onChange: (next: BabyNameFilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <input
          value={state.query}
          onChange={(event) => onChange({ ...state, query: event.target.value })}
          placeholder="جستجوی نام…"
          aria-label="جستجوی نام نوزاد"
          className="w-full rounded-xl border border-surface-border bg-surface py-2.5 ps-9 pe-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div role="radiogroup" aria-label="جنسیت" className="flex gap-1.5 overflow-x-auto">
        {GENDERS.map((g) => (
          <Pill key={g.value} active={state.gender === g.value} onClick={() => onChange({ ...state, gender: g.value })}>
            {g.label}
          </Pill>
        ))}
      </div>

      <div role="radiogroup" aria-label="خاستگاه نام" className="flex gap-1.5 overflow-x-auto">
        <Pill active={state.origin === 'all'} onClick={() => onChange({ ...state, origin: 'all' })}>
          همهٔ خاستگاه‌ها
        </Pill>
        {NAME_ORIGINS.map((origin) => (
          <Pill key={origin} active={state.origin === origin} onClick={() => onChange({ ...state, origin })}>
            {origin}
          </Pill>
        ))}
      </div>
    </div>
  );
}
