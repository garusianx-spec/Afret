import type { FastifyReply, FastifyRequest } from 'fastify';

import { verifyAccessToken } from './tokens.js';
import {
  ROLE_LABELS,
  hasPermission,
  type Permission,
  type UserRole,
} from './types.js';

/** The verified identity attached to a request or socket. */
export interface AuthUser {
  id: string;
  mobile: string;
  role: UserRole;
  roleLabel: string;
  permissions: string[];
  displayName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireAuth` / `optionalAuth`. */
    authUser?: AuthUser;
  }
}

function bearer(header?: string): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1];
}

/** Verify a bearer token into an `AuthUser`, or `null`. */
export async function authenticate(token?: string): Promise<AuthUser | null> {
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  const role = claims.role as UserRole;
  return {
    id: claims.sub,
    mobile: claims.mobile,
    role,
    roleLabel: ROLE_LABELS[role] ?? ROLE_LABELS.mother,
    permissions: Array.isArray(claims.permissions) ? claims.permissions : [],
    displayName: claims.name?.trim() || 'کاربر آفرت',
  };
}

/** Fastify preHandler: 401 unless a valid access token is present. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = await authenticate(bearer(request.headers.authorization));
  if (!user) {
    return reply.code(401).send({ message: 'برای این کار باید وارد شوید.' });
  }
  request.authUser = user;
}

/** Attaches the user when a token is present; never rejects. */
export async function optionalAuth(request: FastifyRequest) {
  const user = await authenticate(bearer(request.headers.authorization));
  if (user) request.authUser = user;
}

/**
 * Project a verified identity onto the chat-facing shape.
 *
 * `admin` is an operational role, not something other members should see, so
 * it surfaces as `moderator` in conversation.
 */
export function toChatUser(user: AuthUser): {
  id: string;
  displayName: string;
  role: 'mother' | 'doctor' | 'midwife' | 'nutritionist' | 'moderator';
  roleLabel: string;
} {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role === 'admin' ? 'moderator' : user.role,
    roleLabel: user.roleLabel,
  };
}

/** Guard factory for capability-gated routes. */
export function requirePermission(permission: Permission) {
  return async function guard(request: FastifyRequest, reply: FastifyReply) {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!hasPermission(request.authUser?.permissions ?? [], permission)) {
      return reply.code(403).send({ message: 'دسترسی لازم را ندارید.' });
    }
  };
}
