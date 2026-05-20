/** Pure helpers for wallboard live dashboard eventLog / dnsMap parsing (Sonar: lowers index.tsx complexity). */

import { pickMostRecentCall } from "@hooks/ctiStompHelpers";
import { normalizeConferenceFlagsForLiveParties } from "@utils/ctiCallDisplay";
import { normalizeCtiApiMonitoringDeviceType } from "@utils/ctiApiDeviceType";
import type { ActiveMonitoring, MonitoringTeardownHint } from "@components/live-calls/utils/types";
import { ctiAddressesEquivalent } from "@utils/ctiAddressMatching";
import {
  callHasLiveAgentPartyWithNonSupervisor,
  partyIsLiveCtiParty,
} from "@utils/ctiMonitoringCallParties";

export { callHasLiveAgentPartyWithNonSupervisor } from "@utils/ctiMonitoringCallParties";

export type RegisteredDeviceEntry = {
  deviceName: string;
  when: string;
  lastCallEndTime?: string;
};

/** Parse server timestamps as UTC when no offset is present (matches live wallboard). */
export function parseWallboardTimestampToMs(
  isoOrDate: string | null | undefined,
): number {
  if (!isoOrDate || typeof isoOrDate !== "string") {
    return 0;
  }
  const s = isoOrDate.trim();
  if (!s) {
    return 0;
  }
  const hasTz = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(s);
  const toParse = hasTz ? s : `${s}Z`;
  const ms = new Date(toParse).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

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
    // Prefer last call end; `when` is refreshed on dns_states and must not reset idle.
    let idleSinceMs: number | undefined;
    if (lastCallEndMs > 0) {
      idleSinceMs = lastCallEndMs;
    } else if (whenMs > 0) {
      idleSinceMs = whenMs;
    }
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
    if (storeDn === String(dn) && (value?.when || value?.lastCallEndTime)) {
      const whenMs = parseServerTimeFn(value.when);
      const lastCallEndMs = parseServerTimeFn(value.lastCallEndTime);
      let idleSinceMs: number | undefined;
      if (lastCallEndMs > 0) {
        idleSinceMs = lastCallEndMs;
      } else if (whenMs > 0) {
        idleSinceMs = whenMs;
      }
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
  return String(t).trim().toUpperCase().replaceAll("-", "_");
}

/**
 * True when `active` should be updated to match `payload`.
 * When local monitoring was cleared (dn/type empty), returns true so viewers can hydrate from
 * callStateMap; {@link WallboardsLiveView} uses suppressedMonitoringRefillKeyRef after explicit stop.
 */
/**
 * After stop-barge, refill is suppressed for the same supervisor:agent key. Allow refill again when
 * CTI reports a different supervision channel (e.g. WHISPER after BARGE_IN ended).
 */
export function shouldBlockMonitoringRefillDueToSuppression(
  suppressedKey: string | null,
  sessionKey: string,
  monitoredDn: string,
  activeType: string | null | undefined,
  incomingType: string,
): boolean {
  if (!suppressedKey) {
    return false;
  }
  const matchesSuppressedSession =
    suppressedKey === sessionKey || suppressedKey === `*:${monitoredDn}`;
  if (!matchesSuppressedSession) {
    return false;
  }
  const activeNorm = normalizeMonitoringTypeForWallboardCompare(activeType);
  const incomingNorm = normalizeMonitoringTypeForWallboardCompare(incomingType);
  if (!activeNorm) {
    // Explicit stop cleared local state — block stale SSE/callStateMap barge refill.
    return incomingNorm === "BARGE_IN" || incomingNorm === "BARGEIN";
  }
  return activeNorm === incomingNorm;
}

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
    return true;
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

type WallboardLogEventSlice = {
  eventType?: string;
  eventName?: string;
  parties?: Party[];
  callId?: string;
  isMonitoring?: boolean;
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  };
};

