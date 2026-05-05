import { signOut } from 'next-auth/react';
import { getLogoutCallbackUrl } from './logoutRedirect';
import { toast } from 'react-toastify';
import { clearAllLocalStorage } from './localStorageUtils';
import { clearSessionCookiesClient } from './cookieUtils';
import axiosInstance from './axios';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

interface TokenTimers {
  sessionTimer: NodeJS.Timeout | null;
  refreshTimer: NodeJS.Timeout | null;
}

class TokenService {
  private timers: TokenTimers = {
    sessionTimer: null,
    refreshTimer: null
  };
  private logoutInProgress = false;
  
  // Buffer time to refresh before expiry (milliseconds)
  private readonly REFRESH_BUFFER = 30 * 1000;
  private checkInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_COOLDOWN = 60 * 1000; // 1 minute cooldown after failures

  // Helper function to decode JWT token and get expiration
  private decodeToken(token: string): { exp: number; iat: number } | null {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      // console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get token expiration time in milliseconds
  private getTokenExpiration(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    return decoded.exp * 1000; // Convert to milliseconds
  }

  // Check if token is expired (with buffer time)
  private isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
    return Date.now() >= (expiration - bufferTime);
  }

  // Clean up corrupted tokens from sessionStorage
  private cleanupCorruptedTokens(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');

    // Remove corrupted tokens
    if (accessToken === '[object Object]' || (accessToken && typeof accessToken !== 'string')) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessTokenExpires');
    }
    if (refreshToken === '[object Object]' || (refreshToken && typeof refreshToken !== 'string')) {
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshTokenExpires');
    }
  }

  // Get tokens from session storage
  private getTokens(): TokenData | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }

    // Clean up any corrupted tokens first
    this.cleanupCorruptedTokens();

    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    const accessTokenExpires = sessionStorage.getItem('accessTokenExpires');
    const refreshTokenExpires = sessionStorage.getItem('refreshTokenExpires');

    // Filter out invalid tokens (objects converted to strings)
    if (!accessToken || !refreshToken || 
        accessToken === '[object Object]' || refreshToken === '[object Object]' ||
        typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      accessTokenExpires: accessTokenExpires ? parseInt(accessTokenExpires) : 0,
      refreshTokenExpires: refreshTokenExpires ? parseInt(refreshTokenExpires) : 0,
    };
  }

  // Save tokens to session storage
  private saveTokens(tokens: Partial<TokenData>): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    // Ensure accessToken is a string before saving
    if (tokens.accessToken && typeof tokens.accessToken === 'string') {
      sessionStorage.setItem('accessToken', tokens.accessToken);
    } else if (tokens.accessToken) {
      console.warn('Attempted to save non-string accessToken:', tokens.accessToken);
    }

    // Ensure refreshToken is a string before saving - never save objects
    if (tokens.refreshToken && typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 0) {
      sessionStorage.setItem('refreshToken', tokens.refreshToken);
    } else if (tokens.refreshToken) {
      console.warn('Attempted to save non-string refreshToken:', tokens.refreshToken);
      // Don't save invalid refresh token - keep existing one if available
      const currentTokens = this.getTokens();
      if (currentTokens?.refreshToken && typeof currentTokens.refreshToken === 'string') {
        sessionStorage.setItem('refreshToken', currentTokens.refreshToken);
      }
    }

    if (tokens.accessTokenExpires) {
      sessionStorage.setItem('accessTokenExpires', tokens.accessTokenExpires.toString());
    }
    if (tokens.refreshTokenExpires) {
      sessionStorage.setItem('refreshTokenExpires', tokens.refreshTokenExpires.toString());
    }
  }

  // Refresh token function with support for both session and refresh token
  private async refreshToken(forceRefreshToken: boolean = false): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      //console.log('⚠️ Token refresh already in progress, waiting for completion');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
    try {
      const tokens = this.getTokens();
      if (!tokens) {
          //console.log('❌ No tokens available for refresh');
        return null;
      }

        const now = Date.now();
        const refreshTokenExpiry = tokens.refreshTokenExpires;
        const needsRefreshToken = forceRefreshToken || (refreshTokenExpiry - now) <= this.REFRESH_BUFFER;

        const formData = new URLSearchParams();
        formData.append('refresh_token', tokens.refreshToken);
        if (needsRefreshToken) {
          formData.append('force_refresh', 'true');
        }

        // console.log('📤 Sending form data:', formData.toString());

        let response;
          try {
            // Use axiosInstance to go through Next.js API route /api/token/refresh
            // NOTE: Cannot use /api/auth/* paths as they are handled by NextAuth
            response = await axiosInstance.post('/token/refresh', formData.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 3000000 // 30 seconds timeout
          });
          // console.log('📥 Raw response:', response);
        } catch (error: any) {
          if (error.response) {
          } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || 
                     error.code === 'ERR_CONNECTION_TIMED_OUT' || error.code === 'ETIMEDOUT' ||
                     error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            
            this.isRefreshing = false;
            this.refreshPromise = null;
            return null;
          } else {
            
            throw error;
          }
        }

        if (!response || !response.data) {
          
          this.isRefreshing = false;
          this.refreshPromise = null;
          return null;
        }

      const data = response.data;

        if (data.code === 200 && data.data?.access_token) {
          const now = Date.now();
          const newTokens: Partial<TokenData> = {
            accessToken: data.data.access_token,
            accessTokenExpires: now + (data.data.expires_in * 1000) // Convert seconds to milliseconds
          };

          // Handle new refresh token format: refresh_token is now a direct string
          // Support both new format (direct string) and old format (nested object) for backward compatibility
          let newRefreshToken: string | undefined;
          let newRefreshTokenExpires: number | undefined;

          // Check if refresh_token exists and is not an empty object
          const refreshTokenValue = data.data.refresh_token;
          const isEmptyObject = refreshTokenValue && typeof refreshTokenValue === 'object' && Object.keys(refreshTokenValue).length === 0;

          if (typeof refreshTokenValue === 'string' && refreshTokenValue.length > 0) {
            // New format: refresh_token is a direct string
            newRefreshToken = refreshTokenValue;
            // Check for refresh_token_expires_in (new format) or refresh_token.expires_in (old format)
            if (data.data.refresh_token_expires_in) {
              newRefreshTokenExpires = now + (data.data.refresh_token_expires_in * 1000);
            }
          } else if (!isEmptyObject && refreshTokenValue?.access_token && typeof refreshTokenValue.access_token === 'string') {
            // Old format: refresh_token is nested object (backward compatibility)
            newRefreshToken = refreshTokenValue.access_token;
            if (refreshTokenValue.expires_in) {
              newRefreshTokenExpires = now + (refreshTokenValue.expires_in * 1000);
            }
          }

          if (newRefreshToken) {
            newTokens.refreshToken = newRefreshToken;
            if (newRefreshTokenExpires) {
              newTokens.refreshTokenExpires = newRefreshTokenExpires;
            } else {
              // If no expiry provided, keep existing expiry or use default
              const currentTokens = this.getTokens();
              if (currentTokens) {
                newTokens.refreshTokenExpires = currentTokens.refreshTokenExpires;
              }
            }
          } else {
            // Keep existing refresh token if not provided
            const currentTokens = this.getTokens();
            if (currentTokens) {
              newTokens.refreshToken = currentTokens.refreshToken;
              newTokens.refreshTokenExpires = currentTokens.refreshTokenExpires;
            }
          }

          this.saveTokens(newTokens);
          
          this.setupTokenRefreshTimers();
          
          // console.log('Tokens refreshed successfully');
        return data.data.access_token;
      } else {
          // console.log('Token refresh failed:', data);
          this.handleTokenRefreshFailure(new Error('Refresh failed'));
        return null;
      }
    } catch (error) {
      // console.error('Token refresh error:', error);
        this.handleTokenRefreshFailure(error);
      return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
    }
    })();

    return this.refreshPromise;
  }

  // Handle token refresh failure
  private setupTokenRefreshTimers(): void {
     // console.log('Setting up token refresh timers...');
    
    // Clear existing timers
    if (this.timers.sessionTimer) {
      clearTimeout(this.timers.sessionTimer);
      this.timers.sessionTimer = null;
    }
    if (this.timers.refreshTimer) {
      clearTimeout(this.timers.refreshTimer);
      this.timers.refreshTimer = null;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      return;
    }

    const now = Date.now();
    
    // Setup access token refresh timer (refresh slightly before expiry)
    const sessionTimeUntilRefresh = Math.max(0, (tokens.accessTokenExpires - now) - this.REFRESH_BUFFER);
    this.timers.sessionTimer = setTimeout(async () => {
      await this.refreshToken(false);
    }, sessionTimeUntilRefresh);

    // Setup refresh token refresh timer (refresh slightly before expiry)
    const refreshTimeUntilRefresh = Math.max(0, (tokens.refreshTokenExpires - now) - this.REFRESH_BUFFER);
    this.timers.refreshTimer = setTimeout(async () => {
      await this.refreshToken(true);
    }, refreshTimeUntilRefresh);

   
  }

  private handleTokenRefreshFailure(error: any): void {
    // If it's a 400 error, just log it and continue
    if (error?.response?.status === 400) {
      // console.log('Refresh token returned 400, keeping session active');
      return;
    }

    // If it's a network/timeout error, don't logout - let it retry
    if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_CONNECTION_TIMED_OUT' || 
        error?.code === 'ETIMEDOUT' || error?.code === 'ERR_NETWORK' ||
        error?.message?.includes('timeout') || error?.message?.includes('Network Error')) {
      // console.log('Network/timeout error during refresh, will retry - not logging out');
      return;
    }

    // Only logout on actual authentication errors (401, 403) or invalid token errors
    // Don't logout on network errors or timeouts
    // if (error?.response?.status === 401 || error?.response?.status === 403) {
      // console.log('Token refresh failed with auth error, clearing session...');
      if (typeof window !== 'undefined' && window.sessionStorage) {
        // Prevent repeated redirects/toasts when multiple requests fail at once
        if (this.logoutInProgress || (window as any).__authLogoutInProgress) {
          return;
        }

        // Never spam "session expired" flow on auth pages
        if (window.location.pathname.startsWith('/auth/')) {
          this.stop();
          return;
        }

        this.logoutInProgress = true;
        (window as any).__authLogoutInProgress = true;
        this.stop();

        // Best-effort: clear server-side NextAuth session payload before wiping cookies,
        // otherwise the server can still consider the old cookie session valid.
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

        sessionStorage.clear();
        clearAllLocalStorage();
        clearSessionCookiesClient(true);
        const callbackUrl = getLogoutCallbackUrl();
        // Await signOut so NextAuth session cookie is cleared before redirect.
        // Otherwise signin page may still see "authenticated" and redirect to dashboard, causing a loop.
        signOut({ callbackUrl, redirect: false }).then(() => {
          toast.error('Session expired - Please login again', { toastId: 'session-expired' });
          window.location.replace(callbackUrl);
        });
      }
    // } else {
      // console.log('Token refresh failed but not an auth error, keeping session active:', error?.response?.status);
    // }
  }

  // Check token status and refresh if needed
  private async checkAndRefreshToken(): Promise<void> {
    if (this.isRefreshing) {
      // If already refreshing, wait for the current refresh to complete
      if (this.refreshPromise) {
        await this.refreshPromise;
      }
      return;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      //console.log('No tokens found, stopping token service');
      this.stop();
      return;
    }

    // Check if we've had too many consecutive failures - stop trying to refresh
    const now = Date.now();
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      if (this.lastFailureTime && (now - this.lastFailureTime) < this.FAILURE_COOLDOWN) {
        // Still in cooldown period, don't attempt refresh
        return;
      } else {
        // Reset failure count after cooldown
        this.consecutiveFailures = 0;
        this.lastFailureTime = null;
      }
    }

    // Check if refresh token is expired - if so, stop trying to refresh
    if (tokens.refreshTokenExpires > 0 && tokens.refreshTokenExpires <= now) {
      //console.log('Refresh token expired, stopping token service');
      this.stop();
      this.handleTokenRefreshFailure(new Error('Refresh token expired'));
      return;
    }

    // Timer-only strategy:
    // Access token refresh is handled by `setupTokenRefreshTimers()` (expiry - REFRESH_BUFFER).
    // This interval only enforces refresh-token expiry and keeps timers present.
    if (!this.timers.sessionTimer || !this.timers.refreshTimer) {
      this.setupTokenRefreshTimers();
    }
  }

  // Start the background token service
  public start(): void {
    // console.log('🔄 Starting background token service...');
    
    // Stop any existing intervals
    this.stop();

    // Check periodically to enforce refresh-token expiry and keep timers scheduled.
    this.checkInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 20000);

    // Initial check
    this.checkAndRefreshToken();
    
    // Also setup timers based on expiry timestamps for more precise timing
    this.setupTokenRefreshTimers();
  }

  // Stop the background token service
  public stop(): void {
    //console.log('Stopping background token service...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Clear all timers
    if (this.timers.sessionTimer) {
      clearTimeout(this.timers.sessionTimer);
      this.timers.sessionTimer = null;
    }
    if (this.timers.refreshTimer) {
      clearTimeout(this.timers.refreshTimer);
      this.timers.refreshTimer = null;
    }
  }

  // Force refresh token (for manual refresh)
  public async forceRefresh(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      if (this.logoutInProgress || (window as any).__authLogoutInProgress) {
        return null;
      }
      if (window.location.pathname.startsWith('/auth/')) {
        return null;
      }
    }
    //console.log('Force refreshing token...');
    const token = await this.refreshToken();
    if(typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('accessToken', token || '');
    }
    this.saveTokens({ accessToken: token || '' });

    return token || null;
  }

  // Get current access token
  public getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    
    return !this.isTokenExpired(tokens.accessToken, 0);
  }

  // Initialize tokens from session data
  public async initializeFromSession(session: any): Promise<void> {
    if (!session?.user) {
    //  console.log('No session user data available');
      return;
    }

    const tokenData: Partial<TokenData> = {};
    
    // Ensure access_token is a string
    if (session.user.access_token && typeof session.user.access_token === 'string') {
      tokenData.accessToken = session.user.access_token;
    }
    
    // Ensure refresh_token is a string, never save objects
    if (session.user.refresh_token && typeof session.user.refresh_token === 'string' && session.user.refresh_token.length > 0) {
      tokenData.refreshToken = session.user.refresh_token;
    }
    if (session.user.access_token_expires) {
      tokenData.accessTokenExpires = typeof session.user.access_token_expires === 'string' 
        ? parseInt(session.user.access_token_expires) 
        : session.user.access_token_expires;
    }
    if (session.user.refresh_token_expires) {
      tokenData.refreshTokenExpires = typeof session.user.refresh_token_expires === 'string' 
        ? parseInt(session.user.refresh_token_expires) 
        : session.user.refresh_token_expires;
    }

    // Only save and start if we have both tokens
    if (tokenData.accessToken && tokenData.refreshToken) {
      // Check if existing tokens are still valid before overwriting
      const existingTokens = this.getTokens();
      if (existingTokens && tokenData.accessTokenExpires) {
        const now = Date.now();
        const existingTimeUntilExpiry = existingTokens.accessTokenExpires - now;
        const newTimeUntilExpiry = tokenData.accessTokenExpires - now;
        
        // Only update if new token is newer or existing token is expired
        // This prevents overwriting a valid token with an older one
        if (existingTimeUntilExpiry > 0 && existingTimeUntilExpiry > newTimeUntilExpiry) {
          // Existing token is still valid and newer, don't overwrite
          return;
        }
      }
      
      this.saveTokens(tokenData);
      
      this.start();
    //  console.log('Token service initialized successfully');
    } else {
    //  console.log('Incomplete token data, cannot initialize token service');
    }
  }

  // Clear all tokens and stop service
  public clearTokens(): void {
   // console.log('Clearing tokens...');
    this.stop();
    
    // Reset failure tracking
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessTokenExpires');
      sessionStorage.removeItem('refreshTokenExpires');
    }
    
    // Clear all localStorage data
    clearAllLocalStorage();
  }
}

// Create singleton instance
const tokenService = new TokenService();

export default tokenService; 