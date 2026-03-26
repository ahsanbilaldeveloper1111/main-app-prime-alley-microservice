import type { AxiosInstance } from "axios";

type Ref<T> = { current: T };

export async function waitForConcurrentCtiToken(
  isGettingTokenRef: Ref<boolean>,
  tokenRef: Ref<string | null>,
  userAddressRef: Ref<string | null>,
  instanceId: string,
  maxWaitMs: number,
  pollMs: number,
): Promise<{ token: string; userAddress: string } | null> {
  console.log(
    `[${instanceId}] Token request already in progress, waiting for completion...`,
  );
  const startTime = Date.now();

  while (isGettingTokenRef.current && Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    if (tokenRef.current && userAddressRef.current) {
      console.log(`[${instanceId}] Token became available from concurrent request`);
      return { token: tokenRef.current, userAddress: userAddressRef.current };
    }
  }

  if (isGettingTokenRef.current) {
    console.error(`[${instanceId}] Token request timed out after ${maxWaitMs}ms`);
    return null;
  }

  if (tokenRef.current && userAddressRef.current) {
    return { token: tokenRef.current, userAddress: userAddressRef.current };
  }

  console.log(`[${instanceId}] No token available after waiting`);
  return null;
}

export interface FetchCtiTokenParams {
  axiosInstance: AxiosInstance;
  getAccessToken: () => string | null;
  globalExcludedPaths: string[];
  isAuthenticated: boolean;
  tokenWaitMs: number;
  tokenCheckInterval: number;
  /** If set, logs when session token is still missing after the wait (before /cti/connect). */
  logPrefix?: string;
}

export async function fetchCtiConnectToken(
  params: FetchCtiTokenParams,
): Promise<{
  token: string;
  userAddress: string;
  userTeams: unknown;
  userDataExtensions: unknown;
} | null> {
  const {
    axiosInstance,
    getAccessToken,
    globalExcludedPaths,
    isAuthenticated,
    tokenWaitMs,
    tokenCheckInterval,
    logPrefix,
  } = params;

  if (
    globalThis.window !== undefined &&
    globalExcludedPaths.some((path) =>
      globalThis.window?.location.pathname?.includes(path),
    ) &&
    !isAuthenticated
  ) {
    throw new Error("User not authenticated");
  }

  const start = Date.now();
  while (!getAccessToken() && Date.now() - start < tokenWaitMs) {
    await new Promise((r) => setTimeout(r, tokenCheckInterval));
  }
  if (!getAccessToken() && logPrefix) {
    console.warn(
      `[${logPrefix}] No access token in sessionStorage after ${tokenWaitMs}ms, /cti/connect may return 401`,
    );
  }

  const response = await axiosInstance.get("/cti/connect", {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
      Pragma: "no-cache",
    },
  });

  if (response.status !== 200) {
    return null;
  }

  const data = response.data;
  const token = data.token || data.accessToken || data.bearerToken;
  const userAddress = data.userAddress || data.user_address;
  if (!token || !userAddress) {
    return null;
  }

  return {
    token,
    userAddress,
    userTeams: data?.teams,
    userDataExtensions: data?.extensions,
  };
}
