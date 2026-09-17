/** Verdict returned by the pregnancy food-safety lookup. */
export type SafetyVerdict = 'safe' | 'caution' | 'avoid';

export interface FoodSafetyEntry {
  id: string;
  name: string;
  /** Alternate spellings and colloquial names, for fuzzy search. */
  aliases: string[];
  category: string;
  verdict: SafetyVerdict;
  /** One-line rationale in plain Persian. */
  reason: string;
  /** Concrete limit when the verdict is `caution`. */
  limit?: string;
}

export type MealSlot =
  | 'breakfast'
  | 'midMorning'
  | 'lunch'
  | 'snack'
  | 'dinner';

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'صبحانه',
  midMorning: 'میان‌وعدهٔ صبح',
  lunch: 'ناهار',
  snack: 'عصرانه',
  dinner: 'شام',
};

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealItem {
  id: string;
  title: string;
  portion: string;
  macros: Macros;
}

export interface Meal {
  slot: MealSlot;
  /** Suggested clock time, e.g. `08:00`. */
  time: string;
  items: MealItem[];
  /** Ticked off by the mother during the day. */
  eaten?: boolean;
}

export interface MealPlan {
  id: string;
  /** Who prescribed it — Afrat never invents a clinical plan by itself. */
  prescribedBy: string;
  prescribedOn: string; // ISO date
  note?: string;
  targets: Macros;
  meals: Meal[];
}

/** Weekly nutrient focus, keyed to gestational week ranges. */
export interface NutrientFocus {
  fromWeek: number;
  toWeek: number;
  headline: string;
  nutrients: {
    name: string;
    amount: string;
    why: string;
    sources: string[];
  }[];
}
