/**
 * Custom session store for NextAuth to avoid large JWT cookies
 * Stores session data in memory and only uses small session IDs in cookies
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
    tmsSession?: {
      accessToken: string;
      expiresAt: number;
      user?: {
        id?: string;
        name?: string;
        email?: string;
        user_access_info?: {
          permissions?: Array<{
            module: string;
            action: string;
          }>;
        };
        user_type?: string;
        is_admin?: string;
        [key: string]: any;
      };
    };
  };
  expires: string;
}

// Global session store (in production, use Redis or database)
declare global {
  var nextAuthSessions: Map<string, NextAuthSessionData> | undefined;
}

if (!global.nextAuthSessions) {
  global.nextAuthSessions = new Map();
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

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(sessionStore.cleanup, 5 * 60 * 1000);
}
