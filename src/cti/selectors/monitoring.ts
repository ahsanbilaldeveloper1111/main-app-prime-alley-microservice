/**
 * Monitoring / supervision selectors.
 *
 * Derives supervision state from the live call state map.
 *
 * Pure functions — no React, no side effects.
 */

import { ctiAddressesEquivalent } from "../../utils/ctiAddressMatching";
import type { CtiCallEvent, CtiCallStateMap, CtiMonitoringInfo } from "../types";
import { getLiveParties } from "./activeCalls";

export type MonitoringSession = {
  callId: string;
  monitoringType: string;
  monitorDn: string;
  monitoredDn: string;
  call: CtiCallEvent;
};

const BARGE_IN_TYPES = new Set<string>(["BARGE_IN", "BARGE-IN", "BARGEIN"]);

export function isBargeInType(type: string | undefined): boolean {
  return BARGE_IN_TYPES.has(
    String(type ?? "").trim().toUpperCase().replaceAll("-", "_"),
  );
}

/**
 * Returns all active monitoring sessions where the given supervisor DN
 * is the monitor.
 */
export function getMonitoringSessionsForSupervisor(
  supervisorDn: string,
  callStateMap: CtiCallStateMap,
): MonitoringSession[] {
  const sessions: MonitoringSession[] = [];
  for (const call of Object.values(callStateMap)) {
    if (call.isTerminating || call.isMonitoring === false) continue;
    const m = call.monitoring;
    if (!m?.monitorDn || !m?.monitoredDn) continue;
    if (!ctiAddressesEquivalent(m.monitorDn, supervisorDn)) continue;

    sessions.push({
      callId: call.callId,
      monitoringType: m.monitoringType ?? "SILENT",
      monitorDn: m.monitorDn,
      monitoredDn: m.monitoredDn,
      call,
    });
  }
  return sessions;
}

/**
 * Returns monitoring info for the call where the given DN is being monitored
 * (agent side), or `null` if the DN is not currently under monitoring.
 */
export function getMonitoringInfoForMonitoredDn(
  agentDn: string,
  callStateMap: CtiCallStateMap,
): CtiMonitoringInfo | null {
  for (const call of Object.values(callStateMap)) {
    if (call.isTerminating || call.isMonitoring === false) continue;
    const m = call.monitoring;
    if (!m?.monitoredDn) continue;
    if (ctiAddressesEquivalent(m.monitoredDn, agentDn)) {
      return m;
    }
  }
  return null;
}

/**
 * Returns true when the supervisor DN currently has any barge-in session active.
 */
export function supervisorIsBargedIn(
  supervisorDn: string,
  callStateMap: CtiCallStateMap,
): boolean {
  return getMonitoringSessionsForSupervisor(supervisorDn, callStateMap).some(
    (s) => isBargeInType(s.monitoringType),
  );
}

/**
 * Returns true when the agent DN is currently being silently monitored
 * (and the supervisor has not yet barged in).
 */
export function agentIsBeingSilentlyMonitored(
  agentDn: string,
  callStateMap: CtiCallStateMap,
): boolean {
  const info = getMonitoringInfoForMonitoredDn(agentDn, callStateMap);
  if (!info) return false;
  return !isBargeInType(info.monitoringType);
}

/**
 * Returns the callId for the call that is being used as the monitoring vehicle
 * for the given supervisor DN, or undefined if not monitoring.
 */
export function getMonitoringCallIdForSupervisor(
  supervisorDn: string,
  callStateMap: CtiCallStateMap,
): string | undefined {
  for (const call of Object.values(callStateMap)) {
    if (call.isTerminating) continue;
    const live = getLiveParties(call);
    const supervisorIsLive = live.some(
      (p) =>
        ctiAddressesEquivalent(p.callingAddress, supervisorDn) ||
        ctiAddressesEquivalent(p.calledAddress, supervisorDn),
    );
    if (supervisorIsLive && call.isMonitoring !== false) {
      return call.callId;
    }
  }
  return undefined;
}
