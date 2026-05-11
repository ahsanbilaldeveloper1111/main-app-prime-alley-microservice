import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearTokens,
  readTokens,
  readUser,
  writeTokens,
  writeUser,
  type AuthTokens,
  type AuthUser,
} from "./authStorage";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  type RefreshResult,
} from "./authApi";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  permissions: string[];
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
  refresh: (force?: boolean) => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_BUFFER_MS = 30 * 1000;

function permissionsOf(user: AuthUser | null): string[] {
  return user?.permissions ?? [];
}

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => readUser());
  const [status, setStatus] = useState<AuthStatus>(() =>
    readTokens() && readUser() ? "authenticated" : "loading",
  );
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRefreshRef = useRef<Promise<string | null> | null>(null);

  const scheduleRefresh = useCallback((tokens: AuthTokens | null) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (!tokens?.accessTokenExpires) return;
    const delay = Math.max(
      5_000,
      tokens.accessTokenExpires - Date.now() - REFRESH_BUFFER_MS,
    );
    refreshTimerRef.current = setTimeout(() => {
      // Fire and forget; the function below handles its own errors.
      void doRefresh(false);
    }, delay);
  }, []);

  const applyRefreshResult = useCallback(
    (result: RefreshResult) => {
      const existing = readTokens();
      const merged: AuthTokens = {
        accessToken: result.accessToken,
        accessTokenExpires: result.accessTokenExpires,
        refreshToken: result.refreshToken ?? existing?.refreshToken ?? "",
        refreshTokenExpires:
          result.refreshTokenExpires ?? existing?.refreshTokenExpires ?? 0,
      };
      writeTokens(merged);
      scheduleRefresh(merged);
      return merged;
    },
    [scheduleRefresh],
  );

  const doSignOut = useCallback(
    async (options?: { redirectTo?: string }): Promise<void> => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      const tokens = readTokens();
      await logoutRequest(tokens?.accessToken ?? null);
      clearTokens();
      writeUser(null);
      setUser(null);
      setStatus("unauthenticated");
      if (globalThis.window !== undefined && options?.redirectTo) {
        globalThis.location.replace(options.redirectTo);
      }
    },
    [],
  );

  const doRefresh = useCallback(
    async (force = false): Promise<string | null> => {
      if (inFlightRefreshRef.current) return inFlightRefreshRef.current;
      const tokens = readTokens();
      if (!tokens?.refreshToken) return null;

      const promise = (async () => {
        try {
          const result = await refreshRequest(tokens.refreshToken, force);
          applyRefreshResult(result);
          return result.accessToken;
        } catch (error) {
          console.warn("auth: refresh failed", error);
          await doSignOut({ redirectTo: "/auth/signin?reason=session_expired" });
          return null;
        } finally {
          inFlightRefreshRef.current = null;
        }
      })();

      inFlightRefreshRef.current = promise;
      return promise;
    },
    [applyRefreshResult, doSignOut],
  );

  // Boot: re-hydrate user from storage and schedule the next refresh.
  useEffect(() => {
    const tokens = readTokens();
    const persistedUser = readUser();
    if (tokens && persistedUser) {
      setUser(persistedUser);
      setStatus("authenticated");
      scheduleRefresh(tokens);
      // If access token is already past its lifetime, kick a refresh now so
      // the very first protected request doesn't 401.
      if (
        tokens.accessTokenExpires > 0 &&
        tokens.accessTokenExpires - Date.now() < REFRESH_BUFFER_MS
      ) {
        void doRefresh(false);
      }
    } else {
      setStatus("unauthenticated");
    }
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [doRefresh, scheduleRefresh]);

  const doSignIn = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const result = await loginRequest(email, password);
      writeTokens(result.tokens);
      writeUser(result.user);
      setUser(result.user);
      setStatus("authenticated");
      scheduleRefresh(result.tokens);
      return result.user;
    },
    [scheduleRefresh],
  );

  const value = useMemo<AuthContextValue>(() => {
    const perms = permissionsOf(user);
    return {
      status,
      user,
      permissions: perms,
      isAdmin: Boolean(user?.is_admin),
      signIn: doSignIn,
      signOut: doSignOut,
      refresh: doRefresh,
      hasPermission: (permission) => perms.includes(permission),
      hasAnyPermission: (list) => list.some((p) => perms.includes(p)),
      hasAllPermissions: (list) => list.every((p) => perms.includes(p)),
    };
  }, [doRefresh, doSignIn, doSignOut, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}

/** Imperative access for non-React modules (axios interceptors, etc.). */
let snapshot: AuthContextValue | null = null;

export function setAuthSnapshot(value: AuthContextValue | null): void {
  snapshot = value;
}

export function getAuthSnapshot(): AuthContextValue | null {
  return snapshot;
}

export function AuthSnapshotBridge({
  children,
}: {
  readonly children: ReactNode;
}) {
  const ctx = useAuthContext();
  useEffect(() => {
    setAuthSnapshot(ctx);
    return () => {
      if (getAuthSnapshot() === ctx) setAuthSnapshot(null);
    };
  }, [ctx]);
  return <>{children}</>;
}
