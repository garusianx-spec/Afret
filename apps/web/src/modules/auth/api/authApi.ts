import { config } from '@/lib/config';

import type { AuthSession, AuthUser, LoginInput, RegisterInput } from '../types';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * `credentials: 'include'` on every call — the refresh token is an HttpOnly
 * cookie, so it is never readable from JS and must ride along automatically.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Declaring `application/json` on a bodyless POST makes strict parsers
  // (Fastify among them) reject the request with 400 before it reaches the
  // route — which is exactly what silently broke silent-refresh.
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${config.apiUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (res.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.';
    throw new AuthError(message, res.status);
  }

  return body as T;
}

export function register(input: RegisterInput): Promise<AuthSession> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<AuthSession> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Exchanges the refresh cookie for a new access token, rotating the cookie. */
export function refresh(): Promise<AuthSession> {
  return request('/api/auth/refresh', { method: 'POST' });
}

export function logout(): Promise<void> {
  return request('/api/auth/logout', { method: 'POST' });
}

export function me(accessToken: string): Promise<{ user: AuthUser }> {
  return request('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function changePassword(
  accessToken: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  return request('/api/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}
