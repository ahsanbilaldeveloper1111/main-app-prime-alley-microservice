import { toast } from "react-toastify";
import { clearAllLocalStorage } from "./localStorageUtils";
import { refreshRequest } from "../auth/authApi";
import { getAuthSnapshot } from "../auth/AuthProvider";
import {
  readTokens as readAuthTokens,
  writeTokens as writeAuthTokens,
  clearTokens as clearAuthTokens,
} from "../auth/authStorage";

interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

interface TokenTimers {
  sessionTimer: ReturnType<typeof setTimeout> | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
}

class TokenService {
  private readonly timers: TokenTimers = {
    sessionTimer: null,
    refreshTimer: null,
  };
  private logoutInProgress = false;

  private readonly REFRESH_BUFFER = 30 * 1000;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_COOLDOWN = 60 * 1000;

  private decodeToken(token: string): { exp: number; iat: number } | null {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  }

  private getTokenExpiration(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    return decoded.exp * 1000;
  }

  private isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    const bufferTime = bufferMinutes * 60 * 1000;
    return Date.now() >= expiration - bufferTime;
  }

  private getTokens(): TokenData | null {
    return readAuthTokens();
  }

  private saveTokens(tokens: Partial<TokenData>): void {
    writeAuthTokens(tokens);
  }

  /**
   * Single source for refreshing the access token. Calls the backend directly
   * via the SPA `authApi` module — no `/api/token/refresh` Next route.
   */
  private async refreshToken(
    forceRefreshToken: boolean = false,
  ): Promise<string | null> {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const tokens = this.getTokens();
        if (!tokens) {
          return null;
        }

        const now = Date.now();
        const refreshTokenExpiry = tokens.refreshTokenExpires;
        const needsRefreshToken =
          forceRefreshToken ||
          (refreshTokenExpiry > 0 &&
            refreshTokenExpiry - now <= this.REFRESH_BUFFER);

        try {
          const result = await refreshRequest(
            tokens.refreshToken,
            needsRefreshToken,
          );
          const newTokens: Partial<TokenData> = {
            accessToken: result.accessToken,
            accessTokenExpires: result.accessTokenExpires,
          };
          if (result.refreshToken) {
            newTokens.refreshToken = result.refreshToken;
            newTokens.refreshTokenExpires =
              result.refreshTokenExpires ?? tokens.refreshTokenExpires;
          } else {
            newTokens.refreshToken = tokens.refreshToken;
            newTokens.refreshTokenExpires = tokens.refreshTokenExpires;
          }
          this.saveTokens(newTokens);
          this.setupTokenRefreshTimers();
          this.consecutiveFailures = 0;
          this.lastFailureTime = null;
          return result.accessToken;
        } catch (error: unknown) {
          this.handleTokenRefreshFailure(error);
          return null;
        }
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private setupTokenRefreshTimers(): void {
    if (this.timers.sessionTimer) {
      clearTimeout(this.timers.sessionTimer);
      this.timers.sessionTimer = null;
    }
    if (this.timers.refreshTimer) {
      clearTimeout(this.timers.refreshTimer);
      this.timers.refreshTimer = null;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      return;
    }

    const now = Date.now();
    const sessionTimeUntilRefresh = Math.max(
      0,
      tokens.accessTokenExpires - now - this.REFRESH_BUFFER,
    );
    this.timers.sessionTimer = setTimeout(async () => {
      await this.refreshToken(false);
    }, sessionTimeUntilRefresh);

    const refreshTimeUntilRefresh = Math.max(
      0,
      tokens.refreshTokenExpires - now - this.REFRESH_BUFFER,
    );
    this.timers.refreshTimer = setTimeout(async () => {
      await this.refreshToken(true);
    }, refreshTimeUntilRefresh);
  }

  private handleTokenRefreshFailure(error: unknown): void {
    const responseStatus =
      typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (responseStatus === 400) return;

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : undefined;

    if (
      code === "ECONNABORTED" ||
      code === "ERR_CONNECTION_TIMED_OUT" ||
      code === "ETIMEDOUT" ||
      code === "ERR_NETWORK" ||
      message?.includes("timeout") ||
      message?.includes("Network Error")
    ) {
      return;
    }

    if (globalThis.window === undefined || !globalThis.sessionStorage) {
      return;
    }
    if (this.logoutInProgress || globalThis.__authLogoutInProgress) return;

    if (globalThis.location.pathname.startsWith("/auth/")) {
      this.stop();
      return;
    }

    this.logoutInProgress = true;
    globalThis.__authLogoutInProgress = true;
    this.stop();

    clearAllLocalStorage();
    clearAuthTokens();
    const auth = getAuthSnapshot();
    toast.error("Session expired - Please login again", {
      toastId: "session-expired",
    });
    if (auth) {
      void auth.signOut({ redirectTo: "/auth/signin?reason=session_expired" });
    } else {
      globalThis.location.replace("/auth/signin?reason=session_expired");
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    if (this.isRefreshing) {
      if (this.refreshPromise) {
        await this.refreshPromise;
      }
      return;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      this.stop();
      return;
    }

    const now = Date.now();
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      if (
        this.lastFailureTime &&
        now - this.lastFailureTime < this.FAILURE_COOLDOWN
      ) {
        return;
      }
      this.consecutiveFailures = 0;
      this.lastFailureTime = null;
    }

    if (
      tokens.refreshTokenExpires > 0 &&
      tokens.refreshTokenExpires <= now
    ) {
      this.stop();
      this.handleTokenRefreshFailure(new Error("Refresh token expired"));
      return;
    }

    if (!this.timers.sessionTimer || !this.timers.refreshTimer) {
      this.setupTokenRefreshTimers();
    }
  }

  public start(): void {
    this.stop();
    this.checkInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 20_000);
    void this.checkAndRefreshToken();
    this.setupTokenRefreshTimers();
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.timers.sessionTimer) {
      clearTimeout(this.timers.sessionTimer);
      this.timers.sessionTimer = null;
    }
    if (this.timers.refreshTimer) {
      clearTimeout(this.timers.refreshTimer);
      this.timers.refreshTimer = null;
    }
  }

  public async forceRefresh(): Promise<string | null> {
    if (globalThis.window !== undefined) {
      if (this.logoutInProgress || globalThis.__authLogoutInProgress) {
        return null;
      }
      if (globalThis.location.pathname.startsWith("/auth/")) {
        return null;
      }
    }
    return this.refreshToken();
  }

  public getAccessToken(): string | null {
    return this.getTokens()?.accessToken ?? null;
  }

  public isAuthenticated(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    return !this.isTokenExpired(tokens.accessToken, 0);
  }

  /**
   * Pre-Vite NextAuth flow handed an entire `session` object here. The new
   * AuthProvider already writes tokens to sessionStorage on signIn, so this
   * function only needs to bootstrap the timers when called.
   */
  public async initializeFromSession(_session: unknown): Promise<void> {
    if (this.getTokens()) {
      this.start();
    }
  }

  public clearTokens(): void {
    this.stop();
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    clearAuthTokens();
    clearAllLocalStorage();
  }
}

const tokenService = new TokenService();
export default tokenService;
