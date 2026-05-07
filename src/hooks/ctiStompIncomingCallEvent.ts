import type { Dispatch, SetStateAction } from "react";
import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";
import type { CtiCallEvent, CtiDevice, SummaryData } from "./ctiStompHookTypes";
import { applyCallEventToCallStateMap } from "./ctiStompHelpers";

type DnsMap = Record<string, { dn: string; devices: Record<string, CtiDevice> }>;

/** Side effects for an incoming CTI call event — lifted from useCtiStomp. */
export function handleIncomingCtiCallEvent(
  evt: CtiCallEvent,
  ctx: {
    isGlobalInstance: boolean;
    crossTabManagerRef: { current: CrossTabCtiManager };
    dnsMap: DnsMap;
    saveCallStatesToStorage: (m: Record<string, CtiCallEvent>) => void;
    onCallIdsRemoved?: (ids: readonly string[]) => void;
    setSummaryData: Dispatch<SetStateAction<SummaryData>>;
    setEventLog: Dispatch<SetStateAction<unknown[]>>;
    setCallStateMap: Dispatch<SetStateAction<Record<string, CtiCallEvent>>>;
  },
): void {
  const callId = evt.callId;
  if (!callId) return;

  const manager = ctx.crossTabManagerRef.current;
  if (
    ctx.isGlobalInstance &&
    manager.isMasterTab() &&
    manager.isCrossTabSupported()
  ) {
    manager.broadcastCtiEvent({
      type: "call_event",
      event: evt,
    });
  }

  if (evt.eventType === "RINGING" && evt.parties) {
    const isIncomingCall = evt.parties.some(
      (p: Record<string, unknown>) =>
        Boolean(p.calledAddress && p.callStatus === "RINGING"),
    );

    if (isIncomingCall) {
      ctx.setSummaryData((prev) => ({
        ...prev,
        incomingEvents: prev.incomingEvents + 1,
      }));
    }
  }

  ctx.setEventLog((prev) => {
    const log = [...prev, evt];
    if (log.length > 200) log.shift();
    return log;
  });

  ctx.setCallStateMap((prev) =>
    applyCallEventToCallStateMap(
      prev as Record<string, unknown>,
      callId,
      evt,
      ctx.dnsMap,
      ctx.saveCallStatesToStorage as (m: Record<string, unknown>) => void,
      ctx.onCallIdsRemoved,
    ) as Record<string, CtiCallEvent>,
  );
}
