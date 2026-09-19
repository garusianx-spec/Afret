/**
 * Domain types for the WHO Child Growth Standards engine.
 *
 * Source: WHO Multicentre Growth Reference Study (2006), LMS parameters as
 * redistributed by the WorldHealthOrganization/anthro reference
 * implementation (weianthro.txt, lenanthro.txt — weight-for-age and
 * length-for-age, birth to 24 months, one row per day of age).
 */

export type BiologicalSex = 'male' | 'female';

/** 'unisex' blends both sex curves into a single wider envelope band. */
export type GrowthSexInput = BiologicalSex | 'unisex';

export type GrowthMeasure = 'weightKg' | 'lengthCm';

/** Box-Cox power (L), median (M), coefficient of variation (S) at one age point. */
export type LmsTuple = readonly [l: number, m: number, s: number];

export interface LmsPoint {
  l: number;
  m: number;
  s: number;
}

/** The five percentile curves the chart plots, in kg or cm depending on measure. */
export interface PercentileBand {
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}
