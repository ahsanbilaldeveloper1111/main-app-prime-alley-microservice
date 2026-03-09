/**
 * Custom JWT decode for NextAuth (Option A: small cookie).
 * Used when resolving session (getServerSession, session callback). Cookie only has
 * sessionId, exp, iat, id; full token (including permissions) is loaded from jwtPayloadStore.
 *
 * When store lookup fails (e.g. server restarted and in-memory store was cleared),
 * we return null so the user is treated as unauthenticated and must sign in again.
 * Middleware uses edgeJwtDecode (cookie-only); session resolution runs in Node and uses this.
 */

import type { JWT } from 'next-auth/jwt';
import { jwtPayloadStore } from './sessionStore';
import { verifySmallPayload } from './smallJwt';

/**
 * Decode the small session cookie and resolve full token from store.
 * If the store has no entry for this sessionId (e.g. server restarted), return null
 * so the session is invalid and the user is redirected to sign-in.
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

  // Store empty (e.g. server restarted, in-memory store cleared): session no longer valid
  return null;
}
