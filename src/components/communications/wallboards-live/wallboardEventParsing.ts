/** Pure helpers for wallboard live dashboard eventLog / dnsMap parsing (Sonar: lowers index.tsx complexity). */

import { pickMostRecentCall } from "@hooks/ctiStompHelpers";
import { normalizeConferenceFlagsForLiveParties } from "@utils/ctiCallDisplay";
import { normalizeCtiApiMonitoringDeviceType } from "@utils/ctiApiDeviceType";
import type { ActiveMonitoring, MonitoringTeardownHint } from "@components/live-calls/utils/types";
import { ctiAddressesEquivalent } from "@utils/ctiAddressMatching";
import {
  callHasEndedCustomerPartyForAgent,
  callHasLiveAgentPartyWithNonSupervisor,
  callRelatesToSupervisionPair,
  isCtiSupervisionMonitoringType,
  partyIsLiveCtiParty,
} from "@utils/ctiMonitoringCallParties";
import { wallboardDebugLog } from "@components/communications/wallboards-live/wallboardDebugLog";
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
/** Stable key for a supervision pair + channel (SILENT / WHISPER / BARGE_IN). */
export function wallboardMonitoringSessionKey(
  monitorDn: string,
  monitoredDn: string,
  monitoringType?: string | null,
): string {
  const typePart = normalizeMonitoringTypeForWallboardCompare(monitoringType);
  return typePart
    ? `${monitorDn}:${monitoredDn}:${typePart}`
    : `${monitorDn}:${monitoredDn}`;
}

export function wallboardMonitoringSessionKeyMatchesSuppressed(
  suppressedKey: string,
  monitorDn: string,
  monitoredDn: string,
): boolean {
  const pairKey = wallboardMonitoringSessionKey(monitorDn, monitoredDn);
  if (suppressedKey === pairKey || suppressedKey === `*:${monitoredDn}`) {
    return true;
  }
  return suppressedKey.startsWith(`${pairKey}:`);
}

function monitoringTypeFromSuppressedSessionKey(
  suppressedKey: string,
): string | null {
  const parts = suppressedKey.split(":");
  if (parts.length < 3) {
    return null;
  }
  return normalizeMonitoringTypeForWallboardCompare(parts[2]);
}

