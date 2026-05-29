import moment from "moment-timezone";
import { parseCallAnswerStartTimeUtc } from "@components/live-calls/utils/helpers";
import {
  getActiveHoldSegment,
  resolveHeldByForCallState,
} from "../cti/hold/resolveHeldBy";
import type { CtiHoldSegment } from "../cti/types";
import { isBargeInType } from "../cti/selectors/monitoring";
import {
  ctiAddressMatchesUser,
  ctiAddressesEquivalent,
  normalizeCtiAddressDigits,
} from "@utils/ctiAddressMatching";
import { findTerminalMonitoringClearInRecentLog } from "@components/communications/wallboards-live/wallboardEventParsing";
import {
  callHasLiveAgentPartyWithNonSupervisor,
  isCtiSupervisionMonitoringType,
  supervisionCustomerConversationEnded,
} from "@utils/ctiMonitoringCallParties";

/** Shape of entries in CTI `activeCalls` Map (floating bar). */
export type FloatingBarCtiCall = {
  id: string;
  number: string;
  startTime: Date;
  status: string;
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  callingDeviceType?: string;
  calledDeviceName?: string;
  duration?: number;
};

export type FloatingBarCallStateParty = {
  callStatus?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  calledDeviceName?: string;
  callingDeviceType?: string;
  calledDeviceType?: string;
  holdSegments?: CtiHoldSegment[];
};

export type FloatingBarCallStateEntry = {
  isMonitoring?: boolean;
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  };
  heldByAddress?: string;
  heldByDeviceName?: string;
  parties?: Array<FloatingBarCallStateParty>;
};

/** Matches CTI `dnsMap` keys = registered extension DNs (external PSTN is usually absent). */
export type FloatingBarDnsMap = Record<string, unknown>;

/** Keep in sync with `CtiContext` (`localStatusFromCallStateRecord`). */
const CTI_TERMINAL_PARTY_STATUSES = new Set([
  "ENDED",
  "DISCONNECTED",
  "DROPPED",
]);

const CTI_ACTIVE_LIKE_PARTY_STATUSES = new Set([
  "CONNECTED",
  "ANSWERED",
  "RETRIEVED",
  "RINGING",
  "ON_HOLD",
  "HELD",
]);

function partyStatusRaw(status: string | undefined): string {
  return status ?? "";
}

const normalizeAddressForComparison = normalizeCtiAddressDigits;
const addressesEquivalent = ctiAddressesEquivalent;

/**
 * True when CTI party list indicates the dialog is over (same rules as active-call map rebuild).
 * Prevents the floating bar from flipping back to "ringing" on stale RINGING legs after remote hang-up.
 */
function floatingBarPartiesIndicateCallEnded(
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
): boolean {
  const hasActiveLeg = parties.some((p) =>
    CTI_ACTIVE_LIKE_PARTY_STATUSES.has(partyStatusRaw(p.callStatus)),
  );
  const allTerminal = parties.every((p) =>
    CTI_TERMINAL_PARTY_STATUSES.has(partyStatusRaw(p.callStatus)),
  );
  if (
    allTerminal ||
    (!hasActiveLeg &&
      parties.some((p) =>
        CTI_TERMINAL_PARTY_STATUSES.has(partyStatusRaw(p.callStatus)),
      ))
  ) {
    return true;
  }
  return false;
}

/** True when every party row involving the user is in a terminal state (handles mixed stale legs). */
function userParticipatingPartiesAllTerminal(
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
  userAddress: string | null | undefined,
): boolean {
  if (!userAddress) {
    return false;
  }
  const mine = parties.filter(
    (p) =>
      addressesEquivalent(p.callingAddress, userAddress) ||
      addressesEquivalent(p.calledAddress, userAddress),
  );
  if (mine.length === 0) {
    return false;
  }
  return mine.every((p) =>
    CTI_TERMINAL_PARTY_STATUSES.has(partyStatusRaw(p.callStatus)),
  );
}

/** Same terminal supervision clears as the wallboard (DROPPED / MONITORING_ENDED in eventLog). */
function supervisionSessionEndedInEventLog(
  eventLog: readonly unknown[] | undefined,
  callState: FloatingBarCallStateEntry | undefined,
  userAddress: string | null | undefined,
): boolean {
  const m = callState?.monitoring;
  if (!eventLog?.length || !m?.monitorDn || !m?.monitoredDn || !userAddress) {
    return false;
  }
  if (!ctiAddressMatchesUser(m.monitorDn, userAddress)) {
    return false;
  }
  return (
    findTerminalMonitoringClearInRecentLog(eventLog, {
      dn: m.monitoredDn,
      monitor: m.monitorDn,
    }) != null
  );
}

function supervisorHasLivePartyOnCall(
  callState: FloatingBarCallStateEntry,
  userAddress: string,
): boolean {
  return (callState.parties ?? []).some(
    (p) =>
      partyIsLiveForFloatingBarInclusion(p) &&
      (addressesEquivalent(p.callingAddress, userAddress) ||
        addressesEquivalent(p.calledAddress, userAddress)),
  );
}

