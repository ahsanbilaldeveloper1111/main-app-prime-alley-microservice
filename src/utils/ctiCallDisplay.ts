/** Live party statuses for CTI call display (wallboard cards, GFB, live-calls helpers). */

const TERMINAL_PARTY_STATUSES = new Set(["DROPPED", "DISCONNECTED", "ENDED"]);

export function partyIsLiveForCtiDisplay(p: { callStatus?: string }): boolean {
  return !TERMINAL_PARTY_STATUSES.has(String(p.callStatus ?? "").toUpperCase());
}

export function countLiveCallParties(
  parties: Array<{ callStatus?: string }> | undefined,
): number {
  return (parties ?? []).filter(partyIsLiveForCtiDisplay).length;
}

/**
 * Conference badge/label only when 3+ simultaneous live legs exist.
 * After barge/transfer, CTI may keep `isConference: true` or extra DROPPED rows — those must not qualify.
 */
export function isDisplayConferenceCall(call: {
  isConference?: boolean;
  isOneToOne?: boolean;
  parties?: Array<{ callStatus?: string }>;
}): boolean {
  return countLiveCallParties(call.parties) > 2;
}

/** Align conference flags with live party count so downstream UI does not read stale CTI metadata. */
export function normalizeConferenceFlagsForLiveParties<
  T extends {
    isConference?: boolean;
    isOneToOne?: boolean;
    parties?: Array<{ callStatus?: string }>;
  },
>(call: T): T {
  const liveCount = countLiveCallParties(call.parties);
  if (liveCount <= 2) {
    return { ...call, isConference: false, isOneToOne: true };
  }
  return {
    ...call,
    isConference: call.isConference !== false,
    isOneToOne: false,
  };
}
