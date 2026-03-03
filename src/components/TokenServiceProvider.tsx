import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import tokenService from '../utils/tokenService';

interface TokenServiceProviderProps {
  children: React.ReactNode;
}

export const TokenServiceProvider: React.FC<TokenServiceProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Never run token refresh logic on auth pages (prevents loops on /auth/signin when tokens expire)
    if (router.pathname.startsWith('/auth/')) {
      tokenService.stop();
      return;
    }

    // Initialize token service when session is available
    if (status === 'authenticated' && session) {
      // Clear any in-flight logout flag once we are authenticated inside the app
      if (typeof window !== 'undefined') {
        (window as any).__authLogoutInProgress = false;
      }
     // console.log('TokenServiceProvider: Initializing token service');
      tokenService.initializeFromSession(session).catch((error) => {
        console.error('Failed to initialize token service:', error);
      });
    } else if (status === 'unauthenticated') {
      // console.log('TokenServiceProvider: User not authenticated, stopping token service');
      tokenService.stop();
    }
  }, [session, status, router.pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only stop if user is not authenticated
      if (status === 'unauthenticated') {
        tokenService.stop();
      }
    };
  }, [status]);

  return <>{children}</>;
}; 