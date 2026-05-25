import type { ActiveMonitoring } from "@components/live-calls/utils/types";
import { ctiAddressesEquivalent } from "@utils/ctiAddressMatching";
import {
  activeMonitoringFromPayload,
  callStateMapHasSupervisionMonitoringFlagForPair,
  findTerminalMonitoringClearInRecentLog,
  monitoringPayloadDiffersFromActive,
  pickBestApplicableMonitoringPayload,
  pickPinnedSupervisionPayloadFromCallStateMap,
  shouldRetainLocalWallboardMonitoringDuringSseLag,
  type ResolveEffectiveWallboardMonitoringOptions,
} from "@components/communications/wallboards-live/wallboardEventParsing";
export type InitiatorMonitoringClearDecision =
  | { action: "none" }
  | { action: "clear" }
  | { action: "upgrade"; monitoring: ActiveMonitoring };

type WallboardDnsMap = Parameters<
  typeof pickBestApplicableMonitoringPayload
>[1];

function initiatorClearSkippedByLiveMapFlag(
  snap: ActiveMonitoring,
  eventLog: readonly unknown[] | undefined,
  callStateMap: Record<string, unknown> | undefined,
): boolean {
  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
    dn: snap.dn,
    monitor: snap.monitor,
    deviceName: snap.deviceName,
    type: snap.type,
  });
  const monitor = snap.monitor;
  const dn = snap.dn;
  if (terminalClear || !monitor || !dn || !callStateMap) {
    return false;
  }
  return callStateMapHasSupervisionMonitoringFlagForPair(
    callStateMap,
    monitor,
    dn,
  );
}

function initiatorClearSkippedByPinnedRow(
  snap: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap: WallboardDnsMap | undefined,
): boolean {
  if (!snap.type || !snap.monitor || !snap.dn || !callStateMap || !dnsMap) {
    return false;
  }
  return Boolean(
    pickPinnedSupervisionPayloadFromCallStateMap(callStateMap, dnsMap, snap),
  );
}

function initiatorUpgradeFromStream(
  snap: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap: WallboardDnsMap | undefined,
  eventLog: readonly unknown[] | undefined,
  wallboardStreamOptions: ResolveEffectiveWallboardMonitoringOptions,
): InitiatorMonitoringClearDecision {
  const streamPickOpts: ResolveEffectiveWallboardMonitoringOptions = {
    ...wallboardStreamOptions,
    suppressedSessionKey: null,
    monitoringTeardown: null,
    strictRemoteSessionOnly: true,
    activeMonitoring: {
      dn: snap.dn,
      monitor: snap.monitor,
      deviceName: snap.deviceName,
      type: null,
    },
    activeMonitoringType: null,
    effectiveMonitoringType: null,
  };
  const streamPayload = pickBestApplicableMonitoringPayload(
    callStateMap,
    dnsMap,
    eventLog,
    streamPickOpts,
  );
  const samePair =
    streamPayload &&
    snap.monitor &&
    snap.dn &&
    ctiAddressesEquivalent(streamPayload.monitorDn, snap.monitor) &&
    ctiAddressesEquivalent(streamPayload.monitoredDn, snap.dn);
  if (!samePair) {
    return { action: "clear" };
  }
  if (monitoringPayloadDiffersFromActive(snap, streamPayload)) {
    return {
      action: "upgrade",
      monitoring: activeMonitoringFromPayload(streamPayload),
    };
  }
  return { action: "none" };
}

/** Initiator-only: whether to clear, upgrade, or leave local monitoring when effective SSE state is empty. */
export function evaluateInitiatorMonitoringClear(
  snap: ActiveMonitoring,
  eventLog: readonly unknown[] | undefined,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap: WallboardDnsMap | undefined,
  wallboardStreamOptions: ResolveEffectiveWallboardMonitoringOptions,
  supervisionSessionActive: boolean,
): InitiatorMonitoringClearDecision {
  if (initiatorClearSkippedByLiveMapFlag(snap, eventLog, callStateMap)) {
    return { action: "none" };
  }
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      snap,
      eventLog,
      wallboardStreamOptions,
    )
  ) {
    return { action: "none" };
  }
  if (initiatorClearSkippedByPinnedRow(snap, callStateMap, dnsMap)) {
    return { action: "none" };
  }
  if (supervisionSessionActive) {
    return { action: "none" };
  }
  return initiatorUpgradeFromStream(
    snap,
    callStateMap,
    dnsMap,
    eventLog,
    wallboardStreamOptions,
  );
}
