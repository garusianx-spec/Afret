'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BabyNameFavoritesState {
  favoriteIds: string[];
  toggle: (id: string) => void;
}

export const useBabyNameFavoritesStore = create<BabyNameFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggle: (id) =>
        set({
          favoriteIds: get().favoriteIds.includes(id)
            ? get().favoriteIds.filter((f) => f !== id)
            : [...get().favoriteIds, id],
        }),
    }),
    { name: 'afrat-baby-name-favorites', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
