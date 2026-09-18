'use client';

import type { ReactNode } from 'react';

import { useAuth } from '../AuthProvider';

import { AuthScreen } from './AuthScreen';
import { BrandMark } from './BrandMark';

/**
 * Renders the app for signed-in users and the auth screen for everyone else.
 *
 * The splash below covers the silent-refresh window on a cold load. Without
 * it the user would see the login form for a beat and then be bounced into
 * the app — which reads as a bug even though the session was valid all along.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-surface"
        aria-busy="true"
      >
        <span className="sr-only">در حال بررسی نشست شما…</span>
        <BrandMark className="size-16 animate-pulse text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;

  return <>{children}</>;
}
