import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@utils/axios";
import { getCrossTabCtiManager } from "../utils/crossTabCtiManager";
import { useAuth } from "./useAuth";
import { useRouter } from "next/router";
import { getGlobalExcludedPaths } from "@utils/Helper";
import tokenService from "@utils/tokenService";
import {
  applyCallEventToCallStateMap,
  mergeOngoingCallsIntoCallStateMap,
  reduceLoadPersistedCallStates,
  reduceSaveCallStates,
  pickMostRecentCall,
  mergeRemoteEventLogWithPrevious,
} from "./ctiStompHelpers";
import { fetchCtiConnectToken, waitForConcurrentCtiToken } from "./ctiStompAuth";
import { runCtiMasterTabInitGate } from "./ctiStompMasterInitGate";
import {
  dispatchPrimaryCtiSsePayload,
  type PrimarySseDispatchCtx,
} from "./ctiStompSsePrimaryDispatch";
import {
  dispatchCrossTabCtiBroadcastEvent,
  type CrossTabBroadcastCtx,
} from "./ctiStompCrossTabBroadcastDispatch";

interface CtiDevice {
  dn: string;
  deviceName: string;
  status: string;
  terminalState: string;
  deviceType: string;
}

interface CtiCallEvent {
  callId: string;
  eventType: string;
  sequence: number;
  eventTime: string;
  isConference: boolean;
  isOneToOne: boolean;
  parties: any[];
  isTerminating: boolean;
  hasActiveParticipants: boolean;
  eventName: string;
  currentState?: string;
  /** Set on HELD: address of the party who put the call on hold (only they can resume). From details "GlobalCalling:X" => heldBy = other party; else heldBy = caller. */
  heldByAddress?: string;
}

interface SummaryData {
  extensions: number;
  online: number;
  offline: number;
  connected: number;
  on_hold: number;
  incoming: number;
  answered: number;
  incomingEvents: number;
}

// Local storage keys
const CALL_STATES_STORAGE_KEY = "cti_call_states";
const CALL_STATES_TIMESTAMP_KEY = "cti_call_states_timestamp";
const STORAGE_EXPIRY_HOURS = 24; // Call states expire after 24 hours

// Master tab keys (matching crossTabCtiManager)
const MASTER_TAB_KEY = 'cti_master_tab_id';
const MASTER_TAB_HEARTBEAT_KEY = 'cti_master_tab_id_heartbeat';
const MASTER_TAB_TIMEOUT = 5000; // 5 seconds

// Helper for safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (globalThis.window === undefined) return null;
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn("[useCtiStomp] localStorage.getItem failed", key, err);
      return null;
    }
  },
  removeItem: (key: string): void => {
    if (globalThis.window === undefined) return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn("[useCtiStomp] localStorage.removeItem failed", key, err);
    }
  },
};

// Generate unique instance ID for each hook instance
let instanceCounter = 0;
const generateInstanceId = () => {
  instanceCounter++;
  return `cti-stomp-${instanceCounter}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 11)}`;
};

// Shared connection refs for global instance (singleton pattern)
// All hook instances with 'global-cti-instance' share these refs
const globalConnectionRefs = {
  clientRef: { current: null as Client | null },
  eventSourceRef: { current: null as EventSource | null },
  tokenRef: { current: null as string | null },
  userAddressRef: { current: null as string | null },
  userTeamsRef: { current: null as any },
  userDataExtensionsRef: { current: null as any },
  isConnectingRef: { current: false },
  isInitializedRef: { current: false },
  connectionStartTimeRef: { current: null as number | null },
  reconnectionTimerRef: { current: null as NodeJS.Timeout | null },
  isReconnectingRef: { current: false },
  isGettingTokenRef: { current: false }, // Track if getBearerToken is in progress
  reconnectionAttemptsRef: { current: 0 }, // Track reconnection attempts
  lastMessageTimeRef: { current: null as number | null }, // Track last message time for health check
  healthCheckIntervalRef: { current: null as NodeJS.Timeout | null }, // Health check interval
  hasRequestedInitialStateRef: { current: false }, // Request initial-state only once per connection to avoid loops
  pendingRefreshAfterCallEndRef: { current: null as ReturnType<typeof setTimeout> | null }, // Single timeout for refresh after call end
  lastRefreshAfterCallEndRef: { current: 0 }, // Throttle: last time we requested refresh after call end (ms)
};

/**
 * Custom hook for CTI STOMP WebSocket connection via SSE
 *
 * IMPORTANT: For global instance ('global-cti-instance'), this hook now uses a singleton
 * connection manager to ensure only ONE connection exists for the entire app.
 *
 * For other instance IDs, each hook instance gets its own connection (for backward compatibility).
 *
 * @param wsPath - WebSocket path (default: '/ws')
 * @param instanceId - Optional unique instance ID. Use 'global-cti-instance' for shared connection.
 * @param screenId - Optional screen ID to identify the page/component (e.g., 'liveView', 'dialer')
 */
