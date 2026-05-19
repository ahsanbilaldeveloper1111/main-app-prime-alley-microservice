import type { Dispatch, SetStateAction } from "react";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import type { CtiDevice, CtiCallEvent } from "./ctiStompHookTypes";
import { devicesArrayFromCompleteStatePayload } from "./ctiStompHelpers";
import { touchCtiSseLastMessageTime } from "./ctiStompSseLiveness";
import { shouldCloseCtiSseOnCrossTabDemotion } from "./ctiStompCrossTabDemotion";

type DnsMapState = Record<
  string,
  { dn: string; devices: Record<string, CtiDevice> }
>;

type Ref<T> = { current: T };

export type CtiStompDeferredMasterEffectDeps = {
  isGlobalInstance: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  instanceIdRef: Ref<string>;
  crossTabManagerRef: Ref<CrossTabCtiManager>;
  eventSourceRef: Ref<EventSource | null>;
  tokenRef: Ref<string | null>;
  userAddressRef: Ref<string | null>;
  screenIdRef: Ref<string | undefined>;
  isConnectingRef: Ref<boolean>;
  isInitializedRef: Ref<boolean>;
  isGettingTokenRef: Ref<boolean>;
  isReconnectingRef: Ref<boolean>;
  healthCheckIntervalRef: Ref<ReturnType<typeof setInterval> | null>;
  lastMessageTimeRef: Ref<number | null>;
  connectionStartTimeRef: Ref<number | null>;
  reconnectionAttemptsRef: Ref<number>;
  hasRequestedInitialStateRef: Ref<boolean>;
  attemptReconnectionRef: Ref<(() => void) | null>;
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
  handleOngoingCallsRef: Ref<((data: unknown) => void) | null>;
  groupDevicesByDnAndDeviceNameRef: Ref<
    ((deviceArray: CtiDevice[]) => DnsMapState) | null
  >;
  updateSummaryDataRef: Ref<((grouped: DnsMapState) => void) | null>;
};

export function subscribeCtiStompDeferredMasterEffect(
  deps: CtiStompDeferredMasterEffectDeps,
): () => void {
  const {
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
  } = deps;

  if (!isGlobalInstance || !crossTabManagerRef.current.isCrossTabSupported()) {
    return () => {};
  }

  // Only call connect when user is authenticated; avoid 401 from /cti/connect
  if (!isAuthenticated || !authInitialized) {
    return () => {};
  }

  let cancelled = false;
let beganDeferredMasterConnection = false;
let sourceFromSecondaryMasterEffect: EventSource | null = null;

const manager = crossTabManagerRef.current;
const currentInstanceId = instanceIdRef.current;

const delayMs = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const resetDeferredConnectFlags = () => {
  isConnectingRef.current = false;
  isGettingTokenRef.current = false;
};

const deferredEsIsConnectingOrOpen = (es: EventSource) =>
  es.readyState === EventSource.CONNECTING ||
  es.readyState === EventSource.OPEN;

const skipDeferredMasterIfDuplicateConnection = (
  instanceId: string,
): boolean => {
  const es = eventSourceRef.current;
  if (!es || !deferredEsIsConnectingOrOpen(es)) {
    return false;
  }
  console.log(
    `[${instanceId}] Got token but connection already exists (state: ${es.readyState}), skipping...`,
  );
  resetDeferredConnectFlags();
  return true;
};

const closeDeferredMasterEventSourceRef = (reason: string) => {
  if (!eventSourceRef.current) {
    return;
  }
  try {
    eventSourceRef.current.close();
  } catch (err) {
    console.warn(`[useCtiStomp] EventSource.close failed (${reason})`, err);
  }
  eventSourceRef.current = null;
};

const closeDeferredMasterActiveDuplicateBeforeNew = async (
  instanceId: string,
): Promise<void> => {
  const es = eventSourceRef.current;
  if (!es || !deferredEsIsConnectingOrOpen(es)) {
    return;
  }
  console.log(
    `[${instanceId}] ⚠️ EventSource already exists with state ${es.readyState}, closing before creating new one...`,
  );
  try {
    es.close();
  } catch (err) {
    console.warn(
      "[useCtiStomp] EventSource.close failed (master duplicate guard)",
      err,
    );
  }
  eventSourceRef.current = null;
  await delayMs(100);
};

const startDeferredMasterHealthReconnect = (reconnect: () => void) => {
  if (healthCheckIntervalRef.current) {
    clearInterval(healthCheckIntervalRef.current);
    healthCheckIntervalRef.current = null;
  }
  isReconnectingRef.current = true;
  setIsReconnecting(true);
  reconnect();
};

const runDeferredMasterHealthCheckTick = () => {
  const id = instanceIdRef.current;
  const mgr = crossTabManagerRef.current;
  if (isGlobalInstance && mgr.isCrossTabSupported() && !mgr.isMasterTab()) {
    return;
  }
  if (isReconnectingRef.current || isConnectingRef.current) {
    return;
  }
  if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
    console.log(
      `[${id}] ⚠️ Health check: Connection is not OPEN, triggering reconnection...`,
    );
    const reconnectNow = attemptReconnectionRef.current;
    if (reconnectNow) {
      startDeferredMasterHealthReconnect(reconnectNow);
    }
    return;
  }
  const now = Date.now();
  const lastMessageTime =
    lastMessageTimeRef.current || connectionStartTimeRef.current || now;
  const elapsed = now - lastMessageTime;
  if (elapsed <= 300000) {
    return;
  }
  console.log(
    `[${id}] ⚠️ Health check: No CTI event received in ${Math.round(elapsed / 1000)}s (connection is OPEN but no events), triggering reconnection...`,
  );
  const reconnectStale = attemptReconnectionRef.current;
  if (reconnectStale) {
    startDeferredMasterHealthReconnect(reconnectStale);
  }
};

