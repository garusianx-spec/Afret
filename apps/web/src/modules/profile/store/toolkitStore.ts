'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface MemoryEntry {
  id: string;
  title: string;
  /** ISO date the memory happened, not when it was recorded. */
  at: string;
  note?: string;
  /**
   * Object URL or remote URL. Binary lives in the cloud album; this store
   * only keeps the pointer so localStorage cannot fill up.
   */
  photoUrl?: string;
  audioUrl?: string;
  milestoneId?: string;
}

interface ToolkitState {
  /** `{ 'hospital-bag': { 'id-docs': true } }` */
  checked: Record<string, Record<string, boolean>>;
  memories: MemoryEntry[];

  toggleItem: (listId: string, itemId: string) => void;
  addMemory: (memory: MemoryEntry) => void;
  removeMemory: (id: string) => void;
}

export const useToolkitStore = create<ToolkitState>()(
  persist(
    (set) => ({
      checked: {},
      memories: [],

      toggleItem: (listId, itemId) =>
        set((state) => {
          const list = state.checked[listId] ?? {};
          return {
            checked: {
              ...state.checked,
              [listId]: { ...list, [itemId]: !list[itemId] },
            },
          };
        }),

      addMemory: (memory) =>
        set((state) => ({ memories: [memory, ...state.memories] })),
      removeMemory: (id) =>
        set((state) => ({ memories: state.memories.filter((m) => m.id !== id) })),
    }),
    {
      name: 'afrat-toolkit',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
