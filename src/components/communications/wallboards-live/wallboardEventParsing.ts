/** Pure helpers for wallboard live dashboard eventLog / dnsMap parsing (Sonar: lowers index.tsx complexity). */

import { pickMostRecentCall } from "@hooks/ctiStompHelpers";

export type RegisteredDeviceEntry = {
  deviceName: string;
  when: string;
  lastCallEndTime?: string;
};

export function isCompleteStateLikeEvent(e: {
  type?: string;
  data?: { type?: string };
}): boolean {
  return (
    e.type === "initial-state" ||
    e.data?.type === "complete_state" ||
    e.type === "complete_state"
  );
}

export function devicesArrayFromCompleteStateEvent(completeStateEvent: {
  data?: unknown;
}): unknown[] {
  const data = completeStateEvent.data;
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

export function registeredEntriesFromDevices(
  devices: ReadonlyArray<{
    terminalState?: string;
    dn?: string;
    deviceName?: string;
    when?: string;
    lastCallEndTime?: string;
  }>,
): Record<string, RegisteredDeviceEntry> {
  const registered: Record<string, RegisteredDeviceEntry> = {};
  for (const device of devices) {
    if (
      device.terminalState === "REGISTERED" &&
      device.dn &&
      device.deviceName &&
      device.when
    ) {
      const key = `${device.dn}_${device.deviceName}`;
      registered[key] = {
        deviceName: device.deviceName,
        when: device.when,
        ...(device.lastCallEndTime && {
          lastCallEndTime: device.lastCallEndTime,
        }),
      };
    }
  }
  return registered;
}

export type DnsStateDevicePayload = {
  dn?: string;
  deviceName?: string;
  terminalState?: string;
  when?: string;
  lastCallEndTime?: string;
};

export function devicePayloadFromDnsStateEvent(event: {
  data?: { data?: unknown; dn?: string };
  dn?: string;
}): DnsStateDevicePayload | null {
  const fromNested = event.data?.data;
  if (fromNested && typeof fromNested === "object") {
    return fromNested as DnsStateDevicePayload;
  }
  if (event.data?.dn) {
    return event.data as DnsStateDevicePayload;
  }
  if (event.dn) {
    return event as DnsStateDevicePayload;
  }
  return null;
}

type Party = {
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  calledDeviceName?: string;
  callStatus?: string;
};

export function resolveMonitoredDeviceNameFromParties(
  parties: Party[],
  monitorDn: string,
  monitoredDn: string,
): string | null {
  let monitoredParty = parties.find(
    (p) => p.calledAddress === monitoredDn && p.callingAddress === monitorDn,
  );
  if (monitoredParty) {
    return (
      monitoredParty.calledDeviceName ||
      monitoredParty.callingDeviceName ||
      null
    );
  }
  monitoredParty = parties.find(
    (p) => p.callingAddress === monitoredDn && p.calledAddress === monitorDn,
  );
  if (monitoredParty) {
    return (
      monitoredParty.callingDeviceName ||
      monitoredParty.calledDeviceName ||
      null
    );
  }
  monitoredParty = parties.find(
    (p) => p.calledAddress === monitoredDn || p.callingAddress === monitoredDn,
  );
  if (monitoredParty) {
    return monitoredDn === monitoredParty.calledAddress
      ? (monitoredParty.calledDeviceName ?? null)
      : monitoredParty.callingDeviceName || null;
  }
  return null;
}

type DnsDevice = {
  terminalState?: string;
  deviceName?: string;
  deviceType?: string;
};

export function pickDeviceNameFromDnsEntry(
  devicesRecord: Record<string, DnsDevice> | undefined,
): string | null {
  if (!devicesRecord) {
    return null;
  }
  const devices = Object.values(devicesRecord);
  if (devices.length === 0) {
    return null;
  }
  return (
    devices.find((d) => d.terminalState === "REGISTERED")?.deviceName ||
    devices[0]?.deviceName ||
    null
  );
}

export function pickMonitorDeviceFromDns(
  devicesRecord: Record<string, DnsDevice> | undefined,
  monitorDeviceName: string | undefined,
): { monitorDeviceName?: string; monitorDeviceType?: string } {
  if (!devicesRecord) {
    return {};
  }
  const devices = Object.values(devicesRecord);
  if (devices.length === 0) {
    return {};
  }
  if (monitorDeviceName) {
    const device = devices.find((d) => d.deviceName === monitorDeviceName);
    if (device) {
      return { monitorDeviceName, monitorDeviceType: device.deviceType };
    }
  }
  const device =
    devices.find((d) => d.terminalState === "REGISTERED") || devices[0];
  return {
    monitorDeviceName: device?.deviceName,
    monitorDeviceType: device?.deviceType,
  };
}

export type MonitoringPayload = {
  monitorDn: string;
  monitoredDn: string;
  monitoringType: string;
  monitoredDeviceName?: string;
  monitorDeviceName?: string;
  monitorDeviceType?: string;
};

type IdleDnsEntry = {
  dn: unknown;
  devices?: Record<
    string,
    { terminalState?: string; when?: string; lastCallEndTime?: string }
  >;
};

export function getIdleSinceIsoFromCompleteStateForDn(
  dnsList: IdleDnsEntry[],
  dn: string,
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number,
): string | undefined {
  const dnEntry = dnsList.find((d) => String(d.dn) === dn);
  const deviceList = dnEntry ? Object.values(dnEntry.devices || {}) : [];
  let latestMs: number | undefined;
  for (const device of deviceList) {
    if (device.terminalState !== "REGISTERED") {
      continue;
    }
    const whenMs = parseServerTimeFn(device.when);
    const lastCallEndMs = parseServerTimeFn(device.lastCallEndTime);
    const idleSinceMs =
      whenMs && lastCallEndMs
        ? Math.max(whenMs, lastCallEndMs)
        : whenMs || lastCallEndMs;
    if (idleSinceMs && (latestMs === undefined || idleSinceMs > latestMs)) {
      latestMs = idleSinceMs;
    }
  }
  if (latestMs === undefined) {
    return undefined;
  }
  return new Date(latestMs).toISOString();
}

export function getLatestRegisteredWhenIsoForDn(
  dn: string,
  registeredDnsStore: Record<string, RegisteredDeviceEntry>,
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number,
): string | undefined {
  let latestMs: number | undefined;
  for (const [key, value] of Object.entries(registeredDnsStore)) {
    const [storeDn] = key.split("_");
    if (storeDn === String(dn) && value?.when) {
      const whenMs = parseServerTimeFn(value.when);
      const lastCallEndMs = parseServerTimeFn(value.lastCallEndTime);
      const idleSinceMs =
        whenMs && lastCallEndMs ? Math.max(whenMs, lastCallEndMs) : whenMs;
      if (idleSinceMs && (latestMs === undefined || idleSinceMs > latestMs)) {
        latestMs = idleSinceMs;
      }
    }
  }
  if (latestMs === undefined) {
    return undefined;
  }
  return new Date(latestMs).toISOString();
}

type MutableRef<T> = { current: T };

export type IdleSinceReconcileInput = {
  prev: Record<string, string>;
  dnsList: IdleDnsEntry[];
  currentSectionByDn: Record<string, string>;
  registeredDnsStore: Record<string, RegisteredDeviceEntry>;
  prevSectionByDnRef: MutableRef<Record<string, string>>;
  prevIsRegisteredByDnRef: MutableRef<Record<string, boolean>>;
  nowIso: string;
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number;
};

function ensureUniqueIdleMap(
  next: Record<string, string>,
  prev: Record<string, string>,
): Record<string, string> {
  return next === prev ? { ...prev } : next;
}

function applyActiveIdleForDn(
  input: IdleSinceReconcileInput,
  dnKey: string,
  prevSection: string | undefined,
  next: Record<string, string>,
  prev: Record<string, string>,
): Record<string, string> {
  const transitionedIntoIdle = !!prevSection && prevSection !== "activeIdle";
  if (transitionedIntoIdle) {
    const n = ensureUniqueIdleMap(next, prev);
    n[dnKey] = input.nowIso;
    return n;
  }
  const fromCompleteState = getIdleSinceIsoFromCompleteStateForDn(
    input.dnsList,
    dnKey,
    input.parseServerTimeFn,
  );
  const idleIso =
    fromCompleteState ||
    getLatestRegisteredWhenIsoForDn(
      dnKey,
      input.registeredDnsStore,
      input.parseServerTimeFn,
    ) ||
    next[dnKey] ||
    input.nowIso;
  const n = ensureUniqueIdleMap(next, prev);
  n[dnKey] = idleIso;
  return n;
}

function processIdleRowForDn(
  row: IdleDnsEntry,
  input: IdleSinceReconcileInput,
  next: Record<string, string>,
  prev: Record<string, string>,
  seenDns: Set<string>,
): Record<string, string> {
  const dnKey = String(row.dn);
  seenDns.add(dnKey);

  const deviceList = Object.values(row.devices || {});
  const isRegistered = deviceList.some((d) => d.terminalState === "REGISTERED");
  const currentSection = input.currentSectionByDn[dnKey];
  const prevSection = input.prevSectionByDnRef.current[dnKey];

  if (!isRegistered || currentSection === "downOffline") {
    let n = next;
    if (n[dnKey] !== undefined) {
      n = ensureUniqueIdleMap(n, prev);
      delete n[dnKey];
    }
    input.prevIsRegisteredByDnRef.current[dnKey] = isRegistered;
    input.prevSectionByDnRef.current[dnKey] = currentSection;
    return n;
  }

  let n = next;
  if (currentSection === "activeIdle") {
    n = applyActiveIdleForDn(input, dnKey, prevSection, n, prev);
  }
  input.prevIsRegisteredByDnRef.current[dnKey] = isRegistered;
  input.prevSectionByDnRef.current[dnKey] = currentSection;
  return n;
}

function dropIdleKeysForMissingDns(
  next: Record<string, string>,
  prev: Record<string, string>,
  seenDns: Set<string>,
): Record<string, string> {
  let n = next;
  for (const dnKey of Object.keys(n)) {
    if (seenDns.has(dnKey)) {
      continue;
    }
    n = ensureUniqueIdleMap(n, prev);
    delete n[dnKey];
  }
  return n;
}

export function computeNextIdleSinceMap(
  input: IdleSinceReconcileInput,
): Record<string, string> {
  const { prev, dnsList } = input;
  let next = prev;
  const seenDns = new Set<string>();
  for (const row of dnsList) {
    next = processIdleRowForDn(row, input, next, prev, seenDns);
  }
  next = dropIdleKeysForMissingDns(next, prev, seenDns);
  const prevKeys = Object.keys(prev);
  if (
    Object.keys(next).length === prevKeys.length &&
    prevKeys.every((k) => next[k] === prev[k])
  ) {
    return prev;
  }
  return next;
}

function normalizeMonitoringTypeForWallboardCompare(
  t: string | null | undefined,
): string {
  if (t == null || t === "") {
    return "";
  }
  return String(t).trim().toUpperCase().replaceAll(/-/g, "_");
}

/**
 * True when `active` should be updated to match `payload`.
 * When local monitoring was cleared (dn/type empty), returns false so stale callStateMap / eventLog
 * does not immediately re-apply the session the user just stopped (avoids setState + rerender loops).
 */
export function monitoringPayloadDiffersFromActive(
  active: {
    dn: string | null;
    type: string | null;
    monitor?: string;
    deviceName?: string | null;
  },
  payload: MonitoringPayload,
): boolean {
  if (!payload?.monitoredDn || !payload?.monitorDn) {
    return false;
  }

  if (!active.dn || !active.type) {
    return false;
  }

  const typeMatches =
    normalizeMonitoringTypeForWallboardCompare(active.type) ===
    normalizeMonitoringTypeForWallboardCompare(payload.monitoringType);

  return (
    active.dn !== payload.monitoredDn ||
    (!!payload.monitoredDeviceName &&
      active.deviceName !== payload.monitoredDeviceName) ||
    (active.monitor ?? undefined) !== (payload.monitorDn ?? undefined) ||
    !typeMatches
  );
}

/** Latest event in the log that carries supervision metadata (last event is often unrelated, e.g. dns_states). */
export function findLatestMonitoringEventFromLog(
  eventLog: readonly unknown[],
): {
  isMonitoring?: boolean;
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  };
  parties: Party[];
  sequence?: number;
  callId?: string;
  eventName?: string;
  eventType?: string;
} | null {
  for (let i = eventLog.length - 1; i >= 0; i -= 1) {
    const raw = eventLog[i];
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const evt = raw as {
      isMonitoring?: boolean;
      monitoring?: {
        monitorDn?: string;
        monitoredDn?: string;
        monitoringType?: string;
      };
      parties?: Party[];
    };
    if (evt.isMonitoring && evt.monitoring && evt.parties?.length) {
      return raw as {
        isMonitoring?: boolean;
        monitoring?: {
          monitorDn?: string;
          monitoredDn?: string;
          monitoringType?: string;
        };
        parties: Party[];
        sequence?: number;
        callId?: string;
        eventName?: string;
        eventType?: string;
      };
    }
  }
  return null;
}