/**
 * Supervisor left supervision: explicit MONITORING_ENDED / eventLog terminal clear, or all of
 * their legs terminal while the agent customer leg may still be live (SILENT / WHISPER / BARGE_IN).
 * Active barge on a conference bridge often has no supervisor row in `parties` — not ended
 * while `isMonitoring` is true and the customer leg is live (unless eventLog says otherwise).
 */
function supervisorSupervisionEndedForUser(
  callState: FloatingBarCallStateEntry | undefined,
  userAddress: string | null | undefined,
  parties?: FloatingBarCallStateEntry["parties"],
  eventLog?: readonly unknown[],
  callStateMap?: Record<string, FloatingBarCallStateEntry> | undefined,
): boolean {
  if (!callState || !userAddress) {
    return false;
  }
  const m = callState.monitoring;
  if (!m?.monitorDn || !m?.monitoredDn || !ctiAddressMatchesUser(m.monitorDn, userAddress)) {
    return false;
  }
  if (supervisionSessionEndedInEventLog(eventLog, callState, userAddress)) {
    return true;
  }
  if (callState.isMonitoring === false) {
    return true;
  }
  if (isCtiSupervisionMonitoringType(m.monitoringType)) {
    if (
      supervisionCustomerConversationEnded(
        callState,
        callStateMap,
        m.monitoredDn,
        m.monitorDn,
      )
    ) {
      return true;
    }
    if (parties?.length && userParticipatingPartiesAllTerminal(parties, userAddress)) {
      return true;
    }
    if (isBargeInType(m.monitoringType)) {
      return false;
    }
  }
  return !supervisorHasLivePartyOnCall(callState, userAddress);
}

/**
 * After barge-in, CTI may DROPP the supervisor↔agent observation leg while the agent+customer
 * conference stays CONNECTED. Keep the bar only while monitoring is active and the customer
 * leg is still live (supervisor may have no explicit party row on the conference).
 */
function supervisorBargeConferenceStillLive(
  callState: FloatingBarCallStateEntry,
  userAddress: string,
): boolean {
  const m = callState.monitoring;
  if (
    callState.isMonitoring !== true ||
    !m?.monitorDn ||
    !m?.monitoredDn ||
    !isBargeInType(m.monitoringType)
  ) {
    return false;
  }
  if (!ctiAddressMatchesUser(m.monitorDn, userAddress)) {
    return false;
  }
  return callHasLiveAgentPartyWithNonSupervisor(
    callState,
    m.monitoredDn,
    m.monitorDn,
  );
}

function userShouldLeaveFloatingBarByPartyState(
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
  userAddress: string | null | undefined,
  callState: FloatingBarCallStateEntry | undefined,
  eventLog?: readonly unknown[],
  callStateMap?: Record<string, FloatingBarCallStateEntry> | undefined,
): boolean {
  if (floatingBarPartiesIndicateCallEnded(parties)) {
    return true;
  }
  if (
    supervisorSupervisionEndedForUser(
      callState,
      userAddress,
      parties,
      eventLog,
      callStateMap,
    )
  ) {
    return true;
  }
  if (!userParticipatingPartiesAllTerminal(parties, userAddress)) {
    return false;
  }
  if (callState && userAddress && supervisorBargeConferenceStillLive(callState, userAddress)) {
    return false;
  }
  return true;
}

function isDnRegisteredOnFloatingBar(
  dnsMap: FloatingBarDnsMap | undefined,
  address: string | undefined,
): boolean {
  if (!address || !dnsMap) return false;
  if (Object.hasOwn(dnsMap, address)) return true;
  const norm = normalizeAddressForComparison(address);
  if (!norm) return false;
  return Object.keys(dnsMap).some(
    (k) => normalizeAddressForComparison(k) === norm,
  );
}

/** Optional `parties[0]` framing (same as active floating-bar row) for hold initiator inference. */
export type FloatingBarHoldOrientation = {
  callingAddress?: string;
  calledAddress?: string;
};

function userParticipatingLiveParties(
  parties: FloatingBarCallStateParty[],
  userAddress: string,
): FloatingBarCallStateParty[] {
  return parties.filter(
    (p) =>
      partyIsLiveForFloatingBarInclusion(p) &&
      (addressesEquivalent(p.callingAddress, userAddress) ||
        addressesEquivalent(p.calledAddress, userAddress)),
  );
}

/** User is the active holder on this leg (HELD payloads may omit calling/called addresses). */
function partyMatchesUserByHoldSegment(
  party: FloatingBarCallStateParty,
  userAddress: string,
): boolean {
  if (!partyIsLiveForFloatingBarInclusion(party)) {
    return false;
  }
  const active = getActiveHoldSegment(party.holdSegments);
  const holder = active?.heldByAddress;
  return Boolean(holder && addressesEquivalent(holder, userAddress));
}

