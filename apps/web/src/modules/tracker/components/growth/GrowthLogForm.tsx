'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { toEnDigits } from '@/lib/persian';

export function GrowthLogForm({
  unit,
  label,
  onSubmit,
}: {
  unit: string;
  label: string;
  onSubmit: (value: number) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      className="mb-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = Number(toEnDigits(value));
        if (!Number.isFinite(parsed) || parsed <= 0) return;
        onSubmit(parsed);
        setValue('');
      }}
    >
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`مقدار به ${unit}`}
        aria-label={`ثبت ${label}`}
        className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm tabular-nums focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
        aria-label="ثبت اندازه‌گیری"
      >
        <Plus className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
