import { lengthBoy, lengthGirl, MAX_MONTHS, weightBoy, weightGirl } from './who-growth.data.js';
import type {
  BiologicalSex,
  GrowthMeasure,
  GrowthSexInput,
  LmsPoint,
  LmsTuple,
  PercentileBand,
} from './who-growth.types.js';

/** z-scores for the five percentile curves the app plots. Fixed, not derived. */
const STANDARD_Z = { p3: -1.8808, p15: -1.0364, p50: 0, p85: 1.0364, p97: 1.8808 } as const;

function tableFor(measure: GrowthMeasure, sex: BiologicalSex): LmsTuple[] {
  if (measure === 'weightKg') return sex === 'male' ? weightBoy : weightGirl;
  return sex === 'male' ? lengthBoy : lengthGirl;
}

/** Clamps and linearly interpolates the LMS triple at a fractional month. */
export function lmsAt(measure: GrowthMeasure, sex: BiologicalSex, months: number): LmsPoint {
  const clamped = Math.min(Math.max(months, 0), MAX_MONTHS);
  const table = tableFor(measure, sex);
  const lower = Math.floor(clamped);
  const upper = Math.min(lower + 1, MAX_MONTHS);
  const t = clamped - lower;

  // `lower`/`upper` are clamped into [0, MAX_MONTHS], which is exactly the
  // table's index range, so both lookups always hit — safe under
  // noUncheckedIndexedAccess regardless of the consuming project's config.
  const a = table[lower]!;
  const b = table[upper]!;
  return {
    l: a[0] + (b[0] - a[0]) * t,
    m: a[1] + (b[1] - a[1]) * t,
    s: a[2] + (b[2] - a[2]) * t,
  };
}

/** LMS z-score: how many standard deviations `value` is from the median. */
export function zScoreFromValue(point: LmsPoint, value: number): number {
  if (value <= 0) return Number.NEGATIVE_INFINITY;
  const { l, m, s } = point;
  if (Math.abs(l) < 1e-9) return Math.log(value / m) / s;
  return (Math.pow(value / m, l) - 1) / (l * s);
}

/** Inverse of `zScoreFromValue` — the measurement at a given z-score. */
export function valueFromZ(point: LmsPoint, z: number): number {
  const { l, m, s } = point;
  if (Math.abs(l) < 1e-9) return m * Math.exp(s * z);
  return m * Math.pow(1 + l * s * z, 1 / l);
}

/**
 * Standard normal CDF via the Abramowitz & Stegun 7.1.26 rational
 * approximation (max error ~1.5e-7) — no external stats dependency needed
 * for a chart-precision percentile.
 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** Percentile (0–100) of `value` against one sex-specific WHO curve. */
export function percentileForValueSingleSex(
  measure: GrowthMeasure,
  sex: BiologicalSex,
  months: number,
  value: number,
): number {
  const point = lmsAt(measure, sex, months);
  const z = zScoreFromValue(point, value);
  return Math.min(100, Math.max(0, normalCdf(z) * 100));
}

function bandForSex(measure: GrowthMeasure, sex: BiologicalSex, months: number): PercentileBand {
  const point = lmsAt(measure, sex, months);
  return {
    p3: valueFromZ(point, STANDARD_Z.p3),
    p15: valueFromZ(point, STANDARD_Z.p15),
    p50: valueFromZ(point, STANDARD_Z.p50),
    p85: valueFromZ(point, STANDARD_Z.p85),
    p97: valueFromZ(point, STANDARD_Z.p97),
  };
}

/**
 * The five WHO percentile curves at one age, for the requested sex.
 *
 * `'unisex'` (sex not recorded) returns an honest envelope — the widest P3
 * and P97 across both sex curves, P50 averaged — rather than averaging LMS
 * coefficients directly, which would distort the shape of the curve.
 */
export function percentileBand(
  measure: GrowthMeasure,
  sex: GrowthSexInput,
  months: number,
): PercentileBand {
  if (sex !== 'unisex') return bandForSex(measure, sex, months);

  const boy = bandForSex(measure, 'male', months);
  const girl = bandForSex(measure, 'female', months);
  return {
    p3: Math.min(boy.p3, girl.p3),
    p15: Math.min(boy.p15, girl.p15),
    p50: (boy.p50 + girl.p50) / 2,
    p85: Math.max(boy.p85, girl.p85),
    p97: Math.max(boy.p97, girl.p97),
  };
}

/** Percentile (0–100) of `value`, honoring the same unisex-envelope rule. */
export function percentileForValue(
  measure: GrowthMeasure,
  sex: GrowthSexInput,
  months: number,
  value: number,
): number {
  if (sex !== 'unisex') return percentileForValueSingleSex(measure, sex, months, value);
  const boy = percentileForValueSingleSex(measure, 'male', months, value);
  const girl = percentileForValueSingleSex(measure, 'female', months, value);
  return (boy + girl) / 2;
}

export { MAX_MONTHS };
