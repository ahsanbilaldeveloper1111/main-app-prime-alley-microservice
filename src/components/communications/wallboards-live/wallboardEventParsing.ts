/** Pure helpers for wallboard live dashboard eventLog / dnsMap parsing (Sonar: lowers index.tsx complexity). */

export type RegisteredDeviceEntry = {
  deviceName: string
  when: string
  lastCallEndTime?: string
}

export function isCompleteStateLikeEvent(e: {
  type?: string
  data?: { type?: string }
}): boolean {
  return (
    e.type === 'initial-state' ||
    e.data?.type === 'complete_state' ||
    e.type === 'complete_state'
  )
}

export function devicesArrayFromCompleteStateEvent(completeStateEvent: {
  data?: unknown
}): unknown[] {
  const data = completeStateEvent.data
  if (!data) {
    return []
  }
  if (Array.isArray(data)) {
    return data
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as { data: unknown[] }).data)
  ) {
    return (data as { data: unknown[] }).data
  }
  if (typeof data === 'object' && data !== null) {
    return Object.values(data as Record<string, { devices?: Record<string, unknown> }>).flatMap(
      (dnData) => Object.values(dnData.devices || {})
    )
  }
  return []
}

export function registeredEntriesFromDevices(
  devices: ReadonlyArray<{
    terminalState?: string
    dn?: string
    deviceName?: string
    when?: string
    lastCallEndTime?: string
  }>
): Record<string, RegisteredDeviceEntry> {
  const registered: Record<string, RegisteredDeviceEntry> = {}
  for (const device of devices) {
    if (
      device.terminalState === 'REGISTERED' &&
      device.dn &&
      device.deviceName &&
      device.when
    ) {
      const key = `${device.dn}_${device.deviceName}`
      registered[key] = {
        deviceName: device.deviceName,
        when: device.when,
        ...(device.lastCallEndTime && { lastCallEndTime: device.lastCallEndTime }),
      }
    }
  }
  return registered
}

export type DnsStateDevicePayload = {
  dn?: string
  deviceName?: string
  terminalState?: string
  when?: string
  lastCallEndTime?: string
}

export function devicePayloadFromDnsStateEvent(event: {
  data?: { data?: unknown; dn?: string }
  dn?: string
}): DnsStateDevicePayload | null {
  const fromNested = event.data?.data
  if (fromNested && typeof fromNested === 'object') {
    return fromNested as DnsStateDevicePayload
  }
  if (event.data?.dn) {
    return event.data as DnsStateDevicePayload
  }
  if (event.dn) {
    return event as DnsStateDevicePayload
  }
  return null
}

type Party = {
  callingAddress?: string
  calledAddress?: string
  callingDeviceName?: string
  calledDeviceName?: string
}

export function resolveMonitoredDeviceNameFromParties(
  parties: Party[],
  monitorDn: string,
  monitoredDn: string
): string | null {
  let monitoredParty = parties.find(
    (p) => p.calledAddress === monitoredDn && p.callingAddress === monitorDn
  )
  if (monitoredParty) {
    return monitoredParty.calledDeviceName || monitoredParty.callingDeviceName || null
  }
  monitoredParty = parties.find(
    (p) => p.callingAddress === monitoredDn && p.calledAddress === monitorDn
  )
  if (monitoredParty) {
    return monitoredParty.callingDeviceName || monitoredParty.calledDeviceName || null
  }
  monitoredParty = parties.find(
    (p) => p.calledAddress === monitoredDn || p.callingAddress === monitoredDn
  )
  if (monitoredParty) {
    return monitoredDn === monitoredParty.calledAddress
      ? monitoredParty.calledDeviceName ?? null
      : monitoredParty.callingDeviceName || null
  }
  return null
}

type DnsDevice = { terminalState?: string; deviceName?: string; deviceType?: string }

