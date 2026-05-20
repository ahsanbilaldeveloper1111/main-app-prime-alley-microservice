import { useRef, type RefObject } from "react";
import type { Client } from "@stomp/stompjs";
import { globalConnectionRefs } from "./ctiStompGlobalConnectionRefs";
import type { CtiStreamMissedEventRecovery } from "./ctiStreamMissedEventRecovery";

export type CtiStompConnectionRefs = {
  clientRef: RefObject<Client | null>;
  eventSourceRef: RefObject<EventSource | null>;
  tokenRef: RefObject<string | null>;
  userAddressRef: RefObject<string | null>;
  userTeamsRef: RefObject<unknown>;
  userDataExtensionsRef: RefObject<unknown>;
  isConnectingRef: RefObject<boolean>;
  isInitializedRef: RefObject<boolean>;
  connectionStartTimeRef: RefObject<number | null>;
  reconnectionTimerRef: RefObject<NodeJS.Timeout | null>;
  isReconnectingRef: RefObject<boolean>;
  isGettingTokenRef: RefObject<boolean>;
  reconnectionAttemptsRef: RefObject<number>;
  lastMessageTimeRef: RefObject<number | null>;
  healthCheckIntervalRef: RefObject<NodeJS.Timeout | null>;
  hasRequestedInitialStateRef: RefObject<boolean>;
  pendingRefreshAfterCallEndRef: RefObject<ReturnType<typeof setTimeout> | null>;
  lastRefreshAfterCallEndRef: RefObject<number>;
  streamGapRecoveryRef: RefObject<CtiStreamMissedEventRecovery | null>;
};

/** Picks shared vs per-instance connection refs (reduces useCtiStomp complexity). */
export function useCtiStompConnectionRefs(
  isGlobalInstance: boolean,
): CtiStompConnectionRefs {
  const localClientRef = useRef<Client | null>(null);
  const localEventSourceRef = useRef<EventSource | null>(null);
  const localTokenRef = useRef<string | null>(null);
  const localUserAddressRef = useRef<string | null>(null);
  const localUserTeamsRef = useRef<unknown>(null);
  const localUserDataExtensionsRef = useRef<unknown>(null);
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
  const localPendingRefreshAfterCallEndRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const localLastRefreshAfterCallEndRef = useRef(0);
  const localStreamGapRecoveryRef =
    useRef<CtiStreamMissedEventRecovery | null>(null);

  if (isGlobalInstance) {
    return {
      clientRef: globalConnectionRefs.clientRef,
      eventSourceRef: globalConnectionRefs.eventSourceRef,
      tokenRef: globalConnectionRefs.tokenRef,
      userAddressRef: globalConnectionRefs.userAddressRef,
      userTeamsRef: globalConnectionRefs.userTeamsRef,
      userDataExtensionsRef: globalConnectionRefs.userDataExtensionsRef,
      isConnectingRef: globalConnectionRefs.isConnectingRef,
      isInitializedRef: globalConnectionRefs.isInitializedRef,
      connectionStartTimeRef: globalConnectionRefs.connectionStartTimeRef,
      reconnectionTimerRef: globalConnectionRefs.reconnectionTimerRef,
      isReconnectingRef: globalConnectionRefs.isReconnectingRef,
      isGettingTokenRef: globalConnectionRefs.isGettingTokenRef,
      reconnectionAttemptsRef: globalConnectionRefs.reconnectionAttemptsRef,
      lastMessageTimeRef: globalConnectionRefs.lastMessageTimeRef,
      healthCheckIntervalRef: globalConnectionRefs.healthCheckIntervalRef,
      hasRequestedInitialStateRef:
        globalConnectionRefs.hasRequestedInitialStateRef,
      pendingRefreshAfterCallEndRef:
        globalConnectionRefs.pendingRefreshAfterCallEndRef,
      lastRefreshAfterCallEndRef: globalConnectionRefs.lastRefreshAfterCallEndRef,
      streamGapRecoveryRef: globalConnectionRefs.streamGapRecoveryRef,
    };
  }

  return {
    clientRef: localClientRef,
    eventSourceRef: localEventSourceRef,
    tokenRef: localTokenRef,
    userAddressRef: localUserAddressRef,
    userTeamsRef: localUserTeamsRef,
    userDataExtensionsRef: localUserDataExtensionsRef,
    isConnectingRef: localIsConnectingRef,
    isInitializedRef: localIsInitializedRef,
    connectionStartTimeRef: localConnectionStartTimeRef,
    reconnectionTimerRef: localReconnectionTimerRef,
    isReconnectingRef: localIsReconnectingRef,
    isGettingTokenRef: localIsGettingTokenRef,
    reconnectionAttemptsRef: localReconnectionAttemptsRef,
    lastMessageTimeRef: localLastMessageTimeRef,
    healthCheckIntervalRef: localHealthCheckIntervalRef,
    hasRequestedInitialStateRef: localHasRequestedInitialStateRef,
    pendingRefreshAfterCallEndRef: localPendingRefreshAfterCallEndRef,
    lastRefreshAfterCallEndRef: localLastRefreshAfterCallEndRef,
    streamGapRecoveryRef: localStreamGapRecoveryRef,
  };
}
