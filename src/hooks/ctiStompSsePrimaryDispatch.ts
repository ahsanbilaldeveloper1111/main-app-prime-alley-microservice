import type { Dispatch, SetStateAction } from "react";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import { devicesArrayFromCompleteStatePayload } from "./ctiStompHelpers";

type UnknownRecord = Record<string, unknown>;

function unknownToDisplayString(value: unknown, fallback: string): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    return value;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (value instanceof Error) {
    return value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/** Mirrors CtiDevice in useCtiStomp (kept local to avoid circular imports). */
interface CtiDeviceShape {
  dn: string;
  deviceName: string;
  status: string;
  terminalState: string;
  deviceType: string;
}

type DnsMapState = Record<
  string,
  { dn: string; devices: Record<string, CtiDeviceShape> }
>;

export interface PrimarySseDispatchCtx {
  currentInstanceId: string;
  getInstanceId: () => string;
  isGlobalInstance: boolean;
  crossTabManagerRef: { current: CrossTabCtiManager };
  lastMessageTimeRef: { current: number | null };
  setDnsMap: Dispatch<SetStateAction<DnsMapState>>;
  setEventLog: Dispatch<SetStateAction<unknown[]>>;
  setError: (msg: string | null) => void;
  setIsInitialized: (v: boolean) => void;
  isReconnectingRef: { current: boolean };
  setIsReconnecting: (v: boolean) => void;
  attemptReconnection: () => void;
  scheduleRefreshAfterCallEndRef: { current: (() => void) | null };
  hasRequestedInitialStateRef: { current: boolean };
  publishStompMessageRef: {
    current: ((dest: string, body?: string) => Promise<boolean>) | null;
  };
  handleCallEventRef: { current: ((e: unknown) => void) | null };
  handleOngoingCallsRef: { current: ((data: unknown) => void) | null };
  groupDevicesByDnAndDeviceNameRef: {
    current: ((devices: unknown[]) => unknown) | null;
  };
  updateSummaryDataRef: { current: ((grouped: unknown) => void) | null };
}

function touchLastMessageTime(
  data: UnknownRecord,
  lastMessageTimeRef: { current: number | null },
): void {
  if (data.type !== "ping" && data.type !== "test") {
    lastMessageTimeRef.current = Date.now();
  }
}

function handleCompleteState(
  data: UnknownRecord,
  ctx: PrimarySseDispatchCtx,
): void {
  const { currentInstanceId } = ctx;
  try {
    const groupFn = ctx.groupDevicesByDnAndDeviceNameRef.current;
    const summaryFn = ctx.updateSummaryDataRef.current;
    if (!groupFn || !summaryFn) return;
    const devices = devicesArrayFromCompleteStatePayload(data.data);
    const grouped = groupFn(devices) as DnsMapState;
    ctx.setDnsMap(grouped);
    summaryFn(grouped);
    ctx.setEventLog((prev) => [
      ...prev,
      {
        type: "initial-state",
        data: grouped,
        timestamp: new Date().toISOString(),
      },
    ]);
    const mgr = ctx.crossTabManagerRef.current;
    if (
      ctx.isGlobalInstance &&
      mgr.isMasterTab() &&
      mgr.isCrossTabSupported()
    ) {
      mgr.broadcastCtiEvent({
        type: "complete_state",
        data: data.data,
      });
    }
  } catch (err) {
    console.error(
      `[${currentInstanceId}] ❌ Failed to process initial state`,
      err,
    );
  }
}

function handleDnsStates(data: UnknownRecord, ctx: PrimarySseDispatchCtx): void {
  const { currentInstanceId } = ctx;
  try {
    const s = data.data as UnknownRecord & { dn: string; deviceName: string };
    ctx.setDnsMap((prev) => {
      const updated: DnsMapState = { ...prev };
      const { dn, deviceName } = s;
      if (!updated[dn]) {
        updated[dn] = { dn, devices: {} };
      }
      const existing = updated[dn].devices[deviceName];
      updated[dn].devices[deviceName] = { ...existing, ...s } as CtiDeviceShape;
      if (ctx.updateSummaryDataRef.current) {
        ctx.updateSummaryDataRef.current(updated);
      }
      return updated;
    });
  } catch (err) {
    console.error(`[${currentInstanceId}] ❌ Failed to process update`, err);
  }
}

function handleCallEvents(
  data: UnknownRecord,
  ctx: PrimarySseDispatchCtx,
): void {
  const { currentInstanceId } = ctx;
  try {
    if (ctx.handleCallEventRef.current) {
      ctx.handleCallEventRef.current(data.data);
    }
    const evt = data.data as UnknownRecord | undefined;
    const et = evt?.eventType;
    if (et === "DROPPED" || et === "DISCONNECTED") {
      ctx.scheduleRefreshAfterCallEndRef.current?.();
    }
  } catch (err) {
    console.error(
      `[${currentInstanceId}] ❌ Failed to process call event`,
      err,
    );
  }
}

function handleOngoingCalls(
  data: UnknownRecord,
  ctx: PrimarySseDispatchCtx,
): void {
  const { currentInstanceId } = ctx;
  try {
    ctx.handleOngoingCallsRef.current?.(data.data);
  } catch (err) {
    console.error(
      `[${currentInstanceId}] ❌ Failed to process ongoing calls`,
      err,
    );
  }
}

function handleStompConnected(ctx: PrimarySseDispatchCtx): void {
  ctx.setIsInitialized(true);
  ctx.setError(null);
  const publishInitial = ctx.publishStompMessageRef.current;
  if (!ctx.hasRequestedInitialStateRef.current && publishInitial) {
    ctx.hasRequestedInitialStateRef.current = true;
    publishInitial("/app/request/initial-state", "");
    publishInitial("/app/request/ongoing-calls", "");
  }
}

function handleStompError(data: UnknownRecord, ctx: PrimarySseDispatchCtx): void {
  ctx.setError(
    `STOMP error: ${unknownToDisplayString(data.message, "unknown")}`,
  );
  ctx.setIsInitialized(false);
}

function handleConnectionMessage(
  data: UnknownRecord,
  ctx: PrimarySseDispatchCtx,
): void {
  console.log(
    `[${ctx.getInstanceId()}] 📨 Received connection message:`,
    data,
  );
  if (data.status === "disconnected") {
    if (!data.preserveState) {
      ctx.setIsInitialized(false);
    }
    return;
  }
  if (data.status !== "reconnecting") {
    return;
  }
  console.log(
    `[${ctx.getInstanceId()}] 🔄 Received reconnecting status from server`,
  );
  if (ctx.isReconnectingRef.current) {
    console.log(
      `[${ctx.getInstanceId()}] ⚠️ Reconnection already in progress, ignoring duplicate message`,
    );
    return;
  }
  const currentInstanceId = ctx.getInstanceId();
  ctx.isReconnectingRef.current = true;
  ctx.setIsReconnecting(true);
  console.log(
    `[${currentInstanceId}] 🔄 Server reconnecting, starting reconnection with retry logic...`,
  );
  ctx.attemptReconnection();
}

function handleErrorPayload(data: UnknownRecord, ctx: PrimarySseDispatchCtx): void {
  ctx.setError(unknownToDisplayString(data.message, "Connection error"));
  ctx.setIsInitialized(false);
}

const PRIMARY_HANDLERS: Record<
  string,
  (data: UnknownRecord, ctx: PrimarySseDispatchCtx) => void
> = {
  complete_state: handleCompleteState,
  dns_states: handleDnsStates,
  call_events: handleCallEvents,
  ongoing_calls: handleOngoingCalls,
  stomp_connected: (_d, ctx) => handleStompConnected(ctx),
  stomp_error: handleStompError,
  connection: handleConnectionMessage,
  error: handleErrorPayload,
};

export function dispatchPrimaryCtiSsePayload(
  raw: unknown,
  ctx: PrimarySseDispatchCtx,
): void {
  let data: UnknownRecord;
  try {
    data = typeof raw === "object" && raw !== null ? (raw as UnknownRecord) : {};
  } catch {
    return;
  }

  touchLastMessageTime(data, ctx.lastMessageTimeRef);

  const type = typeof data.type === "string" ? data.type : "";
  const handler = PRIMARY_HANDLERS[type];
  if (handler) {
    handler(data, ctx);
  }
}

export type PrimarySseDispatchCtxFactoryArgs = Omit<
  PrimarySseDispatchCtx,
  "getInstanceId" | "attemptReconnection"
> & {
  instanceIdRef: { current: string };
  runAttemptReconnection: () => void | Promise<void>;
};

export function buildPrimarySseDispatchCtx(
  args: PrimarySseDispatchCtxFactoryArgs,
): PrimarySseDispatchCtx {
  const { instanceIdRef, runAttemptReconnection, ...ctxBase } = args;
  return {
    ...ctxBase,
    getInstanceId: () => instanceIdRef.current,
    attemptReconnection: () => {
      void runAttemptReconnection();
    },
  } as PrimarySseDispatchCtx;
}
