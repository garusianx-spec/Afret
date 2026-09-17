'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardTitle, Chip, SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { jalaliLong } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { GestationOverrideCard } from '@/modules/tracker/components/GestationOverrideCard';
import {
  BloodPressureLogger,
  GlucoseLogger,
  MoodAndNauseaLogger,
  WeightLogger,
} from '@/modules/tracker/components/HealthLoggers';
import {
  MilestoneList,
  VaccineSchedule,
} from '@/modules/tracker/components/VaccineSchedule';
import { PHASE_LABELS, resolveCycle } from '@/modules/tracker/lib/cycle';
import { useUserStore } from '@/stores/userStore';

export default function TrackerPage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);

  if (!hydrated || !profile) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  const pregnant = profile.mode === 'pregnancy';
  const postpartum = profile.mode === 'postpartum';

  return (
    <>
      <AppHeader title="تقویم و ردیاب" subtitle={jalaliLong(new Date())} />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        {pregnant ? <GestationOverrideCard /> : <CycleCard />}

        <SectionTitle>ثبت روزانه</SectionTitle>
        <WeightLogger />
        {pregnant ? <GlucoseLogger /> : null}
        <BloodPressureLogger />
        <MoodAndNauseaLogger />

        {postpartum && profile.baby ? (
          <>
            <SectionTitle>نوزاد</SectionTitle>
            <VaccineSchedule baby={profile.baby} />
            <MilestoneList baby={profile.baby} />
          </>
        ) : null}
      </main>
    </>
  );
}

function CycleCard() {
  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const cycle = profile ? resolveCycle(profile) : null;

  return (
    <Card id="cycle">
      <CardTitle
        action={
          cycle ? <Chip tone="primary">{PHASE_LABELS[cycle.phase]}</Chip> : null
        }
      >
        چرخهٔ قاعدگی
      </CardTitle>

      {cycle ? (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <Stat term="روز چرخه" value={toFaDigits(cycle.day)} />
          <Stat term="طول چرخه" value={`${toFaDigits(cycle.cycleLength)} روز`} />
          <Stat term="قاعدگی بعدی" value={jalaliLong(cycle.nextPeriodDate)} />
          <Stat term="تخمک‌گذاری" value={jalaliLong(cycle.ovulationDate)} />
          <div className="col-span-2 rounded-xl bg-mint-soft p-3 text-xs leading-6 text-ink">
            پنجرهٔ باروری: {jalaliLong(cycle.fertileWindow.start)} تا{' '}
            {jalaliLong(cycle.fertileWindow.end)}
          </div>
        </dl>
      ) : (
        <p className="text-sm leading-7 text-ink-muted">
          برای فعال شدن پیش‌بینی، اولین روز آخرین قاعدگی را ثبت کنید.
        </p>
      )}

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">
          اولین روز آخرین قاعدگی (میلادی)
        </span>
        <input
          type="date"
          value={profile?.lmpDate ?? ''}
          onChange={(event) => patchProfile({ lmpDate: event.target.value })}
          className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </label>
    </Card>
  );
}

function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <dt className="text-[11px] text-ink-muted">{term}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
