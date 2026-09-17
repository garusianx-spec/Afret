import { toEnDigits } from '@/lib/persian';

import { FOOD_SAFETY } from '../data/foodSafety';
import type { FoodSafetyEntry, MealPlan, Macros, SafetyVerdict } from '../types';

/**
 * Normalise Persian text for search.
 *
 * Users type Arabic ya/kaf (ي/ك) as often as the Persian ones (ی/ک), and
 * keyboards insert zero-width non-joiners inconsistently — «می‌خورم» vs
 * «میخورم». Without folding these, half the queries silently miss.
 */
export function normalizeFa(input: string): string {
  return toEnDigits(input)
    .replace(/[يى]/g, 'ی') // ي / ى → ی
    .replace(/ك/g, 'ک') // ك → ک
    .replace(/[ً-ْٰ]/g, '') // harakat
    .replace(/[‌‏‎]/g, '') // ZWNJ / directional marks
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface SafetyResult {
  entry: FoodSafetyEntry;
  score: number;
}

/** Ranked lookup: exact name, then prefix, then alias, then substring. */
export function searchFoodSafety(query: string, limit = 12): SafetyResult[] {
  const q = normalizeFa(query);
  if (!q) return [];

  const results: SafetyResult[] = [];

  for (const entry of FOOD_SAFETY) {
    const name = normalizeFa(entry.name);
    const aliases = entry.aliases.map(normalizeFa);

    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (aliases.some((a) => a === q)) score = 75;
    else if (aliases.some((a) => a.startsWith(q))) score = 60;
    else if (name.includes(q)) score = 45;
    else if (aliases.some((a) => a.includes(q))) score = 35;
    else if (normalizeFa(entry.category).includes(q)) score = 20;

    if (score > 0) results.push({ entry, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const VERDICT_LABELS: Record<SafetyVerdict, string> = {
  safe: 'مجاز',
  caution: 'با احتیاط',
  avoid: 'پرهیز کنید',
};

/** Sum the macros of everything marked as eaten. */
export function consumedMacros(plan: MealPlan): Macros {
  return plan.meals
    .filter((meal) => meal.eaten)
    .flatMap((meal) => meal.items)
    .reduce<Macros>(
      (acc, item) => ({
        kcal: acc.kcal + item.macros.kcal,
        proteinG: acc.proteinG + item.macros.proteinG,
        carbsG: acc.carbsG + item.macros.carbsG,
        fatG: acc.fatG + item.macros.fatG,
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
}

/** Total macros the plan prescribes for the day. */
export function plannedMacros(plan: MealPlan): Macros {
  return plan.meals
    .flatMap((meal) => meal.items)
    .reduce<Macros>(
      (acc, item) => ({
        kcal: acc.kcal + item.macros.kcal,
        proteinG: acc.proteinG + item.macros.proteinG,
        carbsG: acc.carbsG + item.macros.carbsG,
        fatG: acc.fatG + item.macros.fatG,
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
}
