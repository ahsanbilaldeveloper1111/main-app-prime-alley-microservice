import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  applyFinesseRemoteForcedLogout,
  getFinesseEffectiveAgentStateFromStatePayload,
  shouldApplyFinesseRemoteLogoutFromStateEvent,
} from "@utils/finesse";

const FINESSE_SSE_PATH = "/api/finesse-ws-stream";

/** SSE event types emitted by the Finesse stream API */
const SSE_TYPE = {
  STOMP_CONNECTED: "stomp_connected",
  STOMP_CLOSED: "stomp_closed",
  AUTH_REQUIRED: "auth_required",
  STATE: "state",
  ERROR: "error",
  PREVIEW: "preview",
  ROSTER_STATE: "roster_state",
  PING: "ping",
  STOMP_ERROR: "stomp_error",
} as const;

const DEFAULT_AUTH_MESSAGE =
  "Your session has expired or is invalid. Please log in again.";

export interface FinesseStateEvent {
  state?: string;
  [key: string]: unknown;
}

export interface FinessePreviewCallVariable {
  name?: string;
  value?: string;
}

export interface FinessePreviewEvent {
  dialogId?: string | number;
  eventType?: string;
  dialogState?: string;
  campaignName?: string;
  customerNumber?: string;
  dialedNumber?: string;
  fromAddress?: string;
  /** Call variables on the dialog (fallback if not on participant). */
  callVariables?: FinessePreviewCallVariable[];
  participants?: Array<{
    state?: string;
    startTime?: string;
    stateChangeTime?: string;
    actions?: string[];
    mediaAddress?: string;
    callVariables?: FinessePreviewCallVariable[];
  }>;
  [key: string]: unknown;
}

export interface UseFinesseStompOptions {
  token: string | null | undefined;
  finesseUserId: string | null | undefined;
  /** With `teamId`, enables `/topic/finesse/cluster/{clusterId}/team/{teamId}/roster/state`. */
  clusterId?: string | null;
  teamId?: string | number | null;
  onStateEvent?: (payload: FinesseStateEvent) => void;
  onErrorEvent?: (payload: unknown) => void;
  onConnectionChange?: (connected: boolean) => void;
  onAuthError?: (message: string) => void;
  onPreviewEvent?: (payload: FinessePreviewEvent) => void;
  /** Roster topic payload (array or wrapped); use to refresh agent rows / self state. */
  onRosterEvent?: (payload: unknown) => void;
  /** After STOMP connects (or pooled connection re-subscribes); use to sync team list from API. */
  onStompConnected?: () => void;
}

interface SSEPayload {
  type: string;
  data?: unknown;
  message?: string;
  body?: string;
}

function isSSEPayload(value: unknown): value is SSEPayload {
  return typeof value === "object" && value !== null && "type" in value;
}

type SseCallbackBundle = {
  onStateEvent?: (payload: FinesseStateEvent) => void;
  onErrorEvent?: (payload: unknown) => void;
  onConnectionChange?: (connected: boolean) => void;
  onAuthError?: (message: string) => void;
  onPreviewEvent?: (payload: FinessePreviewEvent) => void;
  onRosterEvent?: (payload: unknown) => void;
  onStompConnected?: () => void;
};

function normalizeStateEventPayload(
  data: unknown,
  effective: string | undefined,
): FinesseStateEvent {
  if (effective != null && typeof data === "object" && data !== null) {
    return { ...data, state: effective } as FinesseStateEvent;
  }
  return data as FinesseStateEvent;
}

function handleSSEStatePayload(
  data: unknown,
  finesseUserId: string,
  onStateEvent?: (payload: FinesseStateEvent) => void,
): void {
  if (!data) return;
  if (shouldApplyFinesseRemoteLogoutFromStateEvent(data, finesseUserId)) {
    applyFinesseRemoteForcedLogout();
    toast.info(
      "Your Finesse session was ended. Use Connect to Finesse to sign in again.",
      { toastId: "finesse-remote-forced-logout" },
    );
    return;
  }
  const effective = getFinesseEffectiveAgentStateFromStatePayload(data);
  onStateEvent?.(normalizeStateEventPayload(data, effective));
}

