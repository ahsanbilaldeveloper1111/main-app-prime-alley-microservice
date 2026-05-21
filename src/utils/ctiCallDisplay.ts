/** Live party statuses for CTI call display (wallboard cards, GFB, live-calls helpers). */

const TERMINAL_PARTY_STATUSES = new Set(["DROPPED", "DISCONNECTED", "ENDED"]);

export type ConferenceDisplayCall = {
  isConference?: boolean;
  isOneToOne?: boolean;
  isMonitoring?: boolean;
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  } | null;
  parties?: Array<{ callStatus?: string }>;
};

export function partyIsLiveForCtiDisplay(p: { callStatus?: string }): boolean {
  return !TERMINAL_PARTY_STATUSES.has(String(p.callStatus ?? "").toUpperCase());
}

export function countLiveCallParties(
  parties: Array<{ callStatus?: string }> | undefined,
): number {
  return (parties ?? []).filter(partyIsLiveForCtiDisplay).length;
}

/** Barge / silent / whisper adds a supervisor leg — not a native multi-party conference. */
export function callIsSupervisionOrBargeSession(
  call: ConferenceDisplayCall,
): boolean {
  if (call.isMonitoring === true) {
    return true;
  }
  const m = call.monitoring;
  if (m?.monitorDn && m?.monitoredDn) {
    return true;
  }
  const mt = String(m?.monitoringType ?? "").trim();
  return mt.length > 0;
}

/**
 * Conference badge/label only for direct/native conferences (3+ live legs, not supervision).
 * After barge-in, CTI may keep `isConference: true` with 3 live parties — those must not qualify.
 */
export function isDisplayConferenceCall(call: ConferenceDisplayCall): boolean {
  if (callIsSupervisionOrBargeSession(call)) {
    return false;
  }
  return countLiveCallParties(call.parties) > 2;
}

/** Direct conference calls are not eligible for silent / whisper / barge monitoring. */
export function isDirectConferenceCallNotMonitorable(
  call: ConferenceDisplayCall,
): boolean {
  return isDisplayConferenceCall(call);
}

/** Align conference flags with live party count so downstream UI does not read stale CTI metadata. */
export function normalizeConferenceFlagsForLiveParties<
  T extends ConferenceDisplayCall,
>(call: T): T {
  const liveCount = countLiveCallParties(call.parties);
  if (callIsSupervisionOrBargeSession(call) || liveCount <= 2) {
    return { ...call, isConference: false, isOneToOne: true };
  }
  return {
    ...call,
    isConference: call.isConference !== false,
    isOneToOne: false,
  };
}
