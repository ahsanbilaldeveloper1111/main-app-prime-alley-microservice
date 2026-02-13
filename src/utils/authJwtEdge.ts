/**
 * Edge-safe JWT decode for NextAuth (Option A small cookie).
 * Uses only Web Crypto API — no Node.js crypto/Buffer/global.
 * Use this as getToken({ decode: edgeJwtDecode }) in middleware (Edge runtime).
 */

import type { JWT } from 'next-auth/jwt';

const PAYLOAD_SEP = '.';

/** Minimal payload shape (must match smallJwt.ts SmallPayload). */
interface EdgePayload {
  sessionId: string;
  exp: number;
  iat: number;
  id?: string;
  permissions?: string[];
}

function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  const binary = atob(b64);
  return new Uint8Array(Array.from(binary, (c) => c.charCodeAt(0)));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode.apply(null, Array.from(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Verify cookie signature and decode payload using Web Crypto (Edge-safe).
 */
async function verifySmallPayloadEdge(token: string, secret: string): Promise<EdgePayload | null> {
  if (!token || typeof token !== 'string') return null;
  const idx = token.indexOf(PAYLOAD_SEP);
  if (idx <= 0) return null;
  const payloadB64 = token.slice(0, idx);
  const sigB64 = token.slice(idx + 1);

  const secretBytes = new TextEncoder().encode(secret);
  const payloadBytes = new TextEncoder().encode(payloadB64);

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes);
  const expectedSigB64 = bytesToBase64Url(new Uint8Array(signature));
  if (sigB64 !== expectedSigB64) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson) as EdgePayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Decode for Edge middleware. Does not use session store; returns minimal token from cookie.
 * Pass to getToken({ decode: edgeJwtDecode }) in middleware.
 */
export async function edgeJwtDecode(params: {
  token?: string;
  secret: string | Buffer;
}): Promise<JWT | null> {
  const { token, secret } = params;
  if (!token || typeof token !== 'string') return null;
  const secretStr =
    typeof secret === 'string' ? secret : new TextDecoder().decode(new Uint8Array(secret as unknown as ArrayBuffer));
  const payload = await verifySmallPayloadEdge(token, secretStr);
  if (!payload) return null;

  return {
    sub: payload.id,
    id: payload.id,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    exp: payload.exp,
    iat: payload.iat,
  } as JWT;
}
