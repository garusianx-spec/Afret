'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { SectionTitle } from '@/components/ui';
import { useHydrated } from '@/hooks/useHydrated';
import { FoodSafetySearch } from '@/modules/nutrition/components/FoodSafetySearch';
import { MealPlanView } from '@/modules/nutrition/components/MealPlanView';
import { NutrientFocusCard } from '@/modules/nutrition/components/NutrientFocusCard';
import { SAMPLE_MEAL_PLAN } from '@/modules/nutrition/data/sampleMealPlan';
import { resolveGestation } from '@/modules/tracker/lib/gestation';
import { useUserStore } from '@/stores/userStore';

export default function NutritionPage() {
  const hydrated = useHydrated();
  const profile = useUserStore((s) => s.profile);

  if (!hydrated || !profile) {
    return (
      <main className="afrat-page pt-6" aria-busy="true">
        <div className="h-64 animate-pulse rounded-card bg-surface-card" />
      </main>
    );
  }

  const gestation = resolveGestation(profile);

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
