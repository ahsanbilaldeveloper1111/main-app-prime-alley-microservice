import React from 'react'
import { Eye, Phone, CheckCircle, AlertCircle, Volume2, Mic, Users, Headset } from 'lucide-react'
import type { CtiDevice } from '@components/live-calls/utils/types'
import { getDeviceTypeLabel } from '@components/live-calls/utils/helpers'
import CallTimer from './CallTimer'
import IdleTimer from './IdleTimer'
import { hasUsableCallTimerStart } from '@hooks/useGlobalCallTimer'
import {
  getCallStatusBadgeTheme,
  getMonitoringOrbColors,
  getSupervisionBadgeTheme,
  getNormalizedMonitoringType,
  resolveStopTypeFromMonitoring,
  hasMonitoringStopPermission,
  monitoringStopActionTitle,
} from './userCardHelpers'

const ACTIVE_DEVICE_CALL_STATES = new Set(['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'])

type SupervisionBadgeProps = Readonly<{ supervisionType: string }>

export function UserCardSupervisionBadge({ supervisionType }: SupervisionBadgeProps) {
  const theme = getSupervisionBadgeTheme(supervisionType)
  let icon = <Volume2 size={9} />
  let label = 'Barge'
  if (supervisionType === 'silent-monitor') {
    icon = <Eye size={10} />
    label = 'Monitor'
  } else if (supervisionType === 'whisper') {
    icon = <Mic size={9} />
    label = 'Whisper'
  }

  return (
    <div
      className="d-flex align-items-center gap-1 px-2 py-1 rounded"
      style={{
        fontSize: '0.6rem',
        fontWeight: '600',
        backgroundColor: theme.backgroundColor,
        color: theme.color,
        border: `1px solid ${theme.borderColor}`,
        whiteSpace: 'nowrap',
        marginLeft: '8px',
        textTransform: 'uppercase',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}

type AgentStatusBadgeProps = Readonly<{ deviceStatus: string }>

export function UserCardAgentStatusBadge({ deviceStatus }: AgentStatusBadgeProps) {
  const isActive = deviceStatus === 'active'
  return (
    <div
      className="d-flex align-items-center gap-1 px-2 py-1 rounded"
      style={{
        fontSize: '0.6rem',
        fontWeight: '600',
        backgroundColor: isActive ? '#dcfce7' : '#fef3c7',
        color: isActive ? '#166534' : '#92400e',
        border: `1px solid ${isActive ? '#bbf7d0' : '#fde68a'}`,
        whiteSpace: 'nowrap',
        marginLeft: '8px',
      }}
    >
      {isActive ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
      <span style={{ textTransform: 'capitalize' }}>{deviceStatus}</span>
    </div>
  )
}

type LiveCallBadgeColumnProps = Readonly<{
  callStatus: string
  active: boolean
  call: any
  dn: string
  callStartTime: string | null | undefined
  callId: string | null
}>

export function UserCardLiveCallBadgeColumn({
  callStatus,
  active,
  call,
  dn,
  callStartTime,
  callId,
}: LiveCallBadgeColumnProps) {
  const theme = getCallStatusBadgeTheme(callStatus)
  const showTimer = active && call && hasUsableCallTimerStart(callStartTime)

  return (
    <div className="d-flex flex-column align-items-end gap-1" style={{ marginLeft: '8px' }}>
      <div
        className="d-flex align-items-center gap-1 px-2 py-1 rounded"
        style={{
          fontSize: '0.6rem',
          fontWeight: '600',
          backgroundColor: theme.backgroundColor,
          color: theme.color,
          border: `1px solid ${theme.borderColor}`,
          whiteSpace: 'nowrap',
        }}
      >
        {theme.useCheckIcon ? <CheckCircle size={10} /> : <Phone size={10} />}
        <span>{callStatus}</span>
      </div>
      {showTimer && (
        <div
          className="px-2 py-1 rounded"
          style={{
            fontSize: '0.05rem',
            fontWeight: '600',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#1e40af',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          <CallTimer
            dn={dn}
            isActive={Boolean(active && call)}
            startTime={callStartTime ?? undefined}
            callId={callId ?? undefined}
          />
        </div>
      )}
    </div>
  )
}

type DeviceOrbActiveMonitoring = Readonly<{
  dn?: string | null
  type?: string | null
  deviceName?: string | null
}>

type RegisteredDeviceOrbsProps = Readonly<{
  devices: CtiDevice[]
  dn: string
  userAddress: string | null | undefined
  activeMonitoring: DeviceOrbActiveMonitoring
  getCallStateForDevice: (dn: string, deviceName: string) => any
  onDeviceClick: (deviceName: string, deviceType: string, terminalState: string) => void
}>

function UserCardRegisteredDeviceOrbs({
  devices,
  dn,
  userAddress,
  activeMonitoring,
  getCallStateForDevice,
  onDeviceClick,
}: RegisteredDeviceOrbsProps) {
  const viewerIsMonitoredAgentOnOwnCard =
    userAddress != null &&
    activeMonitoring.dn != null &&
    String(userAddress) === String(dn) &&
    String(userAddress) === String(activeMonitoring.dn)

  return (
    <>
      {devices.map((device) => {
        const { deviceName, deviceType: devType, terminalState } = device
        const deviceCall = getCallStateForDevice(dn, deviceName)
        const callState = deviceCall?.currentState || ''
        const isDeviceActiveCall = Boolean(deviceCall) && ACTIVE_DEVICE_CALL_STATES.has(callState)

        const isCurrentlyMonitored =
          !viewerIsMonitoredAgentOnOwnCard &&
          activeMonitoring.dn === dn &&
          Boolean(activeMonitoring.type) &&
          activeMonitoring.deviceName === deviceName

        const isRegistered = terminalState === 'REGISTERED'
        const canInteract = isDeviceActiveCall || isCurrentlyMonitored

        return (
          <button
            key={deviceName}
            type="button"
            className="rounded-circle d-flex align-items-center justify-content-center position-relative border-0 p-0"
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: isRegistered ? '#dcfce7' : '#fee2e2',
              color: isRegistered ? '#166534' : '#991b1b',
              border: `2px solid ${isRegistered ? '#bbf7d0' : '#fecaca'}`,
              cursor: canInteract ? 'pointer' : 'default',
              opacity: isDeviceActiveCall ? 1 : 0.7,
            }}
            title={getDeviceTypeLabel(devType)}
            aria-label={getDeviceTypeLabel(devType)}
            onClick={() => onDeviceClick(deviceName, devType, terminalState)}
          >
            {devType === 'SOFT' ? <Headset size={12} /> : <Phone size={12} />}
            {isCurrentlyMonitored && (
              <span
                className="position-absolute rounded-circle"
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#ef4444',
                  top: '-2px',
                  right: '-2px',
                  border: '2px solid white',
                }}
              />
            )}
          </button>
        )
      })}
    </>
  )
}

function MonitoringStopOrbIcon({ normalizedType }: Readonly<{ normalizedType: string }>) {
  if (normalizedType === 'silent-monitor') {
    return <Volume2 size={12} />
  }
  if (normalizedType === 'whisper') {
    return <Mic size={12} />
  }
  return <Users size={12} />
}

type SupervisorStopOrbProps = Readonly<{
  normalizedStopType: string
  hasStopPermission: boolean
  orbColors: { backgroundColor: string; borderColor: string }
  onStop: () => void
}>

function UserCardSupervisorStopOrb({
  normalizedStopType,
  hasStopPermission,
  orbColors,
  onStop,
}: SupervisorStopOrbProps) {
  const stopTitle = hasStopPermission
    ? monitoringStopActionTitle(normalizedStopType)
    : 'No permission to stop'

  return (
    <button
      type="button"
      className="rounded-circle d-flex align-items-center justify-content-center position-relative border-0 p-0"
      style={{
        width: '28px',
        height: '28px',
        backgroundColor: orbColors.backgroundColor,
        color: '#ffffff',
        border: `2px solid ${orbColors.borderColor}`,
        cursor: hasStopPermission ? 'pointer' : 'not-allowed',
        opacity: hasStopPermission ? 1 : 0.7,
      }}
      title={stopTitle}
      aria-label={stopTitle}
      disabled={!hasStopPermission}
      onClick={
        hasStopPermission
          ? (e) => {
              e.stopPropagation()
              onStop()
            }
          : undefined
      }
      onKeyDown={
        hasStopPermission
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') {
                return
              }
              e.preventDefault()
              e.stopPropagation()
              onStop()
            }
          : undefined
      }
    >
      <MonitoringStopOrbIcon normalizedType={normalizedStopType} />
    </button>
  )
}