export function shouldBlockMonitoringRefillDueToSuppression(
  suppressedKey: string | null,
  monitorDn: string,
  monitoredDn: string,
  activeType: string | null | undefined,
  incomingType: string,
): boolean {
  if (!suppressedKey) {
    return false;
  }
  if (
    !wallboardMonitoringSessionKeyMatchesSuppressed(
      suppressedKey,
      monitorDn,
      monitoredDn,
    )
  ) {
    return false;
  }
  const activeNorm = normalizeMonitoringTypeForWallboardCompare(activeType);
  const incomingNorm = normalizeMonitoringTypeForWallboardCompare(incomingType);
  const suppressedNorm = monitoringTypeFromSuppressedSessionKey(suppressedKey);
  if (incomingNorm && suppressedNorm && incomingNorm !== suppressedNorm) {
    return false;
  }
  if (!activeNorm) {
    return true;
  }
  if (activeNorm !== incomingNorm) {
    return true;
  }
  return true;
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
  sequence?: number;
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
  if (evt.eventType === "MONITORING_ENDED") {
    return false;
  }
  if (evt.isMonitoring === false) {
    return false;
  }
  if (!evt.monitoring?.monitorDn || !evt.monitoring?.monitoredDn) {
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

/** Latest supervision event in the log for a specific supervisor↔agent pair. */
export function findLatestMonitoringEventForPairInLog(
  eventLog: readonly unknown[],
  monitorDn: string,
  monitoredDn: string,
  monitoringType?: string | null,
): WallboardLogEventSlice | null {
  const preferNorm = normalizeMonitoringTypeForWallboardCompare(monitoringType);
  for (let i = eventLog.length - 1; i >= 0; i -= 1) {
    const evt = parseWallboardLogEvent(eventLog[i]);
    if (!evt || !wallboardLogEventIsSupervisionSnapshot(evt)) {
      continue;
    }
    const m = evt.monitoring;
    if (
      !ctiAddressesEquivalent(m?.monitorDn, monitorDn) ||
      !ctiAddressesEquivalent(m?.monitoredDn, monitoredDn)
    ) {
      continue;
    }
    if (preferNorm) {
      const evtNorm = normalizeMonitoringTypeForWallboardCompare(
        m?.monitoringType,
      );
      if (evtNorm && evtNorm !== preferNorm) {
        continue;
      }
    }
    return evt;
  }
  return null;
}

export function eventLogHasSupervisionSnapshotForPair(
  eventLog: readonly unknown[] | undefined,
  payload: { monitorDn: string; monitoredDn: string },
): boolean {
  if (!eventLog?.length) {
    return false;
  }
  return (
    findLatestMonitoringEventForPairInLog(
      eventLog,
      payload.monitorDn,
      payload.monitoredDn,
    ) != null
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
  type?: string | null;
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
  if (!m?.monitorDn || !m?.monitoredDn || !active.monitor || !active.dn) {
    return false;
  }
  if (
    !ctiAddressesEquivalent(m.monitorDn, active.monitor) ||
    !ctiAddressesEquivalent(m.monitoredDn, active.dn)
  ) {
    return false;
  }
  if (
    evt.eventType === "MONITORING_ENDED" ||
    isTerminalWallboardEventType(evt.eventType)
  ) {
    return false;
  }
  if (active.type) {
    const evtType = normalizeMonitoringTypeForWallboardCompare(
      m.monitoringType,
    );
    const activeType = normalizeMonitoringTypeForWallboardCompare(active.type);
    if (activeType && evtType && activeType !== evtType) {
      return false;
    }
  }
  return evt.isMonitoring === true || wallboardLogEventIsSupervisionSnapshot(evt);
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

/** Latest session start strictly after minIndex (for WHISPER retry after MONITORING_ENDED). */
function findMonitoringSessionStartAfterIndex(
  eventLog: readonly unknown[],
  active: WallboardActiveMonitoringSnapshot,
  minIndex: number,
  scanDepth = 40,
): number {
  if (!active.dn || !active.monitor || !eventLog.length) {
    return -1;
  }
  const start = Math.max(0, eventLog.length - scanDepth);
  for (let i = eventLog.length - 1; i >= start; i -= 1) {
    if (i <= minIndex) {
      break;
    }
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
  monitoringType?: string | null;
};

function monitoringEndedTypeMatchesActive(
  evtType: string | null | undefined,
  activeType: string | null | undefined,
): boolean {
  if (!activeType) {
    return true;
  }
  const activeNorm = normalizeMonitoringTypeForWallboardCompare(activeType);
  const evtNorm = normalizeMonitoringTypeForWallboardCompare(evtType);
  if (!activeNorm) {
    return true;
  }
  return Boolean(evtNorm && activeNorm === evtNorm);
}

function isTerminalWallboardEventType(eventType: string | undefined): boolean {
  return (
    eventType === "DROPPED" ||
    eventType === "DISCONNECTED" ||
    eventType === "ENDED"
  );
}

function isWallboardMonitoringEndedEvent(evt: WallboardLogEventSlice): boolean {
  return evt.eventType === "MONITORING_ENDED" && evt.isMonitoring === false;
}

function wallboardMonitoringEndedForPair(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): boolean {
  if (!isWallboardMonitoringEndedEvent(evt)) {
    return false;
  }
  const m = evt.monitoring;
  if (!m?.monitorDn || !m?.monitoredDn) {
    return false;
  }
  if (!ctiAddressesEquivalent(m.monitoredDn, ctx.monitoredDn)) {
    return false;
  }
  if (ctx.supervisorDn && !ctiAddressesEquivalent(m.monitorDn, ctx.supervisorDn)) {
    return false;
  }
  return monitoringEndedTypeMatchesActive(m.monitoringType, ctx.monitoringType);
}

/** Latest terminal supervision event for this pair (WHISPER retry must not reuse an older start before this). */
function findLatestTerminalMonitoringEventIndexForActive(
  eventLog: readonly unknown[],
  active: WallboardActiveMonitoringSnapshot,
  scanDepth = 40,
): number {
  if (!active.dn || !eventLog.length) {
    return -1;
  }
  const ctx: TerminalMonitoringClearContext = {
    monitoredDn: active.dn,
    supervisorDn: active.monitor,
    monitoredDeviceName: active.deviceName,
    monitoringType: active.type,
  };
  const windowStart = Math.max(0, eventLog.length - scanDepth);
  for (let i = eventLog.length - 1; i >= windowStart; i -= 1) {
    const evt = parseWallboardLogEvent(eventLog[i]);
    if (evt && terminalClearReasonFromLogEvent(evt, ctx)) {
      return i;
    }
  }
  return -1;
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

function supervisorDisconnectedClearReason(
  evt: WallboardLogEventSlice,
  supervisorDn: string,
): string | null {
  const supervisorParties = evt.parties?.filter((party) =>
    involvesDnOnParty(party, supervisorDn),
  );
  if (
    supervisorParties &&
    supervisorParties.length > 0 &&
    supervisorParties.every((party) => isTerminatedWallboardParty(party))
  ) {
    return "supervisor disconnected";
  }
  return null;
}

function monitoredPartyDropClearReason(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): string | null {
  const monitoredPartiesOnEvent = evt.parties?.filter((party) =>
    involvesDnOnParty(party, ctx.monitoredDn),
  );
  if (!monitoredPartiesOnEvent?.length) {
    return null;
  }
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
  if (monitoredPartiesOnEvent.every((party) => isTerminatedWallboardParty(party))) {
    return "call dropped";
  }
  return null;
}

function externalPartyEndedClearReason(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): string | null {
  const supervisorDn = ctx.supervisorDn;
  if (!supervisorDn || !evt.parties?.length) {
    return null;
  }
  const externalLegEnded = evt.parties.some((party) => {
    if (!isTerminatedWallboardParty(party)) {
      return false;
    }
    if (!involvesDnOnParty(party, ctx.monitoredDn)) {
      return false;
    }
    const other = ctiAddressesEquivalent(party.callingAddress, ctx.monitoredDn)
      ? party.calledAddress
      : party.callingAddress;
    if (!other) {
      return false;
    }
    if (ctiAddressesEquivalent(other, ctx.monitoredDn)) {
      return false;
    }
    if (ctiAddressesEquivalent(other, supervisorDn)) {
      return false;
    }
    return true;
  });
  return externalLegEnded ? "external party ended call" : null;
}

function terminalClearReasonFromLogEvent(
  evt: WallboardLogEventSlice,
  ctx: TerminalMonitoringClearContext,
): string | null {
  if (wallboardMonitoringEndedForPair(evt, ctx)) {
    return "monitoring ended";
  }

  if (
    ctx.supervisorDn &&
    wallboardEventClaimsActiveMonitoringForPair(
      evt,
      ctx.supervisorDn,
      ctx.monitoredDn,
    ) &&
    !isTerminalWallboardEventType(evt.eventType)
  ) {
    return null;
  }

  if (!isTerminalWallboardEventType(evt.eventType) || !evt.parties?.length) {
    return null;
  }

  const supervisorReason = ctx.supervisorDn
    ? supervisorDisconnectedClearReason(evt, ctx.supervisorDn)
    : null;
  if (supervisorReason) {
    return supervisorReason;
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

  const monitoredReason = monitoredPartyDropClearReason(evt, ctx);
  if (monitoredReason) {
    return monitoredReason;
  }

  return externalPartyEndedClearReason(evt, ctx);
}

/**
 * Last supervision end in the log with no newer logged start — stale map may still show
 * `isMonitoring: true` until SSE catches up; a higher callStateMap `sequence` means a new session.
 */
function findTerminalClearWhenEndedAndNoRestartInLog(
  eventLog: readonly unknown[],
  active: WallboardActiveMonitoringSnapshot,
  scanDepth = 40,
): string | null {
  const lastTerminalIdx = findLatestTerminalMonitoringEventIndexForActive(
    eventLog,
    active,
    scanDepth,
  );
  if (lastTerminalIdx < 0) {
    return null;
  }
  const startAfterLastEnd = findMonitoringSessionStartAfterIndex(
    eventLog,
    active,
    lastTerminalIdx,
    scanDepth,
  );
  if (startAfterLastEnd >= 0) {
    return null;
  }
  const ctx: TerminalMonitoringClearContext = {
    monitoredDn: active.dn ?? "",
    supervisorDn: active.monitor,
    monitoredDeviceName: active.deviceName,
    monitoringType: active.type,
  };
  const evt = parseWallboardLogEvent(eventLog[lastTerminalIdx]);
  return evt ? terminalClearReasonFromLogEvent(evt, ctx) : null;
}

function supervisionMapSequenceAfterLastEndedInLog(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
): number | null {
  const lastTerminalIdx = findLatestTerminalMonitoringEventIndexForActive(
    eventLog ?? [],
    {
      dn: payload.monitoredDn,
      monitor: payload.monitorDn,
      deviceName: payload.monitoredDeviceName,
      type: payload.monitoringType,
    },
  );
  if (lastTerminalIdx < 0) {
    return null;
  }
  const endedEvt = parseWallboardLogEvent(eventLog![lastTerminalIdx]);
  const endedSeq = endedEvt?.sequence ?? 0;
  const mapSeq = bestSupervisionSequenceForPairInCallStateMap(
    callStateMap ?? {},
    payload.monitorDn,
    payload.monitoredDn,
  );
  if (mapSeq == null || mapSeq <= endedSeq) {
    return null;
  }
  return mapSeq;
}

function supervisionEndedInLogWithoutNewerMapSession(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
): boolean {
  const endedClear = findTerminalClearWhenEndedAndNoRestartInLog(eventLog ?? [], {
    dn: payload.monitoredDn,
    monitor: payload.monitorDn,
    deviceName: payload.monitoredDeviceName,
    type: payload.monitoringType,
  });
  if (!endedClear) {
    return false;
  }
  return supervisionMapSequenceAfterLastEndedInLog(payload, callStateMap, eventLog) == null;
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
    monitoringType: active.type,
  };
  const start = Math.max(0, eventLog.length - scanDepth);
  const lastTerminalIdx = findLatestTerminalMonitoringEventIndexForActive(
    eventLog,
    active,
    scanDepth,
  );
  let sessionStartIndex = findMonitoringSessionStartAfterIndex(
    eventLog,
    active,
    lastTerminalIdx,
    scanDepth,
  );
  if (sessionStartIndex < 0) {
    const legacyStart = findLatestMonitoringSessionStartLogIndex(
      eventLog,
      active,
      scanDepth,
    );
    if (legacyStart < 0 || lastTerminalIdx < 0 || legacyStart >= lastTerminalIdx) {
      return null;
    }
    sessionStartIndex = legacyStart;
  }

  for (let i = eventLog.length - 1; i >= start; i -= 1) {
    if (i <= sessionStartIndex) {
      break;
    }
    const evt = parseWallboardLogEvent(eventLog[i]);
    if (!evt) {
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
  if (call.isTerminating === true) {
    return false;
  }
  if (call.hasActiveParticipants === false) {
    return false;
  }
  const m = call.monitoring;
  if (m?.monitorDn && m?.monitoredDn && !call.parties?.length) {
    return call.isMonitoring === true;
  }
  if (!call.parties?.length) {
    return false;
  }
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
  const parties = call.parties ?? [];
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
  if (!parties.length || call.isMonitoring !== true) {
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

function scoredPayloadPreferred(
  a: ScoredMonitoringPayload,
  b: ScoredMonitoringPayload,
): ScoredMonitoringPayload {
  const aSeq = a.sequence ?? 0;
  const bSeq = b.sequence ?? 0;
  if (aSeq !== bSeq) {
    return aSeq >= bSeq ? a : b;
  }
  return a.eventTimeMs >= b.eventTimeMs ? a : b;
}

function scoredPayloadMatchesPreferNorm(
  scored: ScoredMonitoringPayload | null,
  preferNorm: string,
): boolean {
  return (
    scored != null &&
    normalizeMonitoringTypeForWallboardCompare(scored.payload.monitoringType) ===
      preferNorm
  );
}

function pickScoredPayloadWithPreferredType(
  mapScored: ScoredMonitoringPayload | null,
  logScored: ScoredMonitoringPayload | null,
  preferNorm: string,
): MonitoringPayload | null {
  const mapMatches = scoredPayloadMatchesPreferNorm(mapScored, preferNorm);
  const logMatches = scoredPayloadMatchesPreferNorm(logScored, preferNorm);
  if (mapMatches && !logMatches && mapScored) {
    return mapScored.payload;
  }
  if (logMatches && !mapMatches && logScored) {
    return logScored.payload;
  }
  if (mapMatches && logMatches && mapScored && logScored) {
    return scoredPayloadPreferred(mapScored, logScored).payload;
  }
  return null;
}

function pickNewerScoredMonitoringPayload(
  mapScored: ScoredMonitoringPayload | null,
  logScored: ScoredMonitoringPayload | null,
  preferMonitoringType?: string | null,
): MonitoringPayload | null {
  if (!mapScored && !logScored) {
    return null;
  }
  const preferNorm = normalizeMonitoringTypeForWallboardCompare(
    preferMonitoringType,
  );
  if (preferNorm) {
    const preferred = pickScoredPayloadWithPreferredType(
      mapScored,
      logScored,
      preferNorm,
    );
    if (preferred) {
      return preferred;
    }
  }
  if (!mapScored) {
    return logScored?.payload ?? null;
  }
  if (!logScored) {
    return mapScored.payload;
  }
  return scoredPayloadPreferred(mapScored, logScored).payload;
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
    const sessionKey = wallboardMonitoringSessionKey(
      payload.monitorDn,
      payload.monitoredDn,
      payload.monitoringType,
    );
    const prev = bestBySession.get(sessionKey);
    if (!prev || scoredPayloadPreferred(scored, prev) === scored) {
      bestBySession.set(sessionKey, scored);
    }
  }

  let best: ScoredMonitoringPayload | null = null;
  for (const entry of bestBySession.values()) {
    if (!best || scoredPayloadPreferred(entry, best) === entry) {
      best = entry;
    }
  }
  return best;
}

/** Every supervision candidate in {@link callStateMap} (one per channel/type), not only the global winner. */
function collectScoredMonitoringPayloadsFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): ScoredMonitoringPayload[] {
  const out: ScoredMonitoringPayload[] = [];
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice & { sequence?: number };
    if (!isWallboardMonitoringCallStateCandidate(c)) {
      continue;
    }
    const payload = tryBuildWallboardMonitoringPayloadFromCallStateSlice(c, dnsMap);
    if (!payload) {
      continue;
    }
    out.push({
      payload,
      eventTimeMs: parseEventTimeMsForMonitoringPick(c.eventTime),
      sequence: c.sequence,
    });
  }
  return out;
}

function isStreamPayloadApplicable(
  scored: ScoredMonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const { payload } = scored;
  if (
    shouldBlockMonitoringRefillDueToSuppression(
      options?.suppressedSessionKey ?? null,
      payload.monitorDn,
      payload.monitoredDn,
      options?.activeMonitoringType ?? null,
      payload.monitoringType,
    )
  ) {
    return false;
  }
  if (options?.strictRemoteSessionOnly) {
    return isWallboardRemoteSupervisionSessionActive(
      payload,
      callStateMap,
      eventLog,
      options,
    );
  }
  return wallboardMonitoringPayloadShouldApplyFromStream(
    payload,
    callStateMap,
    eventLog,
    options,
  );
}

function maxSupervisionSeqByPair(
  candidates: ScoredMonitoringPayload[],
): Map<string, number> {
  const maxSeqByPair = new Map<string, number>();
  for (const scored of candidates) {
    const pairKey = `${scored.payload.monitorDn}:${scored.payload.monitoredDn}`;
    const seq = scored.sequence ?? 0;
    const prev = maxSeqByPair.get(pairKey);
    if (prev === undefined || seq > prev) {
      maxSeqByPair.set(pairKey, seq);
    }
  }
  return maxSeqByPair;
}

function scoredMonitoringMatchesPreferType(
  scored: ScoredMonitoringPayload,
  preferType: string | null | undefined,
): boolean {
  if (!preferType) {
    return true;
  }
  const preferNorm = normalizeMonitoringTypeForWallboardCompare(preferType);
  const scoredNorm = normalizeMonitoringTypeForWallboardCompare(
    scored.payload.monitoringType,
  );
  return !preferNorm || !scoredNorm || preferNorm === scoredNorm;
}

function isLowerSeqSupervisionCandidate(
  scored: ScoredMonitoringPayload,
  preferType: string | null | undefined,
  maxSeqByPair: Map<string, number>,
): boolean {
  if (preferType) {
    return false;
  }
  const pairKey = `${scored.payload.monitorDn}:${scored.payload.monitoredDn}`;
  return (scored.sequence ?? 0) < (maxSeqByPair.get(pairKey) ?? 0);
}

function pickBestScoredApplicableMonitoring(
  candidates: ScoredMonitoringPayload[],
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options: ResolveEffectiveWallboardMonitoringOptions | undefined,
  preferType: string | null | undefined,
): ScoredMonitoringPayload | null {
  const maxSeqByPair = maxSupervisionSeqByPair(candidates);
  let best: ScoredMonitoringPayload | null = null;
  for (const scored of candidates) {
    if (isLowerSeqSupervisionCandidate(scored, preferType, maxSeqByPair)) {
      continue;
    }
    if (!isStreamPayloadApplicable(scored, callStateMap, eventLog, options)) {
      continue;
    }
    if (!scoredMonitoringMatchesPreferType(scored, preferType)) {
      continue;
    }
    if (!best || scoredPayloadPreferred(scored, best) === scored) {
      best = scored;
    }
  }
  return best;
}

/** Best stream payload that is allowed to drive wallboard monitoring UI right now. */
export function pickBestApplicableMonitoringPayload(
  callStateMap: Record<string, unknown> | undefined,
  dnsMap?: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  eventLog?: readonly unknown[],
  options?: ResolveEffectiveWallboardMonitoringOptions,
): MonitoringPayload | null {
  const map = dnsMap ?? options?.dnsMap;
  if (!map) {
    return null;
  }
  const candidates: ScoredMonitoringPayload[] = callStateMap
    ? collectScoredMonitoringPayloadsFromCallStateMap(callStateMap, map)
    : [];
  const logScored = pickScoredMonitoringPayloadFromEventLog(eventLog, map);
  if (logScored) {
    candidates.push(logScored);
  }
  const preferType = preferMonitoringTypeForWallboardStreamPick(
    options?.activeMonitoring ?? {
      dn: null,
      type: options?.activeMonitoringType ?? null,
      deviceName: null,
      monitor: undefined,
    },
    options,
  );
  const best = pickBestScoredApplicableMonitoring(
    candidates,
    callStateMap,
    eventLog,
    options,
    preferType,
  );
  return best?.payload ?? null;
}

/** Row in callStateMap for the supervisor's current channel type (ignores higher-seq other types). */
export function pickPinnedSupervisionPayloadFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  activeMonitoring: ActiveMonitoring,
): MonitoringPayload | null {
  const monitor = activeMonitoring.monitor;
  const monitoredDn = activeMonitoring.dn;
  const monitoringType = activeMonitoring.type;
  if (!monitoredDn || !monitor || !monitoringType) {
    return null;
  }
  const want = normalizeMonitoringTypeForWallboardCompare(monitoringType);
  if (!want) {
    return null;
  }
  let best: { payload: MonitoringPayload; sequence: number } | null = null;
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice & { sequence?: number };
    const rowType = normalizeMonitoringTypeForWallboardCompare(
      c.monitoring?.monitoringType,
    );
    if (
      c.isMonitoring !== true ||
      rowType !== want ||
      !monitoringCallMatchesSupervisionPair(c, monitor, monitoredDn)
    ) {
      continue;
    }
    const payload = tryBuildWallboardMonitoringPayloadFromCallStateSlice(c, dnsMap);
    if (!payload) {
      continue;
    }
    const seq = c.sequence ?? 0;
    if (!best || seq >= best.sequence) {
      best = { payload, sequence: seq };
    }
  }
  return best?.payload ?? null;
}

function initiatorPinnedPayloadIsStaleAfterTerminal(
  payload: MonitoringPayload,
  map: Record<string, unknown>,
  eventLog: readonly unknown[] | undefined,
  activeMonitoring: ActiveMonitoring,
): boolean {
  if (
    supervisionEndedInLogWithoutNewerMapSession(payload, map, eventLog)
  ) {
    return true;
  }
  const payloadNorm = normalizeMonitoringTypeForWallboardCompare(
    payload.monitoringType,
  );
  const activeNorm = normalizeMonitoringTypeForWallboardCompare(
    activeMonitoring.type,
  );
  if (
    isSilentOrWhisperMonitoringType(payload.monitoringType) &&
    activeNorm &&
    payloadNorm &&
    activeNorm === payloadNorm &&
    callStateMapHasSupervisionMonitoringFlagForPair(
      map,
      payload.monitorDn,
      payload.monitoredDn,
    )
  ) {
    return false;
  }
  const snapshot: WallboardRetainLocalSnapshot = {
    dn: payload.monitoredDn,
    monitor: payload.monitorDn,
    deviceName: payload.monitoredDeviceName,
    type: payload.monitoringType,
  };
  const lastTerminalIdx = findLatestTerminalMonitoringEventIndexForActive(
    eventLog ?? [],
    snapshot,
  );
  if (lastTerminalIdx < 0) {
    return false;
  }
  if (
    findMonitoringSessionStartAfterIndex(eventLog ?? [], snapshot, lastTerminalIdx) >=
    0
  ) {
    return false;
  }
  return (
    !supervisionSessionHasLiveSupervisorAgentLeg(map, payload) &&
    !monitoredAgentCustomerConversationLiveInCallStateMap(
      map,
      payload.monitoredDn,
      payload.monitorDn,
    )
  );
}

/**
 * Initiator refill: keep the supervisor's current channel when it is still live or in local-start lag,
 * instead of replacing it with a higher-sequence stale row of another type (e.g. BARGE over WHISPER).
 */
function initiatorRefillPinnedPayload(
  map: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined> | undefined,
  eventLog: readonly unknown[] | undefined,
  activeMonitoring: ActiveMonitoring,
  base: ResolveEffectiveWallboardMonitoringOptions,
  liveOpts: ResolveEffectiveWallboardMonitoringOptions,
): MonitoringPayload | null | undefined {
  const mapDns = dnsMap ?? base.dnsMap;
  if (!mapDns) {
    return undefined;
  }
  const pinnedFromMap = pickPinnedSupervisionPayloadFromCallStateMap(
    map,
    mapDns,
    activeMonitoring,
  );
  if (pinnedFromMap) {
    if (isRemoteSupervisionSessionSuppressed(pinnedFromMap, base)) {
      return undefined;
    }
    const remoteLive = isWallboardRemoteSupervisionSessionActive(
      pinnedFromMap,
      map,
      eventLog,
      liveOpts,
    );
    const retainLocal = shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      base,
    );
    if (
      (remoteLive || retainLocal) &&
      !initiatorPinnedPayloadIsStaleAfterTerminal(
        pinnedFromMap,
        map,
        eventLog,
        activeMonitoring,
      )
    ) {
      return pinnedFromMap;
    }
    const sameChannel =
      normalizeMonitoringTypeForWallboardCompare(pinnedFromMap.monitoringType) ===
      normalizeMonitoringTypeForWallboardCompare(activeMonitoring.type);
    if (!sameChannel) {
      return undefined;
    }
    if (
      supervisionEndedInLogWithoutNewerMapSession(
        pinnedFromMap,
        map,
        eventLog,
      )
    ) {
      return undefined;
    }
    if (remoteSupervisionSupersededInCallStateMap(pinnedFromMap, map)) {
      return pinnedFromMap;
    }
    return undefined;
  }
  const pinned = pickBestApplicableMonitoringPayload(map, mapDns, eventLog, {
    ...base,
    activeMonitoring,
    activeMonitoringType: activeMonitoring.type,
    effectiveMonitoringType: activeMonitoring.type,
  });
  if (!pinned) {
    return shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      base,
    )
      ? null
      : undefined;
  }
  if (isWallboardRemoteSupervisionSessionActive(pinned, map, eventLog, liveOpts)) {
    return pinned;
  }
  if (shouldRetainLocalWallboardMonitoringDuringSseLag(activeMonitoring, eventLog, base)) {
    return pinned;
  }
  return undefined;
}

export function pickMonitoringPayloadForInitiatorRefill(
  callStateMap: Record<string, unknown> | undefined,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  eventLog: readonly unknown[] | undefined,
  activeMonitoring: ActiveMonitoring,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): MonitoringPayload | null {
  const map = callStateMap ?? options?.callStateMap;
  if (!map) {
    return null;
  }
  const base: ResolveEffectiveWallboardMonitoringOptions = {
    ...options,
    callStateMap: map,
    eventLog: eventLog ?? options?.eventLog,
    dnsMap: dnsMap ?? options?.dnsMap,
    strictRemoteSessionOnly: true,
  };
  const liveOpts: ResolveEffectiveWallboardMonitoringOptions = {
    ...base,
    suppressedSessionKey: null,
    monitoringTeardown: null,
  };

  if (activeMonitoring.dn && activeMonitoring.monitor && activeMonitoring.type) {
    const pinned = initiatorRefillPinnedPayload(
      map,
      dnsMap,
      eventLog,
      activeMonitoring,
      base,
      liveOpts,
    );
    if (pinned !== undefined) {
      return pinned;
    }
  }

  const fallback = pickBestApplicableMonitoringPayload(map, dnsMap, eventLog, {
    ...base,
    activeMonitoring: {
      dn: activeMonitoring.dn,
      monitor: activeMonitoring.monitor,
      deviceName: activeMonitoring.deviceName,
      type: null,
    },
    activeMonitoringType: null,
    effectiveMonitoringType: null,
  });
  if (
    !fallback ||
    !activeMonitoring.type ||
    isWallboardRemoteSupervisionSessionActive(
      fallback,
      map,
      eventLog,
      liveOpts,
    ) ||
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      base,
    )
  ) {
    return fallback;
  }
  return null;
}

function streamPayloadFromOptions(
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): MonitoringPayload | null {
  return pickBestApplicableMonitoringPayload(
    callStateMap,
    options?.dnsMap,
    eventLog,
    options,
  );
}

function isStreamSupervisionSessionActive(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  return (
    shouldRetainRemoteWallboardMonitoringDuringSseLag(
      payload,
      callStateMap,
      eventLog,
      options,
    ) ||
    isWallboardRemoteSupervisionSessionActive(
      payload,
      callStateMap,
      eventLog,
      options,
    )
  );
}

/** Latest supervision metadata from the shared CTI event log (whisper after barge, etc.). */
export function pickScoredMonitoringPayloadFromEventLog(
  eventLog: readonly unknown[] | undefined,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
): ScoredMonitoringPayload | null {
  const monitoringEvent = findLatestMonitoringEventFromLog(eventLog ?? []);
  if (!monitoringEvent?.monitoring?.monitorDn || !monitoringEvent.monitoring.monitoredDn) {
    return null;
  }
  const payload = buildWallboardMonitoringPayloadFromEvent(
    monitoringEvent.parties ?? [],
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

/**
 * Only the supervising DN may pin SSE/log picks to a local channel type (post-start lag).
 * Other wallboard viewers always follow the newest applicable stream session.
 */
function preferMonitoringTypeForWallboardStreamPick(
  activeMonitoring: ActiveMonitoring,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): string | null {
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      options?.eventLog,
      options,
    )
  ) {
    return activeMonitoring.type ?? options?.activeMonitoringType ?? null;
  }
  const viewer = options?.viewerUserAddress;
  const monitorDn = activeMonitoring.monitor;
  if (!viewer || !monitorDn) {
    return null;
  }
  if (!ctiAddressesEquivalent(viewer, monitorDn)) {
    return null;
  }
  return activeMonitoring.type ?? options?.activeMonitoringType ?? null;
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

export function activeMonitoringFromPayload(
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

function monitoringPayloadFromActiveMonitoring(
  active: ActiveMonitoring,
): MonitoringPayload | null {
  if (!active.dn || !active.monitor || !active.type) {
    return null;
  }
  return {
    monitoredDn: String(active.dn),
    monitorDn: String(active.monitor),
    monitoredDeviceName: active.deviceName ?? undefined,
    monitoringType: String(active.type),
    monitorDeviceName: active.monitorDeviceName,
    monitorDeviceType: active.monitorDeviceType,
  };
}

type WallboardRetainLocalSnapshot = {
  dn: string;
  monitor: string;
  deviceName: string | null | undefined;
  type: string;
};

function retainLocalForWallboardInitiator(
  localPayload: MonitoringPayload,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const viewer = options?.viewerUserAddress;
  if (!viewer) {
    return true;
  }
  return ctiAddressesEquivalent(viewer, localPayload.monitorDn);
}

function retainLocalWhenStaleTerminalBeforeSessionStart(
  snapshot: WallboardRetainLocalSnapshot,
  localPayload: MonitoringPayload,
  map: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const activeRowSeq = supervisionSequenceForPairAndTypeInCallStateMap(
    map ?? {},
    snapshot.monitor,
    snapshot.dn,
    snapshot.type,
  );
  const rowForActiveType = callStateMapHasMonitoringRowForActiveType(
    map ?? {},
    snapshot.monitor,
    snapshot.dn,
    snapshot.type,
  );
  if (activeRowSeq == null && !rowForActiveType) {
    return retainLocalForWallboardInitiator(localPayload, options);
  }
  if (activeRowSeq != null) {
    const endedStaleInLog = supervisionEndedInLogWithoutNewerMapSession(
      localPayload,
      map,
      eventLog,
    );
    if (
      isSilentOrWhisperMonitoringType(snapshot.type) &&
      rowForActiveType &&
      !endedStaleInLog
    ) {
      return retainLocalForWallboardInitiator(localPayload, options);
    }
  }
  if (map && Object.keys(map).length > 0) {
    return false;
  }
  return retainLocalForWallboardInitiator(localPayload, options);
}

function retainLocalWhenEndedBeforeRestart(
  snapshot: WallboardRetainLocalSnapshot,
  localPayload: MonitoringPayload,
  lastTerminalIdx: number,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const map = options?.callStateMap;
  const mapSupersedesEnded = supervisionMapSequenceAfterLastEndedInLog(
    localPayload,
    map,
    eventLog,
  );
  if (mapSupersedesEnded != null) {
    return retainLocalForWallboardInitiator(localPayload, options);
  }
  const sessionStartIdx = findLatestMonitoringSessionStartLogIndex(
    eventLog ?? [],
    snapshot,
  );
  if (sessionStartIdx < 0) {
    return retainLocalForWallboardInitiator(localPayload, options);
  }
  if (sessionStartIdx < lastTerminalIdx) {
    return retainLocalWhenStaleTerminalBeforeSessionStart(
      snapshot,
      localPayload,
      map,
      eventLog,
      options,
    );
  }
  return false;
}

function retainLocalWhenRemoteStillActiveAfterTerminal(
  localPayload: MonitoringPayload,
  snapshot: WallboardRetainLocalSnapshot,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], snapshot);
  if (!terminalClear) {
    return true;
  }
  const map = options?.callStateMap;
  return Boolean(
    map &&
      isWallboardRemoteSupervisionSessionActive(
        localPayload,
        map,
        eventLog,
        options,
      ),
  );
}

/**
 * After the user starts SILENT/WHISPER/BARGE locally, SSE/callStateMap may lag. Keep wallboard
 * monitoring until an explicit terminal clear or remote session supersedes it.
 */
export function shouldRetainLocalWallboardMonitoringDuringSseLag(
  activeMonitoring: ActiveMonitoring,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (!activeMonitoring.dn || !activeMonitoring.monitor || !activeMonitoring.type) {
    return false;
  }
  if (!isCtiSupervisionMonitoringType(activeMonitoring.type)) {
    return false;
  }
  const localPayload = monitoringPayloadFromActiveMonitoring(activeMonitoring);
  if (!localPayload) {
    return false;
  }
  if (isRemoteSupervisionSessionSuppressed(localPayload, options)) {
    return false;
  }
  const snapshot: WallboardRetainLocalSnapshot = {
    dn: localPayload.monitoredDn,
    monitor: localPayload.monitorDn,
    deviceName: localPayload.monitoredDeviceName,
    type: activeMonitoring.type,
  };
  const lastTerminalIdx = findLatestTerminalMonitoringEventIndexForActive(
    eventLog ?? [],
    snapshot,
  );
  const startAfterLastEnd = findMonitoringSessionStartAfterIndex(
    eventLog ?? [],
    snapshot,
    lastTerminalIdx,
  );
  if (startAfterLastEnd < 0 && lastTerminalIdx >= 0) {
    return retainLocalWhenEndedBeforeRestart(
      snapshot,
      localPayload,
      lastTerminalIdx,
      eventLog,
      options,
    );
  }
  if (startAfterLastEnd >= 0) {
    return retainLocalWhenRemoteStillActiveAfterTerminal(
      localPayload,
      snapshot,
      eventLog,
      options,
    );
  }
  if (findLatestMonitoringSessionStartLogIndex(eventLog ?? [], snapshot) < 0) {
    return retainLocalForWallboardInitiator(localPayload, options);
  }
  return retainLocalWhenRemoteStillActiveAfterTerminal(
    localPayload,
    snapshot,
    eventLog,
    options,
  );
}

/**
 * Other wallboard viewers did not start monitoring locally; they only see SSE. When the event log
 * already has a supervision snapshot but callStateMap has not caught up, keep showing the session.
 */
export function shouldRetainRemoteWallboardMonitoringDuringSseLag(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (!isCtiSupervisionMonitoringType(payload.monitoringType)) {
    return false;
  }
  if (
    !isSilentMonitoringVisibleToViewer(
      payload.monitoringType,
      payload.monitorDn,
      options?.viewerUserAddress,
    )
  ) {
    return false;
  }
  if (isRemoteSupervisionSessionSuppressed(payload, options)) {
    return false;
  }
  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
    dn: payload.monitoredDn,
    monitor: payload.monitorDn,
    deviceName: payload.monitoredDeviceName,
    type: payload.monitoringType,
  });
  if (terminalClear) {
    return false;
  }
  if (!eventLogHasSupervisionSnapshotForPair(eventLog, payload)) {
    return false;
  }
  const map = callStateMap ?? {};
  if (
    callStateMapHasSupervisionMonitoringFlagForPair(
      map,
      payload.monitorDn,
      payload.monitoredDn,
    )
  ) {
    return false;
  }
  if (supervisionSessionHasLiveSupervisorAgentLeg(map, payload)) {
    return false;
  }
  return true;
}

