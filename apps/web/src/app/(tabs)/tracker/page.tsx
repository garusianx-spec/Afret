'use client';

import { CalendarPlus, Waves } from 'lucide-react';

import { CalendarHeart } from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardTitle, Chip, SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { jalaliLong, jalaliShort } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { useAuth } from '@/modules/auth';
import { ClinicianNotice } from '@/modules/doctor/components/ClinicianNotice';
import {
  BbtLogger,
  CervicalMucusLogger,
  KickCounter,
} from '@/modules/tracker/components/FertilityLoggers';
import { GestationOverrideCard } from '@/modules/tracker/components/GestationOverrideCard';
import { GrowthChart } from '@/modules/tracker/components/GrowthChart';
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
import {
  cycleLengthHistory,
  usePeriodLogStore,
} from '@/modules/tracker/store/periodLogStore';
import { useUserStore } from '@/stores/userStore';

export default function TrackerPage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return (
      <ClinicianNotice
        title="تقویم و ردیاب"
        icon={CalendarHeart}
        message="این بخش برای ثبت چرخه، بارداری یا رشد نوزاد طراحی شده و برای حساب پزشک کاربردی ندارد. برای بررسی وضعیت بیماران خود، به لیست مراجعین بروید."
      />
    );
  }

  if (!hydrated || !profile) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  return (
    <>
      <AppHeader title="تقویم و ردیاب" subtitle={jalaliLong(new Date())} />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        {profile.mode === 'cycle' ? <PeriodTrackerContent /> : null}
        {profile.mode === 'ttc' ? <TtcTrackerContent /> : null}
        {profile.mode === 'pregnancy' ? <PregnancyTrackerContent /> : null}
        {profile.mode === 'postpartum' ? <PostpartumTrackerContent /> : null}
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Mode A — عادی و پیگیری چرخه: تقویم قاعدگی، تاریخچهٔ طول چرخه، ثبت پریود.
 * عمداً بدون پیش‌بینی تخمک‌گذاری/پنجرهٔ باروری — آن‌ها مخصوص حالت TTC است.
 * ------------------------------------------------------------------ */
function PeriodTrackerContent() {
  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const cycle = profile ? resolveCycle(profile) : null;
  const entries = usePeriodLogStore((s) => s.entries);
  const logStart = usePeriodLogStore((s) => s.logStart);
  const history = cycleLengthHistory(entries);

  return (
    <>
      <Card id="cycle">
        <CardTitle
          action={cycle ? <Chip tone="primary">{PHASE_LABELS[cycle.phase]}</Chip> : null}
        >
          تقویم قاعدگی
        </CardTitle>

        {cycle ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Stat term="روز چرخه" value={toFaDigits(cycle.day)} />
            <Stat term="طول چرخهٔ متوسط" value={`${toFaDigits(cycle.cycleLength)} روز`} />
            <div className="col-span-2 rounded-xl bg-primary-100 p-3 text-xs leading-6 text-ink">
              پیش‌بینی قاعدگی بعدی: <strong>{jalaliLong(cycle.nextPeriodDate)}</strong>
            </div>
          </dl>
        ) : (
          <p className="text-sm leading-7 text-ink-muted">
            برای فعال شدن پیش‌بینی، اولین پریود خود را ثبت کنید.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            logStart(today);
            patchProfile({ lmpDate: today });
          }}
          className="afrat-tap mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-primary-deep px-4 py-2.5 text-sm font-bold text-white"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          ثبت شروع پریود امروز
        </button>
      </Card>

      <Card id="period-history">
        <CardTitle>تاریخچهٔ طول چرخه</CardTitle>
        {history.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {history.slice(0, 6).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs"
              >
                <span className="text-ink-muted">
                  {jalaliShort(h.from)} تا {jalaliShort(h.to)}
                </span>
                <Chip tone="neutral">{toFaDigits(h.days)} روز</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-faint">
            پس از ثبت دومین پریود، طول چرخه‌ها اینجا محاسبه می‌شود.
          </p>
        )}

        {entries.length > 0 ? (
          <>
            <p className="mb-1.5 mt-4 text-[11px] font-bold text-primary-deep">
              ثبت‌های پریود
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {entries.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Chip tone="coral">{jalaliShort(e.startDate)}</Chip>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Mode B — تلاش برای بارداری: پیش‌بینی تخمک‌گذاری، پنجرهٔ باروری، محاسبهٔ
 * فاز لوتئال، به‌علاوهٔ ثبت BBT و ترشحات دهانهٔ رحم.
 * ------------------------------------------------------------------ */
function TtcTrackerContent() {
  const profile = useUserStore((s) => s.profile);
  const patchProfile = useUserStore((s) => s.patchProfile);
  const cycle = profile ? resolveCycle(profile) : null;

  return (
    <>
      <Card id="fertility">
        <CardTitle
          action={
            cycle?.isFertileToday ? (
              <Chip tone="mint">
                <Waves className="size-3.5" aria-hidden="true" />
                امروز باروری بالاست
              </Chip>
            ) : cycle ? (
              <Chip tone="primary">{PHASE_LABELS[cycle.phase]}</Chip>
            ) : null
          }
        >
          پیش‌بینی باروری
        </CardTitle>

        {cycle ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Stat term="روز چرخه" value={toFaDigits(cycle.day)} />
            <Stat term="تخمک‌گذاری" value={jalaliLong(cycle.ovulationDate)} />
            <div className="col-span-2 rounded-xl bg-mint-soft p-3 text-xs leading-6 text-ink">
              پنجرهٔ باروری: {jalaliLong(cycle.fertileWindow.start)} تا{' '}
              {jalaliLong(cycle.fertileWindow.end)}
            </div>
            <div className="col-span-2 rounded-xl bg-surface p-3 text-xs leading-6 text-ink-muted">
              فاز لوتئال (تخمین): ۱۴ روز پس از تخمک‌گذاری — قاعدگی بعدی{' '}
              {jalaliLong(cycle.nextPeriodDate)}
            </div>
          </dl>
        ) : (
          <p className="text-sm leading-7 text-ink-muted">
            برای پیش‌بینی پنجرهٔ باروری، اولین روز آخرین قاعدگی را ثبت کنید.
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

      <BbtLogger />
      <CervicalMucusLogger />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Mode C — بارداری: سن بارداری (LMP یا سونوگرافی)، قند خون، فشار خون، وزن،
 * شمارش حرکات جنین.
 * ------------------------------------------------------------------ */
function PregnancyTrackerContent() {
  return (
    <>
      <GestationOverrideCard />

      <SectionTitle>ثبت روزانه</SectionTitle>
      <WeightLogger />
      <GlucoseLogger />
      <BloodPressureLogger />
      <MoodAndNauseaLogger />
      <KickCounter />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Mode D — والدگری و نوزاد: نمودار رشد (صدک تقریبی)، برنامهٔ واکسیناسیون.
 * ------------------------------------------------------------------ */
function PostpartumTrackerContent() {
  const baby = useUserStore((s) => s.profile?.baby);

  if (!baby) {
    return (
      <Card>
        <CardTitle>اطلاعات نوزاد</CardTitle>
        <p className="text-sm leading-7 text-ink-muted">
          برای فعال شدن نمودار رشد و برنامهٔ واکسیناسیون، نام و تاریخ تولد
          نوزاد را از «حساب و ابزارها» ثبت کنید.
        </p>
      </Card>
    );
  }

  return (
    <>
      <GrowthChart baby={baby} />
      <VaccineSchedule baby={baby} />
      <MilestoneList baby={baby} />
    </>
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
