import { useEffect, useRef } from 'react';

const FINESSE_SSE_PATH = '/api/finesse-ws-stream';

/** SSE event types emitted by the Finesse stream API */
const SSE_TYPE = {
  STOMP_CONNECTED: 'stomp_connected',
  STOMP_CLOSED: 'stomp_closed',
  AUTH_REQUIRED: 'auth_required',
  STATE: 'state',
  ERROR: 'error',
  PREVIEW: 'preview',
  PING: 'ping',
  STOMP_ERROR: 'stomp_error',
} as const;

const DEFAULT_AUTH_MESSAGE = 'Your session has expired or is invalid. Please log in again.';

export interface FinesseStateEvent {
  state?: string;
  [key: string]: unknown;
}

export interface FinessePreviewEvent {
  dialogId?: string | number;
  eventType?: string;
  dialogState?: string;
  campaignName?: string;
  customerNumber?: string;
  dialedNumber?: string;
  fromAddress?: string;
  participants?: Array<{
    state?: string;
    startTime?: string;
    stateChangeTime?: string;
    actions?: string[];
  }>;
  [key: string]: unknown;
}

export interface UseFinesseStompOptions {
  token: string | null | undefined;
  finesseUserId: string | null | undefined;
  onStateEvent?: (payload: FinesseStateEvent) => void;
  onErrorEvent?: (payload: unknown) => void;
  onConnectionChange?: (connected: boolean) => void;
  onAuthError?: (message: string) => void;
  onPreviewEvent?: (payload: FinessePreviewEvent) => void;
}

interface SSEPayload {
  type: string;
  data?: unknown;
  message?: string;
  body?: string;
}

function isSSEPayload(value: unknown): value is SSEPayload {
  return typeof value === 'object' && value !== null && 'type' in value;
}

/**
 * Connects to the Finesse STOMP proxy via SSE (/api/finesse-ws-stream).
 * Subscribes to state and optional preview dialog events; callbacks are
 * invoked with the latest refs so dependencies can be omitted from the effect.
 */
export function useFinesseStomp({
  token,
  finesseUserId,
  onStateEvent,
  onErrorEvent,
  onConnectionChange,
  onAuthError,
  onPreviewEvent,
}: UseFinesseStompOptions): void {
  const eventSourceRef = useRef<EventSource | null>(null);
  const wantsPreviewRef = useRef(Boolean(onPreviewEvent));

  const callbacksRef = useRef({
    onStateEvent,
    onErrorEvent,
    onConnectionChange,
    onAuthError,
    onPreviewEvent,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStateEvent,
      onErrorEvent,
      onConnectionChange,
      onAuthError,
      onPreviewEvent,
    };
    wantsPreviewRef.current = Boolean(onPreviewEvent);
  }, [onStateEvent, onErrorEvent, onConnectionChange, onAuthError, onPreviewEvent]);

  useEffect(() => {
    if (!token || !finesseUserId) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      callbacksRef.current.onConnectionChange?.(false);
      return;
    }

    if (typeof globalThis.window === 'undefined') return;

    const params = new URLSearchParams({
      token,
      finesseUserId,
      preview: wantsPreviewRef.current ? 'true' : 'false',
    });
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

      const { type, data, message } = payload;
      const cb = callbacksRef.current;

      switch (type) {
        case SSE_TYPE.STOMP_CONNECTED:
          cb.onConnectionChange?.(true);
          break;
        case SSE_TYPE.STOMP_CLOSED:
          cb.onConnectionChange?.(false);
          break;
        case SSE_TYPE.AUTH_REQUIRED:
          cb.onAuthError?.(message ?? DEFAULT_AUTH_MESSAGE);
          cb.onConnectionChange?.(false);
          break;
        case SSE_TYPE.STATE:
          if (data) cb.onStateEvent?.(data as FinesseStateEvent);
          break;
        case SSE_TYPE.ERROR:
          cb.onErrorEvent?.(data ?? payload);
          break;
        case SSE_TYPE.PREVIEW:
          if (data) cb.onPreviewEvent?.(data as FinessePreviewEvent);
          break;
        case SSE_TYPE.PING:
          break;
        case SSE_TYPE.STOMP_ERROR: {
          const err = payload as SSEPayload & { message?: string };
          if (process.env.NODE_ENV === 'development') {
            console.error('[Finesse SSE] STOMP error:', err.message ?? err.body ?? '');
          }
          cb.onConnectionChange?.(false);
          break;
        }
        default:
          break;
      }
    };

    es.onerror = () => {
      callbacksRef.current.onConnectionChange?.(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      callbacksRef.current.onConnectionChange?.(false);
    };
  }, [token, finesseUserId]);
}
