import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import type { ActiveMonitoring, ShowPopup } from '@components/live-calls/utils/types'
import { isDisplayConferenceCall } from '@utils/ctiCallDisplay'

/** Pure helpers for UserCard — keeps Sonar cognitive complexity out of the main component. */

export function lookupUserDataExtensionByDn(
  userDataExtensions: Record<string, unknown>,
  dn: string | number
): unknown {
  const dnString = String(dn)
  const dnNumber = Number(dn)
  const byRaw = userDataExtensions[String(dn)]
  if (byRaw != null) {
    return byRaw
  }
  const byStr = userDataExtensions[dnString]
  if (byStr != null) {
    return byStr
  }
  const byNum = userDataExtensions[String(dnNumber)]
  return byNum ?? null
}

export type UserCardDeviceClickContext = {
  dn: string
  deviceName: string
  deviceType: string
  terminalState: string
  session: { user?: { permissions?: string[] } } | null | undefined
  getCallStateForDevice: (dn: string, deviceName: string) => { currentState?: string } | null | undefined
  activeMonitoring: ActiveMonitoring
  selectedTone: Record<string, string>
  setSelectedMonitor: Dispatch<SetStateAction<Record<string, string>>>
  setTempMonitorSelection: Dispatch<SetStateAction<Record<string, string | null>>>
  setSelectedTone: Dispatch<SetStateAction<Record<string, string>>>
  setShowPopup: Dispatch<SetStateAction<ShowPopup | null>>
}

const MONITORING_PERM_SET = new Set([
  'silent-monitoring-cti',
  'whisper-monitoring-cti',
  'barge-in-cti',
])

const DEVICE_ACTIVE_CALL_STATES = new Set(['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'])

/** Matches stable labels from computeUserCardCallStatus for connected/live calls. */
const USER_CARD_MONITORING_ELIGIBLE_STATUS = new Set([
  'ONGOING',
  'CONNECTED',
  'Conference Call',
  'On Hold',
])

function callHasEstablishedPartyForDn(
  call: {
    parties?: { callingAddress?: string; calledAddress?: string; callStatus?: string }[]
  } | null | undefined,
  dn: string
): boolean {
  if (!call?.parties?.length) {
    return false
  }
  return call.parties.some(
    (p) =>
      (p.callingAddress === dn || p.calledAddress === dn) &&
      DEVICE_ACTIVE_CALL_STATES.has(p.callStatus || '')
  )
}

/** True while call is still setting up — hide monitor controls until a leg is established. */
function isUserCardRingingPhaseForMonitoring(
  callStatus: string | undefined,
  call: any,
  dn: string
): boolean {
  const statusIndicatesEstablished =
    callStatus != null && USER_CARD_MONITORING_ELIGIBLE_STATUS.has(callStatus)
  const callLevelEstablished = DEVICE_ACTIVE_CALL_STATES.has(call?.currentState || '')
  if (statusIndicatesEstablished || callHasEstablishedPartyForDn(call, dn) || callLevelEstablished) {
    return false
  }
  return (
    callStatus === 'OUTGOING' ||
    callStatus === 'Calling' ||
    callStatus === 'Ringing' ||
    call?.currentState === 'RINGING' ||
    Boolean(
      call?.parties?.some(
        (p: { callingAddress?: string; calledAddress?: string; callStatus?: string }) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          (p.callStatus === 'RINGING' || p.callStatus === 'DIALING')
      )
    )
  )
}

