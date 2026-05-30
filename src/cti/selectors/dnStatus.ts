/**
 * DN status selectors.
 *
 * Derives the logical status for a DN (extension) from the device map and
 * the live call state map.
 *
 * Pure functions — no React, no side effects.
 */

import type {
  CtiCallEvent,
  CtiCallStateMap,
  CtiDnEntry,
  CtiDnStatus,
  CtiDnsMap,
  CtiPartyLeg,
} from "../types";
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

function partyInvolvesDn(party: CtiPartyLeg, dn: string): boolean {
  return (
    ctiAddressesEquivalent(party.callingAddress, dn) ||
    ctiAddressesEquivalent(party.calledAddress, dn)
  );
}

function statusFromLivePartyCallStatus(
  callStatus: string | undefined,
): CtiDnStatus {
  const status = String(callStatus ?? "").toUpperCase();
  if (status === "RINGING") {
    return "ringing";
  }
  if (status === "ON_HOLD" || status === "HELD") {
    return "onHold";
  }
  return "onCall";
}

function isMonitoredAgentObservationOnlyLeg(
  call: CtiCallEvent,
  dn: string,
  monitorDn: string | undefined,
  monitoredDn: string | undefined,
): boolean {
  if (!call.isMonitoring || !monitoredDn || !monitorDn) {
    return false;
  }
  if (!ctiAddressesEquivalent(monitoredDn, dn)) {
    return false;
  }
  return !callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn);
}

type SupervisorDnCallProbe = "monitoring" | "skip-call" | "check-parties";

function probeSupervisorMonitoringForDn(
  dn: string,
  call: CtiCallEvent,
): SupervisorDnCallProbe {
  const monitorDn = call.monitoring?.monitorDn;
  if (!call.isMonitoring || !monitorDn || !ctiAddressesEquivalent(monitorDn, dn)) {
    return "check-parties";
  }
  const monitoredDn = call.monitoring?.monitoredDn;
  if (
    monitoredDn &&
    callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)
  ) {
    return "monitoring";
  }
  return "skip-call";
}

function tryDnStatusFromCall(
  dn: string,
  call: CtiCallEvent,
): CtiDnStatus | null {
  if (call.isTerminating) {
    return null;
  }

  const supervisorProbe = probeSupervisorMonitoringForDn(dn, call);
  if (supervisorProbe === "monitoring") {
    return "monitoring";
  }
  if (supervisorProbe === "skip-call") {
    return null;
  }

  const monitorDn = call.monitoring?.monitorDn;
  const monitoredDn = call.monitoring?.monitoredDn;
  for (const party of getLiveParties(call)) {
    if (!partyInvolvesDn(party, dn)) {
      continue;
    }
    if (isMonitoredAgentObservationOnlyLeg(call, dn, monitorDn, monitoredDn)) {
      continue;
    }
    return statusFromLivePartyCallStatus(party.callStatus);
  }
  return null;
}

/**
 * Returns a call-based status if the DN has a live leg, or `null` if idle.
 */
function getDnOnCallStatus(
  dn: string,
  callStateMap: CtiCallStateMap,
): CtiDnStatus | null {
  for (const call of Object.values(callStateMap)) {
    const status = tryDnStatusFromCall(dn, call);
    if (status !== null) {
      return status;
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