/** Apply monitoring refill / effective state when remote session is active or SSE is in lag. */
export function wallboardMonitoringPayloadShouldApplyFromStream(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (
    !isSilentMonitoringVisibleToViewer(
      payload.monitoringType,
      payload.monitorDn,
      options?.viewerUserAddress,
    )
  ) {
    return false;
  }
  return (
    isWallboardRemoteSupervisionSessionActive(
      payload,
      callStateMap,
      eventLog,
      options,
    ) ||
    shouldRetainRemoteWallboardMonitoringDuringSseLag(
      payload,
      callStateMap,
      eventLog,
      options,
    )
  );
}

/** True only while callStateMap has not caught up yet at supervision session start. */
function isSupervisionSessionStartLag(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
): boolean {
  if (!eventLogHasSupervisionSnapshotForPair(eventLog, payload)) {
    return false;
  }
  if (callStateMap && Object.keys(callStateMap).length > 0) {
    return false;
  }
  return !callStateMapMonitoredAgentCallsFullyTerminal(
    callStateMap ?? {},
    payload.monitoredDn,
  );
}

export const CLEARED_WALLBOARD_MONITORING: ActiveMonitoring = {
  dn: null,
  type: null,
  deviceName: null,
  monitor: undefined,
};

/** True when the logged-in user is the supervisor who started monitoring (initiator). */
export function isWallboardSupervisionInitiator(
  viewerUserAddress: string | null | undefined,
  monitorDn: string | null | undefined,
): boolean {
  return Boolean(
    viewerUserAddress &&
      monitorDn &&
      ctiAddressesEquivalent(viewerUserAddress, monitorDn),
  );
}

