'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { formatFaUnit, toEnDigits, toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';
import { babyAge } from '@/modules/tracker/lib/cycle';
import type { BabyProfile } from '@/types';

import {
  GROWTH_META,
  referenceWeightBand,
  useBabyGrowthStore,
  type GrowthKind,
} from '../store/babyGrowthStore';

const KINDS: GrowthKind[] = ['weight', 'height', 'headCircumference'];

/**
 * Growth trend against an approximate typical-range band.
 *
 * The band is a simplified unisex reference, not the WHO LMS growth
 * standard — real percentile placement needs a pediatrician and a proper
 * chart. This is a "does this look roughly on track" glance, not a diagnosis.
 */
export function GrowthChart({ baby }: { baby: BabyProfile }) {
  const [kind, setKind] = useState<GrowthKind>('weight');
  const add = useBabyGrowthStore((s) => s.add);
  const logs = useBabyGrowthStore((s) => s.byKind(kind));
  const [value, setValue] = useState('');

  const meta = GROWTH_META[kind];
  const ageMonths = babyAge(baby.birthDate).months;

  return (
    <Card id="growth">
      <CardTitle>نمودار رشد</CardTitle>

      <div role="radiogroup" aria-label="شاخص رشد" className="mb-3 flex gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              'afrat-tap flex-1 rounded-pill px-2 py-1.5 text-[11px] font-medium transition',
              kind === k ? 'bg-primary-deep text-white' : 'bg-surface text-ink-muted',
            )}
          >
            {GROWTH_META[k].label}
          </button>
        ))}
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(toEnDigits(value));
          if (!Number.isFinite(parsed) || parsed <= 0) return;
          add({ kind, at: new Date().toISOString(), value: parsed });
          setValue('');
        }}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`مقدار به ${meta.unit}`}
          aria-label={`ثبت ${meta.label}`}
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

      {kind === 'weight' ? <WeightTrendChart logs={logs} currentAgeMonths={ageMonths} /> : null}

      {logs.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {[...logs].reverse().slice(0, 5).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
            >
              <span className="text-ink-muted">{jalaliShort(log.at)}</span>
              <Chip tone="neutral">{formatFaUnit(log.value, meta.unit, 2)}</Chip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">هنوز اندازه‌گیری ثبت نشده است.</p>
      )}

      <p className="mt-3 text-[10px] leading-5 text-ink-faint">
        محدودهٔ رنگی، بازهٔ تقریبی رشد طبیعی است — نه صدک دقیق پزشکی. برای
        ارزیابی رشد نوزاد حتماً به پزشک کودکان مراجعه کنید.
      </p>
    </Card>
  );
}

function WeightTrendChart({
  logs,
  currentAgeMonths,
}: {
  logs: { at: string; value: number }[];
  currentAgeMonths: number;
}) {
  const maxMonth = Math.max(currentAgeMonths + 2, 6);
  const W = 300;
  const H = 140;
  const pad = 8;

  const monthsFromBirth = (iso: string) => {
    // Approximate months elapsed at the time of the reading — good enough
    // for plotting a trend line, not for clinical dating.
    return Math.max(0, (Date.now() - Date.parse(iso)) / (30.4 * 86_400_000));
  };

  const xFor = (m: number) => pad + (m / maxMonth) * (W - pad * 2);
  const allValues = [
    ...logs.map((l) => l.value),
    referenceWeightBand(0).low,
    referenceWeightBand(maxMonth).high,
  ];
  const yMin = Math.min(...allValues) * 0.9;
  const yMax = Math.max(...allValues) * 1.05;
  const yFor = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - pad * 2);

  const bandPoints = Array.from({ length: 13 }, (_, i) => (i / 12) * maxMonth);
  const lowPath = bandPoints.map((m) => `${xFor(m)},${yFor(referenceWeightBand(m).low)}`).join(' ');
  const highPath = bandPoints
    .slice()
    .reverse()
    .map((m) => `${xFor(m)},${yFor(referenceWeightBand(m).high)}`)
    .join(' ');

  // Each reading's age is approximated ordinally (evenly spread across the
  // logged history up to the baby's current age) rather than recomputed from
  // its own timestamp — the chart is illustrative, not a measured plot.

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-surface p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="نمودار روند وزن">
        <polygon points={`${lowPath} ${highPath}`} className="fill-mint-soft" />
        {logs.length > 1 ? (
          <polyline
            points={logs
              .map((l, i) => {
                const m = (i / Math.max(1, logs.length - 1)) * currentAgeMonths;
                return `${xFor(m)},${yFor(l.value)}`;
              })
              .join(' ')}
            fill="none"
            className="stroke-primary-deep"
            strokeWidth={2}
          />
        ) : null}
        {logs.map((l, i) => {
          const m = (i / Math.max(1, logs.length - 1)) * currentAgeMonths;
          return (
            <circle
              key={i}
              cx={xFor(m)}
              cy={yFor(l.value)}
              r={3}
              className="fill-primary-deep"
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>تولد</span>
        <span>{toFaDigits(Math.round(maxMonth))} ماهگی</span>
      </div>
    </div>
  );
}
