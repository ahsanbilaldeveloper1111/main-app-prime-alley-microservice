import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@utils/axios";
import { getCrossTabCtiManager } from "../utils/crossTabCtiManager";
import { useAuth } from "./useAuth";
import { useRouter } from "next/router";
import { getGlobalExcludedPaths } from "@utils/Helper";
import tokenService from "@utils/tokenService";
import {
  mergeOngoingCallsIntoCallStateMap,
  extractCallsByDnFromOngoingCallsPayload,
} from "./ctiStompHelpers";
import { fetchCtiConnectToken, waitForConcurrentCtiToken } from "./ctiStompAuth";
import { subscribeCtiStompDeferredMasterEffect } from "./ctiStompDeferredMasterEffect";
import { subscribeCtiStompPrimaryAuthEffect } from "./ctiStompPrimaryAuthEffect";
import type { CtiDevice, CtiCallEvent, SummaryData } from "./ctiStompHookTypes";
import { CTI_CALL_STATES } from "./ctiStompHookConstants";
import { generateCtiStompInstanceId } from "./ctiStompInstanceId";
import { subscribeMasterTabStatusPoll } from "./ctiStompMasterTabPoll";
import { useCtiStompConnectionRefs } from "./useCtiStompConnectionRefs";
import type { CrossTabBroadcastCtx } from "./ctiStompCrossTabBroadcastDispatch";
import {
  broadcastCtiStompMasterLatestEvent,
  broadcastCtiStompMasterState,
  requestUserDataExtensionsFromMaster,
  subscribeCtiStompCrossTabListeners,
} from "./ctiStompCrossTabIntegration";
import {
  loadPersistedCallStateMap,
  saveCallStateMapToLocalStorage,
  clearExpiredStoredCallStates,
  readActiveCallIdsFromLocalStorage,
} from "./ctiStompCallStatePersistence";
import { assignCtiConnectTokenToRefsAndBroadcast } from "./ctiStompBearerAssign";
import { summarizeCtiDnsDevices } from "./ctiStompDnsSummary";
import {
  getCallStateForDeviceFromMap,
  getCallStatesForDnFromMap,
  getDnCallStateFromMap,
  hasActiveCallsInMap,
} from "./ctiStompDnCallSelectors";
import { handleIncomingCtiCallEvent } from "./ctiStompIncomingCallEvent";
import { publishCtiStompStreamMessageWithRetry } from "./ctiStompPublishRetry";
import { syncPersistedCtiCallStatesToStomp } from "./ctiStompPersistedCallSync";
import { createCtiStreamMissedEventRecovery } from "./ctiStreamMissedEventRecovery";

/**
 * Custom hook for CTI STOMP WebSocket connection via SSE
 *
 * IMPORTANT: For global instance ('global-cti-instance'), this hook now uses a singleton
 * connection manager to ensure only ONE connection exists for the entire app.
 *
 * For other instance IDs, each hook instance gets its own connection (for backward compatibility).
 *
 * @param wsPath
 * @param instanceId
 * @param screenId 
 */
