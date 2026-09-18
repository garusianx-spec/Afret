'use client';

/**
 * Bridge between React-land auth and the modules that live outside it —
 * the REST client and the socket factory.
 *
 * Those modules must not import the provider (that would make them
 * React-dependent and circular), but they do need a token that is *fresh*,
 * not merely the last one issued. `AuthProvider` registers its refresh-aware
 * getter here on mount; everyone else calls `getValidAccessToken()`.
 */

type TokenProvider = () => Promise<string | null>;

let provider: TokenProvider | null = null;

export function setTokenProvider(next: TokenProvider | null) {
  provider = next;
}

/** Resolves a token that is valid now, refreshing first if needed. */
export async function getValidAccessToken(): Promise<string | null> {
  if (!provider) return null;
  try {
    return await provider();
  } catch {
    return null;
  }
}

/** `Authorization` header, or `{}` when signed out. */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