/** After transfer/consult, prefer the user's held leg over the first matching party row. */
function pickPrimaryUserPartyForHoldResume(
  parties: FloatingBarCallStateParty[],
  userAddress: string,
): FloatingBarCallStateParty | undefined {
  const mine = userParticipatingLiveParties(parties, userAddress);
  if (mine.length > 0) {
    const held = mine.find((p) => {
      const s = partyStatusRaw(p.callStatus).toUpperCase();
      return s === "ON_HOLD" || s === "HELD";
    });
    return held ?? mine[0];
  }
  return parties.find((p) => partyMatchesUserByHoldSegment(p, userAddress));
}

function userHasHeldLiveLeg(
  parties: FloatingBarCallStateParty[],
  userAddress: string,
): boolean {
  return parties.some((p) => {
    if (!partyIsLiveForFloatingBarInclusion(p)) {
      return false;
    }
    const s = partyStatusRaw(p.callStatus).toUpperCase();
    if (s !== "ON_HOLD" && s !== "HELD") {
      return false;
    }
    return (
      addressesEquivalent(p.callingAddress, userAddress) ||
      addressesEquivalent(p.calledAddress, userAddress) ||
      partyMatchesUserByHoldSegment(p, userAddress)
    );
  });
}

/** Hold/resume orient from the user's party row (not stale `parties[0]` / activeCalls top-level). */
export function resolveFloatingBarHoldOrientForUser(
  callState: FloatingBarCallStateEntry | undefined,
  userAddress: string | undefined,
  fallback?: FloatingBarHoldOrientation,
): FloatingBarHoldOrientation | undefined {
  if (!userAddress || !callState?.parties?.length) {
    return fallback;
  }
  const party = pickPrimaryUserPartyForHoldResume(
    callState.parties,
    userAddress,
  );
  if (!party) {
    return fallback;
  }
  return {
    callingAddress: party.callingAddress,
    calledAddress: party.calledAddress,
  };
}

/** When one leg is internal and one external, only the internal extension can hold/resume. */
function inferResumeAllowedFromDnsForParty(
  userAddress: string,
  ourParty: FloatingBarCallStateParty,
  dnsMap: FloatingBarDnsMap | undefined,
): boolean {
  const callerKnown = isDnRegisteredOnFloatingBar(
    dnsMap,
    ourParty.callingAddress,
  );
  const calleeKnown = isDnRegisteredOnFloatingBar(
    dnsMap,
    ourParty.calledAddress,
  );
  if (callerKnown !== calleeKnown) {
    return callerKnown
      ? addressesEquivalent(userAddress, ourParty.callingAddress)
      : addressesEquivalent(userAddress, ourParty.calledAddress);
  }
  // Both internal (consult / transfer / conference): if our leg is held, allow resume for either
  // participant on that leg — otherwise internal–internal holds show no Resume (Scenario 2).
  if (callerKnown && calleeKnown) {
    const status = partyStatusRaw(ourParty.callStatus).toUpperCase();
    if (status === "ON_HOLD" || status === "HELD") {
      return (
        addressesEquivalent(userAddress, ourParty.callingAddress) ||
        addressesEquivalent(userAddress, ourParty.calledAddress)
      );
    }
  }
  return false;
}

/**
 * Same heuristic as `computeHeldByAddress` in ctiStompHelpers (party snapshot only). When both sides
 * are internal, align the ON_HOLD leg with `orient` (caller/callee as in `parties[0]`) so a
 * swapped leg does not attribute hold to the wrong DN.
 */
function inferFloatingBarHoldInitiatorFromParties(
  parties: FloatingBarCallStateParty[],
  dnsMap: FloatingBarDnsMap | undefined,
  orient?: FloatingBarHoldOrientation,
): string | undefined {
  const active = parties.filter((p) => {
    const s = partyStatusRaw(p.callStatus).toUpperCase();
    return s !== "DROPPED" && s !== "DISCONNECTED";
  });
  if (active.length === 0) {
    return undefined;
  }
  const onHoldParties = active.filter((p) => {
    const s = partyStatusRaw(p.callStatus).toUpperCase();
    return s === "ON_HOLD" || s === "HELD";
  });
  if (onHoldParties.length === 0) {
    return undefined;
  }

  let onHoldParty = onHoldParties[0];
  let preferCalledAsHolder = false;
  const oc = orient?.callingAddress;
  const od = orient?.calledAddress;
  if (oc && od) {
    const sameAsOrient = onHoldParties.find(
      (p) =>
        addressesEquivalent(p.callingAddress, oc) &&
        addressesEquivalent(p.calledAddress, od),
    );
    const swappedOrient = onHoldParties.find(
      (p) =>
        addressesEquivalent(p.callingAddress, od) &&
        addressesEquivalent(p.calledAddress, oc),
    );
    if (sameAsOrient) {
      onHoldParty = sameAsOrient;
    } else if (swappedOrient) {
      onHoldParty = swappedOrient;
      preferCalledAsHolder = true;
    }
  }

  const calling = onHoldParty.callingAddress;
  const called = onHoldParty.calledAddress;
  if (!calling || !called) {
    return undefined;
  }
  const knownCalling = isDnRegisteredOnFloatingBar(dnsMap, calling);
  const knownCalled = isDnRegisteredOnFloatingBar(dnsMap, called);
  if (knownCalling && !knownCalled) {
    return calling;
  }
  if (knownCalled && !knownCalling) {
    return called;
  }
  if (preferCalledAsHolder) {
    return called;
  }
  // Both parties are internal (both in dnsMap) and no orient-swap signal:
  // cannot reliably determine the hold initiator. After a transfer, the recipient
  // is calledAddress — defaulting to calling would deny them Resume.
  // Return undefined so canUserResumeHoldOnFloatingBar falls through to
  // inferResumeAllowedFromDnsForParty, which permits either internal participant.
  return undefined;
}

