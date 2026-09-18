'use client';

import { create } from 'zustand';

import type { AuthSession, AuthUser, Permission } from '../types';

/**
 * Auth state.
 *
 * The access token is held **in memory only** — deliberately not persisted.
 * A token in `localStorage` is readable by any XSS payload; keeping it in a
 * closure means a refresh of the page costs one silent `/refresh` call
 * against the HttpOnly cookie, which is the trade the OWASP guidance asks for.
 *
 * `user` is mirrored to sessionStorage purely so the shell can render the
 * right chrome during that first refresh instead of flashing the login screen.
 */

export type AuthStatus =
  | 'idle'        // nothing attempted yet
  | 'restoring'   // silent refresh in flight
  | 'authenticated'
  | 'anonymous';

const USER_CACHE_KEY = 'afrat:user-hint';

function readUserHint(): AuthUser | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeUserHint(user: AuthUser | null) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (user) sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* private mode — the hint is an optimisation, not a requirement */
  }
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  /** Epoch ms at which the access token stops being accepted. */
  expiresAt: number;

  setSession: (session: AuthSession) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  expiresAt: 0,

  setSession: (session) => {
    writeUserHint(session.user);
    set({
      status: 'authenticated',
      user: session.user,
      accessToken: session.accessToken,
      expiresAt: Date.now() + session.expiresIn * 1000,
    });
  },

  setStatus: (status) => set({ status }),

  clear: () => {
    writeUserHint(null);
    set({ status: 'anonymous', user: null, accessToken: null, expiresAt: 0 });
  },

  hasPermission: (permission) => {
    const permissions = get().user?.permissions ?? [];
    return permissions.includes('admin:all') || permissions.includes(permission);
  },
}));

/** Non-reactive read for the socket layer, which lives outside React. */
export const currentAccessToken = () => useAuthStore.getState().accessToken;

/** Restores the cached identity so the shell does not flash on first paint. */
export function primeUserHint() {
  const hint = readUserHint();
  if (hint) useAuthStore.setState({ user: hint });
}
