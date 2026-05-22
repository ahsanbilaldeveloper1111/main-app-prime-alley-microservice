/**
 * Wallboard section placement for supervision (Live Coaching) — split by monitoring mode
 * so SILENT / WHISPER / BARGE_IN rules do not fight each other in one branch.
 */
import type { ActiveMonitoring } from "@components/live-calls/utils/types";
import type { CategorizeDnsParams } from "@components/live-calls/utils/types";
import {
  isBargeInMonitoringType,
  isSilentMonitoringType,
  isWhisperMonitoringType,
} from "@components/communications/wallboards-live/wallboardEventParsing";
import { ctiAddressesEquivalent } from "@utils/ctiAddressMatching";
import {
  callHasLiveAgentPartyWithNonSupervisor,
  callHasLiveSupervisorAgentObservationLeg,
} from "@utils/ctiMonitoringCallParties";

type LooseCall = {
  isTerminating?: boolean;
  isMonitoring?: boolean;
  parties?: Array<{
    callingAddress?: string;
    calledAddress?: string;
    callStatus?: string;
  }>;
};

type CallParty = NonNullable<LooseCall["parties"]>[number];

function partyInvolvesDn(p: CallParty, dn: string): boolean {
  return (
    ctiAddressesEquivalent(p.callingAddress, dn) ||
    ctiAddressesEquivalent(p.calledAddress, dn)
  );
}

function partyIsLive(p: CallParty): boolean {
  return p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED";
}

function partyInvolvesBoth(p: CallParty, dnA: string, dnB: string): boolean {
  return partyInvolvesDn(p, dnA) && partyInvolvesDn(p, dnB);
}

function hasSupervisorAgentActiveMonitoringCall(
  calls: LooseCall[],
  supervisorDn: string,
  agentDn: string,
): boolean {
  return calls.some((c) => {
    if (c.isTerminating || !c.parties?.length) {
      return false;
    }
    const hasMatchingLeg = c.parties.some((p) =>
      partyInvolvesBoth(p, supervisorDn, agentDn),
    );
    if (!hasMatchingLeg) {
      return false;
    }
    if (
      !c.parties.some(
        (p) => partyInvolvesBoth(p, supervisorDn, agentDn) && partyIsLive(p),
      )
    ) {
      return false;
    }
    return callHasLiveAgentPartyWithNonSupervisor(c, agentDn, supervisorDn);
  });
}

function callsHaveLiveSupervisorAgentObservationLeg(
  calls: LooseCall[],
  supervisorDn: string,
  agentDn: string,
): boolean {
  return calls.some(
    (c) =>
      !c.isTerminating &&
      callHasLiveSupervisorAgentObservationLeg(c, supervisorDn, agentDn),
  );
}

function monitoredCallHasActiveParties(
  monitoredCall: LooseCall | null | undefined,
): boolean {
  if (!monitoredCall || monitoredCall.isTerminating || !monitoredCall.parties?.length) {
    return false;
  }
  return monitoredCall.parties.some((p) => partyIsLive(p));
}

function isSupervisionWallboardTarget(
  dn: string,
  activeMonitoring: ActiveMonitoring,
): activeMonitoring is ActiveMonitoring & {
  dn: string;
  monitor: string;
  type: string;
} {
  return Boolean(
    activeMonitoring.monitor &&
      activeMonitoring.dn &&
      activeMonitoring.type &&
      ctiAddressesEquivalent(dn, activeMonitoring.monitor),
  );
}

function agentHasLiveCustomerOnAgentCalls(
  agentCalls: LooseCall[],
  agentDn: string,
  monitorDn: string,
): boolean {
  return agentCalls.some(
    (c) =>
      !c.isTerminating &&
      callHasLiveAgentPartyWithNonSupervisor(c, agentDn, monitorDn),
  );
}

function agentCallHasConferenceBargeWithCustomer(
  agentCalls: LooseCall[],
  agentDn: string,
  supervisorDn: string,
): boolean {
  return agentCalls.some((c) => {
    if (c.isTerminating || !c.parties?.length || c.isMonitoring !== true) {
      return false;
    }
    return callHasLiveAgentPartyWithNonSupervisor(c, agentDn, supervisorDn);
  });
}

