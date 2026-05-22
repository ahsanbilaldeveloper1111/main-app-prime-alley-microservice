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

export type CtiMonitoringCallSlice = CtiCallPartiesSlice & {
  isTerminating?: boolean;
  isMonitoring?: boolean;
  monitoring?: {
    monitoringType?: string;
    monitorDn?: string;
    monitoredDn?: string;
  };
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

export function isMonitoringEndedEventType(eventType: string | undefined): boolean {
  return String(eventType ?? "").toUpperCase() === "MONITORING_ENDED";
}

export function monitoringPayloadMatchesPair(
  monitoring:
    | { monitorDn?: string; monitoredDn?: string }
    | undefined
    | null,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  if (!monitoring?.monitorDn || !monitoring?.monitoredDn) {
    return false;
  }
  return (
    ctiAddressesEquivalent(monitoring.monitorDn, monitorDn) &&
    ctiAddressesEquivalent(monitoring.monitoredDn, monitoredDn)
  );
}

export function isCtiSupervisionMonitoringType(
  monitoringType: string | undefined,
): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return (
    normalized === "BARGE_IN" ||
    normalized === "BARGEIN" ||
    normalized === "SILENT" ||
    normalized === "WHISPER"
  );
}

/** True when any non-terminating call still has a live agent↔customer/PSTN leg. */
export function agentHasLiveCustomerConversationInMap(
  callStateMap: Record<string, CtiCallPartiesSlice & { isTerminating?: boolean }>,
  agentDn: string,
  supervisorDn: string,
): boolean {
  for (const call of Object.values(callStateMap)) {
    if (call.isTerminating) {
      continue;
    }
    if (callHasLiveAgentPartyWithNonSupervisor(call, agentDn, supervisorDn)) {
      return true;
    }
  }
  return false;
}

/**
 * Tear down supervision / observation rows when the customer/PSTN leg ended (Jabber hang-up)
 * but CTI keeps a live supervisor↔agent leg and/or stale `isMonitoring` metadata.
 */
export function shouldPruneSupervisionOrStaleObservationCall(
  call: CtiMonitoringCallSlice,
  callStateMap?: Record<string, CtiMonitoringCallSlice>,
): boolean {
  const monitoring = call.monitoring;
  const monitorDn = monitoring?.monitorDn;
  const monitoredDn = monitoring?.monitoredDn;
  if (!monitorDn || !monitoredDn) {
    return false;
  }
  if (callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)) {
    return false;
  }
  const monitoringType = monitoring?.monitoringType;
  const supervisionSessionEnded =
    call.isMonitoring === false &&
    isCtiSupervisionMonitoringType(monitoringType);
  if (supervisionSessionEnded) {
    return true;
  }
  const map = callStateMap ?? { local: call };
  if (agentHasLiveCustomerConversationInMap(map, monitoredDn, monitorDn)) {
    return false;
  }
  const stillSupervision =
    call.isMonitoring === true ||
    isCtiSupervisionMonitoringType(monitoringType);
  if (stillSupervision) {
    return true;
  }
  return callHasLiveSupervisorAndAgentParties(call, monitorDn, monitoredDn);
}

/** @deprecated Use {@link shouldPruneSupervisionOrStaleObservationCall}. */
export function shouldTerminateSupervisionCallWithoutCustomer(
  call: CtiMonitoringCallSlice,
  callStateMap?: Record<string, CtiMonitoringCallSlice>,
): boolean {
  return shouldPruneSupervisionOrStaleObservationCall(call, callStateMap);
}

function callHasLiveSupervisorAndAgentParties(
  call: CtiCallPartiesSlice,
  supervisorDn: string,
  agentDn: string,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  const supervisor = String(supervisorDn);
  const agent = String(agentDn);
  return call.parties.some((p) => {
    if (!partyIsLiveCtiParty(p)) {
      return false;
    }
    const callingAddress = String(p.callingAddress ?? "");
    const calledAddress = String(p.calledAddress ?? "");
    return (
      (callingAddress === supervisor || calledAddress === supervisor) &&
      (callingAddress === agent || calledAddress === agent)
    );
  });
}

const TERMINAL_CUSTOMER_PARTY_STATUSES = new Set([
  "DROPPED",
  "DISCONNECTED",
  "ENDED",
]);

