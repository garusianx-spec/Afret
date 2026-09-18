'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PlayIdeaState {
  tried: Record<string, boolean>;
  toggle: (id: string) => void;
}

export const usePlayIdeaStore = create<PlayIdeaState>()(
  persist(
    (set) => ({
      tried: {},
      toggle: (id) =>
        set((state) => ({ tried: { ...state.tried, [id]: !state.tried[id] } })),
    }),
    { name: 'afrat-play-ideas', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
