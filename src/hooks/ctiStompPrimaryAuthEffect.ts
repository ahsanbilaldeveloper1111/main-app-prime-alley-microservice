import type { Dispatch, SetStateAction } from "react";
import type { NextRouter } from "next/router";
import type { Client } from "@stomp/stompjs";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import type { CtiDevice, CtiCallEvent } from "./ctiStompHookTypes";
import { runCtiMasterTabInitGate } from "./ctiStompMasterInitGate";
import { ctiSafeLocalStorage } from "./ctiStompSafeLocalStorage";
import { CTI_MASTER_TAB } from "./ctiStompHookConstants";
import {
  dispatchPrimaryCtiSsePayload,
  buildPrimarySseDispatchCtx,
  type PrimarySseDispatchCtxFactoryArgs,
} from "./ctiStompSsePrimaryDispatch";

type DnsMapState = Record<
  string,
  { dn: string; devices: Record<string, CtiDevice> }
>;

type Ref<T> = { current: T };

const noopCtiPrimaryAuthCleanup = (): void => {};

function clearStaleCtiMasterElectionIfNeeded(opts: {
  isGlobalInstance: boolean;
  instanceId: string;
  manager: CrossTabCtiManager;
}): void {
  const { isGlobalInstance, instanceId, manager } = opts;
  if (!isGlobalInstance || !manager.isCrossTabSupported()) {
    return;
  }
  if (manager.isMasterTab()) {
    return;
  }
  const masterTabId = ctiSafeLocalStorage.getItem(CTI_MASTER_TAB.KEY);
  const lastHeartbeat = ctiSafeLocalStorage.getItem(
    CTI_MASTER_TAB.HEARTBEAT_KEY,
  );
  if (!masterTabId || !lastHeartbeat) {
    return;
  }
  const heartbeatTime = Number.parseInt(lastHeartbeat, 10);
  const timeSinceHeartbeat = Date.now() - heartbeatTime;
  if (timeSinceHeartbeat <= CTI_MASTER_TAB.TIMEOUT_MS) {
    return;
  }
  console.log(
    `[${instanceId}] Stale master detected (${Math.round(timeSinceHeartbeat / 1000)}s old), clearing and forcing master election...`,
  );
  ctiSafeLocalStorage.removeItem(CTI_MASTER_TAB.KEY);
  ctiSafeLocalStorage.removeItem(CTI_MASTER_TAB.HEARTBEAT_KEY);
  manager.isMasterTab();
}

function getCtiPrimaryAuthGlobalInstanceSubscribePreflightCleanup(opts: {
  isGlobalInstance: boolean;
  instanceId: string;
  isConnectingRef: Ref<boolean>;
  isGettingTokenRef: Ref<boolean>;
  isInitializedRef: Ref<boolean>;
  eventSourceRef: Ref<EventSource | null>;
  setIsInitialized: (v: boolean) => void;
}): (() => void) | null {
  const {
    isGlobalInstance,
    instanceId,
    isConnectingRef,
    isGettingTokenRef,
    isInitializedRef,
    eventSourceRef,
    setIsInitialized,
  } = opts;
  if (!isGlobalInstance) {
    return null;
  }
  if (isConnectingRef.current || isGettingTokenRef.current) {
    console.log(
      `[${instanceId}] useEffect triggered but already connecting/getting token, skipping...`,
    );
    return noopCtiPrimaryAuthCleanup;
  }
  if (
    isInitializedRef.current &&
    eventSourceRef.current?.readyState === EventSource.OPEN
  ) {
    console.log(
      `[${instanceId}] useEffect triggered but already initialized with active connection, skipping...`,
    );
    return noopCtiPrimaryAuthCleanup;
  }
  if (
    eventSourceRef.current &&
    eventSourceRef.current.readyState !== EventSource.OPEN
  ) {
    console.log(
      `[${instanceId}] Connection exists but state is ${eventSourceRef.current.readyState} (not OPEN), will re-initialize...`,
    );
    try {
      eventSourceRef.current.close();
    } catch (err) {
      console.warn(
        "[useCtiStomp] EventSource.close failed during stale reconnect",
        err,
      );
    }
    eventSourceRef.current = null;
    isInitializedRef.current = false;
    setIsInitialized(false);
  }
  return null;
}