function isAddressParticipantOnFloatingBarParties(
  address: string | undefined,
  parties: FloatingBarCallStateParty[],
): boolean {
  if (!address) {
    return false;
  }
  return parties.some(
    (p) =>
      addressesEquivalent(p.callingAddress, address) ||
      addressesEquivalent(p.calledAddress, address),
  );
}

/**
 * When another leg is on hold but ours is not, only the CTI-reported holder may resume.
 * Returns null if this rule does not apply (caller should continue with normal holder resolution).
 */
function resolveRemoteHoldResumeAllowed(
  anyLegHeld: boolean,
  myLegHeld: boolean,
  userAddress: string,
  heldByNonEmpty: boolean,
  heldByOnCall: boolean,
  heldByAddress: string,
): boolean | null {
  if (!anyLegHeld || myLegHeld) {
    return null;
  }
  if (heldByNonEmpty && heldByOnCall) {
    return addressesEquivalent(userAddress, heldByAddress);
  }
  return null;
}

/** True when `orient` matches `parties[0]` and this user is only the called party (typical inbound callee). */
function isUserStrictCalleeOnOrient(
  userAddress: string,
  orient: FloatingBarHoldOrientation,
): boolean {
  const { callingAddress, calledAddress } = orient;
  if (!callingAddress || !calledAddress) {
    return false;
  }
  const isCalled = addressesEquivalent(userAddress, calledAddress);
  const isCalling = addressesEquivalent(userAddress, callingAddress);
  return isCalled && !isCalling;
}

/**
 * Strict-callee branch for {@link canUserResumeHoldOnFloatingBar}.
 * @returns `false` = deny resume, `true` = allow, `null` = rule does not apply (fall through).
 */
function evaluateStrictCalleeHoldResumePolicy(
  userAddress: string,
  orient: FloatingBarHoldOrientation | undefined,
  anyLegHeld: boolean,
  myLegHeld: boolean,
  heldByNonEmpty: boolean,
  heldByOnCall: boolean,
  heldByAddress: string,
): boolean | null {
  if (
    !orient?.callingAddress ||
    !orient?.calledAddress ||
    !isUserStrictCalleeOnOrient(userAddress, orient) ||
    !anyLegHeld ||
    myLegHeld
  ) {
    return null;
  }

  const dialerNamedHolder =
    heldByNonEmpty &&
    heldByOnCall &&
    addressesEquivalent(heldByAddress, orient.callingAddress);

  if (dialerNamedHolder) {
    return false;
  }

  if (
    heldByNonEmpty &&
    heldByOnCall &&
    addressesEquivalent(userAddress, heldByAddress)
  ) {
    return true;
  }

  return null;
}

function computeLegHoldFlags(
  parties: FloatingBarCallStateParty[],
  userAddress: string,
): { myLegHeld: boolean; anyLegHeld: boolean } {
  const myLegHeld = userHasHeldLiveLeg(parties, userAddress);
  const anyLegHeld = parties.some((p) => {
    if (!partyIsLiveForFloatingBarInclusion(p)) {
      return false;
    }
    const s = partyStatusRaw(p.callStatus).toUpperCase();
    return s === "ON_HOLD" || s === "HELD";
  });
  return { myLegHeld, anyLegHeld };
}

/** Holder DN is on the call when it appears on a party leg, in dnsMap, or in an active holdSegment. */
function holderAddressAppliesToCall(
  holderDn: string,
  parties: FloatingBarCallStateParty[],
  dnsMap: FloatingBarDnsMap | undefined,
): boolean {
  if (
    parties.some(
      (p) =>
        addressesEquivalent(p.callingAddress, holderDn) ||
        addressesEquivalent(p.calledAddress, holderDn),
    )
  ) {
    return true;
  }
  if (isDnRegisteredOnFloatingBar(dnsMap, holderDn)) {
    return true;
  }
  return parties.some((p) => {
    const holder = getActiveHoldSegment(p.holdSegments)?.heldByAddress;
    return Boolean(holder && addressesEquivalent(holder, holderDn));
  });
}

