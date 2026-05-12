import { useCallback } from "react";
import tokenService from "../utils/tokenService";
import { useAuthContext } from "../auth/AuthProvider";

export const useTokenService = () => {
  const { status } = useAuthContext();

  const forceRefresh = useCallback(async () => {
    return tokenService.forceRefresh();
  }, []);

  const getAccessToken = useCallback(() => {
    return tokenService.getAccessToken();
  }, []);

  const isAuthenticated = useCallback(() => {
    return tokenService.isAuthenticated();
  }, []);

  const clearTokens = useCallback(() => {
    tokenService.clearTokens();
  }, []);

  return {
    forceRefresh,
    getAccessToken,
    isAuthenticated,
    clearTokens,
    isInitialized: status !== "loading",
  };
};
