'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { GestationalOverride, LifecycleMode, UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  /** Session token forwarded in the socket handshake and REST calls. */
  token: string | null;
  hydrated: boolean;

  setProfile: (profile: UserProfile) => void;
  patchProfile: (patch: Partial<UserProfile>) => void;
  setMode: (mode: LifecycleMode) => void;
  setGestationalOverride: (override: GestationalOverride | undefined) => void;
  setToken: (token: string | null) => void;
  signOut: () => void;
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
      token: null,
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
      setToken: (token) => set({ token }),
      signOut: () => set({ profile: null, token: null }),
    }),
    {
      name: 'afrat-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profile: state.profile, token: state.token }),
      onRehydrateStorage: () => (state) => {
        // Components gate on `hydrated` to avoid an SSR/CSR text mismatch.
        state?.setToken(state.token ?? null);
        useUserStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Non-reactive read — safe to call from the socket layer. */
export const currentUserId = () => useUserStore.getState().profile?.id ?? 'anonymous';
