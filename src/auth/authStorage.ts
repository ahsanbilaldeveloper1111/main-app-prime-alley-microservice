/**
 * Single source of truth for auth-related browser storage.
 *
 * Tokens live in `sessionStorage` so they're tab-scoped (matches the legacy
 * tokenService). The user profile + permissions are stored alongside the
 * tokens so a refresh keeps the user object available before the BE responds.
 */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_EXPIRES_KEY = "accessTokenExpires";
const REFRESH_TOKEN_EXPIRES_KEY = "refreshTokenExpires";
const USER_KEY = "authUser";

export interface AuthUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  company_identifier?: string | null;
  is_admin?: string | null;
  login_as?: string | null;
  phone?: string | null;
  user_type?: string | null;
  country?: string | null;
  profile_picture?: string | null;
  role?: string | null;
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

function getStorage(): Storage | null {
  if (globalThis.window === undefined) return null;
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function safeParseInt(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function readTokens(): AuthTokens | null {
  const s = getStorage();
  if (!s) return null;
  const accessToken = s.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = s.getItem(REFRESH_TOKEN_KEY);
  if (
    !accessToken ||
    !refreshToken ||
    accessToken === "[object Object]" ||
    refreshToken === "[object Object]"
  ) {
    return null;
  }
  return {
    accessToken,
    refreshToken,
    accessTokenExpires: safeParseInt(s.getItem(ACCESS_TOKEN_EXPIRES_KEY)),
    refreshTokenExpires: safeParseInt(s.getItem(REFRESH_TOKEN_EXPIRES_KEY)),
  };
}

export function writeTokens(tokens: Partial<AuthTokens>): void {
  const s = getStorage();
  if (!s) return;
  if (typeof tokens.accessToken === "string" && tokens.accessToken.length > 0) {
    s.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  }
  if (
    typeof tokens.refreshToken === "string" &&
    tokens.refreshToken.length > 0
  ) {
    s.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
  if (typeof tokens.accessTokenExpires === "number") {
    s.setItem(
      ACCESS_TOKEN_EXPIRES_KEY,
      String(tokens.accessTokenExpires),
    );
  }
  if (typeof tokens.refreshTokenExpires === "number") {
    s.setItem(
      REFRESH_TOKEN_EXPIRES_KEY,
      String(tokens.refreshTokenExpires),
    );
  }
}

export function clearTokens(): void {
  const s = getStorage();
  if (!s) return;
  s.removeItem(ACCESS_TOKEN_KEY);
  s.removeItem(REFRESH_TOKEN_KEY);
  s.removeItem(ACCESS_TOKEN_EXPIRES_KEY);
  s.removeItem(REFRESH_TOKEN_EXPIRES_KEY);
}

export function readUser(): AuthUser | null {
  const s = getStorage();
  if (!s) return null;
  const raw = s.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function writeUser(user: AuthUser | null): void {
  const s = getStorage();
  if (!s) return;
  if (!user) {
    s.removeItem(USER_KEY);
    return;
  }
  try {
    s.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("authStorage: failed to persist user", error);
  }
}
