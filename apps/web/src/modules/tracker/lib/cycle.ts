import type { UserProfile } from '@/types';

const MS_PER_DAY = 86_400_000;

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'قاعدگی',
  follicular: 'فولیکولی',
  ovulation: 'تخمک‌گذاری',
  luteal: 'لوتئال',
};

export interface CycleStatus {
  /** 1-based day within the current cycle. */
  day: number;
  cycleLength: number;
  phase: CyclePhase;
  /** 0 → 1 through the cycle. */
  progress: number;
  nextPeriodDate: Date;
  daysUntilNextPeriod: number;
  ovulationDate: Date;
  /** Six-day window ending on ovulation day — the classic fertile window. */
  fertileWindow: { start: Date; end: Date };
  isFertileToday: boolean;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Calendar-based prediction.
 *
 * The luteal phase is the stable part of the cycle (~14 days), so ovulation is
 * estimated backwards from the *next* period rather than forwards from the
 * last one. That keeps the estimate sane for cycles far from 28 days.
 */
export function resolveCycle(
  profile: Pick<UserProfile, 'lmpDate' | 'cycleLength' | 'periodLength'>,
  today = new Date(),
): CycleStatus | null {
  if (!profile.lmpDate) return null;

  const cycleLength = profile.cycleLength || 28;
  const periodLength = profile.periodLength || 5;
  const lutealLength = 14;

  const start = startOfUtcDay(new Date(profile.lmpDate));
  const now = startOfUtcDay(today);

  const elapsed = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY);
  if (elapsed < 0) return null;

  // Roll forward to the cycle the user is actually in.
  const cyclesElapsed = Math.floor(elapsed / cycleLength);
  const cycleStart = new Date(start.getTime() + cyclesElapsed * cycleLength * MS_PER_DAY);
  const day = Math.floor((now.getTime() - cycleStart.getTime()) / MS_PER_DAY) + 1;

  const nextPeriodDate = new Date(cycleStart.getTime() + cycleLength * MS_PER_DAY);
  const ovulationDate = new Date(nextPeriodDate.getTime() - lutealLength * MS_PER_DAY);

  const fertileStart = new Date(ovulationDate.getTime() - 5 * MS_PER_DAY);
  const fertileEnd = new Date(ovulationDate.getTime() + 1 * MS_PER_DAY);

  const ovulationDay =
    Math.floor((ovulationDate.getTime() - cycleStart.getTime()) / MS_PER_DAY) + 1;

  const phase: CyclePhase =
    day <= periodLength
      ? 'menstrual'
      : day >= ovulationDay - 1 && day <= ovulationDay + 1
        ? 'ovulation'
        : day < ovulationDay
          ? 'follicular'
          : 'luteal';

  return {
    day,
    cycleLength,
    phase,
    progress: Math.min(1, day / cycleLength),
    nextPeriodDate,
    daysUntilNextPeriod: Math.round(
      (nextPeriodDate.getTime() - now.getTime()) / MS_PER_DAY,
    ),
    ovulationDate,
    fertileWindow: { start: fertileStart, end: fertileEnd },
    isFertileToday: now >= fertileStart && now <= fertileEnd,
  };
}

/** Baby age in whole months + days, for the postpartum dashboard. */
export function babyAge(birthDate: string | Date, today = new Date()) {
  const birth = startOfUtcDay(new Date(birthDate));
  const now = startOfUtcDay(today);

  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;

  const anniversary = new Date(
    Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + months, birth.getUTCDate()),
  );
  const days = Math.floor((now.getTime() - anniversary.getTime()) / MS_PER_DAY);
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / MS_PER_DAY);

  return { months: Math.max(0, months), days: Math.max(0, days), totalDays };
}
