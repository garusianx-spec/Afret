'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AllergyEntry {
  food: string;
  /** 0 = no reaction, 1 = mild, 2 = concerning — matches REACTION_LEVELS. */
  reaction: number;
  at: string;
}

interface AllergyState {
  entries: AllergyEntry[];
  addEntry: (entry: AllergyEntry) => void;
}

export const useAllergyStore = create<AllergyState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
    }),
    { name: 'afrat-allergy-log', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