/**
 * Local React monitoring state applies only to the initiator. Other wallboard clients must
 * derive Live Coaching purely from shared SSE ({@link callStateMap} + {@link eventLog}).
 */
export function wallboardLocalMonitoringForResolve(
  activeMonitoring: ActiveMonitoring,
  viewerUserAddress?: string | null,
): ActiveMonitoring {
  if (
    isWallboardSupervisionInitiator(
      viewerUserAddress,
      activeMonitoring.monitor,
    )
  ) {
    return activeMonitoring;
  }
  return CLEARED_WALLBOARD_MONITORING;
}

export type WallboardMonitoringDerived = {
  effective: ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  };
  ui: ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  };
  supervisionSessionActive: boolean;
};

/** Single derived snapshot for wallboard UI, categorization, and session flags. */
export function deriveWallboardMonitoringState(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap:
    | Record<string, { devices?: Record<string, DnsDevice> } | undefined>
    | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): WallboardMonitoringDerived {
  const local = wallboardLocalMonitoringForResolve(
    activeMonitoring,
    options?.viewerUserAddress,
  );
  const baseOpts: ResolveEffectiveWallboardMonitoringOptions = {
    ...options,
    callStateMap: callStateMap ?? options?.callStateMap,
    eventLog: eventLog ?? options?.eventLog,
    dnsMap: dnsMap ?? options?.dnsMap,
    activeMonitoring: local,
    activeMonitoringType: local.type,
  };
  const effective = resolveEffectiveWallboardMonitoring(
    local,
    callStateMap,
    dnsMap,
    eventLog,
    baseOpts,
  );
  const streamOpts: ResolveEffectiveWallboardMonitoringOptions = {
    ...baseOpts,
    effectiveMonitoringType: effective.type,
  };
  const ui = resolveWallboardMonitoringForUi(
    local,
    effective,
    callStateMap,
    dnsMap,
    eventLog,
    streamOpts,
  );
  const supervisionSessionActive = computeWallboardSupervisionSessionActive(
    local,
    effective,
    callStateMap,
    eventLog,
    streamOpts,
  );

  if (
    local.type &&
    normalizeMonitoringTypeForWallboardCompare(local.type) === "SILENT" &&
    (!ui.type || !supervisionSessionActive)
  ) {
    // #region agent log
    wallboardDebugLog(
      "H",
      "wallboardEventParsing.ts:deriveWallboardMonitoringState:silent-missing-ui",
      "initiator SILENT without ui or sessionActive",
      {
        activeType: local.type,
        effectiveType: effective.type,
        uiType: ui.type,
        supervisionSessionActive,
        viewer: options?.viewerUserAddress ?? null,
      },
    );
    // #endregion
  }

  return { effective, ui, supervisionSessionActive };
}