export type CtiStompPrimaryAuthEffectDeps = {
  authInitialized: boolean;
  isAuthenticated: boolean;
  router: NextRouter;
  isGlobalInstance: boolean;
  instanceIdRef: Ref<string>;
  crossTabManagerRef: Ref<CrossTabCtiManager>;
  clientRef: Ref<Client | null>;
  eventSourceRef: Ref<EventSource | null>;
  tokenRef: Ref<string | null>;
  userAddressRef: Ref<string | null>;
  userTeamsRef: Ref<unknown>;
  userDataExtensionsRef: Ref<unknown>;
  screenIdRef: Ref<string | undefined>;
  isConnectingRef: Ref<boolean>;
  isInitializedRef: Ref<boolean>;
  connectionStartTimeRef: Ref<number | null>;
  reconnectionTimerRef: Ref<ReturnType<typeof setTimeout> | null>;
  isReconnectingRef: Ref<boolean>;
  isGettingTokenRef: Ref<boolean>;
  reconnectionAttemptsRef: Ref<number>;
  lastMessageTimeRef: Ref<number | null>;
  healthCheckIntervalRef: Ref<ReturnType<typeof setInterval> | null>;
  hasRequestedInitialStateRef: Ref<boolean>;
  pendingRefreshAfterCallEndRef: Ref<ReturnType<typeof setTimeout> | null>;
  attemptReconnectionRef: Ref<((maxAttempts?: number) => Promise<void>) | null>;
  setIsInitialized: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setIsReconnecting: (v: boolean) => void;
  setUserAddress: (v: string) => void;
  setDnsMap: Dispatch<SetStateAction<DnsMapState>>;
  setEventLog: Dispatch<SetStateAction<unknown[]>>;
  getBearerToken: () => Promise<{ token: string; userAddress: string } | null>;
  scheduleRefreshAfterCallEndRef: Ref<(() => void) | null>;
  publishStompMessageRef: Ref<
    | ((
        destination: string,
        body?: string,
        retry?: boolean,
      ) => Promise<boolean>)
    | null
  >;
  handleCallEventRef: Ref<((evt: CtiCallEvent) => void) | null>;
  handleOngoingCallsRef: Ref<((data: unknown) => void) | null>;
  groupDevicesByDnAndDeviceNameRef: Ref<
    ((deviceArray: CtiDevice[]) => DnsMapState) | null
  >;
  updateSummaryDataRef: Ref<((grouped: DnsMapState) => void) | null>;
};

