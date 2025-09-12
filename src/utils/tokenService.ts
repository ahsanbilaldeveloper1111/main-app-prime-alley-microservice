import { signOut } from 'next-auth/react';
import { toast } from 'react-toastify';
import { clearAllLocalStorage } from './localStorageUtils';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

class TokenService {
  private refreshInterval: NodeJS.Timeout | null = null;
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
      console.error('Error decoding token:', error);
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

  // Refresh token function
  private async refreshToken(): Promise<string | null> {
    try {
      const tokens = this.getTokens();
      if (!tokens) {
       // console.log('No tokens available for refresh');
        return null;
      }

     // console.log('Refreshing token...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}auth/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokens.refreshToken
        }),
      });

      const data = await response.json();
      //console.log('Token refresh response:', data);

      if (data.code === 200 && data.data?.access_token) {
        // Save new tokens
        this.saveTokens({
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token?.access_token || tokens.refreshToken,
          accessTokenExpires: data.data.expires_in || tokens.accessTokenExpires,
          refreshTokenExpires: data.data.refresh_token?.expires_in || tokens.refreshTokenExpires,
        });

       // console.log('Token refreshed successfully');
        return data.data.access_token;
      } else {
        //console.log('Token refresh failed:', data);
        this.handleTokenRefreshFailure();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.handleTokenRefreshFailure();
      return null;
    }
  }

  // Handle token refresh failure
  private handleTokenRefreshFailure(): void {
   // console.log('Token refresh failed, clearing session...');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
    
    // Clear all localStorage data
    clearAllLocalStorage();
    
    // Clear TMS session ID from localStorage and cookies
    if (typeof window !== 'undefined') {
      // Clear from localStorage
      localStorage.removeItem('tmsSessionId');
      console.log('Cleared tmsSessionId from localStorage on auto logout');
      
      // Clear from cookies by setting them to expire
      const cookieOptions = [
        'tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'tmsSessionId=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ];
      
      // Set cookies to expire
      cookieOptions.forEach(cookie => {
        document.cookie = cookie;
      });
      console.log('Cleared tmsSessionId cookies on auto logout');
    }
    
    signOut();
    // Simple redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    toast.error('Session expired - Please login again');
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

    // Check if access token is expired or about to expire
    if (this.isTokenExpired(tokens.accessToken, 5)) {
      //console.log('Access token expired or expiring soon, refreshing...');
      
      this.isRefreshing = true;
      this.refreshPromise = this.refreshToken();
      
      try {
        const newToken = await this.refreshPromise;
        if (!newToken) {
          //console.log('Token refresh failed, but not clearing session immediately');
          // Don't immediately clear session on refresh failure
          // Let the axios interceptor handle it
        }
      } catch (error) {
        //console.error('Token refresh error:', error);
        // Don't immediately clear session on error
        // Let the axios interceptor handle it
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    } else {
      //console.log('Access token is still valid');
    }
  }

  // Start the background token service
  public start(): void {
    //console.log('Starting background token service...');
    
    // Stop any existing intervals
    this.stop();

    // Check token every 30 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 30000); // 30 seconds

    // Initial check
    this.checkAndRefreshToken();
  }

  // Stop the background token service
  public stop(): void {
    //console.log('Stopping background token service...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
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