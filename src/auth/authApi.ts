/**
 * Direct backend auth calls (no Next.js API proxy).
 *
 * The backend contract — preserved from the previous NextAuth `authorize`
 * callback — is:
 *   POST {BACKEND}/auth/login                  (form-urlencoded: email, password)
 *   POST {BACKEND}/auth/refreshToken           (form-urlencoded: refresh_token, force_refresh?)
 *   POST {BACKEND}/auth/logout                 (best-effort, Bearer access_token)
 */

import axios from "axios";
import type { AuthTokens, AuthUser } from "./authStorage";

const legacyBackendUrl =
  typeof process === "undefined"
    ? undefined
    : process.env?.NEXT_PUBLIC_BACKEND_URL;

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  // legacy env var fallback during transition
  legacyBackendUrl ||
  "http://localhost:3001/api/";

interface BackendTokenShape {
  access_token?: string;
  expires_in?: number;
  refresh_token?:
    | string
    | { access_token?: string; expires_in?: number }
    | null;
  refresh_token_expires_in?: number;
}

interface BackendLoginShape {
  code?: number;
  message?: string;
  data?: AuthUser & {
    userType?: string | null;
    is_admin?: string | null;
    login_as?: string | null;
    permissions?: string[];
    token?: BackendTokenShape;
  };
}

export interface LoginResult {
  user: AuthUser;
  tokens: AuthTokens;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function joinUrl(base: string, path: string): string {
  return `${ensureTrailingSlash(base)}${path.replace(/^\/+/, "")}`;
}

function calcExpiry(expiresIn: number | undefined, now: number): number {
  if (!expiresIn || expiresIn <= 0) return 0;
  return now + expiresIn * 1000;
}

function pickRefreshToken(token: BackendTokenShape, now: number): {
  refreshToken: string;
  refreshTokenExpires: number;
} | null {
  const value = token.refresh_token;
  if (typeof value === "string" && value.length > 0) {
    return {
      refreshToken: value,
      refreshTokenExpires: calcExpiry(token.refresh_token_expires_in, now),
    };
  }
  if (
    value &&
    typeof value === "object" &&
    typeof value.access_token === "string"
  ) {
    return {
      refreshToken: value.access_token,
      refreshTokenExpires: calcExpiry(value.expires_in, now),
    };
  }
  return null;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResult> {
  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("password", password);

  const response = await axios.post<BackendLoginShape>(
    joinUrl(BACKEND_URL, "auth/login"),
    formData.toString(),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      validateStatus: () => true,
    },
  );

  if (response.status !== 200 || !response.data?.data?.token?.access_token) {
    const message =
      response.data?.message ||
      (response.status === 400 ? "Invalid credentials" : "Login failed");
    throw new Error(message);
  }

  const { data } = response.data;
  const token = data.token!;
  const now = Date.now();
  const refresh = pickRefreshToken(token, now);
  if (!refresh) {
    throw new Error("Login response missing refresh token");
  }

  const loginRecord = data as Record<string, unknown>;
  const extension =
    (typeof loginRecord.extension === "string" && loginRecord.extension) ||
    (typeof loginRecord.user_extension === "string" &&
      loginRecord.user_extension) ||
    (typeof loginRecord.extension_number === "string" &&
      loginRecord.extension_number) ||
    null;

  const user: AuthUser = {
    id: data.id ?? null,
    name: data.name ?? null,
    email: data.email ?? null,
    username: data.username ?? null,
    extension,
    user_extension:
      typeof loginRecord.user_extension === "string"
        ? loginRecord.user_extension
        : extension,
    company_id: data.company_id ?? null,
    company_name: data.company_name ?? null,
    company_identifier: data.company_identifier ?? null,
    is_admin: data.is_admin ?? null,
    login_as: data.login_as ?? null,
    phone: data.phone ?? null,
    user_type: data.userType ?? null,
    country: data.country ?? null,
    profile_picture: data.profile_picture ?? null,
    role: data.role ?? null,
    permissions: data.permissions ?? [],
  };

  return {
    user,
    tokens: {
      accessToken: token.access_token!,
      accessTokenExpires: calcExpiry(token.expires_in, now),
      refreshToken: refresh.refreshToken,
      refreshTokenExpires: refresh.refreshTokenExpires,
    },
  };
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpires: number;
  refreshToken?: string;
  refreshTokenExpires?: number;
}

export async function refreshRequest(
  refreshToken: string,
  forceRefreshToken: boolean,
): Promise<RefreshResult> {
  const formData = new URLSearchParams();
  formData.append("refresh_token", refreshToken);
  if (forceRefreshToken) formData.append("force_refresh", "true");

  const response = await axios.post<{ code?: number; data?: BackendTokenShape }>(
    joinUrl(BACKEND_URL, "auth/refreshToken"),
    formData.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      validateStatus: () => true,
    },
  );

  const data = response.data?.data;
  if (response.status !== 200 || !data?.access_token) {
    throw new Error(`Refresh failed: ${response.status}`);
  }

  const now = Date.now();
  const refresh = pickRefreshToken(data, now);
  return {
    accessToken: data.access_token,
    accessTokenExpires: calcExpiry(data.expires_in, now),
    refreshToken: refresh?.refreshToken,
    refreshTokenExpires: refresh?.refreshTokenExpires,
  };
}

export async function logoutRequest(accessToken: string | null): Promise<void> {
  if (!accessToken) return;
  try {
    await axios.post(joinUrl(BACKEND_URL, "auth/logout"), undefined, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
      timeout: 5000,
    });
  } catch {
    // Best effort — never block client-side cleanup on a network error.
  }
}
