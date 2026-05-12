import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import tokenService from "../utils/tokenService";
import { useAuthContext } from "../auth/AuthProvider";

interface TokenServiceProviderProps {
  readonly children: ReactNode;
}

export const TokenServiceProvider: React.FC<TokenServiceProviderProps> = ({
  children,
}) => {
  const { status } = useAuthContext();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/auth/")) {
      tokenService.stop();
      return;
    }
    if (status === "authenticated") {
      if (globalThis.window !== undefined) {
        globalThis.__authLogoutInProgress = false;
      }
      tokenService.start();
    } else if (status === "unauthenticated") {
      tokenService.stop();
    }
  }, [status, location.pathname]);

  useEffect(() => {
    return () => {
      if (status === "unauthenticated") {
        tokenService.stop();
      }
    };
  }, [status]);

  return <>{children}</>;
};