function buildMonitoringPayloadFromPartiesAndDns(
  parties: Party[],
  monitoring: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  },
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): MonitoringPayload | null {
  const monitorDn = monitoring.monitorDn;
  const monitoredDn = monitoring.monitoredDn;
  const monitoringType =
    (monitoring.monitoringType && String(monitoring.monitoringType).trim()) ||
    "SILENT";
  if (!monitorDn || !monitoredDn) {
    return null;
  }

  let monitoredDeviceName = resolveMonitoredDeviceNameFromParties(
    parties,
    monitorDn,
    monitoredDn,
  );
  if (!monitoredDeviceName) {
    monitoredDeviceName = pickDeviceNameFromDnsEntry(
      dnsMap[monitoredDn]?.devices,
    );
  }

  const supervisorParty = parties.find(
    (p) => p.callingAddress === monitorDn || p.calledAddress === monitorDn,
  );
  let monitorDeviceName =
    supervisorParty?.callingDeviceName || supervisorParty?.calledDeviceName;
  let monitorDeviceType: string | undefined;

  if (monitorDeviceName && dnsMap[monitorDn]?.devices) {
    const devices = Object.values(dnsMap[monitorDn].devices || {});
    const device = devices.find((d) => d.deviceName === monitorDeviceName);
    monitorDeviceType = device?.deviceType;
  }

  if (!monitorDeviceName && dnsMap[monitorDn]?.devices) {
    const picked = pickMonitorDeviceFromDns(
      dnsMap[monitorDn].devices,
      undefined,
    );
    monitorDeviceName = picked.monitorDeviceName;
    monitorDeviceType = picked.monitorDeviceType;
  }

  return {
    monitorDn,
    monitoredDn,
    monitoringType,
    monitoredDeviceName: monitoredDeviceName || undefined,
    monitorDeviceName,
    monitorDeviceType,
  };
}