export type ResolveEffectiveWallboardMonitoringOptions = {
  suppressedSessionKey?: string | null;
  monitoringTeardown?: MonitoringTeardownHint | null;
  eventLog?: readonly unknown[];
  /** Logged-in user's DN/extension — SILENT Live Coaching is visible only to the monitor. */
  viewerUserAddress?: string | null;
  callStateMap?: Record<string, unknown>;
  dnsMap?: Record<string, { devices?: Record<string, DnsDevice> } | undefined>;
  /** Local wallboard UI channel — avoids stale refill after stop / channel switch. */
  activeMonitoringType?: string | null;
  /** Resolved/effective channel — used by remote viewers when local active is empty. */
  effectiveMonitoringType?: string | null;
  /** Full local snapshot — used to detect initiator vs viewer for stream type preference. */
  activeMonitoring?: ActiveMonitoring;
  /** Initiator refill: require live remote session, not SSE lag retain alone. */
  strictRemoteSessionOnly?: boolean;
};

function isRemoteSupervisionSessionSuppressed(
  payload: MonitoringPayload,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (
    shouldBlockMonitoringRefillDueToSuppression(
      options?.suppressedSessionKey ?? null,
      payload.monitorDn,
      payload.monitoredDn,
      options?.activeMonitoringType ?? null,
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
      monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn) &&
      callHasLiveAgentPartyWithNonSupervisor(c, monitoredDn, monitorDn)
    ) {
      return true;
    }
  }
  return false;
}

