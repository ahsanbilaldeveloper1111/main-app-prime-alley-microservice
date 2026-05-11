import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import * as Sentry from "@sentry/react";
import { toast } from "react-toastify";
import tokenService from "./tokenService";
import { markAxiosUserFacingRejection } from "./axiosUserFacingRejection";
import { isBenignNetworkFailure } from "./benignNetworkFailure";
import { getAuthSnapshot } from "../auth/AuthProvider";

type MutableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type WindowWithLogoutFlag = Window & { __authLogoutInProgress?: boolean };

/**
 * Direct backend URL — no Next.js proxy involved. The legacy `process.env`
 * fallback keeps any old code paths working during the transition window.
 */
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof process !== "undefined"
    ? process.env?.NEXT_PUBLIC_BACKEND_URL
    : undefined) ||
  "http://localhost:3001/api/";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 1_000_000,
});

function getBrowserWindow(): Window | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  return (globalThis as typeof globalThis & { window?: Window }).window;
}

/**
 * Same `Authorization` value axios uses (TokenService, then `sessionStorage.accessToken`).
 * Use for `fetch()` when you need optional auth without axios interceptors (e.g. public pages).
 */
export function getClientBearerAuthorization(): string | null {
  const serviceToken = tokenService.getAccessToken();
  if (serviceToken) {
    return `Bearer ${serviceToken}`;
  }
  const storage = getBrowserWindow()?.sessionStorage;
  if (!storage) {
    return null;
  }
  const token = storage.getItem("accessToken");
  return token ? `Bearer ${token}` : null;
}

function setAuthorizationHeader(config: InternalAxiosRequestConfig): void {
  const token = getClientBearerAuthorization();
  if (token) {
    config.headers.Authorization = token;
  }
}

function performClientSignOut(): void {
  const win = getBrowserWindow() as WindowWithLogoutFlag | undefined;
  if (!win) {
    return;
  }
  win.__authLogoutInProgress = true;
  const auth = getAuthSnapshot();
  // Fire-and-forget. AuthProvider clears storage and redirects.
  if (auth) {
    void auth.signOut({ redirectTo: "/auth/signin?reason=session_expired" });
  } else {
    win.sessionStorage.clear();
    win.location.replace("/auth/signin?reason=session_expired");
  }
}

async function tryRefreshAndRetry(
  error: AxiosError,
  originalRequest: MutableConfig,
): Promise<AxiosResponse> {
  const win = getBrowserWindow() as WindowWithLogoutFlag | undefined;
  if (win?.__authLogoutInProgress) {
    throw error;
  }

  originalRequest._retry = true;

  let newToken: string | null;
  try {
    newToken = await tokenService.forceRefresh();
  } catch (refreshError: unknown) {
    if (!isBenignNetworkFailure(refreshError)) {
      Sentry.captureException(refreshError, {
        tags: { context: "axios_token_refresh" },
        extra: { originalUrl: originalRequest.url },
      });
    }
    throw error;
  }

  if (newToken) {
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(originalRequest);
  }

  performClientSignOut();
  throw error;
}

function captureApiErrorToSentry(
  error: AxiosError,
  originalRequest?: MutableConfig,
): void {
  Sentry.captureException(error, {
    extra: {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
    },
  });
}

function captureNetworkErrorToSentry(
  error: AxiosError,
  originalRequest?: MutableConfig,
): void {
  if (isBenignNetworkFailure(error)) {
    markAxiosUserFacingRejection(error);
    return;
  }
  Sentry.captureException(error, {
    extra: {
      url: originalRequest?.url,
      method: originalRequest?.method,
      message: error.message,
    },
  });
}

async function handleResponseWithBody(
  error: AxiosError,
  originalRequest: MutableConfig,
): Promise<AxiosResponse> {
  const status = error.response?.status;
  if (status === 401 && !originalRequest._retry) {
    return tryRefreshAndRetry(error, originalRequest);
  }
  if (status === 403) {
    toast.error("Forbidden");
    markAxiosUserFacingRejection(error);
    throw error;
  }
  if (status === 429) {
    toast.error("Too many requests. Please try again in a few moments.");
    markAxiosUserFacingRejection(error);
    throw error;
  }
  captureApiErrorToSentry(error, originalRequest);
  throw error;
}

axiosInstance.interceptors.request.use(
  (config) => {
    setAuthorizationHeader(config);

    // Don't override Content-Type for FormData — the browser must set the
    // multipart boundary itself. Same logic the Next proxy used.
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;
    if (!config.headers["Content-Type"] && !isFormData) {
      config.headers["Content-Type"] = "application/json";
      if (!config.headers.Accept) {
        config.headers.Accept = "application/json";
      }
    }

    return config;
  },
  (requestError) => {
    throw requestError;
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      if (error.response) {
        captureApiErrorToSentry(error);
      } else {
        captureNetworkErrorToSentry(error);
      }
      throw error;
    }

    if (error.response) {
      return handleResponseWithBody(error, originalRequest);
    }

    captureNetworkErrorToSentry(error, originalRequest);
    throw error;
  },
);

export default axiosInstance;
