'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Local mirror of the mother's clinical-sync consent. Deliberately
 * device-local and off by default: signing in on a new phone never
 * silently re-enables sharing — she opts in again, on purpose, per device.
 */
interface VitalsSyncState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useVitalsSyncStore = create<VitalsSyncState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'afrat-vitals-sync-consent', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
