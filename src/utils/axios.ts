import axios from "axios";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import tokenService from "./tokenService";

const axiosInstance: import('axios').AxiosInstance = axios.create({
  //baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  baseURL: '/api',
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// get new token
const refreshToken = async () => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
     // console.log('refreshToken....');
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        //console.log('No refresh token available');
        return null;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}auth/refreshToken`, {
        refresh_token: refreshToken
      });
      //console.log('response token', response);

      if(response.data.code===200){
        if (response.data.data && response.data.data.access_token) {
          sessionStorage.setItem('accessToken', response.data.data.access_token);
          return response.data.data.access_token;
        }
      }else{
        sessionStorage.clear();
        signOut();
        // Simple redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
        toast.error('Session expired - Please login again');
      }
    }
    console.log('Failed to refresh token');
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

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

    // Function to retry fetching token and setting Authorization header
    const retryFetchingToken = async () => {
      while (retryCount < MAX_RETRY) {
        setAuthorizationHeader(config);
        if (config.headers.Authorization) {
          return config;
        }
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay before retrying
        retryCount++;
      }
      return config;
    };

    setAuthorizationHeader(config);

    // Retry fetching token if it's not available in the headers
    if (!config.headers.Authorization) {
      return retryFetchingToken();
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
          // Try to refresh the token using token service first
          let newToken = await tokenService.forceRefresh();
          
          // If token service fails, fallback to manual refresh
          if (!newToken) {
            newToken = await refreshToken();
          }
          
          //console.log('Token refresh result:', newToken ? 'success' : 'failed');

          if (newToken) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } else {
            // Token refresh failed, but don't immediately clear session
            // Let the user continue with their current session
            //console.log('Token refresh failed, but keeping session active');
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
      }
    }
    return Promise.reject(error);
  }
);




export default axiosInstance;