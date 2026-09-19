import { percentileBand, percentileForValue, type GrowthSexInput, type PercentileBand } from '@afrat/core';

import type { GrowthKind } from '../store/babyGrowthStore';

const MS_PER_MONTH = 30.4375 * 86_400_000;

/** Only these two indicators have a WHO reference curve wired up (see PRD scope). */
export type ChartableGrowthKind = 'weight' | 'height';

export function hasWhoReference(kind: GrowthKind): kind is ChartableGrowthKind {
  return kind === 'weight' || kind === 'height';
}

function toSexInput(sex: 'male' | 'female' | 'unknown' | undefined): GrowthSexInput {
  if (sex === 'male' || sex === 'female') return sex;
  return 'unisex';
}

function toMeasure(kind: ChartableGrowthKind) {
  return kind === 'weight' ? ('weightKg' as const) : ('lengthCm' as const);
}

/** Fractional months elapsed between the baby's birth date and a reading timestamp. */
export function monthsSinceBirth(birthDateIso: string, atIso: string): number {
  return Math.max(0, (Date.parse(atIso) - Date.parse(birthDateIso)) / MS_PER_MONTH);
}

export function whoPercentileBand(
  kind: ChartableGrowthKind,
  sex: 'male' | 'female' | 'unknown' | undefined,
  months: number,
): PercentileBand {
  return percentileBand(toMeasure(kind), toSexInput(sex), months);
}

/** Where a single reading falls (0–100) against the WHO curve, for a "P.. صدک" chip. */
export function whoPercentileForReading(
  kind: ChartableGrowthKind,
  sex: 'male' | 'female' | 'unknown' | undefined,
  months: number,
  value: number,
): number {
  return percentileForValue(toMeasure(kind), toSexInput(sex), months, value);
}