/** True when this call row shows a terminal customer/external leg for the agent. */
export function callHasEndedCustomerPartyForAgent(
  call: CtiCallPartiesSlice,
  agentDn: string,
  supervisorDn: string,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  for (const p of call.parties) {
    const involvesAgent =
      ctiAddressesEquivalent(p.callingAddress, agentDn) ||
      ctiAddressesEquivalent(p.calledAddress, agentDn);
    if (!involvesAgent) {
      continue;
    }
    const otherParty = ctiAddressesEquivalent(p.callingAddress, agentDn)
      ? p.calledAddress
      : p.callingAddress;
    if (
      !otherParty ||
      ctiAddressesEquivalent(otherParty, supervisorDn) ||
      ctiAddressesEquivalent(otherParty, agentDn)
    ) {
      continue;
    }
    const status = String(p.callStatus ?? "").toUpperCase();
    if (TERMINAL_CUSTOMER_PARTY_STATUSES.has(status)) {
      return true;
    }
  }
  return false;
}

/** True when this row belongs to the active supervision session for the pair. */
export function callRelatesToSupervisionPair(
  call: CtiMonitoringCallSlice,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  const m = call.monitoring;
  if (
    m?.monitorDn &&
    m?.monitoredDn &&
    monitoringPayloadMatchesPair(m, monitorDn, monitoredDn)
  ) {
    return true;
  }
  if (call.isMonitoring === true && monitoringPayloadMatchesPair(m, monitorDn, monitoredDn)) {
    return true;
  }
  return callHasLiveSupervisorAndAgentParties(call, monitorDn, monitoredDn);
}

function mapHasEndedCustomerPartyForAgent(
  callStateMap: Record<string, CtiMonitoringCallSlice>,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  for (const row of Object.values(callStateMap)) {
    if (callHasEndedCustomerPartyForAgent(row, monitoredDn, monitorDn)) {
      return true;
    }
  }
  return false;
}

function mapHasEndedCustomerPartyForSupervisionSession(
  callStateMap: Record<string, CtiMonitoringCallSlice>,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  for (const row of Object.values(callStateMap)) {
    if (!callRelatesToSupervisionPair(row, monitorDn, monitoredDn)) {
      continue;
    }
    if (callHasEndedCustomerPartyForAgent(row, monitoredDn, monitorDn)) {
      return true;
    }
  }
  return false;
}

/** Live supervisor↔agent leg (SILENT/WHISPER often have no customer on the same call row). */
export function callHasLiveSupervisorAgentObservationLeg(
  call: CtiCallPartiesSlice,
  supervisorDn: string,
  agentDn: string,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  return call.parties.some(
    (p) =>
      partyIsLiveCtiParty(p) &&
      (ctiAddressesEquivalent(p.callingAddress, supervisorDn) ||
        ctiAddressesEquivalent(p.calledAddress, supervisorDn)) &&
      (ctiAddressesEquivalent(p.callingAddress, agentDn) ||
        ctiAddressesEquivalent(p.calledAddress, agentDn)),
  );
}

/**
 * True when the customer/PSTN leg has ended (terminal party evidence), not merely absent at session start.
 * Used by GFB and wallboard to end supervision UI when the customer hangs up first.
 */
export function supervisionCustomerConversationEnded(
  call: CtiCallPartiesSlice | undefined,
  callStateMap: Record<string, CtiMonitoringCallSlice> | undefined,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  if (
    call &&
    callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)
  ) {
    return false;
  }
  if (callStateMap && Object.keys(callStateMap).length > 0) {
    if (agentHasLiveCustomerConversationInMap(callStateMap, monitoredDn, monitorDn)) {
      return false;
    }
    return mapHasEndedCustomerPartyForSupervisionSession(
      callStateMap,
      monitoredDn,
      monitorDn,
    );
  }
  if (call) {
    return callHasEndedCustomerPartyForAgent(call, monitoredDn, monitorDn);
  }
  return false;
}

/** Wallboard / user card: DN should not show CONNECTED when only a stale supervision leg remains. */
export function dnHasLiveCustomerConversationOnCall(
  call: CtiMonitoringCallSlice,
  dn: string,
): boolean {
  const m = call.monitoring;
  if (!m?.monitorDn || !m?.monitoredDn) {
    return partyIsLiveCtiPartyForDn(call, dn);
  }
  if (String(dn) === String(m.monitoredDn)) {
    return callHasLiveAgentPartyWithNonSupervisor(call, m.monitoredDn, m.monitorDn);
  }
  if (String(dn) === String(m.monitorDn)) {
    return callHasLiveAgentPartyWithNonSupervisor(call, m.monitoredDn, m.monitorDn);
  }
  return partyIsLiveCtiPartyForDn(call, dn);
}

function partyIsLiveCtiPartyForDn(call: CtiCallPartiesSlice, dn: string): boolean {
  if (!call.parties?.length) {
    return false;
  }
  return call.parties.some(
    (p) =>
      partyIsLiveCtiParty(p) &&
      (ctiAddressesEquivalent(p.callingAddress, dn) ||
        ctiAddressesEquivalent(p.calledAddress, dn)),
  );
}
