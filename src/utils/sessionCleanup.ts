/**
 * Utility to clean up expired TMS sessions from memory store
 * This should be called periodically to prevent memory leaks
 */

import { clearSessionCookiesClient } from './cookieUtils';

export const cleanupExpiredSessions = () => {
  if (!global.tmsSessions) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  let cleanedCount = 0;

  global.tmsSessions.forEach((sessionData, sessionId) => {
    if (sessionData.expiresAt <= now) {
      global.tmsSessions?.delete(sessionId);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired TMS sessions`);
    
    // Clear tmsSessionId from cookies when sessions are cleaned up
    if (typeof window !== 'undefined') {
      clearSessionCookiesClient(false);
      console.log('Cleared session cookies during session cleanup');
    }
  }
};

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