export function pickDeviceNameFromDnsEntry(devicesRecord: Record<string, DnsDevice> | undefined): string | null {
  if (!devicesRecord) {
    return null
  }
  const devices = Object.values(devicesRecord)
  if (devices.length === 0) {
    return null
  }
  return (
    devices.find((d) => d.terminalState === 'REGISTERED')?.deviceName ||
    devices[0]?.deviceName ||
    null
  )
}

export function pickMonitorDeviceFromDns(
  devicesRecord: Record<string, DnsDevice> | undefined,
  monitorDeviceName: string | undefined
): { monitorDeviceName?: string; monitorDeviceType?: string } {
  if (!devicesRecord) {
    return {}
  }
  const devices = Object.values(devicesRecord)
  if (devices.length === 0) {
    return {}
  }
  if (monitorDeviceName) {
    const device = devices.find((d) => d.deviceName === monitorDeviceName)
    if (device) {
      return { monitorDeviceName, monitorDeviceType: device.deviceType }
    }
  }
  const device = devices.find((d) => d.terminalState === 'REGISTERED') || devices[0]
  return {
    monitorDeviceName: device?.deviceName,
    monitorDeviceType: device?.deviceType,
  }
}

export type MonitoringPayload = {
  monitorDn: string
  monitoredDn: string
  monitoringType: string
  monitoredDeviceName?: string
  monitorDeviceName?: string
  monitorDeviceType?: string
}

type IdleDnsEntry = { dn: unknown; devices?: Record<string, { terminalState?: string; when?: string; lastCallEndTime?: string }> }

export function getIdleSinceIsoFromCompleteStateForDn(
  dnsList: IdleDnsEntry[],
  dn: string,
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number
): string | undefined {
  const dnEntry = dnsList.find((d) => String(d.dn) === dn)
  const deviceList = dnEntry ? Object.values(dnEntry.devices || {}) : []
  let latestMs: number | undefined
  for (const device of deviceList) {
    if (device.terminalState !== 'REGISTERED') {
      continue
    }
    const whenMs = parseServerTimeFn(device.when)
    const lastCallEndMs = parseServerTimeFn(device.lastCallEndTime)
    const idleSinceMs =
      whenMs && lastCallEndMs ? Math.max(whenMs, lastCallEndMs) : whenMs || lastCallEndMs
    if (idleSinceMs && (latestMs === undefined || idleSinceMs > latestMs)) {
      latestMs = idleSinceMs
    }
  }
  if (latestMs === undefined) {
    return undefined
  }
  return new Date(latestMs).toISOString()
}

export function getLatestRegisteredWhenIsoForDn(
  dn: string,
  registeredDnsStore: Record<string, RegisteredDeviceEntry>,
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number
): string | undefined {
  let latestMs: number | undefined
  for (const [key, value] of Object.entries(registeredDnsStore)) {
    const [storeDn] = key.split('_')
    if (storeDn === String(dn) && value?.when) {
      const whenMs = parseServerTimeFn(value.when)
      const lastCallEndMs = parseServerTimeFn(value.lastCallEndTime)
      const idleSinceMs =
        whenMs && lastCallEndMs ? Math.max(whenMs, lastCallEndMs) : whenMs
      if (idleSinceMs && (latestMs === undefined || idleSinceMs > latestMs)) {
        latestMs = idleSinceMs
      }
    }
  }
  if (latestMs === undefined) {
    return undefined
  }
  return new Date(latestMs).toISOString()
}

type MutableRef<T> = { current: T }

export type IdleSinceReconcileInput = {
  prev: Record<string, string>
  dnsList: IdleDnsEntry[]
  currentSectionByDn: Record<string, string>
  registeredDnsStore: Record<string, RegisteredDeviceEntry>
  prevSectionByDnRef: MutableRef<Record<string, string>>
  prevIsRegisteredByDnRef: MutableRef<Record<string, boolean>>
  nowIso: string
  parseServerTimeFn: (isoOrDate: string | null | undefined) => number
}

function ensureUniqueIdleMap(next: Record<string, string>, prev: Record<string, string>): Record<string, string> {
  return next === prev ? { ...prev } : next
}

