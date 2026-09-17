'use client';

import { useEffect, useState } from 'react';

/**
 * `false` during SSR and the first client render.
 *
 * Anything driven by `localStorage` (the persisted profile, the checklist)
 * must wait for this, otherwise React logs a hydration mismatch and — worse —
 * the user briefly sees the demo profile instead of their own.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