function resolveFloatingBarHolderDn(
  heldByNonEmpty: boolean,
  heldByOnCall: boolean,
  heldByAddress: string,
  parties: FloatingBarCallStateParty[],
  dnsMap: FloatingBarDnsMap | undefined,
  orient: FloatingBarHoldOrientation | undefined,
): string | undefined {
  if (heldByNonEmpty && heldByOnCall) {
    return heldByAddress;
  }
  const inferred = inferFloatingBarHoldInitiatorFromParties(
    parties,
    dnsMap,
    orient,
  );
  if (isAddressParticipantOnFloatingBarParties(inferred, parties)) {
    return inferred;
  }
  return undefined;
}

/**
 * Whether the signed-in user should see Resume on the floating bar for a held call.
 * Prefer `heldByAddress`; else infer the hold initiator. For a strict callee (only `calledAddress`
 * on orient) with another leg held while ours is not ON_HOLD: deny only when the dialer is named
 * holder; allow only when we are named holder; otherwise fall through (incl. supervisor→agent).
 */
export function canUserResumeHoldOnFloatingBar(
  userAddress: string | undefined,
  callState: FloatingBarCallStateEntry | undefined,
  dnsMap: FloatingBarDnsMap | undefined,
  orient?: FloatingBarHoldOrientation,
): boolean {
  if (!userAddress || !callState) {
    return false;
  }

  const parties = callState.parties ?? [];
  const ourParty = pickPrimaryUserPartyForHoldResume(parties, userAddress);
  if (!ourParty) {
    return false;
  }

  const effectiveOrient: FloatingBarHoldOrientation = {
    callingAddress:
      orient?.callingAddress ?? ourParty.callingAddress,
    calledAddress: orient?.calledAddress ?? ourParty.calledAddress,
  };

  const resolvedHolder = resolveHeldByForCallState(callState);
  const heldByAddress = resolvedHolder.heldByAddress ?? "";
  const heldByNonEmpty = heldByAddress.length > 0;
  const heldByOnCall =
    heldByNonEmpty &&
    holderAddressAppliesToCall(heldByAddress, parties, dnsMap);

  const { myLegHeld, anyLegHeld } = computeLegHoldFlags(parties, userAddress);

  if (
    heldByNonEmpty &&
    heldByOnCall &&
    addressesEquivalent(userAddress, heldByAddress) &&
    (myLegHeld || anyLegHeld)
  ) {
    return true;
  }

  const strictCalleeDecision = evaluateStrictCalleeHoldResumePolicy(
    userAddress,
    effectiveOrient,
    anyLegHeld,
    myLegHeld,
    heldByNonEmpty,
    heldByOnCall,
    heldByAddress,
  );
  if (strictCalleeDecision !== null) {
    return strictCalleeDecision;
  }

  const remoteDecision = resolveRemoteHoldResumeAllowed(
    anyLegHeld,
    myLegHeld,
    userAddress,
    heldByNonEmpty,
    heldByOnCall,
    heldByAddress,
  );
  if (remoteDecision !== null) {
    return remoteDecision;
  }

  const holderDn = resolveFloatingBarHolderDn(
    heldByNonEmpty,
    heldByOnCall,
    heldByAddress,
    parties,
    dnsMap,
    effectiveOrient,
  );

  if (holderDn) {
    return addressesEquivalent(userAddress, holderDn);
  }

  const status = (ourParty.callStatus ?? "").toUpperCase();
  if (status === "ON_HOLD" || status === "HELD") {
    return inferResumeAllowedFromDnsForParty(userAddress, ourParty, dnsMap);
  }

  return false;
}

export type FloatingBarEventLogEntry = {
  isMonitoring?: boolean;
  monitoring?: { monitorDn?: string; monitoredDn?: string };
  parties?: Array<{ callingAddress?: string; calledAddress?: string }>;
};

function collectLetterMatches(text: string, re: RegExp): string[] {
  const letters: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    letters.push(m[0]);
  }
  return letters;
}

function initialsFromFirstAndLastName(
  firstName: string,
  lastName: string,
): string {
  const firstLetter = /[a-z]/i.exec(firstName)?.[0];
  const lastNameLetters = collectLetterMatches(lastName, /[a-z]/gi);
  const secondLetter = lastNameLetters.length >= 2 ? lastNameLetters[1] : null;
  if (firstLetter && secondLetter) {
    return (firstLetter + secondLetter).toUpperCase();
  }
  const lastFirstLetter = lastNameLetters[0];
  if (firstLetter && lastFirstLetter) {
    return (firstLetter + lastFirstLetter).toUpperCase();
  }
  return firstLetter ? firstLetter.toUpperCase() : "";
}

function initialsFromSingleWord(word: string): string {
  const letters = collectLetterMatches(word, /[a-z]/gi);
  if (letters.length >= 2) {
    return (letters[0] + letters[1]).toUpperCase();
  }
  if (letters.length === 1) {
    return letters[0].toUpperCase();
  }
  return "";
}

