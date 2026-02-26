/**
 * Custom session store for NextAuth to avoid large JWT cookies
 * - sessionStore: used by /api/auth/session for TMS sessionId storage
 * - jwtPayloadStore: used by custom JWT encode/decode to store full token server-side;
 *   only a small session id is stored in the cookie to avoid 431
 */

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
export const jwtPayloadStore = {
  set: (sessionId: string, payload: JWTPayload) => {
    global.nextAuthJwtPayloadStore!.set(sessionId, payload);
  },

  get: (sessionId: string): JWTPayload | null => {
    return global.nextAuthJwtPayloadStore!.get(sessionId) || null;
  },

  delete: (sessionId: string) => {
    global.nextAuthJwtPayloadStore!.delete(sessionId);
  },

  cleanup: () => {
    const nowSec = Math.floor(Date.now() / 1000);
    global.nextAuthJwtPayloadStore!.forEach((payload, sessionId) => {
      const exp = payload.exp as number | undefined;
      if (typeof exp === 'number' && exp < nowSec) {
        global.nextAuthJwtPayloadStore!.delete(sessionId);
      }
    });
  }
};

// Run cleanup every 5 minutes for both stores
if (typeof setInterval !== 'undefined') {
  setInterval(sessionStore.cleanup, 5 * 60 * 1000);
  setInterval(jwtPayloadStore.cleanup, 5 * 60 * 1000);
}