/** BARGE_IN: supervisor in Live Coaching only while customer + barge legs are live. */
function resolveBargeInSupervisionSection(
  supervisorCalls: LooseCall[],
  agentCalls: LooseCall[],
  agentDn: string,
  monitorDn: string,
): string | null {
  if (!agentHasLiveCustomerOnAgentCalls(agentCalls, agentDn, monitorDn)) {
    return null;
  }
  const bargeSessionActive =
    hasSupervisorAgentActiveMonitoringCall(supervisorCalls, monitorDn, agentDn) ||
    agentCallHasConferenceBargeWithCustomer(agentCalls, agentDn, monitorDn) ||
    hasSupervisorAgentActiveMonitoringCall(agentCalls, monitorDn, agentDn);
  return bargeSessionActive ? "supervision" : null;
}

function resolveFromCallLegs(
  supervisorCalls: LooseCall[],
  agentCalls: LooseCall[],
  monitorDn: string,
  agentDn: string,
): string | null {
  if (
    hasSupervisorAgentActiveMonitoringCall(supervisorCalls, monitorDn, agentDn) ||
    hasSupervisorAgentActiveMonitoringCall(agentCalls, monitorDn, agentDn)
  ) {
    return "supervision";
  }
  if (
    callsHaveLiveSupervisorAgentObservationLeg(supervisorCalls, monitorDn, agentDn) ||
    callsHaveLiveSupervisorAgentObservationLeg(agentCalls, monitorDn, agentDn)
  ) {
    return "supervision";
  }
  return null;
}

function resolveSupervisionFromMonitoredDevice(
  p: CategorizeDnsParams,
  agentDn: string,
): string | null {
  if (!p.activeMonitoring.deviceName) {
    return "supervision";
  }
  const monitoredCall = p.getCallStateForDevice(
    agentDn,
    p.activeMonitoring.deviceName,
  ) as LooseCall;
  return monitoredCallHasActiveParties(monitoredCall) ? "supervision" : null;
}

/**
 * SILENT / WHISPER: same Live Coaching placement rules — session flag first, then CTI legs.
 * Stable placement comes from {@link computeWallboardSupervisionSessionActive} + merged UI state,
 * not a stale dn/monitor fallback when the session has ended.
 */
function resolveSilentWhisperSupervisionSection(
  p: CategorizeDnsParams,
  supervisorCalls: LooseCall[],
  agentCalls: LooseCall[],
  agentDn: string,
  monitorDn: string,
): string | null {
  if (p.supervisionSessionActive) {
    return "supervision";
  }
  const fromLegs = resolveFromCallLegs(
    supervisorCalls,
    agentCalls,
    monitorDn,
    agentDn,
  );
  if (fromLegs) {
    return fromLegs;
  }
  if (agentHasLiveCustomerOnAgentCalls(agentCalls, agentDn, monitorDn)) {
    return "supervision";
  }
  return resolveSupervisionFromMonitoredDevice(p, agentDn);
}

/** Whether the supervisor (monitor) DN belongs in Live Coaching for the current session. */
export function resolveSupervisionSectionForWallboard(
  p: CategorizeDnsParams,
): string | null {
  const { dn, activeMonitoring, getCallStatesForDn } = p;
  if (!isSupervisionWallboardTarget(dn, activeMonitoring)) {
    return null;
  }

  const agentDn = activeMonitoring.dn;
  const monitorDn = activeMonitoring.monitor;
  const supervisorCalls = getCallStatesForDn(dn) as LooseCall[];
  const agentCalls = getCallStatesForDn(agentDn) as LooseCall[];

  if (isBargeInMonitoringType(activeMonitoring.type)) {
    if (p.supervisionSessionActive) {
      return "supervision";
    }
    return resolveBargeInSupervisionSection(
      supervisorCalls,
      agentCalls,
      agentDn,
      monitorDn,
    );
  }

  if (
    isSilentMonitoringType(activeMonitoring.type) ||
    isWhisperMonitoringType(activeMonitoring.type)
  ) {
    return resolveSilentWhisperSupervisionSection(
      p,
      supervisorCalls,
      agentCalls,
      agentDn,
      monitorDn,
    );
  }

  return resolveFromCallLegs(supervisorCalls, agentCalls, monitorDn, agentDn);
}
