'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MilestoneKind = 'firstSmile' | 'firstTooth' | 'firstWord' | 'firstSteps';

export interface MilestoneMemory {
  at: string; // ISO date
  note?: string;
  /**
   * Object URL placeholder — same limitation as the general memory album:
   * it does not survive a reload. A real build would persist the blob
   * (e.g. via IndexedDB) rather than just its transient URL.
   */
  photoUrl?: string;
}

interface MilestoneMemoryState {
  entries: Partial<Record<MilestoneKind, MilestoneMemory>>;
  save: (kind: MilestoneKind, entry: MilestoneMemory) => void;
  remove: (kind: MilestoneKind) => void;
}

export const useMilestoneMemoryStore = create<MilestoneMemoryState>()(
  persist(
    (set, get) => ({
      entries: {},
      save: (kind, entry) => set({ entries: { ...get().entries, [kind]: entry } }),
      remove: (kind) => {
        const next = { ...get().entries };
        delete next[kind];
        set({ entries: next });
      },
    }),
    { name: 'afrat-milestone-memories', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
