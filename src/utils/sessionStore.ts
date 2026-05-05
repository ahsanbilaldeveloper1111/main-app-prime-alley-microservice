/**
 * Custom session store for NextAuth to avoid large JWT cookies
 * - sessionStore: used by /api/auth/session for TMS sessionId storage
 * - jwtPayloadStore: used by custom JWT encode/decode to store full token server-side;
 *   only a small session id is stored in the cookie to avoid 431
 */

import { NEXTAUTH_SESSION_MAX_AGE_SEC } from "./nextAuthSessionConstants";

/** Hex session ids from randomBytes(32).toString("hex") */
const SESSION_ID_HEX_LENGTH = 64;

/** Drop JWT payloads with no usable exp after this age (seconds). */
const JWT_PAYLOAD_FALLBACK_MAX_AGE_SEC = NEXTAUTH_SESSION_MAX_AGE_SEC + 3600;

export interface NextAuthSessionData {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    is_admin?: string | null;
    role?: string | null;
    permissions?: string[]; // Original main app permissions
    tmsPermissions?: string[]; // TMS permissions as separate field
    access_token?: string;
    access_token_expires?: number | string;
    refresh_token?: string;
    refresh_token_expires?: number | string;
  };
  expires: string;
}

/** Full JWT payload from NextAuth jwt callback (stored server-side, keyed by sessionId) */
export type JWTPayload = Record<string, unknown>;

/** Internal: when payload was written (unix seconds), for orphan cleanup when exp is missing */
export const JWT_STORED_AT_KEY = "_jwtStoredAt";

// Global session store (in production, use Redis or database)
declare global {
  var nextAuthSessions: Map<string, NextAuthSessionData> | undefined;
  var nextAuthJwtPayloadStore: Map<string, JWTPayload> | undefined;
}

if (!global.nextAuthSessions) {
  global.nextAuthSessions = new Map();
}

if (!global.nextAuthJwtPayloadStore) {
  global.nextAuthJwtPayloadStore = new Map();
}

export const sessionStore = {
  set: (sessionId: string, sessionData: NextAuthSessionData) => {
    global.nextAuthSessions!.set(sessionId, sessionData);
  },

  get: (sessionId: string): NextAuthSessionData | null => {
    return global.nextAuthSessions!.get(sessionId) || null;
  },

  delete: (sessionId: string) => {
    global.nextAuthSessions!.delete(sessionId);
  },

  /** Clear all TMS sessions (tests / admin tooling only). */
  clear: () => {
    global.nextAuthSessions!.clear();
  },

  // Clean up expired sessions
  cleanup: () => {
    const now = new Date();
    global.nextAuthSessions!.forEach((sessionData, sessionId) => {
      if (new Date(sessionData.expires) <= now) {
        global.nextAuthSessions!.delete(sessionId);
      }
    });
  }
};

/**
 * Store for full JWT payloads keyed by sessionId (Option A: small cookie).
 * Cookie only contains a signed sessionId; full session is resolved here.
 */
function isLikelySessionIdHex(id: string): boolean {
  return id.length === SESSION_ID_HEX_LENGTH && /^[a-f0-9]+$/i.test(id);
}

export const jwtPayloadStore = {
  set: (sessionId: string, payload: JWTPayload) => {
    const storedAt = Math.floor(Date.now() / 1000);
    global.nextAuthJwtPayloadStore!.set(sessionId, {
      ...payload,
      [JWT_STORED_AT_KEY]: storedAt,
    });
  },

  get: (sessionId: string): JWTPayload | null => {
    return global.nextAuthJwtPayloadStore!.get(sessionId) || null;
  },

  delete: (sessionId: string) => {
    global.nextAuthJwtPayloadStore!.delete(sessionId);
  },

  /** Clear server-side JWT payloads (tests / admin tooling only). */
  clear: () => {
    global.nextAuthJwtPayloadStore!.clear();
  },

  cleanup: () => {
    const nowSec = Math.floor(Date.now() / 1000);
    global.nextAuthJwtPayloadStore!.forEach((payload, sessionId) => {
      const expRaw = payload.exp;
      const expSec = typeof expRaw === "number" ? expRaw : undefined;
      if (typeof expSec === "number" && expSec < nowSec) {
        global.nextAuthJwtPayloadStore!.delete(sessionId);
        return;
      }
      if (typeof expSec !== "number") {
        const storedAt = payload[JWT_STORED_AT_KEY] as number | undefined;
        if (
          typeof storedAt === "number" &&
          nowSec - storedAt > JWT_PAYLOAD_FALLBACK_MAX_AGE_SEC
        ) {
          global.nextAuthJwtPayloadStore!.delete(sessionId);
        }
      }
    });
  },
};

export { isLikelySessionIdHex };

// Run cleanup periodically for both stores (JWT orphans matter more when encode ran often)
if (typeof setInterval !== "undefined") {
  setInterval(sessionStore.cleanup, 5 * 60 * 1000);
  setInterval(jwtPayloadStore.cleanup, 2 * 60 * 1000);
}
