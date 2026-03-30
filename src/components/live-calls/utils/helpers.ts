import { CtiDevice, ActiveMonitoring } from './types'
import { SECTION_CONFIG } from './constants'
import moment from 'moment'

/** Wallboard: inputs for {@link categorizeDns} (single object keeps Sonar param count and complexity down). */
export type CategorizeDnsParams = {
  dn: string
  devices: CtiDevice[]
  call: unknown
  active: boolean
  activeMonitoring: ActiveMonitoring
  getCallStateForDevice: (dn: string, deviceName: string) => unknown
  getCallStatesForDn: (dn: string) => unknown[]
  userAddress?: string | null
}

type CallParty = {
  callingAddress?: string
  calledAddress?: string
  callStatus?: string
  startTime?: string
  endTime?: string
}

type LooseCall = {
  isTerminating?: boolean
  parties?: CallParty[]
  currentState?: string
}

function partyInvolvesDn(p: CallParty, dn: string): boolean {
  return p.callingAddress === dn || p.calledAddress === dn
}

function partyIsLive(p: CallParty): boolean {
  return p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
}

function partyInvolvesBoth(p: CallParty, dnA: string, dnB: string): boolean {
  return partyInvolvesDn(p, dnA) && partyInvolvesDn(p, dnB)
}

function hasSupervisorAgentActiveMonitoringCall(
  calls: LooseCall[],
  supervisorDn: string,
  agentDn: string
): boolean {
  return calls.some((c) => {
    if (c.isTerminating || !c.parties?.length) {
      return false
    }
    const hasMatchingLeg = c.parties.some((p) => partyInvolvesBoth(p, supervisorDn, agentDn))
    if (!hasMatchingLeg) {
      return false
    }
    return c.parties.some((p) => partyInvolvesBoth(p, supervisorDn, agentDn) && partyIsLive(p))
  })
}

function monitoredCallHasActiveParties(monitoredCall: LooseCall | null | undefined): boolean {
  if (!monitoredCall || monitoredCall.isTerminating || !monitoredCall.parties?.length) {
    return false
  }
  return monitoredCall.parties.some((p) => partyIsLive(p))
}

function resolveSupervisionSection(p: CategorizeDnsParams): string | null {
  const { dn, activeMonitoring, getCallStatesForDn, getCallStateForDevice } = p
  const agentDn = activeMonitoring.dn
  if (
    !activeMonitoring.monitor ||
    activeMonitoring.monitor !== dn ||
    !activeMonitoring.type ||
    !agentDn
  ) {
    return null
  }

  const supervisorCalls = getCallStatesForDn(dn) as LooseCall[]
  if (hasSupervisorAgentActiveMonitoringCall(supervisorCalls, dn, agentDn)) {
    return 'supervision'
  }

  if (!activeMonitoring.deviceName) {
    return 'supervision'
  }

  const monitoredCall = getCallStateForDevice(agentDn, activeMonitoring.deviceName) as LooseCall
  if (monitoredCallHasActiveParties(monitoredCall)) {
    return 'supervision'
  }

  return null
}

function dnHasActiveCallForWallboard(dn: string, getCallStatesForDn: (dn: string) => unknown[]): boolean {
  const allCallsForDn = getCallStatesForDn(dn) as LooseCall[]
  for (const callState of allCallsForDn) {
    if (callState.isTerminating) {
      continue
    }
    if (callState.currentState === 'RINGING') {
      return true
    }
    if (!callState.parties?.length) {
      continue
    }
    const dnParties = callState.parties.filter(
      (party) => partyInvolvesDn(party, dn) && partyIsLive(party)
    )
    if (dnParties.length > 0) {
      return true
    }
  }
  return false
}

/**
 * Get card level status based on device states
 */
export const getCardLevelStatus = (devices: CtiDevice[]): string => {
  if (!devices || devices.length === 0) return 'unregistered'
  if (devices.some((d) => d.terminalState === 'REGISTERED')) return 'registered'
  if (devices.some((d) => d.terminalState === 'STALE')) return 'stale'
  return 'unregistered'
}

/**
 * Categorize DN into sections based on monitoring, call state, and device status
 */
