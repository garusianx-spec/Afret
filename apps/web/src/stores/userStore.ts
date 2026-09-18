'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { GestationalOverride, LifecycleMode, UserProfile } from '@/types';

/**
 * Health profile — cycle mode, dates, baby.
 *
 * Deliberately separate from `authStore`: identity is issued by the server
 * and lives in memory, while this is the user's own clinical data, cached
 * locally so the tracker works offline. Authentication state does not belong
 * here and tokens are never persisted.
 */
interface UserState {
  profile: UserProfile | null;
  hydrated: boolean;

  setProfile: (profile: UserProfile) => void;
  patchProfile: (patch: Partial<UserProfile>) => void;
  setMode: (mode: LifecycleMode) => void;
  setGestationalOverride: (override: GestationalOverride | undefined) => void;
  /** Adopt the signed-in account's display name and id. */
  adoptIdentity: (identity: { id: string; displayName?: string }) => void;
  /** Clears cached health data on sign-out. */
  reset: () => void;
}

/**
 * Demo profile so the app is explorable before auth is wired up. Replace the
 * initial value with `null` once `/api/auth/session` is live.
 *
 * The LMP is relative to "now" rather than a fixed date, so the seeded state
 * always lands mid-second-trimester however long after this was written the
 * app is first opened.
 */
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const demoProfile: UserProfile = {
  id: 'u_demo',
  displayName: 'مادر عزیز',
  mode: 'pregnancy',
  cycleLength: 28,
  periodLength: 5,
  // ~22 weeks pregnant.
  lmpDate: daysAgoIso(154),
  gestationalOverride: undefined,
  baby: undefined,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: demoProfile,
      hydrated: false,

      setProfile: (profile) => set({ profile }),
      patchProfile: (patch) =>
        set((state) =>
          state.profile ? { profile: { ...state.profile, ...patch } } : state,
        ),
      setMode: (mode) =>
        set((state) =>
          state.profile ? { profile: { ...state.profile, mode } } : state,
        ),
      setGestationalOverride: (gestationalOverride) =>
        set((state) =>
          state.profile
            ? { profile: { ...state.profile, gestationalOverride } }
            : state,
        ),
      adoptIdentity: ({ id, displayName }) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                id,
                displayName: displayName?.trim() || state.profile.displayName,
              }
            : { ...demoProfile, id, displayName: displayName?.trim() || demoProfile.displayName },
        })),

      // Health data is per-account, so a sign-out must not leave the next
      // person on the device looking at someone else's pregnancy.
      reset: () => set({ profile: demoProfile }),
    }),
    {
      name: 'afrat-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => () => {
        // Components gate on `hydrated` to avoid an SSR/CSR text mismatch.
        useUserStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Non-reactive read — safe to call from the socket layer. */
export const currentUserId = () => useUserStore.getState().profile?.id ?? 'anonymous';
