import type { Dispatch, SetStateAction } from "react";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import { mergeRemoteEventLogWithPrevious } from "./ctiStompHelpers";
import type { CtiCallEvent, SummaryData } from "./ctiStompHookTypes";
import {
  dispatchCrossTabCtiBroadcastEvent,
  type CrossTabBroadcastCtx,
  type CtiDnsMapGrouped,
} from "./ctiStompCrossTabBroadcastDispatch";

export type CtiStompCrossTabListenCtx = {
  instanceIdRef: { current: string };
  isGlobalInstance: boolean;
  crossTabManagerRef: { current: CrossTabCtiManager };
  userDataExtensionsRef: { current: unknown };
  handleCallEventRef: { current: ((evt: unknown) => void) | null };
  groupDevicesByDnAndDeviceNameRef: CrossTabBroadcastCtx["groupDevicesByDnAndDeviceNameRef"];
  updateSummaryDataRef: CrossTabBroadcastCtx["updateSummaryDataRef"];
  setDnsMap: Dispatch<SetStateAction<CtiDnsMapGrouped>>;
  setEventLog: Dispatch<SetStateAction<unknown[]>>;
  setCallStateMap: Dispatch<SetStateAction<Record<string, CtiCallEvent>>>;
  setSummaryData: Dispatch<SetStateAction<SummaryData>>;
  setUserAddress: Dispatch<SetStateAction<string>>;
  setIsInitialized: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  saveCallStatesToStorage: (callStates: Record<string, CtiCallEvent>) => void;
  publishStompMessageRef: {
    current: ((destination: string, body?: string) => Promise<boolean>) | null;
  };
};

function requestUserDataExtensionsFromMaster(
  manager: CrossTabCtiManager,
  userDataExtensionsRef: { current: unknown },
): void {
  if (userDataExtensionsRef.current) {
    return;
  }
  if (!manager.isCrossTabSupported() || manager.isMasterTab()) {
    return;
  }
  manager.broadcastCtiEvent({
    type: "request_user_data_extensions",
    data: null,
  });
}

function applyMasterTabStateUpdate(
  state: {
    dnsMap?: CtiDnsMapGrouped;
    callStateMap?: Record<string, CtiCallEvent>;
    summaryData?: SummaryData;
    userAddress?: string;
    eventLog?: unknown[];
  },
  ctx: CtiStompCrossTabListenCtx,
): void {
  if (state.dnsMap) {
    ctx.setDnsMap(state.dnsMap);
  }
  if (state.callStateMap) {
    ctx.setCallStateMap(state.callStateMap);
    ctx.saveCallStatesToStorage(state.callStateMap);
  }
  if (state.summaryData) {
    ctx.setSummaryData(state.summaryData);
  }
  if (state.userAddress) {
    ctx.setUserAddress(state.userAddress);
  }
  const remoteEventLog = state.eventLog;
  if (remoteEventLog && Array.isArray(remoteEventLog)) {
    ctx.setEventLog((prev) =>
      mergeRemoteEventLogWithPrevious(prev, remoteEventLog),
    );
  }
  ctx.setIsInitialized(true);
  ctx.setError(null);
}

function handleMasterActionRequest(
  event: { actionId?: string; data?: { actionType?: string } },
  ctx: CtiStompCrossTabListenCtx,
  manager: CrossTabCtiManager,
): void {
  if (!manager.isMasterTab()) {
    return;
  }
  if (event.data?.actionType !== "requestInitialState") {
    return;
  }
  const pub = ctx.publishStompMessageRef.current;
  if (pub) {
    pub("/app/request/initial-state", "");
    console.log(
      `[${ctx.instanceIdRef.current}] Master tab: Requested initial state for non-master tab`,
    );
  }
  manager.sendActionResponse(event.actionId || "", { success: true });
}

/** Cross-tab listeners (events, state sync, action requests). */
export function subscribeCtiStompCrossTabListeners(
  ctx: CtiStompCrossTabListenCtx,
): () => void {
  const manager = ctx.crossTabManagerRef.current;
  if (!manager.isCrossTabSupported()) {
    return () => {};
  }

  const broadcastCtx: CrossTabBroadcastCtx = {
    instanceIdRef: ctx.instanceIdRef,
    isGlobalInstance: ctx.isGlobalInstance,
    manager,
    userDataExtensionsRef: ctx.userDataExtensionsRef,
    handleCallEvent: (evt) => ctx.handleCallEventRef.current?.(evt),
    groupDevicesByDnAndDeviceNameRef: ctx.groupDevicesByDnAndDeviceNameRef,
    updateSummaryDataRef: ctx.updateSummaryDataRef,
    setDnsMap: ctx.setDnsMap,
    setEventLog: ctx.setEventLog,
  };

  const unsubscribeCtiEvents = manager.onCtiEvent((event) => {
    dispatchCrossTabCtiBroadcastEvent(event, broadcastCtx);
  });

  const unsubscribeStateUpdates = manager.onStateUpdate((state) => {
    applyMasterTabStateUpdate(state, ctx);
  });

  const unsubscribeActionRequests = manager.onActionRequest(async (event) => {
    handleMasterActionRequest(event, ctx, manager);
  });

  return () => {
    unsubscribeCtiEvents();
    unsubscribeStateUpdates();
    unsubscribeActionRequests();
  };
}

export type CtiStompCrossTabMasterBroadcastCtx = {
  crossTabManagerRef: { current: CrossTabCtiManager };
  dnsMap: CtiDnsMapGrouped;
  callStateMap: Record<string, CtiCallEvent>;
  summaryData: SummaryData;
  userAddress: string;
  eventLog: unknown[];
};

/** Master tab: push full state to other tabs when local state changes. */
export function broadcastCtiStompMasterState(ctx: CtiStompCrossTabMasterBroadcastCtx): void {
  const manager = ctx.crossTabManagerRef.current;
  if (!manager.isMasterTab() || !manager.isCrossTabSupported()) {
    return;
  }
  manager.broadcastStateUpdate({
    dnsMap: ctx.dnsMap,
    callStateMap: ctx.callStateMap,
    summaryData: ctx.summaryData,
    userAddress: ctx.userAddress,
    eventLog: ctx.eventLog,
    isInitialized: true,
  });
}

/** Master tab: push latest call event to other tabs. */
export function broadcastCtiStompMasterLatestEvent(
  ctx: CtiStompCrossTabMasterBroadcastCtx,
): void {
  const manager = ctx.crossTabManagerRef.current;
  if (!manager.isMasterTab() || !manager.isCrossTabSupported()) {
    return;
  }
  const latestEvent = ctx.eventLog?.length ? ctx.eventLog.at(-1) : undefined;
  if (!latestEvent) {
    return;
  }
  manager.broadcastCtiEvent({
    type: "call_event",
    event: latestEvent,
  });
}

export { requestUserDataExtensionsFromMaster };