function callStateMapHasMonitoringRowForActiveType(
  callStateMap: Record<string, unknown>,
  monitorDn: string,
  monitoredDn: string,
  monitoringType: string,
): boolean {
  const want = normalizeMonitoringTypeForWallboardCompare(monitoringType);
  if (!want) {
    return false;
  }
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    const rowType = normalizeMonitoringTypeForWallboardCompare(
      c.monitoring?.monitoringType,
    );
    if (
      c.isMonitoring === true &&
      rowType === want &&
      monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn)
    ) {
      return true;
    }
  }
  return false;
}

function supervisionSequenceForPairAndTypeInCallStateMap(
  callStateMap: Record<string, unknown>,
  monitorDn: string,
  monitoredDn: string,
  monitoringType: string,
): number | null {
  const want = normalizeMonitoringTypeForWallboardCompare(monitoringType);
  if (!want) {
    return null;
  }
  let best: number | null = null;
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice & { sequence?: number };
    const rowType = normalizeMonitoringTypeForWallboardCompare(
      c.monitoring?.monitoringType,
    );
    if (
      c.isMonitoring === true &&
      rowType === want &&
      monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn) &&
      typeof c.sequence === "number"
    ) {
      const seq = c.sequence;
      best = best == null ? seq : Math.max(best, seq);
    }
  }
  return best;
}

/**
 * Initiator refill must not replace a newer supervision row with an older channel type
 * (e.g. WHISPER seq 50 → SILENT seq 40 still in callStateMap).
 */
export function shouldSkipMonitoringRefillTypeDowngrade(
  activeMonitoring: ActiveMonitoring,
  incoming: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
): boolean {
  if (!callStateMap || !activeMonitoring.dn || !activeMonitoring.monitor || !activeMonitoring.type) {
    return false;
  }
  if (!monitoringPayloadDiffersFromActive(activeMonitoring, incoming)) {
    return false;
  }
  const activeNorm = normalizeMonitoringTypeForWallboardCompare(activeMonitoring.type);
  const incomingNorm = normalizeMonitoringTypeForWallboardCompare(
    incoming.monitoringType,
  );
  const pairMaxSeq = bestSupervisionSequenceForPairInCallStateMap(
    callStateMap,
    activeMonitoring.monitor,
    activeMonitoring.dn,
  );
  const incomingSeq = supervisionSequenceForPairAndTypeInCallStateMap(
    callStateMap,
    incoming.monitorDn,
    incoming.monitoredDn,
    incoming.monitoringType,
  );
  if (
    activeNorm &&
    incomingNorm &&
    activeNorm !== incomingNorm &&
    pairMaxSeq != null &&
    incomingSeq != null &&
    incomingSeq >= pairMaxSeq
  ) {
    return false;
  }
  const activeSeq = supervisionSequenceForPairAndTypeInCallStateMap(
    callStateMap,
    activeMonitoring.monitor,
    activeMonitoring.dn,
    activeMonitoring.type,
  );
  if (pairMaxSeq == null || incomingSeq == null) {
    return false;
  }
  if (incomingSeq >= pairMaxSeq) {
    return false;
  }
  if (activeSeq != null && activeSeq >= incomingSeq) {
    return true;
  }
  return false;
}

/** Highest `sequence` on a supervision row for this pair (newer than a prior MONITORING_ENDED in the log). */
function bestSupervisionSequenceForPairInCallStateMap(
  callStateMap: Record<string, unknown>,
  monitorDn: string,
  monitoredDn: string,
): number | null {
  let best: number | null = null;
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice & { sequence?: number };
    if (
      c.isMonitoring === true &&
      monitoringCallMatchesSupervisionPair(c, monitorDn, monitoredDn) &&
      typeof c.sequence === "number"
    ) {
      const seq = c.sequence;
      best = best == null ? seq : Math.max(best, seq);
    }
  }
  return best;
}

/** `isMonitoring: true` for this pair in shared state (SILENT/WHISPER may not have a customer leg yet). */
export function callStateMapHasSupervisionMonitoringFlagForPair(
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

function callHasLiveSupervisionObservationLeg(
  call: MonitoringCallStateSlice,
  monitorDn: string,
  monitoredDn: string,
  payload: MonitoringPayload,
): boolean {
  if (!call.parties?.length) {
    return false;
  }
  const hasLiveObservationLeg = call.parties.some(
    (p) =>
      partyIsLiveForWallboard(p) &&
      (ctiAddressesEquivalent(p.callingAddress, monitorDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitorDn)) &&
      (ctiAddressesEquivalent(p.callingAddress, monitoredDn) ||
        ctiAddressesEquivalent(p.calledAddress, monitoredDn)),
  );
  if (!hasLiveObservationLeg) {
    return false;
  }
  const monitoringType = call.monitoring?.monitoringType ?? payload.monitoringType;
  if (isSilentOrWhisperMonitoringType(monitoringType)) {
    return true;
  }
  return callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn);
}

function callHasConferenceBargeWithoutSupervisorLeg(
  call: MonitoringCallStateSlice,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  return (
    isBargeInMonitoringType(call.monitoring?.monitoringType) &&
    call.isMonitoring === true &&
    callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitorDn)
  );
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

    if (callHasLiveSupervisionObservationLeg(c, monitorDn, monitoredDn, payload)) {
      return true;
    }

    // Conference barge only: supervisor leg dropped from map while agent+customer stay live.
    if (callHasConferenceBargeWithoutSupervisorLeg(c, monitoredDn, monitorDn)) {
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

/** True when the agent had a customer/external leg that has already ended (Jabber hang-up). */
export function monitoredAgentHasEndedCustomerLegInCallStateMap(
  callStateMap: Record<string, unknown>,
  monitoredDn: string,
  monitorDn: string,
): boolean {
  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== "object") {
      continue;
    }
    const c = call as MonitoringCallStateSlice;
    if (!callRelatesToSupervisionPair(c, monitorDn, monitoredDn)) {
      continue;
    }
    if (callHasEndedCustomerPartyForAgent(c, monitoredDn, monitorDn)) {
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

function remoteSupervisionSupersededInCallStateMap(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
): boolean {
  if (!callStateMap) {
    return false;
  }
  const pairMaxSeq = bestSupervisionSequenceForPairInCallStateMap(
    callStateMap,
    payload.monitorDn,
    payload.monitoredDn,
  );
  const rowSeq = supervisionSequenceForPairAndTypeInCallStateMap(
    callStateMap,
    payload.monitorDn,
    payload.monitoredDn,
    payload.monitoringType,
  );
  return pairMaxSeq != null && rowSeq != null && rowSeq < pairMaxSeq;
}

function remoteBargeSupervisionSessionActive(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
): boolean {
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
    ) && supervisionSessionHasLiveSupervisorAgentLeg(callStateMap, payload)
  );
}

function remoteSilentWhisperSupervisionSessionActive(
  payload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
): boolean {
  if (!callStateMap || Object.keys(callStateMap).length === 0) {
    return eventLogHasSupervisionSnapshotForPair(eventLog, payload);
  }
  if (callStateMapMonitoredAgentCallsFullyTerminal(callStateMap, payload.monitoredDn)) {
    return false;
  }
  if (
    monitoredAgentHasEndedCustomerLegInCallStateMap(
      callStateMap,
      payload.monitoredDn,
      payload.monitorDn,
    )
  ) {
    return false;
  }
  if (
    callStateMapHasSupervisionMonitoringFlagForPair(
      callStateMap,
      payload.monitorDn,
      payload.monitoredDn,
    )
  ) {
    return true;
  }
  if (supervisionSessionHasLiveSupervisorAgentLeg(callStateMap, payload)) {
    return true;
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
  return eventLogHasSupervisionSnapshotForPair(eventLog, payload);
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

  if (supervisionEndedInLogWithoutNewerMapSession(payload, callStateMap, eventLog)) {
    return false;
  }

  if (remoteSupervisionSupersededInCallStateMap(payload, callStateMap)) {
    return false;
  }

  if (supervisionMapSequenceAfterLastEndedInLog(payload, callStateMap, eventLog) == null) {
    const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
      dn: payload.monitoredDn,
      monitor: payload.monitorDn,
      deviceName: payload.monitoredDeviceName,
      type: payload.monitoringType,
    });
    if (terminalClear) {
      return false;
    }
  }

  if (isBargeInMonitoringType(payload.monitoringType)) {
    return remoteBargeSupervisionSessionActive(payload, callStateMap);
  }

  if (isSilentOrWhisperMonitoringType(payload.monitoringType)) {
    return remoteSilentWhisperSupervisionSessionActive(
      payload,
      callStateMap,
      eventLog,
    );
  }

  return true;
}

