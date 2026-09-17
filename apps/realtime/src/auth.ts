import type { ChatUser } from './types.js';

/**
 * Placeholder authentication.
 *
 * Replace with real verification (JWT signature check against your auth
 * service, or a session lookup) before this service sees production traffic.
 * The signature is deliberately the one a real implementation needs: a token
 * in, a resolved user or `null` out.
 */
export async function resolveUser(token?: string): Promise<ChatUser | null> {
  if (!token) {
    // Development convenience: anonymous sockets get a stable demo identity so
    // the UI is explorable. In production this must return `null`.
    return process.env.NODE_ENV === 'production'
      ? null
      : { id: 'u_demo', displayName: 'مادر عزیز', role: 'mother' };
  }

  // TODO: verify signature / look up the session, then map to a ChatUser.
  return { id: `u_${token.slice(0, 8)}`, displayName: 'کاربر', role: 'mother' };
}
