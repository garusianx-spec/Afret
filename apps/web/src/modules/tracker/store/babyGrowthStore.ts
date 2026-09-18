'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createId } from '@/lib/utils';

export type GrowthKind = 'weight' | 'height' | 'headCircumference';

export interface GrowthLog {
  id: string;
  kind: GrowthKind;
  at: string; // ISO date of measurement
  value: number; // kg for weight, cm for height/head circumference
}

export const GROWTH_META: Record<GrowthKind, { label: string; unit: string; step: number }> = {
  weight: { label: 'وزن', unit: 'کیلوگرم', step: 0.05 },
  height: { label: 'قد', unit: 'سانتی‌متر', step: 0.5 },
  headCircumference: { label: 'دور سر', unit: 'سانتی‌متر', step: 0.5 },
};

interface BabyGrowthState {
  logs: GrowthLog[];
  add: (log: Omit<GrowthLog, 'id'>) => void;
  byKind: (kind: GrowthKind) => GrowthLog[];
}

export const useBabyGrowthStore = create<BabyGrowthState>()(
  persist(
    (set, get) => ({
      logs: [],
      add: (log) => set((state) => ({ logs: [{ ...log, id: createId('growth') }, ...state.logs] })),
      byKind: (kind) =>
        get()
          .logs.filter((l) => l.kind === kind)
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    }),
    { name: 'afrat-baby-growth', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/**
 * Rough unisex weight-for-age reference band (kg), sampled at a handful of
 * ages and linearly interpolated between them.
 *
 * This is a simplified approximation for the trend chart, NOT the WHO
 * growth-standard LMS tables (which are sex-specific and need far more
 * points to be clinically meaningful). It exists to show a mother whether
 * her baby's trend is roughly in the typical band or worth asking a
 * pediatrician about — never as a diagnostic percentile.
 */
export const WEIGHT_REFERENCE_MONTHS = [0, 1, 2, 3, 6, 9, 12, 18, 24];
export const WEIGHT_REFERENCE_P50 = [3.4, 4.5, 5.4, 6.1, 7.6, 8.7, 9.6, 10.9, 12.1];
export const WEIGHT_REFERENCE_LOW = [2.5, 3.4, 4.1, 4.7, 6.0, 6.9, 7.5, 8.6, 9.5]; // ~P3
export const WEIGHT_REFERENCE_HIGH = [4.4, 5.7, 6.9, 7.8, 9.5, 10.8, 11.8, 13.2, 14.7]; // ~P97

function interpolate(months: number, xs: number[], ys: number[]): number {
  if (months <= xs[0]) return ys[0];
  if (months >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 1; i < xs.length; i += 1) {
    if (months <= xs[i]) {
      const t = (months - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}

export function referenceWeightBand(months: number): { low: number; p50: number; high: number } {
  return {
    low: interpolate(months, WEIGHT_REFERENCE_MONTHS, WEIGHT_REFERENCE_LOW),
    p50: interpolate(months, WEIGHT_REFERENCE_MONTHS, WEIGHT_REFERENCE_P50),
    high: interpolate(months, WEIGHT_REFERENCE_MONTHS, WEIGHT_REFERENCE_HIGH),
  };
}
