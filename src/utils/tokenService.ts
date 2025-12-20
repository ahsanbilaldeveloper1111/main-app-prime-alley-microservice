import { signOut } from 'next-auth/react';
import { toast } from 'react-toastify';
import { clearAllLocalStorage } from './localStorageUtils';
import axiosInstance from './axios';
import directApi from './directApi';

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
  
  // Buffer time to refresh before expiry (30 seconds)
  private readonly REFRESH_BUFFER = 30 * 1000; // Buffer for 5-minute session token
  private checkInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

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

  // Get tokens from session storage
  private getTokens(): TokenData | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }

    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    const accessTokenExpires = sessionStorage.getItem('accessTokenExpires');
    const refreshTokenExpires = sessionStorage.getItem('refreshTokenExpires');

    if (!accessToken || !refreshToken) {
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

    if (tokens.accessToken) {
      sessionStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      sessionStorage.setItem('refreshToken', tokens.refreshToken);
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
    //console.log('🔄 Token refresh requested:', { forceRefreshToken });
    
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

        // console.log('📊 Current tokens status:', {
        //   hasAccessToken: !!tokens.accessToken,
        //   hasRefreshToken: !!tokens.refreshToken,
        //   accessTokenExpiresIn: Math.floor((tokens.accessTokenExpires - Date.now()) / 1000) + 's',
        //   refreshTokenExpiresIn: Math.floor((tokens.refreshTokenExpires - Date.now()) / 1000) + 's'
        // });

        const now = Date.now();
        const refreshTokenExpiry = tokens.refreshTokenExpires;
        const needsRefreshToken = forceRefreshToken || (refreshTokenExpiry - now) <= this.REFRESH_BUFFER;

        // console.log('Refreshing tokens...', {
        //   needsRefreshToken,
        //   forceRefreshToken,
        //   timeUntilRefreshExpiry: refreshTokenExpiry - now
        // });

        // console.log('📤 Sending refresh request:', {
        //   needsRefreshToken,
        //   forceRefreshToken,
        //   timeUntilRefreshExpiry: Math.floor((refreshTokenExpiry - now) / 1000) + 's'
        // });

        // Create form data for refresh token request
        // console.log('🔍 Debug refresh token request:', {
        //   currentRefreshToken: tokens.refreshToken,
        //   needsRefreshToken,
        //   tokenExpiry: new Date(tokens.refreshTokenExpires).toISOString(),
        //   timeLeft: Math.floor((tokens.refreshTokenExpires - Date.now()) / 1000) + 's'
        // });

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
            timeout: 30000 // 30 seconds timeout
          });
          // console.log('📥 Raw response:', response);
        } catch (error: any) {
          if (error.response) {
            // console.error('🚨 Refresh request failed:', {
            //   status: error.response.status,
            //   statusText: error.response.statusText,
            //   data: error.response.data,
            //   headers: error.response.headers,
            //   requestUrl: error.config?.url,
            //   requestMethod: error.config?.method,
            //   requestHeaders: error.config?.headers,
            //   requestData: error.config?.data
            // });
          } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || 
                     error.code === 'ERR_CONNECTION_TIMED_OUT' || error.code === 'ETIMEDOUT' ||
                     error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            // console.error('🚨 Refresh request timed out or network error:', error.message, error.code);
            // Don't throw on timeout/network errors, let it retry on next check
            // Don't call handleTokenRefreshFailure for network/timeout errors
            this.isRefreshing = false;
            this.refreshPromise = null;
            return null;
          } else {
            // console.error('🚨 Refresh request failed with error:', error.message, error.code);
            // Only throw for non-network errors so handleTokenRefreshFailure can decide
            throw error;
          }
        }

        if (!response || !response.data) {
          // console.error('🚨 Invalid response from refresh token API');
          this.isRefreshing = false;
          this.refreshPromise = null;
          return null;
        }

      const data = response.data;
        // console.log('📥 Refresh response received:', {
        //   status: response.status,
        //   code: data.code,
        //   hasAccessToken: !!data.data?.access_token,
        //   hasRefreshToken: !!data.data?.refresh_token?.access_token,
        //   newExpiresIn: data.data?.expires_in,
        //   newRefreshExpiresIn: data.data?.refresh_token?.expires_in
        // });

        if (data.code === 200 && data.data?.access_token) {
          const newTokens: Partial<TokenData> = {
            accessToken: data.data.access_token,
            accessTokenExpires: Date.now() + (data.data.expires_in * 1000) // Convert seconds to milliseconds
          };

          // If we got a new refresh token, update it
          if (data.data.refresh_token?.access_token) {
            newTokens.refreshToken = data.data.refresh_token.access_token;
            newTokens.refreshTokenExpires = Date.now() + (data.data.refresh_token.expires_in * 1000); // Convert seconds to milliseconds
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
    // console.log('🔄 Setting up token refresh timers...');
    
    // Clear existing timers
    if (this.timers.sessionTimer) {
      // console.log('⚠️ Clearing existing session timer');
      clearTimeout(this.timers.sessionTimer);
    }
    if (this.timers.refreshTimer) {
      // console.log('⚠️ Clearing existing refresh timer');
      clearTimeout(this.timers.refreshTimer);
    }

    const tokens = this.getTokens();
    if (!tokens) {
      // console.log('❌ No tokens found, cannot setup refresh timers');
      return;
    }

    const now = Date.now();
    // console.log('📊 Current token status:', {
    //   accessTokenExpiresIn: Math.floor((tokens.accessTokenExpires - now) / 1000) + 's',
    //   refreshTokenExpiresIn: Math.floor((tokens.refreshTokenExpires - now) / 1000) + 's',
    //   currentTime: new Date(now).toISOString(),
    //   accessTokenExpireTime: new Date(tokens.accessTokenExpires).toISOString(),
    //   refreshTokenExpireTime: new Date(tokens.refreshTokenExpires).toISOString(),
    //   timeUntilAccessRefresh: Math.floor(((tokens.accessTokenExpires - now) - this.REFRESH_BUFFER) / 1000) + 's',
    //   timeUntilRefreshTokenRefresh: Math.floor(((tokens.refreshTokenExpires - now) - this.REFRESH_BUFFER) / 1000) + 's',
    //   refreshBufferSeconds: Math.floor(this.REFRESH_BUFFER / 1000) + 's'
    // });
    
    // Setup session token refresh timer (15 minutes - buffer)
    const sessionTimeUntilRefresh = Math.max(0, (tokens.accessTokenExpires - now) - this.REFRESH_BUFFER);
    // console.log('⏰ Setting session refresh timer for:', Math.floor(sessionTimeUntilRefresh / 1000) + 's');
    this.timers.sessionTimer = setTimeout(async () => {
      // console.log('🔄 Session token refresh triggered');
      await this.refreshToken(false);
    }, sessionTimeUntilRefresh);

    // Setup refresh token refresh timer (2 hours - buffer)
    const refreshTimeUntilRefresh = Math.max(0, (tokens.refreshTokenExpires - now) - this.REFRESH_BUFFER);
    // console.log('⏰ Setting refresh token timer for:', Math.floor(refreshTimeUntilRefresh / 1000) + 's');
    this.timers.refreshTimer = setTimeout(async () => {
      // console.log('🔄 Refresh token refresh triggered');
      await this.refreshToken(true);
    }, refreshTimeUntilRefresh);

    // console.log('Token refresh timers set:', {
    //   sessionRefreshIn: Math.floor(sessionTimeUntilRefresh / 1000) + 's',
    //   refreshTokenRefreshIn: Math.floor(refreshTimeUntilRefresh / 1000) + 's'
    // });
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
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // console.log('Token refresh failed with auth error, clearing session...');
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.clear();
        clearAllLocalStorage();
        signOut();
        window.location.href = '/auth/signin';
        toast.error('Session expired - Please login again');
      }
    } else {
      // console.log('Token refresh failed but not an auth error, keeping session active:', error?.response?.status);
    }
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

    // Check if access token is expired or about to expire (1 minute before expiry)
    const now = Date.now();
    const timeUntilExpiry = tokens.accessTokenExpires - now;
    const REFRESH_THRESHOLD = 1 * 60 * 1000; // 1 minute before expiry
    
    // Refresh if token is expired or will expire within 1 minute
    if (timeUntilExpiry <= REFRESH_THRESHOLD) {
      // console.log('🔄 Access token expired or expiring soon, refreshing proactively...', {
      //   timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + 's',
      //   expiresAt: new Date(tokens.accessTokenExpires).toISOString()
      // });
      
      this.isRefreshing = true;
      this.refreshPromise = this.refreshToken();
      
      try {
        const newToken = await this.refreshPromise;
        if (!newToken) {
          // console.log('⚠️ Token refresh failed, but not clearing session immediately');
          // Don't immediately clear session on refresh failure
          // Let the axios interceptor handle it
        } else {
          // console.log('✅ Token refreshed successfully in background');
        }
      } catch (error) {
        // console.error('❌ Token refresh error:', error);
        // Don't immediately clear session on error
        // Let the axios interceptor handle it
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    } else {
      //console.log('Access token is still valid', {
      //  timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + 's'
      //});
    }
  }

  // Start the background token service
  public start(): void {
    // console.log('🔄 Starting background token service...');
    
    // Stop any existing intervals
    this.stop();

    // Check token every 20 seconds for more proactive refresh
    // This ensures we catch tokens expiring soon and refresh them before they expire
    this.checkInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 20000); // 20 seconds - more frequent checks for proactive refresh

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
    //console.log('Force refreshing token...');
    return await this.refreshToken();
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
  public initializeFromSession(session: any): void {
    if (!session?.user) {
    //  console.log('No session user data available');
      return;
    }

    const tokenData: Partial<TokenData> = {};
    
    if (session.user.access_token) {
      tokenData.accessToken = session.user.access_token;
    }
    if (session.user.refresh_token) {
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