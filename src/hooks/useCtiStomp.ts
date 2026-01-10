import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@utils/axios";
import { getCrossTabCtiManager } from "../utils/crossTabCtiManager";
import { useAuth } from "./useAuth";
import { useRouter } from "next/router";
import { getGlobalExcludedPaths } from "@utils/Helper";

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

  const globalExcludedPaths = getGlobalExcludedPaths();

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
  
  // Store attemptReconnection function in a ref so it can be accessed from multiple useEffects
  const attemptReconnectionRef = useRef<((maxAttempts?: number) => Promise<void>) | null>(null);

  // Store latest callback functions in refs to avoid stale closures
  // These will be initialized after the functions are defined
  const handleCallEventRef = useRef<typeof handleCallEvent | null>(null);
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
        const parsedCallStates = JSON.parse(storedCallStates);

        // Filter only active calls (not terminated) and normalize currentState
        const activeCallStates = Object.entries(parsedCallStates).reduce(
          (acc, [callId, callEvent]) => {
            const event = callEvent as CtiCallEvent;
            if (
              !event.isTerminating &&
              event.parties &&
              event.parties.length > 0
            ) {
              // Check if any party is still active (not DROPPED/DISCONNECTED)
              const activeParties = event.parties.filter(
                (p: any) =>
                  p.callStatus &&
                  p.callStatus !== "DROPPED" &&
                  p.callStatus !== "DISCONNECTED" &&
                  [
                    "CONNECTED",
                    "RETRIEVED",
                    "ON_HOLD",
                    "RINGING",
                    "ANSWERED",
                  ].includes(p.callStatus)
              );

              if (activeParties.length > 0) {
                // Normalize currentState if it's DROPPED but there are active parties
                let normalizedState = event.currentState;
                if (
                  event.currentState === "DROPPED" &&
                  activeParties.length > 0
                ) {
                  // Determine state from active parties
                  const connectedParty = activeParties.find(
                    (p: any) => p.callStatus === "CONNECTED"
                  );
                  const heldParty = activeParties.find(
                    (p: any) => p.callStatus === "ON_HOLD"
                  );
                  const retrievedParty = activeParties.find(
                    (p: any) => p.callStatus === "RETRIEVED"
                  );

                  if (heldParty) {
                    normalizedState = "HELD";
                  } else if (retrievedParty) {
                    normalizedState = "RETRIEVED";
                  } else if (connectedParty) {
                    normalizedState = "ANSWERED"; // Default for CONNECTED
                  } else {
                    normalizedState = "ANSWERED"; // Fallback
                  }
                }

                // Create normalized event with only active parties (remove DROPPED/DISCONNECTED)
                acc[callId] = {
                  ...event,
                  currentState: normalizedState,
                  parties: activeParties, // Remove DROPPED/DISCONNECTED parties immediately
                  hasActiveParticipants: activeParties.length > 0,
                };
              }
            }
            return acc;
          },
          {} as Record<string, CtiCallEvent>
        );

        if (Object.keys(activeCallStates).length > 0) {
          setCallStateMap(activeCallStates);
        }
      }
    } catch (error) {
      // Clear corrupted data
      localStorage.removeItem(CALL_STATES_STORAGE_KEY);
      localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
    }
  }, []);

  // Save call states to localStorage
  const saveCallStatesToStorage = useCallback(
    (callStates: Record<string, CtiCallEvent>) => {
      try {
        // Only save calls that are CONNECTED or RETRIEVED (not incoming/ringing)
        const callsToPersist = Object.entries(callStates).reduce(
          (acc, [callId, callEvent]) => {
            if (
              !callEvent.isTerminating &&
              callEvent.parties &&
              callEvent.parties.length > 0
            ) {
              // Check if there are active parties (not DROPPED/DISCONNECTED)
              const activeParties = callEvent.parties.filter(
                (p: any) =>
                  p.callStatus &&
                  p.callStatus !== "DROPPED" &&
                  p.callStatus !== "DISCONNECTED" &&
                  ["CONNECTED", "RETRIEVED", "ON_HOLD"].includes(p.callStatus)
              );

              // Check if this is a CONNECTED or RETRIEVED call (established calls only)
              const isConnectedOrRetrieved = activeParties.some((p: any) => {
                const status = p.callStatus;
                return status && ["CONNECTED", "RETRIEVED"].includes(status);
              });

              if (isConnectedOrRetrieved && activeParties.length > 0) {
                // Normalize currentState if it's DROPPED but there are active parties
                let normalizedState = callEvent.currentState;
                if (
                  callEvent.currentState === "DROPPED" &&
                  activeParties.length > 0
                ) {
                  const connectedParty = activeParties.find(
                    (p: any) => p.callStatus === "CONNECTED"
                  );
                  const heldParty = activeParties.find(
                    (p: any) => p.callStatus === "ON_HOLD"
                  );
                  const retrievedParty = activeParties.find(
                    (p: any) => p.callStatus === "RETRIEVED"
                  );

                  if (heldParty) {
                    normalizedState = "HELD";
                  } else if (retrievedParty) {
                    normalizedState = "RETRIEVED";
                  } else if (connectedParty) {
                    normalizedState = "ANSWERED";
                  } else {
                    normalizedState = "ANSWERED";
                  }
                }

                acc[callId] = {
                  ...callEvent,
                  currentState: normalizedState,
                  hasActiveParticipants: true,
                };
              }
            }
            return acc;
          },
          {} as Record<string, CtiCallEvent>
        );

        if (Object.keys(callsToPersist).length > 0) {
          localStorage.setItem(
            CALL_STATES_STORAGE_KEY,
            JSON.stringify(callsToPersist)
          );
          localStorage.setItem(
            CALL_STATES_TIMESTAMP_KEY,
            new Date().toISOString()
          );
        } else {
          // If no active calls, clear storage
          localStorage.removeItem(CALL_STATES_STORAGE_KEY);
          localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        }
      } catch (error) {}
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

      // Handle terminating events - remove call immediately
      // This includes DISCONNECTED events with isTerminating: true or all parties DROPPED
      if (evt.isTerminating) {
        setCallStateMap((prev) => {
          const { [callId]: _, ...rest } = prev;
          const updated = { ...rest };
          // Save updated state after removing terminated call
          saveCallStatesToStorage(updated);
          return updated;
        });

        // Still add terminating events to eventLog so dialer can process them
        setEventLog((prev) => {
          const log = [...prev, evt];
          if (log.length > 200) log.shift();
          return log;
        });
        return;
      }

      // Also handle DISCONNECTED events even if isTerminating is not explicitly set
      // Check if all parties are DROPPED before processing
      if (evt.eventType === "DISCONNECTED" && evt.parties) {
        const allPartiesDroppedEarly =
          evt.parties.length > 0 &&
          evt.parties.every(
            (p: any) =>
              p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED"
          );

        if (allPartiesDroppedEarly || evt.hasActiveParticipants === false) {
          setCallStateMap((prev) => {
            const { [callId]: _, ...rest } = prev;
            const updated = { ...rest };
            saveCallStatesToStorage(updated);
            return updated;
          });

          setEventLog((prev) => {
            const log = [...prev, evt];
            if (log.length > 200) log.shift();
            return log;
          });
          return;
        }
      }

      setEventLog((prev) => {
        const log = [...prev, evt];
        if (log.length > 200) log.shift();
        return log;
      });

      setCallStateMap((prev) => {
        const updated = { ...prev };
        const base = updated[callId] || {};

        // IMPORTANT: Always use new parties if provided in event, otherwise fall back to base parties
        // This ensures that when parties are removed (e.g., barge-in stopped), we use the updated parties
        const partiesToProcess =
          evt.parties !== undefined && evt.parties !== null
            ? evt.parties
            : base.parties || [];

        // Process parties to ensure callingDeviceType is included
        const processedParties = partiesToProcess.map((party: any) => {
          // First try to get device info from stored caller info
          let storedCallerInfo = null;
          try {
            const stored = localStorage.getItem("cti_caller_info");
            if (stored) {
              storedCallerInfo = JSON.parse(stored);
            }
          } catch (error) {
            // Ignore error
          }

          // If we have stored caller info and it matches this party, use it
          if (
            storedCallerInfo &&
            storedCallerInfo.callingAddress === party.callingAddress &&
            storedCallerInfo.callingDeviceName === party.callingDeviceName
          ) {
            party.callingDeviceType = storedCallerInfo.callingDeviceType;
          }
          // If callingDeviceType is still missing, try to get it from the dnsMap
          else if (
            !party.callingDeviceType &&
            party.callingAddress &&
            party.callingDeviceName
          ) {
            const userDevices = dnsMap[party.callingAddress]?.devices;
            if (userDevices) {
              const device = Object.values(userDevices).find(
                (d: any) => d.deviceName === party.callingDeviceName
              );
              if (device) {
                party.callingDeviceType = device.deviceType;
              }
            }
          }
          // Fallback: If still no device type, try to infer from device name
          if (!party.callingDeviceType && party.callingDeviceName) {
            let inferredType = "SOFT_HARD";
            const deviceName = party.callingDeviceName.toLowerCase();

            if (
              deviceName.includes("android") ||
              deviceName.includes("mobile")
            ) {
              inferredType = "MOBILE";
            } else if (
              deviceName.includes("soft") ||
              deviceName.includes("csf") ||
              deviceName.includes("web")
            ) {
              inferredType = "SOFT_HARD";
            } else if (
              deviceName.includes("phone") ||
              deviceName.includes("ip")
            ) {
              inferredType = "SOFT_HARD";
            } else if (
              deviceName.includes("hard") ||
              deviceName.includes("desk")
            ) {
              inferredType = "SOFT_HARD";
            }

            party.callingDeviceType = inferredType;
          }

          return party;
        });

        // IMPORTANT: Remove DROPPED and DISCONNECTED parties from the parties array immediately
        // This ensures they are not stored in call state and won't appear in UI
        const activePartiesOnly = processedParties.filter(
          (p: any) =>
            p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED"
        );

        // Check if all parties are DROPPED - if so, mark call as terminating
        const allPartiesDropped =
          processedParties.length > 0 &&
          processedParties.every(
            (p: any) =>
              p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED"
          );

        // Check if there are any active (non-DROPPED) parties
        const hasActiveParties = activePartiesOnly.length > 0;

        // Terminate if:
        // 1. Explicitly marked as terminating (DISCONNECTED events with isTerminating: true)
        // 2. All parties dropped/disconnected
        // 3. No active participants flag and we have parties
        // 4. Event type is DISCONNECTED and no active parties (aggressive cleanup)
        // 5. No active parties remain after filtering
        const shouldTerminate =
          evt.isTerminating ||
          allPartiesDropped ||
          (evt.hasActiveParticipants === false &&
            processedParties.length > 0) ||
          (!hasActiveParties && processedParties.length > 0) ||
          (evt.eventType === "DISCONNECTED" && !hasActiveParties);

        // Determine the current state based on active parties, not the event type
        // If event is DROPPED but there are still active parties, use the state from active parties
        let effectiveCurrentState = evt.eventType;
        if (evt.eventType === "DROPPED" && hasActiveParties) {
          // Find the state from active parties (now already filtered)
          const activeParty = activePartiesOnly[0];
          if (activeParty) {
            // Map call status to event type
            if (activeParty.callStatus === "CONNECTED") {
              effectiveCurrentState = base.currentState || "ANSWERED"; // Keep previous state or use ANSWERED
            } else if (activeParty.callStatus === "ON_HOLD") {
              effectiveCurrentState = "HELD";
            } else if (activeParty.callStatus === "RETRIEVED") {
              effectiveCurrentState = "RETRIEVED";
            } else {
              effectiveCurrentState = base.currentState || "ANSWERED"; // Keep previous state
            }
          } else {
            effectiveCurrentState = base.currentState || evt.eventType; // Fallback to previous state
          }
        }

        // Store only active parties (DROPPED parties are removed immediately)
        updated[callId] = {
          ...base,
          callId,
          currentState: effectiveCurrentState,
          sequence: evt.sequence,
          eventTime: evt.eventTime,
          isConference: evt.isConference,
          isOneToOne: evt.isOneToOne,
          parties: activePartiesOnly, // Only store active parties - DROPPED parties are removed
          isTerminating: shouldTerminate,
          hasActiveParticipants:
            evt.hasActiveParticipants !== undefined
              ? evt.hasActiveParticipants
              : hasActiveParties,
          eventName: evt.eventName,
        };

        // If all parties are dropped or call is terminating, remove the call state
        if (shouldTerminate) {
          const { [callId]: _, ...rest } = updated;
          const cleaned = rest;
          // Save cleaned state to localStorage
          saveCallStatesToStorage(cleaned);
          return cleaned;
        }

        // Cleanup: After processing a DROPPED event for a specific party pair, check if the same party pair
        // exists in other calls with older event times - if so, mark those as stale
        if (evt.eventType === "DROPPED" && activePartiesOnly.length > 0) {
          // Find all dropped party pairs from this event
          const droppedPartyPairs = processedParties
            .filter(
              (p: any) =>
                p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED"
            )
            .map((p: any) => ({
              calling: p.callingAddress,
              called: p.calledAddress,
              callingDevice: p.callingDeviceName,
              calledDevice: p.calledDeviceName,
            }));

          // For each dropped party pair, check if it exists in other calls with older event times
          droppedPartyPairs.forEach((droppedPair: any) => {
            Object.keys(updated).forEach((otherCallId) => {
              if (otherCallId === callId) return; // Skip the current call

              const otherCall = updated[otherCallId];
              if (!otherCall || otherCall.isTerminating) return;

              // Check if this call has the same party pair (matching by addresses)
              // Match by addresses - if device names are available and match, that's a bonus but not required
              const matchingParty = otherCall.parties?.find((p: any) => {
                const matchesAddresses =
                  (p.callingAddress === droppedPair.calling &&
                    p.calledAddress === droppedPair.called) ||
                  (p.callingAddress === droppedPair.called &&
                    p.calledAddress === droppedPair.calling);

                return matchesAddresses;
              });

              // If we found a matching party and this call's event time is older, mark it as DROPPED
              if (
                matchingParty &&
                matchingParty.callStatus !== "DROPPED" &&
                matchingParty.callStatus !== "DISCONNECTED"
              ) {
                const otherCallTime = new Date(
                  otherCall.eventTime || 0
                ).getTime();
                const currentEventTime = new Date(evt.eventTime).getTime();

                // If this call is older than the DROPPED event, mark the matching party as DROPPED
                if (otherCallTime < currentEventTime) {
                  const updatedParties = otherCall.parties.map((p: any) => {
                    const isMatchingParty =
                      (p.callingAddress === droppedPair.calling &&
                        p.calledAddress === droppedPair.called) ||
                      (p.callingAddress === droppedPair.called &&
                        p.calledAddress === droppedPair.calling);

                    if (isMatchingParty) {
                      return { ...p, callStatus: "DROPPED" };
                    }
                    return p;
                  });

                  // Filter out DROPPED parties
                  const activeParties = updatedParties.filter(
                    (p: any) =>
                      p.callStatus !== "DROPPED" &&
                      p.callStatus !== "DISCONNECTED"
                  );

                  // If no active parties remain, mark call as terminating
                  if (activeParties.length === 0) {
                    updated[otherCallId] = {
                      ...otherCall,
                      isTerminating: true,
                    };
                  } else {
                    // Update the call with filtered parties
                    updated[otherCallId] = {
                      ...otherCall,
                      parties: activeParties,
                    };
                  }
                }
              }
            });
          });
        }

        // Save updated state to localStorage
        saveCallStatesToStorage(updated);
        return updated;
      });
    },
    [saveCallStatesToStorage, dnsMap] // Include dnsMap so non-master tabs have access to latest device info
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

  // Helper function to publish STOMP messages via API
  const publishStompMessage = useCallback(
    async (destination: string, body: string = "") => {
      if (!tokenRef.current || !userAddressRef.current) {
        return false;
      }

      try {
        // Note: axiosInstance has baseURL: '/api', so we use '/cti-stomp-stream' not '/api/cti-stomp-stream'
        const response = await axiosInstance.post("/cti-stomp-stream", {
          token: tokenRef.current,
          userAddress: userAddressRef.current,
          destination,
          body,
          screenId: screenIdRef.current || "default", // Include screenId in POST request
        });

        return response.data.success === true;
      } catch (error) {
        return false;
      }
    },
    []
  );

  // Update refs when callbacks change (after all functions are defined)
  useEffect(() => {
    handleCallEventRef.current = handleCallEvent;
    groupDevicesByDnAndDeviceNameRef.current = groupDevicesByDnAndDeviceName;
    updateSummaryDataRef.current = updateSummaryData;
    publishStompMessageRef.current = publishStompMessage;
  }, [
    handleCallEvent,
    groupDevicesByDnAndDeviceName,
    updateSummaryData,
    publishStompMessage,
  ]);


  // Shared getBearerToken function - defined outside useEffect so it can be reused
  // Uses isGettingTokenRef to prevent duplicate calls
  const getBearerToken = useCallback(async (): Promise<{
    token: string;
    userAddress: string;
  } | null> => {
    // ATOMIC CHECK: If already getting token, wait for it to complete
    if (isGettingTokenRef.current) {
      console.log(`[${instanceIdRef.current}] Token request already in progress, waiting for completion...`);
      // Wait with retries until token is available or timeout (max 10 seconds)
      const maxWaitTime = 10000; // 10 seconds
      const checkInterval = 100; // Check every 100ms
      const startTime = Date.now();
      
      while (isGettingTokenRef.current && (Date.now() - startTime) < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        // If token became available, return it
        if (tokenRef.current && userAddressRef.current) {
          console.log(`[${instanceIdRef.current}] Token became available from concurrent request`);
          return { token: tokenRef.current, userAddress: userAddressRef.current };
        }
      }
      
      // If we exited the loop but flag is still set, something went wrong
      if (isGettingTokenRef.current) {
        console.error(`[${instanceIdRef.current}] Token request timed out after ${maxWaitTime}ms`);
        return null;
      }
      
      // If flag was cleared but no token, check one more time
      if (tokenRef.current && userAddressRef.current) {
        return { token: tokenRef.current, userAddress: userAddressRef.current };
      }
      
      // No token available
      console.log(`[${instanceIdRef.current}] No token available after waiting`);
      return null;
    }

    // Set flag IMMEDIATELY before async operation
    isGettingTokenRef.current = true;

    try {
      if(typeof window !== 'undefined' && globalExcludedPaths.some(path => window.location.pathname?.includes(path)) && !isAuthenticated) {
        throw new Error("User not authenticated");
      }
      const response = await axiosInstance.get("/cti/connect", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = response.data;
        const token = data.token || data.accessToken || data.bearerToken;
        const userAddress = data.userAddress || data.user_address;

        const userTeams = data?.teams;
        const userDataExtensions = data?.extensions;

        if (token && userAddress) {
          // Store token, userAddress, userTeams, and userDataExtensions in refs
          tokenRef.current = token;
          userAddressRef.current = userAddress;
          userTeamsRef.current = userTeams;
          userDataExtensionsRef.current = userDataExtensions;
          isGettingTokenRef.current = false;
          return { token, userAddress };
        } else {
          isGettingTokenRef.current = false;
          return null;
        }
      } else {
        isGettingTokenRef.current = false;
        return null;
      }
    } catch (error) {
      isGettingTokenRef.current = false;
      return null;
    }
  }, []);

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
        const currentInstanceId = instanceIdRef.current;
        
        // Close EventSource connection
        if (eventSourceRef.current) {
          try {
            eventSourceRef.current.close();
          } catch (err) {
            // Ignore errors during close
          }
          eventSourceRef.current = null;
        }

        // Clear STOMP client reference if it exists
        if (clientRef.current) {
          try {
            if (clientRef.current.connected) {
              clientRef.current.deactivate();
            }
          } catch (err) {
            // Ignore errors during deactivation
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
      fullyCloseConnection().catch(() => {
        // Ignore errors during cleanup
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
      if (
        isInitializedRef.current &&
        eventSourceRef.current &&
        (eventSourceRef.current.readyState === EventSource.OPEN || 
         eventSourceRef.current.readyState === EventSource.CONNECTING)
      ) {
        console.log(
          `[${instanceIdRef.current}] useEffect triggered but already initialized with active/connecting connection, skipping...`
        );
        return;
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

      // Close EventSource connection
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (err) {
          // Ignore errors during close
        }
        eventSourceRef.current = null;
      }

      // Clear STOMP client reference if it exists
      if (clientRef.current) {
        try {
          if (clientRef.current.connected) {
            clientRef.current.deactivate();
          }
        } catch (err) {
          // Ignore errors during deactivation
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

      // Only reset reconnecting flag if not preserving it
      if (!preserveReconnecting) {
        isReconnectingRef.current = false;
      } else {
        // Restore the reconnecting flag if we're preserving it
        isReconnectingRef.current = wasReconnecting;
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
        reconnectionAttemptsRef.current = 0;
        setError(`Failed to reconnect after ${maxAttempts} attempts. Please refresh the page.`);
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
            // Ignore errors
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

          // Check if connection exists and is open
          if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
            console.log(`[${currentInstanceId}] ⚠️ Health check: Connection is not OPEN, triggering reconnection...`);
            if (!isReconnectingRef.current) {
              isReconnectingRef.current = true;
              attemptReconnection();
            }
            return;
          }

          // Check if we've received a message recently (within last 2 minutes)
          const now = Date.now();
          const lastMessageTime = lastMessageTimeRef.current || connectionStartTimeRef.current || now;
          const timeSinceLastMessage = now - lastMessageTime;

          // If no message received in 2 minutes, connection might be dead
          if (timeSinceLastMessage > 120000) {
            console.log(
              `[${currentInstanceId}] ⚠️ Health check: No message received in ${Math.round(timeSinceLastMessage / 1000)}s, triggering reconnection...`
            );
            if (!isReconnectingRef.current) {
              isReconnectingRef.current = true;
              attemptReconnection();
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
            setError("Failed to get fresh token for reconnection");
          }
        }, 9000000); // 2.5hour
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
              try {
                if (
                  groupDevicesByDnAndDeviceNameRef.current &&
                  updateSummaryDataRef.current
                ) {
                  console.log("complete_state", data.data);
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
                  if (isGlobalInstance && crossTabManagerRef.current.isMasterTab() && crossTabManagerRef.current.isCrossTabSupported()) {
                    crossTabManagerRef.current.broadcastCtiEvent({
                      type: 'complete_state',
                      data: data.data
                    });
                  }
                }
              } catch (err) {
                setError("Failed to process initial state");
              }
              break;

            case "dns_states":
              try {
                const s = data.data;
                setDnsMap((prev) => {
                  const updated = { ...prev };
                  const { dn, deviceName } = s;
                  if (!updated[dn]) {
                    updated[dn] = { dn, devices: {} };
                  }
                  updated[dn].devices[deviceName] = s;
                  if (updateSummaryDataRef.current) {
                    updateSummaryDataRef.current(updated);
                  }
                  return updated;
                });
              } catch (err) {
                setError("Failed to process update");
              }
              break;

            case "call_events":
              try {
                if (handleCallEventRef.current) {
                  handleCallEventRef.current(data.data);
                }
              } catch (err) {
                setError("Failed to process call event");
              }
              break;

            case "stomp_connected":
              setIsInitialized(true);
              setError(null);
              // Request initial state after connection
              if (publishStompMessageRef.current) {
                publishStompMessageRef.current(
                  "/app/request/initial-state",
                  ""
                );
              }
              break;

            case "stomp_error":
              setError("STOMP error: " + (data.message || "unknown"));
              setIsInitialized(false);
              break;

            case "connection":
              console.log(
                `[${instanceIdRef.current}] 📨 Received connection message:`,
                data
              );
              if (data.status === "disconnected") {
                // Only set initialized to false if we're not preserving state
                // This allows UI to keep showing existing data during reconnection
                if (!data.preserveState) {
                  setIsInitialized(false);
                }
              } else if (data.status === "reconnecting") {
                console.log(
                  `[${instanceIdRef.current}] 🔄 Received reconnecting status from server`
                );
                // During reconnection, use retry logic with exponential backoff
                if (!isReconnectingRef.current) {
                  const currentInstanceId = instanceIdRef.current;
                  isReconnectingRef.current = true;
                  console.log(
                    `[${currentInstanceId}] 🔄 Server reconnecting, starting reconnection with retry logic...`
                  );
                  attemptReconnection();
                } else {
                  console.log(
                    `[${instanceIdRef.current}] ⚠️ Reconnection already in progress, ignoring duplicate message`
                  );
                }
              }
              break;

            case "error":
              setError(data.message || "Connection error");
              setIsInitialized(false);
              break;

            case "ping":
              // Ignore ping messages (don't update health check timer)
              break;

            case "test":
              // Ignore test messages (don't update health check timer)
              break;

            default:
              break;
          }
        } catch (error) {
          // Ignore parsing errors
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
                // Ignore errors
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
          setError("SSE connection closed");

          // Reconnect with retry logic and exponential backoff
          if (!isReconnectingRef.current) {
            isReconnectingRef.current = true;
            console.log(
              `[${currentInstanceId}] 🔄 Connection closed, starting reconnection with retry logic...`
            );
            attemptReconnection();
          }
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
        reconnectionAttemptsRef.current = 0;
        lastMessageTimeRef.current = null;
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
        eventSourceRef.current &&
        eventSourceRef.current.readyState === EventSource.OPEN
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

      // For global instance with cross-tab support, check if we should be the master
      if (isGlobalInstance && manager.isCrossTabSupported()) {
        // Master election happens synchronously in constructor, but check immediately
        // If not master yet, the useEffect will handle initialization when we become master
        const isMaster = manager.isMasterTab();
        
        if (!isMaster) {
          console.log(
            `[${currentInstanceId}] Not master tab, waiting for state from master tab...`
          );
          
          // If on live-calls page, demand first subscription data
          const isLiveCallsPage = router.pathname?.includes('live-calls') || 
                                  (typeof globalThis !== 'undefined' && globalThis.window?.location.pathname?.includes('live-calls'));
          
          if (isLiveCallsPage && manager.isCrossTabSupported()) {
            // Request initial state from master tab via cross-tab manager
            manager.requestAction('requestInitialState', {}).catch((error) => {
              console.log(`[${currentInstanceId}] Failed to request initial state from master:`, error);
            });
            console.log(`[${currentInstanceId}] Requested initial state for live-calls page from master tab`);
          }
          
          // Reset connecting flag since we're not initializing
          isConnectingRef.current = false;
          isGettingTokenRef.current = false; // Reset token flag
          // Don't create connection - we'll receive state from master tab
          // Set initialized to true immediately so features work (they'll forward to master)
          // The actual state will be synced when we receive it from master
          setIsInitialized(true);
          setError(null);
          return null;
        }
        
        console.log(
          `[${currentInstanceId}] This tab is master, initializing connection...`
        );
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
    
    if (
      isGlobalInstance &&
      isInitializedRef.current &&
      eventSourceRef.current &&
      eventSourceRef.current.readyState === EventSource.OPEN
    ) {
      console.log(
        `[${instanceIdRef.current}] Already initialized with active connection, skipping initialization...`
      );
    } else {
      initialize().then((cleanupFn) => {
        cleanup = cleanupFn;
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
    // isGlobalInstance is checked inside the effect, so we don't need it as a dependency
  }, [isAuthenticated, authInitialized]);

  // Helper: Get devices array for a DN
  const getDevicesForDn = useCallback(
    (dn: string) => {
      console.log("ZEZEZ getDevicesForDn", dn, dnsMap);
      const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
      return devices;
    },
    [dnsMap]
  );

  // Helper: Get calls involving a DN (any device)
  // IMPORTANT: Only return calls where the DN has at least one active (non-DROPPED) party
  const getCallStatesForDn = useCallback(
    (dn: string) => {
      return Object.values(callStateMap).filter((call) => {
        // Skip terminating calls
        if (call.isTerminating) return false;

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

      const mostRecent = activeCalls.reduce((a, b) =>
        new Date(b.eventTime) > new Date(a.eventTime) ? b : a
      );

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
      const mostRecent = filtered.reduce((a, b) =>
        new Date(b.eventTime) > new Date(a.eventTime) ? b : a
      );

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
      // Ignore error
    }
  }, []);

  // Synchronize persisted call states with server state
  const syncPersistedCallStates = useCallback(() => {
    try {
      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (!storedCallStates) return;

      const parsedCallStates = JSON.parse(storedCallStates);

      // Request call state updates for persisted calls
      if (clientRef.current && clientRef.current.connected) {
        Object.keys(parsedCallStates).forEach((callId) => {
          clientRef.current?.publish({
            destination: "/app/request/call-state",
            body: JSON.stringify({ callId }),
          });
        });
      }
    } catch (error) {
      // Ignore error
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
          // Ignore errors
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
              // Ignore errors
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
                // Ignore errors
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
           // console.log(`[${currentInstanceId}] ✅ Master tab connection opened`);
            isConnectingRef.current = false;
            isInitializedRef.current = true;
            setIsInitialized(true);
            setError(null);
            isReconnectingRef.current = false;
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

              // Check if connection exists and is open
              if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
                console.log(`[${currentInstanceId}] ⚠️ Health check: Connection is not OPEN, triggering reconnection...`);
                if (!isReconnectingRef.current && attemptReconnectionRef.current) {
                  isReconnectingRef.current = true;
                  attemptReconnectionRef.current();
                }
                return;
              }

              // Check if we've received a message recently (within last 2 minutes)
              const now = Date.now();
              const lastMessageTime = lastMessageTimeRef.current || connectionStartTimeRef.current || now;
              const timeSinceLastMessage = now - lastMessageTime;

              // If no message received in 2 minutes, connection might be dead
              if (timeSinceLastMessage > 120000) {
                console.log(
                  `[${currentInstanceId}] ⚠️ Health check: No message received in ${Math.round(timeSinceLastMessage / 1000)}s, triggering reconnection...`
                );
                if (!isReconnectingRef.current && attemptReconnectionRef.current) {
                  isReconnectingRef.current = true;
                  attemptReconnectionRef.current();
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
                    //console.log("complete_state 2", data.data);
                    const grouped = groupDevicesByDnAndDeviceNameRef.current(
                      data.data
                    );
                    setDnsMap(grouped);
                    updateSummaryDataRef.current(grouped);
                    
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

                case "dns_states":
                  const s = data.data;
                  setDnsMap((prev) => {
                    const updated = { ...prev };
                    const { dn, deviceName } = s;
                    if (!updated[dn]) {
                      updated[dn] = { dn, devices: {} };
                    }
                    updated[dn].devices[deviceName] = s;
                    if (updateSummaryDataRef.current) {
                      updateSummaryDataRef.current(updated);
                    }
                    return updated;
                  });
                  
                  // CRITICAL: Broadcast dns_states to non-master tabs
                  // This ensures non-master tabs receive device state updates
                  if (isGlobalInstance && manager.isMasterTab() && manager.isCrossTabSupported()) {
                    manager.broadcastCtiEvent({
                      type: 'dns_states',
                      data: s
                    });
                  }
                  break;

                case "call_events":
                  if (handleCallEventRef.current) {
                    handleCallEventRef.current(data.data);
                  }
                  break;

                case "stomp_connected":
                  setIsInitialized(true);
                  setError(null);
                  if (publishStompMessageRef.current) {
                    publishStompMessageRef.current(
                      "/app/request/initial-state",
                      ""
                    );
                  }
                  break;
              }
            } catch (error) {
              // Ignore parsing errors
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
                    // Ignore errors
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
              setError("SSE connection closed");

              // Reconnect with retry logic and exponential backoff
              if (!isReconnectingRef.current && attemptReconnectionRef.current) {
                isReconnectingRef.current = true;
                console.log(
                  `[${currentInstanceId}] 🔄 Connection closed, starting reconnection with retry logic...`
                );
                attemptReconnectionRef.current();
              }
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
          isGettingTokenRef.current = false; // Reset token flag
          setError("Failed to get token");
        });
    }
    // Only depend on isMasterTab and isGlobalInstance - getBearerToken is stable (memoized with empty deps)
  }, [isMasterTab, isGlobalInstance]);

  // Cross-tab integration: Listen to events from master tab
  useEffect(() => {
    const manager = crossTabManagerRef.current;

    if (!manager.isCrossTabSupported()) {
      return; // Fallback to normal behavior if not supported
    }

    // Listen to CTI events from master tab
    const unsubscribeCtiEvents = manager.onCtiEvent((event) => {
      // Handle different event types from master tab
      if (event.data?.type === "call_event" && event.data?.event) {
        // Process the event as if we received it directly
        handleCallEvent(event.data.event);
      } else if (event.data?.event) {
        // Direct event object
        handleCallEvent(event.data.event);
      } else if (event.data?.type === "complete_state" && event.data?.data) {
        // CRITICAL: Handle complete_state from master tab
        // This provides the initial data needed for live-calls page
        try {
          if (
            groupDevicesByDnAndDeviceNameRef.current &&
            updateSummaryDataRef.current
          ) {
            console.log("complete_state 3", event);
            const grouped = groupDevicesByDnAndDeviceNameRef.current(
              event.data.data
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
            console.log(`[${instanceIdRef.current}] Received complete_state from master tab`);
          }
        } catch (err) {
          console.error(`[${instanceIdRef.current}] Failed to process complete_state from master:`, err);
        }
      } else if (event.data?.type === "dns_states" && event.data?.data) {
        // Handle dns_states from master tab
        try {
          const s = event.data.data;
          setDnsMap((prev) => {
            const updated = { ...prev };
            const { dn, deviceName } = s;
            if (!updated[dn]) {
              updated[dn] = { dn, devices: {} };
            }
            updated[dn].devices[deviceName] = s;
            if (updateSummaryDataRef.current) {
              updateSummaryDataRef.current(updated);
            }
            return updated;
          });
        } catch (err) {
          console.error(`[${instanceIdRef.current}] Failed to process dns_states from master:`, err);
        }
      }
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
        // Merge with existing eventLog, avoiding duplicates
        setEventLog((prev) => {
          // If master's eventLog is longer or different, use it (master is source of truth)
          // Otherwise, merge new events that aren't in prev
          const prevEventIds = new Set(prev.map((e: any) => 
            e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null
          ).filter(Boolean));
          
          const newEvents = state.eventLog.filter((e: any) => {
            const eventId = e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null;
            return eventId && !prevEventIds.has(eventId);
          });
          
          // If master has significantly more events, use master's version (it's the source of truth)
          if (state.eventLog.length > prev.length + 10) {
            return state.eventLog.slice(-200); // Keep last 200 events
          }
          
          // Otherwise, merge new events
          const merged = [...prev, ...newEvents];
          return merged.slice(-200); // Keep last 200 events
        });
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
      const latestEvent = eventLog[eventLog.length - 1];
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