type DeviceOrbRowProps = Readonly<{
  deviceList: CtiDevice[]
  dn: string
  userAddress: string | null | undefined
  activeMonitoring: {
    monitor?: string
    dn?: string | null
    type?: string | null
    deviceName?: string | null
  }
  getCallStateForDevice: (dn: string, deviceName: string) => any
  onDeviceClick: (deviceName: string, deviceType: string, terminalState: string) => void
  stopMonitoring: (dn: string, type: string) => Promise<boolean>
  hasSilentMonitoringPermission: boolean
  hasWhisperMonitoringPermission: boolean
  hasBargeInPermission: boolean
}>

export function UserCardDeviceOrbRow({
  deviceList,
  dn,
  userAddress,
  activeMonitoring,
  getCallStateForDevice,
  onDeviceClick,
  stopMonitoring,
  hasSilentMonitoringPermission,
  hasWhisperMonitoringPermission,
  hasBargeInPermission,
}: DeviceOrbRowProps) {
  const visibleDevices = deviceList.filter(
    (device) =>
      device.terminalState === 'REGISTERED' || device.terminalState === 'UNREGISTERED'
  )

  const showStopOrb =
    activeMonitoring.monitor === dn &&
    Boolean(activeMonitoring.type) &&
    Boolean(userAddress) &&
    dn === userAddress

  const normalizedStopType = getNormalizedMonitoringType(activeMonitoring.type ?? null)
  const hasStopPermission = hasMonitoringStopPermission(
    normalizedStopType,
    hasSilentMonitoringPermission,
    hasWhisperMonitoringPermission,
    hasBargeInPermission
  )

  const orbColors = getMonitoringOrbColors(normalizedStopType ?? '', hasStopPermission)

  const runStopMonitoring = () => {
    if (!activeMonitoring.type || !activeMonitoring.dn || !normalizedStopType) {
      return
    }
    void stopMonitoring(
      activeMonitoring.dn,
      resolveStopTypeFromMonitoring(normalizedStopType, activeMonitoring.type)
    )
  }

  return (
    <div className="d-flex gap-1">
      <UserCardRegisteredDeviceOrbs
        devices={visibleDevices}
        dn={dn}
        userAddress={userAddress}
        activeMonitoring={activeMonitoring}
        getCallStateForDevice={getCallStateForDevice}
        onDeviceClick={onDeviceClick}
      />

      {showStopOrb && normalizedStopType && (
        <UserCardSupervisorStopOrb
          normalizedStopType={normalizedStopType}
          hasStopPermission={hasStopPermission}
          orbColors={orbColors}
          onStop={runStopMonitoring}
        />
      )}
    </div>
  )
}

