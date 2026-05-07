/**
 * Shared NextAuth session duration (seconds). Must stay aligned across [...nextauth]
 * and sessionStore JWT retention logic.
 */
export const NEXTAUTH_SESSION_MAX_AGE_SEC = 2 * 60 * 60;