export default function useCtiStomp(
  wsPath = "/ws",
  instanceId?: string,
  screenId?: string
) {
  // Check if this is the global instance - if so, use singleton connection manager
  const isGlobalInstance =
    instanceId === "global-cti-instance" || instanceId === undefined;

  // Generate unique instance ID if not provided (for non-global instances)
  const instanceIdRef = useRef<string>(
    isGlobalInstance
      ? "global-cti-instance"
      : instanceId || generateInstanceId()
  );

  // Cross-tab manager for sharing connection across tabs
  const crossTabManagerRef = useRef(getCrossTabCtiManager());
  const [isMasterTab, setIsMasterTab] = useState(false);

  // Router for checking current page
  const router = useRouter();

  // Track authentication state to reinitialize connection after login
  const { isAuthenticated, isInitialized: authInitialized } = useAuth();

  const [dnsMap, setDnsMap] = useState<
    Record<string, { dn: string; devices: Record<string, CtiDevice> }>
  >({});
  const [callStateMap, setCallStateMap] = useState<
    Record<string, CtiCallEvent>
  >({});
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [summaryData, setSummaryData] = useState<SummaryData>({
    extensions: 0,
    online: 0,
    offline: 0,
    connected: 0,
    on_hold: 0,
    incoming: 0,
    answered: 0,
    incomingEvents: 0,
  });

  // Always call useRef unconditionally (React Hook rules requirement)
  // Then conditionally use either global or local refs
  const localClientRef = useRef<Client | null>(null);
  const localEventSourceRef = useRef<EventSource | null>(null);
  const localTokenRef = useRef<string | null>(null);
  const localUserAddressRef = useRef<string | null>(null);
  const localUserTeamsRef = useRef<any>(null);
  const localUserDataExtensionsRef = useRef<any>(null);
  const localIsConnectingRef = useRef(false);
  const localIsInitializedRef = useRef(false);
  const localConnectionStartTimeRef = useRef<number | null>(null);
  const localReconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localIsReconnectingRef = useRef(false);
  const localIsGettingTokenRef = useRef(false);
  const localReconnectionAttemptsRef = useRef(0);
  const localLastMessageTimeRef = useRef<number | null>(null);
  const localHealthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localHasRequestedInitialStateRef = useRef(false);
  const localPendingRefreshAfterCallEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLastRefreshAfterCallEndRef = useRef(0);

  // Use shared refs for global instance, individual refs for other instances
  const clientRef = isGlobalInstance ? globalConnectionRefs.clientRef : localClientRef;
  const eventSourceRef = isGlobalInstance ? globalConnectionRefs.eventSourceRef : localEventSourceRef;
  const tokenRef = isGlobalInstance ? globalConnectionRefs.tokenRef : localTokenRef;
  const userAddressRef = isGlobalInstance ? globalConnectionRefs.userAddressRef : localUserAddressRef;
  const userTeamsRef = isGlobalInstance ? globalConnectionRefs.userTeamsRef : localUserTeamsRef;
  const userDataExtensionsRef = isGlobalInstance ? globalConnectionRefs.userDataExtensionsRef : localUserDataExtensionsRef;
  const screenIdRef = useRef<string | undefined>(screenId);
  const isConnectingRef = isGlobalInstance ? globalConnectionRefs.isConnectingRef : localIsConnectingRef;
  const isInitializedRef = isGlobalInstance ? globalConnectionRefs.isInitializedRef : localIsInitializedRef;
  const connectionStartTimeRef = isGlobalInstance ? globalConnectionRefs.connectionStartTimeRef : localConnectionStartTimeRef;
  const reconnectionTimerRef = isGlobalInstance ? globalConnectionRefs.reconnectionTimerRef : localReconnectionTimerRef;
  const isReconnectingRef = isGlobalInstance ? globalConnectionRefs.isReconnectingRef : localIsReconnectingRef;
  const isGettingTokenRef = isGlobalInstance ? globalConnectionRefs.isGettingTokenRef : localIsGettingTokenRef;
  const reconnectionAttemptsRef = isGlobalInstance ? globalConnectionRefs.reconnectionAttemptsRef : localReconnectionAttemptsRef;
  const lastMessageTimeRef = isGlobalInstance ? globalConnectionRefs.lastMessageTimeRef : localLastMessageTimeRef;
  const healthCheckIntervalRef = isGlobalInstance ? globalConnectionRefs.healthCheckIntervalRef : localHealthCheckIntervalRef;
  const hasRequestedInitialStateRef = isGlobalInstance ? globalConnectionRefs.hasRequestedInitialStateRef : localHasRequestedInitialStateRef;
  const pendingRefreshAfterCallEndRef = isGlobalInstance ? globalConnectionRefs.pendingRefreshAfterCallEndRef : localPendingRefreshAfterCallEndRef;
  const lastRefreshAfterCallEndRef = isGlobalInstance ? globalConnectionRefs.lastRefreshAfterCallEndRef : localLastRefreshAfterCallEndRef;

  // Store attemptReconnection function in a ref so it can be accessed from multiple useEffects
  const attemptReconnectionRef = useRef<((maxAttempts?: number) => Promise<void>) | null>(null);

  // Store latest callback functions in refs to avoid stale closures
  // These will be initialized after the functions are defined
  const handleCallEventRef = useRef<typeof handleCallEvent | null>(null);
  const handleOngoingCallsRef = useRef<((data: any) => void) | null>(null);
  const groupDevicesByDnAndDeviceNameRef = useRef<
    typeof groupDevicesByDnAndDeviceName | null
  >(null);
  const updateSummaryDataRef = useRef<typeof updateSummaryData | null>(null);
  const publishStompMessageRef = useRef<typeof publishStompMessage | null>(
    null
  );

  // Load persisted call states from localStorage
  const loadPersistedCallStates = useCallback(() => {
    try {
      const storedTimestamp = localStorage.getItem(CALL_STATES_TIMESTAMP_KEY);
      if (!storedTimestamp) {
        return;
      }

      const timestamp = new Date(storedTimestamp);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      // Check if stored data is still valid (not expired)
      if (hoursDiff > STORAGE_EXPIRY_HOURS) {
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        return;
      }

      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (storedCallStates) {
        const parsedCallStates = JSON.parse(storedCallStates) as Record<string, unknown>;
        const activeCallStates = reduceLoadPersistedCallStates(
          parsedCallStates,
        ) as Record<string, CtiCallEvent>;

        if (Object.keys(activeCallStates).length > 0) {
          setCallStateMap(activeCallStates);
        }
      }
    } catch (error) {
      console.warn("[useCtiStomp] loadPersistedCallStates failed, clearing storage", error);
      localStorage.removeItem(CALL_STATES_STORAGE_KEY);
      localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
    }
  }, []);

  // Save call states to localStorage
  const saveCallStatesToStorage = useCallback(
    (callStates: Record<string, CtiCallEvent>) => {
      try {
        const callsToPersist = reduceSaveCallStates(
          callStates as unknown as Record<string, unknown>,
        ) as Record<string, CtiCallEvent>;

        if (Object.keys(callsToPersist).length === 0) {
          localStorage.removeItem(CALL_STATES_STORAGE_KEY);
          localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        }
      } catch (error) {
        console.warn("[useCtiStomp] saveCallStatesToStorage failed", error);
      }
    },
    []
  );

  // Handle incoming call events
  const handleCallEvent = useCallback(
    (evt: CtiCallEvent) => {
      const callId = evt.callId;
      if (!callId) return;

      // Broadcast event to other tabs if we're master
      if (isGlobalInstance && crossTabManagerRef.current.isMasterTab() && crossTabManagerRef.current.isCrossTabSupported()) {
        crossTabManagerRef.current.broadcastCtiEvent({
          type: 'call_event',
          event: evt
        });
      }

      // Count incoming call events
      if (evt.eventType === "RINGING" && evt.parties) {
        // Check if this is an incoming call (someone calling this DN)
        const isIncomingCall = evt.parties.some(
          (p: any) => p.calledAddress && p.callStatus === "RINGING"
        );

        if (isIncomingCall) {
          setSummaryData((prev) => ({
            ...prev,
            incomingEvents: prev.incomingEvents + 1,
          }));
        }
      }

      // Always append to eventLog for debugging (even if we don't update state)
      setEventLog((prev) => {
        const log = [...prev, evt];
        if (log.length > 200) log.shift();
        return log;
      });

      setCallStateMap((prev) =>
        applyCallEventToCallStateMap(
          prev as Record<string, any>,
          callId,
          evt,
          dnsMap,
          saveCallStatesToStorage as (m: Record<string, any>) => void,
        ) as Record<string, CtiCallEvent>,
      );
    },
    [saveCallStatesToStorage, dnsMap] // Include dnsMap so non-master tabs have access to latest device info
  );

  // Handle ongoing calls response
  const handleOngoingCalls = useCallback(
    (data: { callsByDn?: Record<string, any> }) => {
      if (!data?.callsByDn) {
        return;
      }

      const callsByDn = data.callsByDn;

      setCallStateMap((prev) => {
        const updated = mergeOngoingCallsIntoCallStateMap(
          prev as Record<string, any>,
          callsByDn,
        ) as Record<string, CtiCallEvent>;
        saveCallStatesToStorage(updated);
        return updated;
      });
    },
    [saveCallStatesToStorage],
  );

  // Group devices by DN and deviceName
  const groupDevicesByDnAndDeviceName = useCallback(
    (deviceArray: CtiDevice[]) => {
      return deviceArray.reduce((acc, device) => {
        const { dn, deviceName } = device;
        if (!acc[dn]) acc[dn] = { dn, devices: {} };
        acc[dn].devices[deviceName] = device;
        return acc;
      }, {} as Record<string, { dn: string; devices: Record<string, CtiDevice> }>);
    },
    []
  );

  // Update summary data based on current state
  const updateSummaryData = useCallback(
    (
      dns: Record<string, { dn: string; devices: Record<string, CtiDevice> }>
    ) => {
      let extensions = 0;
      let online = 0;
      let offline = 0;
      let connected = 0;
      let on_hold = 0;
      let answered = 0;
      let incoming = 0;
      let incomingEvents = 0;

      // Count unique extensions (DNs)
      extensions = Object.keys(dns).length;

      // Count devices by terminalState and status
      Object.values(dns).forEach((dnData) => {
        Object.values(dnData.devices).forEach((device) => {
          if (device.terminalState === "REGISTERED") online++;
          if (device.terminalState === "UNREGISTERED") offline++;
          if (device.status === "CONNECTED") connected++;
          if (device.status === "ON_HOLD") on_hold++;
          if (device.status === "ANSWERED") answered++;
        });
      });

      setSummaryData({
        extensions,
        online,
        offline,
        connected,
        on_hold,
        answered,
        incoming,
        incomingEvents,
      });
    },
    []
  );

  // Helper function to publish STOMP messages via API.
  // If the API returns "No active STOMP connection" (e.g. POST hit different instance than SSE, or connection briefly unavailable after call end), retry with backoff.
  const PUBLISH_RETRY_DELAYS_MS = [0, 400, 800, 1200]; // 4 attempts: immediate, then +400ms, +800ms, +1200ms
  const publishStompMessage = useCallback(
    async (destination: string, body: string = "", retry = true): Promise<boolean> => {
      if (!tokenRef.current || !userAddressRef.current) {
        return false;
      }

      const doPost = async () => {
        const response = await axiosInstance.post("/cti-stomp-stream", {
          token: tokenRef.current,
          userAddress: userAddressRef.current,
          destination,
          body,
          screenId: screenIdRef.current || "default",
        });
        return response.data.success === true;
      };

      for (let attempt = 0; attempt < (retry ? PUBLISH_RETRY_DELAYS_MS.length : 1); attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, PUBLISH_RETRY_DELAYS_MS[attempt]));
        }
        try {
          return await doPost();
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || "";
          const isNoConnection = typeof errMsg === "string" && errMsg.includes("No active STOMP connection");
          if (!retry || !isNoConnection || attempt === PUBLISH_RETRY_DELAYS_MS.length - 1) {
            return false;
          }
        }
      }
      return false;
    },
    []
  );

  // Schedule at most one refresh (initial-state + ongoing-calls) after call end, throttled to once per 2s. Prevents infinite loop when multiple DROPPED/DISCONNECTED events or response data re-trigger.
  const REFRESH_AFTER_CALL_END_THROTTLE_MS = 2000;
  const REFRESH_AFTER_CALL_END_DELAY_MS = 300;
  const scheduleRefreshAfterCallEnd = useCallback(() => {
    if (pendingRefreshAfterCallEndRef.current) {
      clearTimeout(pendingRefreshAfterCallEndRef.current);
      pendingRefreshAfterCallEndRef.current = null;
    }
    const now = Date.now();
    if (lastRefreshAfterCallEndRef.current && now - lastRefreshAfterCallEndRef.current < REFRESH_AFTER_CALL_END_THROTTLE_MS) {
      return;
    }
    pendingRefreshAfterCallEndRef.current = setTimeout(() => {
      pendingRefreshAfterCallEndRef.current = null;
      lastRefreshAfterCallEndRef.current = Date.now();
      const pub = publishStompMessageRef.current;
      if (pub) {
        pub("/app/request/initial-state", "");
        pub("/app/request/ongoing-calls", "");
      }
    }, REFRESH_AFTER_CALL_END_DELAY_MS);
  }, []);

  const scheduleRefreshAfterCallEndRef = useRef(scheduleRefreshAfterCallEnd);
  scheduleRefreshAfterCallEndRef.current = scheduleRefreshAfterCallEnd;

  // Update refs when callbacks change (after all functions are defined)
  useEffect(() => {
    handleCallEventRef.current = handleCallEvent;
    handleOngoingCallsRef.current = handleOngoingCalls;
    groupDevicesByDnAndDeviceNameRef.current = groupDevicesByDnAndDeviceName;
    updateSummaryDataRef.current = updateSummaryData;
    publishStompMessageRef.current = publishStompMessage;
  }, [
    handleCallEvent,
    handleOngoingCalls,
    groupDevicesByDnAndDeviceName,
    updateSummaryData,
    publishStompMessage,
  ]);


  // Shared getBearerToken function - uses isGettingTokenRef to prevent duplicate calls
  const getBearerToken = useCallback(async (): Promise<{
    token: string;
    userAddress: string;
  } | null> => {
    if (isGettingTokenRef.current) {
      return waitForConcurrentCtiToken(
        isGettingTokenRef,
        tokenRef,
        userAddressRef,
        instanceIdRef.current,
        10000,
        100,
      );
    }

    isGettingTokenRef.current = true;

    try {
      const result = await fetchCtiConnectToken({
        axiosInstance,
        getAccessToken: () => tokenService.getAccessToken() ?? null,
        globalExcludedPaths: getGlobalExcludedPaths(),
        isAuthenticated,
        tokenWaitMs: 4000,
        tokenCheckInterval: 100,
        logPrefix: instanceIdRef.current,
      });

      if (!result) {
        isGettingTokenRef.current = false;
        return null;
      }

      const { token, userAddress, userTeams, userDataExtensions } = result;
      tokenRef.current = token;
      userAddressRef.current = userAddress;
      userTeamsRef.current = userTeams;
      userDataExtensionsRef.current = userDataExtensions;

      if (
        isGlobalInstance &&
        crossTabManagerRef.current.isMasterTab() &&
        crossTabManagerRef.current.isCrossTabSupported()
      ) {
        crossTabManagerRef.current.broadcastCtiEvent({
          type: "user_data_extensions",
          data: userDataExtensions,
        });
      }

      isGettingTokenRef.current = false;
      return { token, userAddress };
    } catch (error) {
      console.warn("[useCtiStomp] getBearerToken failed", error);
      isGettingTokenRef.current = false;
      return null;
    }
  }, [isAuthenticated, isGlobalInstance]);

  useEffect(() => {
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
      preserveReconnecting: boolean = false
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
      tokenRef.current = null;
      userAddressRef.current = null;
      userTeamsRef.current = null;
      userDataExtensionsRef.current = null;

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

      // If force reconnect, fully close everything first
      if (forceReconnect) {
        await fullyCloseConnection();
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
          const sseCtx = {
            currentInstanceId,
            getInstanceId: () => instanceIdRef.current,
            isGlobalInstance,
            crossTabManagerRef,
            lastMessageTimeRef,
            setDnsMap,
            setEventLog,
            setError,
            setIsInitialized,
            isReconnectingRef,
            setIsReconnecting,
            attemptReconnection: () => {
              void attemptReconnection();
            },
            scheduleRefreshAfterCallEndRef,
            hasRequestedInitialStateRef,
            publishStompMessageRef,
            handleCallEventRef,
            groupDevicesByDnAndDeviceNameRef,
            updateSummaryDataRef,
          };
          dispatchPrimaryCtiSsePayload(data, sseCtx as PrimarySseDispatchCtx);
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
        storage: safeLocalStorage,
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
        const masterTabId = safeLocalStorage.getItem(MASTER_TAB_KEY);
        const lastHeartbeat = safeLocalStorage.getItem(MASTER_TAB_HEARTBEAT_KEY);
        
        if (masterTabId && lastHeartbeat) {
          const heartbeatTime = Number.parseInt(lastHeartbeat, 10);
          const timeSinceHeartbeat = Date.now() - heartbeatTime;
          // If heartbeat is stale (>5 seconds), clear it and force master election
          if (timeSinceHeartbeat > MASTER_TAB_TIMEOUT) {
            console.log(
              `[${instanceIdRef.current}] Stale master detected (${Math.round(timeSinceHeartbeat / 1000)}s old), clearing and forcing master election...`
            );
            safeLocalStorage.removeItem(MASTER_TAB_KEY);
            safeLocalStorage.removeItem(MASTER_TAB_HEARTBEAT_KEY);
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
    // Depend on authentication state to reinitialize after login
    // Also depend on router pathname to detect client-side navigation
    // This ensures connection initializes when navigating via router.push()
    // isGlobalInstance is checked inside the effect, so we don't need it as a dependency
    // FIX: Removed eventSource from dependencies - it causes unnecessary re-runs
    // Connection state is tracked via eventSourceRef, not the eventSource state
  }, [isAuthenticated, authInitialized, router.pathname]);

  // Helper: Get devices array for a DN
  const getDevicesForDn = useCallback(
    (dn: string) => {
      const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
      return devices;
    },
    [dnsMap]
  );

  // Helper: Get calls involving a DN (any device)
  // IMPORTANT: Only return calls where the DN has at least one active (non-DROPPED) party
  // RINGING calls should always be included if they have parties with RINGING status
  const getCallStatesForDn = useCallback(
    (dn: string) => {
      return Object.values(callStateMap).filter((call) => {
        // Skip terminating calls
        if (call.isTerminating) return false;

        // RINGING calls should always be included if currentState is RINGING
        // This ensures RINGING calls appear in Live Calls section even if hasActiveParticipants is false
        if (call.currentState === "RINGING") {
          return call.parties?.some(
            (p: any) =>
              (p.callingAddress === dn || p.calledAddress === dn) &&
              (p.callStatus === "RINGING" || 
               (p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED"))
          );
        }

        // Check if there's at least one active party for this DN
        return call.parties?.some(
          (p: any) =>
            (p.callingAddress === dn || p.calledAddress === dn) &&
            p.callStatus !== "DROPPED" &&
            p.callStatus !== "DISCONNECTED"
        );
      });
    },
    [callStateMap]
  );

  // Helper: Check if DN has any active calls
  // Note: Since we now store only active parties, all parties in the array are already active
  const hasActiveCalls = useCallback(
    (dn: string) => {
      return Object.values(callStateMap).some((call) => {
        // Skip terminating calls
        if (call.isTerminating) return false;

        // Check if there's a party for this DN (all parties are already active, but check for safety)
        return call.parties?.some(
          (p: any) =>
            (p.callingAddress === dn || p.calledAddress === dn) &&
            p.callStatus !== "DROPPED" &&
            p.callStatus !== "DISCONNECTED"
        );
      });
    },
    [callStateMap]
  );

  // Helper: Get call state for DN (most recent call)
  const getDnCallState = useCallback(
    (dn: string) => {
      const calls = getCallStatesForDn(dn);
      if (!calls.length) return null;

      // Filter to only active calls (where at least one party for this DN exists)
      // Note: Since we now store only active parties, all parties in the array are already active
      const activeCalls = calls.filter((call) => {
        // Skip terminating calls
        if (call.isTerminating) return false;

        // Check if there's a party involving this DN (all parties are already active, but check for safety)
        const dnParties =
          call.parties?.filter(
            (p: any) =>
              (p.callingAddress === dn || p.calledAddress === dn) &&
              p.callStatus !== "DROPPED" &&
              p.callStatus !== "DISCONNECTED"
          ) || [];

        return dnParties.length > 0;
      });

      if (!activeCalls.length) return null;

      const mostRecent = pickMostRecentCall(activeCalls);

      // Find the participant where this DN appears (all parties are already active, but check for safety)
      const matchedParty = mostRecent.parties.find(
        (p: any) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED"
      );

      if (!matchedParty) return null;

      // Filter out DROPPED/DISCONNECTED parties for safety (shouldn't be any, but check for old data)
      const activeParties = mostRecent.parties.filter(
        (p: any) =>
          p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED"
      );

      if (activeParties.length === 0) return null;

      return {
        ...mostRecent,
        parties: activeParties, // Return only active parties (should already be filtered, but safe check)
        role: matchedParty.callingAddress === dn ? "calling" : "called",
        isActive: true,
      };
    },
    [getCallStatesForDn]
  );

  // Helper: Get call state for specific DN-device pair
  const getCallStateForDevice = useCallback(
    (dn: string, deviceName: string) => {
      const calls = Object.values(callStateMap);
      // Find calls where any party matches dn + deviceName
      const filtered = calls.filter((call) =>
        call.parties?.some(
          (p: any) =>
            ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
              (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
            p.callStatus !== "DROPPED"
        )
      );

      if (!filtered.length) return null;

      // Most recent call
      const mostRecent = pickMostRecentCall(filtered);

      // Matched party (prefer non-DROPPED)
      const matchedParty = mostRecent.parties.find(
        (p: any) =>
          ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
            (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
          p.callStatus !== "DROPPED"
      );

      if (!matchedParty) return null;

      // Filter out DROPPED parties from the parties array before returning
      const activeParties = mostRecent.parties.filter(
        (p: any) =>
          p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED"
      );

      // If no active parties remain after filtering, return null
      if (activeParties.length === 0) return null;

      return {
        ...mostRecent,
        parties: activeParties, // Return only active parties
        role: matchedParty.callingAddress === dn ? "calling" : "called",
        isActive: true,
      };
    },
    [callStateMap]
  );

  // Clear expired call states from localStorage
  const clearExpiredCallStates = useCallback(() => {
    try {
      const storedTimestamp = localStorage.getItem(CALL_STATES_TIMESTAMP_KEY);
      if (!storedTimestamp) return;

      const timestamp = new Date(storedTimestamp);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > STORAGE_EXPIRY_HOURS) {
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.warn("[useCtiStomp] clearExpiredCallStates failed", error);
    }
  }, []);

  // Synchronize persisted call states with server state
  const syncPersistedCallStates = useCallback(() => {
    try {
      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (!storedCallStates) return;

      const parsedCallStates = JSON.parse(storedCallStates);

      if (!clientRef.current?.connected) {
        return;
      }
      const stompClient = clientRef.current;
      Object.keys(parsedCallStates).forEach((callId) => {
        stompClient.publish({
          destination: "/app/request/call-state",
          body: JSON.stringify({ callId }),
        });
      });
    } catch (error) {
      console.warn("[useCtiStomp] syncPersistedCallStates failed", error);
    }
  }, []);

  // Load persisted call states on component mount
  useEffect(() => {
    loadPersistedCallStates();
    clearExpiredCallStates();
  }, [loadPersistedCallStates, clearExpiredCallStates]);

  // Cross-tab integration: Check if this tab is the master
  useEffect(() => {
    const manager = crossTabManagerRef.current;
    setIsMasterTab(manager.isMasterTab());

    // Listen for master status changes
    const checkMasterStatus = () => {
      setIsMasterTab(manager.isMasterTab());
    };

    // Check master status periodically
    const interval = setInterval(checkMasterStatus, 2000);

    // Request userDataExtensions from master tab if not available
    if (!userDataExtensionsRef.current && manager.isCrossTabSupported() && !manager.isMasterTab()) {
      // Request data from master tab
      manager.broadcastCtiEvent({
        type: 'request_user_data_extensions',
        data: null
      });
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Cross-tab integration: Monitor master status and handle transitions
  // This effect only handles cleanup when we're not master, NOT initialization
  // Initialization is handled by the main initialize() function
  useEffect(() => {
    if (!isGlobalInstance || !crossTabManagerRef.current.isCrossTabSupported()) {
      return;
    }

    // Only call connect when user is authenticated; avoid 401 from /cti/connect
    if (!isAuthenticated || !authInitialized) {
      return;
    }

    const manager = crossTabManagerRef.current;
    const currentInstanceId = instanceIdRef.current;

    // Check master status
    const isMaster = manager.isMasterTab();

    // If we're NOT master, ensure we don't have a connection and mark as initialized (for UI)
    if (!isMaster) {
      // Close any existing connection if we somehow have one
      if (eventSourceRef.current) {
        console.log(`[${currentInstanceId}] Not master tab, closing any existing connection...`);
        try {
          eventSourceRef.current.close();
        } catch (err) {
          console.warn("[useCtiStomp] EventSource.close failed (not master cleanup)", err);
        }
        eventSourceRef.current = null;
      }
      // Mark as initialized so UI works (actions will forward to master)
      if (!isInitializedRef.current) {
        setIsInitialized(true);
        setError(null);
      }
      return;
    }

    // If we're master but not initialized AND not connecting, initialize the connection
    // This handles the case where we became master after the initial mount (master election took longer than 100ms)
    // IMPORTANT: Check isConnectingRef FIRST and set it IMMEDIATELY to prevent race conditions
    // CRITICAL: Also check if eventSource already exists (might be created by main initialize)
    if (
      isMaster &&
      !isInitializedRef.current &&
      !eventSourceRef.current &&
      !isConnectingRef.current &&
      !isGettingTokenRef.current
    ) {
      // ATOMIC CHECK-AND-SET: Set connecting flag IMMEDIATELY to prevent race conditions
      // Double-check after a microtask to ensure main initialize didn't start in the meantime
      if (isConnectingRef.current || isGettingTokenRef.current || eventSourceRef.current) {
        // Already connecting or getting token (probably from main initialize), skip
        console.log(`[${currentInstanceId}] Already connecting or getting token, skipping duplicate...`);
        return;
      }
      
      // Set connecting flag BEFORE any async operations
      isConnectingRef.current = true;

      console.log(
        `[${currentInstanceId}] Master tab detected (after initial mount), initializing connection...`
      );

      // Use the shared getBearerToken function
      getBearerToken()
        .then(async (token) => {
          if (!token) {
            isConnectingRef.current = false;
            isGettingTokenRef.current = false; // Reset token flag
            setError("Service unavailable");
            return;
          }

          // Close any existing connection first
          if (eventSourceRef.current) {
            try {
              eventSourceRef.current.close();
            } catch (err) {
              console.warn("[useCtiStomp] EventSource.close failed (master pre-connect)", err);
            }
            eventSourceRef.current = null;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Double-check we're still master and haven't lost master status
          if (!manager.isMasterTab()) {
            isConnectingRef.current = false;
            isGettingTokenRef.current = false; // Reset token flag
            return;
          }

          // CRITICAL: Double-check connection doesn't already exist after getting token
          // Another initialization might have started in the meantime
          if (eventSourceRef.current) {
            const existingEventSource = eventSourceRef.current as EventSource;
            const existingState = existingEventSource.readyState;
            if (existingState === EventSource.CONNECTING || existingState === EventSource.OPEN) {
              console.log(
                `[${currentInstanceId}] Got token but connection already exists (state: ${existingState}), skipping...`
              );
              isConnectingRef.current = false;
              isGettingTokenRef.current = false;
              return;
            }
          }

          // We're still master, proceed with connection
          // isConnectingRef.current is already set to true before getBearerToken()
          tokenRef.current = token.token;
          userAddressRef.current = token.userAddress;
          setUserAddress(token.userAddress);

          const params = new URLSearchParams();
          params.append("token", token.token);
          params.append("userAddress", token.userAddress);
          params.append("instanceId", currentInstanceId);
          if (screenIdRef.current) {
            params.append("screenId", screenIdRef.current);
          }
          const sseUrl = `/api/cti-stomp-stream?${params.toString()}`;

          // CRITICAL: Final check before creating EventSource - prevent duplicate connections
          // This is the last line of defense against race conditions
          if (eventSourceRef.current) {
            const existingEventSource = eventSourceRef.current as EventSource;
            const existingState = existingEventSource.readyState;
            if (existingState === EventSource.CONNECTING || existingState === EventSource.OPEN) {
              console.log(`[${currentInstanceId}] ⚠️ EventSource already exists with state ${existingState}, closing before creating new one...`);
              try {
                existingEventSource.close();
              } catch (err) {
                console.warn("[useCtiStomp] EventSource.close failed (master duplicate guard)", err);
              }
              eventSourceRef.current = null;
              // Wait a bit to ensure it's fully closed
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          console.log(`[${currentInstanceId}] Creating SSE connection as master...`);
          const eventSource = new EventSource(sseUrl);
          
          // CRITICAL: Immediately store the EventSource to prevent duplicate creation
          // This must happen synchronously before any other code can run
          eventSourceRef.current = eventSource;
          eventSource.onopen = () => {
            isConnectingRef.current = false;
            isInitializedRef.current = true;
            setIsInitialized(true);
            setError(null);
            isReconnectingRef.current = false;
            setIsReconnecting(false);
            reconnectionAttemptsRef.current = 0;
            lastMessageTimeRef.current = Date.now();
            connectionStartTimeRef.current = Date.now();

            // Clear any existing health check interval
            if (healthCheckIntervalRef.current) {
              clearInterval(healthCheckIntervalRef.current);
              healthCheckIntervalRef.current = null;
            }

            // Set up health check to detect dead connections
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

              const now = Date.now();
              const lastMessageTime = lastMessageTimeRef.current || connectionStartTimeRef.current || now;
              const timeSinceLastMessage = now - lastMessageTime;

              if (timeSinceLastMessage > 300000) {
                console.log(
                  `[${currentInstanceId}] ⚠️ Health check: No CTI event received in ${Math.round(timeSinceLastMessage / 1000)}s (connection is OPEN but no events), triggering reconnection...`
                );
                const reconnectStale = attemptReconnectionRef.current;
                if (reconnectStale) {
                  if (healthCheckIntervalRef.current) {
                    clearInterval(healthCheckIntervalRef.current);
                    healthCheckIntervalRef.current = null;
                  }
                  isReconnectingRef.current = true;
                  setIsReconnecting(true);
                  reconnectStale();
                }
              }
            }, 30000); // Check every 30 seconds
          };

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              // Update last message time for health check - but only for real messages, not pings
              // This ensures health check can detect when CTI events stop even if SSE pings continue
              if (data.type !== "ping" && data.type !== "test") {
                lastMessageTimeRef.current = Date.now();
              }

              switch (data.type) {
                case "complete_state":
                  if (
                    groupDevicesByDnAndDeviceNameRef.current &&
                    updateSummaryDataRef.current
                  ) {
                    const grouped = groupDevicesByDnAndDeviceNameRef.current(
                      data.data
                    );
                    setDnsMap(grouped);
                    updateSummaryDataRef.current(grouped);
                    setEventLog((prev) => [
                      ...prev,
                      {
                        type: "initial-state",
                        data: grouped,
                        timestamp: new Date().toISOString(),
                      },
                    ]);
                    // CRITICAL: Broadcast complete_state to non-master tabs
                    // This ensures non-master tabs receive the initial data for live-calls page
                    if (isGlobalInstance && manager.isMasterTab() && manager.isCrossTabSupported()) {
                      manager.broadcastCtiEvent({
                        type: 'complete_state',
                        data: data.data
                      });
                    }
                  }
                  break;

                case "dns_states": {
                  const s = data.data;
                  setDnsMap((prev) => {
                    const updated = { ...prev };
                    const { dn, deviceName } = s;
                    if (!updated[dn]) {
                      updated[dn] = { dn, devices: {} };
                    }
                    const existing = updated[dn].devices[deviceName];
                    updated[dn].devices[deviceName] = { ...existing, ...s };
                    if (updateSummaryDataRef.current) {
                      updateSummaryDataRef.current(updated);
                    }
                    return updated;
                  });

                  if (isGlobalInstance && manager.isMasterTab() && manager.isCrossTabSupported()) {
                    manager.broadcastCtiEvent({
                      type: "dns_states",
                      data: s,
                    });
                  }
                  break;
                }

                case "call_events":
                  if (handleCallEventRef.current) {
                    handleCallEventRef.current(data.data);
                  }
                  if (data.data?.eventType === "DROPPED" || data.data?.eventType === "DISCONNECTED") {
                    scheduleRefreshAfterCallEndRef.current?.();
                  }
                  break;

                case "stomp_connected": {
                  setIsInitialized(true);
                  setError(null);
                  const publishMaster = publishStompMessageRef.current;
                  if (!hasRequestedInitialStateRef.current && publishMaster) {
                    hasRequestedInitialStateRef.current = true;
                    publishMaster("/app/request/initial-state", "");
                    publishMaster("/app/request/ongoing-calls", "");
                  }
                  break;
                }
                
                case "ongoing_calls":
                  if (handleOngoingCallsRef.current) {
                    handleOngoingCallsRef.current(data.data);
                  }
                  break;
              }
            } catch (error) {
              console.warn("[useCtiStomp] Master SSE message parse/handle failed", error);
            }
          };

          eventSource.onerror = (error) => {
            const currentInstanceId = instanceIdRef.current;
            const readyState = eventSource.readyState;
            const manager = crossTabManagerRef.current;

            if (isGlobalInstance && manager.isCrossTabSupported()) {
              const isMaster = manager.isMasterTab();
              if (!isMaster) {
                console.log(
                  `[${currentInstanceId}] ⚠️ No longer master tab, closing connection...`
                );
                if (eventSourceRef.current) {
                  try {
                    eventSourceRef.current.close();
                  } catch (err) {
                    console.warn("[useCtiStomp] EventSource.close failed (master, not master)", err);
                  }
                  eventSourceRef.current = null;
                }
                setIsInitialized(true);
                setError(null);
                return;
              }
            }

            if (readyState === EventSource.CLOSED) {
              console.log(`[${currentInstanceId}] ⚠️ SSE connection closed`);
              setIsInitialized(false);

              if (isReconnectingRef.current || !attemptReconnectionRef.current) {
                return;
              }
              isReconnectingRef.current = true;
              setIsReconnecting(true);
              console.log(
                `[${currentInstanceId}] 🔄 Connection closed, starting reconnection with retry logic...`
              );
              attemptReconnectionRef.current();
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
        })
        .catch((error) => {
          console.error(`[${currentInstanceId}] Error getting token:`, error);
          isConnectingRef.current = false;
          isGettingTokenRef.current = false;
          console.error(`[${currentInstanceId}] ❌ Failed to get token`);
        });
    }
    // Re-run when auth state changes so we connect only when authenticated
  }, [isMasterTab, isGlobalInstance, isAuthenticated, authInitialized]);

  // Cross-tab integration: Listen to events from master tab
  useEffect(() => {
    const manager = crossTabManagerRef.current;

    if (!manager.isCrossTabSupported()) {
      return; // Fallback to normal behavior if not supported
    }

    // Listen to CTI events from master tab
    const unsubscribeCtiEvents = manager.onCtiEvent((event) => {
      dispatchCrossTabCtiBroadcastEvent(event, {
        instanceIdRef,
        isGlobalInstance,
        manager,
        userDataExtensionsRef,
        handleCallEvent: handleCallEvent as (evt: unknown) => void,
        groupDevicesByDnAndDeviceNameRef:
          groupDevicesByDnAndDeviceNameRef as CrossTabBroadcastCtx["groupDevicesByDnAndDeviceNameRef"],
        updateSummaryDataRef:
          updateSummaryDataRef as CrossTabBroadcastCtx["updateSummaryDataRef"],
        setDnsMap: setDnsMap as unknown as CrossTabBroadcastCtx["setDnsMap"],
        setEventLog,
      });
    });

    // Listen to state updates from master tab
    const unsubscribeStateUpdates = manager.onStateUpdate((state) => {
      if (state.dnsMap) {
        setDnsMap(state.dnsMap);
      }
      if (state.callStateMap) {
        setCallStateMap(state.callStateMap);
        saveCallStatesToStorage(state.callStateMap);
      }
      if (state.summaryData) {
        setSummaryData(state.summaryData);
      }
      if (state.userAddress) {
        setUserAddress(state.userAddress);
      }
      // CRITICAL: Sync eventLog from master tab so non-master tabs have full event history
      // This ensures components like GlobalFloatingCallBar can detect incoming calls
      if (state.eventLog && Array.isArray(state.eventLog)) {
        setEventLog((prev) => mergeRemoteEventLogWithPrevious(prev, state.eventLog));
      }
      // Always set initialized to true when we receive state from master
      // This ensures non-master tabs appear as initialized
      setIsInitialized(true);
      setError(null);
    });

    // Listen to action requests from non-master tabs (master tab only)
    const unsubscribeActionRequests = manager.onActionRequest(async (event) => {
      if (!manager.isMasterTab()) {
        return; // Only master tab handles action requests
      }

      if (event.data?.actionType === 'requestInitialState') {
        // Publish request for initial state
        if (publishStompMessageRef.current) {
          publishStompMessageRef.current(
            "/app/request/initial-state",
            ""
          );
          console.log(`[${instanceIdRef.current}] Master tab: Requested initial state for non-master tab`);
        }
        // Send success response
        manager.sendActionResponse(event.actionId || '', { success: true });
      }
    });

    return () => {
      unsubscribeCtiEvents();
      unsubscribeStateUpdates();
      unsubscribeActionRequests();
    };
  }, [handleCallEvent, saveCallStatesToStorage]);

  // Cross-tab integration: Broadcast state updates when master tab
  useEffect(() => {
    const manager = crossTabManagerRef.current;

    if (!manager.isMasterTab() || !manager.isCrossTabSupported()) {
      return;
    }

    // Broadcast state updates to other tabs (including eventLog for full sync)
    manager.broadcastStateUpdate({
      dnsMap,
      callStateMap,
      summaryData,
      userAddress,
      eventLog, // Include eventLog so non-master tabs have full event history
      isInitialized: true, // Always true for master
    });
  }, [dnsMap, callStateMap, summaryData, userAddress, eventLog]);

  // Cross-tab integration: Broadcast CTI events when master tab
  useEffect(() => {
    const manager = crossTabManagerRef.current;

    if (!manager.isMasterTab() || !manager.isCrossTabSupported()) {
      return;
    }

    // Broadcast latest call events to other tabs
    // This ensures non-master tabs receive events in real-time
    if (eventLog && eventLog.length > 0) {
      const latestEvent = eventLog.at(-1);
      // Broadcast all events, not just those with callId (some events like complete_state don't have callId)
      if (latestEvent) {
        manager.broadcastCtiEvent({
          type: 'call_event',
          event: latestEvent
        });
      }
    }
  }, [eventLog]);

  // Sync call states when WebSocket reconnects
  useEffect(() => {
    if (isInitialized && clientRef.current?.connected) {
      // Small delay to ensure subscriptions are ready
      const timer = setTimeout(() => {
        syncPersistedCallStates();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, syncPersistedCallStates]);

  // Get all call IDs from localStorage where currentState != DISCONNECTED
  const getActiveCallIdsFromLocalStorage = useCallback(() => {
    try {
      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (!storedCallStates) return [];

      const parsedCallStates = JSON.parse(storedCallStates);
      const activeCallIds = Object.entries(parsedCallStates)
        .filter(([_, callEvent]: [string, any]) => {
          const event = callEvent as CtiCallEvent;
          return event.currentState && event.currentState !== "DISCONNECTED";
        })
        .map(([callId]) => callId);

      return activeCallIds;
    } catch (error) {
      console.warn("[useCtiStomp] getActiveCallIdsFromLocalStorage failed", error);
      return [];
    }
  }, []);

  // Get all call IDs from the current callStateMap
  const getAllCallIds = useCallback(() => {
    return Object.keys(callStateMap);
  }, [callStateMap]);

  // Remove calls with isTerminating: true from the store
  const removeTerminatingCalls = useCallback(() => {
    setCallStateMap((prev) => {
      const filtered = Object.entries(prev).reduce(
        (acc, [callId, callEvent]) => {
          if (!callEvent.isTerminating) {
            acc[callId] = callEvent;
          }
          return acc;
        },
        {} as Record<string, CtiCallEvent>
      );

      // Save updated state to localStorage
      saveCallStatesToStorage(filtered);
      return filtered;
    });
  }, [saveCallStatesToStorage]);

  // Function that runs when all things are loaded
  const onAllLoaded = useCallback(
    async (callback: () => void | Promise<void>) => {
      if (isInitialized && dnsMap && Object.keys(dnsMap).length > 0) {
        // Remove terminating calls from store
        removeTerminatingCalls();

        // Execute callback (handle both sync and async callbacks)
        await callback();
      }
    },
    [
      isInitialized,
      dnsMap,
      removeTerminatingCalls,
      getActiveCallIdsFromLocalStorage,
      getAllCallIds,
    ]
  );

  // Getter functions for userTeams and userDataExtensions
  const getUserTeams = useCallback(() => {
    return userTeamsRef.current;
  }, []);

  const getUserDataExtensions = useCallback(() => {
    return userDataExtensionsRef.current;
  }, []);

  return {
    dnsMap,
    callStateMap,
    eventLog,
    error,
    isInitialized,
    isReconnecting,
    userAddress, // Return userAddress
    summaryData,
    getDevicesForDn,
    getCallStatesForDn,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    clearExpiredCallStates, // Export for external use if needed
    syncPersistedCallStates, // Export for external use if needed
    getActiveCallIdsFromLocalStorage, // Get call IDs from localStorage where currentState != DISCONNECTED
    getAllCallIds, // Get all call IDs from current state
    removeTerminatingCalls, // Remove calls with isTerminating: true from store
    onAllLoaded, // Function that runs when all things are loaded
    getUserTeams, // Get user teams data
    getUserDataExtensions, // Get user data extensions
  };
}
