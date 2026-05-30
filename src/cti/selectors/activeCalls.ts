/**
 * Active-call selectors.
 *
 * Pure functions over CtiCallStateMap — no React, no side effects.
 * These are the single source of truth for what the UI renders in
 * the floating call bar, dialer, live-calls table, and wallboards.
 */

import { ctiAddressesEquivalent } from "../../utils/ctiAddressMatching";
import type { CtiActiveCall, CtiCallEvent, CtiCallStateMap, CtiPartyLeg } from "../types";

const TERMINAL_PARTY_STATUSES = new Set([
  "DROPPED",
  "DISCONNECTED",
  "ENDED",
]);

/** Returns the non-terminal parties for a call. */
export function getLiveParties(call: CtiCallEvent): CtiPartyLeg[] {
  return (call.parties ?? []).filter(
    (p) => !TERMINAL_PARTY_STATUSES.has(String(p.callStatus ?? "").toUpperCase()),
  );
}

/** Returns all non-terminating calls in the map. */
export function getActiveCalls(map: CtiCallStateMap): CtiCallEvent[] {
  return Object.values(map).filter((c) => !c.isTerminating);
}

/**
 * Returns calls where the given `userAddress` (DN/extension) is a live party.
 * Use this to scope the floating bar and dialer to the current user.
 */
export function getCallsForAddress(
  map: CtiCallStateMap,
  userAddress: string,
): CtiCallEvent[] {
  if (!userAddress) return [];
  return getActiveCalls(map).filter((call) =>
    getLiveParties(call).some(
      (p) =>
        ctiAddressesEquivalent(p.callingAddress, userAddress) ||
        ctiAddressesEquivalent(p.calledAddress, userAddress),
    ),
  );
}

/**
 * Derives the remote party's number/DN for the given user address on a call.
 * Returns the first address that is not the user's own DN.
 */
export function getRemoteAddressForCall(
  call: CtiCallEvent,
  userAddress: string,
): string | undefined {
  const live = getLiveParties(call);
  for (const p of live) {
    if (ctiAddressesEquivalent(p.callingAddress, userAddress)) {
      return p.calledAddress;
    }
    if (ctiAddressesEquivalent(p.calledAddress, userAddress)) {
      return p.callingAddress;
    }
  }
  return undefined;
}

/**
 * Maps a CtiCallEvent to the CtiActiveCall view-model used by the
 * floating bar and dialer UI.
 */
export function callEventToActiveCall(
  call: CtiCallEvent,
  userAddress: string,
): CtiActiveCall {
  const remoteNumber = getRemoteAddressForCall(call, userAddress) ?? "";
  const firstLiveLeg = getLiveParties(call)[0];
  const startTimeRaw = firstLiveLeg?.startTime;
  const startTime = startTimeRaw ? new Date(startTimeRaw) : new Date();

  return {
    id: call.callId,
    callId: call.callId,
    number: remoteNumber,
    status: mapCallStateToActiveCallStatus(call.currentState ?? call.eventType),
    startTime,
    callingAddress: firstLiveLeg?.callingAddress,
    calledAddress: firstLiveLeg?.calledAddress,
    callingDeviceName: firstLiveLeg?.callingDeviceName,
    callingDeviceType: firstLiveLeg?.callingDeviceType,
  };
}

/** Maps a CTI state string to the simpler active-call status used in UI. */
export function mapCallStateToActiveCallStatus(
  state: string | undefined,
): CtiActiveCall["status"] {
  const normalized = String(state ?? "").toUpperCase();
  switch (normalized) {
    case "RINGING":
    case "ALERTING":
    case "PROCEEDING":
      return "ringing";
    case "CONNECTED":
    case "ANSWERED":
    case "RETRIEVED":
      return "connected";
    case "ON_HOLD":
    case "HELD":
      return "onHold";
    case "ENDED":
    case "DISCONNECTED":
    case "DROPPED":
      return "ended";
    default:
      return "dialing";
  }
}

/**
 * Returns true when the call has at least one live party with status RINGING
 * targeting the given user address — indicates an inbound ring.
 */
export function isIncomingCallForAddress(
  call: CtiCallEvent,
  userAddress: string,
): boolean {
  return (call.parties ?? []).some(
    (p) =>
      String(p.callStatus ?? "").toUpperCase() === "RINGING" &&
      ctiAddressesEquivalent(p.calledAddress, userAddress),
  );
}
