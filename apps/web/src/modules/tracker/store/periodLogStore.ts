'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createId } from '@/lib/utils';

export interface PeriodEntry {
  id: string;
  /** First day of bleeding, ISO date. */
  startDate: string;
}

interface PeriodLogState {
  entries: PeriodEntry[];
  /** Records a new period start, newest first. */
  logStart: (startDate: string) => void;
  remove: (id: string) => void;
}

export const usePeriodLogStore = create<PeriodLogState>()(
  persist(
    (set) => ({
      entries: [],
      logStart: (startDate) =>
        set((state) => ({
          entries: [{ id: createId('period'), startDate }, ...state.entries].sort(
            (a, b) => Date.parse(b.startDate) - Date.parse(a.startDate),
          ),
        })),
      remove: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'afrat-period-log', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/** Cycle length (days) between each consecutive pair of logged starts. */
export function cycleLengthHistory(entries: PeriodEntry[]): { from: string; to: string; days: number }[] {
  const sorted = [...entries].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
  const out: { from: string; to: string; days: number }[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const days = Math.round(
      (Date.parse(sorted[i].startDate) - Date.parse(sorted[i - 1].startDate)) / 86_400_000,
    );
    out.push({ from: sorted[i - 1].startDate, to: sorted[i].startDate, days });
  }
  return out.reverse(); // newest pair first, to match the entries list order
}
