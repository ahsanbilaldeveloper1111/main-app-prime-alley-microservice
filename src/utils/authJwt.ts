/**
 * Custom JWT decode for NextAuth (Option A: small cookie).
 * Used when resolving session (getServerSession, session callback). Cookie only has
 * sessionId, exp, iat, id; full token (including permissions) is loaded from jwtPayloadStore.
 *
 * When store lookup fails (e.g. Edge), we return a minimal token (id, no permissions);
 * middleware only checks presence of valid session, not permissions.
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
  // so middleware can allow the request; permissions are not in cookie (avoid 431)
  return {
    sub: payload.id,
    id: payload.id,
    permissions: [],
    exp: payload.exp,
    iat: payload.iat,
  } as JWT;
}
