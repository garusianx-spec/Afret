'use client';

import { type ReactNode, useState } from 'react';

import { Card, CardTitle } from '@/components/ui';
import { toEnDigits } from '@/lib/persian';
import { useUserStore } from '@/stores/userStore';
import type { BabyProfile } from '@/types';

const inputClass =
  'w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

/**
 * Unlocks the growth chart, vaccine schedule, and milestones — all three
 * key off `profile.baby`, which nothing else in the app ever creates.
 * Shown in place of the postpartum tracker's empty state until filled in.
 */
export function BabyProfileForm() {
  const patchProfile = useUserStore((s) => s.patchProfile);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<BabyProfile['sex']>('unknown');
  const [birthWeight, setBirthWeight] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const valid = name.trim().length > 0 && birthDate.length > 0 && birthDate <= today;

  return (
    <Card>
      <CardTitle>اطلاعات نوزاد</CardTitle>
      <p className="mb-3 text-xs leading-6 text-ink-muted">
        برای فعال شدن نمودار رشد، برنامهٔ واکسیناسیون و اولین‌های نوزاد، این
        اطلاعات را ثبت کنید.
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          const weight = Number(toEnDigits(birthWeight));
          patchProfile({
            baby: {
              name: name.trim(),
              birthDate,
              sex,
              birthWeightKg: Number.isFinite(weight) && weight > 0 ? weight : undefined,
            },
          });
        }}
      >
        <Field label="نام نوزاد">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً کیانا"
            required
            className={inputClass}
          />
        </Field>

        <Field label="تاریخ تولد (میلادی)">
          <input
            type="date"
            value={birthDate}
            max={today}
            onChange={(event) => setBirthDate(event.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field label="جنسیت">
          <div role="radiogroup" aria-label="جنسیت نوزاد" className="grid grid-cols-3 gap-2">
            {(
              [
                { value: 'female', label: 'دختر' },
                { value: 'male', label: 'پسر' },
                { value: 'unknown', label: 'نامشخص' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={sex === option.value}
                onClick={() => setSex(option.value)}
                className={`afrat-tap rounded-xl px-2 py-2 text-xs font-medium transition ${
                  sex === option.value ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="وزن هنگام تولد (کیلوگرم، اختیاری)">
          <input
            inputMode="decimal"
            value={birthWeight}
            onChange={(event) => setBirthWeight(event.target.value)}
            placeholder="مثلاً ۳.۲"
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={!valid}
          className="afrat-tap mt-1 rounded-pill bg-primary-deep py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          ذخیره
        </button>
      </form>
    </Card>
  );
}
