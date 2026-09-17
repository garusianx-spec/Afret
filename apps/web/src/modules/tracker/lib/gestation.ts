import type { GestationalOverride, UserProfile } from '@/types';

const MS_PER_DAY = 86_400_000;
/** Naegele's rule baseline: 280 days from the first day of the LMP. */
export const TERM_DAYS = 280;

export interface GestationalAge {
  /** Whole weeks completed. */
  weeks: number;
  /** Days into the current week, 0–6. */
  days: number;
  /** Total days since conception baseline. */
  totalDays: number;
  /** 0 → 1 across the 40-week span, clamped. */
  progress: number;
  trimester: 1 | 2 | 3;
  dueDate: Date;
  /** Negative once the due date has passed. */
  daysRemaining: number;
  /** Which input the calculation came from — surfaced in the UI. */
  basis: 'override' | 'lmp' | 'dueDate';
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function diffDays(from: Date, to: Date): number {
  return Math.floor(
    (startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY,
  );
}

function assemble(
  totalDays: number,
  basis: GestationalAge['basis'],
  today: Date,
): GestationalAge {
  const clampedTotal = Math.max(0, totalDays);
  const weeks = Math.floor(clampedTotal / 7);
  const days = clampedTotal % 7;

  const dueDate = new Date(
    startOfUtcDay(today).getTime() + (TERM_DAYS - clampedTotal) * MS_PER_DAY,
  );

  return {
    weeks,
    days,
    totalDays: clampedTotal,
    progress: Math.min(1, clampedTotal / TERM_DAYS),
    // ACOG boundaries: T1 ends after 13w6d, T2 after 27w6d.
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    dueDate,
    daysRemaining: TERM_DAYS - clampedTotal,
    basis,
  };
}

/**
 * Gestational age from a clinician's measurement.
 *
 * A first-trimester dating ultrasound or an NT scan is more reliable than a
 * remembered LMP — irregular cycles and late ovulation shift the LMP estimate
 * by a week or more — so whenever an override exists it wins outright.
 */
export function gestationFromOverride(
  override: GestationalOverride,
  today = new Date(),
): GestationalAge {
  const measuredDays = override.weeks * 7 + override.days;
  const elapsed = diffDays(new Date(override.measuredOn), today);
  return assemble(measuredDays + elapsed, 'override', today);
}

/** Gestational age from the first day of the last menstrual period. */
export function gestationFromLmp(lmp: string | Date, today = new Date()): GestationalAge {
  return assemble(diffDays(new Date(lmp), today), 'lmp', today);
}

/** Back-calculate from an EDD the clinician supplied directly. */
export function gestationFromDueDate(
  dueDate: string | Date,
  today = new Date(),
): GestationalAge {
  const remaining = diffDays(today, new Date(dueDate));
  return assemble(TERM_DAYS - remaining, 'dueDate', today);
}

/**
 * The single entry point the UI uses. Precedence is deliberate:
 * clinical override → explicit due date → LMP.
 */
export function resolveGestation(
  profile: Pick<UserProfile, 'gestationalOverride' | 'dueDate' | 'lmpDate'>,
  today = new Date(),
): GestationalAge | null {
  if (profile.gestationalOverride) {
    return gestationFromOverride(profile.gestationalOverride, today);
  }
  if (profile.dueDate) return gestationFromDueDate(profile.dueDate, today);
  if (profile.lmpDate) return gestationFromLmp(profile.lmpDate, today);
  return null;
}

/** EDD implied by an override, for the «تاریخ زایمان اصلاح‌شده» row. */
export function dueDateFromOverride(override: GestationalOverride): Date {
  const measuredDays = override.weeks * 7 + override.days;
  return new Date(
    startOfUtcDay(new Date(override.measuredOn)).getTime() +
      (TERM_DAYS - measuredDays) * MS_PER_DAY,
  );
}

export const OVERRIDE_SOURCE_LABELS: Record<GestationalOverride['source'], string> = {
  ultrasound: 'سونوگرافی تعیین سن',
  nt: 'غربالگری NT',
  ivf: 'تاریخ انتقال جنین (IVF)',
  clinician: 'نظر پزشک',
};
