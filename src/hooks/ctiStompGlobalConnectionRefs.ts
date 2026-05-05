import type { Client } from "@stomp/stompjs";

/**
 * Shared connection refs for global instance (singleton).
 * All hook instances with 'global-cti-instance' share these refs.
 */
export const globalConnectionRefs = {
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
  isGettingTokenRef: { current: false },
  reconnectionAttemptsRef: { current: 0 },
  lastMessageTimeRef: { current: null as number | null },
  healthCheckIntervalRef: { current: null as NodeJS.Timeout | null },
  hasRequestedInitialStateRef: { current: false },
  pendingRefreshAfterCallEndRef: {
    current: null as ReturnType<typeof setTimeout> | null,
  },
  lastRefreshAfterCallEndRef: { current: 0 },
};