export const categorizeDns = (params: CategorizeDnsParams): string => {
  const { dn, devices } = params
  const cls = getCardLevelStatus(devices)

  const supervision = resolveSupervisionSection(params)
  if (supervision) {
    return supervision
  }

  if (dnHasActiveCallForWallboard(dn, params.getCallStatesForDn)) {
    return 'onCall'
  }

  if (cls === 'registered') {
    return 'activeIdle'
  }
  if (cls === 'unregistered' || cls === 'stale') {
    return 'downOffline'
  }

  return 'downOffline'
}

/**
 * Get section title
 */
export const getSectionTitle = (section: string): string => {
  return SECTION_CONFIG[section as keyof typeof SECTION_CONFIG]?.title || 'Unknown'
}

/**
 * Get section icon
 */
export const getSectionIcon = (section: string): string => {
  return SECTION_CONFIG[section as keyof typeof SECTION_CONFIG]?.icon || 'help'
}

/**
 * Get section color
 */
export const getSectionColor = (section: string): string => {
  return SECTION_CONFIG[section as keyof typeof SECTION_CONFIG]?.color || '#6c757d'
}

/**
 * Get section order
 */
export const getSectionOrder = (section: string): number => {
  return SECTION_CONFIG[section as keyof typeof SECTION_CONFIG]?.order || 3
}

/**
 * Get device icon class based on device type
 */
export const getDeviceIconClass = (_deviceType: string): string => {
  return 'material-icons-two-tone'
}

/**
 * Get device type label
 */
export const getDeviceTypeLabel = (type: string): string => {
  switch (type?.toUpperCase()) {
    case 'SOFT':
      return 'Desktop'
    case 'HARD':
      return 'Desk Phone'
    case 'MOBILE':
      return 'Mobile'
    case 'ANDROID':
      return 'Android'
    case 'IOS':
      return 'iOS'
    default:
      return type || ''
  }
}

function deriveEffectiveCallStateFromParty(
  state: string,
  allDropped: boolean,
  activeParty: CallParty
): string {
  if ((state !== 'DROPPED' && state !== 'DISCONNECTED') || allDropped) {
    return state
  }
  if (activeParty.callStatus === 'CONNECTED') {
    return 'ANSWERED'
  }
  if (activeParty.callStatus === 'ON_HOLD') {
    return 'HELD'
  }
  return state
}

const TERMINAL_IDLE_COLORS: Record<string, string> = {
  REGISTERED: '#17ba92',
  UNREGISTERED: '#c3352b',
  STALE: '#c39b22',
}

function colorForTerminalWhenNoParties(terminalState: string): string {
  return TERMINAL_IDLE_COLORS[terminalState] ?? ''
}

const STATE_COLORS: Record<string, string> = {
  RINGING_CALLER: '#d97706',
  RINGING_CALLEE: '#dc2626',
  ANSWERED: '#059669',
  CONNECTED: '#059669',
  RETRIEVED: '#059669',
  HELD: '#2563eb',
}

function colorForEffectiveState(effectiveState: string, role: string): string {
  if (effectiveState === 'RINGING') {
    return role === 'calling' ? STATE_COLORS.RINGING_CALLER : STATE_COLORS.RINGING_CALLEE
  }
  return STATE_COLORS[effectiveState] ?? '#6c757d'
}

function getTextForRinging(isCaller: boolean, isCallee: boolean, fallback: string): string {
  if (isCaller) {
    return 'Calling'
  }
  if (isCallee) {
    return 'Incoming'
  }
  return fallback
}

function getTextForAnsweredLike(isCaller: boolean, isCallee: boolean, fallback: string): string {
  if (isCaller) {
    return 'Outgoing'
  }
  if (isCallee) {
    return 'CONNECTED'
  }
  return fallback
}

function getTextForConnectedLike(isCaller: boolean, isCallee: boolean, fallback: string): string {
  if (isCaller) {
    return 'Outgoing'
  }
  if (isCallee) {
    return 'Connected'
  }
  return fallback
}

/**
 * Get icon for call state
 */
export const getIcon = (
  state: string,
  conf: boolean,
  isOneToOne: boolean,
  role: string,
  dn: string,
  parties: CallParty[] = []
): string | null => {
  const filtered = parties.filter((p) => partyInvolvesDn(p, dn))
  if (!filtered.length) return null

  const allDropped = filtered.every((p) => p.callStatus === 'DROPPED')
  const activeParty = filtered.find((p) => p.callStatus !== 'DROPPED') ?? filtered[0]

  const effectiveState = deriveEffectiveCallStateFromParty(state, allDropped, activeParty)

  if ((effectiveState === 'DROPPED' || effectiveState === 'DISCONNECTED') && allDropped) return null
  if (conf && !isOneToOne) return 'material-icons-two-tone'

  const icons: Record<string, string> = {
    RINGING: 'phone',
    ANSWERED: 'phone',
    RETRIEVED: 'phone',
    HELD: 'pause_circle',
  }

  return icons[effectiveState] ?? null
}

