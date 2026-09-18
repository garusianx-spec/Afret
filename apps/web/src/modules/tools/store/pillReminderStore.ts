'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PillItem {
  id: string;
  label: string;
}

interface PillReminderState {
  items: PillItem[];
  /** `{ '1404-06-26': { pill_xyz: true } }` */
  taken: Record<string, Record<string, boolean>>;
  addItem: (item: PillItem) => void;
  removeItem: (id: string) => void;
  toggleTaken: (dayKey: string, itemId: string) => void;
}

export const usePillReminderStore = create<PillReminderState>()(
  persist(
    (set) => ({
      items: [],
      taken: {},
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      toggleTaken: (dayKey, itemId) =>
        set((state) => {
          const day = state.taken[dayKey] ?? {};
          return { taken: { ...state.taken, [dayKey]: { ...day, [itemId]: !day[itemId] } } };
        }),
    }),
    { name: 'afrat-pill-reminder', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
