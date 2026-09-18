'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { useAuth } from '@/modules/auth';
import { FoodSafetySearch } from '@/modules/nutrition/components/FoodSafetySearch';
import { MealPlanView } from '@/modules/nutrition/components/MealPlanView';
import { NutrientFocusCard } from '@/modules/nutrition/components/NutrientFocusCard';
import { SAMPLE_MEAL_PLAN } from '@/modules/nutrition/data/sampleMealPlan';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import { useUserStore } from '@/stores/userStore';

export default function NutritionPage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  if (!isDoctor && (!hydrated || !profile)) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  // A doctor has no personal meal plan or gestational week — but the food
  // safety database is a genuinely useful reference during a consult, so
  // her Nutrition tab keeps that tool and drops the personal content.
  if (isDoctor) {
    return (
      <>
        <AppHeader title="رژیم و تغذیه" subtitle="مرجع ایمنی خوراکی‌ها برای مشاوره" />
        <main className="afrat-page flex flex-col gap-3 pt-3">
          <FoodSafetySearch />
        </main>
      </>
    );
  }

  const gestation = profile ? resolveGestation(profile) : null;

  return (
    <>
      <AppHeader
        title="رژیم و تغذیه"
        subtitle="برنامهٔ تجویزی و راهنمای ایمنی خوراکی‌ها"
      />

      <main className="afrat-page flex flex-col gap-3 pt-3">
        {gestation ? <NutrientFocusCard week={gestation.weeks} /> : null}

        <SectionTitle>برنامهٔ غذایی امروز</SectionTitle>
        <MealPlanView plan={SAMPLE_MEAL_PLAN} />

        <SectionTitle>ایمنی خوراکی‌ها</SectionTitle>
        <FoodSafetySearch />
      </main>
    </>
  );
}
