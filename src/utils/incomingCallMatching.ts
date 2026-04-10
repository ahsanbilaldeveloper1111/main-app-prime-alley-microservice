/** Synthetic fallback ids from CTI event handlers when the event omitted `callId`. */
const SYNTHETIC_INCOMING_ID_PREFIX = "incoming_";

export type CtiCallPartyLike = Readonly<{
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
}>;

export type IncomingCallMatchable = Readonly<{
  callId: string;
  callingAddress: string;
  calledAddress: string;
}>;

export function hasReliableCtiCallId(callId: string | undefined): boolean {
  return Boolean(callId && !callId.startsWith(SYNTHETIC_INCOMING_ID_PREFIX));
}

/** Match an activeCalls entry to incoming popup state (reject/hold flows). */
export function isSameCtiCallForActiveLookup(
  active: CtiCallPartyLike,
  incoming: IncomingCallMatchable,
): boolean {
  if (hasReliableCtiCallId(incoming.callId)) {
    return active.callId === incoming.callId;
  }
  return (
    active.callingAddress === incoming.callingAddress &&
    active.calledAddress === incoming.calledAddress
  );
}

/**
 * Only auto-dismiss the incoming UI when the same call leg is answered elsewhere (e.g. Jabber).
 * Requires matching **reliable** `callId` on both sides — aggregate `connected` state from consult/transfer
 * must not clear the attend/reject dialog when our party is still ringing.
 * Ignores `dialing`; synthetic `incoming_*` ids never auto-dismiss here (timeout / explicit action still apply).
 */
export function shouldDismissIncomingModalForAnsweredElsewhere(
  active: CtiCallPartyLike & Readonly<{ status: string }>,
  incoming: IncomingCallMatchable,
): boolean {
  if (active.status !== "connected" && active.status !== "onHold") {
    return false;
  }
  if (
    !hasReliableCtiCallId(active.callId) ||
    !hasReliableCtiCallId(incoming.callId)
  ) {
    return false;
  }
  return active.callId === incoming.callId;
}

/**
 * Dismiss incoming UI on terminal events when the event clearly refers to this session.
 * - **ENDED**: same reliable `callId` is enough.
 * - **DISCONNECTED / DROPPED**: same `callId` and the party’s **calledAddress** must match our
 *   incoming callee DN (digit-tailed), so a consult/transfer leg dropping on another DN does not
 *   close a still-ringing primary offer.
 */
export function shouldCloseIncomingModalOnCallEndEvent(
  eventData: CtiCallPartyLike,
  incoming: IncomingCallMatchable,
  eventType?: string,
): boolean {
  if (
    !hasReliableCtiCallId(eventData.callId) ||
    !hasReliableCtiCallId(incoming.callId)
  ) {
    return false;
  }
  if (eventData.callId !== incoming.callId) {
    return false;
  }
  const et = (eventType ?? "").toUpperCase();
  if (et === "DISCONNECTED" || et === "DROPPED") {
    return addressesMatchForAttend(
      eventData.calledAddress,
      incoming.calledAddress,
    );
  }
  return true;
}

/** Rows from CTI `activeCalls` include normalized `status` (see CtiContext `mapCtiCallStatusToLocalStatus`). */
export type CtiActiveCallRowForAttend = CtiCallPartyLike &
  Readonly<{
    status?: string;
  }>;

export type CtiCallStatePartyForAttend = Readonly<{
  callStatus?: string;
  callingAddress?: string;
  calledAddress?: string;
}>;

export type CtiCallStateEntryForAttend = Readonly<{
  parties?: ReadonlyArray<CtiCallStatePartyForAttend>;
}>;

export type ResolveCallIdForAttendApiOptions = Readonly<{
  /** From `useCti().callStateMap` — needed when aggregate row `status` is onHold/connected but a party is still RINGING (transfer target). */
  callStateMap?: Readonly<
    Record<string, CtiCallStateEntryForAttend | undefined>
  >;
}>;

const ANSWER_ELIGIBLE_LOCAL_STATUSES = new Set(["ringing", "dialing"]);

