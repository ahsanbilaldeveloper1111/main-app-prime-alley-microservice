import type { Dispatch, SetStateAction } from "react";
import type { CtiEvent, CrossTabCtiManager } from "../utils/crossTabCtiManager";
import { devicesArrayFromCompleteStatePayload } from "./ctiStompHelpers";
import type { CtiDevice } from "./ctiStompHookTypes";

export type CtiDnsMapGrouped = Record<
  string,
  { dn: string; devices: Record<string, CtiDevice> }
>;

export interface CrossTabBroadcastCtx {
  instanceIdRef: { current: string };
  isGlobalInstance: boolean;
  manager: CrossTabCtiManager;
  userDataExtensionsRef: { current: unknown };
  handleCallEvent: (evt: unknown) => void;
  groupDevicesByDnAndDeviceNameRef: {
    current: ((deviceArray: CtiDevice[]) => CtiDnsMapGrouped) | null;
  };
  updateSummaryDataRef: {
    current: ((grouped: CtiDnsMapGrouped) => void) | null;
  };
  setDnsMap: Dispatch<SetStateAction<CtiDnsMapGrouped>>;
  setEventLog: Dispatch<SetStateAction<unknown[]>>;
}

function applyCompleteStateFromMaster(
  rawData: unknown,
  ctx: CrossTabBroadcastCtx,
): void {
  try {
    const groupFn = ctx.groupDevicesByDnAndDeviceNameRef.current;
    const summaryFn = ctx.updateSummaryDataRef.current;
    if (!groupFn || !summaryFn) return;
    const grouped = groupFn(
      devicesArrayFromCompleteStatePayload(rawData) as CtiDevice[],
    );
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
    console.log(
      `[${ctx.instanceIdRef.current}] Received complete_state from master tab`,
    );
  } catch (err) {
    console.error(
      `[${ctx.instanceIdRef.current}] Failed to process complete_state from master:`,
      err,
    );
  }
}

function applyUserDataExtensionsFromMaster(
  extensions: unknown,
  ctx: CrossTabBroadcastCtx,
): void {
  try {
    if (extensions) {
      ctx.userDataExtensionsRef.current = extensions;
      console.log(
        `[${ctx.instanceIdRef.current}] Received userDataExtensions from master tab`,
      );
    }
  } catch (err) {
    console.error(
      `[${ctx.instanceIdRef.current}] Failed to process userDataExtensions from master:`,
      err,
    );
  }
}

function applyDnsStatesFromMaster(
  s: { dn: string; deviceName: string } & Record<string, unknown>,
  ctx: CrossTabBroadcastCtx,
): void {
  try {
    ctx.setDnsMap((prev) => {
      const updated = { ...prev };
      const { dn, deviceName } = s;
      if (!updated[dn]) {
        updated[dn] = { dn, devices: {} };
      }
      const existing = updated[dn].devices[deviceName];
      updated[dn].devices[deviceName] = { ...existing, ...s };
      if (ctx.updateSummaryDataRef.current) {
        ctx.updateSummaryDataRef.current(updated);
      }
      return updated;
    });
  } catch (err) {
    console.error(
      `[${ctx.instanceIdRef.current}] Failed to process dns_states from master:`,
      err,
    );
  }
}

/**
 * Handles CTI payloads broadcast from the master tab (non-SSE path).
 */
export function dispatchCrossTabCtiBroadcastEvent(
  event: CtiEvent,
  ctx: CrossTabBroadcastCtx,
): void {
  const d = event.data;
  if (!d || typeof d !== "object") {
    return;
  }

  const payload = d as Record<string, unknown>;

  if (payload.type === "call_event" && payload.event) {
    ctx.handleCallEvent(payload.event);
    return;
  }
  if (payload.event) {
    ctx.handleCallEvent(payload.event);
    return;
  }

  if (payload.type === "request_user_data_extensions") {
    if (
      ctx.isGlobalInstance &&
      ctx.manager.isMasterTab() &&
      ctx.userDataExtensionsRef.current
    ) {
      ctx.manager.broadcastCtiEvent({
        type: "user_data_extensions",
        data: ctx.userDataExtensionsRef.current,
      });
    }
    return;
  }

  if (payload.type === "complete_state" && payload.data) {
    applyCompleteStateFromMaster(payload.data, ctx);
    return;
  }

  if (payload.type === "user_data_extensions" && payload.data) {
    applyUserDataExtensionsFromMaster(payload.data, ctx);
    return;
  }

  if (payload.type === "dns_states" && payload.data) {
    applyDnsStatesFromMaster(
      payload.data as { dn: string; deviceName: string } & Record<string, unknown>,
      ctx,
    );
  }
}
