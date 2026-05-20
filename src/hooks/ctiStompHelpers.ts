/**
 * Pure helpers for useCtiStomp — keeps the hook under Sonar cognitive-complexity limits.
 */

import {
  ctiAddressesEquivalent,
  normalizeCtiAddressDigits,
} from "../utils/ctiAddressMatching";
import { normalizeConferenceFlagsForLiveParties } from "../utils/ctiCallDisplay";
import { callHasLiveAgentPartyWithNonSupervisor } from "../utils/ctiMonitoringCallParties";

const LOAD_PERSIST_ACTIVE_STATUSES = new Set([
  "CONNECTED",
  "RETRIEVED",
  "ON_HOLD",
  "RINGING",
  "ANSWERED",
]);

const SAVE_PERSIST_ACTIVE_STATUSES = new Set([
  "CONNECTED",
  "RETRIEVED",
  "ON_HOLD",
]);
const SAVE_ESTABLISHED_STATUSES = new Set(["CONNECTED", "RETRIEVED"]);

/** Ignore late RINGING / refresh rows that recreate a callId we just removed (see debug tombstone: ~23ms ghost). */
const TERMINATED_CALL_REBIRTH_GUARD_MS = 4000;

type TerminatedCallRebirthGuard = {
  expiresAt: number;
  lastEventTimeMs: number;
  lastSequence: number;
};

const terminatedCallRebirthGuards = new Map<string, TerminatedCallRebirthGuard>();

function parseCtiEventTimeMs(source: any): number {
  if (!source?.eventTime) {
    return 0;
  }
  const t = new Date(source.eventTime).getTime();
  return Number.isFinite(t) ? t : 0;
}

function recordTerminatedCallForRebirthGuard(
  callId: string,
  terminalEvt: any,
  snapshot: any,
): void {
  const evtMs = parseCtiEventTimeMs(terminalEvt);
  const snapMs = parseCtiEventTimeMs(snapshot);
  const lastEventTimeMs = Math.max(evtMs, snapMs);
  const lastSequence = Math.max(
    terminalEvt?.sequence ?? 0,
    snapshot?.sequence ?? 0,
  );
  const now = Date.now();
  const prev = terminatedCallRebirthGuards.get(callId);
  terminatedCallRebirthGuards.set(callId, {
    expiresAt: now + TERMINATED_CALL_REBIRTH_GUARD_MS,
    lastEventTimeMs: Math.max(lastEventTimeMs, prev?.lastEventTimeMs ?? 0),
    lastSequence: Math.max(lastSequence, prev?.lastSequence ?? 0),
  });
}

function pruneExpiredTerminatedCallGuards(): void {
  const now = Date.now();
  const expiredIds: string[] = [];
  terminatedCallRebirthGuards.forEach((g, id) => {
    if (now > g.expiresAt) {
      expiredIds.push(id);
    }
  });
  expiredIds.forEach((id) => terminatedCallRebirthGuards.delete(id));
}

function shouldSuppressTerminatedCallRebirth(callId: string, evt: any): boolean {
  pruneExpiredTerminatedCallGuards();
  const rec = terminatedCallRebirthGuards.get(callId);
  if (!rec || Date.now() > rec.expiresAt) {
    if (rec) {
      terminatedCallRebirthGuards.delete(callId);
    }
    return false;
  }
  const incomingMs = parseCtiEventTimeMs(evt);
  const incomingSeq = evt?.sequence ?? 0;
  if (incomingMs > 0 && incomingMs < rec.lastEventTimeMs) {
    return true;
  }
  if (
    incomingMs > 0 &&
    incomingMs === rec.lastEventTimeMs &&
    incomingSeq <= rec.lastSequence
  ) {
    return true;
  }
  const teardownAt = rec.expiresAt - TERMINATED_CALL_REBIRTH_GUARD_MS;
  const msSinceTeardown = Date.now() - teardownAt;
  if (
    msSinceTeardown < 750 &&
    evt?.eventType === "RINGING" &&
    (incomingMs === 0 || incomingMs <= rec.lastEventTimeMs)
  ) {
    return true;
  }
  return false;
}

