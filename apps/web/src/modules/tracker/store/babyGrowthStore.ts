'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';

import { createId } from '@/lib/utils';

export type GrowthKind = 'weight' | 'height' | 'headCircumference';

export const growthLogInputSchema = z.object({
  kind: z.enum(['weight', 'height', 'headCircumference']),
  at: z.string().datetime(),
  value: z.number().positive().max(200),
});

export type GrowthLogInput = z.infer<typeof growthLogInputSchema>;

export interface GrowthLog extends GrowthLogInput {
  id: string;
}

export const GROWTH_META: Record<GrowthKind, { label: string; unit: string; step: number }> = {
  weight: { label: 'وزن', unit: 'کیلوگرم', step: 0.05 },
  height: { label: 'قد', unit: 'سانتی‌متر', step: 0.5 },
  headCircumference: { label: 'دور سر', unit: 'سانتی‌متر', step: 0.5 },
};

interface BabyGrowthState {
  logs: GrowthLog[];
  /** Throws if `log` fails validation — callers pass form input, already a trust boundary. */
  add: (log: GrowthLogInput) => void;
}

/**
 * No `byKind` method here on purpose: a selector that filters/sorts inside
 * itself (`useBabyGrowthStore((s) => s.someMethod())`) returns a new array
 * reference on every snapshot check, which breaks `useSyncExternalStore`'s
 * equality test and causes an infinite render loop — this store's `byKind`
 * caused exactly that once `GrowthChart` became reachable. Select the raw
 * `logs` array and derive with `useMemo` in the component instead (see
 * `GrowthChart.tsx`).
 */
export const useBabyGrowthStore = create<BabyGrowthState>()(
  persist(
    (set) => ({
      logs: [],
      add: (log) => {
        const validated = growthLogInputSchema.parse(log);
        set((state) => ({ logs: [{ ...validated, id: createId('growth') }, ...state.logs] }));
      },
    }),
    { name: 'afrat-baby-growth', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
