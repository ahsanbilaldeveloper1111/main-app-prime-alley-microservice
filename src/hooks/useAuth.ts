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
      setIsInitialized(true);
    }
  }, [session, status, clearTokens]);

  const logout = async () => {
    try {
      clearTokens();
      clearSessionCookiesClient(true);
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