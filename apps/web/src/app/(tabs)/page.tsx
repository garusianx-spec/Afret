'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { jalaliWithWeekday } from '@/lib/jalali';
import { useAuth } from '@/modules/auth';
import { DoctorHome } from '@/modules/doctor/components/DoctorHome';
import { useJourneyReporter } from '@/modules/doctor/hooks/useJourneyReporter';
import { DailyChecklist } from '@/modules/home/components/DailyChecklist';
import { DailyMessage } from '@/modules/home/components/DailyMessage';
import { QuickActions } from '@/modules/home/components/QuickActions';
import { TodayHero } from '@/modules/home/components/TodayHero';
import { useUserStore } from '@/stores/userStore';
import { LIFECYCLE_LABELS } from '@/types';

export default function HomePage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);
  const { user } = useAuth();

  // Keeps the server's one-line "where is she in her journey" in step with
  // this device's local state — see the hook for what it does and doesn't
  // send. Runs unconditionally (mode-less for a doctor, a no-op) so hook
  // order never depends on the role branch below.
  useJourneyReporter(user?.role === 'doctor' ? null : (profile ?? null));

  // A clinician has no cycle or pregnancy of her own — the mother-facing
  // dashboard below would just be empty state for her. She gets her own
  // Home entirely: the patient list.
  if (user?.role === 'doctor') return <DoctorHome displayName={user.fullName ?? 'دکتر'} />;

  if (!hydrated || !profile) return <HomeSkeleton />;

  return (
    <>
      <AppHeader
        title={`سلام، ${profile.displayName}`}
        subtitle={jalaliWithWeekday(new Date())}
      />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        <InstallPrompt />
        <TodayHero profile={profile} />
        <DailyMessage profile={profile} />

        <SectionTitle hint={LIFECYCLE_LABELS[profile.mode]}>دسترسی سریع</SectionTitle>
        <QuickActions mode={profile.mode} />

        <SectionTitle>برنامهٔ روزانه</SectionTitle>
        <DailyChecklist mode={profile.mode} />
      </main>
    </>
  );
}

function HomeSkeleton() {
  return (
    <main className="afrat-page flex flex-col gap-3 pt-6" aria-busy="true">
      <span className="sr-only">در حال بارگذاری</span>
      <div className="h-40 animate-pulse rounded-card bg-surface-card" />
      <div className="h-24 animate-pulse rounded-card bg-surface-card" />
      <div className="h-56 animate-pulse rounded-card bg-surface-card" />
    </main>
  );
}