type UserCardCallDetailsProps = Readonly<{
  status: string
  dn: string
  isSupervisorMonitoring: boolean
  monitoredAgentDn: string | null
  monitoredAgentName: string
  monitoringStartTime?: Record<string, Date>
  idleStartTime: string | null
  call: any
  callFrom: string
  callTo: string
}>

export function UserCardCallDetailsSection({
  status,
  dn,
  isSupervisorMonitoring,
  monitoredAgentDn,
  monitoredAgentName,
  monitoringStartTime,
  idleStartTime,
  call,
  callFrom,
  callTo,
}: UserCardCallDetailsProps) {
  if (status === 'Live Coaching' && isSupervisorMonitoring) {
    return (
      <>
        <div className="d-flex justify-content-between mb-1">
          <span className="text-muted">Supervisor:</span>
          <span className="fw-semibold text-dark">{dn}</span>
        </div>
        {monitoredAgentDn && (
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Supervising:</span>
            <span className="fw-semibold text-dark">
              {monitoredAgentName} ({monitoredAgentDn})
            </span>
          </div>
        )}
        {monitoredAgentDn && (
          <div className="d-flex justify-content-between mb-0">
            <span className="text-muted">Duration:</span>
            <span className="fw-semibold text-dark">
              <CallTimer
                dn={`${dn}_monitoring_${monitoredAgentDn}`}
                isActive={true}
                startTime={monitoringStartTime?.[monitoredAgentDn] || undefined}
                callId={undefined}
              />
            </span>
          </div>
        )}
      </>
    )
  }

  if (status === 'Available & Idle' || status === 'Offline') {
    return (
      <>
        <div className="d-flex justify-content-between mb-1">
          <span className="text-muted">EXT:</span>
          <span className="fw-semibold text-dark">{dn}</span>
        </div>
        {status === 'Available & Idle' && (
          <div className="d-flex justify-content-between align-items-center mb-0">
            <span className="text-muted" style={{ color: 'rgb(245, 158, 11)' }}>
              Idle Time:
            </span>
            <span className="fw-semibold text-dark justify-content-end">
              {idleStartTime ? (
                <IdleTimer dn={String(dn)} isActive={true} startTime={idleStartTime} />
              ) : (
                <span style={{ fontSize: '0.55rem' }}>--:--:--</span>
              )}
            </span>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-between mb-1">
        <span className="text-muted">EXT:</span>
        <span className="fw-semibold text-dark">{dn}</span>
      </div>
      {call && (
        <>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">From:</span>
            <span className="fw-semibold text-dark">{callFrom}</span>
          </div>
          <div className="d-flex justify-content-between mb-0">
            <span className="text-muted">To:</span>
            <span className="fw-semibold text-dark">{callTo}</span>
          </div>
        </>
      )}
    </>
  )
}