export function getInitialsFromNameForFloatingBar(name: string): string {
  if (!name) return "";

  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length >= 2) {
    return initialsFromFirstAndLastName(words[0], words.at(-1) ?? "");
  }

  if (words.length === 1 && words[0]) {
    return initialsFromSingleWord(words[0]);
  }

  return "";
}

function partyIsLiveForFloatingBarInclusion(
  party: FloatingBarCallStateParty,
): boolean {
  const s = (party.callStatus ?? "").toUpperCase();
  return (
    s !== "DROPPED" && s !== "DISCONNECTED" && s !== "ENDED"
  );
}

function isPartyStatusRingingForCallee(
  party: FloatingBarCallStateParty,
  userAddress: string,
): boolean {
  if (!addressesEquivalent(party.calledAddress, userAddress)) {
    return false;
  }
  const raw = party.callStatus ?? "";
  const s = raw.toUpperCase();
  return s === "RINGING" || s === "ALERTING" || s === "PROCEEDING";
}

/**
 * Transfer UX (two roles):
 * - **Transfer initiator** (still on the consult / connecting leg as caller): keep seeing the
 *   floating bar — `isInboundAwaitingUserAnswerForFloatingBar` is false for them because they are
 *   not `calledAddress` on the inbound offer to the transfer target.
 * - **Transfer recipient** (`calledAddress` = this user, party still RINGING/ALERTING/PROCEEDING):
 *   must use attend/reject only — exclude this call from the floating bar so it does not replace
 *   the incoming dialog.
 *
 * Uses per-party state when available so consult/transfer aggregate "connected" state does not
 * show the bar to the recipient before they answer.
 */
export function isInboundAwaitingUserAnswerForFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog?: readonly unknown[],
): boolean {
  if (!userAddress || !addressesEquivalent(call.calledAddress, userAddress)) {
    return false;
  }
  const parties = call.callId
    ? callStateMap?.[call.callId]?.parties
    : undefined;
  if (parties?.length) {
    const callState = call.callId ? callStateMap?.[call.callId] : undefined;
    if (
      userShouldLeaveFloatingBarByPartyState(
        parties,
        userAddress,
        callState,
        eventLog,
        callStateMap,
      )
    ) {
      return false;
    }
    return parties.some((p) => isPartyStatusRingingForCallee(p, userAddress));
  }
  return call.status === "ringing" || call.status === "dialing";
}

/** True if the user appears on any party row for this call (transfer/consult may not use parties[0]). */
export function floatingBarCallInvolvesUserFromState(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog?: readonly unknown[],
): boolean {
  if (!userAddress) {
    return false;
  }
  const parties = call.callId
    ? callStateMap?.[call.callId]?.parties
    : undefined;
  if (parties?.length) {
    const involvesUserOnLiveParty = parties.some(
      (p) =>
        partyIsLiveForFloatingBarInclusion(p) &&
        (addressesEquivalent(p.callingAddress, userAddress) ||
          addressesEquivalent(p.calledAddress, userAddress) ||
          partyMatchesUserByHoldSegment(p, userAddress)),
    );
    if (involvesUserOnLiveParty) {
      return true;
    }
    const callState = call.callId ? callStateMap?.[call.callId] : undefined;
    if (
      supervisorSupervisionEndedForUser(
        callState,
        userAddress,
        parties,
        eventLog,
        callStateMap,
      )
    ) {
      return false;
    }
    return Boolean(
      callState &&
        supervisorBargeConferenceStillLive(callState, userAddress),
    );
  }
  return (
    addressesEquivalent(call.callingAddress, userAddress) ||
    addressesEquivalent(call.calledAddress, userAddress)
  );
}

/** Eligible calls for the floating bar for this signed-in extension (includes silent/whisper/barge legs). */
export function shouldIncludeCallOnFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog?: readonly unknown[],
): boolean {
  const parties = call.callId
    ? callStateMap?.[call.callId]?.parties
    : undefined;
  if (parties?.length) {
    const callState = call.callId ? callStateMap?.[call.callId] : undefined;
    if (
      userShouldLeaveFloatingBarByPartyState(
        parties,
        userAddress,
        callState,
        eventLog,
        callStateMap,
      )
    ) {
      return false;
    }
  } else {
    const callState = call.callId ? callStateMap?.[call.callId] : undefined;
    if (
      supervisorSupervisionEndedForUser(
        callState,
        userAddress,
        parties,
        eventLog,
        callStateMap,
      )
    ) {
      return false;
    }
  }
  if (
    isInboundAwaitingUserAnswerForFloatingBar(call, userAddress, callStateMap, eventLog)
  ) {
    return false;
  }
  const involvesUser = floatingBarCallInvolvesUserFromState(
    call,
    userAddress,
    callStateMap,
    eventLog,
  );
  const hasValidStatus = ["connected", "ringing", "dialing", "onHold"].includes(
    call.status,
  );
  return involvesUser && hasValidStatus;
}