/** Supervisor-only: used when the viewer must be the monitor (e.g. dialer-owned flows). */
export function buildMonitoringPayloadFromEvent(
  parties: Party[],
  monitoring: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  },
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  userAddress: string,
): MonitoringPayload | null {
  const monitorDn = monitoring.monitorDn;
  if (monitorDn !== userAddress) {
    return null;
  }
  return buildMonitoringPayloadFromPartiesAndDns(parties, monitoring, dnsMap);
}

/**
 * Wallboard: same device resolution as {@link buildMonitoringPayloadFromEvent} but does not require
 * the current user to be the supervisor. Every SSE client (any logged-in viewer) needs the same
 * active monitoring snapshot for cards/sections.
 */
export function buildWallboardMonitoringPayloadFromEvent(
  parties: Party[],
  monitoring: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  },
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): MonitoringPayload | null {
  return buildMonitoringPayloadFromPartiesAndDns(parties, monitoring, dnsMap);
}

type MonitoringCallStateSlice = {
  parties?: Party[];
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  };
  isMonitoring?: boolean;
  isTerminating?: boolean;
  hasActiveParticipants?: boolean;
  eventTime?: string;
};

function parseEventTimeMsForMonitoringPick(
  eventTime: string | undefined,
): number {
  if (!eventTime || typeof eventTime !== "string") {
    return 0;
  }
  const ms = new Date(eventTime).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function isWallboardMonitoringCallStateCandidate(
  call: MonitoringCallStateSlice,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  if (call.isTerminating === true) {
    return false;
  }
  if (call.hasActiveParticipants === false) {
    return false;
  }
  const m = call.monitoring;
  if (m?.monitorDn && m?.monitoredDn) {
    return true;
  }
  // Ongoing-calls / replay snapshots may omit the monitoring block but keep isMonitoring.
  return call.isMonitoring === true;
}

/**
 * When {@link mergeOngoingCallsIntoCallStateMap} or replay has isMonitoring but no structured
 * monitoring object, infer supervisor vs agent from two known internal DNs on one party leg.
 */
function inferMonitorDnPairFromInternalParties(
  parties: Party[],
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): { monitorDn: string; monitoredDn: string } | null {
  const isKnownDn = (a: string | undefined) =>
    Boolean(a && Object.hasOwn(dnsMap, String(a)));

  for (const p of parties) {
    if (p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED") {
      continue;
    }
    const callingAddress = String(p.callingAddress ?? "");
    const calledAddress = String(p.calledAddress ?? "");
    if (
      !isKnownDn(callingAddress) ||
      !isKnownDn(calledAddress) ||
      callingAddress === calledAddress
    ) {
      continue;
    }
    const devA = resolveMonitoredDeviceNameFromParties(
      parties,
      callingAddress,
      calledAddress,
    );
    const devB = resolveMonitoredDeviceNameFromParties(
      parties,
      calledAddress,
      callingAddress,
    );
    if (devA && !devB) {
      return { monitorDn: callingAddress, monitoredDn: calledAddress };
    }
    if (devB && !devA) {
      return { monitorDn: calledAddress, monitoredDn: callingAddress };
    }
    return { monitorDn: callingAddress, monitoredDn: calledAddress };
  }
  return null;
}

function tryBuildWallboardMonitoringPayloadFromCallStateSlice(
  call: MonitoringCallStateSlice,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): MonitoringPayload | null {
  const parties = call.parties;
  if (!parties?.length) {
    return null;
  }
  const m = call.monitoring;
  if (m?.monitorDn && m?.monitoredDn) {
    return buildWallboardMonitoringPayloadFromEvent(
      parties,
      {
        monitorDn: m.monitorDn,
        monitoredDn: m.monitoredDn,
        monitoringType: m.monitoringType,
      },
      dnsMap,
    );
  }
  if (call.isMonitoring !== true) {
    return null;
  }
  const inferred = inferMonitorDnPairFromInternalParties(parties, dnsMap);
  if (!inferred) {
    return null;
  }
  return buildWallboardMonitoringPayloadFromEvent(
    parties,
    {
      monitorDn: inferred.monitorDn,
      monitoredDn: inferred.monitoredDn,
      monitoringType: m?.monitoringType,
    },
    dnsMap,
  );
}

/**
 * After reload, `eventLog` may be empty while `callStateMap` already includes ongoing_calls merge.
 * Picks the latest active supervision session (by eventTime) for wallboard UI — same for every viewer.
 */
export function pickBestMonitoringPayloadFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): MonitoringPayload | null {
  if (!callStateMap || typeof callStateMap !== "object") {
    return null;
  }

  const scored: { payload: MonitoringPayload; eventTimeMs: number }[] = [];

  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (!isWallboardMonitoringCallStateCandidate(c)) {
      continue;
    }
    const parties = c.parties;
    if (!parties?.length) {
      continue;
    }
    const payload = tryBuildWallboardMonitoringPayloadFromCallStateSlice(
      c,
      dnsMap,
    );
    if (!payload) {
      continue;
    }
    scored.push({
      payload,
      eventTimeMs: parseEventTimeMsForMonitoringPick(c.eventTime),
    });
  }

  if (scored.length === 0) {
    return null;
  }
  scored.sort((a, b) => b.eventTimeMs - a.eventTimeMs);
  return scored[0]?.payload ?? null;
}

