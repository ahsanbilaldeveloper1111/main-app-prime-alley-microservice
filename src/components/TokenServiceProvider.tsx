import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import tokenService from '../utils/tokenService';

interface TokenServiceProviderProps {
  children: React.ReactNode;
}

export const TokenServiceProvider: React.FC<TokenServiceProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Initialize token service when session is available
    if (status === 'authenticated' && session) {
     // console.log('TokenServiceProvider: Initializing token service');
      tokenService.initializeFromSession(session);
    } else if (status === 'unauthenticated') {
      // console.log('TokenServiceProvider: User not authenticated, stopping token service');
      tokenService.stop();
    }
  }, [session, status]);

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