const maybeMasterBroadcastCompleteState = (raw: unknown) => {
  const mgr = crossTabManagerRef.current;
  if (isGlobalInstance && mgr.isMasterTab() && mgr.isCrossTabSupported()) {
    mgr.broadcastCtiEvent({ type: "complete_state", data: raw });
  }
};

const handleDeferredMasterCompleteStateMessage = (rawData: unknown) => {
  const groupFn = groupDevicesByDnAndDeviceNameRef.current;
  const updateFn = updateSummaryDataRef.current;
  if (!groupFn || !updateFn) {
    return;
  }
  const devices = devicesArrayFromCompleteStatePayload(rawData) as CtiDevice[];
  const grouped = groupFn(devices);
  setDnsMap(grouped);
  updateFn(grouped);
  setEventLog((prev) => [
    ...prev,
    {
      type: "initial-state",
      data: grouped,
      timestamp: new Date().toISOString(),
    },
  ]);
  maybeMasterBroadcastCompleteState(rawData);
};

const handleDeferredMasterDnsStatesMessage = (s: {
  dn: string;
  deviceName: string;
  [key: string]: unknown;
}) => {
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
  const mgr = crossTabManagerRef.current;
  if (isGlobalInstance && mgr.isMasterTab() && mgr.isCrossTabSupported()) {
    mgr.broadcastCtiEvent({ type: "dns_states", data: s });
  }
};

const handleDeferredMasterSseParsedMessage = (data: {
  type?: string;
  data?: unknown;
}) => {
  touchCtiSseLastMessageTime(data, lastMessageTimeRef);
  switch (data.type) {
    case "complete_state":
      handleDeferredMasterCompleteStateMessage(data.data);
      break;
    case "dns_states":
      handleDeferredMasterDnsStatesMessage(
        data.data as {
          dn: string;
          deviceName: string;
          [key: string]: unknown;
        },
      );
      break;
    case "call_events": {
      if (handleCallEventRef.current) {
        handleCallEventRef.current(data.data as CtiCallEvent);
      }
      const evt = data.data as { eventType?: string } | undefined;
      if (evt?.eventType === "DROPPED" || evt?.eventType === "DISCONNECTED") {
        scheduleRefreshAfterCallEndRef.current?.();
      }
      break;
    }
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
      handleOngoingCallsRef.current?.(data.data);
      break;
    default:
      break;
  }
};

const closeDeferredMasterIfDemoted = (
  instanceId: string,
  mgr: CrossTabCtiManager,
): boolean => {
  if (!shouldCloseCtiSseOnCrossTabDemotion(isGlobalInstance, mgr)) {
    return false;
  }
  console.log(
    `[${instanceId}] ⚠️ Follower tab with active remote master, closing local SSE...`,
  );
  if (eventSourceRef.current) {
    try {
      eventSourceRef.current.close();
    } catch (err) {
      console.warn(
        "[useCtiStomp] EventSource.close failed (master, not master)",
        err,
      );
    }
    eventSourceRef.current = null;
  }
  setIsInitialized(true);
  setError(null);
  return true;
};

const handleDeferredMasterEventSourceClosed = (instanceId: string) => {
  console.log(`[${instanceId}] ⚠️ SSE connection closed`);
  setIsInitialized(false);
  if (isReconnectingRef.current || !attemptReconnectionRef.current) {
    return;
  }
  isReconnectingRef.current = true;
  setIsReconnecting(true);
  console.log(
    `[${instanceId}] 🔄 Connection closed, starting reconnection with retry logic...`,
  );
  attemptReconnectionRef.current();
};

