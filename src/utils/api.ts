import axios from 'axios';
import { getCurrentAccessToken, isTokenExpired } from './tokenUtils';
import { clearAllLocalStorage } from './localStorageUtils';
import { clearSessionCookiesClient } from './cookieUtils';
import { signOut } from 'next-auth/react';
import { getLogoutCallbackUrl } from './logoutRedirect';

// Same pattern as axios.ts: all requests go through Next.js proxy to avoid 431 (large cookies never sent to backend)
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 1000000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from sessionStorage
    const token = getCurrentAccessToken();
    
    if (token) {
      // Check the stored expiry timestamp first (more reliable than JWT parsing)
      if (typeof window !== 'undefined') {
        const expiresAt = sessionStorage.getItem('accessTokenExpires');
        if (expiresAt) {
          const expiryTime = Number.parseInt(expiresAt, 10);
          const now = Date.now();
          const timeUntilExpiry = expiryTime - now;
          
          // Only refresh if token is actually expired or expiring within 2 minutes
          // Since tokens last 15 minutes, we refresh when 2 minutes remain
          const REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes before expiry
          
          if (timeUntilExpiry > REFRESH_THRESHOLD) {
            // Token is still valid for more than 2 minutes, use it
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          }
          
          // Token is expired or expiring within 2 minutes, refresh it
          if (timeUntilExpiry <= 0 || timeUntilExpiry <= REFRESH_THRESHOLD) {
            try {
              const newToken = await authAPI.refreshToken();
              if (newToken) {
                config.headers.Authorization = `Bearer ${newToken}`;
              }
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              // Clear tokens and redirect to login
              if (typeof window !== 'undefined') {
                sessionStorage.clear();
                clearAllLocalStorage();
                clearSessionCookiesClient(true);
                const callbackUrl = getLogoutCallbackUrl();
                signOut({
                  callbackUrl,
                  redirect: false,
                }).then(() => {
                  window.location.href = callbackUrl;
                }).catch(() => {
                  window.location.href = callbackUrl;
                });
              }
            }
            return config;
          }
        }
      }

      // Fallback: Check token expiry using JWT parsing (if expiry timestamp not available)
      // Use 2 minutes buffer since tokens last 15 minutes
      const shouldRefresh = isTokenExpired(token, 2); // 2 minutes buffer
      
      if (shouldRefresh) {
        // Token is expired or expiring soon, refresh it
        try {
          const newToken = await authAPI.refreshToken();
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // Clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            sessionStorage.clear();
            clearAllLocalStorage();
            clearSessionCookiesClient(true);
            const callbackUrl = getLogoutCallbackUrl();
            signOut({
              callbackUrl,
              redirect: false,
            }).then(() => {
              window.location.href = callbackUrl;
            }).catch(() => {
              window.location.href = callbackUrl;
            });
          }
        }
      } else {
        // Token is valid, use it
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      //console.log('Received 401, attempting to refresh token...');

      try {
        // Try to refresh the token
        const newToken = await authAPI.refreshToken();
        if (newToken) {
          //console.log('Token refreshed successfully, retrying request...');
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          clearAllLocalStorage();
          clearSessionCookiesClient(true);
          const callbackUrl = getLogoutCallbackUrl();
          signOut({
            callbackUrl,
            redirect: false,
          }).then(() => {
            window.location.href = callbackUrl;
          }).catch(() => {
            window.location.href = callbackUrl;
          });
        }
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden
      console.error('Access forbidden');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API functions
export const authAPI = {
  // Login function
  login: async (credentials: { email: string; password: string }) => {
    try {
      
      const response = await apiClient.post('/auth/login', credentials);      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout function
  logout: async () => {
    //console.log('Logging out...');
    try {
      sessionStorage.clear();
      clearAllLocalStorage();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        clearAllLocalStorage();
       // console.log('Tokens cleared on logout');
      }
    }
  },

  // Refresh token function - uses Next.js API route for consistency
  refreshToken: async () => {
    try {
      if (typeof window !== 'undefined') {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use Next.js API route /api/token/refresh (same as tokenService)
        const formData = new URLSearchParams();
        formData.append('refresh_token', refreshToken);

        const response = await axios.post('/api/token/refresh', formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 3000000
        });
        if (response.data.code === 200 && response.data.data?.access_token) {
          // Update sessionStorage with new tokens
          sessionStorage.setItem('accessToken', response.data.data.access_token);
          
          // Handle new refresh token format: refresh_token is now a direct string
          // Support both new format (direct string) and old format (nested object) for backward compatibility
          let newRefreshToken: string | undefined;
          let newRefreshTokenExpires: number | undefined;

          const refreshTokenValue = response.data.data.refresh_token;
          const isEmptyObject = refreshTokenValue && typeof refreshTokenValue === 'object' && Object.keys(refreshTokenValue).length === 0;
          console.log("ZEZEZE REFRESH TOKEN VALUE", refreshTokenValue);
          if (typeof refreshTokenValue === 'string' && refreshTokenValue.length > 0) {
            // New format: refresh_token is a direct string
            newRefreshToken = refreshTokenValue;
            if (response.data.data.refresh_token_expires_in) {
              newRefreshTokenExpires = Date.now() + (response.data.data.refresh_token_expires_in * 1000);
            }
          } else if (!isEmptyObject && refreshTokenValue?.access_token && typeof refreshTokenValue.access_token === 'string') {
            // Old format: refresh_token is nested object (backward compatibility)
            newRefreshToken = refreshTokenValue.access_token;
            if (refreshTokenValue.expires_in) {
              newRefreshTokenExpires = Date.now() + (refreshTokenValue.expires_in * 1000);
            }
          }

          if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
            if (newRefreshTokenExpires) {
              sessionStorage.setItem('refreshTokenExpires', newRefreshTokenExpires.toString());
            }
          }
          
          // Update token expiry if provided
          if (response.data.data.expires_in) {
            const expiresAt = Date.now() + (response.data.data.expires_in * 1000);
            sessionStorage.setItem('accessTokenExpires', expiresAt.toString());
          }

          // Trigger NextAuth session update to sync the new token
          // This will cause NextAuth's JWT callback to run and update the session
          // We need to update the NextAuth JWT token with the new refresh token
          // so that NextAuth can use it for future refreshes
          try {
            // Call the session endpoint to trigger JWT callback
            // The JWT callback will check if tokens need refresh and update them
            // However, since the refresh token in the JWT might be old, we need to
            // ensure the new refresh token is available for NextAuth to use
            // For now, we'll trigger a session update which will cause the JWT callback to run
            await axios.get('/api/auth/session', {
              withCredentials: true,
              timeout: 1000000
            });
          } catch (sessionError) {
            // Log but don't fail - session update is best effort
            console.warn('Failed to update NextAuth session after token refresh:', sessionError);
          }

          return response.data.data.access_token;
        }
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        clearAllLocalStorage();
        clearSessionCookiesClient(true);
        const callbackUrl = getLogoutCallbackUrl();
        signOut({
          callbackUrl,
          redirect: false,
        }).then(() => {
          window.location.href = callbackUrl;
        }).catch(() => {
          window.location.href = callbackUrl;
        });
      }
      throw error;
    }
  },

  // Validate token function
  validateToken: async (token: string) => {
    try {
      const response = await apiClient.post('/auth/validate', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = getCurrentAccessToken();
    return token !== null && !isTokenExpired(token);
  },
};

export default apiClient; 