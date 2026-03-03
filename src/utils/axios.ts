import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { signOut } from 'next-auth/react';
import { getLogoutCallbackUrl } from './logoutRedirect';
import { toast } from "react-toastify";
import tokenService from "./tokenService";
import { clearSessionCookiesClient } from './cookieUtils';

const axiosInstance: import('axios').AxiosInstance = axios.create({
  //baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  baseURL: '/api',
  timeout: 1000000,
  // headers: {
  //   'Content-Type': 'application/json',
  //   'Accept': 'application/json',
  // },
});

// Helper function to get token
const getToken = () => {
  // First try to get token from token service
  const serviceToken = tokenService.getAccessToken();
  if (serviceToken) {
    return `Bearer ${serviceToken}`;
  }
  
  // Fallback to session storage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const token = sessionStorage.getItem('accessToken');
    return token ? `Bearer ${token}` : null;
  }
  return null;
};

// Helper function to set authorization header
const setAuthorizationHeader = (config: any) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = token;
  }
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const MAX_RETRY = 3;
    let retryCount = 0;

    // Debug logging for all requests
    // console.log('=== AXIOS REQUEST INTERCEPTOR ===');
    // console.log('Request URL:', config.url);
    // console.log('Full URL:', `${config.baseURL || ''}${config.url}`);
    // console.log('Method:', config.method);
    // console.log('Headers:', config.headers);

    // Debug logging for FormData requests
    if (config.data instanceof FormData) {
      // console.log('=== AXIOS INTERCEPTOR DEBUG ===');
      // console.log('FormData request detected');
      // console.log('URL:', config.url);
      // console.log('Method:', config.method);
      // console.log('Base URL:', config.baseURL || '');
      // console.log('Full URL:', `${config.baseURL || ''}${config.url}`);
      // console.log('Headers before interceptor:', config.headers);
      // console.log('FormData entries count:', Array.from(config.data.entries()).length);
    }

    // // Function to retry fetching token and setting Authorization header
    // const retryFetchingToken = async () => {
    //   while (retryCount < MAX_RETRY) {
    //     setAuthorizationHeader(config);
    //     if (config.headers.Authorization) {
    //       return config;
    //     }
    //     await new Promise((resolve) => setTimeout(resolve, 500)); // Delay before retrying
    //     retryCount++;
    //   }
    //   return config;
    // };

    setAuthorizationHeader(config);

    // Retry fetching token if it's not available in the headers
    // if (!config.headers.Authorization) {
    //   return retryFetchingToken();
    // }

    // Only set content type to application/json if it's not already set AND if it's not FormData
    // FormData needs to set its own content type with boundary
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      if(!config.headers['Accept']) {
        config.headers['Accept'] = 'application/json';
      }
    }

    if (config.data instanceof FormData) {
      console.log('Headers after interceptor:', config.headers);
      console.log('=====================');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Use token service for refresh (it handles all the logic)
          const newToken = await tokenService.forceRefresh();
          
          //console.log('Token refresh result:', newToken ? 'success' : 'failed');

          if (newToken) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Token refresh failed - clear cookies and session, then sign out
            if (typeof window !== 'undefined') {
              // Best-effort: clear server-side NextAuth session payload before wiping cookies
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
              clearSessionCookiesClient(true);
              sessionStorage.clear();
              const callbackUrl = getLogoutCallbackUrl();
              // Await signOut so NextAuth cookie is cleared before redirect (prevents signin/dashboard loop)
              signOut({ callbackUrl, redirect: false }).then(() => {
                window.location.href = callbackUrl;
              });
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          //console.log('refreshError', refreshError);
          //console.error('Token refresh failed:', refreshError);
          // Don't immediately clear session on error
          // Let the user continue with their current session
          return Promise.reject(error);
        }
      } else if (error.response.status === 403) {
        //console.log('Forbidden');
        toast.error('Forbidden');
      } else if (error.response.status === 429) {
        toast.error('Too many requests. Please try again in a few moments.');
      } else {
        // Send unhandled API errors to Sentry (not 401, 403, 429)
        Sentry.captureException(error, {
          extra: {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
          },
        });
      }
    } else {
      // Network error, timeout, or no response - send to Sentry
      Sentry.captureException(error, {
        extra: {
          url: originalRequest?.url,
          method: originalRequest?.method,
          message: error.message,
        },
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;