const attachDeferredMasterEventSourceOnError = (es: EventSource) => {
  es.onerror = () => {
    const instanceIdLocal = instanceIdRef.current;
    const mgr = crossTabManagerRef.current;
    if (closeDeferredMasterIfDemoted(instanceIdLocal, mgr)) {
      return;
    }
    const readyState = es.readyState;
    if (readyState === EventSource.CLOSED) {
      handleDeferredMasterEventSourceClosed(instanceIdLocal);
      return;
    }
    if (readyState === EventSource.CONNECTING) {
      console.log(`[${instanceIdLocal}] 🔄 Connection state: CONNECTING`);
      return;
    }
    if (readyState === EventSource.OPEN) {
      console.log(
        `[${instanceIdLocal}] ⚠️ Temporary error on open connection`,
      );
    }
  };
};

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
  return () => {
    cancelled = true;
  };
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
  beganDeferredMasterConnection = true;
  // Set connecting flag BEFORE any async operations
  isConnectingRef.current = true;

  console.log(
    `[${currentInstanceId}] Master tab detected (after initial mount), initializing connection...`
  );

  // Use the shared getBearerToken function
  getBearerToken()
    .then(async (token) => {
      if (cancelled) {
        resetDeferredConnectFlags();
        return;
      }
      if (!token) {
        resetDeferredConnectFlags();
        setError("Service unavailable");
        return;
      }

      closeDeferredMasterEventSourceRef("master pre-connect");
      await delayMs(500);

      if (cancelled) {
        resetDeferredConnectFlags();
        return;
      }

      if (!manager.isMasterTab()) {
        resetDeferredConnectFlags();
        return;
      }

      if (skipDeferredMasterIfDuplicateConnection(currentInstanceId)) {
        return;
      }

      if (cancelled) {
        resetDeferredConnectFlags();
        return;
      }

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
      const sseUrl = `/streaming/cti-stomp-stream?${params.toString()}`;

      await closeDeferredMasterActiveDuplicateBeforeNew(currentInstanceId);

      if (cancelled) {
        resetDeferredConnectFlags();
        return;
      }

      console.log(
        `[${currentInstanceId}] Creating SSE connection as master...`,
      );
      const eventSource = new EventSource(sseUrl);

      if (cancelled) {
        try {
          eventSource.close();
        } catch (err) {
          console.warn(
            "[useCtiStomp] EventSource.close failed (deferred master cancelled)",
            err,
          );
        }
        resetDeferredConnectFlags();
        return;
      }

      sourceFromSecondaryMasterEffect = eventSource;
      eventSourceRef.current = eventSource;
      eventSource.onopen = () => {
        if (cancelled) {
          try {
            eventSource.close();
          } catch (closeErr) {
            console.warn(
              "[useCtiStomp] EventSource.close failed (deferred master onopen cancel)",
              closeErr,
            );
          }
          isConnectingRef.current = false;
          return;
        }
        isConnectingRef.current = false;
        isInitializedRef.current = true;
        setIsInitialized(true);
        setError(null);
        isReconnectingRef.current = false;
        setIsReconnecting(false);
        reconnectionAttemptsRef.current = 0;
        lastMessageTimeRef.current = Date.now();
        connectionStartTimeRef.current = Date.now();

        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
          healthCheckIntervalRef.current = null;
        }

        healthCheckIntervalRef.current = setInterval(
          runDeferredMasterHealthCheckTick,
          30000,
        );
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type?: string;
            data?: unknown;
          };
          handleDeferredMasterSseParsedMessage(data);
        } catch (error) {
          console.warn(
            "[useCtiStomp] Master SSE message parse/handle failed",
            error,
          );
        }
      };

      attachDeferredMasterEventSourceOnError(eventSource);
    })
    .catch((error) => {
      if (cancelled) {
        return;
      }
      console.error(`[${currentInstanceId}] Error getting token:`, error);
      resetDeferredConnectFlags();
      console.error(`[${currentInstanceId}] ❌ Failed to get token`);
    });
}

return () => {
  cancelled = true;
  if (
    sourceFromSecondaryMasterEffect &&
    eventSourceRef.current === sourceFromSecondaryMasterEffect
  ) {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    try {
      sourceFromSecondaryMasterEffect.close();
    } catch (err) {
      console.warn(
        "[useCtiStomp] EventSource.close failed (deferred master effect cleanup)",
        err,
      );
    }
    eventSourceRef.current = null;
  } else if (beganDeferredMasterConnection && !sourceFromSecondaryMasterEffect) {
    isConnectingRef.current = false;
    isGettingTokenRef.current = false;
  }
  };
}
