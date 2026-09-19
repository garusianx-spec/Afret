'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * A private draft of questions/notes for whichever cord-blood bank the
 * mother is considering — saved locally only. There is no cord-blood-bank
 * partner integrated into this app, so nothing here is ever transmitted;
 * it exists so she has her own notes ready when she calls one.
 */
interface CordBloodDraftState {
  bankName: string;
  contactPreference: string;
  notes: string;
  savedAt?: string;
  save: (draft: { bankName: string; contactPreference: string; notes: string }) => void;
}

export const useCordBloodDraftStore = create<CordBloodDraftState>()(
  persist(
    (set) => ({
      bankName: '',
      contactPreference: '',
      notes: '',
      savedAt: undefined,
      save: (draft) => set({ ...draft, savedAt: new Date().toISOString() }),
    }),
    { name: 'afrat-cord-blood-draft', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
