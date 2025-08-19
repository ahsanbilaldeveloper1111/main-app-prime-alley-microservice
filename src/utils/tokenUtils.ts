import tokenService from './tokenService';

// Utility functions for token management

/**
 * Get the current access token from sessionStorage
 * @returns The access token or null if not found
 */
export const getCurrentAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Get the current refresh token from sessionStorage
 * @returns The refresh token or null if not found
 */
export const getCurrentRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('refreshToken');
  }
  return null;
};

/**
 * Check if the user is currently authenticated
 * @returns True if user is authenticated, false otherwise
 */
export const isUserAuthenticated = (): boolean => {
  return tokenService.isAuthenticated();
};

/**
 * Check if tokens exist in sessionStorage
 * @returns True if tokens exist, false otherwise
 */
export const hasTokens = (): boolean => {
  const accessToken = getCurrentAccessToken();
  const refreshToken = getCurrentRefreshToken();
  return !!(accessToken && refreshToken);
};

/**
 * Force refresh the current token
 * @returns The new access token or null if refresh failed
 */
export const refreshCurrentToken = async (): Promise<string | null> => {
  return await tokenService.forceRefresh();
};

/**
 * Clear all tokens and stop the token service
 * Use this for logout
 */
export const clearAllTokens = (): void => {
  tokenService.clearTokens();
};

/**
 * Get token expiration time
 * @param token The JWT token to check
 * @returns Expiration time in milliseconds or null if invalid
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * @param token The JWT token to check
 * @param bufferMinutes Buffer time in minutes before expiration (default: 5)
 * @returns True if token is expired or will expire within buffer time
 */
export const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
  return Date.now() >= (expiration - bufferTime);
};

/**
 * Get time until token expires
 * @param token The JWT token to check
 * @returns Time in milliseconds until expiration, or null if invalid
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return null;
  
  return Math.max(0, expiration - Date.now());
};

/**
 * Format time until expiration for display
 * @param token The JWT token to check
 * @returns Formatted string like "5m 30s" or "Expired"
 */
export const getFormattedTimeUntilExpiration = (token: string): string => {
  const timeUntil = getTimeUntilExpiration(token);
  if (timeUntil === null) return 'Invalid token';
  if (timeUntil === 0) return 'Expired';
  
  const minutes = Math.floor(timeUntil / (1000 * 60));
  const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Initialize tokens from session data
 * @param session The session object from NextAuth
 */
export const initializeTokensFromSession = (session: any): void => {
  if (!session?.user) return;

  if (typeof window !== 'undefined') {
    if (session.user.access_token) {
      sessionStorage.setItem('accessToken', session.user.access_token);
    }
    if (session.user.refresh_token) {
      sessionStorage.setItem('refreshToken', session.user.refresh_token);
    }
    if (session.user.access_token_expires) {
      sessionStorage.setItem('accessTokenExpires', String(session.user.access_token_expires));
    }
    if (session.user.refresh_token_expires) {
      sessionStorage.setItem('refreshTokenExpires', String(session.user.refresh_token_expires));
    }
  }
}; 