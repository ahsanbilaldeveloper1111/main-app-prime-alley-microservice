import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import tokenService from '../utils/tokenService';

export const useTokenService = () => {
  const { status } = useSession();

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