export function subscribeCtiStompPrimaryAuthEffect(
  deps: CtiStompPrimaryAuthEffectDeps,
): () => void {
  const {
    authInitialized,
    isAuthenticated,
    router,
    isGlobalInstance,
    instanceIdRef,
    crossTabManagerRef,
    clientRef,
    eventSourceRef,
    tokenRef,
    userAddressRef,
    userTeamsRef,
    userDataExtensionsRef,
    screenIdRef,
    isConnectingRef,
    isInitializedRef,
    connectionStartTimeRef,
    reconnectionTimerRef,
    isReconnectingRef,
    isGettingTokenRef,
    reconnectionAttemptsRef,
    lastMessageTimeRef,
    healthCheckIntervalRef,
    hasRequestedInitialStateRef,
    pendingRefreshAfterCallEndRef,
    attemptReconnectionRef,
    setIsInitialized,
    setError,
    setIsReconnecting,
    setUserAddress,
    setDnsMap,
    setEventLog,
    getBearerToken,
    scheduleRefreshAfterCallEndRef,
    publishStompMessageRef,
    handleCallEventRef,
    handleOngoingCallsRef,
    groupDevicesByDnAndDeviceNameRef,
    updateSummaryDataRef,
  } = deps;

  // Wait for authentication to be initialized before attempting connection
  if (!authInitialized) {
    console.log(
      `[${instanceIdRef.current}] Authentication not initialized yet, waiting...`,
    );
    return noopCtiPrimaryAuthCleanup;
  }
  // If user is not authenticated, close any existing connection and return
  if (!isAuthenticated) {
    console.log(
      `[${instanceIdRef.current}] User not authenticated, closing any existing connection...`,
    );
    // Use fullyCloseConnection helper for consistent cleanup
    const fullyCloseConnectionUnauthenticated = async () => {
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (err) {
          console.warn(
            "[useCtiStomp] EventSource.close failed during auth cleanup",
            err,
          );
        }
        eventSourceRef.current = null;
      }

      if (clientRef.current) {
        try {
          if (clientRef.current.connected) {
            await clientRef.current.deactivate();
          }
        } catch (err) {
          console.warn(
            "[useCtiStomp] STOMP deactivate failed during auth cleanup",
            err,
          );
        }
        clientRef.current = null;
      }

      // Clear reconnection timer
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
        reconnectionTimerRef.current = null;
      }

      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }

      if (pendingRefreshAfterCallEndRef.current) {
        clearTimeout(pendingRefreshAfterCallEndRef.current);
        pendingRefreshAfterCallEndRef.current = null;
      }

      // Reset all connection state flags
      isConnectingRef.current = false;
      isInitializedRef.current = false;
      isGettingTokenRef.current = false;
      connectionStartTimeRef.current = null;
      isReconnectingRef.current = false;
      setIsReconnecting(false);
      hasRequestedInitialStateRef.current = false;

      // Clear token, userAddress, userTeams, and userDataExtensions refs
      tokenRef.current = null;
      userAddressRef.current = null;
      userTeamsRef.current = null;
      userDataExtensionsRef.current = null;

      // Reset UI state
      setIsInitialized(false);
      setError(null);
    };

    fullyCloseConnectionUnauthenticated().catch((err) => {
      console.warn(
        "[useCtiStomp] fullyCloseConnection failed during unauthenticated cleanup",
        err,
      );
    });

    return noopCtiPrimaryAuthCleanup;
  }

  // CRITICAL: Early return if already initialized with active connection OR already connecting
  // This prevents duplicate initialization if useEffect runs multiple times
  // (e.g., due to React StrictMode double-mounting in development)
  const preflightCleanup =
    getCtiPrimaryAuthGlobalInstanceSubscribePreflightCleanup({
      isGlobalInstance,
      instanceId: instanceIdRef.current,
      isConnectingRef,
      isGettingTokenRef,
      isInitializedRef,
      eventSourceRef,
      setIsInitialized,
    });
  if (preflightCleanup) {
    return preflightCleanup;
  }
  // Helper function to fully close and cleanup all connections
  const fullyCloseConnection = async (
    preserveReconnecting: boolean = false,
    /** When true, do not clear token/userAddress/teams/extensions refs (used after getBearerToken, before connectViaSSE). */
    preserveConnectAuthSnapshot: boolean = false,
  ) => {
    const currentInstanceId = instanceIdRef.current;
    console.log(
      `[${currentInstanceId}] 🧹 Fully closing all connections and resetting state...`,
    );

    // Preserve reconnecting flag if needed
    const wasReconnecting = isReconnectingRef.current;

    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (err) {
        console.warn(
          "[useCtiStomp] EventSource.close failed during full close",
          err,
        );
      }
      eventSourceRef.current = null;
    }

    if (clientRef.current) {
      try {
        if (clientRef.current.connected) {
          await clientRef.current.deactivate();
        }
      } catch (err) {
        console.warn(
          "[useCtiStomp] STOMP deactivate failed during full close",
          err,
        );
      }
      clientRef.current = null;
    }

    // Clear reconnection timer
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }

    // Clear health check interval
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }

    if (pendingRefreshAfterCallEndRef.current) {
      clearTimeout(pendingRefreshAfterCallEndRef.current);
      pendingRefreshAfterCallEndRef.current = null;
    }

    // Reset all connection state flags
    isConnectingRef.current = false;
    isInitializedRef.current = false;
    isGettingTokenRef.current = false; // Reset token flag
    connectionStartTimeRef.current = null;
    hasRequestedInitialStateRef.current = false;

    if (preserveReconnecting) {
      isReconnectingRef.current = wasReconnecting;
      setIsReconnecting(!!wasReconnecting);
    } else {
      isReconnectingRef.current = false;
      setIsReconnecting(false);
    }

    // Clear token, userAddress, userTeams, and userDataExtensions refs to force fresh token on next connection
    if (!preserveConnectAuthSnapshot) {
      tokenRef.current = null;
      userAddressRef.current = null;
      userTeamsRef.current = null;
      userDataExtensionsRef.current = null;
    }

    // Reset UI state
    setIsInitialized(false);
    setError(null);

    // Wait a bit to ensure all connections are fully closed
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  // Reconnection function with exponential backoff and retry logic
  const attemptReconnection = async (maxAttempts: number = 5) => {
    const currentInstanceId = instanceIdRef.current;
    const manager = crossTabManagerRef.current;

    // Check if we're still supposed to reconnect
    if (!isReconnectingRef.current) {
      console.log(
        `[${currentInstanceId}] Reconnection cancelled (flag was reset)`,
      );
      return;
    }

    // Check if we're still master (for cross-tab)
    if (isGlobalInstance && manager.isCrossTabSupported()) {
      if (!manager.isMasterTab()) {
        console.log(
          `[${currentInstanceId}] ⚠️ No longer master, cancelling reconnection`,
        );
        isReconnectingRef.current = false;
        setIsReconnecting(false);
        setIsInitialized(true); // Keep UI enabled
        setError(null);
        return;
      }
    }

    // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s
    const attempt = reconnectionAttemptsRef.current;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds

    if (attempt >= maxAttempts) {
      console.error(
        `[${currentInstanceId}] ❌ Max reconnection attempts (${maxAttempts}) reached`,
      );
      isReconnectingRef.current = false;
      setIsReconnecting(false);
      reconnectionAttemptsRef.current = 0;
      return;
    }

    reconnectionAttemptsRef.current = attempt + 1;
    console.log(
      `[${currentInstanceId}] 🔄 Reconnection attempt ${reconnectionAttemptsRef.current}/${maxAttempts} in ${delay}ms...`,
    );

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Double-check we're still supposed to reconnect
    if (!isReconnectingRef.current) {
      console.log(
        `[${currentInstanceId}] Reconnection cancelled during backoff`,
      );
      return;
    }

    try {
      // Fully close all connections first
      await fullyCloseConnection(true);

      // Double-check we're still supposed to reconnect after closing
      if (!isReconnectingRef.current) {
        console.log(
          `[${currentInstanceId}] Reconnection cancelled after closing connection`,
        );
        return;
      }

      // Get fresh token
      console.log(
        `[${currentInstanceId}] 🔄 Getting fresh token for reconnection...`,
      );
      const freshToken = await getBearerToken();

      if (!freshToken) {
        console.error(
          `[${currentInstanceId}] ❌ Failed to get fresh token, will retry...`,
        );
        // Retry reconnection
        await attemptReconnection(maxAttempts);
        return;
      }

      // Reset reconnection attempts on successful token retrieval
      reconnectionAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      setIsReconnecting(false);

      // Create new connection
      console.log(
        `[${currentInstanceId}] ✅ Got fresh token, creating new connection...`,
      );
      await connectViaSSE(freshToken.token, freshToken.userAddress, true);
    } catch (error: any) {
      console.error(
        `[${currentInstanceId}] ❌ Error during reconnection attempt:`,
        error,
      );
      // Retry reconnection
      await attemptReconnection(maxAttempts);
    }
  };

  // Store attemptReconnection in ref so it can be accessed from other useEffects
  attemptReconnectionRef.current = attemptReconnection;

  /** Tear down transport for a fresh SSE connect, or preserve auth snapshot when forcing reconnect
   *  (fullyCloseConnection would null userTeamsRef/userDataExtensionsRef; connectViaSSE does not restore them). */
  const preparePrimaryAuthSseConnectTransport = async (
    currentInstanceId: string,
    forceReconnect: boolean,
  ): Promise<void> => {
    if (forceReconnect) {
      await fullyCloseConnection(false, true);
      return;
    }
    if (eventSourceRef.current) {
      console.log(
        `[${currentInstanceId}] 🔄 Closing existing connection before creating new one...`,
      );
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    isConnectingRef.current = false;
    isInitializedRef.current = false;
    isGettingTokenRef.current = false;
    connectionStartTimeRef.current = null;
    hasRequestedInitialStateRef.current = false;
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
  };

  /** Last-line-of-defense: close global OPEN/CONNECTING EventSource before creating another. */
  const closeGlobalPrimaryAuthDuplicateEventSourceIfNeeded = async (
    currentInstanceId: string,
  ): Promise<void> => {
    if (!isGlobalInstance || !eventSourceRef.current) {
      return;
    }
    const existingState = eventSourceRef.current.readyState;
    if (
      existingState !== EventSource.CONNECTING &&
      existingState !== EventSource.OPEN
    ) {
      return;
    }
    console.log(
      `[${currentInstanceId}] ⚠️ EventSource already exists with state ${existingState}, closing before creating new one...`,
    );
    try {
      eventSourceRef.current.close();
    } catch (err) {
      console.warn(
        "[useCtiStomp] EventSource.close failed before recreate",
        err,
      );
    }
    eventSourceRef.current = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const buildPrimarySseStreamUrl = (
    token: string,
    userAddress: string,
    currentInstanceId: string,
  ): string => {
    const params = new URLSearchParams();
    params.append("token", token);
    params.append("userAddress", userAddress);
    params.append("instanceId", currentInstanceId);
    if (screenIdRef.current) {
      params.append("screenId", screenIdRef.current);
    }
    return `/streaming/cti-stomp-stream?${params.toString()}`;
  };

  const connectViaSSE = async (
    token: string,
    userAddress: string,
    forceReconnect: boolean = false,
  ) => {
    const currentInstanceId = instanceIdRef.current;

    await preparePrimaryAuthSseConnectTransport(
      currentInstanceId,
      forceReconnect,
    );

    if (isConnectingRef.current) {
      console.log(`[${currentInstanceId}] Already connecting, skipping...`);
      return null;
    }

    isConnectingRef.current = true;

    tokenRef.current = token;
    userAddressRef.current = userAddress;

    setUserAddress(userAddress);

    const sseUrl = buildPrimarySseStreamUrl(
      token,
      userAddress,
      currentInstanceId,
    );

    await closeGlobalPrimaryAuthDuplicateEventSourceIfNeeded(currentInstanceId);

    console.log(`[${currentInstanceId}] Creating fresh SSE connection...`);

    // Create EventSource for SSE connection
    const eventSource = new EventSource(sseUrl);

    // CRITICAL: Immediately store the EventSource to prevent duplicate creation
    // This must happen synchronously before any other code can run
    eventSourceRef.current = eventSource;

    const startPrimaryAuthHealthReconnect = (
      reconnect: (maxAttempts?: number) => Promise<void>,
    ) => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
      isReconnectingRef.current = true;
      setIsReconnecting(true);
      reconnect();
    };

    const triggerPrimaryAuthHealthReconnectWithRef = (
      startReconnect: (r: (maxAttempts?: number) => Promise<void>) => void,
      reasonLine: string,
    ) => {
      console.log(reasonLine);
      const reconnect = attemptReconnectionRef.current;
      if (reconnect) {
        startReconnect(reconnect);
      }
    };

    const runPrimaryAuthHealthCheckWhenNotOpen = (
      id: string,
      startReconnect: (r: (maxAttempts?: number) => Promise<void>) => void,
    ) => {
      triggerPrimaryAuthHealthReconnectWithRef(
        startReconnect,
        `[${id}] ⚠️ Health check: Connection is not OPEN, triggering reconnection...`,
      );
    };

    const runPrimaryAuthHealthCheckWhenOpenButStale = (
      id: string,
      startReconnect: (r: (maxAttempts?: number) => Promise<void>) => void,
    ) => {
      const now = Date.now();
      const lastMessageTime =
        lastMessageTimeRef.current || connectionStartTimeRef.current || now;
      const elapsed = now - lastMessageTime;
      if (elapsed <= 300000) {
        return;
      }
      triggerPrimaryAuthHealthReconnectWithRef(
        startReconnect,
        `[${id}] ⚠️ Health check: No CTI event received in ${Math.round(elapsed / 1000)}s (connection is OPEN but no events), triggering reconnection...`,
      );
    };

    const runPrimaryAuthHealthCheckTick = () => {
      const id = instanceIdRef.current;
      const mgr = crossTabManagerRef.current;
      if (isGlobalInstance && mgr.isCrossTabSupported() && !mgr.isMasterTab()) {
        return;
      }
      if (isReconnectingRef.current || isConnectingRef.current) {
        return;
      }
      if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
        runPrimaryAuthHealthCheckWhenNotOpen(id, startPrimaryAuthHealthReconnect);
        return;
      }
      runPrimaryAuthHealthCheckWhenOpenButStale(id, startPrimaryAuthHealthReconnect);
    };

    const closePrimaryAuthEventSourceIfDemoted = (
      instanceIdForLog: string,
      manager: CrossTabCtiManager,
    ): boolean => {
      if (
        !isGlobalInstance ||
        !manager.isCrossTabSupported() ||
        manager.isMasterTab()
      ) {
        return false;
      }
      console.log(
        `[${instanceIdForLog}] ⚠️ No longer master tab, closing connection...`,
      );
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (err) {
          console.warn(
            "[useCtiStomp] EventSource.close failed (primary onerror, not master)",
            err,
          );
        }
        eventSourceRef.current = null;
      }
      setIsInitialized(true);
      setError(null);
      return true;
    };

    const handlePrimaryAuthSseClosedReconnect = (instanceIdForLog: string) => {
      console.log(`[${instanceIdForLog}] ⚠️ SSE connection closed`);
      setIsInitialized(false);
      if (isReconnectingRef.current) {
        return;
      }
      isReconnectingRef.current = true;
      setIsReconnecting(true);
      console.log(
        `[${instanceIdForLog}] 🔄 Connection closed, starting reconnection with retry logic...`,
      );
      attemptReconnection();
    };

    eventSource.onopen = () => {
      const currentInstanceId = instanceIdRef.current;
      console.log(`[${currentInstanceId}] ✅ Connection opened successfully`);

      isConnectingRef.current = false;
      isInitializedRef.current = true;
      setIsInitialized(true);
      setError(null);
      isReconnectingRef.current = false; // Reset reconnection flag
      setIsReconnecting(false);
      reconnectionAttemptsRef.current = 0; // Reset reconnection attempts
      lastMessageTimeRef.current = Date.now(); // Initialize last message time

      // Track connection start time
      connectionStartTimeRef.current = Date.now();

      // Clear any existing reconnection timer
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
        reconnectionTimerRef.current = null;
      }

      // Clear any existing health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }

      // Set up health check to detect dead connections (see runPrimaryAuthHealthCheckTick)
      healthCheckIntervalRef.current = setInterval(
        runPrimaryAuthHealthCheckTick,
        30000,
      );

      // Set up timer to reconnect after 2.5 hours (9000000ms)
      reconnectionTimerRef.current = setTimeout(async () => {
        console.log(
          `[${currentInstanceId}] 🔄 2.5 hours elapsed, fully closing connection and reconnecting with fresh token...`,
        );

        // Fully close all connections and reset state
        await fullyCloseConnection();

        // Get fresh token and reconnect with fresh connection
        console.log(
          `[${currentInstanceId}] 🔄 Getting fresh token and creating new connection...`,
        );
        const freshToken = await getBearerToken();
        if (freshToken) {
          await connectViaSSE(freshToken.token, freshToken.userAddress, true);
        } else {
          console.error(
            `[${currentInstanceId}] ❌ Failed to get fresh token for reconnection`,
          );
        }
      }, 9000000); // 2.5hour
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        dispatchPrimaryCtiSsePayload(
          data,
          buildPrimarySseDispatchCtx({
            currentInstanceId,
            instanceIdRef,
            isGlobalInstance,
            crossTabManagerRef,
            lastMessageTimeRef,
            setDnsMap,
            setEventLog,
            setError,
            setIsInitialized,
            isReconnectingRef,
            setIsReconnecting,
            runAttemptReconnection: attemptReconnection,
            scheduleRefreshAfterCallEndRef,
            hasRequestedInitialStateRef,
            publishStompMessageRef,
            handleCallEventRef,
            handleOngoingCallsRef,
            groupDevicesByDnAndDeviceNameRef,
            updateSummaryDataRef,
          } as PrimarySseDispatchCtxFactoryArgs),
        );
      } catch (error) {
        console.warn("[useCtiStomp] SSE message parse/handle failed", error);
      }
    };

    eventSource.onerror = () => {
      const currentInstanceIdLocal = instanceIdRef.current;
      const readyState = eventSource.readyState;
      const manager = crossTabManagerRef.current;
      if (closePrimaryAuthEventSourceIfDemoted(currentInstanceIdLocal, manager)) {
        return;
      }
      if (readyState === EventSource.CLOSED) {
        handlePrimaryAuthSseClosedReconnect(currentInstanceIdLocal);
      } else if (readyState === EventSource.CONNECTING) {
        console.log(
          `[${currentInstanceIdLocal}] 🔄 Connection state: CONNECTING`,
        );
      } else if (readyState === EventSource.OPEN) {
        console.log(
          `[${currentInstanceIdLocal}] ⚠️ Temporary error on open connection`,
        );
      }
    };

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectionTimerRef.current) {
        clearTimeout(reconnectionTimerRef.current);
        reconnectionTimerRef.current = null;
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
      if (pendingRefreshAfterCallEndRef.current) {
        clearTimeout(pendingRefreshAfterCallEndRef.current);
        pendingRefreshAfterCallEndRef.current = null;
      }
      isConnectingRef.current = false;
      isInitializedRef.current = false;
      isGettingTokenRef.current = false; // Reset token flag
      connectionStartTimeRef.current = null;
      isReconnectingRef.current = false;
      setIsReconnecting(false);
      reconnectionAttemptsRef.current = 0;
      lastMessageTimeRef.current = null;
      hasRequestedInitialStateRef.current = false;
    };
  };

  const initialize = async () => {
    const currentInstanceId = instanceIdRef.current;
    const manager = crossTabManagerRef.current;

    // For global instance, check if already initialized with an active connection
    // This prevents duplicate connections but allows reconnection if connection is lost
    if (
      isGlobalInstance &&
      isInitializedRef.current &&
      eventSourceRef.current?.readyState === EventSource.OPEN
    ) {
      console.log(
        `[${currentInstanceId}] Global instance already initialized with active connection, reusing...`,
      );
      setIsInitialized(true);
      setError(null);
      return null; // Don't create new connection
    }

    // ATOMIC CHECK: Set connecting flag IMMEDIATELY to prevent race conditions
    // This must happen before ANY async operations
    // CRITICAL: Check BOTH flags and eventSource to prevent any possibility of duplicate connections
    if (
      isConnectingRef.current ||
      isGettingTokenRef.current ||
      (isGlobalInstance &&
        eventSourceRef.current &&
        eventSourceRef.current.readyState !== EventSource.CLOSED)
    ) {
      console.log(
        `[${currentInstanceId}] Already connecting, getting token, or has active connection - skipping duplicate initialization...`,
      );
      return null;
    }

    // Set connecting flag BEFORE any async operations to prevent race conditions
    isConnectingRef.current = true;

    const gate = runCtiMasterTabInitGate({
      currentInstanceId,
      isGlobalInstance,
      manager,
      storage: ctiSafeLocalStorage,
      routerPathname: router.pathname,
      isConnectingRef,
      isGettingTokenRef,
      setFollowerUiReady: () => {
        setIsInitialized(true);
        setError(null);
      },
    });
    if (gate === "abort") {
      return null;
    }

    console.log(`[${currentInstanceId}] Initializing new connection...`);

    // For global instance, don't close existing connection if it's already working
    // For other instances, always close first
    // IMPORTANT: Preserve isConnectingRef flag during close, as we're actively initializing
    const wasConnecting = isConnectingRef.current;
    if (!isGlobalInstance || !isInitializedRef.current) {
      await fullyCloseConnection();
      // Restore connecting flag after close (we're still initializing)
      isConnectingRef.current = wasConnecting;
    }

    // Double-check we're still supposed to connect (in case something changed during async operations)
    if (!isConnectingRef.current) {
      console.log(
        `[${currentInstanceId}] Connection cancelled during setup, skipping...`,
      );
      isGettingTokenRef.current = false; // Reset token flag
      return null;
    }

    const token = await getBearerToken();
    if (token) {
      // CRITICAL: Double-check we're still supposed to connect after getting token
      // Another initialization might have started in the meantime
      if (isGlobalInstance && eventSourceRef.current) {
        const existingState = eventSourceRef.current.readyState;
        if (
          existingState === EventSource.CONNECTING ||
          existingState === EventSource.OPEN
        ) {
          console.log(
            `[${currentInstanceId}] Got token but connection already exists (state: ${existingState}), skipping...`,
          );
          isConnectingRef.current = false;
          isGettingTokenRef.current = false;
          return null;
        }
      }

      console.log(
        `[${currentInstanceId}] Got token, creating fresh connection...`,
      );
      return await connectViaSSE(
        token.token,
        token.userAddress,
        !isGlobalInstance,
      ); // Only force reconnect for non-global
    } else {
      setError("Service unavailable");
      isConnectingRef.current = false;
      isGettingTokenRef.current = false; // Reset token flag on error
      return null;
    }
  };
  // Initialize on mount
  // CRITICAL: Check if already initialized before calling initialize()
  // This prevents duplicate initialization if component mounts twice (e.g., React StrictMode)
  let cleanup: (() => void) | null = null;

  // After page reload, clear stale CTI master election if localStorage heartbeat is expired
  clearStaleCtiMasterElectionIfNeeded({
    isGlobalInstance,
    instanceId: instanceIdRef.current,
    manager: crossTabManagerRef.current,
  });

  // Only skip if there's actually an active connection (not just stale refs)
  // FIX: During client-side navigation, verify connection is actually OPEN
  // If connection is closed or doesn't exist, re-initialize
  const hasActiveConnection =
    isGlobalInstance && eventSourceRef.current?.readyState === EventSource.OPEN;

  if (hasActiveConnection) {
    console.log(
      `[${instanceIdRef.current}] Already initialized with active connection, skipping initialization...`,
    );
    setIsInitialized(true);
    setError(null);
  } else {
    // FIX: Always attempt initialization if connection is not active
    // This handles both page reload and client-side navigation cases
    // The initialize() function has its own checks to prevent duplicates
    console.log(
      `[${instanceIdRef.current}] Attempting initialization (isInitializedRef: ${isInitializedRef.current}, eventSourceRef: ${!!eventSourceRef.current}, readyState: ${eventSourceRef.current?.readyState})...`,
    );
    initialize()
      .then((cleanupFn) => {
        cleanup = cleanupFn;
      })
      .catch((error) => {
        console.error(
          `[${instanceIdRef.current}] Initialization error:`,
          error,
        );
        setError("Failed to initialize connection");
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
      });
  }

  // Cleanup on unmount
  return () => {
    const currentInstanceId = instanceIdRef.current;

    // For global instance, don't cleanup on unmount (connection is shared across components)
    // Only cleanup when the provider itself unmounts
    if (isGlobalInstance) {
      console.log(
        `[${currentInstanceId}] Component unmounting, but keeping global connection alive (shared across app)...`,
      );
      // Don't close the connection - it's shared
      return;
    }

    // For non-global instances, cleanup normally
    console.log(
      `[${currentInstanceId}] Component unmounting, cleaning up connection...`,
    );

    if (cleanup && typeof cleanup === "function") {
      cleanup();
    }

    // Fully close all connections
    fullyCloseConnection().then(() => {
      console.log(`[${currentInstanceId}] Cleanup complete`);
    });
  };
}