function wallboardLogEventIsSupervisionSnapshot(
  evt: WallboardLogEventSlice,
): boolean {
  if (
    !evt.monitoring?.monitorDn ||
    !evt.monitoring?.monitoredDn ||
    !evt.parties?.length
  ) {
    return false;
  }
  if (evt.isMonitoring === true) {
    return true;
  }
  const mt = String(evt.monitoring.monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return (
    mt === "SILENT" ||
    mt === "WHISPER" ||
    mt === "BARGE_IN" ||
    mt === "BARGEIN"
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
    const evt = raw as WallboardLogEventSlice;
    if (wallboardLogEventIsSupervisionSnapshot(evt)) {
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

export type WallboardActiveMonitoringSnapshot = {
  dn: string | null;
  monitor?: string;
  deviceName?: string | null;
};

/** CTI often keeps a stale DROPPED supervisor↔agent party on conference barge events while isMonitoring stays true. */
function wallboardEventClaimsActiveMonitoringForPair(
  evt: WallboardLogEventSlice,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  if (!evt.isMonitoring || !evt.monitoring?.monitorDn || !evt.monitoring?.monitoredDn) {
    return false;
  }
  return (
    ctiAddressesEquivalent(evt.monitoring.monitorDn, monitorDn) &&
    ctiAddressesEquivalent(evt.monitoring.monitoredDn, monitoredDn)
  );
}

function involvesDnOnParty(party: Party, dn: string): boolean {
  return (
    ctiAddressesEquivalent(party.callingAddress, dn) ||
    ctiAddressesEquivalent(party.calledAddress, dn)
  );
}

function isTerminatedWallboardParty(party: Party): boolean {
  const s = party.callStatus ?? "";
  return s === "DROPPED" || s === "DISCONNECTED" || s === "ENDED";
}

function isWallboardLogEventSlice(raw: unknown): raw is WallboardLogEventSlice {
  return raw !== null && typeof raw === "object";
}

function parseWallboardLogEvent(raw: unknown): WallboardLogEventSlice | null {
  return isWallboardLogEventSlice(raw) ? raw : null;
}

function isMonitoringSessionStartForActive(
  evt: WallboardLogEventSlice,
  active: WallboardActiveMonitoringSnapshot,
): boolean {
  const m = evt.monitoring;
  if (!evt.isMonitoring || !m?.monitorDn || !m?.monitoredDn || !active.monitor || !active.dn) {
    return false;
  }
  return (
    ctiAddressesEquivalent(m.monitorDn, active.monitor) &&
    ctiAddressesEquivalent(m.monitoredDn, active.dn)
  );
}

/**
 * Index of the latest BARGE_IN / monitoring start for this supervisor↔agent pair in the scan window.
 * Terminal clears must only consider events **after** this index (older DROPPED legs from prior sessions
 * or setup must not clear a session that just started).
 */
export function findLatestMonitoringSessionStartLogIndex(
  eventLog: readonly unknown[],
  active: WallboardActiveMonitoringSnapshot,
  scanDepth = 40,
): number {
  if (!active.dn || !active.monitor || !eventLog.length) {
    return -1;
  }
  const start = Math.max(0, eventLog.length - scanDepth);
  for (let i = eventLog.length - 1; i >= start; i -= 1) {
    const evt = parseWallboardLogEvent(eventLog[i]);
    if (evt && isMonitoringSessionStartForActive(evt, active)) {
      return i;
    }
  }
  return -1;
}

type TerminalMonitoringClearContext = {
  monitoredDn: string;
  supervisorDn?: string;
  monitoredDeviceName?: string | null;
};

function isTerminalWallboardEventType(eventType: string | undefined): boolean {
  return (
    eventType === "DROPPED" ||
    eventType === "DISCONNECTED" ||
    eventType === "ENDED"
  );
}

function isSupervisorMonitoredTerminalDrop(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): boolean {
  const { supervisorDn, monitoredDn } = ctx;
  if (!supervisorDn || !evt.parties?.length) {
    return false;
  }
  if (!isTerminalWallboardEventType(evt.eventType)) {
    return false;
  }
  return evt.parties.some(
    (party) =>
      isTerminatedWallboardParty(party) &&
      involvesDnOnParty(party, supervisorDn) &&
      involvesDnOnParty(party, monitoredDn),
  );
}

function terminalClearReasonFromLogEvent(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): string | null {
  if (
    ctx.supervisorDn &&
    wallboardEventClaimsActiveMonitoringForPair(
      evt,
      ctx.supervisorDn,
      ctx.monitoredDn,
    )
  ) {
    return null;
  }

  if (
    evt.eventName === "CallObservationEndedEvImpl" &&
    isSupervisorMonitoredTerminalDrop(evt, ctx)
  ) {
    return "monitoring call ended";
  }

  if (isSupervisorMonitoredTerminalDrop(evt, ctx)) {
    return "monitoring call ended";
  }

  if (!isTerminalWallboardEventType(evt.eventType) || !evt.parties?.length) {
    return null;
  }

  const monitoredPartiesOnEvent = evt.parties.filter((party) =>
    involvesDnOnParty(party, ctx.monitoredDn),
  );

  const monitoredDrop = monitoredPartiesOnEvent.some((party) => {
    if (!isTerminatedWallboardParty(party)) {
      return false;
    }
    if (!ctx.monitoredDeviceName) {
      return true;
    }
    return (
      party.callingDeviceName === ctx.monitoredDeviceName ||
      party.calledDeviceName === ctx.monitoredDeviceName
    );
  });

  if (monitoredDrop) {
    return "call dropped";
  }

  // Hang-up from Jabber/other device may not match stored monitoredDeviceName (WebCTI).
  if (
    monitoredPartiesOnEvent.length > 0 &&
    monitoredPartiesOnEvent.every((party) => isTerminatedWallboardParty(party))
  ) {
    return "call dropped";
  }

  // External/PSTN hung up on a barge call — agent leg may still show CONNECTED to supervisor.
  if (ctx.supervisorDn) {
    const externalLegEnded = evt.parties.some((party) => {
      if (!isTerminatedWallboardParty(party)) {
        return false;
      }
      if (!involvesDnOnParty(party, ctx.monitoredDn)) {
        return false;
      }
      const other =
        ctiAddressesEquivalent(party.callingAddress, ctx.monitoredDn)
          ? party.calledAddress
          : party.callingAddress;
      if (!other) {
        return false;
      }
      if (ctiAddressesEquivalent(other, ctx.monitoredDn)) {
        return false;
      }
      if (ctiAddressesEquivalent(other, ctx.supervisorDn)) {
        return false;
      }
      return true;
    });
    if (externalLegEnded) {
      return "external party ended call";
    }
  }

  return null;
}

/**
 * Scans recent eventLog (not only the tail) for terminal supervision / barge events
 * so monitoring UI clears when a middle event ended the session but a later non-call
 * entry (e.g. initial-state) became eventLog.at(-1).
 */
export function findTerminalMonitoringClearInRecentLog(
  eventLog: readonly unknown[],
  active: WallboardActiveMonitoringSnapshot,
  scanDepth = 40,
): string | null {
  const monitoredDn = active.dn;
  if (!monitoredDn || !eventLog.length) {
    return null;
  }
  const ctx: TerminalMonitoringClearContext = {
    monitoredDn,
    supervisorDn: active.monitor,
    monitoredDeviceName: active.deviceName,
  };
  const start = Math.max(0, eventLog.length - scanDepth);
  const sessionStartIndex = findLatestMonitoringSessionStartLogIndex(
    eventLog,
    active,
    scanDepth,
  );

  for (let i = eventLog.length - 1; i >= start; i -= 1) {
    if (sessionStartIndex >= 0 && i <= sessionStartIndex) {
      break;
    }
    const evt = parseWallboardLogEvent(eventLog[i]);
    if (!evt?.parties?.length) {
      continue;
    }
    const reason = terminalClearReasonFromLogEvent(evt, ctx);
    if (reason) {
      return reason;
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
    monitorDeviceType:
      monitorDeviceType != null && String(monitorDeviceType).trim() !== ""
        ? normalizeCtiApiMonitoringDeviceType(monitorDeviceType)
        : undefined,
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

/** Shared shape for call-state and loose wallboard call party checks. */
type WallboardCallPartiesSlice = {
  parties?: Party[];
  monitoring?: {
    monitorDn?: string;
    monitoredDn?: string;
    monitoringType?: string;
  };
  isMonitoring?: boolean;
  isTerminating?: boolean;
};

type MonitoringCallStateSlice = WallboardCallPartiesSlice & {
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

function supervisionMonitoringPartiesAllTerminal(
  parties: Party[],
  monitorDn: string,
  monitoredDn: string,
): boolean {
  const relevant = parties.filter(
    (p) =>
      (ctiAddressesEquivalent(p.callingAddress, monitorDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitorDn)) &&
      (ctiAddressesEquivalent(p.callingAddress, monitoredDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitoredDn)),
  );
  if (relevant.length === 0) {
    return false;
  }
  return relevant.every((p) => !partyIsLiveForWallboard(p));
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
    if (
      supervisionMonitoringPartiesAllTerminal(
        call.parties,
        m.monitorDn,
        m.monitoredDn,
      )
    ) {
      return callHasLiveAgentPartyWithNonSupervisor(
        call,
        m.monitoredDn,
        m.monitorDn,
      );
    }
    return true;
  }
  if (call.isMonitoring !== true) {
    return false;
  }
  if (call.parties.every((p) => !partyIsLiveForWallboard(p))) {
    return false;
  }
  return true;
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

type ScoredMonitoringPayload = {
  payload: MonitoringPayload;
  eventTimeMs: number;
  sequence?: number;
};

function pickNewerScoredMonitoringPayload(
  mapScored: ScoredMonitoringPayload | null,
  logScored: ScoredMonitoringPayload | null,
): MonitoringPayload | null {
  if (!mapScored && !logScored) {
    return null;
  }
  if (!mapScored) {
    return logScored?.payload ?? null;
  }
  if (!logScored) {
    return mapScored.payload;
  }
  if (logScored.eventTimeMs !== mapScored.eventTimeMs) {
    return logScored.eventTimeMs > mapScored.eventTimeMs
      ? logScored.payload
      : mapScored.payload;
  }
  const logSeq = logScored.sequence ?? 0;
  const mapSeq = mapScored.sequence ?? 0;
  return logSeq >= mapSeq ? logScored.payload : mapScored.payload;
}

/**
 * After reload, `eventLog` may be empty while `callStateMap` already includes ongoing_calls merge.
 * Picks the latest active supervision session (by eventTime) for wallboard UI — same for every viewer.
 */
export function pickBestMonitoringPayloadFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): MonitoringPayload | null {
  return (
    pickBestScoredMonitoringPayloadFromCallStateMap(callStateMap, dnsMap)?.payload ??
    null
  );
}

function pickBestScoredMonitoringPayloadFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): ScoredMonitoringPayload | null {
  if (!callStateMap || typeof callStateMap !== "object") {
    return null;
  }

  const bestBySession = new Map<string, ScoredMonitoringPayload>();

  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice & { sequence?: number };
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
    const scored: ScoredMonitoringPayload = {
      payload,
      eventTimeMs: parseEventTimeMsForMonitoringPick(c.eventTime),
      sequence: c.sequence,
    };
    const sessionKey = `${payload.monitorDn}:${payload.monitoredDn}`;
    const prev = bestBySession.get(sessionKey);
    if (!prev || scored.eventTimeMs >= prev.eventTimeMs) {
      bestBySession.set(sessionKey, scored);
    }
  }

  let best: ScoredMonitoringPayload | null = null;
  for (const entry of bestBySession.values()) {
    if (!best || entry.eventTimeMs >= best.eventTimeMs) {
      best = entry;
    }
  }
  return best;
}

/** Latest supervision metadata from the shared CTI event log (whisper after barge, etc.). */
export function pickScoredMonitoringPayloadFromEventLog(
  eventLog: readonly unknown[] | undefined,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): ScoredMonitoringPayload | null {
  const monitoringEvent = findLatestMonitoringEventFromLog(eventLog ?? []);
  if (!monitoringEvent?.parties?.length || !monitoringEvent.monitoring) {
    return null;
  }
  const payload = buildWallboardMonitoringPayloadFromEvent(
    monitoringEvent.parties,
    monitoringEvent.monitoring,
    dnsMap,
  );
  if (!payload) {
    return null;
  }
  const eventTimeMs = parseEventTimeMsForMonitoringPick(
    (monitoringEvent as { eventTime?: string }).eventTime,
  );
  return {
    payload,
    eventTimeMs,
    sequence: monitoringEvent.sequence,
  };
}

function wallboardMonitoringSessionMatches(
  active: ActiveMonitoring,
  payload: MonitoringPayload,
): boolean {
  if (!active.dn || !active.monitor) {
    return false;
  }
  return (
    ctiAddressesEquivalent(active.monitor, payload.monitorDn) &&
    ctiAddressesEquivalent(active.dn, payload.monitoredDn)
  );
}

function activeMonitoringFromPayload(
  payload: MonitoringPayload,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  return {
    dn: payload.monitoredDn,
    type: payload.monitoringType,
    monitor: payload.monitorDn,
    deviceName: payload.monitoredDeviceName ?? null,
    monitorDeviceName: payload.monitorDeviceName,
    monitorDeviceType: payload.monitorDeviceType,
  };
}

export const CLEARED_WALLBOARD_MONITORING: ActiveMonitoring = {
  dn: null,
  type: null,
  deviceName: null,
  monitor: undefined,
};

export type ResolveEffectiveWallboardMonitoringOptions = {
  suppressedSessionKey?: string | null;
  monitoringTeardown?: MonitoringTeardownHint | null;
  eventLog?: readonly unknown[];
};

function isRemoteSupervisionSessionSuppressed(
  payload: MonitoringPayload,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const sessionKey = `${payload.monitorDn}:${payload.monitoredDn}`;
  if (
    shouldBlockMonitoringRefillDueToSuppression(
      options?.suppressedSessionKey ?? null,
      sessionKey,
      payload.monitoredDn,
      null,
      payload.monitoringType,
    )
  ) {
    return true;
  }
  const teardown = options?.monitoringTeardown;
  if (!teardown) {
    return false;
  }
  if (!ctiAddressesEquivalent(teardown.monitoredDn, payload.monitoredDn)) {
    return false;
  }
  if (
    teardown.monitorDn &&
    !ctiAddressesEquivalent(teardown.monitorDn, payload.monitorDn)
  ) {
    return false;
  }
  return true;
}

function monitoringCallMatchesSupervisionPair(
  call: MonitoringCallStateSlice,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  const m = call.monitoring;
  if (m?.monitorDn && m?.monitoredDn) {
    return (
      ctiAddressesEquivalent(m.monitorDn, monitorDn) &&
      ctiAddressesEquivalent(m.monitoredDn, monitoredDn)
    );
  }
  if (call.isMonitoring !== true || !call.parties?.length) {
    return false;
  }
  return call.parties.some(
    (p) =>
      partyIsLiveForWallboard(p) &&
      (ctiAddressesEquivalent(p.callingAddress, monitorDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitorDn)) &&
      (ctiAddressesEquivalent(p.callingAddress, monitoredDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitoredDn)),
  );
}

/**
 * At least one non-terminating call in shared SSE state still has `isMonitoring: true` for this pair.
 * Other wallboard viewers (User B) rely on this when User A stops barge — they do not have local stop suppression.
 */
export function callStateMapHasActiveMonitoringForPair(
  callStateMap: Record<string, unknown>,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (c.isTerminating) {
      continue;
    }
    if (
      c.isMonitoring === true &&
      monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn)
    ) {
      return true;
    }
  }
  return false;
}

/** True when a live supervisor↔agent observation leg still exists in call state (barge not ended). */
export function supervisionSessionHasLiveSupervisorAgentLeg(
  callStateMap: Record<string, unknown>,
  payload: MonitoringPayload,
): boolean {
  const monitorDn = payload.monitorDn;
  const monitoredDn = payload.monitoredDn;

  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (c.isTerminating || !c.parties?.length) {
      continue;
    }

    if (!monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn)) {
      continue;
    }

    const hasLiveObservationLeg = c.parties.some(
      (p) =>
        partyIsLiveForWallboard(p) &&
        (ctiAddressesEquivalent(p.callingAddress, monitorDn) ||
          ctiAddressesEquivalent(p.calledAddress, monitorDn)) &&
        (ctiAddressesEquivalent(p.callingAddress, monitoredDn) ||
          ctiAddressesEquivalent(p.calledAddress, monitoredDn)),
    );
    if (hasLiveObservationLeg) {
      if (isBargeInMonitoringType(payload.monitoringType)) {
        return callHasLiveAgentPartyWithNonSupervisor(c, monitoredDn, monitorDn);
      }
      return true;
    }

    // Conference re-barge: supervisor leg may stay DROPPED until consult merges; agent+customer still live.
    if (
      isBargeInMonitoringType(payload.monitoringType) &&
      c.isMonitoring === true &&
      callHasLiveAgentPartyWithNonSupervisor(c, monitoredDn, monitorDn)
    ) {
      return true;
    }
  }
  return false;
}

const LIVE_AGENT_CONVERSATION_STATUSES = new Set([
  "CONNECTED",
  "ON_HOLD",
  "ANSWERED",
  "RETRIEVED",
  "RINGING",
]);

function partyHasLiveAgentConversationStatus(p: {
  callStatus?: string;
}): boolean {
  const s = (p.callStatus ?? "").toUpperCase();
  return LIVE_AGENT_CONVERSATION_STATUSES.has(s) && partyIsLiveForWallboard(p);
}

/**
 * True when the monitored agent still has a live customer/external leg (not only a stale
 * supervisor observation row after hang-up from Jabber).
 */
export function monitoredAgentCustomerConversationLiveInCallStateMap(
  callStateMap: Record<string, unknown>,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (c.isTerminating || !c.parties?.length) {
      continue;
    }
    if (callHasLiveAgentPartyWithNonSupervisor(c, monitoredDn, monitorDn)) {
      return true;
    }
  }
  return false;
}

