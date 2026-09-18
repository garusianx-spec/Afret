'use client';

import { useState } from 'react';
import { Plus, Ruler } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { formatFa, toEnDigits } from '@/lib/persian';
import { useHealthLogStore } from '@/modules/tracker/store/healthLogStore';
import { useUserStore } from '@/stores/userStore';

/** BMI classification bands (WHO adult standard). */
function bmiCategory(bmi: number): { label: string; tone: 'mint' | 'coral' | 'primary' } {
  if (bmi < 18.5) return { label: 'کمبود وزن', tone: 'coral' };
  if (bmi < 25) return { label: 'وزن طبیعی', tone: 'mint' };
  if (bmi < 30) return { label: 'اضافه‌وزن', tone: 'coral' };
  return { label: 'چاقی', tone: 'coral' };
}

/**
 * Mode A's "ردیاب وزن و شاخص BMI" — the same weight log every mode shares,
 * plus a BMI readout once the user has entered her height once.
 */
export function WeightBmiTracker() {
  const add = useHealthLogStore((s) => s.add);
  const logs = useHealthLogStore((s) => s.logs).filter((l) => l.kind === 'weight');
  const [value, setValue] = useState('');

  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const [heightDraft, setHeightDraft] = useState(profile?.heightCm ? String(profile.heightCm) : '');

  const latest = logs[0];
  const bmi =
    latest && profile?.heightCm
      ? latest.value / ((profile.heightCm / 100) * (profile.heightCm / 100))
      : undefined;

  return (
    <Card id="weight-bmi">
      <CardTitle action={bmi ? <Chip tone={bmiCategory(bmi).tone}>{bmiCategory(bmi).label}</Chip> : null}>
        ردیاب وزن و شاخص BMI
      </CardTitle>

      <div className="mb-3 flex items-center gap-2">
        <Ruler className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        <input
          inputMode="decimal"
          value={heightDraft}
          onChange={(event) => setHeightDraft(event.target.value)}
          onBlur={() => {
            const parsed = Number(toEnDigits(heightDraft));
            if (Number.isFinite(parsed) && parsed >= 100 && parsed <= 220) {
              patchProfile({ heightCm: parsed });
            }
          }}
          placeholder="قد به سانتی‌متر (یک‌بار وارد کنید)"
          aria-label="قد به سانتی‌متر"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none"
        />
      </div>

      {bmi ? (
        <p className="mb-3 rounded-xl bg-surface p-3 text-center text-sm">
          <span className="text-2xl font-bold text-primary-deep tabular-nums">
            {formatFa(bmi, { maximumFractionDigits: 1 })}
          </span>
          <span className="ms-1 text-xs text-ink-muted">شاخص BMI</span>
        </p>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(toEnDigits(value));
          if (!Number.isFinite(parsed) || parsed < 30 || parsed > 200) return;
          add({ kind: 'weight', at: new Date().toISOString(), value: parsed });
          setValue('');
        }}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={latest ? formatFa(latest.value) : 'وزن به کیلوگرم'}
          aria-label="وزن به کیلوگرم"
          className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="afrat-tap flex size-11 items-center justify-center rounded-xl bg-primary-deep text-white"
          aria-label="ثبت وزن"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </form>

      {logs.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {logs.slice(0, 4).map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
              <span className="text-ink-muted">{jalaliShort(log.at)}</span>
              <Chip tone="neutral">{formatFa(log.value)} کیلوگرم</Chip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">هنوز وزنی ثبت نشده است.</p>
      )}
    </Card>
  );
}
