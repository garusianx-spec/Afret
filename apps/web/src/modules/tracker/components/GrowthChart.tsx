'use client';

import { useMemo, useState } from 'react';

import { Card, CardTitle, Chip } from '@/components/ui';
import { jalaliShort } from '@/lib/jalali';
import { formatFaUnit } from '@/lib/persian';
import { cn } from '@/lib/utils';
import { babyAge } from '@/modules/tracker/lib/cycle';
import type { BabyProfile } from '@/types';

import { hasWhoReference } from '../lib/growthPercentile';
import { GROWTH_META, useBabyGrowthStore, type GrowthKind } from '../store/babyGrowthStore';
import { GrowthLogForm } from './growth/GrowthLogForm';
import { WhoGrowthPanel } from './growth/WhoGrowthPanel';

const KINDS: GrowthKind[] = ['weight', 'height', 'headCircumference'];

/**
 * Growth trend against the WHO Child Growth Standard percentiles (weight-
 * and length-for-age). Head circumference has no WHO curve wired up yet, so
 * it stays a plain trend log — never a fabricated band.
 */
export function GrowthChart({ baby }: { baby: BabyProfile }) {
  const [kind, setKind] = useState<GrowthKind>('weight');
  const add = useBabyGrowthStore((s) => s.add);
  // Select the raw, referentially-stable array and derive locally — calling
  // `byKind` *inside* the selector would return a freshly-filtered array on
  // every snapshot check, which breaks useSyncExternalStore's equality test
  // and causes an infinite render loop.
  const allLogs = useBabyGrowthStore((s) => s.logs);
  const logs = useMemo(
    () =>
      allLogs
        .filter((l) => l.kind === kind)
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    [allLogs, kind],
  );

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

      <GrowthLogForm
        unit={meta.unit}
        label={meta.label}
        onSubmit={(value) => add({ kind, at: new Date().toISOString(), value })}
      />

      {hasWhoReference(kind) ? (
        <WhoGrowthPanel
          kind={kind}
          logs={logs}
          birthDate={baby.birthDate}
          sex={baby.sex}
          currentAgeMonths={ageMonths}
        />
      ) : null}

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
        {hasWhoReference(kind)
          ? baby.sex && baby.sex !== 'unknown'
            ? 'محدودهٔ رنگی بر اساس استاندارد رشد کودکان سازمان جهانی بهداشت (WHO) است — جایگزین ویزیت پزشک کودکان نیست.'
            : 'جنسیت نوزاد ثبت نشده؛ محدودهٔ رنگی، بازهٔ ترکیبی هر دو جنس است. برای صدک دقیق‌تر، جنسیت را در پروفایل نوزاد ثبت کنید.'
          : 'برای دور سر هنوز نموداری استاندارد نمایش داده نمی‌شود — فقط روند اندازه‌گیری‌های شما ثبت می‌شود.'}
      </p>
    </Card>
  );
}
