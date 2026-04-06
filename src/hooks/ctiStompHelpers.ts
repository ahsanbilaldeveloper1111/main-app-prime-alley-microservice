/**
 * Pure helpers for useCtiStomp — keeps the hook under Sonar cognitive-complexity limits.
 */

const LOAD_PERSIST_ACTIVE_STATUSES = new Set([
  "CONNECTED",
  "RETRIEVED",
  "ON_HOLD",
  "RINGING",
  "ANSWERED",
]);

const SAVE_PERSIST_ACTIVE_STATUSES = new Set(["CONNECTED", "RETRIEVED", "ON_HOLD"]);
const SAVE_ESTABLISHED_STATUSES = new Set(["CONNECTED", "RETRIEVED"]);

export function partyLegHasStartTime(startTime: unknown): boolean {
  if (startTime == null) {
    return false;
  }
  if (typeof startTime === "string" && startTime.trim() === "") {
    return false;
  }
  return true;
}

export function preservePartyStartTimesFromBase(
  parties: any[],
  baseParties: any[] | undefined,
): any[] {
  if (!baseParties?.length) {
    return parties;
  }
  return parties.map((party) => {
    if (partyLegHasStartTime(party?.startTime)) {
      return party;
    }
    const prev = baseParties.find(
      (b: any) =>
        b?.callingAddress === party?.callingAddress &&
        b?.calledAddress === party?.calledAddress,
    );
    if (prev && partyLegHasStartTime(prev.startTime)) {
      return { ...party, startTime: prev.startTime };
    }
    return party;
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

export function inferCallingDeviceTypeFromDeviceName(deviceName: string): string {
  const n = deviceName.toLowerCase();
  if (n.includes("android") || n.includes("mobile")) {
    return "MOBILE";
  }
  return "SOFT_HARD";
}

function findDeviceTypeInDnsMap(
  dnsMap: Record<string, { devices: Record<string, { deviceName: string; deviceType: string }> }>,
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
  dnsMap: Record<string, { dn: string; devices: Record<string, { deviceName: string; deviceType: string }> }>,
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
  if (!party.callingDeviceType && party.callingAddress && party.callingDeviceName) {
    const fromMap = findDeviceTypeInDnsMap(dnsMap, party.callingAddress, party.callingDeviceName);
    if (fromMap) {
      party.callingDeviceType = fromMap;
    }
  }
  if (!party.callingDeviceType && party.callingDeviceName) {
    party.callingDeviceType = inferCallingDeviceTypeFromDeviceName(party.callingDeviceName);
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
  return Object.entries(parsed).reduce((acc, [callId, raw]) => {
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
      normalizedState = normalizeStateFromActivePartiesForDropped(activeParties);
    }
    acc[callId] = {
      ...event,
      currentState: normalizedState,
      parties: activeParties,
      hasActiveParticipants: activeParties.length > 0,
    };
    return acc;
  }, {} as Record<string, unknown>);
}

export function reduceSaveCallStates(callStates: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(callStates).reduce((acc, [callId, raw]) => {
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
      normalizedState = normalizeStateFromActivePartiesForDropped(activeParties);
    }
    acc[callId] = {
      ...callEvent,
      currentState: normalizedState,
      hasActiveParticipants: true,
    };
    return acc;
  }, {} as Record<string, unknown>);
}

function partyPairMatchesDropped(
  p: any,
  droppedPair: { calling: any; called: any },
): boolean {
  return (
    (p.callingAddress === droppedPair.calling && p.calledAddress === droppedPair.called) ||
    (p.callingAddress === droppedPair.called && p.calledAddress === droppedPair.calling)
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
      partyPairMatchesDropped(p, droppedPair) ? { ...p, callStatus: "DROPPED" } : p,
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
    .filter((p: any) => p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED")
    .map((p: any) => ({
      calling: p.callingAddress,
      called: p.calledAddress,
    }));

  const currentEventTime = new Date(evt.eventTime).getTime();

  for (const droppedPair of droppedPartyPairs) {
    applyDroppedPairToOtherCalls(updated, callId, droppedPair, currentEventTime);
  }
}

function tryRemoveCallOnEarlyExit(
  updated: Record<string, any>,
  callId: string,
  evt: any,
  saveCallStatesToStorage: (m: Record<string, any>) => void,
): Record<string, any> | null {
  if (evt.isTerminating) {
    const { [callId]: _, ...rest } = updated;
    saveCallStatesToStorage(rest);
    return rest;
  }
  if (evt.eventType === "DISCONNECTED" && evt.parties) {
    const allPartiesDroppedEarly =
      evt.parties.length > 0 &&
      evt.parties.every(
        (p: any) => p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED",
      );
    if (allPartiesDroppedEarly || evt.hasActiveParticipants === false) {
      const { [callId]: _, ...rest } = updated;
      saveCallStatesToStorage(rest);
      return rest;
    }
  }
  return null;
}

function shouldIgnoreStaleEvent(evt: any, base: any, eventTimeMs: number): boolean {
  const existingEventTimeMs = base.eventTime ? new Date(base.eventTime).getTime() : 0;
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
    (!hasActiveParties && processedParties.length > 0 && evt.eventType !== "RINGING") ||
    (evt.eventType === "DISCONNECTED" && !hasActiveParties)
  );
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

function computeHeldByAddress(
  evt: any,
  effectiveCurrentState: string,
  base: any,
  activePartiesOnly: any[],
): string | undefined {
  if (evt.eventType === "HELD" && activePartiesOnly.length >= 1) {
    const p = activePartiesOnly[0];
    const calling = p.callingAddress;
    const called = p.calledAddress;
    const details = String((evt as { details?: string }).details || "");
    const globalCallingRe = /GlobalCalling:(\S+)/;
    const globalCallingMatch = globalCallingRe.exec(details);
    if (globalCallingMatch) {
      const globalCalling = globalCallingMatch[1].trim();
      return calling === globalCalling ? called : calling;
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
  dnsMap: Record<string, { dn: string; devices: Record<string, { deviceName: string; deviceType: string }> }>,
  saveCallStatesToStorage: (m: Record<string, any>) => void,
): Record<string, any> {
  const updated = { ...prev };
  const base = updated[callId] || {};

  const eventTimeMs = evt.eventTime ? new Date(evt.eventTime).getTime() : 0;

  const early = tryRemoveCallOnEarlyExit(updated, callId, evt, saveCallStatesToStorage);
  if (early) {
    return early;
  }

  if (shouldIgnoreStaleEvent(evt, base, eventTimeMs)) {
    return updated;
  }

  const partiesToProcess = evt.parties || base.parties || [];
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
  const shouldTerminate = computeShouldTerminate(
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
  );

  updated[callId] = {
    ...base,
    callId,
    currentState: effectiveCurrentState,
    sequence: evt.sequence,
    eventTime: evt.eventTime ?? base.eventTime ?? "",
    isConference: evt.isConference ?? base.isConference,
    isOneToOne: evt.isOneToOne ?? base.isOneToOne,
    parties: activePartiesOnly,
    isTerminating: shouldTerminate,
    hasActiveParticipants: resolveHasActiveParticipantsForEvent(evt, hasActiveParties),
    eventName: evt.eventName || base.eventName,
    heldByAddress,
    // Supervision metadata must follow each event; otherwise refresh/ongoing merge loses monitoring on the next event.
    isMonitoring: evt.isMonitoring ?? base.isMonitoring,
    monitoring: evt.monitoring ?? base.monitoring,
  };

  if (shouldTerminate) {
    const { [callId]: _removed, ...rest } = updated;
    saveCallStatesToStorage(rest);
    return rest;
  }

  applyStaleDroppedPartyCleanup(updated, callId, evt, processedParties, activePartiesOnly);
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

  const o = data ;

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
        delete updated[callId];
      }
      return;
    }

    const existingCall = updated[callId];
    const activeParties = preservePartyStartTimesFromBase(
      (callData.parties || []).filter(
        (p: any) => p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
      ),
      existingCall?.parties,
    );

    if (activeParties.length === 0) {
      if (updated[callId]) {
        delete updated[callId];
      }
      return;
    }

    const currentState = resolveOngoingCallCurrentState(callData, activeParties);

    updated[callId] = {
      ...callData,
      callId,
      currentState: currentState || "UNKNOWN",
      parties: activeParties,
      hasActiveParticipants: callData.hasActiveParticipants !== false,
      isTerminating: callData.isTerminating === true,
      eventTime: callData.eventTime ?? existingCall?.eventTime ?? "",
      ...(currentState === "HELD" &&
        existingCall?.heldByAddress != null && {
          heldByAddress: existingCall.heldByAddress,
        }),
    };
  });

  return updated;
}

export function pickMostRecentCall<T extends { eventTime?: string }>(calls: T[]): T {
  return calls.slice(1).reduce((a, b) => (new Date(b.eventTime || 0) > new Date(a.eventTime || 0) ? b : a), calls[0]);
}

export function mergeRemoteEventLogWithPrevious(prev: any[], masterLog: any[]): any[] {
  const prevEventIds = new Set(
    prev
      .map((e: any) => (e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null))
      .filter(Boolean),
  );
  const newEvents = masterLog.filter((e: any) => {
    const eventId = e.callId && e.eventTime ? `${e.callId}-${e.eventTime}` : null;
    return Boolean(eventId && !prevEventIds.has(eventId));
  });
  if (masterLog.length > prev.length + 10) {
    return masterLog.slice(-200);
  }
  return [...prev, ...newEvents].slice(-200);
}
