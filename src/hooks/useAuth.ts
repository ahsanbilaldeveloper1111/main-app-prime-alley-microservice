/**
 * Drop-in replacement for the previous NextAuth-backed useAuth hook.
 *
 * Exposes the same return shape (`session`, `status`, `isAuthenticated`,
 * `hasTokens`, `isInitialized`, `logout`) so existing callsites compile.
 */

import { useMemo } from "react";
import { useAuthContext } from "../auth/AuthProvider";
import { hasTokens } from "../utils/tokenUtils";
import { useTokenService } from "./useTokenService";

interface ShimSession {
  user: import("../auth/authStorage").AuthUser;
  expires: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function buildShimSession(
  user: import("../auth/authStorage").AuthUser | null,
): ShimSession | null {
  if (!user) return null;
  return {
    user,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function mapAuthStatus(
  status: ReturnType<typeof useAuthContext>["status"],
): AuthStatus {
  if (status === "loading") return "loading";
  if (status === "authenticated") return "authenticated";
  return "unauthenticated";
}

export const useAuth = () => {
  const auth = useAuthContext();
  const { isAuthenticated } = useTokenService();

  return useMemo(() => {
    const session = buildShimSession(auth.user);
    const status = mapAuthStatus(auth.status);
    return {
      session,
      status,
      isAuthenticated: isAuthenticated(),
      hasTokens: hasTokens(),
      isInitialized: status !== "loading",
      logout: () =>
        auth.signOut({ redirectTo: "/auth/signin" }),
    };
  }, [auth, isAuthenticated]);
};
