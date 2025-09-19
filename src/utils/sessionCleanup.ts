/**
 * Utility to clean up expired TMS sessions from memory store
 * This should be called periodically to prevent memory leaks
 */

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
      // Clear from sessionStorage
      sessionStorage.removeItem('tmsSessionId');
      console.log('Cleared tmsSessionId from sessionStorage during session cleanup');
      
      // Clear from cookies by setting them to expire
      const cookieOptions = [
        'tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ];
      
      // Set cookies to expire
      cookieOptions.forEach(cookie => {
        document.cookie = cookie;
      });
      console.log('Cleared tmsSessionId cookies during session cleanup');
    }
  }
};

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
