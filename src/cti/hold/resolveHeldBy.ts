/**
 * Resolve who put a call on hold from CTI HELD payloads and stored call state.
 *
 * Server contract (HELD events):
 * - Top-level: heldByAddress, heldByDeviceName
 * - Per-party holdSegments[]: { startTime, endTime, heldByAddress, heldByDeviceName }
 *   Active segment has endTime === null.
 */

export type CtiHoldSegment = {
  startTime?: string;
  endTime?: string | null;
  heldByAddress?: string;
  heldByDeviceName?: string;
};

export type CtiPartyWithHoldSegments = {
  callingAddress?: string;
  calledAddress?: string;
  callStatus?: string;
  holdSegments?: CtiHoldSegment[];
};

export type CtiHeldBySource = {
  heldByAddress?: string;
  heldByDeviceName?: string;
  parties?: CtiPartyWithHoldSegments[];
};

export type ResolvedHeldBy = {
  heldByAddress?: string;
  heldByDeviceName?: string;
};

function isNonEmptyAddress(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Active hold segment: endTime is null or absent while the leg remains on hold. */
export function getActiveHoldSegment(
  segments: CtiHoldSegment[] | undefined,
): CtiHoldSegment | undefined {
  if (!segments?.length) {
    return undefined;
  }
  return segments.find((seg) => seg.endTime == null || seg.endTime === "");
}

/** Extract holder from event-level fields or the active hold segment on any party. */
export function extractHeldByFromPayload(
  source: CtiHeldBySource | undefined,
  parties?: CtiPartyWithHoldSegments[],
): ResolvedHeldBy {
  if (!source) {
    return {};
  }

  if (isNonEmptyAddress(source.heldByAddress)) {
    return {
      heldByAddress: source.heldByAddress.trim(),
      heldByDeviceName: source.heldByDeviceName,
    };
  }

  const partyList = parties ?? source.parties ?? [];
  for (const party of partyList) {
    const active = getActiveHoldSegment(party.holdSegments);
    if (isNonEmptyAddress(active?.heldByAddress)) {
      return {
        heldByAddress: active.heldByAddress.trim(),
        heldByDeviceName: active.heldByDeviceName,
      };
    }
  }

  return {};
}

/** Resolve holder for stored call state (top-level field, then party holdSegments). */
export function resolveHeldByForCallState(
  callState: CtiHeldBySource | undefined,
): ResolvedHeldBy {
  return extractHeldByFromPayload(callState, callState?.parties);
}
