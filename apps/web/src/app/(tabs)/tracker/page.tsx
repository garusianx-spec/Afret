'use client';

import { CalendarHeart } from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { useHydrated } from '@/hooks/useHydrated';
import { jalaliLong } from '@/lib/jalali';
import { useAuth } from '@/modules/auth';
import { ClinicianNotice } from '@/modules/doctor/components/ClinicianNotice';
import { PeriodTrackerContent } from '@/modules/tracker/components/tracker-content/PeriodTrackerContent';
import { PostpartumTrackerContent } from '@/modules/tracker/components/tracker-content/PostpartumTrackerContent';
import { PregnancyTrackerContent } from '@/modules/tracker/components/tracker-content/PregnancyTrackerContent';
import { TtcTrackerContent } from '@/modules/tracker/components/tracker-content/TtcTrackerContent';
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
