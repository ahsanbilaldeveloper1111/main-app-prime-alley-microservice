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
    ((destination: string, body?: string, retry?: boolean) => Promise<boolean>) | null
  >;
  handleCallEventRef: Ref<((evt: CtiCallEvent) => void) | null>;
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
    groupDevicesByDnAndDeviceNameRef,
    updateSummaryDataRef,
  } = deps;

  // Wait for authentication to be initialized before attempting connection
  if (!authInitialized) {
  console.log(
    `[${instanceIdRef.current}] Authentication not initialized yet, waiting...`
  );
  return;
}
// If user is not authenticated, close any existing connection and return
if (!isAuthenticated) {
  console.log(
    `[${instanceIdRef.current}] User not authenticated, closing any existing connection...`
  );
  // Use fullyCloseConnection helper for consistent cleanup
  const fullyCloseConnection = async () => {
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (err) {
        console.warn("[useCtiStomp] EventSource.close failed during auth cleanup", err);
      }
      eventSourceRef.current = null;
    }

    if (clientRef.current) {
      try {
        if (clientRef.current.connected) {
          await clientRef.current.deactivate();
        }
      } catch (err) {
        console.warn("[useCtiStomp] STOMP deactivate failed during auth cleanup", err);
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
  
  // Close connection asynchronously but don't wait for it
  fullyCloseConnection().catch((err) => {
    console.warn("[useCtiStomp] fullyCloseConnection failed during unauthenticated cleanup", err);
  });
  
  return;
}

// CRITICAL: Early return if already initialized with active connection OR already connecting
// This prevents duplicate initialization if useEffect runs multiple times
// (e.g., due to React StrictMode double-mounting in development)
if (isGlobalInstance) {
  // Check if already connecting (race condition prevention)
  if (isConnectingRef.current || isGettingTokenRef.current) {
    console.log(
      `[${instanceIdRef.current}] useEffect triggered but already connecting/getting token, skipping...`
    );
    return;
  }
  
  // Check if already initialized with active connection
  // FIX: During client-side navigation, verify connection is actually OPEN, not just that ref exists
  // A closed connection should trigger re-initialization
  if (
    isInitializedRef.current &&
    eventSourceRef.current?.readyState === EventSource.OPEN
  ) {
    console.log(
      `[${instanceIdRef.current}] useEffect triggered but already initialized with active connection, skipping...`
    );
    return;
  }
  
  // If connection exists but is not OPEN (CLOSED or CONNECTING), we should re-initialize
  // This handles cases where connection was closed during navigation
  if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.OPEN) {
    console.log(
      `[${instanceIdRef.current}] Connection exists but state is ${eventSourceRef.current.readyState} (not OPEN), will re-initialize...`
    );
    // Close the stale connection before re-initializing
    try {
      eventSourceRef.current.close();
    } catch (err) {
      console.warn("[useCtiStomp] EventSource.close failed during stale reconnect", err);
    }
    eventSourceRef.current = null;
    isInitializedRef.current = false;
    setIsInitialized(false);
  }
}
// Helper function to fully close and cleanup all connections
const fullyCloseConnection = async (
  preserveReconnecting: boolean = false,
  /** When true, do not clear token/userAddress/teams/extensions refs (used after getBearerToken, before connectViaSSE). */
  preserveConnectAuthSnapshot: boolean = false,
) => {
  const currentInstanceId = instanceIdRef.current;
  console.log(
    `[${currentInstanceId}] 🧹 Fully closing all connections and resetting state...`
  );

  // Preserve reconnecting flag if needed
  const wasReconnecting = isReconnectingRef.current;

  if (eventSourceRef.current) {
    try {
      eventSourceRef.current.close();
    } catch (err) {
      console.warn("[useCtiStomp] EventSource.close failed during full close", err);
    }
    eventSourceRef.current = null;
  }

  if (clientRef.current) {
    try {
      if (clientRef.current.connected) {
        await clientRef.current.deactivate();
      }
    } catch (err) {
      console.warn("[useCtiStomp] STOMP deactivate failed during full close", err);
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
    console.log(`[${currentInstanceId}] Reconnection cancelled (flag was reset)`);
    return;
  }

  // Check if we're still master (for cross-tab)
  if (isGlobalInstance && manager.isCrossTabSupported()) {
    if (!manager.isMasterTab()) {
      console.log(`[${currentInstanceId}] ⚠️ No longer master, cancelling reconnection`);
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
    console.error(`[${currentInstanceId}] ❌ Max reconnection attempts (${maxAttempts}) reached`);
    isReconnectingRef.current = false;
    setIsReconnecting(false);
    reconnectionAttemptsRef.current = 0;
    return;
  }

  reconnectionAttemptsRef.current = attempt + 1;
  console.log(
    `[${currentInstanceId}] 🔄 Reconnection attempt ${reconnectionAttemptsRef.current}/${maxAttempts} in ${delay}ms...`
  );

  // Wait for backoff delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Double-check we're still supposed to reconnect
  if (!isReconnectingRef.current) {
    console.log(`[${currentInstanceId}] Reconnection cancelled during backoff`);
    return;
  }

  try {
    // Fully close all connections first
    await fullyCloseConnection(true);

    // Double-check we're still supposed to reconnect after closing
    if (!isReconnectingRef.current) {
      console.log(`[${currentInstanceId}] Reconnection cancelled after closing connection`);
      return;
    }

    // Get fresh token
    console.log(`[${currentInstanceId}] 🔄 Getting fresh token for reconnection...`);
    const freshToken = await getBearerToken();

    if (!freshToken) {
      console.error(`[${currentInstanceId}] ❌ Failed to get fresh token, will retry...`);
      // Retry reconnection
      await attemptReconnection(maxAttempts);
      return;
    }

    // Reset reconnection attempts on successful token retrieval
    reconnectionAttemptsRef.current = 0;
    isReconnectingRef.current = false;
    setIsReconnecting(false);

    // Create new connection
    console.log(`[${currentInstanceId}] ✅ Got fresh token, creating new connection...`);
    await connectViaSSE(freshToken.token, freshToken.userAddress, true);
  } catch (error: any) {
    console.error(`[${currentInstanceId}] ❌ Error during reconnection attempt:`, error);
    // Retry reconnection
    await attemptReconnection(maxAttempts);
  }
};

// Store attemptReconnection in ref so it can be accessed from other useEffects
attemptReconnectionRef.current = attemptReconnection;

const connectViaSSE = async (
  token: string,
  userAddress: string,
  forceReconnect: boolean = false
) => {
  const currentInstanceId = instanceIdRef.current;

  // If force reconnect, tear down transports/timers but keep auth snapshot from getBearerToken()
  // (a second full close would null userTeamsRef/userDataExtensionsRef; connectViaSSE does not restore them).
  if (forceReconnect) {
    await fullyCloseConnection(false,true);
  } else {
    // Always close existing connection first to ensure fresh connection
    if (eventSourceRef.current) {
      console.log(
        `[${currentInstanceId}] 🔄 Closing existing connection before creating new one...`
      );
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      // Wait a bit to ensure connection is fully closed
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Reset connection state to ensure fresh start
    isConnectingRef.current = false;
    isInitializedRef.current = false;
    isGettingTokenRef.current = false; // Reset token flag
    connectionStartTimeRef.current = null;
    hasRequestedInitialStateRef.current = false;

    // Clear reconnection timer if it exists
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
  }

  // Prevent multiple simultaneous connections for this instance
  if (isConnectingRef.current) {
    console.log(`[${currentInstanceId}] Already connecting, skipping...`);
    return null;
  }

  isConnectingRef.current = true;

  // Store token and userAddress in refs to ensure they're current
  tokenRef.current = token;
  userAddressRef.current = userAddress;

  // Set userAddress in state
  setUserAddress(userAddress);

  // Build SSE URL with instance ID to help identify connections
  // EventSource uses absolute path, not axios baseURL
  const params = new URLSearchParams();
  params.append("token", token);
  params.append("userAddress", userAddress);
  params.append("instanceId", currentInstanceId); // Add instance ID for debugging
  if (screenIdRef.current) {
    params.append("screenId", screenIdRef.current); // Add screenId to identify the page/component
  }
  const sseUrl = `/api/cti-stomp-stream?${params.toString()}`;

  // CRITICAL: Final check before creating EventSource - prevent duplicate connections
  // This is the last line of defense against race conditions
  if (isGlobalInstance && eventSourceRef.current) {
    const existingState = eventSourceRef.current.readyState;
    if (existingState === EventSource.CONNECTING || existingState === EventSource.OPEN) {
      console.log(`[${currentInstanceId}] ⚠️ EventSource already exists with state ${existingState}, closing before creating new one...`);
      try {
        eventSourceRef.current.close();
      } catch (err) {
        console.warn("[useCtiStomp] EventSource.close failed before recreate", err);
      }
      eventSourceRef.current = null;
      // Wait a bit to ensure it's fully closed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`[${currentInstanceId}] Creating fresh SSE connection...`);

  // Create EventSource for SSE connection
  const eventSource = new EventSource(sseUrl);
  
  // CRITICAL: Immediately store the EventSource to prevent duplicate creation
  // This must happen synchronously before any other code can run
  eventSourceRef.current = eventSource;

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

    // Set up health check to detect dead connections
    // Check every 30 seconds if we've received a message in the last 2 minutes
    healthCheckIntervalRef.current = setInterval(() => {
      const currentInstanceId = instanceIdRef.current;
      const manager = crossTabManagerRef.current;

      // Skip health check if not master (for cross-tab)
      if (isGlobalInstance && manager.isCrossTabSupported()) {
        if (!manager.isMasterTab()) {
          return;
        }
      }

      // Skip if already reconnecting or connecting
      if (isReconnectingRef.current || isConnectingRef.current) {
        return;
      }

      if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
        console.log(`[${currentInstanceId}] ⚠️ Health check: Connection is not OPEN, triggering reconnection...`);
        const reconnect = attemptReconnectionRef.current;
        if (reconnect) {
          if (healthCheckIntervalRef.current) {
            clearInterval(healthCheckIntervalRef.current);
            healthCheckIntervalRef.current = null;
          }
          isReconnectingRef.current = true;
          setIsReconnecting(true);
          reconnect();
        }
        return;
      }

      // Check if we've received a message recently (within last 5 minutes)
      // Note: We check for CTI events (not pings) to detect if the connection is actually working
      // If connection is OPEN, it means SSE is alive. We only reconnect if no CTI events for 5 minutes
      const now = Date.now();
      const lastMessageTime = lastMessageTimeRef.current || connectionStartTimeRef.current || now;
      const timeSinceLastMessage = now - lastMessageTime;

      // If no CTI event received in 5 minutes AND connection is open, it might be stale
      // But if connection is OPEN, it's likely still alive (SSE keeps connection open with pings)
      // Only trigger reconnection if it's been a very long time (5 minutes) without any CTI events
      if (timeSinceLastMessage > 300000) {
        console.log(
          `[${currentInstanceId}] ⚠️ Health check: No CTI event received in ${Math.round(timeSinceLastMessage / 1000)}s (connection is OPEN but no events), triggering reconnection...`
        );
        const reconnect = attemptReconnectionRef.current;
        if (reconnect) {
          if (healthCheckIntervalRef.current) {
            clearInterval(healthCheckIntervalRef.current);
            healthCheckIntervalRef.current = null;
          }
          isReconnectingRef.current = true;
          setIsReconnecting(true);
          reconnect();
        }
      }
    }, 30000); // Check every 30 seconds

    // Set up timer to reconnect after 2.5 hours (9000000ms)
    reconnectionTimerRef.current = setTimeout(async () => {
      console.log(
        `[${currentInstanceId}] 🔄 2.5 hours elapsed, fully closing connection and reconnecting with fresh token...`
      );

      // Fully close all connections and reset state
      await fullyCloseConnection();

      // Get fresh token and reconnect with fresh connection
      console.log(
        `[${currentInstanceId}] 🔄 Getting fresh token and creating new connection...`
      );
      const freshToken = await getBearerToken();
      if (freshToken) {
        await connectViaSSE(freshToken.token, freshToken.userAddress, true);
      } else {
        console.error(`[${currentInstanceId}] ❌ Failed to get fresh token for reconnection`);
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
          groupDevicesByDnAndDeviceNameRef,
          updateSummaryDataRef,
        } as PrimarySseDispatchCtxFactoryArgs),
      );
    } catch (error) {
      console.warn("[useCtiStomp] SSE message parse/handle failed", error);
    }
  };

  eventSource.onerror = (error) => {
    const currentInstanceId = instanceIdRef.current;
    const readyState = eventSource.readyState;
    const manager = crossTabManagerRef.current;

    // For global instance with cross-tab support, check if we're still master
    if (isGlobalInstance && manager.isCrossTabSupported()) {
      const isMaster = manager.isMasterTab();
      if (!isMaster) {
        // We're no longer master, close connection and don't reconnect
        console.log(
          `[${currentInstanceId}] ⚠️ No longer master tab, closing connection...`
        );
        if (eventSourceRef.current) {
          try {
            eventSourceRef.current.close();
          } catch (err) {
            console.warn("[useCtiStomp] EventSource.close failed (primary onerror, not master)", err);
          }
          eventSourceRef.current = null;
        }
        setIsInitialized(true); // Keep UI enabled, actions will forward
        setError(null);
        return;
      }
    }

    // EventSource states: CONNECTING (0), OPEN (1), CLOSED (2)
    if (readyState === EventSource.CLOSED) {
      console.log(`[${currentInstanceId}] ⚠️ SSE connection closed`);
      setIsInitialized(false);

      if (isReconnectingRef.current) {
        return;
      }
      isReconnectingRef.current = true;
      setIsReconnecting(true);
      console.log(
        `[${currentInstanceId}] 🔄 Connection closed, starting reconnection with retry logic...`
      );
      attemptReconnection();
    } else if (readyState === EventSource.CONNECTING) {
      // Don't set error yet, it's still trying to connect
      console.log(`[${currentInstanceId}] 🔄 Connection state: CONNECTING`);
    } else if (readyState === EventSource.OPEN) {
      // Connection is open, this might be a temporary error, don't close
      console.log(
        `[${currentInstanceId}] ⚠️ Temporary error on open connection`
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
      `[${currentInstanceId}] Global instance already initialized with active connection, reusing...`
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
    (isGlobalInstance && eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED)
  ) {
    console.log(`[${currentInstanceId}] Already connecting, getting token, or has active connection - skipping duplicate initialization...`);
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
    console.log(`[${currentInstanceId}] Connection cancelled during setup, skipping...`);
    isGettingTokenRef.current = false; // Reset token flag
    return null;
  }

  const token = await getBearerToken();
  if (token) {
    // CRITICAL: Double-check we're still supposed to connect after getting token
    // Another initialization might have started in the meantime
    if (isGlobalInstance && eventSourceRef.current) {
      const existingState = eventSourceRef.current.readyState;
      if (existingState === EventSource.CONNECTING || existingState === EventSource.OPEN) {
        console.log(
          `[${currentInstanceId}] Got token but connection already exists (state: ${existingState}), skipping...`
        );
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return null;
      }
    }
    
    console.log(
      `[${currentInstanceId}] Got token, creating fresh connection...`
    );
    return await connectViaSSE(
      token.token,
      token.userAddress,
      !isGlobalInstance
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

// FIX: After page reload, check if we need to clear stale master status
// When tab reopens, localStorage might have stale master entry
if (isGlobalInstance && crossTabManagerRef.current.isCrossTabSupported()) {
  const manager = crossTabManagerRef.current;
  // Force check master status immediately to clear any stale entries
  const currentIsMaster = manager.isMasterTab();
  
  // If we're not master but should be (only one tab), check for stale master entry
  if (!currentIsMaster) {
    const masterTabId = ctiSafeLocalStorage.getItem(CTI_MASTER_TAB.KEY);
    const lastHeartbeat = ctiSafeLocalStorage.getItem(CTI_MASTER_TAB.HEARTBEAT_KEY);
    
    if (masterTabId && lastHeartbeat) {
      const heartbeatTime = Number.parseInt(lastHeartbeat, 10);
      const timeSinceHeartbeat = Date.now() - heartbeatTime;
      // If heartbeat is stale (>5 seconds), clear it and force master election
      if (timeSinceHeartbeat > CTI_MASTER_TAB.TIMEOUT_MS) {
        console.log(
          `[${instanceIdRef.current}] Stale master detected (${Math.round(timeSinceHeartbeat / 1000)}s old), clearing and forcing master election...`
        );
        ctiSafeLocalStorage.removeItem(CTI_MASTER_TAB.KEY);
        ctiSafeLocalStorage.removeItem(CTI_MASTER_TAB.HEARTBEAT_KEY);
        // Force master election by checking again
        manager.isMasterTab(); // This will trigger re-election
      }
    }
  }
}

// Only skip if there's actually an active connection (not just stale refs)
// FIX: During client-side navigation, verify connection is actually OPEN
// If connection is closed or doesn't exist, re-initialize
const hasActiveConnection =
  isGlobalInstance && eventSourceRef.current?.readyState === EventSource.OPEN;

if (hasActiveConnection) {
  console.log(
    `[${instanceIdRef.current}] Already initialized with active connection, skipping initialization...`
  );
  setIsInitialized(true);
  setError(null);
} else {
  // FIX: Always attempt initialization if connection is not active
  // This handles both page reload and client-side navigation cases
  // The initialize() function has its own checks to prevent duplicates
  console.log(
    `[${instanceIdRef.current}] Attempting initialization (isInitializedRef: ${isInitializedRef.current}, eventSourceRef: ${!!eventSourceRef.current}, readyState: ${eventSourceRef.current?.readyState})...`
  );
  initialize().then((cleanupFn) => {
    cleanup = cleanupFn;
  }).catch((error) => {
    console.error(`[${instanceIdRef.current}] Initialization error:`, error);
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
      `[${currentInstanceId}] Component unmounting, but keeping global connection alive (shared across app)...`
    );
    // Don't close the connection - it's shared
    return;
  }

  // For non-global instances, cleanup normally
  console.log(
    `[${currentInstanceId}] Component unmounting, cleaning up connection...`
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
