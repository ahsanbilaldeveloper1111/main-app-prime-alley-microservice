import type { Dispatch, SetStateAction } from "react";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import type { CtiDevice, CtiCallEvent } from "./ctiStompHookTypes";

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
  return;
}

// Only call connect when user is authenticated; avoid 401 from /cti/connect
if (!isAuthenticated || !authInitialized) {
  return;
}

let cancelled = false;
let beganDeferredMasterConnection = false;
let sourceFromSecondaryMasterEffect: EventSource | null = null;

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
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return;
      }
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

      if (cancelled) {
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return;
      }

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

      if (cancelled) {
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return;
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

      if (cancelled) {
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return;
      }

      console.log(`[${currentInstanceId}] Creating SSE connection as master...`);
      const eventSource = new EventSource(sseUrl);

      if (cancelled) {
        try {
          eventSource.close();
        } catch (err) {
          console.warn("[useCtiStomp] EventSource.close failed (deferred master cancelled)", err);
        }
        isConnectingRef.current = false;
        isGettingTokenRef.current = false;
        return;
      }

      sourceFromSecondaryMasterEffect = eventSource;

      // CRITICAL: Immediately store the EventSource to prevent duplicate creation
      // This must happen synchronously before any other code can run
      eventSourceRef.current = eventSource;
      eventSource.onopen = () => {
        if (cancelled) {
          try {
            eventSource.close();
          } catch (closeErr) {
            console.warn("[useCtiStomp] EventSource.close failed (deferred master onopen cancel)", closeErr);
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
      if (cancelled) {
        return;
      }
      console.error(`[${currentInstanceId}] Error getting token:`, error);
      isConnectingRef.current = false;
      isGettingTokenRef.current = false;
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
