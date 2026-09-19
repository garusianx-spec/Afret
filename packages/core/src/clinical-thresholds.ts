/**
 * Pure prenatal screening thresholds, shared by the mother's own tracker
 * (apps/web) and the doctor's alert badges (apps/realtime). One set of
 * numbers, so the flag a doctor sees always means the same thing the mother
 * saw when she logged the reading.
 *
 * These are screening heuristics for a self-care app, not a diagnostic
 * tool — every "urgent" tier tells the user to contact her clinician, never
 * to self-treat.
 */

export type RiskTier = 'normal' | 'watch' | 'urgent';

export type GlucoseContext = 'fasting' | 'oneHour' | 'twoHour';

/** ACOG/ADA-aligned glucose targets in pregnancy (mg/dL). */
export const GLUCOSE_TARGETS: Record<GlucoseContext, { max: number; label: string }> = {
  fasting: { max: 95, label: 'ناشتا' },
  oneHour: { max: 140, label: '۱ ساعت پس از غذا' },
  twoHour: { max: 120, label: '۲ ساعت پس از غذا' },
};

export function isGlucoseHigh(value: number, context: GlucoseContext): boolean {
  return value > GLUCOSE_TARGETS[context].max;
}

/**
 * Gestational-diabetes screening tier for one reading. "Urgent" is a
 * substantial, repeated-pattern-worthy excess over target — a single
 * borderline reading stays at "watch".
 */
export function gdmRisk(value: number, context: GlucoseContext): RiskTier {
  const target = GLUCOSE_TARGETS[context].max;
  if (value >= target + 20) return 'urgent';
  if (value > target) return 'watch';
  return 'normal';
}

/** Mother-facing 3-tier chip — kept coarse and reassuring by default. */
export function bloodPressureFlag(
  systolic: number,
  diastolic: number,
): 'normal' | 'elevated' | 'high' {
  if (systolic >= 140 || diastolic >= 90) return 'high';
  if (systolic >= 130 || diastolic >= 85) return 'elevated';
  return 'normal';
}

/**
 * Pre-eclampsia screening tier for the doctor's alert badge. Severe-range
 * hypertension (ACOG: ≥160/110) is flagged "urgent"; the standard
 * pregnancy-hypertension threshold (≥140/90) is "watch".
 */
export function preeclampsiaRisk(systolic: number, diastolic: number): RiskTier {
  if (systolic >= 160 || diastolic >= 110) return 'urgent';
  if (systolic >= 140 || diastolic >= 90) return 'watch';
  return 'normal';
}

/** Combines several tiers into the single worst one — for a summary badge. */
export function worstTier(tiers: RiskTier[]): RiskTier {
  if (tiers.includes('urgent')) return 'urgent';
  if (tiers.includes('watch')) return 'watch';
  return 'normal';
}
