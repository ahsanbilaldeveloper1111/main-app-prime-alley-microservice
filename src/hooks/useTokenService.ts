import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import tokenService from '../utils/tokenService';

export const useTokenService = () => {
  const { data: session, status } = useSession();

  // Initialize token service when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      //console.log('Initializing token service with session data');
      tokenService.initializeFromSession(session);
    } else if (status === 'unauthenticated') {
      //console.log('User not authenticated, stopping token service');
      tokenService.stop();
    }
  }, [session, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop the service on component unmount as it should run globally
      // Only stop if the user is not authenticated
      if (status === 'unauthenticated') {
        tokenService.stop();
      }
    };
  }, [status]);

  // Force refresh token
  const forceRefresh = useCallback(async () => {
    return await tokenService.forceRefresh();
  }, []);

  // Get current access token
  const getAccessToken = useCallback(() => {
    return tokenService.getAccessToken();
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return tokenService.isAuthenticated();
  }, []);

  // Clear tokens (for logout)
  const clearTokens = useCallback(() => {
    tokenService.clearTokens();
  }, []);

  return {
    forceRefresh,
    getAccessToken,
    isAuthenticated,
    clearTokens,
    isInitialized: status !== 'loading',
  };
}; 