export function compareFloatingBarCalls(
  a: FloatingBarCtiCall,
  b: FloatingBarCtiCall,
): number {
  if (a.status === "connected" && b.status !== "connected") return -1;
  if (b.status === "connected" && a.status !== "connected") return 1;
  if (a.status === "onHold" && !["connected"].includes(b.status)) return -1;
  if (b.status === "onHold" && !["connected"].includes(a.status)) return 1;
  return 0;
}

function applyFallbackConnectedDuration(call: FloatingBarCtiCall): void {
  if (call.status !== "connected" || !call.startTime) return;
  const startTime =
    call.startTime instanceof Date
      ? call.startTime
      : moment.utc(call.startTime).toDate();
  const now = new Date();
  call.duration = Math.max(
    0,
    Math.round((now.getTime() - startTime.getTime()) / 1000),
  );
}


function applyPartyStatusesToCall(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
  callState?: FloatingBarCallStateEntry,
  eventLog?: readonly unknown[],
  callStateMap?: Record<string, FloatingBarCallStateEntry> | undefined,
): void {
  if (
    userShouldLeaveFloatingBarByPartyState(
      parties,
      userAddress,
      callState,
      eventLog,
      callStateMap,
    )
  ) {
    call.status = "ended";
    return;
  }
  // Check held before connected to match localStatusFromCallStateRecord priority.
  // After a transfer+hold, a stale CONNECTED party leg must not override ON_HOLD.
  const hasHeldParty = parties.some((p) => {
    const s = (p.callStatus ?? "").toUpperCase();
    return s === "ON_HOLD" || s === "HELD";
  });
  if (hasHeldParty) {
    call.status = "onHold";
    return;
  }
  const connectedParties = parties.filter(
    (p) =>
      p.callStatus === "CONNECTED" ||
      p.callStatus === "ANSWERED" ||
      p.callStatus === "RETRIEVED",
  );
  const ringingParties = parties.filter((p) => p.callStatus === "RINGING");
  const hasConnectedParty = connectedParties.length > 0;
  const hasRingingParty = ringingParties.length > 0;

  if (hasConnectedParty) {
    call.status = "connected";
    return;
  }
  if (
    hasRingingParty &&
    ctiAddressMatchesUser(call.calledAddress, userAddress)
  ) {
    call.status = "ringing";
  }
}

function applyParsedDurationFromState(
  call: FloatingBarCtiCall,
  callState: FloatingBarCallStateEntry,
): void {
  if (call.status !== "connected") return;
  const startTime = parseCallAnswerStartTimeUtc(callState, call.startTime);
  if (!startTime) return;
  const now = new Date();
  call.duration = Math.max(
    0,
    Math.round((now.getTime() - startTime.getTime()) / 1000),
  );
}

export function enrichFloatingBarCallFromCallState(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog?: readonly unknown[],
): void {
  const callId = call.callId;
  if (!callId || !callStateMap?.[callId]) {
    applyFallbackConnectedDuration(call);
    return;
  }

  const callState = callStateMap[callId];
  const parties = callState.parties;
  if (parties?.length) {
    applyPartyStatusesToCall(
      call,
      userAddress,
      parties,
      callState,
      eventLog,
      callStateMap,
    );
  }

  applyParsedDurationFromState(call, callState);
}

/** Resolved controller device for CTI actions from the floating bar (same leg as WebCTI user). */
export type FloatingBarControllerDevice = {
  controllerAddress: string;
  controllerDeviceName: string;
  controllerDeviceType: string;
};

type FloatingBarDnsDeviceLike = {
  deviceName?: string;
  deviceType?: string;
  terminalState?: string;
};

function readUserDevicesFromDnsMap(
  dnsMap: FloatingBarDnsMap | undefined,
  userAddress: string,
): FloatingBarDnsDeviceLike[] {
  if (!dnsMap) {
    return [];
  }
  const bucket = dnsMap[userAddress];
  if (!bucket || typeof bucket !== "object" || !("devices" in bucket)) {
    return [];
  }
  const devicesObj = (bucket as { devices?: Record<string, unknown> }).devices;
  if (!devicesObj || typeof devicesObj !== "object") {
    return [];
  }
  return Object.values(devicesObj).flatMap((d): FloatingBarDnsDeviceLike[] => {
    if (!d || typeof d !== "object") {
      return [];
    }
    const o = d as Record<string, unknown>;
    return [
      {
        deviceName: typeof o.deviceName === "string" ? o.deviceName : undefined,
        deviceType: typeof o.deviceType === "string" ? o.deviceType : undefined,
        terminalState:
          typeof o.terminalState === "string" ? o.terminalState : undefined,
      },
    ];
  });
}

