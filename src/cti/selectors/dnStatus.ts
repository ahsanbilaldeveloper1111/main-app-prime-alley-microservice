/**
 * DN status selectors.
 *
 * Derives the logical status for a DN (extension) from the device map and
 * the live call state map.
 *
 * Pure functions — no React, no side effects.
 */

import type { CtiCallStateMap, CtiDnEntry, CtiDnStatus, CtiDnsMap } from "../types";
import { ctiAddressesEquivalent } from "../../utils/ctiAddressMatching";
import { callHasLiveAgentPartyWithNonSupervisor } from "../../utils/ctiMonitoringCallParties";
import { getLiveParties } from "./activeCalls";

const ONLINE_TERMINAL_STATES = new Set(["IN_SERVICE", "REGISTERED", "IDLE"]);
const OFFLINE_STATES = new Set(["OUT_OF_SERVICE", "UNREGISTERED"]);

/**
 * Returns the combined logical status for a DN from its device registration
 * state and any live call in the call state map.
 */
export function getDnStatus(
  dn: string,
  dnsMap: CtiDnsMap,
  callStateMap: CtiCallStateMap,
): CtiDnStatus {
  const onCall = getDnOnCallStatus(dn, callStateMap);
  if (onCall !== null) {
    return onCall;
  }

  const entry = dnsMap[dn];
  if (!entry) return "unknown";

  const devices = Object.values(entry.devices ?? {});
  if (devices.length === 0) return "unknown";

  const anyOnline = devices.some((d) =>
    ONLINE_TERMINAL_STATES.has(String(d.terminalState ?? "").toUpperCase()) ||
    String(d.status ?? "").toUpperCase() === "AVAILABLE",
  );
  const anyOffline = devices.some((d) =>
    OFFLINE_STATES.has(String(d.terminalState ?? "").toUpperCase()),
  );

  if (anyOnline) return "idle";
  if (anyOffline) return "unknown";
  return "unknown";
}

/**
 * Returns a call-based status if the DN has a live leg, or `null` if idle.
 */
function getDnOnCallStatus(
  dn: string,
  callStateMap: CtiCallStateMap,
): CtiDnStatus | null {
  for (const call of Object.values(callStateMap)) {
    if (call.isTerminating) continue;

    const monitorDn = call.monitoring?.monitorDn;
    const monitoredDn = call.monitoring?.monitoredDn;

    if (call.isMonitoring && monitorDn && ctiAddressesEquivalent(monitorDn, dn)) {
      if (
        monitoredDn &&
        callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)
      ) {
        return "monitoring";
      }
      continue;
    }

    for (const p of getLiveParties(call)) {
      const involved =
        ctiAddressesEquivalent(p.callingAddress, dn) ||
        ctiAddressesEquivalent(p.calledAddress, dn);
      if (!involved) continue;

      if (
        call.isMonitoring &&
        monitoredDn &&
        ctiAddressesEquivalent(monitoredDn, dn) &&
        monitorDn &&
        !callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)
      ) {
        continue;
      }

      const status = String(p.callStatus ?? "").toUpperCase();
      if (status === "RINGING") return "ringing";
      if (status === "ON_HOLD" || status === "HELD") return "onHold";
      return "onCall";
    }
  }
  return null;
}

/**
 * Returns the first device entry for a given DN, or undefined.
 */
export function getDeviceForDn(
  dn: string,
  dnsMap: CtiDnsMap,
): CtiDnEntry | undefined {
  return dnsMap[dn];
}

/**
 * Returns all DNs that are currently in the given status.
 */
export function getDnsByStatus(
  dnsMap: CtiDnsMap,
  callStateMap: CtiCallStateMap,
  targetStatus: CtiDnStatus,
): string[] {
  return Object.keys(dnsMap).filter(
    (dn) => getDnStatus(dn, dnsMap, callStateMap) === targetStatus,
  );
}
