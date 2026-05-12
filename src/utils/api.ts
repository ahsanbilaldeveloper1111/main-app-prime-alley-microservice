import axios from "axios";
import { getCurrentAccessToken, isTokenExpired } from "./tokenUtils";
import { clearAllLocalStorage } from "./localStorageUtils";
import tokenService from "./tokenService";
import { getAuthSnapshot } from "../auth/AuthProvider";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
} from "../auth/authApi";
import {
  clearTokens as clearAuthTokens,
  readTokens,
  writeTokens,
} from "../auth/authStorage";

/**
 * Direct backend client (no Next.js proxy). The base URL points straight at
 * the backend; requests carry the bearer token from sessionStorage.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/",
  timeout: 1_000_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getCurrentAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await tokenService.forceRefresh();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.warn("api: token refresh failed", refreshError);
      }
      const auth = getAuthSnapshot();
      if (auth) {
        await auth.signOut({ redirectTo: "/auth/signin?reason=session_expired" });
      } else if (globalThis.window !== undefined) {
        clearAuthTokens();
        clearAllLocalStorage();
        globalThis.location.replace("/auth/signin?reason=session_expired");
      }
    } else if ((error.response?.status ?? 0) >= 500) {
      console.error("api: server error", error.response?.status);
    }
    throw error;
  },
);

/**
 * High-level auth API. Mirrors the previous shape so callsites that did
 * `import { authAPI } from '@utils/api'` keep working, but every call goes
 * straight to the backend through `src/auth/authApi.ts`.
 */
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const result = await loginRequest(credentials.email, credentials.password);
    writeTokens(result.tokens);
    return { data: result };
  },

  logout: async () => {
    const tokens = readTokens();
    await logoutRequest(tokens?.accessToken ?? null);
    if (globalThis.window !== undefined) {
      clearAuthTokens();
      clearAllLocalStorage();
    }
  },

  refreshToken: async () => {
    const tokens = readTokens();
    if (!tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }
    const result = await refreshRequest(tokens.refreshToken, false);
    writeTokens({
      accessToken: result.accessToken,
      accessTokenExpires: result.accessTokenExpires,
      ...(result.refreshToken
        ? {
            refreshToken: result.refreshToken,
            refreshTokenExpires: result.refreshTokenExpires,
          }
        : {}),
    });
    return result.accessToken;
  },

  validateToken: async (token: string) => {
    const response = await apiClient.post("/auth/validate", { token });
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  isAuthenticated: (): boolean => {
    const token = getCurrentAccessToken();
    return token !== null && !isTokenExpired(token);
  },
};

export default apiClient;
