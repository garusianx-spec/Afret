'use client';

import { Baby, Droplets, HeartPulse, Sparkles, Thermometer } from 'lucide-react';

import { Chip } from '@/components/ui';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { jalaliLong } from '@/lib/jalali';
import { formatBabyAge, formatGestational, toFaDigits } from '@/lib/persian';
import { babyAge, resolveCycle, PHASE_LABELS } from '@/modules/tracker/lib/cycle';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import { weeklyEntryFor } from '@/modules/tracker/data/weeklyContent';
import type { UserProfile } from '@/types';

/**
 * The hero swaps entirely with the user's lifecycle mode — a mother tracking
 * a cycle and a mother at 32 weeks need completely different first screens.
 */
export function TodayHero({ profile }: { profile: UserProfile }) {
  switch (profile.mode) {
    case 'pregnancy':
      return <PregnancyHero profile={profile} />;
    case 'postpartum':
      return <BabyHero profile={profile} />;
    case 'ttc':
      return <FertilityHero profile={profile} />;
    case 'cycle':
    default:
      return <CycleHero profile={profile} />;
  }
}

function HeroShell({
  children,
  tint = 'primary',
}: {
  children: React.ReactNode;
  tint?: 'primary' | 'coral' | 'mint';
}) {
  const gradient = {
    primary: 'from-primary/18 to-primary/5',
    coral: 'from-coral/25 to-coral/5',
    mint: 'from-mint/20 to-mint/5',
  }[tint];

  return (
    <section
      className={`afrat-card bg-gradient-to-bl ${gradient} p-5`}
      aria-label="وضعیت امروز"
    >
      {children}
    </section>
  );
}

function PregnancyHero({ profile }: { profile: UserProfile }) {
  const gestation = resolveGestation(profile);

  if (!gestation) {
    return (
      <HeroShell tint="coral">
        <p className="text-sm leading-7 text-ink">
          برای شروع، تاریخ اولین روز آخرین قاعدگی یا نتیجهٔ سونوگرافی را ثبت کنید.
        </p>
      </HeroShell>
    );
  }

  const entry = weeklyEntryFor(gestation.weeks);

  return (
    <HeroShell tint="coral">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={gestation.progress}
          size={92}
          label={`پیشرفت بارداری: ${formatGestational(gestation.weeks, gestation.days)}`}
        >
          <span className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-primary-deep">
              {toFaDigits(gestation.weeks)}
            </span>
            <span className="text-[10px] text-ink-muted">هفته</span>
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">
            {formatGestational(gestation.weeks, gestation.days)}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            سه‌ماههٔ {toFaDigits(gestation.trimester)} · اندازهٔ جنین: {entry.size}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="primary">
              <HeartPulse className="size-3.5" aria-hidden="true" />
              {gestation.daysRemaining >= 0
                ? `${toFaDigits(gestation.daysRemaining)} روز تا زایمان`
                : `${toFaDigits(Math.abs(gestation.daysRemaining))} روز از موعد گذشته`}
            </Chip>
            {gestation.basis === 'override' ? (
              <Chip tone="mint">بر پایهٔ سونوگرافی</Chip>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-surface-card/70 p-3 text-xs leading-6 text-ink">
        <span className="font-bold text-primary-deep">تاریخ تقریبی زایمان: </span>
        {jalaliLong(gestation.dueDate)}
      </p>
    </HeroShell>
  );
}

function BabyHero({ profile }: { profile: UserProfile }) {
  if (!profile.baby) {
    return (
      <HeroShell tint="mint">
        <p className="text-sm leading-7 text-ink">
          تاریخ تولد نوزاد را ثبت کنید تا نمودار رشد و واکسن‌ها فعال شوند.
        </p>
      </HeroShell>
    );
  }

  const age = babyAge(profile.baby.birthDate);
  // Two years is the milestone horizon the app covers.
  const progress = Math.min(1, age.totalDays / 730);

  return (
    <HeroShell tint="mint">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={progress}
          size={92}
          label={`سن نوزاد: ${formatBabyAge(age.months)}`}
        >
          <Baby className="size-8 text-mint" aria-hidden="true" />
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">{profile.baby.name}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatBabyAge(age.months)}
            {age.days > 0 ? ` و ${toFaDigits(age.days)} روز` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="mint">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {toFaDigits(age.totalDays)} روز با هم
            </Chip>
          </div>
        </div>
      </div>
    </HeroShell>
  );
}

function CycleHero({ profile }: { profile: UserProfile }) {
  const cycle = resolveCycle(profile);

  if (!cycle) {
    return (
      <HeroShell>
        <p className="text-sm leading-7 text-ink">
          اولین روز آخرین قاعدگی خود را ثبت کنید تا پیش‌بینی چرخه آغاز شود.
        </p>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      <div className="flex items-center gap-4">
        <ProgressRing
          value={cycle.progress}
          size={92}
          label={`روز ${toFaDigits(cycle.day)} از چرخه`}
        >
          <span className="flex flex-col leading-tight">
            <span className="text-2xl font-bold text-primary-deep">
              {toFaDigits(cycle.day)}
            </span>
            <span className="text-[10px] text-ink-muted">روز چرخه</span>
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">
            فاز {PHASE_LABELS[cycle.phase]}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            قاعدگی بعدی: {jalaliLong(cycle.nextPeriodDate)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone={cycle.isFertileToday ? 'mint' : 'primary'}>
              <Droplets className="size-3.5" aria-hidden="true" />
              {cycle.isFertileToday
                ? 'امروز در پنجرهٔ باروری هستید'
                : `${toFaDigits(Math.max(0, cycle.daysUntilNextPeriod))} روز مانده`}
            </Chip>
          </div>
        </div>
      </div>
    </HeroShell>
  );
}

/**
 * Mode B (TTC) hero. Kept separate from `CycleHero` rather than branching
 * inside it: the fertile window is the whole point of this screen, not a
 * secondary chip, so it gets its own layout with the window as the headline.
 */
function FertilityHero({ profile }: { profile: UserProfile }) {
  const cycle = resolveCycle(profile);

  if (!cycle) {
    return (
      <HeroShell tint="mint">
        <p className="text-sm leading-7 text-ink">
          اولین روز آخرین قاعدگی خود را ثبت کنید تا پنجرهٔ باروری محاسبه شود.
        </p>
      </HeroShell>
    );
  }

  return (
    <HeroShell tint="mint">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={cycle.progress}
          size={92}
          label={`روز ${toFaDigits(cycle.day)} از چرخه`}
        >
          {cycle.isFertileToday ? (
            <Droplets className="size-8 text-mint" aria-hidden="true" />
          ) : (
            <span className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-primary-deep">
                {toFaDigits(cycle.day)}
              </span>
              <span className="text-[10px] text-ink-muted">روز چرخه</span>
            </span>
          )}
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">
            {cycle.isFertileToday ? 'امروز روز پرباروری است' : `فاز ${PHASE_LABELS[cycle.phase]}`}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            پنجرهٔ باروری: {jalaliLong(cycle.fertileWindow.start)} تا{' '}
            {jalaliLong(cycle.fertileWindow.end)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="mint">
              <Thermometer className="size-3.5" aria-hidden="true" />
              تخمک‌گذاری: {jalaliLong(cycle.ovulationDate)}
            </Chip>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-surface-card/70 p-3 text-xs leading-6 text-ink">
        <span className="font-bold text-primary-deep">نکتهٔ زوجین: </span>
        نزدیکی هر یک تا دو روز در طول پنجرهٔ باروری، شانس باروری را در بالاترین
        حد نگه می‌دارد.
      </p>
    </HeroShell>
  );
}