/**
 * Get color for call state
 */
export const getColor = (
  state: string,
  conf: boolean,
  isOneToOne: boolean,
  role: string,
  dn: string,
  terminalState: string,
  parties: CallParty[] = []
): string => {
  const filtered = parties.filter((p) => partyInvolvesDn(p, dn))
  if (!filtered.length) {
    return colorForTerminalWhenNoParties(terminalState)
  }

  const allDropped = filtered.every((p) => p.callStatus === 'DROPPED')
  if ((state === 'DROPPED' || state === 'DISCONNECTED' || allDropped) && allDropped) {
    return colorForTerminalWhenNoParties(terminalState)
  }

  if (conf && !isOneToOne && !allDropped) return '#6f42c1'
  if (state === 'HELD') return '#2563eb'

  const activeParty = filtered.find((p) => p.callStatus !== 'DROPPED') ?? filtered[0]
  const effectiveState = deriveEffectiveCallStateFromParty(state, allDropped, activeParty)

  return colorForEffectiveState(effectiveState, role)
}

/**
 * Get text for call state
 */
export const getText = (
  state: string,
  isConference: boolean,
  isOneToOne: boolean,
  dn: string,
  parties: CallParty[] = []
): string => {
  const filtered = parties.filter((p) => partyInvolvesDn(p, dn))
  if (!filtered.length) return dn

  const allDropped = filtered.every((p) => p.callStatus === 'DROPPED')
  if ((state === 'DROPPED' || state === 'DISCONNECTED' || allDropped) && allDropped) {
    return dn
  }

  if (isConference && !isOneToOne && !allDropped) return 'Conference'
  if (state === 'HELD') return 'On Hold'

  const activeParty = filtered.find((p) => p.callStatus !== 'DROPPED') ?? filtered[0]

  let effectiveState = state
  if ((state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped) {
    if (activeParty.callStatus === 'CONNECTED') effectiveState = 'ANSWERED'
    else if (activeParty.callStatus === 'ON_HOLD') effectiveState = 'HELD'
  }

  const isCaller = activeParty.callingAddress === dn
  const isCallee = activeParty.calledAddress === dn

  const stateMap: Record<string, string> = {
    RINGING: getTextForRinging(isCaller, isCallee, effectiveState),
    ANSWERED: getTextForAnsweredLike(isCaller, isCallee, effectiveState),
    RETRIEVED: getTextForAnsweredLike(isCaller, isCallee, effectiveState),
    HELD: 'On Hold',
    CONNECTED: getTextForConnectedLike(isCaller, isCallee, effectiveState),
    ON_HOLD: 'On Hold',
  }

  return stateMap[effectiveState] ?? effectiveState
}

/**
 * Check if DN is in active call
 */
export const isDnInActiveCall = (dn: string, getDnCallState: (dn: string) => unknown): boolean => {
  const call = getDnCallState(dn) as { parties?: CallParty[] } | null | undefined
  if (!call?.parties) return false
  const activeParticipants = call.parties.filter(
    (p) =>
      partyInvolvesDn(p, dn) && (p.callStatus === 'CONNECTED' || p.callStatus === 'ON_HOLD')
  )
  return activeParticipants.length > 0
}

/**
 * Get localStorage call states info
 */
export const getLocalStorageCallStatesInfo = () => {
  try {
    const callStates = localStorage.getItem('cti_call_states')
    const timestamp = localStorage.getItem('cti_call_states_timestamp')

    if (!callStates || !timestamp) {
      return { count: 0, timestamp: null, data: null }
    }

    const parsed = JSON.parse(callStates)
    const count = Object.keys(parsed).length
    const date = new Date(timestamp)

    return { count, timestamp: date.toLocaleString(), data: parsed }
  } catch (error) {
    return { count: 0, timestamp: null, data: null, error: (error as Error).message }
  }
}

function parseMomentUtcToDate(value: unknown): Date | null {
  try {
    const m = moment.utc(value as string)
    return m.isValid() ? m.toDate() : null
  } catch (err) {
    console.debug('[live-calls/helpers] moment.utc parse failed', err)
    return null
  }
}

function coerceToValidDate(value: unknown): Date | null {
  if (value == null || value === '') {
    return null
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const fromMoment = parseMomentUtcToDate(value)
  if (fromMoment) {
    return fromMoment
  }
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Parse call answer/connected start instant from API fields only (party leg, then call-level).
 * Does not use eventTime (message ordering timestamp).
 */
export function parseCallAnswerStartTimeUtc(
  call: unknown,
  fallbackStart?: Date | string | null
): Date | null {
  const c = call as { parties?: { startTime?: string }[]; startTime?: string } | null | undefined
  const firstParty = c?.parties?.[0]
  if (firstParty?.startTime) {
    const d = coerceToValidDate(firstParty.startTime)
    if (d) {
      return d
    }
  }
  if (c?.startTime) {
    const d = coerceToValidDate(c.startTime)
    if (d) {
      return d
    }
  }
  if (fallbackStart != null && fallbackStart !== '') {
    return coerceToValidDate(fallbackStart)
  }
  return null
}

/**
 * Elapsed milliseconds since parsed call start, for sorting (0 if no startTime on call).
 */
export function getCallSortDurationMs(call: unknown, nowMs: number = Date.now()): number {
  const start = parseCallAnswerStartTimeUtc(call)
  if (!start) {
    return 0
  }
  return Math.max(0, nowMs - start.getTime())
}

const ACTIVE_CALL_STATUSES = new Set(['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'])

function callHasActiveParticipantForDuration(call: { parties?: CallParty[]; isTerminating?: boolean }): boolean {
  if (call.isTerminating) {
    return false
  }
  return Boolean(
    call.parties?.some(
      (p) =>
        p.callStatus !== 'DROPPED' &&
        p.callStatus !== 'DISCONNECTED' &&
        ACTIVE_CALL_STATUSES.has(p.callStatus ?? '')
    )
  )
}

type DurationDebugInfo = {
  callId?: string
  isTerminating?: boolean
  hasActiveParticipants?: boolean
  partiesCount: number
  parties: Array<{ callStatus?: string; startTime?: string; endTime?: string }>
  error?: string
  startTime?: string
  endTime?: string | null
  startTimeSource?: string
  endTimeSource?: string | null
  durationType?: string
  durationSeconds?: number
  durationHours?: string
  calculatedDurationSeconds?: number
  calculatedDurationHours?: string
  cappedDurationSeconds?: number
}

function buildDurationDebugSnapshot(call: {
  callId?: string
  isTerminating?: boolean
  hasActiveParticipants?: boolean
  parties?: CallParty[]
}): DurationDebugInfo {
  return {
    callId: call.callId,
    isTerminating: call.isTerminating,
    hasActiveParticipants: call.hasActiveParticipants,
    partiesCount: call.parties?.length ?? 0,
    parties:
      call.parties?.map((p) => ({
        callStatus: p.callStatus,
        startTime: p.startTime,
        endTime: p.endTime,
      })) ?? [],
  }
}

function parseEndTimeFromValue(value: unknown): Date | null {
  return parseMomentUtcToDate(value) ?? coerceToValidDate(value)
}

function resolveEndTime(call: {
  parties?: Array<{ endTime?: string }>
  endTime?: string
}): Date | null {
  const firstParty = call.parties?.[0]
  if (firstParty?.endTime) {
    const parsed = parseEndTimeFromValue(firstParty.endTime)
    if (parsed) {
      return parsed
    }
  }
  if (call.endTime) {
    return parseEndTimeFromValue(call.endTime)
  }
  return null
}

function describeStartTimeSource(call: {
  parties?: Array<{ startTime?: string }>
  startTime?: string
}): string {
  if (call.parties?.[0]?.startTime) {
    return 'parties[0].startTime'
  }
  if (call.startTime) {
    return 'call.startTime'
  }
  return 'unknown'
}

function describeEndTimeSource(call: {
  parties?: Array<{ endTime?: string }>
  endTime?: string
}): string | null {
  if (call.parties?.[0]?.endTime) {
    return 'parties[0].endTime'
  }
  if (call.endTime) {
    return 'call.endTime'
  }
  return null
}

const ONE_HOUR_IN_SECONDS = 3600

function computeEndedCallDurationSeconds(startTime: Date, endTime: Date): number {
  return Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000))
}

function computeOngoingCallDurationSeconds(
  startTime: Date,
  debugInfo: DurationDebugInfo
): { durationSeconds: number; calculatedDuration: number } {
  const now = Date.now()
  const calculatedDuration = Math.max(0, Math.floor((now - startTime.getTime()) / 1000))
  const durationSeconds = Math.min(calculatedDuration, ONE_HOUR_IN_SECONDS)
  debugInfo.durationType = 'ongoing'
  debugInfo.calculatedDurationSeconds = calculatedDuration
  debugInfo.calculatedDurationHours = (calculatedDuration / 3600).toFixed(2)
  debugInfo.cappedDurationSeconds = durationSeconds

  if (calculatedDuration > ONE_HOUR_IN_SECONDS) {
    console.warn('[calculateLongestCallDuration] ⚠️ Call duration exceeds 1 hour limit:', {
      ...debugInfo,
      issue: 'Call appears to be ongoing for more than 1 hour. Possible causes:',
      possibleCauses: [
        '1. Stale startTime from old call that was not properly cleaned up',
        '2. Missing endTime when call should have ended',
        '3. Call not being removed from callStateMap when it ended',
        '4. Timezone/date parsing issue causing incorrect startTime',
      ],
    })
  }

  return { durationSeconds, calculatedDuration }
}

type WallboardCallForDuration = Record<string, unknown> & {
  parties?: CallParty[]
  callId?: string
  isTerminating?: boolean
  hasActiveParticipants?: boolean
  startTime?: string
  endTime?: string
}

function mapCallToDuration(
  call: WallboardCallForDuration
): WallboardCallForDuration & { durationSeconds: number; _debug: DurationDebugInfo } {
  const debugInfo = buildDurationDebugSnapshot(call)

  const endTime = resolveEndTime(call)
  const startTime = parseCallAnswerStartTimeUtc(call)

  if (!startTime) {
    debugInfo.error = 'No startTime found'
    console.warn('[calculateLongestCallDuration] No startTime for call:', debugInfo)
    return { ...call, durationSeconds: 0, _debug: debugInfo }
  }

  debugInfo.startTime = startTime.toISOString()
  debugInfo.endTime = endTime ? endTime.toISOString() : null
  debugInfo.startTimeSource = describeStartTimeSource(call)
  debugInfo.endTimeSource = describeEndTimeSource(call)

  let durationSeconds: number
  if (endTime) {
    durationSeconds = computeEndedCallDurationSeconds(startTime, endTime)
    debugInfo.durationType = 'ended'
    debugInfo.durationSeconds = durationSeconds
    debugInfo.durationHours = (durationSeconds / 3600).toFixed(2)
  } else {
    const ongoing = computeOngoingCallDurationSeconds(startTime, debugInfo)
    durationSeconds = ongoing.durationSeconds
  }

  return { ...call, durationSeconds, _debug: debugInfo }
}

function formatDurationHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Calculate longest call duration
 * Note: Calls are limited to 1 hour. After 1 hour, calls automatically end and need to be re-called.
 * This function caps ongoing calls at 1 hour and uses endTime if available.
 */
export const calculateLongestCallDuration = (callStateMap: Record<string, unknown>): string => {
  const allCalls = Object.values(callStateMap ?? {}).filter((c) =>
    callHasActiveParticipantForDuration(c as { parties?: CallParty[]; isTerminating?: boolean })
  ) as WallboardCallForDuration[]

  if (allCalls.length === 0) return '--:--'

  const callsWithDuration = allCalls.map((c) => mapCallToDuration(c)).filter((c) => c.durationSeconds > 0)

  if (callsWithDuration.length === 0) return '--:--'

  const first = callsWithDuration[0]
  const longest = callsWithDuration.reduce(
    (max, c) => (c.durationSeconds > max.durationSeconds ? c : max),
    first
  )

  if (longest.durationSeconds === 0) return '--:--'

  if (longest.durationSeconds > ONE_HOUR_IN_SECONDS) {
    console.warn('[calculateLongestCallDuration] 🚨 Longest call exceeds 1 hour:', {
      callId: longest.callId,
      durationSeconds: longest.durationSeconds,
      durationHours: (longest.durationSeconds / 3600).toFixed(2),
      debug: longest._debug,
    })
  }

  return formatDurationHms(longest.durationSeconds)
}
