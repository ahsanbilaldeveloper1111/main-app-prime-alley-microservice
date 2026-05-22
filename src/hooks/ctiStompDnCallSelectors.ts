import type { CtiCallEvent } from "./ctiStompHookTypes";
import { pickMostRecentCall } from "./ctiStompHelpers";
import { ctiAddressesEquivalent } from "../utils/ctiAddressMatching";
import { dnHasLiveCustomerConversationOnCall } from "../utils/ctiMonitoringCallParties";

type Party = Record<string, unknown>;

function partyInvolvesDn(p: Party, dn: string): boolean {
  return (
    ctiAddressesEquivalent(p.callingAddress as string | undefined, dn) ||
    ctiAddressesEquivalent(p.calledAddress as string | undefined, dn)
  );
}

function partyIsNonTerminal(p: Party): boolean {
  const status = String(p.callStatus ?? "").toUpperCase();
  return status !== "DROPPED" && status !== "DISCONNECTED" && status !== "ENDED";
}

function callHasNonTerminalPartyForDn(call: CtiCallEvent, dn: string): boolean {
  return Boolean(call.parties?.some((p) => partyInvolvesDn(p, dn) && partyIsNonTerminal(p)));
}

/**
 * Whether this call should surface as active for the DN on wallboard / GFB.
 * Ringing legs count; stale supervision-only legs (no customer) do not.
 */
function callCountsAsActiveForDn(call: CtiCallEvent, dn: string): boolean {
  if (call.isTerminating) {
    return false;
  }
  if (!callHasNonTerminalPartyForDn(call, dn)) {
    return false;
  }
  if (call.currentState === "RINGING") {
    return call.parties?.some(
      (p) => partyInvolvesDn(p, dn) && String(p.callStatus ?? "").toUpperCase() === "RINGING",
    ) ?? false;
  }
  return dnHasLiveCustomerConversationOnCall(call, dn);
}

/** Calls involving DN — lifted from useCtiStomp for cognitive complexity. */
export function getCallStatesForDnFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): CtiCallEvent[] {
  return Object.values(callStateMap).filter((call) => callCountsAsActiveForDn(call, dn));
}

export function hasActiveCallsInMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): boolean {
  return Object.values(callStateMap).some((call) => callCountsAsActiveForDn(call, dn));
}

/** Most recent call state for DN — lifted from useCtiStomp. */
export function getDnCallStateFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
): (CtiCallEvent & { role: string; isActive: boolean }) | null {
  const calls = getCallStatesForDnFromMap(callStateMap, dn);
  if (!calls.length) return null;

  const mostRecent = pickMostRecentCall(calls);

  const matchedParty = mostRecent.parties?.find(
    (p: Party) => partyInvolvesDn(p, dn) && partyIsNonTerminal(p),
  );

  if (!matchedParty) return null;

  const activeParties =
    mostRecent.parties?.filter((p: Party) => partyIsNonTerminal(p)) ?? [];

  if (activeParties.length === 0) return null;

  return {
    ...mostRecent,
    parties: activeParties,
    role: ctiAddressesEquivalent(matchedParty.callingAddress as string | undefined, dn)
      ? "calling"
      : "called",
    isActive: true,
  };
}

function partyMatchesDnAndDevice(
  p: Party,
  dn: string,
  deviceName: string,
): boolean {
  return (
    (ctiAddressesEquivalent(p.callingAddress as string | undefined, dn) &&
      p.callingDeviceName === deviceName) ||
    (ctiAddressesEquivalent(p.calledAddress as string | undefined, dn) &&
      p.calledDeviceName === deviceName)
  );
}

/** Call state for a DN + device — lifted from useCtiStomp. */
export function getCallStateForDeviceFromMap(
  callStateMap: Record<string, CtiCallEvent>,
  dn: string,
  deviceName: string,
): (CtiCallEvent & { role: string; isActive: boolean }) | null {
  const filtered = Object.values(callStateMap).filter(
    (call) =>
      !call.isTerminating &&
      call.parties?.some(
        (p: Party) => partyMatchesDnAndDevice(p, dn, deviceName) && partyIsNonTerminal(p),
      ),
  );

  if (!filtered.length) return null;

  const mostRecent = pickMostRecentCall(filtered);

  if (!dnHasLiveCustomerConversationOnCall(mostRecent, dn)) {
    return null;
  }

  const matchedParty = mostRecent.parties?.find(
    (p: Party) => partyMatchesDnAndDevice(p, dn, deviceName) && partyIsNonTerminal(p),
  );

  if (!matchedParty) return null;

  const activeParties =
    mostRecent.parties?.filter((p: Party) => partyIsNonTerminal(p)) ?? [];

  if (activeParties.length === 0) return null;

  return {
    ...mostRecent,
    parties: activeParties,
    role: ctiAddressesEquivalent(matchedParty.callingAddress as string | undefined, dn)
      ? "calling"
      : "called",
    isActive: true,
  };
}
