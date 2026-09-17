'use client';

import { useState } from 'react';
import { Check, Stethoscope } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui';
import { jalaliLong } from '@/lib/jalali';
import { toFaDigits } from '@/lib/persian';
import { cn } from '@/lib/utils';

import { consumedMacros } from '../lib/search';
import { MEAL_LABELS, type Macros, type MealPlan } from '../types';

/**
 * Renders a clinician-prescribed plan. The mother ticks meals off; macro
 * totals update against the prescribed targets.
 */
export function MealPlanView({ plan }: { plan: MealPlan }) {
  const [eaten, setEaten] = useState<Record<string, boolean>>({});

  const withState: MealPlan = {
    ...plan,
    meals: plan.meals.map((meal) => ({ ...meal, eaten: eaten[meal.slot] })),
  };
  const consumed = consumedMacros(withState);

  return (
    <>
      <Card>
        <CardTitle>خلاصهٔ امروز</CardTitle>
        <div className="grid grid-cols-4 gap-2">
          <MacroBar label="کالری" value={consumed.kcal} target={plan.targets.kcal} unit="" />
          <MacroBar label="پروتئین" value={consumed.proteinG} target={plan.targets.proteinG} unit="گ" />
          <MacroBar label="کربوهیدرات" value={consumed.carbsG} target={plan.targets.carbsG} unit="گ" />
          <MacroBar label="چربی" value={consumed.fatG} target={plan.targets.fatG} unit="گ" />
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-primary/8 p-2.5 text-[11px] leading-5 text-ink">
          <Stethoscope className="mt-0.5 size-3.5 shrink-0 text-primary-deep" aria-hidden="true" />
          <span>
            {plan.prescribedBy} · {jalaliLong(plan.prescribedOn)}
            {plan.note ? <> — {plan.note}</> : null}
          </span>
        </p>
      </Card>

      {plan.meals.map((meal) => {
        const done = Boolean(eaten[meal.slot]);
        const mealMacros = meal.items.reduce<Macros>(
          (acc, item) => ({
            kcal: acc.kcal + item.macros.kcal,
            proteinG: acc.proteinG + item.macros.proteinG,
            carbsG: acc.carbsG + item.macros.carbsG,
            fatG: acc.fatG + item.macros.fatG,
          }),
          { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        );

        return (
          <Card key={meal.slot} className={cn(done && 'opacity-70')}>
            <CardTitle
              action={
                <button
                  type="button"
                  aria-pressed={done}
                  onClick={() =>
                    setEaten((prev) => ({ ...prev, [meal.slot]: !prev[meal.slot] }))
                  }
                  className={cn(
                    'afrat-tap flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium transition',
                    done ? 'bg-mint text-white' : 'bg-surface text-ink-muted',
                  )}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  {done ? 'خورده شد' : 'ثبت مصرف'}
                </button>
              }
            >
              {MEAL_LABELS[meal.slot]} · {toFaDigits(meal.time)}
            </CardTitle>

            <ul className="flex flex-col gap-2">
              {meal.items.map((item) => (
                <li key={item.id} className="rounded-xl bg-surface p-3">
                  <p className="text-sm text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{item.portion}</p>
                  <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                    {toFaDigits(item.macros.kcal)} کیلوکالری ·{' '}
                    {toFaDigits(item.macros.proteinG)} گرم پروتئین
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-end text-[11px] font-medium text-primary-deep tabular-nums">
              مجموع: {toFaDigits(mealMacros.kcal)} کیلوکالری
            </p>
          </Card>
        );
      })}
    </>
  );
}

function MacroBar({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;

  return (
    <div>
      <div
        className="h-16 w-full overflow-hidden rounded-xl bg-surface"
        role="img"
        aria-label={`${label}: ${toFaDigits(Math.round(value))} از ${toFaDigits(target)}`}
      >
        <div className="flex h-full flex-col justify-end">
          <div
            className="bg-primary/70 transition-[height] duration-500"
            style={{ height: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] text-ink-muted">{label}</p>
      <p className="text-center text-[10px] font-medium text-ink tabular-nums">
        {toFaDigits(Math.round(value))}/{toFaDigits(target)}
        {unit}
      </p>
    </div>
  );
}