/** True when every call involving the agent DN has only terminal parties (call ended). */
export function callStateMapMonitoredAgentCallsFullyTerminal(
  callStateMap: Record<string, unknown>,
  monitoredDn: string,
): boolean {
  let sawAgentCall = false;
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (!c.parties?.length) {
      continue;
    }
    const agentParties = c.parties.filter(
      (p) =>
        ctiAddressesEquivalent(p.callingAddress, monitoredDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitoredDn),
    );
    if (agentParties.length === 0) {
      continue;
    }
    sawAgentCall = true;
    if (
      !c.isTerminating &&
      agentParties.some((p) => partyHasLiveAgentConversationStatus(p))
    ) {
      return false;
    }
  }
  return sawAgentCall;
}

/**
 * Whether SSE/log still describes an active supervision session (not stopped barge, not torn down).
 */
export function isWallboardRemoteSupervisionSessionActive(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (isRemoteSupervisionSessionSuppressed(payload, { ...options, eventLog })) {
    return false;
  }

  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
    dn: payload.monitoredDn,
    monitor: payload.monitorDn,
    deviceName: payload.monitoredDeviceName,
  });
  if (terminalClear) {
    return false;
  }

  if (isBargeInMonitoringType(payload.monitoringType)) {
    if (!callStateMap) {
      return false;
    }
    if (
      !monitoredAgentCustomerConversationLiveInCallStateMap(
        callStateMap,
        payload.monitoredDn,
        payload.monitorDn,
      )
    ) {
      return false;
    }
    return (
      callStateMapHasActiveMonitoringForPair(
        callStateMap,
        payload.monitorDn,
        payload.monitoredDn,
      ) &&
      supervisionSessionHasLiveSupervisorAgentLeg(callStateMap, payload)
    );
  }

  if (isSilentOrWhisperMonitoringType(payload.monitoringType)) {
    if (!callStateMap) {
      return false;
    }
    if (
      monitoredAgentCustomerConversationLiveInCallStateMap(
        callStateMap,
        payload.monitoredDn,
        payload.monitorDn,
      )
    ) {
      return true;
    }
    if (callStateMapMonitoredAgentCallsFullyTerminal(callStateMap, payload.monitoredDn)) {
      return false;
    }
    return callStateMapHasActiveMonitoringForPair(
      callStateMap,
      payload.monitorDn,
      payload.monitoredDn,
    );
  }

  return true;
}

