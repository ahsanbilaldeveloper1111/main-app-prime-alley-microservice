/**
 * Custom JWT decode for NextAuth (Option A: small cookie).
 * Used by [...nextauth].ts and by middleware getToken() so the same decode logic is applied.
 *
 * Edge middleware cannot access the Node in-memory jwtPayloadStore, so when store lookup
 * fails we return a minimal token from the cookie payload (id + permissions) so middleware
 * can allow the request and avoid redirect loops after login.
 */

import type { JWT } from 'next-auth/jwt';
import { jwtPayloadStore } from './sessionStore';
import { verifySmallPayload } from './smallJwt';

/**
 * Decode the small session cookie. Tries store first (Node); if missing (e.g. Edge),
 * returns minimal token from cookie payload so middleware still allows the request.
 */
export async function customJwtDecode(params: {
  token?: string;
  secret: string | Buffer;
}): Promise<JWT | null> {
  const { token, secret } = params;
  if (!token || typeof token !== 'string') return null;
  const secretStr = typeof secret === 'string' ? secret : secret.toString('binary');
  const payload = verifySmallPayload(token, secretStr);
  if (!payload) return null;

  const full = jwtPayloadStore.get(payload.sessionId);
  if (full) return full as JWT;

  // Store empty (e.g. middleware runs in Edge, store is Node-only): return minimal token
  // from cookie so middleware has id + permissions and allows the request (fixes login loop)
  return {
    sub: payload.id,
    id: payload.id,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    exp: payload.exp,
    iat: payload.iat,
  } as JWT;
}
