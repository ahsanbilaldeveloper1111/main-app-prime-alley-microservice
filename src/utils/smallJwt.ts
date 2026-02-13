/**
 * Minimal signed payload for session cookie (Option A: avoid 431).
 * Not a full JWT; just payload + HMAC so the cookie stays tiny.
 */

import { createHmac, randomBytes } from 'crypto';

const PAYLOAD_SEP = '.';

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

export interface SmallPayload {
  sessionId: string;
  exp: number;
  iat: number;
  /** Included so Edge middleware can verify without store lookup (store is Node-only) */
  id?: string;
  permissions?: string[];
}

/**
 * Sign a small payload with HMAC-SHA256. Returns "base64url(payload).base64url(signature)".
 */
export function signSmallPayload(payload: SmallPayload, secret: string): string {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadJson, 'utf8'));
  const signature = createHmac('sha256', secret).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(signature);
  return `${payloadB64}${PAYLOAD_SEP}${sigB64}`;
}

/**
 * Verify and decode. Returns payload or null if invalid/expired.
 */
export function verifySmallPayload(token: string, secret: string): SmallPayload | null {
  if (!token || typeof token !== 'string') return null;
  const idx = token.indexOf(PAYLOAD_SEP);
  if (idx <= 0) return null;
  const payloadB64 = token.slice(0, idx);
  const sigB64 = token.slice(idx + 1);
  const signature = createHmac('sha256', secret).update(payloadB64).digest();
  const expectedSigB64 = base64UrlEncode(signature);
  if (sigB64 !== expectedSigB64) return null;
  try {
    const payloadJson = base64UrlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson) as SmallPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}
