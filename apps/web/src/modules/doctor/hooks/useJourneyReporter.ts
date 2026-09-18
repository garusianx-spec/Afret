'use client';

import { useEffect, useRef } from 'react';

import { babyAge, resolveCycle } from '@/modules/tracker/lib/cycle';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import type { UserProfile } from '@/types';

import { reportJourney } from '../api/doctorApi';

/** A single number a doctor's patient list can show next to a stage label. */
function currentWeek(profile: UserProfile): number | undefined {
  switch (profile.mode) {
    case 'pregnancy':
      return resolveGestation(profile)?.weeks;
    case 'postpartum':
      return profile.baby ? babyAge(profile.baby.birthDate).months : undefined;
    case 'cycle':
    case 'ttc':
      return resolveCycle(profile)?.day;
    default:
      return undefined;
  }
}

/**
 * Keeps the server's one-line picture of "where is this mother in her
 * journey" in sync with what she has told the app locally.
 *
 * This is the *only* thing about a mother's health that leaves her device —
 * a stage label and a number, not glucose readings or blood pressure. It
 * exists so a doctor's patient list can show "بارداری · هفته ۱۸" without the
 * app needing any server-side health-metric storage at all.
 */
export function useJourneyReporter(profile: UserProfile | null): void {
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const week = currentWeek(profile);
    const signature = `${profile.mode}:${week ?? ''}`;
    if (signature === lastSent.current) return;

    lastSent.current = signature;
    void reportJourney(profile.mode, week).catch(() => {
      // Best-effort: a mother's own tabs must never fail to render because
      // this background sync call didn't land. It retries next time
      // anything relevant changes, or on the next app open.
      lastSent.current = null;
    });
  }, [profile]);
}
