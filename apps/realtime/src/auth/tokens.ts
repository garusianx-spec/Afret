import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { env } from '../env.js';
import type { UserRole } from './types.js';

/**
 * Token strategy.
 *
 * Access token  — JWT, 15 minutes, held in memory by the client and sent as
 *                 `Authorization: Bearer`. Short enough that revocation by
 *                 expiry is acceptable; the socket handshake verifies it.
 * Refresh token — opaque 256-bit random string in an HttpOnly, SameSite=Lax,
 *                 Secure cookie. Never a JWT: a refresh token must be
 *                 revocable, and only a server-side record can do that.
 *
 * The refresh token is stored hashed (SHA-256). A database leak then yields
 * no usable sessions — the same reason passwords are hashed.
 */

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export const REFRESH_COOKIE = 'afrat_rt';
export { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS };

const ISSUER = 'afrat';
const AUDIENCE = 'afrat-app';

let secretKey: Uint8Array | null = null;

function key(): Uint8Array {
  if (!secretKey) secretKey = new TextEncoder().encode(env.JWT_SECRET);
  return secretKey;
}

export interface AccessClaims extends JWTPayload {
  sub: string;
  mobile: string;
  role: UserRole;
  permissions: string[];
  name?: string;
}

export async function signAccessToken(claims: {
  userId: string;
  mobile: string;
  role: UserRole;
  permissions: string[];
  name?: string;
}): Promise<string> {
  return new SignJWT({
    mobile: claims.mobile,
    role: claims.role,
    permissions: claims.permissions,
    name: claims.name,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(key());
}

/** Returns the claims, or `null` for any failure — expired, forged, malformed. */
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'], // pinned: never let the token pick `none`
      clockTolerance: 30, // phones drift
    });

    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as AccessClaims;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Refresh tokens
 * ------------------------------------------------------------------ */

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison. A plain `===` on a secret leaks its prefix
 * through timing; this is cheap insurance.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    // `lax` still sends the cookie on top-level navigation back into the app,
    // which `strict` would block after an SMS deep link.
    sameSite: 'lax' as const,
    secure: env.isProduction,
    path: '/api/auth',
    maxAge: REFRESH_TTL_SECONDS,
  };
}