export function applyUserCardDeviceClick(ctx: UserCardDeviceClickContext): void {
  const {
    dn,
    deviceName,
    terminalState,
    session,
    getCallStateForDevice,
    activeMonitoring,
    selectedTone,
    setSelectedMonitor,
    setTempMonitorSelection,
    setSelectedTone,
    setShowPopup,
  } = ctx

  const hasMonitoringPermissions = session?.user?.permissions?.some((permission: string) =>
    MONITORING_PERM_SET.has(permission)
  )

  const deviceCall = getCallStateForDevice(dn, deviceName)
  const callState = deviceCall?.currentState || ''
  const isDeviceActiveCall = Boolean(deviceCall) && DEVICE_ACTIVE_CALL_STATES.has(callState)

  const isCurrentlyMonitored =
    activeMonitoring.dn === dn &&
    activeMonitoring.deviceName === deviceName &&
    Boolean(activeMonitoring.type)

  if (isDeviceActiveCall || isCurrentlyMonitored) {
    if (!hasMonitoringPermissions) {
      console.log('User does not have monitoring permissions')
      return
    }
    if (isCurrentlyMonitored && activeMonitoring.type) {
      setSelectedMonitor((prev) => ({ ...prev, [dn]: activeMonitoring.type! }))
      setTempMonitorSelection((prev) => ({ ...prev, [dn]: activeMonitoring.type! }))
      if (!selectedTone[dn]) {
        setSelectedTone((prev) => ({ ...prev, [dn]: prev[dn] || 'NONE' }))
      }
    } else {
      setSelectedMonitor((prev) => ({ ...prev, [dn]: '' }))
      setTempMonitorSelection((prev) => ({ ...prev, [dn]: '' }))
      setSelectedTone((prev) => ({ ...prev, [dn]: 'NONE' }))
    }
    setShowPopup({ dn, deviceName })
    return
  }

  if (terminalState === 'STALE') {
    console.log('Device is STALE, popup disabled')
    return
  }
  console.log('Device not in active call and not currently monitored, popup disabled')
}

export function userCardStatusFromSectionKey(sectionKey: string): string {
  switch (sectionKey) {
    case 'supervision':
      return 'Live Coaching'
    case 'onCall':
      return 'Live Calls'
    case 'activeIdle':
      return 'Available & Idle'
    case 'downOffline':
      return 'Offline'
    default:
      return 'Unknown'
  }
}

export function getNormalizedMonitoringType(type: string | null): string | undefined {
  if (!type) {
    return undefined
  }
  const normalized = type.toLowerCase()
  if (normalized === 'silent' || normalized === 'silent-monitor' || normalized === 'silent_monitor') {
    return 'silent-monitor'
  }
  if (normalized === 'whisper') {
    return 'whisper'
  }
  if (normalized === 'barge_in' || normalized === 'barge-in' || normalized === 'bargein') {
    return 'barge-in'
  }
  return undefined
}

export type UserCardCallParty = {
  callingAddress?: string
  calledAddress?: string
  startTime?: string
  callId?: string
  callStatus?: string
}

export function getActivePartyForDn(
  call: { parties?: UserCardCallParty[] } | null | undefined,
  dn: string
): UserCardCallParty | null {
  if (!call?.parties?.length) {
    return null
  }
  const activeForDn = call.parties.find(
    (p) =>
      (p.callingAddress === dn || p.calledAddress === dn) &&
      p.callStatus !== 'DROPPED' &&
      p.callStatus !== 'DISCONNECTED'
  )
  if (activeForDn) {
    return activeForDn
  }
  const anyForDn = call.parties.find(
    (p) => p.callingAddress === dn || p.calledAddress === dn
  )
  return anyForDn ?? call.parties[0] ?? null
}