export default function useCtiStomp(
  wsPath = "/ws",
  instanceId?: string,
  screenId?: string,
  onCallIdsRemovedFromMap?: (callIds: readonly string[]) => void,
) {
  // Check if this is the global instance - if so, use singleton connection manager
  const isGlobalInstance =
    instanceId === "global-cti-instance" || instanceId === undefined;

  // Generate unique instance ID if not provided (for non-global instances)
  const instanceIdRef = useRef<string>(
    isGlobalInstance
      ? "global-cti-instance"
      : instanceId || generateCtiStompInstanceId()
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

  const onCallIdsRemovedFromMapRef = useRef<
    typeof onCallIdsRemovedFromMap | undefined
  >(undefined);
  onCallIdsRemovedFromMapRef.current = onCallIdsRemovedFromMap;

  const {
    clientRef,
    eventSourceRef,
    tokenRef,
    userAddressRef,
    userTeamsRef,
    userDataExtensionsRef,
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
    lastRefreshAfterCallEndRef,
    streamGapRecoveryRef,
  } = useCtiStompConnectionRefs(isGlobalInstance);

  const screenIdRef = useRef<string | undefined>(screenId);

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
    loadPersistedCallStateMap(setCallStateMap);
  }, []);

  // Save call states to localStorage
  const saveCallStatesToStorage = useCallback(
    (callStates: Record<string, CtiCallEvent>) => {
      saveCallStateMapToLocalStorage(callStates);
    },
    [],
  );

  useEffect(() => {
    if (!streamGapRecoveryRef.current) {
      streamGapRecoveryRef.current = createCtiStreamMissedEventRecovery({
        publish: (destination, body) => {
          const pub = publishStompMessageRef.current;
          return pub ? pub(destination, body) : Promise.resolve(false);
        },
        logPrefix: `[${instanceIdRef.current}] [CtiStreamMissedEvent]`,
      });
    }
  }, [streamGapRecoveryRef]);

  // Handle incoming call events
  const handleCallEvent = useCallback(
    (evt: CtiCallEvent) => {
      streamGapRecoveryRef.current?.inspectCallEvent(evt);
      handleIncomingCtiCallEvent(evt, {
        isGlobalInstance,
        crossTabManagerRef,
        dnsMap,
        saveCallStatesToStorage,
        onCallIdsRemoved: (ids) => onCallIdsRemovedFromMapRef.current?.(ids),
        setSummaryData,
        setEventLog,
        setCallStateMap,
      });
    },
    [saveCallStatesToStorage, dnsMap, isGlobalInstance, streamGapRecoveryRef],
  );

  // Handle ongoing calls response (shape may be { callsByDn } or a flat call-id map from CTI)
  const handleOngoingCalls = useCallback(
    (data: unknown) => {
      const callsByDn = extractCallsByDnFromOngoingCallsPayload(data);
      if (!callsByDn || Object.keys(callsByDn).length === 0) {
        return;
      }

      setCallStateMap((prev) => {
        const removedFromMerge: string[] = [];
        const updated = mergeOngoingCallsIntoCallStateMap(
          prev as Record<string, any>,
          callsByDn as Record<string, any>,
          (id) => removedFromMerge.push(id),
        ) as Record<string, CtiCallEvent>;
        if (removedFromMerge.length) {
          onCallIdsRemovedFromMapRef.current?.(removedFromMerge);
        }
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
      dns: Record<string, { dn: string; devices: Record<string, CtiDevice> }>,
    ) => {
      setSummaryData(summarizeCtiDnsDevices(dns));
    },
    [],
  );

  const publishStompMessage = useCallback(
    async (destination: string, body: string = "", retry = true): Promise<boolean> => {
      const token = tokenRef.current;
      const userAddress = userAddressRef.current;
      if (!token || !userAddress) {
        return false;
      }
      return publishCtiStompStreamMessageWithRetry(
        axiosInstance,
        {
          token,
          userAddress,
          destination,
          body,
          screenId: screenIdRef.current || "default",
        },
        retry,
      );
    },
    [],
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

      const pair = assignCtiConnectTokenToRefsAndBroadcast({
        result,
        tokenRef,
        userAddressRef,
        userTeamsRef,
        userDataExtensionsRef,
        isGlobalInstance,
        crossTabManagerRef,
      });

      isGettingTokenRef.current = false;
      return pair;
    } catch (error) {
      console.warn("[useCtiStomp] getBearerToken failed", error);
      isGettingTokenRef.current = false;
      return null;
    }
  }, [isAuthenticated, isGlobalInstance]);

  useEffect(
    () =>
      subscribeCtiStompPrimaryAuthEffect({
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
        streamGapRecoveryRef,
      }),
    [isAuthenticated, authInitialized, router.pathname],
  );

  // Helper: Get devices array for a DN
  const getDevicesForDn = useCallback(
    (dn: string) => {
      const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
      return devices;
    },
    [dnsMap]
  );

  // Helper: Get calls involving a DN (any device)
  const getCallStatesForDn = useCallback(
    (dn: string) => getCallStatesForDnFromMap(callStateMap, dn),
    [callStateMap],
  );

  const hasActiveCalls = useCallback(
    (dn: string) => hasActiveCallsInMap(callStateMap, dn),
    [callStateMap],
  );

  const getDnCallState = useCallback(
    (dn: string) => getDnCallStateFromMap(callStateMap, dn),
    [callStateMap],
  );

  const getCallStateForDevice = useCallback(
    (dn: string, deviceName: string) =>
      getCallStateForDeviceFromMap(callStateMap, dn, deviceName),
    [callStateMap],
  );

  // Clear expired call states from localStorage
  const clearExpiredCallStates = useCallback(() => {
    clearExpiredStoredCallStates();
  }, []);

  // Synchronize persisted call states with server state
  const syncPersistedCallStates = useCallback(() => {
    syncPersistedCtiCallStatesToStomp(
      clientRef.current,
      CTI_CALL_STATES.STORAGE_KEY,
    );
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

    const onPollTick = () => {
      setIsMasterTab(crossTabManagerRef.current.isMasterTab());
    };

    const unsubscribePoll = subscribeMasterTabStatusPoll(onPollTick);

    requestUserDataExtensionsFromMaster(manager, userDataExtensionsRef);

    return unsubscribePoll;
  }, []);

  // Cross-tab integration: Monitor master status and handle transitions
  // This effect only handles cleanup when we're not master, NOT initialization
  // Initialization is handled by the main initialize() function
  useEffect(
    () =>
      subscribeCtiStompDeferredMasterEffect({
        isGlobalInstance,
        isAuthenticated,
        authInitialized,
        instanceIdRef,
        crossTabManagerRef,
        eventSourceRef,
        tokenRef,
        userAddressRef,
        screenIdRef,
        isConnectingRef,
        isInitializedRef,
        isGettingTokenRef,
        isReconnectingRef,
        healthCheckIntervalRef,
        lastMessageTimeRef,
        connectionStartTimeRef,
        reconnectionAttemptsRef,
        hasRequestedInitialStateRef,
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
        streamGapRecoveryRef,
      }),
    [
      isGlobalInstance,
      isAuthenticated,
      authInitialized,
      getBearerToken,
    ],
  );

  // Cross-tab integration: listen to master tab (events, state, action requests)
  useEffect(
    () =>
      subscribeCtiStompCrossTabListeners({
        instanceIdRef,
        isGlobalInstance,
        crossTabManagerRef,
        userDataExtensionsRef,
        handleCallEvent: (evt) =>
          handleCallEventRef.current?.(evt as CtiCallEvent),
        groupDevicesByDnAndDeviceNameRef:
          groupDevicesByDnAndDeviceNameRef as unknown as CrossTabBroadcastCtx["groupDevicesByDnAndDeviceNameRef"],
        updateSummaryDataRef:
          updateSummaryDataRef as unknown as CrossTabBroadcastCtx["updateSummaryDataRef"],
        setDnsMap,
        setEventLog,
        setCallStateMap,
        setSummaryData,
        setUserAddress,
        setIsInitialized,
        setError,
        saveCallStatesToStorage,
        publishStompMessageRef,
      }),
    [isGlobalInstance, saveCallStatesToStorage],
  );

  // Cross-tab integration: master tab pushes full state to other tabs
  useEffect(() => {
    broadcastCtiStompMasterState({
      crossTabManagerRef,
      dnsMap,
      callStateMap,
      summaryData,
      userAddress,
      eventLog,
    });
  }, [dnsMap, callStateMap, summaryData, userAddress, eventLog]);

  // Cross-tab integration: master tab pushes latest call event in real time
  useEffect(() => {
    broadcastCtiStompMasterLatestEvent({
      crossTabManagerRef,
      dnsMap,
      callStateMap,
      summaryData,
      userAddress,
      eventLog,
    });
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
    return readActiveCallIdsFromLocalStorage();
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

  /** Drop call ids from in-memory map and persisted storage (GetCallLegs verify, end-call sync). */
  const removeCallIdsFromCallStateMap = useCallback(
    (callIds: string[]) => {
      if (!callIds.length) return;
      setCallStateMap((prev) => {
        const next = { ...prev };
        const actuallyRemoved: string[] = [];
        for (const id of callIds) {
          if (Object.hasOwn(next, id)) {
            actuallyRemoved.push(id);
          }
          delete next[id];
        }
        if (actuallyRemoved.length) {
          onCallIdsRemovedFromMapRef.current?.(actuallyRemoved);
        }
        saveCallStatesToStorage(next);
        return next;
      });
    },
    [saveCallStatesToStorage],
  );

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
    removeCallIdsFromCallStateMap, // Prune ended/inactive calls from map + localStorage
    onAllLoaded, // Function that runs when all things are loaded
    getUserTeams, // Get user teams data
    getUserDataExtensions, // Get user data extensions
  };
}
