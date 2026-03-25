import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import * as Sentry from "@sentry/nextjs";
import { signOut } from "next-auth/react";
import { getLogoutCallbackUrl } from "./logoutRedirect";
import { toast } from "react-toastify";
import tokenService from "./tokenService";
import { clearSessionCookiesClient } from "./cookieUtils";
import { markAxiosUserFacingRejection } from "./axiosUserFacingRejection";

type MutableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type WindowWithLogoutFlag = Window & { __authLogoutInProgress?: boolean };

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 1000000,
});

function getBrowserWindow(): Window | undefined {
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  return (globalThis as typeof globalThis & { window?: Window }).window;
}

function getToken(): string | null {
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
  const token = getToken();
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
  fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  clearSessionCookiesClient(true);
  win.sessionStorage.clear();
  const callbackUrl = getLogoutCallbackUrl();
  signOut({ callbackUrl, redirect: false }).then(() => {
    win.location.replace(callbackUrl);
  });
}

async function tryRefreshAndRetry(
  error: AxiosError,
  originalRequest: MutableConfig
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
    Sentry.captureException(refreshError, {
      tags: { context: "axios_token_refresh" },
      extra: { originalUrl: originalRequest.url },
    });
    throw error;
  }

  if (newToken) {
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(originalRequest);
  }

  performClientSignOut();
  throw error;
}

function captureApiErrorToSentry(error: AxiosError, originalRequest?: MutableConfig): void {
  Sentry.captureException(error, {
    extra: {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
    },
  });
}

function captureNetworkErrorToSentry(error: AxiosError, originalRequest?: MutableConfig): void {
  Sentry.captureException(error, {
    extra: {
      url: originalRequest?.url,
      method: originalRequest?.method,
      message: error.message,
    },
  });
}

/** @returns response when retry succeeds; otherwise throws `error` after side effects / Sentry. */
async function handleResponseWithBody(
  error: AxiosError,
  originalRequest: MutableConfig
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
  async (config) => {
    setAuthorizationHeader(config);

    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
      if (!config.headers.Accept) {
        config.headers.Accept = "application/json";
      }
    }

    if (config.data instanceof FormData) {
      console.log("Headers after interceptor:", config.headers);
      console.log("=====================");
    }

    return config;
  },
  (requestError) => {
    throw requestError;
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as MutableConfig | undefined;

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
  }
);

export default axiosInstance;