type LooseWallboardCall = {
  isTerminating?: boolean;
  isMonitoring?: boolean;
  parties?: Array<{
    callingAddress?: string;
    calledAddress?: string;
    callStatus?: string;
  }>;
  eventTime?: string;
  callId?: string;
};

function callHasLiveSupervisorAndAgentParties(
  call: LooseWallboardCall,
  supervisorDn: string,
  agentDn: string,
): boolean {
  const supervisor = String(supervisorDn);
  const agent = String(agentDn);
  if (!call.parties?.length) {
    return false;
  }
  return call.parties.some((p) => {
    if (p.callStatus === "DROPPED" || p.callStatus === "DISCONNECTED") {
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

function shapeCallLikeGetDnCallState(
  dn: string,
  call: LooseWallboardCall,
): unknown {
  const activeParties =
    call.parties?.filter(
      (p) => p.callStatus !== "DROPPED" && p.callStatus !== "DISCONNECTED",
    ) ?? [];
  if (activeParties.length === 0) {
    return null;
  }
  const dnStr = String(dn);
  const matchedParty = activeParties.find(
    (p) =>
      String(p.callingAddress) === dnStr || String(p.calledAddress) === dnStr,
  );
  if (!matchedParty) {
    return null;
  }
  return {
    ...call,
    parties: activeParties,
    role: String(matchedParty.callingAddress) === dnStr ? "calling" : "called",
    isActive: true,
  };
}

/**
 * Prefer the agent's customer/handled call, not the supervisor–agent observation leg.
 * `getCallStateForDevice` alone can still pick the monitoring session when it is most recent
 * and the same device appears on both calls.
 */
export function pickMonitoredAgentWallboardCall(
  monitoredDn: string,
  monitorDn: string | undefined,
  getCallStatesForDn: (dn: string) => unknown[],
  getCallStateForDevice: (dn: string, deviceName: string) => unknown,
  deviceName: string | null | undefined,
): unknown {
  const calls = getCallStatesForDn(monitoredDn) as LooseWallboardCall[];
  const withoutObservationLeg = calls.filter((c) => {
    if (c.isTerminating) {
      return false;
    }
    if (c.isMonitoring === true) {
      return false;
    }
    if (
      monitorDn &&
      callHasLiveSupervisorAndAgentParties(c, monitorDn, monitoredDn)
    ) {
      return false;
    }
    return true;
  });

  if (withoutObservationLeg.length > 0) {
    const mostRecent = pickMostRecentCall(withoutObservationLeg);
    const shaped = shapeCallLikeGetDnCallState(monitoredDn, mostRecent);
    if (shaped) {
      return shaped;
    }
  }

  if (deviceName != null && String(deviceName) !== "") {
    const deviceCall = getCallStateForDevice(
      String(monitoredDn),
      String(deviceName),
    );
    if (deviceCall) {
      return deviceCall;
    }
  }

  return null;
}

export function resolveWallboardDisplayCall(
  dn: string,
  activeMonitoring: {
    dn?: string | null;
    monitor?: string;
    deviceName?: string | null;
  },
  getDnCallState: (d: string) => unknown,
  getCallStateForDevice: (d: string, deviceName: string) => unknown,
  getCallStatesForDn: (d: string) => unknown[],
): unknown {
  const monitoredDn = activeMonitoring?.dn;
  if (monitoredDn != null && String(dn) === String(monitoredDn)) {
    const picked = pickMonitoredAgentWallboardCall(
      String(monitoredDn),
      activeMonitoring.monitor,
      getCallStatesForDn,
      getCallStateForDevice,
      activeMonitoring.deviceName,
    );
    if (picked) {
      return picked;
    }
  }
  return getDnCallState(dn);
}
