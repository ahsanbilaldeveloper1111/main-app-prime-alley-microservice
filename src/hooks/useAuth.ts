import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { initializeTokensFromSession, hasTokens } from '../utils/tokenUtils';
import { useTokenService } from './useTokenService';
import { sessionStore } from '../utils/sessionStore';
import { clearSessionCookiesClient } from '../utils/cookieUtils';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const { clearTokens, isAuthenticated } = useTokenService();
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
        // Note: TMS session ID is stored in cookies, not sessionStorage

        // Get current TMS session ID from cookie to clear from memory
        const cookies = document.cookie.split(';');
        //console.log('Current cookies before logout:', cookies);
        const tmsSessionIdCookie = cookies.find(cookie =>
          cookie.trim().startsWith('tmsSessionId=')
        );
        //console.log('Found tmsSessionId cookie:', tmsSessionIdCookie);

        if (tmsSessionIdCookie) {
          const sessionId = tmsSessionIdCookie.split('=')[1];
          if (sessionId) {
            // Clear session from memory store
            sessionStore.delete(sessionId);
            //console.log('Cleared TMS session from memory store:', sessionId);
            
            // Call logout API to clear server-side session and cookie
            try {
              const logoutResponse = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
              });
              
              if (logoutResponse.ok) {
                const logoutData = await logoutResponse.json();
              console.log('Logout API response:', logoutData);
              console.log('Successfully cleared server-side session and cookie');
              
              // Check if cookie was cleared
              setTimeout(() => {
                const cookiesAfter = document.cookie.split(';');
                console.log('Cookies after logout API call:', cookiesAfter);
                const tmsSessionIdAfter = cookiesAfter.find(cookie =>
                  cookie.trim().startsWith('tmsSessionId=')
                );
                console.log('tmsSessionId cookie after logout API:', tmsSessionIdAfter);
              }, 100);
              } else {
                console.error('Logout API returned error status:', logoutResponse.status);
                const errorText = await logoutResponse.text();
                console.error('Logout API error response:', errorText);
              }
            } catch (apiError) {
              console.error('Error calling logout API:', apiError);
            }
            
            // Client-side cookie clearing as backup
            try {
              clearSessionCookiesClient(false);
              console.log('Cleared session cookies client-side as backup');
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
  };
}; 