/**
 * Wallboard supervision context — merges local UI state with SSE ({@link callStateMap} +
 * {@link eventLog}). WHISPER/BARGE_IN are visible to all viewers; SILENT Live Coaching is
 * limited to the monitor DN via {@link applyWallboardMonitoringViewerPrivacy}.
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
    return applyWallboardMonitoringViewerPrivacy(
      activeMonitoring,
      options?.viewerUserAddress,
    );
  }

  const resolved = resolveEffectiveWallboardMonitoringFromStreams(
    activeMonitoring,
    callStateMap,
    dnsMap,
    eventLog,
    options,
  );
  return applyWallboardMonitoringViewerPrivacy(
    resolved,
    options?.viewerUserAddress,
  );
}

function resolveEffectiveWhenRemoteTerminalClear(
  activeMonitoring: ActiveMonitoring,
  remotePayload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  streamPickOptions: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      streamPickOptions,
    )
  ) {
    return activeMonitoring;
  }
  if (
    isWallboardRemoteSupervisionSessionActive(
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    )
  ) {
    return activeMonitoringFromPayload(remotePayload);
  }
  return CLEARED_WALLBOARD_MONITORING;
}

function resolveEffectiveWhenRemoteSessionInactive(
  activeMonitoring: ActiveMonitoring,
  remotePayload: MonitoringPayload,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  streamPickOptions: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
    dn: remotePayload.monitoredDn,
    monitor: remotePayload.monitorDn,
    deviceName: remotePayload.monitoredDeviceName,
    type: activeMonitoring.type ?? remotePayload.monitoringType,
  });
  if (terminalClear) {
    return resolveEffectiveWhenRemoteTerminalClear(
      activeMonitoring,
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    );
  }
  if (isSupervisionSessionStartLag(remotePayload, callStateMap, eventLog)) {
    return activeMonitoringFromPayload(remotePayload);
  }
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      streamPickOptions,
    )
  ) {
    return activeMonitoring;
  }
  if (
    isStreamSupervisionSessionActive(
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    ) ||
    wallboardMonitoringPayloadShouldApplyFromStream(
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    )
  ) {
    return activeMonitoringFromPayload(remotePayload);
  }
  return CLEARED_WALLBOARD_MONITORING;
}

function resolveEffectiveWhenNoRemotePayload(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  streamPickOptions: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  if (!activeMonitoring.dn && !activeMonitoring.type) {
    return CLEARED_WALLBOARD_MONITORING;
  }
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      streamPickOptions,
    )
  ) {
    return activeMonitoring;
  }
  const localPayload = monitoringPayloadFromActiveMonitoring(activeMonitoring);
  if (localPayload && callStateMap) {
    if (
      supervisionEndedInLogWithoutNewerMapSession(
        localPayload,
        callStateMap,
        eventLog,
      ) &&
      !shouldRetainLocalWallboardMonitoringDuringSseLag(
        activeMonitoring,
        eventLog,
        streamPickOptions,
      )
    ) {
      return CLEARED_WALLBOARD_MONITORING;
    }
    const sessionActive = isWallboardRemoteSupervisionSessionActive(
      localPayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    );
    if (!sessionActive) {
      const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
        dn: localPayload.monitoredDn,
        monitor: localPayload.monitorDn,
        deviceName: localPayload.monitoredDeviceName,
        type: activeMonitoring.type,
      });
      const logStillClaimsSession =
        eventLogHasSupervisionSnapshotForPair(eventLog, localPayload) &&
        !terminalClear;
      if (!logStillClaimsSession) {
        return CLEARED_WALLBOARD_MONITORING;
      }
    }
  }
  return activeMonitoring;
}

function mergeActiveWithRemoteMonitoringPayload(
  activeMonitoring: ActiveMonitoring,
  remotePayload: MonitoringPayload,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
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

function resolveEffectiveWhenRemotePayloadActive(
  activeMonitoring: ActiveMonitoring,
  remotePayload: MonitoringPayload,
  eventLog: readonly unknown[] | undefined,
  streamPickOptions: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  if (!activeMonitoring.dn || !activeMonitoring.monitor) {
    return activeMonitoringFromPayload(remotePayload);
  }
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      streamPickOptions,
    ) &&
    !wallboardMonitoringSessionMatches(activeMonitoring, remotePayload)
  ) {
    return activeMonitoring;
  }
  if (wallboardMonitoringSessionMatches(activeMonitoring, remotePayload)) {
    return mergeActiveWithRemoteMonitoringPayload(activeMonitoring, remotePayload);
  }
  return activeMonitoringFromPayload(remotePayload);
}

function resolveEffectiveWallboardMonitoringFromStreams(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} {
  const streamPickOptions: ResolveEffectiveWallboardMonitoringOptions = {
    ...options,
    callStateMap: callStateMap ?? options?.callStateMap,
    eventLog: eventLog ?? options?.eventLog,
    dnsMap: dnsMap ?? options?.dnsMap,
    activeMonitoring,
  };
  const remotePayload = pickBestApplicableMonitoringPayload(
    callStateMap,
    dnsMap,
    eventLog,
    streamPickOptions,
  );

  if (
    remotePayload &&
    !isWallboardRemoteSupervisionSessionActive(
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    )
  ) {
    return resolveEffectiveWhenRemoteSessionInactive(
      activeMonitoring,
      remotePayload,
      callStateMap,
      eventLog,
      streamPickOptions,
    );
  }

  if (!remotePayload) {
    return resolveEffectiveWhenNoRemotePayload(
      activeMonitoring,
      callStateMap,
      eventLog,
      streamPickOptions,
    );
  }

  return resolveEffectiveWhenRemotePayloadActive(
    activeMonitoring,
    remotePayload,
    eventLog,
    streamPickOptions,
  );
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

export function isSilentMonitoringType(
  monitoringType: string | null | undefined,
): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return normalized === "SILENT";
}

export function isWhisperMonitoringType(
  monitoringType: string | null | undefined,
): boolean {
  const normalized = String(monitoringType ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");
  return normalized === "WHISPER";
}

/** SILENT Live Coaching is private to the supervisor who started it (not other wallboard viewers). */
export function isSilentMonitoringVisibleToViewer(
  monitoringType: string | null | undefined,
  monitorDn: string | null | undefined,
  viewerUserAddress: string | null | undefined,
): boolean {
  if (!isSilentMonitoringType(monitoringType)) {
    return true;
  }
  if (!monitorDn || !viewerUserAddress) {
    return false;
  }
  return ctiAddressesEquivalent(viewerUserAddress, monitorDn);
}

function applyWallboardMonitoringViewerPrivacy<
  T extends ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  },
>(monitoring: T, viewerUserAddress: string | null | undefined): T {
  if (
    isSilentMonitoringVisibleToViewer(
      monitoring.type,
      monitoring.monitor,
      viewerUserAddress,
    )
  ) {
    return monitoring;
  }
  return CLEARED_WALLBOARD_MONITORING as T;
}

/**
 * Whether wallboard monitoring UI should stay up (auto-clear effect). Uses the same session
 * rules as Live Coaching / remote viewers for SILENT, WHISPER, and BARGE_IN.
 */
export function shouldRetainWallboardMonitoringState(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const payload = monitoringPayloadFromActiveMonitoring(activeMonitoring);
  if (!payload) {
    return false;
  }
  return isWallboardRemoteSupervisionSessionActive(
    payload,
    callStateMap,
    eventLog,
    options,
  );
}

function mergeEffectiveWithRemoteActiveMonitoring(
  effectiveMonitoring: ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  },
  remoteActive: ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  },
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} | null {
  if (!effectiveMonitoring.dn || !effectiveMonitoring.type) {
    return remoteActive;
  }
  const typeChanged =
    normalizeMonitoringTypeForWallboardCompare(effectiveMonitoring.type) !==
    normalizeMonitoringTypeForWallboardCompare(remoteActive.type);
  const samePair =
    effectiveMonitoring.monitor &&
    effectiveMonitoring.dn &&
    remoteActive.monitor &&
    remoteActive.dn &&
    ctiAddressesEquivalent(effectiveMonitoring.monitor, remoteActive.monitor) &&
    ctiAddressesEquivalent(effectiveMonitoring.dn, remoteActive.dn);
  if (!samePair) {
    return null;
  }
  if (!typeChanged) {
    return {
      ...effectiveMonitoring,
      type: remoteActive.type,
      deviceName: remoteActive.deviceName ?? effectiveMonitoring.deviceName ?? null,
      monitorDeviceName:
        remoteActive.monitorDeviceName ?? effectiveMonitoring.monitorDeviceName,
      monitorDeviceType:
        remoteActive.monitorDeviceType ?? effectiveMonitoring.monitorDeviceType,
    };
  }
  return remoteActive;
}

function uiMonitoringFromPinnedCallStateMap(
  activeMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  dnsMap:
    | Record<string, { devices?: Record<string, DnsDevice> } | undefined>
    | undefined,
): ActiveMonitoring & {
  monitorDeviceName?: string;
  monitorDeviceType?: string;
} | null {
  if (
    !activeMonitoring.dn ||
    !activeMonitoring.monitor ||
    !activeMonitoring.type ||
    !callStateMap ||
    !dnsMap
  ) {
    return null;
  }
  const pinnedUi = pickPinnedSupervisionPayloadFromCallStateMap(
    callStateMap,
    dnsMap,
    activeMonitoring,
  );
  return pinnedUi ? activeMonitoringFromPayload(pinnedUi) : null;
}