function applyActiveIdleForDn(
  input: IdleSinceReconcileInput,
  dnKey: string,
  prevSection: string | undefined,
  next: Record<string, string>,
  prev: Record<string, string>
): Record<string, string> {
  const transitionedIntoIdle = !!prevSection && prevSection !== 'activeIdle'
  if (transitionedIntoIdle) {
    const n = ensureUniqueIdleMap(next, prev)
    n[dnKey] = input.nowIso
    return n
  }
  const fromCompleteState = getIdleSinceIsoFromCompleteStateForDn(
    input.dnsList,
    dnKey,
    input.parseServerTimeFn
  )
  const idleIso =
    fromCompleteState ||
    getLatestRegisteredWhenIsoForDn(dnKey, input.registeredDnsStore, input.parseServerTimeFn) ||
    next[dnKey] ||
    input.nowIso
  const n = ensureUniqueIdleMap(next, prev)
  n[dnKey] = idleIso
  return n
}

function processIdleRowForDn(
  row: IdleDnsEntry,
  input: IdleSinceReconcileInput,
  next: Record<string, string>,
  prev: Record<string, string>,
  seenDns: Set<string>
): Record<string, string> {
  const dnKey = String(row.dn)
  seenDns.add(dnKey)

  const deviceList = Object.values(row.devices || {})
  const isRegistered = deviceList.some((d) => d.terminalState === 'REGISTERED')
  const currentSection = input.currentSectionByDn[dnKey]
  const prevSection = input.prevSectionByDnRef.current[dnKey]

  if (!isRegistered || currentSection === 'downOffline') {
    let n = next
    if (n[dnKey] !== undefined) {
      n = ensureUniqueIdleMap(n, prev)
      delete n[dnKey]
    }
    input.prevIsRegisteredByDnRef.current[dnKey] = isRegistered
    input.prevSectionByDnRef.current[dnKey] = currentSection
    return n
  }

  let n = next
  if (currentSection === 'activeIdle') {
    n = applyActiveIdleForDn(input, dnKey, prevSection, n, prev)
  }
  input.prevIsRegisteredByDnRef.current[dnKey] = isRegistered
  input.prevSectionByDnRef.current[dnKey] = currentSection
  return n
}

function dropIdleKeysForMissingDns(
  next: Record<string, string>,
  prev: Record<string, string>,
  seenDns: Set<string>
): Record<string, string> {
  let n = next
  for (const dnKey of Object.keys(n)) {
    if (seenDns.has(dnKey)) {
      continue
    }
    n = ensureUniqueIdleMap(n, prev)
    delete n[dnKey]
  }
  return n
}

export function computeNextIdleSinceMap(input: IdleSinceReconcileInput): Record<string, string> {
  const { prev, dnsList } = input
  let next = prev
  const seenDns = new Set<string>()
  for (const row of dnsList) {
    next = processIdleRowForDn(row, input, next, prev, seenDns)
  }
  next = dropIdleKeysForMissingDns(next, prev, seenDns)
  const prevKeys = Object.keys(prev)
  if (
    Object.keys(next).length === prevKeys.length &&
    prevKeys.every((k) => next[k] === prev[k])
  ) {
    return prev
  }
  return next
}

export function monitoringPayloadDiffersFromActive(
  active: {
    dn: string | null
    type: string | null
    monitor?: string
    deviceName?: string | null
  },
  payload: MonitoringPayload
): boolean {
  return (
    !active.dn ||
    active.dn !== payload.monitoredDn ||
    (!!payload.monitoredDeviceName && active.deviceName !== payload.monitoredDeviceName) ||
    active.monitor !== payload.monitorDn ||
    active.type !== payload.monitoringType
  )
}

