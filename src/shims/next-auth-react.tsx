/**
 * `next-auth/react` shim — backed by our local AuthProvider.
 *
 * Only the surface the codebase actually uses is implemented:
 *   - useSession()                   →  { data, status, update? }
 *   - signIn('credentials', {...})   →  AuthProvider.signIn
 *   - signOut({...})                 →  AuthProvider.signOut
 *   - SessionProvider                →  passthrough (kept so existing JSX still mounts)
 *   - getSession()                   →  reads imperative snapshot
 */

import { useMemo, type ReactNode } from "react";
import { getAuthSnapshot, useAuthContext } from "../auth/AuthProvider";
import type { AuthUser } from "../auth/authStorage";
import type { Session } from "./next-auth";

export type ShimSession = Session & {
  user: AuthUser & { sessionId?: string; [key: string]: unknown };
};

interface UseSessionResult {
  data: ShimSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: (data?: unknown) => Promise<ShimSession | null>;
}

function buildSession(user: AuthUser | null): ShimSession | null {
  if (!user) return null;
  // 30 days of slack — the SPA enforces real expiry via tokenService.
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const augmented: AuthUser & { sessionId?: string; [key: string]: unknown } = {
    ...user,
  };
  return { user: augmented, expires };
}

function mapAuthStatus(
  status: ReturnType<typeof useAuthContext>["status"],
): UseSessionResult["status"] {
  if (status === "authenticated") return "authenticated";
  if (status === "loading") return "loading";
  return "unauthenticated";
}

export function useSession(): UseSessionResult {
  const ctx = useAuthContext();
  return useMemo<UseSessionResult>(() => {
    const session = buildSession(ctx.user);
    return {
      data: session,
      status: mapAuthStatus(ctx.status),
      update: async () => session,
    };
  }, [ctx]);
}

export interface SignInResponse {
  ok: boolean;
  error?: string;
  status: number;
  url?: string | null;
}

export interface SignInCredentials {
  email?: string;
  password?: string;
  redirect?: boolean;
  callbackUrl?: string;
}

export async function signIn(
  provider: string,
  credentials?: SignInCredentials,
): Promise<SignInResponse> {
  if (provider !== "credentials" || !credentials?.email || !credentials.password) {
    return { ok: false, error: "Unsupported provider", status: 400 };
  }
  const ctx = getAuthSnapshot();
  if (!ctx) {
    return { ok: false, error: "Auth context not ready", status: 500 };
  }
  try {
    await ctx.signIn(credentials.email, credentials.password);
    if (credentials.redirect !== false && credentials.callbackUrl) {
      globalThis.location.assign(credentials.callbackUrl);
    }
    return {
      ok: true,
      status: 200,
      url: credentials.callbackUrl ?? null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CredentialsSignin";
    return {
      ok: false,
      error: message === "Invalid credentials" ? "CredentialsSignin" : message,
      status: 401,
    };
  }
}

export interface SignOutOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

export async function signOut(
  options?: SignOutOptions,
): Promise<{ url: string }> {
  const ctx = getAuthSnapshot();
  const callbackUrl = options?.callbackUrl ?? "/auth/signin";
  if (ctx) {
    await ctx.signOut(
      options?.redirect === false ? undefined : { redirectTo: callbackUrl },
    );
  }
  return { url: callbackUrl };
}

export async function getSession(): Promise<ShimSession | null> {
  return buildSession(getAuthSnapshot()?.user ?? null);
}

export async function getCsrfToken(): Promise<string | null> {
  return null;
}

export async function getProviders() {
  return null;
}

// `SessionProvider` mirrors next-auth's API so existing JSX still type-checks,
// but the real session lifecycle is owned by <AuthProvider> in src/main.tsx —
// every prop other than `children` is intentionally accepted-and-ignored. We
// use an index signature instead of named optionals so SonarQube's
// "unused-prop" rule does not fire on every individual API field.
interface SessionProviderProps {
  readonly children: ReactNode;
  readonly [key: string]: unknown;
}

export function SessionProvider(props: SessionProviderProps) {
  return <>{props.children}</>;
}
