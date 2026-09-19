'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createId } from '@/lib/utils';

export type LogKind =
  | 'weight'
  | 'glucose'
  | 'bloodPressure'
  | 'mood'
  | 'nausea'
  | 'symptom'
  | 'bbt' // basal body temperature — TTC mode
  | 'cervicalMucus' // TTC mode
  | 'kickCount'; // fetal movement session — pregnancy mode, third trimester

export interface HealthLog {
  id: string;
  kind: LogKind;
  /** ISO timestamp of the reading, not of the entry. */
  at: string;
  /** Primary numeric value — kg, mg/dL, systolic, or a 1–5 scale. */
  value: number;
  /** Diastolic, for blood pressure. */
  value2?: number;
  /** Free-text symptom name, or the meal context for a glucose reading. */
  label?: string;
  note?: string;
}

export const LOG_META: Record<
  LogKind,
  { label: string; unit: string; step: number; min: number; max: number }
> = {
  weight: { label: 'وزن', unit: 'کیلوگرم', step: 0.1, min: 30, max: 200 },
  glucose: { label: 'قند خون', unit: 'میلی‌گرم/دسی‌لیتر', step: 1, min: 40, max: 400 },
  bloodPressure: { label: 'فشار خون', unit: 'میلی‌متر جیوه', step: 1, min: 50, max: 220 },
  mood: { label: 'حال و خلق‌وخو', unit: '', step: 1, min: 1, max: 5 },
  nausea: { label: 'شدت تهوع', unit: '', step: 1, min: 0, max: 4 },
  symptom: { label: 'علائم', unit: '', step: 1, min: 0, max: 1 },
  bbt: { label: 'دمای پایه بدن', unit: '°C', step: 0.05, min: 35, max: 39 },
  cervicalMucus: { label: 'ترشحات دهانهٔ رحم', unit: '', step: 1, min: 0, max: 3 },
  kickCount: { label: 'شمارش حرکات جنین', unit: 'حرکت', step: 1, min: 0, max: 200 },
};

/** Cervical mucus scale used by the TTC logger — 0 = driest, 3 = most fertile. */
export const MUCUS_SCALE = [
  { value: 0, label: 'خشک' },
  { value: 1, label: 'چسبنده' },
  { value: 2, label: 'کِرمی' },
  { value: 3, label: 'شفاف و کِشدار (سفیدهٔ تخم‌مرغ)' },
] as const;

/** Glucose targets in pregnancy (mg/dL) — the gestational-diabetes view. */
export const GLUCOSE_TARGETS = {
  fasting: { max: 95, label: 'ناشتا' },
  oneHour: { max: 140, label: '۱ ساعت پس از غذا' },
  twoHour: { max: 120, label: '۲ ساعت پس از غذا' },
} as const;

export type GlucoseContext = keyof typeof GLUCOSE_TARGETS;

interface HealthLogState {
  logs: HealthLog[];
  add: (log: Omit<HealthLog, 'id'>) => void;
  remove: (id: string) => void;
}

/**
 * There is deliberately no `byKind` method here: a selector that computes
 * a filtered/sorted array (`useHealthLogStore((s) => s.someMethod())`)
 * returns a new array reference on every snapshot check, which breaks
 * `useSyncExternalStore`'s equality test and causes an infinite render
 * loop (see the fix in `GrowthChart.tsx`/`babyGrowthStore.ts` for the
 * incident this comment is here to prevent a repeat of). Select the raw
 * `logs` array and derive with `useMemo` in the component instead.
 */
export const useHealthLogStore = create<HealthLogState>()(
  persist(
    (set) => ({
      logs: [],
      add: (log) =>
        set((state) => ({ logs: [{ ...log, id: createId('log') }, ...state.logs] })),
      remove: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
    }),
    {
      name: 'afrat-health-logs',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Flags a reading that exceeds its pregnancy target. */
export function isGlucoseHigh(value: number, context: GlucoseContext): boolean {
  return value > GLUCOSE_TARGETS[context].max;
}

/** Hypertension screening thresholds used in prenatal care. */
export function bloodPressureFlag(
  systolic: number,
  diastolic: number,
): 'normal' | 'elevated' | 'high' {
  if (systolic >= 140 || diastolic >= 90) return 'high';
  if (systolic >= 130 || diastolic >= 85) return 'elevated';
  return 'normal';
}