function logStompErrorInDevelopment(payload: SSEPayload): void {
  if (process.env.NODE_ENV !== "development") return;
  const err = payload as SSEPayload & { message?: string };
  console.error("[Finesse SSE] STOMP error:", err.message ?? err.body ?? "");
}

function dispatchSsePayload(
  payload: SSEPayload,
  finesseUserId: string,
  cb: SseCallbackBundle,
): void {
  const { type, data, message } = payload;

  switch (type) {
    case SSE_TYPE.STOMP_CONNECTED:
      cb.onConnectionChange?.(true);
      cb.onStompConnected?.();
      return;
    case SSE_TYPE.STOMP_CLOSED:
      cb.onConnectionChange?.(false);
      return;
    case SSE_TYPE.AUTH_REQUIRED:
      cb.onAuthError?.(message ?? DEFAULT_AUTH_MESSAGE);
      cb.onConnectionChange?.(false);
      return;
    case SSE_TYPE.STATE:
      handleSSEStatePayload(data, finesseUserId, cb.onStateEvent);
      return;
    case SSE_TYPE.ERROR:
      cb.onErrorEvent?.(data ?? payload);
      return;
    case SSE_TYPE.PREVIEW:
      if (data) cb.onPreviewEvent?.(data as FinessePreviewEvent);
      return;
    case SSE_TYPE.ROSTER_STATE:
      if (data !== undefined) cb.onRosterEvent?.(data);
      return;
    case SSE_TYPE.PING:
      return;
    case SSE_TYPE.STOMP_ERROR:
      logStompErrorInDevelopment(payload);
      cb.onConnectionChange?.(false);
      return;
    default:
  }
}

/**
 * Connects to the Finesse STOMP proxy via SSE (/api/finesse-ws-stream).
 * Subscribes to state and optional preview dialog events; callbacks are
 * invoked with the latest refs so dependencies can be omitted from the effect.
 */
export function useFinesseStomp({
  token,
  finesseUserId,
  clusterId,
  teamId,
  onStateEvent,
  onErrorEvent,
  onConnectionChange,
  onAuthError,
  onPreviewEvent,
  onRosterEvent,
  onStompConnected,
}: UseFinesseStompOptions): void {
  const eventSourceRef = useRef<EventSource | null>(null);
  const wantsPreviewRef = useRef(Boolean(onPreviewEvent));

  const callbacksRef = useRef({
    onStateEvent,
    onErrorEvent,
    onConnectionChange,
    onAuthError,
    onPreviewEvent,
    onRosterEvent,
    onStompConnected,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStateEvent,
      onErrorEvent,
      onConnectionChange,
      onAuthError,
      onPreviewEvent,
      onRosterEvent,
      onStompConnected,
    };
    wantsPreviewRef.current = Boolean(onPreviewEvent);
  }, [
    onStateEvent,
    onErrorEvent,
    onConnectionChange,
    onAuthError,
    onPreviewEvent,
    onRosterEvent,
    onStompConnected,
  ]);

  useEffect(() => {
    if (!token || !finesseUserId) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      callbacksRef.current.onConnectionChange?.(false);
      return;
    }

    if (globalThis.window === undefined) return;

    const params = new URLSearchParams({
      token,
      finesseUserId,
      preview: wantsPreviewRef.current ? "true" : "false",
    });
    const c =
      clusterId != null && String(clusterId).trim() !== ""
        ? String(clusterId).trim()
        : "";
    console.log("clusterId", c);
    const t =
      teamId != null && String(teamId).trim() !== ""
        ? String(teamId).trim()
        : "";
    if (c && t) {
      params.set("clusterId", c);
      params.set("teamId", t);
    }
    const es = new EventSource(`${FINESSE_SSE_PATH}?${params}`);

    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      let payload: SSEPayload;
      try {
        const parsed = JSON.parse(event.data) as unknown;
        if (!isSSEPayload(parsed)) return;
        payload = parsed;
      } catch {
        return;
      }
      dispatchSsePayload(payload, finesseUserId, callbacksRef.current);
    };

    es.onerror = () => {
      callbacksRef.current.onConnectionChange?.(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      callbacksRef.current.onConnectionChange?.(false);
    };
  }, [token, finesseUserId, clusterId, teamId]);
}