function pickUserPartyForFloatingBarController(
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
  userAddress: string,
): FloatingBarCallStateParty | undefined {
  const nonTerminal = parties.filter(
    (p) => !CTI_TERMINAL_PARTY_STATUSES.has(partyStatusRaw(p.callStatus)),
  );
  const pool = nonTerminal.length > 0 ? nonTerminal : parties;
  return pool.find(
    (p) =>
      ctiAddressMatchesUser(p.callingAddress, userAddress) ||
      ctiAddressMatchesUser(p.calledAddress, userAddress),
  );
}

function resolveFloatingBarControllerFromTopLeg(
  call: FloatingBarCtiCall,
  userAddress: string,
  userDevices: FloatingBarDnsDeviceLike[],
  isCaller: boolean,
  isCalled: boolean,
): FloatingBarControllerDevice {
  let activeDevice =
    isCaller && call.callingDeviceName
      ? userDevices.find(
          (device) => device.deviceName === call.callingDeviceName,
        )
      : undefined;

  activeDevice ??=
    isCalled && call.calledDeviceName
      ? userDevices.find(
          (device) => device.deviceName === call.calledDeviceName,
        )
      : undefined;

  activeDevice ??=
    userDevices.find((device) => device.terminalState === "REGISTERED") ||
    userDevices[0];

  return {
    controllerAddress: userAddress,
    controllerDeviceName: activeDevice.deviceName || "WebCTI",
    controllerDeviceType: activeDevice.deviceType || "SOFT_HARD",
  };
}

function resolveFloatingBarControllerFromPartyLeg(
  party: FloatingBarCallStateParty,
  userAddress: string,
  userDevices: FloatingBarDnsDeviceLike[],
): FloatingBarControllerDevice {
  const onCallingSide = ctiAddressMatchesUser(
    party.callingAddress,
    userAddress,
  );
  let activeDevice =
    onCallingSide && party.callingDeviceName
      ? userDevices.find((d) => d.deviceName === party.callingDeviceName)
      : undefined;
  activeDevice ??=
    !onCallingSide && party.calledDeviceName
      ? userDevices.find((d) => d.deviceName === party.calledDeviceName)
      : undefined;
  activeDevice ??=
    userDevices.find((d) => d.terminalState === "REGISTERED") ||
    userDevices[0];

  const preferredType = onCallingSide
    ? party.callingDeviceType
    : party.calledDeviceType;

  return {
    controllerAddress: userAddress,
    controllerDeviceName: activeDevice.deviceName || "WebCTI",
    controllerDeviceType:
      activeDevice.deviceType || preferredType || "SOFT_HARD",
  };
}

export function getFloatingBarControllerDeviceInfo(
  call: FloatingBarCtiCall | null | undefined,
  userAddress: string | undefined,
  dnsMap: FloatingBarDnsMap | undefined,
  callStateMap?: Record<string, FloatingBarCallStateEntry> | undefined,
): FloatingBarControllerDevice | null {
  if (!call || !userAddress || !dnsMap) {
    return null;
  }

  const userDevices = readUserDevicesFromDnsMap(dnsMap, userAddress);
  if (userDevices.length === 0) {
    return null;
  }

  const isCaller = ctiAddressMatchesUser(call.callingAddress, userAddress);
  const isCalled = ctiAddressMatchesUser(call.calledAddress, userAddress);

  if (isCaller || isCalled) {
    return resolveFloatingBarControllerFromTopLeg(
      call,
      userAddress,
      userDevices,
      isCaller,
      isCalled,
    );
  }

  const parties =
    call.callId && callStateMap?.[call.callId]?.parties?.length
      ? callStateMap[call.callId].parties
      : undefined;
  const party = parties
    ? pickUserPartyForFloatingBarController(parties, userAddress)
    : undefined;
  if (!party) {
    return null;
  }

  return resolveFloatingBarControllerFromPartyLeg(
    party,
    userAddress,
    userDevices,
  );
}

/** Live elapsed seconds for a connected floating-bar call (falls back to `call.duration`). */
export function computeFloatingBarConnectedElapsedSeconds(
  activeCall: FloatingBarCtiCall,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
): number {
  const callId = activeCall.callId;
  if (!callId || !callStateMap?.[callId]) {
    return activeCall.duration ?? 0;
  }

  const callState = callStateMap[callId];
  const startTime = parseCallAnswerStartTimeUtc(
    callState,
    activeCall.startTime,
  );
  if (startTime) {
    const now = new Date();
    return Math.max(
      0,
      Math.round((now.getTime() - startTime.getTime()) / 1000),
    );
  }

  return activeCall.duration ?? 0;
}

export function pickFloatingBarCall(
  activeCalls: Map<string, FloatingBarCtiCall>,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog?: readonly unknown[],
): FloatingBarCtiCall | undefined {
  const list = Array.from(activeCalls.values())
    .filter((c) =>
      shouldIncludeCallOnFloatingBar(c, userAddress, callStateMap, eventLog),
    )
    .sort(compareFloatingBarCalls);
  const call = list[0];
  if (call) {
    enrichFloatingBarCallFromCallState(call, userAddress, callStateMap, eventLog);
  }
  return call;
}