/**
 * Wallboard supervision context for every viewer — merges local UI state with the latest
 * session from SSE ({@link callStateMap} + {@link eventLog}). Refreshes monitoring **type**
 * when the supervisor switches channel (e.g. BARGE_IN → WHISPER) so other users are not stuck
 * on a stale barge badge. Returns cleared state when barge ended but customer call remains.
 */
export function resolveEffectiveWallboardMonitoring(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap:
    | Record<string, { devices?: Record<string, DnsDevice> } | undefined>
    | undefined,
  eventLog?: readonly unknown[],
  options?: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  if (!dnsMap) {
    return activeMonitoring;
  }

  const mapScored = callStateMap
    ? pickBestScoredMonitoringPayloadFromCallStateMap(callStateMap, dnsMap)
    : null;
  const logScored = pickScoredMonitoringPayloadFromEventLog(eventLog, dnsMap);
  const remotePayload = pickNewerScoredMonitoringPayload(mapScored, logScored);

  if (
    remotePayload &&
    !isWallboardRemoteSupervisionSessionActive(
      remotePayload,
      callStateMap,
      eventLog,
      options,
    )
  ) {
    return CLEARED_WALLBOARD_MONITORING;
  }

  if (!remotePayload) {
    if (!activeMonitoring.dn && !activeMonitoring.type) {
      return CLEARED_WALLBOARD_MONITORING;
    }
    return activeMonitoring;
  }

  if (!activeMonitoring.dn || !activeMonitoring.monitor) {
    return activeMonitoringFromPayload(remotePayload);
  }

  if (wallboardMonitoringSessionMatches(activeMonitoring, remotePayload)) {
    const typeChanged =
      normalizeMonitoringTypeForWallboardCompare(activeMonitoring.type) !==
      normalizeMonitoringTypeForWallboardCompare(remotePayload.monitoringType);
    if (typeChanged) {
      return activeMonitoringFromPayload(remotePayload);
    }
    return {
      ...activeMonitoring,
      type: remotePayload.monitoringType,
      deviceName:
        remotePayload.monitoredDeviceName ?? activeMonitoring.deviceName ?? null,
      monitorDeviceName: remotePayload.monitorDeviceName,
      monitorDeviceType: remotePayload.monitorDeviceType,
    };
  }

  return activeMonitoringFromPayload(remotePayload);
}