/**
 * UI/categorization snapshot — effective stream state, local start, or remote-only SSE lag.
 */
export function resolveWallboardMonitoringForUi(
  activeMonitoring: ActiveMonitoring,
  effectiveMonitoring: ActiveMonitoring & {
    monitorDeviceName?: string;
    monitorDeviceType?: string;
  },
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
  const streamOptions: ResolveEffectiveWallboardMonitoringOptions = {
    ...options,
    callStateMap: callStateMap ?? options?.callStateMap,
    eventLog: eventLog ?? options?.eventLog,
    dnsMap: dnsMap ?? options?.dnsMap,
    activeMonitoring: options?.activeMonitoring ?? activeMonitoring,
  };

  const remotePayload = pickBestApplicableMonitoringPayload(
    callStateMap,
    dnsMap,
    eventLog,
    streamOptions,
  );
  if (remotePayload) {
    const merged = mergeEffectiveWithRemoteActiveMonitoring(
      effectiveMonitoring,
      activeMonitoringFromPayload(remotePayload),
    );
    if (merged) {
      return merged;
    }
  }

  if (effectiveMonitoring.dn && effectiveMonitoring.type) {
    return effectiveMonitoring;
  }

  const pinnedUi = uiMonitoringFromPinnedCallStateMap(
    activeMonitoring,
    callStateMap,
    dnsMap,
  );
  if (pinnedUi) {
    return pinnedUi;
  }

  const sessionActive = computeWallboardSupervisionSessionActive(
    activeMonitoring,
    effectiveMonitoring,
    callStateMap,
    eventLog,
    streamOptions,
  );

  if (
    activeMonitoring.dn &&
    activeMonitoring.monitor &&
    activeMonitoring.type &&
    sessionActive
  ) {
    return {
      ...activeMonitoring,
      monitorDeviceName: activeMonitoring.monitorDeviceName,
      monitorDeviceType: activeMonitoring.monitorDeviceType,
    };
  }

  return effectiveMonitoring;
}

function wallboardSupervisionMonitoringSource(
  activeMonitoring: ActiveMonitoring,
  effectiveMonitoring: ActiveMonitoring,
): ActiveMonitoring | null {
  if (
    effectiveMonitoring.dn &&
    effectiveMonitoring.monitor &&
    effectiveMonitoring.type
  ) {
    return effectiveMonitoring;
  }
  if (activeMonitoring.dn && activeMonitoring.monitor && activeMonitoring.type) {
    return activeMonitoring;
  }
  return null;
}

function computeSessionActiveForMonitoringSource(
  source: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  const monitoringType = source.type;
  if (!monitoringType) {
    return false;
  }
  const streamPayload: MonitoringPayload = {
    monitoredDn: String(source.dn),
    monitorDn: String(source.monitor),
    monitoringType: String(monitoringType),
    monitoredDeviceName: source.deviceName ?? undefined,
  };
  const terminalClear = findTerminalMonitoringClearInRecentLog(eventLog ?? [], {
    dn: source.dn,
    monitor: source.monitor,
    deviceName: source.deviceName,
    type: source.type,
  });
  if (!terminalClear && callStateMap && source.monitor && source.dn && source.type) {
    if (
      isSilentOrWhisperMonitoringType(source.type) &&
      callStateMapHasSupervisionMonitoringFlagForPair(
        callStateMap,
        source.monitor,
        source.dn,
      )
    ) {
      return true;
    }
    if (
      isBargeInMonitoringType(source.type) &&
      isWallboardRemoteSupervisionSessionActive(
        streamPayload,
        callStateMap,
        eventLog,
        {
          ...options,
          suppressedSessionKey: null,
          monitoringTeardown: null,
        },
      )
    ) {
      return true;
    }
  }
  return isStreamSupervisionSessionActive(
    streamPayload,
    callStateMap,
    eventLog,
    options,
  );
}

export function computeWallboardSupervisionSessionActive(
  activeMonitoring: ActiveMonitoring,
  effectiveMonitoring: ActiveMonitoring,
  callStateMap: Record<string, unknown> | undefined,
  eventLog: readonly unknown[] | undefined,
  options?: ResolveEffectiveWallboardMonitoringOptions,
): boolean {
  if (
    shouldRetainLocalWallboardMonitoringDuringSseLag(
      activeMonitoring,
      eventLog,
      options,
    )
  ) {
    return true;
  }

  const source = wallboardSupervisionMonitoringSource(
    activeMonitoring,
    effectiveMonitoring,
  );
  if (source?.dn && source.monitor && source.type) {
    return computeSessionActiveForMonitoringSource(
      source,
      callStateMap,
      eventLog,
      options,
    );
  }

  const remoteOnly = streamPayloadFromOptions(callStateMap, eventLog, options);
  if (!remoteOnly) {
    return false;
  }
  return isStreamSupervisionSessionActive(
    remoteOnly,
    callStateMap,
    eventLog,
    options,
  );
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
  return call.parties.some(
    (p) =>
      partyIsLiveForWallboard(p) &&
      (ctiAddressesEquivalent(p.callingAddress, supervisor) ||
        ctiAddressesEquivalent(p.calledAddress, supervisor)) &&
      (ctiAddressesEquivalent(p.callingAddress, agent) ||
        ctiAddressesEquivalent(p.calledAddress, agent)),
  );
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
  return !callHasLiveAgentPartyWithNonSupervisor(call, agentDn, supervisorDn);
}

function agentCustomerCallVisibleDuringSupervision(
  call: LooseWallboardCall,
  dn: string,
  monitorDn: string | undefined,
  agentDn: string | undefined,
  monitoringType: string | null | undefined,
): boolean {
  if (!monitorDn || !agentDn || !ctiAddressesEquivalent(dn, agentDn)) {
    return false;
  }
  if (!callHasLiveAgentPartyWithNonSupervisor(call, String(agentDn), String(monitorDn))) {
    return false;
  }
  return (
    isSilentOrWhisperMonitoringType(monitoringType) ||
    isBargeInMonitoringType(monitoringType)
  );
}

function shouldExcludeSupervisionMarkedCall(
  call: LooseWallboardCall,
  dn: string,
  monitorDn: string | undefined,
  agentDn: string | undefined,
  monitoringType: string | null | undefined,
): boolean {
  if (call.isMonitoring !== true) {
    return false;
  }
  if (agentCustomerCallVisibleDuringSupervision(call, dn, monitorDn, agentDn, monitoringType)) {
    return false;
  }
  return true;
}

function shouldExcludeCallDuringMonitoringTeardown(
  call: LooseWallboardCall,
  dn: string,
  monitorDn: string | undefined,
  agentDn: string | undefined,
  monitoringTeardown: MonitoringTeardownHint | null | undefined,
): boolean {
  if (!monitoringTeardown || !monitorDn || !agentDn) {
    return false;
  }
  const involvesDn =
    ctiAddressesEquivalent(dn, monitorDn) || ctiAddressesEquivalent(dn, agentDn);
  if (!involvesDn) {
    return false;
  }
  return (
    call.isMonitoring === true ||
    callHasLiveSupervisorAndAgentParties(call, String(monitorDn), String(agentDn))
  );
}

function shouldExcludeStaleTeardownObservationCall(
  call: LooseWallboardCall,
  dn: string,
  monitoringTeardown: MonitoringTeardownHint,
): boolean {
  if (String(dn) !== String(monitoringTeardown.monitoredDn)) {
    return false;
  }
  const teardownMonitor = monitoringTeardown.monitorDn;
  if (!teardownMonitor) {
    return false;
  }
  const monitoredDn = String(monitoringTeardown.monitoredDn);
  const monitor = String(teardownMonitor);
  return (
    callHasLiveSupervisorAndAgentParties(call, monitor, monitoredDn) &&
    !callHasLiveAgentPartyWithNonSupervisor(call, monitoredDn, monitor)
  );
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

  if (
    shouldExcludeSupervisionMarkedCall(call, dn, monitorDn, agentDn, monitoringType)
  ) {
    return true;
  }

  if (
    shouldExcludeCallDuringMonitoringTeardown(
      call,
      dn,
      monitorDn,
      agentDn,
      monitoringTeardown,
    )
  ) {
    return true;
  }

  if (
    monitorDn &&
    agentDn &&
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

  if (monitoringTeardown && shouldExcludeStaleTeardownObservationCall(call, dn, monitoringTeardown)) {
    return true;
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
  const monitorDn = activeMonitoring?.monitor;
  const monitoredDn = activeMonitoring?.dn;

  // Live Coaching card is the supervisor row — show the agent's customer call, not the observation leg.
  if (
    monitorDn != null &&
    monitoredDn != null &&
    String(dn) === String(monitorDn)
  ) {
    const supervisorView = pickMonitoredAgentWallboardCall(
      String(monitoredDn),
      monitorDn,
      getCallStatesForDn,
      getCallStateForDevice,
      activeMonitoring.deviceName,
      activeMonitoring.type,
    );
    if (supervisorView) {
      return supervisorView;
    }
  }

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