export function buildMonitoringPayloadFromEvent(
  parties: Party[],
  monitoring: { monitorDn?: string; monitoredDn?: string; monitoringType?: string },
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  userAddress: string
): MonitoringPayload | null {
  const monitorDn = monitoring.monitorDn
  const monitoredDn = monitoring.monitoredDn
  const monitoringType = monitoring.monitoringType
  if (monitorDn !== userAddress || !monitoredDn || !monitoringType) {
    return null
  }

  let monitoredDeviceName = resolveMonitoredDeviceNameFromParties(parties, monitorDn, monitoredDn)
  if (!monitoredDeviceName) {
    monitoredDeviceName = pickDeviceNameFromDnsEntry(dnsMap[monitoredDn]?.devices)
  }

  const supervisorParty = parties.find(
    (p) => p.callingAddress === monitorDn || p.calledAddress === monitorDn
  )
  let monitorDeviceName = supervisorParty?.callingDeviceName || supervisorParty?.calledDeviceName
  let monitorDeviceType: string | undefined

  if (monitorDeviceName && dnsMap[monitorDn]?.devices) {
    const devices = Object.values(dnsMap[monitorDn].devices || {})
    const device = devices.find((d) => d.deviceName === monitorDeviceName)
    monitorDeviceType = device?.deviceType
  }

  if (!monitorDeviceName && dnsMap[monitorDn]?.devices) {
    const picked = pickMonitorDeviceFromDns(dnsMap[monitorDn].devices, undefined)
    monitorDeviceName = picked.monitorDeviceName
    monitorDeviceType = picked.monitorDeviceType
  }

  return {
    monitorDn,
    monitoredDn,
    monitoringType,
    monitoredDeviceName: monitoredDeviceName || undefined,
    monitorDeviceName,
    monitorDeviceType,
  }
}

type MonitoringCallStateSlice = {
  parties?: Party[]
  monitoring?: { monitorDn?: string; monitoredDn?: string; monitoringType?: string }
  isMonitoring?: boolean
  isTerminating?: boolean
  hasActiveParticipants?: boolean
  eventTime?: string
}

function parseEventTimeMsForMonitoringPick(eventTime: string | undefined): number {
  if (!eventTime || typeof eventTime !== 'string') {
    return 0
  }
  const ms = new Date(eventTime).getTime()
  return Number.isFinite(ms) ? ms : 0
}

function isMonitoringCallStateCandidate(call: MonitoringCallStateSlice, userAddress: string): boolean {
  if (!call.parties?.length) {
    return false
  }
  if (call.isTerminating === true) {
    return false
  }
  if (call.hasActiveParticipants === false) {
    return false
  }
  if (!call.monitoring) {
    return false
  }
  return (
    (call.isMonitoring === true && Boolean(call.monitoring)) ||
    call.monitoring.monitorDn === userAddress
  )
}

/**
 * After reload, `eventLog` may be empty while `callStateMap` already includes ongoing_calls merge.
 * Picks the best supervisor monitoring session for the current user (latest by eventTime).
 */
export function pickBestMonitoringPayloadFromCallStateMap(
  callStateMap: Record<string, unknown>,
  dnsMap: Record<string, { devices?: Record<string, DnsDevice> } | undefined>,
  userAddress: string,
): MonitoringPayload | null {
  if (!userAddress || !callStateMap || typeof callStateMap !== 'object') {
    return null
  }

  const scored: { payload: MonitoringPayload; eventTimeMs: number }[] = []

  for (const call of Object.values(callStateMap)) {
    if (!call || typeof call !== 'object') {
      continue
    }
    const c = call as MonitoringCallStateSlice
    if (!isMonitoringCallStateCandidate(c, userAddress)) {
      continue
    }
    const parties = c.parties
    const monitoring = c.monitoring
    if (!parties?.length || !monitoring) {
      continue
    }
    const payload = buildMonitoringPayloadFromEvent(parties, monitoring, dnsMap, userAddress)
    if (!payload) {
      continue
    }
    scored.push({ payload, eventTimeMs: parseEventTimeMsForMonitoringPick(c.eventTime) })
  }

  if (scored.length === 0) {
    return null
  }
  scored.sort((a, b) => b.eventTimeMs - a.eventTimeMs)
  return scored[0]?.payload ?? null
}
