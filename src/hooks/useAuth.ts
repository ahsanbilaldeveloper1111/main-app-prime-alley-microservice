import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { initializeTokensFromSession, hasTokens } from '../utils/tokenUtils';
import { useTokenService } from './useTokenService';
import { useTmsSessionCompat } from './useTmsSessionCompat';
import { sessionStore } from '../utils/sessionStore';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const { clearTokens, isAuthenticated } = useTokenService();
  const { tmsSession } = useTmsSessionCompat();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'authenticated' && session) {
      // Initialize tokens from session
      initializeTokensFromSession(session);
      setIsInitialized(true);
    } else if (status === 'unauthenticated') {
      // Clear tokens when not authenticated
      clearTokens();
      // TMS session is now managed by NextAuth, no need to manually clear
      setIsInitialized(true);
    }
  }, [session, status, clearTokens]);

  const logout = async () => {
    try {
      clearTokens();

      // Clear TMS session data
      if (typeof window !== 'undefined') {
        // Clear TMS session ID from localStorage
        localStorage.removeItem('tmsSessionId');
        console.log('Cleared tmsSessionId from localStorage');

        // Get current TMS session ID from cookie to clear from memory
        const cookies = document.cookie.split(';');
        const tmsSessionIdCookie = cookies.find(cookie =>
          cookie.trim().startsWith('tmsSessionId=')
        );

        if (tmsSessionIdCookie) {
          const sessionId = tmsSessionIdCookie.split('=')[1];
          if (sessionId) {
            // Clear session from memory store
            sessionStore.delete(sessionId);
            console.log('Cleared TMS session from memory store:', sessionId);
            
            // Call logout API to clear server-side session and cookie
            try {
              await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              });
              console.log('Called logout API to clear server-side session');
            } catch (apiError) {
              console.error('Error calling logout API:', apiError);
            }
            
            // Client-side cookie clearing as backup
            try {
              // Try multiple cookie clearing approaches
              const cookieClearingAttempts = [
                'tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'tmsSessionId=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'tmsSessionId=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'tmsSessionId=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
              ];
              
              cookieClearingAttempts.forEach((cookieString, index) => {
                document.cookie = cookieString;
                console.log(`Cookie clearing attempt ${index + 1}:`, cookieString);
              });
              
              console.log('Cleared tmsSessionId cookie client-side as backup');
            } catch (cookieError) {
              console.error('Error clearing cookie client-side:', cookieError);
            }
          }
        }
      }
      
      await signOut();
      
      // Simple redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if signOut fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  };

  return {
    session,
    status,
    isAuthenticated: isAuthenticated(),
    hasTokens: hasTokens(),
    isInitialized,
    logout,
    // Expose TMS session for backward compatibility
    tmsSession,
  };
}; 