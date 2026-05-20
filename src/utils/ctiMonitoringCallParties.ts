import { ctiAddressesEquivalent } from "./ctiAddressMatching";

const TERMINAL_PARTY_STATUSES = new Set(["DROPPED", "DISCONNECTED", "ENDED"]);

export type CtiPartyLike = {
  callStatus?: string;
  callingAddress?: string;
  calledAddress?: string;
};

export type CtiCallPartiesSlice = {
  parties?: CtiPartyLike[];
};

export function partyIsLiveCtiParty(p: CtiPartyLike): boolean {
  return !TERMINAL_PARTY_STATUSES.has(String(p.callStatus ?? "").toUpperCase());
}

/**
 * True when the agent has a live leg with someone other than the supervisor (customer / PSTN / external).
 */
export function callHasLiveAgentPartyWithNonSupervisor(
  call: CtiCallPartiesSlice,
  agentDn: string,
  supervisorDn: string,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  return call.parties.some((p) => {
    if (!partyIsLiveCtiParty(p)) {
      return false;
    }
    const involvesAgent =
      ctiAddressesEquivalent(p.callingAddress, agentDn) ||
      ctiAddressesEquivalent(p.calledAddress, agentDn);
    if (!involvesAgent) {
      return false;
    }
    const otherParty =
      ctiAddressesEquivalent(p.callingAddress, agentDn)
        ? p.calledAddress
        : p.callingAddress;
    if (!otherParty) {
      return false;
    }
    return (
      !ctiAddressesEquivalent(otherParty, supervisorDn) &&
      !ctiAddressesEquivalent(otherParty, agentDn)
    );
  });
}