type LooseWallboardCall = WallboardCallPartiesSlice & {
  eventTime?: string;
  callId?: string;
};

function wallboardMonitoringContextForCall(
  call: LooseWallboardCall,
  activeMonitoring: ActiveMonitoring,
): {
  monitorDn?: string;
  agentDn?: string;
  monitoringType: string | null;
} {
  const m = call.monitoring;
  return {
    monitorDn: activeMonitoring.monitor ?? m?.monitorDn,
    agentDn: activeMonitoring.dn ?? m?.monitoredDn,
    monitoringType: activeMonitoring.type ?? m?.monitoringType ?? null,
  };
}

function partyIsLiveForWallboard(p: {
  callStatus?: string;
}): boolean {
  return partyIsLiveCtiParty(p);
}

export function isBargeInMonitoringType(
  monitoringType: string | null | undefined,
): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return normalized === "BARGE_IN" || normalized === "BARGEIN";
}

export function isSilentOrWhisperMonitoringType(
  monitoringType: string | null | undefined,
): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return normalized === "SILENT" || normalized === "WHISPER";
}

export function callHasLiveSupervisorAndAgentParties(
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
    if (!partyIsLiveForWallboard(p)) {
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

function callIsDedicatedSupervisorAgentObservationLeg(
  call: LooseWallboardCall,
  dn: string,
  supervisorDn: string,
  agentDn: string,
  monitoringType: string | null | undefined,
): boolean {
  if (
    !callHasLiveSupervisorAndAgentParties(call, supervisorDn, agentDn) ||
    (String(dn) !== String(agentDn) && String(dn) !== String(supervisorDn))
  ) {
    return false;
  }
  if (isBargeInMonitoringType(monitoringType)) {
    return !callHasLiveAgentPartyWithNonSupervisor(call, agentDn, supervisorDn);
  }
  return true;
}

/**
 * Whether a call should be ignored for wallboard active-count / display (not the agent's handled call).
 */
export function shouldExcludeCallFromWallboardContext(
  call: LooseWallboardCall,
  dn: string,
  activeMonitoring: ActiveMonitoring,
  monitoringTeardown: MonitoringTeardownHint | null | undefined,
): boolean {
  if (call.isTerminating) {
    return true;
  }

  const { monitorDn, agentDn, monitoringType } =
    wallboardMonitoringContextForCall(call, activeMonitoring);

  if (call.isMonitoring === true) {
    if (
      monitorDn &&
      agentDn &&
      ctiAddressesEquivalent(dn, agentDn) &&
      isBargeInMonitoringType(monitoringType) &&
      callHasLiveAgentPartyWithNonSupervisor(
        call,
        String(agentDn),
        String(monitorDn),
      )
    ) {
      return false;
    }
    return true;
  }

  if (monitorDn && agentDn) {
    if (
      callIsDedicatedSupervisorAgentObservationLeg(
        call,
        dn,
        String(monitorDn),
        String(agentDn),
        monitoringType,
      )
    ) {
      return true;
    }
  }

  if (monitoringTeardown && String(dn) === String(monitoringTeardown.monitoredDn)) {
    const teardownMonitor = monitoringTeardown.monitorDn;
    if (
      teardownMonitor &&
      callHasLiveSupervisorAndAgentParties(
        call,
        String(teardownMonitor),
        String(monitoringTeardown.monitoredDn),
      ) &&
      !callHasLiveAgentPartyWithNonSupervisor(
        call,
        String(monitoringTeardown.monitoredDn),
        String(teardownMonitor),
      )
    ) {
      return true;
    }
  }

  return false;
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
  return normalizeConferenceFlagsForLiveParties({
    ...call,
    parties: activeParties,
    role: String(matchedParty.callingAddress) === dnStr ? "calling" : "called",
    isActive: true,
  });
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
  monitoringType?: string | null,
): unknown {
  const calls = getCallStatesForDn(monitoredDn) as LooseWallboardCall[];
  const withoutObservationLeg = calls.filter((c) => {
    if (c.isTerminating) {
      return false;
    }
    if (
      shouldExcludeCallFromWallboardContext(
        c,
        monitoredDn,
        {
          dn: monitoredDn,
          type: monitoringType ?? null,
          monitor: monitorDn,
        },
        null,
      )
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

/**
 * Resolve the call snapshot shown on a wallboard card — skips monitoring / observation legs
 * even after {@link ActiveMonitoring} is cleared (stale CTI rows after stop silent monitor).
 */
export function resolveWallboardDisplayCall(
  dn: string,
  activeMonitoring: ActiveMonitoring,
  monitoringTeardown: MonitoringTeardownHint | null | undefined,
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
      activeMonitoring.type,
    );
    if (picked) {
      return picked;
    }
  }

  const calls = getCallStatesForDn(dn) as LooseWallboardCall[];
  const customerCalls = calls.filter(
    (c) =>
      !shouldExcludeCallFromWallboardContext(
        c,
        dn,
        activeMonitoring,
        monitoringTeardown,
      ),
  );
  if (customerCalls.length > 0) {
    const mostRecent = pickMostRecentCall(customerCalls);
    const shaped = shapeCallLikeGetDnCallState(dn, mostRecent);
    if (shaped) {
      return shaped;
    }
  }

  const fallback = getDnCallState(dn) as LooseWallboardCall | null;
  if (
    fallback &&
    !shouldExcludeCallFromWallboardContext(
      fallback,
      dn,
      activeMonitoring,
      monitoringTeardown,
    )
  ) {
    return fallback;
  }
  return null;
}
