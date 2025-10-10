import axios from 'axios';
import { getCurrentAccessToken, isTokenExpired } from './tokenUtils';
import { clearAllLocalStorage } from './localStorageUtils';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || '',
  timeout: 10000,
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
      // Check if token is expired before making request
      if (isTokenExpired(token)) {
        //console.log('Access token expired, attempting to refresh...');
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
            window.location.href = '/auth/signin';
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
          window.location.href = '/auth/signin';
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

  // Refresh token function
  refreshToken: async () => {
    try {
     // console.log('Attempting to refresh token...');
      if (typeof window !== 'undefined') {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        if (response.data.token && response.data.token.access_token) {
          sessionStorage.setItem('accessToken', response.data.token.access_token);
          if (response.data.token.refresh && response.data.token.refresh.access_token) {
            sessionStorage.setItem('refreshToken', response.data.token.refresh.access_token);
          }
         // console.log('Token refreshed successfully');
          return response.data.token.access_token;
        }
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.href = '/auth/signin';
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