function normalizeAddressDigitsTail(address?: string): string {
  if (!address) return "";
  const digitsOnly = address.replaceAll(/\D/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
}

function addressesMatchForAttend(a?: string, b?: string): boolean {
  if (a != null && b != null && a === b) return true;
  const na = normalizeAddressDigitsTail(a);
  const nb = normalizeAddressDigitsTail(b);
  return na.length > 0 && na === nb;
}

function rowPartiesMatchIncoming(
  row: CtiActiveCallRowForAttend,
  incoming: IncomingCallMatchable,
): boolean {
  if (!hasReliableCtiCallId(row.callId)) return false;
  return (
    addressesMatchForAttend(row.callingAddress, incoming.callingAddress) &&
    addressesMatchForAttend(row.calledAddress, incoming.calledAddress)
  );
}

function hasRingingPartyForIncomingCallee(
  callId: string | undefined,
  incoming: IncomingCallMatchable,
  callStateMap: ResolveCallIdForAttendApiOptions["callStateMap"],
): boolean {
  if (!callId || !callStateMap) return false;
  const parties = callStateMap[callId]?.parties;
  if (!parties?.length) return false;
  return parties.some((p) => {
    if (!addressesMatchForAttend(p.calledAddress, incoming.calledAddress))
      return false;
    const s = (p.callStatus || "").toUpperCase();
    return s === "RINGING" || s === "ALERTING" || s === "PROCEEDING";
  });
}

function isRowAnswerEligibleForAttend(
  row: CtiActiveCallRowForAttend,
  incoming: IncomingCallMatchable,
  callStateMap: ResolveCallIdForAttendApiOptions["callStateMap"],
): boolean {
  const st = (row.status || "").toLowerCase();
  if (ANSWER_ELIGIBLE_LOCAL_STATUSES.has(st)) return true;
  return hasRingingPartyForIncomingCallee(row.callId, incoming, callStateMap);
}

function compareAttendCandidates(
  a: CtiActiveCallRowForAttend,
  b: CtiActiveCallRowForAttend,
  incoming: IncomingCallMatchable,
  callStateMap: ResolveCallIdForAttendApiOptions["callStateMap"],
): number {
  const ringA = hasRingingPartyForIncomingCallee(
    a.callId,
    incoming,
    callStateMap,
  );
  const ringB = hasRingingPartyForIncomingCallee(
    b.callId,
    incoming,
    callStateMap,
  );
  if (ringA !== ringB) return ringA ? -1 : 1;
  const sa = (a.status || "").toLowerCase();
  const sb = (b.status || "").toLowerCase();
  const rank = (s: string) => {
    if (s === "ringing") {
      return 0;
    } else if (s === "dialing") {
      return 1;
    } else {
      return 2;
    }
  };
  return rank(sa) - rank(sb);
}

/**
 * CTI answer/reject APIs need the **current** leg id. RINGING / INCOMING_CALL events may carry a
 * stale id; `activeCalls` aggregate `status` is often onHold/connected during consult while
 * `callStateMap` parties still show the callee RINGING — use per-party state when present.
 * Party addresses are matched with digit-tail normalization (same idea as floating bar helpers).
 */
export function resolveCallIdForAttendApi(
  incoming: IncomingCallMatchable,
  activeCallRows: ReadonlyArray<CtiActiveCallRowForAttend>,
  options?: ResolveCallIdForAttendApiOptions,
): { callId: string; resolvedFrom: "incoming" | "activeCalls" | "unresolved" } {
  const callStateMap = options?.callStateMap;

  const partyMatches = activeCallRows.filter((c) =>
    rowPartiesMatchIncoming(c, incoming),
  );

  let answerEligible = partyMatches.filter((c) =>
    isRowAnswerEligibleForAttend(c, incoming, callStateMap),
  );

  if (answerEligible.length === 0 && callStateMap) {
    answerEligible = activeCallRows.filter(
      (c) =>
        hasReliableCtiCallId(c.callId) &&
        isRowAnswerEligibleForAttend(c, incoming, callStateMap),
    );
  }

  const sorted = [...answerEligible].sort((a, b) =>
    compareAttendCandidates(a, b, incoming, callStateMap),
  );

  if (sorted.length > 0) {
    let chosen = sorted[0];
    if (sorted.length > 1 && hasReliableCtiCallId(incoming.callId)) {
      const divergent = sorted.find((c) => c.callId !== incoming.callId);
      if (divergent) {
        chosen = divergent;
      }
    }
    return { callId: chosen.callId as string, resolvedFrom: "activeCalls" };
  }

  if (hasReliableCtiCallId(incoming.callId)) {
    return { callId: incoming.callId, resolvedFrom: "incoming" };
  }

  const fallback = partyMatches[0];
  if (fallback?.callId) {
    return { callId: fallback.callId, resolvedFrom: "activeCalls" };
  }

  return { callId: incoming.callId, resolvedFrom: "unresolved" };
}

/** Suppress duplicate RINGING / INCOMING_CALL reopen while the same session is already shown. */
export function isDuplicateRingingEventForOpenModal(
  eventData: CtiCallPartyLike,
  cur: IncomingCallMatchable,
): boolean {
  if (hasReliableCtiCallId(cur.callId)) {
    return (
      hasReliableCtiCallId(eventData.callId) && eventData.callId === cur.callId
    );
  }
  return (
    eventData.callingAddress === cur.callingAddress &&
    eventData.calledAddress === cur.calledAddress
  );
}
