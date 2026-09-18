'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import * as authApi from './api/authApi';
import { seedDemoData } from '@/modules/demo/seedDemoData';
import { useUserStore } from '@/stores/userStore';

import { setTokenProvider } from './lib/tokenBridge';
import { primeUserHint, useAuthStore } from './store/authStore';
import type { AuthUser, LoginInput, Permission, RegisterInput } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Returns a valid access token, refreshing first if it is about to expire. */
  getAccessToken: () => Promise<string | null>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Refresh this far before expiry rather than waiting for a 401. */
const REFRESH_SKEW_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);
  const clear = useAuthStore((s) => s.clear);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  /** Collapses concurrent refreshes into one in-flight request. */
  const refreshing = useRef<Promise<string | null> | null>(null);
  const renewalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshing.current) return refreshing.current;

    refreshing.current = (async () => {
      try {
        const session = await authApi.refresh();
        setSession(session);
        return session.accessToken;
      } catch {
        // No cookie, expired, or revoked — all mean "not logged in".
        clear();
        return null;
      } finally {
        refreshing.current = null;
      }
    })();

    return refreshing.current;
  }, [setSession, clear]);

  /* Restore the session on mount: the access token lives in memory only, so
     a page load always starts by asking the refresh cookie who we are. */
  useEffect(() => {
    primeUserHint();
    setStatus('restoring');
    void runRefresh().then((token) => {
      if (!token) setStatus('anonymous');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Renew ahead of expiry so a long session never hits a 401 mid-action. */
  useEffect(() => {
    if (renewalTimer.current) clearTimeout(renewalTimer.current);
    if (status !== 'authenticated') return;

    const schedule = () => {
      const { expiresAt } = useAuthStore.getState();
      const delay = Math.max(5_000, expiresAt - Date.now() - REFRESH_SKEW_MS);
      renewalTimer.current = setTimeout(() => {
        void runRefresh().then((token) => {
          if (token) schedule();
        });
      }, delay);
    };
    schedule();

    return () => {
      if (renewalTimer.current) clearTimeout(renewalTimer.current);
    };
  }, [status, runRefresh]);

  /* A phone that slept through the renewal window wakes with a dead token. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const { expiresAt, status: current } = useAuthStore.getState();
      if (current === 'authenticated' && expiresAt - Date.now() < REFRESH_SKEW_MS) {
        void runRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [runRefresh]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { accessToken, expiresAt } = useAuthStore.getState();
    if (accessToken && expiresAt - Date.now() > REFRESH_SKEW_MS) return accessToken;
    return runRefresh();
  }, [runRefresh]);

  /* Hand the refresh-aware getter to the REST client and socket factory. */
  useEffect(() => {
    setTokenProvider(getAccessToken);
    return () => setTokenProvider(null);
  }, [getAccessToken]);

  /* Mirror the account identity into the locally cached health profile, so
     the dashboard greets the right person and logs are attributed correctly. */
  useEffect(() => {
    if (!user) return;
    useUserStore
      .getState()
      .adoptIdentity({ id: user.id, displayName: user.fullName });

    // The demo account arrives with sample data so every tab has something to
    // show. No-ops for every other account, and runs once per browser.
    seedDemoData(user.mobile);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: status === 'authenticated',
      isRestoring: status === 'idle' || status === 'restoring',
      hasPermission,
      getAccessToken,

      login: async (input) => setSession(await authApi.login(input)),
      register: async (input) => setSession(await authApi.register(input)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          // Even if the call fails, the local session must end — otherwise
          // "log out" on a flaky connection silently does nothing.
          clear();
          // Cached clinical data is per-account and must not survive into
          // whoever signs in next on a shared phone.
          useUserStore.getState().reset();
          // Drop the demo marker too, so signing back in re-seeds rather than
          // landing on empty tabs.
          try {
            localStorage.removeItem('afrat:demo-seeded-v1');
          } catch {
            /* private mode — nothing cached to clear */
          }
        }
      },
    }),
    [user, status, hasPermission, getAccessToken, setSession, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