function statusFromActivePartyForDn(
  filtered: any[],
  dn: string,
  isConferenceCall: boolean
): string | undefined {
  const statusPriority: Record<string, number> = {
    CONNECTED: 6,
    ANSWERED: 6,
    RETRIEVED: 6,
    ON_HOLD: 5,
    RINGING: 3,
    DIALING: 2,
  }

  const activeParty = filtered
    .filter((p: any) => p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED')
    .sort(
      (a: any, b: any) =>
        (statusPriority[b.callStatus || ''] ?? 0) - (statusPriority[a.callStatus || ''] ?? 0)
    )[0]
  if (!activeParty) {
    return undefined
  }

  const partyStatus = activeParty.callStatus || ''
  const isCaller = activeParty.callingAddress === dn
  const isCallee = activeParty.calledAddress === dn

  if (isConferenceCall) {
    return 'Conference Call'
  }

  if (['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(partyStatus)) {
    if (isCaller) {
      return 'ONGOING'
    }
    if (isCallee) {
      return 'CONNECTED'
    }
    return 'CONNECTED'
  }

  if (partyStatus === 'RINGING') {
    if (isCaller) {
      return 'Calling'
    }
    if (isCallee) {
      return 'Ringing'
    }
    return 'Ringing'
  }

  if (partyStatus === 'DIALING') {
    return 'OUTGOING'
  }

  if (partyStatus === 'ON_HOLD') {
    return 'On Hold'
  }

  return partyStatus
}

function callLevelUserCardCallStatus(
  call: { currentState?: string; role?: string },
  isConferenceCall: boolean
): string {
  const currentState = call.currentState || ''
  const isCallerRole = call.role === 'calling'
  const isCalleeRole = call.role === 'called'

  if (isConferenceCall) {
    return 'Conference Call'
  }

  if (['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(currentState)) {
    if (isCallerRole) {
      return 'ONGOING'
    }
    if (isCalleeRole) {
      return 'CONNECTED'
    }
    return 'CONNECTED'
  }

  if (currentState === 'RINGING') {
    if (isCallerRole) {
      return 'Calling'
    }
    if (isCalleeRole) {
      return 'Ringing'
    }
    return 'Ringing'
  }

  if (currentState === 'DIALING') {
    return 'OUTGOING'
  }

  return currentState
}

export function computeUserCardCallStatus(
  call: any,
  active: boolean,
  dn: string
): string | undefined {
  if (!call || !active) {
    return undefined
  }

  const isConferenceCall = isDisplayConferenceCall(call)

  if (call.parties && call.parties.length > 0) {
    const filtered = call.parties.filter(
      (p: any) => p.callingAddress === dn || p.calledAddress === dn
    )

    if (filtered.length > 0) {
      const allDropped = filtered.every(
        (p: any) => p.callStatus === 'DROPPED' || p.callStatus === 'DISCONNECTED'
      )

      if (allDropped) {
        return undefined
      }

      const fromParty = statusFromActivePartyForDn(filtered, dn, isConferenceCall)
      if (fromParty !== undefined) {
        return fromParty
      }
    }
  }

  return callLevelUserCardCallStatus(call, isConferenceCall)
}

export type MonitoringWithSessions = ActiveMonitoring & { sessions?: { dn: string }[] }

export function computeUserCardMonitoringDerived({
  callStatus,
  call,
  dn,
  sectionKey,
  active,
  userAddress,
  activeMonitoring,
}: {
  callStatus: string | undefined
  call: any
  dn: string
  sectionKey: string
  active: boolean
  userAddress?: string | null
  activeMonitoring: MonitoringWithSessions
}) {
  const monitoringWithSessions = activeMonitoring

  const isRingingCall = isUserCardRingingPhaseForMonitoring(callStatus, call, dn)

  const showCallControls = active && call && sectionKey !== 'downOffline' && !isRingingCall

  const isThisCardInCall = Boolean(
    call?.parties?.length &&
      call.parties.some(
        (p: { callingAddress?: string; calledAddress?: string }) =>
          p.callingAddress === dn || p.calledAddress === dn
      )
  )

  const isCurrentUserInThisCall = Boolean(
    userAddress &&
      call?.parties?.some(
        (p: { callingAddress?: string; calledAddress?: string }) =>
          p.callingAddress === userAddress || p.calledAddress === userAddress
      )
  )

  const showMonitoringButtons = !isCurrentUserInThisCall && isThisCardInCall

  const supervisorIsAlreadyMonitoring = Boolean(
    userAddress &&
      activeMonitoring.monitor === userAddress &&
      (activeMonitoring.dn || (monitoringWithSessions.sessions?.length ?? 0) > 0)
  )

  let thisCardIsMonitored =
    monitoringWithSessions.sessions?.some((s) => String(s.dn) === String(dn)) ||
    (activeMonitoring.dn != null && String(activeMonitoring.dn) === String(dn))

  if (
    userAddress &&
    String(dn) === String(userAddress) &&
    activeMonitoring.dn != null &&
    String(userAddress) === String(activeMonitoring.dn)
  ) {
    thisCardIsMonitored = false
  }

  const disableStartMonitoringMustStopFirst =
    supervisorIsAlreadyMonitoring && !thisCardIsMonitored

  return {
    isRingingCall,
    showCallControls,
    isThisCardInCall,
    isCurrentUserInThisCall,
    showMonitoringButtons,
    supervisorIsAlreadyMonitoring,
    thisCardIsMonitored,
    disableStartMonitoringMustStopFirst,
  }
}

export function getUserCardBorderStyle(
  statusLabel: string,
  deviceStatus: 'active' | 'offline'
): CSSProperties {
  if (statusLabel === 'Live Coaching') {
    return { borderLeft: '4px solid #f59e0b' }
  }
  if (statusLabel === 'Live Calls') {
    return { borderLeft: '4px solid #22c55e' }
  }
  if (statusLabel === 'Available & Idle') {
    return {
      borderLeft: deviceStatus === 'active' ? '4px solid #22c55e' : '4px solid #f59e0b',
    }
  }
  if (statusLabel === 'Offline') {
    return { borderLeft: '4px solid #ef4444' }
  }
  return { borderLeft: '4px solid #94a3b8' }
}

export function resolveStopTypeFromMonitoring(
  normalizedType: string | undefined,
  apiType: string | null
): string {
  if (normalizedType === 'silent-monitor') {
    return 'SILENT'
  }
  if (normalizedType === 'whisper') {
    return 'WHISPER'
  }
  if (normalizedType === 'barge-in') {
    return 'BARGE_IN'
  }
  if (apiType) {
    const upperType = apiType.toUpperCase()
    if (upperType === 'SILENT' || upperType === 'WHISPER' || upperType === 'BARGE_IN') {
      return upperType
    }
  }
  return 'SILENT'
}

export type SupervisionBadgeTheme = {
  backgroundColor: string
  color: string
  borderColor: string
}

export function getSupervisionBadgeTheme(supervisionType: string): SupervisionBadgeTheme {
  if (supervisionType === 'silent-monitor') {
    return {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderColor: '#bfdbfe',
    }
  }
  if (supervisionType === 'whisper') {
    return {
      backgroundColor: '#e9d5ff',
      color: '#6b21a8',
      borderColor: '#d8b4fe',
    }
  }
  return {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
    borderColor: '#fdba74',
  }
}

export type CallStatusBadgeTheme = {
  backgroundColor: string
  color: string
  borderColor: string
  useCheckIcon: boolean
}

export function getCallStatusBadgeTheme(callStatus: string): CallStatusBadgeTheme {
  const connected =
    callStatus === 'CONNECTED' || callStatus === 'ONGOING'
  const conference = callStatus === 'Conference Call'

  if (connected) {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
      borderColor: '#bbf7d0',
      useCheckIcon: true,
    }
  }
  if (conference) {
    return {
      backgroundColor: '#e9d5ff',
      color: '#6b21a8',
      borderColor: '#d8b4fe',
      useCheckIcon: true,
    }
  }
  return {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderColor: '#fde68a',
    useCheckIcon: false,
  }
}

export function hasMonitoringStopPermission(
  normalizedType: string | undefined,
  hasSilent: boolean,
  hasWhisper: boolean,
  hasBarge: boolean
): boolean {
  if (normalizedType === 'silent-monitor') {
    return hasSilent
  }
  if (normalizedType === 'whisper') {
    return hasWhisper
  }
  return hasBarge
}

export function monitoringStopActionTitle(normalizedStopType: string): string {
  if (normalizedStopType === 'silent-monitor') {
    return 'Stop Silent Monitor'
  }
  if (normalizedStopType === 'whisper') {
    return 'Stop Whisper'
  }
  return 'Stop Barge In'
}

export function getMonitoringOrbColors(
  normalizedType: string,
  hasStopPermission: boolean
): { backgroundColor: string; borderColor: string } {
  if (!hasStopPermission) {
    return { backgroundColor: '#9ca3af', borderColor: '#9ca3af' }
  }
  if (normalizedType === 'silent-monitor') {
    return { backgroundColor: '#1e40af', borderColor: '#1e40af' }
  }
  if (normalizedType === 'whisper') {
    return { backgroundColor: '#6b21a8', borderColor: '#6b21a8' }
  }
  return { backgroundColor: '#9a3412', borderColor: '#9a3412' }
}