function shouldSuppressOngoingRebirth(callId: string, callData: any): boolean {
  const synthetic = {
    eventType: callData.eventType || callData.currentState || "RINGING",
    eventTime: callData.eventTime,
    sequence: callData.sequence,
  };
  return shouldSuppressTerminatedCallRebirth(callId, synthetic);
}

export function partyLegHasStartTime(startTime: unknown): boolean {
  if (startTime == null) {
    return false;
  }
  if (typeof startTime === "string" && startTime.trim() === "") {
    return false;
  }
  return true;
}

function partyStartTimeEpochMs(startTime: unknown): number | null {
  if (!partyLegHasStartTime(startTime)) {
    return null;
  }
  const d = new Date(startTime as string);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function pickEarlierPartyStartTimeValue(
  previous: unknown,
  incoming: unknown,
): unknown {
  const prevMs = partyStartTimeEpochMs(previous);
  const nextMs = partyStartTimeEpochMs(incoming);
  if (prevMs == null) {
    return incoming;
  }
  if (nextMs == null) {
    return previous;
  }
  return prevMs <= nextMs ? previous : incoming;
}

export function preservePartyStartTimesFromBase(
  parties: any[],
  baseParties: any[] | undefined,
): any[] {
  if (!baseParties?.length) {
    return parties;
  }
  return parties.map((party) => {
    const prev = baseParties.find(
      (b: any) =>
        ctiAddressesEquivalent(b?.callingAddress, party?.callingAddress) &&
        ctiAddressesEquivalent(b?.calledAddress, party?.calledAddress),
    );
    if (!prev) {
      return party;
    }
    const earliest = pickEarlierPartyStartTimeValue(
      prev.startTime,
      party?.startTime,
    );
    if (!partyLegHasStartTime(earliest)) {
      return party;
    }
    return { ...party, startTime: earliest };
  });
}

export function readCtiCallerInfoFromStorage(): Record<string, unknown> | null {
  try {
    const stored = localStorage.getItem("cti_caller_info");
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as Record<string, unknown>;
  } catch (err) {
    console.warn("[useCtiStomp] Failed to parse cti_caller_info", err);
    return null;
  }
}

export function inferCallingDeviceTypeFromDeviceName(
  deviceName: string,
): string {
  const n = deviceName.toLowerCase();
  if (n.includes("android") || n.includes("mobile")) {
    return "MOBILE";
  }
  return "SOFT_HARD";
}

function findDeviceTypeInDnsMap(
  dnsMap: Record<
    string,
    { devices: Record<string, { deviceName: string; deviceType: string }> }
  >,
  callingAddress: string,
  callingDeviceName: string,
): string | undefined {
  const userDevices = dnsMap[callingAddress]?.devices;
  if (!userDevices) {
    return undefined;
  }
  const device = Object.values(userDevices).find(
    (d) => d.deviceName === callingDeviceName,
  );
  return device?.deviceType;
}

export function enrichPartyCallingDeviceType(
  party: any,
  dnsMap: Record<
    string,
    {
      dn: string;
      devices: Record<string, { deviceName: string; deviceType: string }>;
    }
  >,
): void {
  const stored = readCtiCallerInfoFromStorage();
  if (
    stored &&
    stored.callingAddress === party.callingAddress &&
    stored.callingDeviceName === party.callingDeviceName
  ) {
    party.callingDeviceType = stored.callingDeviceType;
    return;
  }
  if (
    !party.callingDeviceType &&
    party.callingAddress &&
    party.callingDeviceName
  ) {
    const fromMap = findDeviceTypeInDnsMap(
      dnsMap,
      party.callingAddress,
      party.callingDeviceName,
    );
    if (fromMap) {
      party.callingDeviceType = fromMap;
    }
  }
  if (!party.callingDeviceType && party.callingDeviceName) {
    party.callingDeviceType = inferCallingDeviceTypeFromDeviceName(
      party.callingDeviceName,
    );
  }
}

function normalizeStateFromActivePartiesForDropped(
  activeParties: any[],
): "HELD" | "RETRIEVED" | "ANSWERED" {
  if (activeParties.some((p: any) => p.callStatus === "ON_HOLD")) {
    return "HELD";
  }
  if (activeParties.some((p: any) => p.callStatus === "RETRIEVED")) {
    return "RETRIEVED";
  }
  if (activeParties.some((p: any) => p.callStatus === "CONNECTED")) {
    return "ANSWERED";
  }
  return "ANSWERED";
}

export function reduceLoadPersistedCallStates(
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  return Object.entries(parsed).reduce(
    (acc, [callId, raw]) => {
      const event = raw as Record<string, any>;
      if (event.isTerminating || !event.parties?.length) {
        return acc;
      }
      const activeParties = event.parties.filter(
        (p: any) =>
          p.callStatus &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED" &&
          LOAD_PERSIST_ACTIVE_STATUSES.has(p.callStatus),
      );
      if (activeParties.length === 0) {
        return acc;
      }
      let normalizedState = event.currentState;
      if (event.currentState === "DROPPED") {
        normalizedState =
          normalizeStateFromActivePartiesForDropped(activeParties);
      }
      acc[callId] = {
        ...event,
        currentState: normalizedState,
        parties: activeParties,
        hasActiveParticipants: activeParties.length > 0,
      };
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

export function reduceSaveCallStates(
  callStates: Record<string, unknown>,
): Record<string, unknown> {
  return Object.entries(callStates).reduce(
    (acc, [callId, raw]) => {
      const callEvent = raw as Record<string, any>;
      if (callEvent.isTerminating || !callEvent.parties?.length) {
        return acc;
      }
      const activeParties = callEvent.parties.filter(
        (p: any) =>
          p.callStatus &&
          p.callStatus !== "DROPPED" &&
          p.callStatus !== "DISCONNECTED" &&
          SAVE_PERSIST_ACTIVE_STATUSES.has(p.callStatus),
      );
      const isConnectedOrRetrieved = activeParties.some(
        (p: any) => p.callStatus && SAVE_ESTABLISHED_STATUSES.has(p.callStatus),
      );
      if (!isConnectedOrRetrieved || activeParties.length === 0) {
        return acc;
      }
      let normalizedState = callEvent.currentState;
      if (callEvent.currentState === "DROPPED") {
        normalizedState =
          normalizeStateFromActivePartiesForDropped(activeParties);
      }
      acc[callId] = {
        ...callEvent,
        currentState: normalizedState,
        hasActiveParticipants: true,
      };
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

function partyPairMatchesDropped(
  p: any,
  droppedPair: { calling: any; called: any },
): boolean {
  return (
    (p.callingAddress === droppedPair.calling &&
      p.calledAddress === droppedPair.called) ||
    (p.callingAddress === droppedPair.called &&
      p.calledAddress === droppedPair.calling)
  );
}

function applyDroppedPairToOtherCalls(
  updated: Record<string, any>,
  currentCallId: string,
  droppedPair: { calling: any; called: any },
  currentEventTime: number,
): void {
  for (const otherCallId of Object.keys(updated)) {
    if (otherCallId === currentCallId) {
      continue;
    }
    const otherCall = updated[otherCallId];
    if (!otherCall || otherCall.isTerminating) {
      continue;
    }
    const matchingParty = otherCall.parties?.find((p: any) =>
      partyPairMatchesDropped(p, droppedPair),
    );
    if (
      !matchingParty ||
      matchingParty.callStatus === "DROPPED" ||
      matchingParty.callStatus === "DISCONNECTED"
    ) {
      continue;
    }
    const otherCallTime = new Date(otherCall.eventTime || 0).getTime();
    if (otherCallTime >= currentEventTime) {
      continue;
    }
    const updatedParties = otherCall.parties.map((p: any) =>
      partyPairMatchesDropped(p, droppedPair)
        ? { ...p, callStatus: "DROPPED" }
        : p,
    );
    const nextActive = updatedParties.filter(
      (p: any) => p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
    );
    if (nextActive.length === 0) {
      updated[otherCallId] = { ...otherCall, isTerminating: true };
    } else {
      updated[otherCallId] = { ...otherCall, parties: nextActive };
    }
  }
}

export function applyStaleDroppedPartyCleanup(
  updated: Record<string, any>,
  callId: string,
  evt: any,
  processedParties: any[],
  activePartiesOnly: any[],
): void {
  if (evt.eventType !== "DROPPED" || activePartiesOnly.length === 0) {
    return;
  }

  const droppedPartyPairs = processedParties
    .filter(
      (p: any) => p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED",
    )
    .map((p: any) => ({
      calling: p.callingAddress,
      called: p.calledAddress,
    }));

  const currentEventTime = new Date(evt.eventTime).getTime();

  for (const droppedPair of droppedPartyPairs) {
    applyDroppedPairToOtherCalls(
      updated,
      callId,
      droppedPair,
      currentEventTime,
    );
  }
}

function partyLegKey(p: {
  callingAddress?: string;
  calledAddress?: string;
}): string {
  return `${normalizeCtiAddressDigits(p.callingAddress)}:${normalizeCtiAddressDigits(p.calledAddress)}`;
}

function isTerminalPartyStatus(status: string | undefined): boolean {
  return status === "DROPPED" || status === "DISCONNECTED" || status === "ENDED";
}

/**
 * Merges incremental `evt.parties` into the stored snapshot so a dropped consult leg
 * does not replace (and erase) the held customer leg on the same callId.
 */
export function mergeCallEventParties(
  baseParties: any[] | undefined,
  evtParties: any[] | undefined,
): any[] {
  if (!evtParties?.length) {
    return baseParties ? baseParties.map((p) => ({ ...p })) : [];
  }
  if (!baseParties?.length) {
    return evtParties.map((p) => ({ ...p }));
  }
  const merged = new Map<string, any>();
  for (const p of baseParties) {
    merged.set(partyLegKey(p), { ...p });
  }
  for (const p of evtParties) {
    const key = partyLegKey(p);
    const prev = merged.get(key);
    merged.set(key, prev ? { ...prev, ...p } : { ...p });
  }
  return Array.from(merged.values());
}

function tryRemoveCallOnEarlyExit(
  updated: Record<string, any>,
  callId: string,
  evt: any,
  base: any,
  saveCallStatesToStorage: (m: Record<string, any>) => void,
): Record<string, any> | null {
  const mergedParties = mergeCallEventParties(base.parties, evt.parties);
  const activeMerged = mergedParties.filter(
    (p: any) => !isTerminalPartyStatus(p.callStatus),
  );

  if (evt.isTerminating) {
    recordTerminatedCallForRebirthGuard(
      callId,
      evt,
      updated[callId] || {},
    );
    const { [callId]: _, ...rest } = updated;
    saveCallStatesToStorage(rest);
    return rest;
  }
  if (evt.eventType === "DISCONNECTED" && evt.parties) {
    const allMergedTerminal =
      mergedParties.length > 0 &&
      mergedParties.every((p: any) => isTerminalPartyStatus(p.callStatus));
    const shouldRemove =
      (allMergedTerminal && activeMerged.length === 0) ||
      (evt.hasActiveParticipants === false && activeMerged.length === 0);
    if (shouldRemove) {
      recordTerminatedCallForRebirthGuard(
        callId,
        evt,
        updated[callId] || {},
      );
      const { [callId]: _, ...rest } = updated;
      saveCallStatesToStorage(rest);
      return rest;
    }
  }
  return null;
}

function shouldIgnoreStaleEvent(
  evt: any,
  base: any,
  eventTimeMs: number,
): boolean {
  const existingEventTimeMs = base.eventTime
    ? new Date(base.eventTime).getTime()
    : 0;
  if (eventTimeMs < existingEventTimeMs) {
    return true;
  }
  if (eventTimeMs === existingEventTimeMs && existingEventTimeMs > 0) {
    const incomingSequence = evt.sequence || 0;
    const existingSequence = base.sequence || 0;
    return incomingSequence <= existingSequence;
  }
  return false;
}

function computeShouldTerminate(
  evt: any,
  processedParties: any[],
  hasActiveParties: boolean,
  allPartiesDropped: boolean,
): boolean {
  return (
    evt.isTerminating ||
    allPartiesDropped ||
    (evt.hasActiveParticipants === false &&
      processedParties.length > 0 &&
      evt.eventType !== "RINGING") ||
    (!hasActiveParties &&
      processedParties.length > 0 &&
      evt.eventType !== "RINGING") ||
    (evt.eventType === "DISCONNECTED" && !hasActiveParties)
  );
}

function isBargeMonitoringType(monitoringType: string | undefined): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return normalized === "BARGE_IN" || normalized === "BARGEIN";
}

/** Tear down stale barge rows when PSTN/external hung up but sup↔agent leg stays CONNECTED. */
function shouldTerminateBargeMonitoringWithoutCustomer(call: {
  parties?: Array<{
    callStatus?: string;
    callingAddress?: string;
    calledAddress?: string;
  }>;
  isMonitoring?: boolean;
  monitoring?: {
    monitoringType?: string;
    monitorDn?: string;
    monitoredDn?: string;
  };
}): boolean {
  const monitoring = call.monitoring;
  const monitorDn = monitoring?.monitorDn;
  const monitoredDn = monitoring?.monitoredDn;
  if (!monitorDn || !monitoredDn) {
    return false;
  }
  const monitoringType = monitoring?.monitoringType;
  if (!call.isMonitoring && !isBargeMonitoringType(monitoringType)) {
    return false;
  }
  if (!isBargeMonitoringType(monitoringType)) {
    return false;
  }
  return !callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn);
}

function computeEffectiveCurrentState(
  evt: any,
  base: any,
  hasActiveParties: boolean,
  activePartiesOnly: any[],
): string {
  if (evt.eventType === "RINGING") {
    return "RINGING";
  }
  if (evt.eventType === "DROPPED" && hasActiveParties) {
    const activeParty = activePartiesOnly[0];
    if (!activeParty) {
      return base.currentState || evt.eventType;
    }
    if (activeParty.callStatus === "CONNECTED") {
      return base.currentState || "ANSWERED";
    }
    if (activeParty.callStatus === "ON_HOLD") {
      return "HELD";
    }
    if (activeParty.callStatus === "RETRIEVED") {
      return "RETRIEVED";
    }
    return base.currentState || "ANSWERED";
  }
  return evt.eventType;
}

function isDnKeyInDnsMap(
  dnsMap: Record<
    string,
    {
      dn: string;
      devices: Record<string, { deviceName: string; deviceType: string }>;
    }
  >,
  address: string | undefined,
): boolean {
  return Boolean(address && Object.hasOwn(dnsMap, address));
}

/** Prefer a party that is actually on hold for inference (order is not stable after transfer). */
function pickPartyForHeldInference(activePartiesOnly: any[]): any {
  const onHold = activePartiesOnly.find((p: any) => p.callStatus === "ON_HOLD");
  return onHold ?? activePartiesOnly[0];
}

function computeHeldByAddress(
  evt: any,
  effectiveCurrentState: string,
  base: any,
  activePartiesOnly: any[],
  dnsMap: Record<
    string,
    {
      dn: string;
      devices: Record<string, { deviceName: string; deviceType: string }>;
    }
  >,
): string | undefined {
  if (evt.eventType === "HELD" && activePartiesOnly.length >= 1) {
    const p = pickPartyForHeldInference(activePartiesOnly);
    const calling = p.callingAddress;
    const called = p.calledAddress;
    const details = String((evt as { details?: string }).details || "");
    const globalCallingRe = /GlobalCalling:(\S+)/;
    const globalCallingMatch = globalCallingRe.exec(details);
    if (globalCallingMatch) {
      const globalCalling = globalCallingMatch[1].trim();
      return calling === globalCalling ? called : calling;
    }
    const knownCalling = isDnKeyInDnsMap(dnsMap, calling);
    const knownCalled = isDnKeyInDnsMap(dnsMap, called);
    if (knownCalling && !knownCalled) {
      return calling;
    }
    if (knownCalled && !knownCalling) {
      return called;
    }
    return calling;
  }
  if (effectiveCurrentState === "HELD") {
    return base.heldByAddress;
  }
  return undefined;
}

function resolveHasActiveParticipantsForEvent(
  evt: any,
  hasActiveParties: boolean,
): boolean {
  if (evt.eventType === "RINGING" && hasActiveParties) {
    return true;
  }
  return evt.hasActiveParticipants ?? hasActiveParties;
}

/**
 * Applies one CTI call event to the call state map (same semantics as previous inline reducer).
 */
export function applyCallEventToCallStateMap(
  prev: Record<string, any>,
  callId: string,
  evt: any,
  dnsMap: Record<
    string,
    {
      dn: string;
      devices: Record<string, { deviceName: string; deviceType: string }>;
    }
  >,
  saveCallStatesToStorage: (m: Record<string, any>) => void,
  notifyCallIdsRemoved?: (callIds: readonly string[]) => void,
): Record<string, any> {
  if (
    !Object.hasOwn(prev, callId) &&
    shouldSuppressTerminatedCallRebirth(callId, evt)
  ) {
    return prev;
  }

  const updated = { ...prev };
  const base = updated[callId] || {};

  const eventTimeMs = evt.eventTime ? new Date(evt.eventTime).getTime() : 0;

  const early = tryRemoveCallOnEarlyExit(
    updated,
    callId,
    evt,
    base,
    saveCallStatesToStorage,
  );
  if (early) {
    notifyCallIdsRemoved?.([callId]);
    return early;
  }

  if (shouldIgnoreStaleEvent(evt, base, eventTimeMs)) {
    return updated;
  }

  const partiesToProcess = mergeCallEventParties(base.parties, evt.parties);
  const processedParties = partiesToProcess.map((party: any) => {
    enrichPartyCallingDeviceType(party, dnsMap);
    return party;
  });

  const partiesWithPreservedStart = preservePartyStartTimesFromBase(
    processedParties,
    base.parties,
  );

  const activePartiesOnly = partiesWithPreservedStart.filter(
    (p: any) => p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
  );

  const allPartiesDropped =
    processedParties.length > 0 &&
    processedParties.every(
      (p: any) => p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED",
    );

  const hasActiveParties = activePartiesOnly.length > 0;
  let shouldTerminate = computeShouldTerminate(
    evt,
    processedParties,
    hasActiveParties,
    allPartiesDropped,
  );

  const effectiveCurrentState = computeEffectiveCurrentState(
    evt,
    base,
    hasActiveParties,
    activePartiesOnly,
  );

  const heldByAddress = computeHeldByAddress(
    evt,
    effectiveCurrentState,
    base,
    activePartiesOnly,
    dnsMap,
  );

  const monitoringKeyPresent = Object.hasOwn(evt, "monitoring");
  let nextMonitoring: typeof base.monitoring;
  if (monitoringKeyPresent) {
    nextMonitoring =
      evt.monitoring === undefined ? base.monitoring : evt.monitoring;
  } else {
    nextMonitoring = base.monitoring;
  }
  let nextIsMonitoring: boolean;
  if (typeof evt.isMonitoring === "boolean") {
    nextIsMonitoring = evt.isMonitoring;
  } else if (monitoringKeyPresent && evt.monitoring === null) {
    nextIsMonitoring = false;
  } else {
    nextIsMonitoring = Boolean(base.isMonitoring);
  }

  if (
    shouldTerminateBargeMonitoringWithoutCustomer({
      parties: activePartiesOnly,
      isMonitoring: nextIsMonitoring,
      monitoring: nextMonitoring,
    })
  ) {
    shouldTerminate = true;
  }

  updated[callId] = normalizeConferenceFlagsForLiveParties({
    ...base,
    callId,
    currentState: effectiveCurrentState,
    sequence: evt.sequence,
    eventTime: evt.eventTime ?? base.eventTime ?? "",
    isConference: evt.isConference ?? base.isConference,
    isOneToOne: evt.isOneToOne ?? base.isOneToOne,
    parties: activePartiesOnly,
    isTerminating: shouldTerminate,
    hasActiveParticipants: resolveHasActiveParticipantsForEvent(
      evt,
      hasActiveParties,
    ),
    eventName: evt.eventName || base.eventName,
    heldByAddress,
    // Supervision metadata must follow each event; otherwise refresh/ongoing merge loses monitoring on the next event.
    isMonitoring: nextIsMonitoring,
    monitoring: nextMonitoring,
  });

  if (shouldTerminate) {
    notifyCallIdsRemoved?.([callId]);
    recordTerminatedCallForRebirthGuard(callId, evt, updated[callId]);
    const { [callId]: _removed, ...rest } = updated;
    saveCallStatesToStorage(rest);
    return rest;
  }

  applyStaleDroppedPartyCleanup(
    updated,
    callId,
    evt,
    processedParties,
    activePartiesOnly,
  );
  saveCallStatesToStorage(updated);
  return updated;
}

function pickCurrentStateFromActiveParties(activeParties: any[]): string {
  if (activeParties.some((p: any) => p.callStatus === "ON_HOLD")) {
    return "HELD";
  }
  if (activeParties.some((p: any) => p.callStatus === "RETRIEVED")) {
    return "RETRIEVED";
  }
  if (activeParties.some((p: any) => p.callStatus === "CONNECTED")) {
    return "ANSWERED";
  }
  if (activeParties.some((p: any) => p.callStatus === "ANSWERED")) {
    return "ANSWERED";
  }
  if (activeParties.some((p: any) => p.callStatus === "RINGING")) {
    return "RINGING";
  }
  return activeParties[0]?.callStatus || "ANSWERED";
}

export function resolveOngoingCallCurrentState(
  callData: { eventType?: string; currentState?: string },
  activeParties: any[],
): string {
  let currentState = callData.eventType || callData.currentState;
  if (
    (currentState === "DROPPED" || currentState === "DISCONNECTED") &&
    activeParties.length > 0
  ) {
    return pickCurrentStateFromActiveParties(activeParties);
  }
  if (!currentState && activeParties.length > 0) {
    const held = activeParties.find((p: any) => p.callStatus === "ON_HOLD");
    const retr = activeParties.find((p: any) => p.callStatus === "RETRIEVED");
    const conn = activeParties.find((p: any) => p.callStatus === "CONNECTED");
    if (held) {
      return "HELD";
    }
    if (retr) {
      return "RETRIEVED";
    }
    if (conn) {
      return "ANSWERED";
    }
    return activeParties[0]?.callStatus || "UNKNOWN";
  }
  return currentState || "UNKNOWN";
}

/**
 * Normalize CTI complete-state payload (array, nested `.data`, or DN-keyed map) into a flat device list.
 */
export function devicesArrayFromCompleteStatePayload(data: unknown): unknown[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data: unknown[] }).data)
  ) {
    return (data as { data: unknown[] }).data;
  }
  if (typeof data === "object" && data !== null) {
    return Object.values(
      data as Record<string, { devices?: Record<string, unknown> }>,
    ).flatMap((dnData) => Object.values(dnData.devices || {}));
  }
  return [];
}

/** Keys to ignore when detecting a flat call-id → call-state map from ongoing-calls payloads. */
const ONGOING_CALLS_PAYLOAD_METADATA_KEYS = new Set([
  "type",
  "message",
  "timestamp",
  "status",
  "error",
]);

/**
 * CTI may send ongoing calls as `{ callsByDn: { ... } }` or as a flat map of callId → call state.
 * Normalizes to a single map suitable for {@link mergeOngoingCallsIntoCallStateMap}.
 */
export function extractCallsByDnFromOngoingCallsPayload(
  data: unknown,
): Record<string, unknown> | null {
  if (!isRecord(data)) return null;

  const o = data;

  const direct = getCallsByDn(o, "callsByDn") ?? getCallsByDn(o, "calls_by_dn");
  if (direct) return direct;

  const keys = Object.keys(o).filter(
    (k) => !ONGOING_CALLS_PAYLOAD_METADATA_KEYS.has(k),
  );
  if (!keys.length) return null;

  const firstVal = o[keys[0]];
  if (!isCallLike(firstVal)) return null;

  const out: Record<string, unknown> = {};

  for (const k of keys) {
    const v = o[k];
    if (isCallLike(v, false)) {
      out[k] = v;
    }
  }

  return Object.keys(out).length ? out : null;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === "object" && !Array.isArray(val);
}

function getCallsByDn(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const val = obj[key];
  return isRecord(val) ? val : null;
}

function isCallLike(
  val: unknown,
  requireParties: boolean = true,
): val is Record<string, unknown> {
  if (!isRecord(val)) return false;

  const rec = val;

  const hasCallId = typeof rec.callId === "string";
  const hasParties = Array.isArray(rec.parties);

  return requireParties ? hasCallId && hasParties : hasCallId;
}

export function mergeOngoingCallsIntoCallStateMap(
  prev: Record<string, any>,
  callsByDn: Record<string, any>,
  onCallIdRemovedFromMap?: (callId: string) => void,
): Record<string, any> {
  const updated = { ...prev };

  Object.entries(callsByDn).forEach(([, callData]) => {
    if (!callData.callId) {
      return;
    }
    const callId = callData.callId;
    const shouldInclude =
      callData.hasActiveParticipants !== false &&
      callData.isTerminating !== true &&
      callData.parties?.length > 0;

    if (!shouldInclude) {
      if (updated[callId]) {
        recordTerminatedCallForRebirthGuard(
          callId,
          { eventTime: callData.eventTime, sequence: callData.sequence },
          updated[callId],
        );
        onCallIdRemovedFromMap?.(callId);
        delete updated[callId];
      }
      return;
    }

    const existingCall = updated[callId];
    const activeParties = preservePartyStartTimesFromBase(
      (callData.parties || []).filter(
        (p: any) =>
          p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
      ),
      existingCall?.parties,
    );

    if (activeParties.length === 0) {
      if (updated[callId]) {
        recordTerminatedCallForRebirthGuard(
          callId,
          { eventTime: callData.eventTime, sequence: callData.sequence },
          updated[callId],
        );
        onCallIdRemovedFromMap?.(callId);
        delete updated[callId];
      }
      return;
    }

    if (!existingCall && shouldSuppressOngoingRebirth(callId, callData)) {
      return;
    }

    const currentState = resolveOngoingCallCurrentState(
      callData,
      activeParties,
    );

    const normalizedState = String(currentState || "").toUpperCase();
    const isHeldState =
      normalizedState === "HELD" || normalizedState === "ON_HOLD";

    let heldByAddress: string | undefined;
    if (
      typeof callData.heldByAddress === "string" &&
      callData.heldByAddress.length > 0
    ) {
      heldByAddress = callData.heldByAddress;
    } else if (isHeldState && existingCall?.heldByAddress) {
      // Ongoing snapshots often omit heldBy; keep reducer-computed value so only the holder sees Resume.
      heldByAddress = existingCall.heldByAddress;
    } else {
      heldByAddress = undefined;
    }

    updated[callId] = normalizeConferenceFlagsForLiveParties({
      ...callData,
      callId,
      currentState: currentState || "UNKNOWN",
      parties: activeParties,
      hasActiveParticipants: callData.hasActiveParticipants !== false,
      isTerminating: callData.isTerminating === true,
      eventTime: callData.eventTime ?? existingCall?.eventTime ?? "",
      heldByAddress,
    });
  });

  return updated;
}

export function pickMostRecentCall<T extends { eventTime?: string }>(
  calls: T[],
): T {
  return calls
    .slice(1)
    .reduce(
      (a, b) =>
        new Date(b.eventTime || 0) > new Date(a.eventTime || 0) ? b : a,
      calls[0],
    );
}

export function mergeRemoteEventLogWithPrevious(
  prev: any[],
  masterLog: any[],
): any[] {
  const prevEventIds = new Set(
    prev
      .map((e: any) =>
        e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null,
      )
      .filter(Boolean),
  );
  const newEvents = masterLog.filter((e: any) => {
    const eventId =
      e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null;
    return Boolean(eventId && !prevEventIds.has(eventId));
  });
  if (masterLog.length > prev.length + 10) {
    return masterLog.slice(-200);
  }
  return [...prev, ...newEvents].slice(-200);
}
