import React from 'react'
import { Button } from 'react-bootstrap'
import { Volume2, Mic, Users } from 'lucide-react'
import type { CtiDevice, ShowPopup } from '@components/live-calls/utils/types'

export type MonitoringToolbarProps = Readonly<{
  showMonitoringButtons: boolean
  isMonitored: boolean
  isSupervisorMonitoringCard: boolean
  isCurrentUserCard: boolean
  disableStartMonitoringMustStopFirst: boolean
  hasSilentMonitoringPermission: boolean
  hasWhisperMonitoringPermission: boolean
  hasBargeInPermission: boolean
  primaryDevice: CtiDevice | null
  dn: string
  startMonitoringLocal: (
    dn: string,
    monitorType: string,
    toneType: string | undefined,
    showPopup: ShowPopup | null
  ) => Promise<boolean>
}>

type Channel = 'silent' | 'whisper' | 'barge'

function permissionForChannel(
  channel: Channel,
  silent: boolean,
  whisper: boolean,
  barge: boolean
): boolean {
  if (channel === 'silent') {
    return silent
  }
  if (channel === 'whisper') {
    return whisper
  }
  return barge
}

const CHANNEL: Record<
  Channel,
  {
    mode: string
    Icon: typeof Volume2
    enabledStyle: React.CSSProperties
    titleActive: string
    titleNoPermission: string
    titleOtherSupervisor: string
    titleBeingMonitored: string
    titleStopFirst: string
  }
> = {
  silent: {
    mode: 'SILENT',
    Icon: Volume2,
    enabledStyle: {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderColor: '#bfdbfe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    titleActive: 'Silent Monitor',
    titleNoPermission: 'No permission for Silent Monitor',
    titleOtherSupervisor: 'Silent Monitor (Disabled - Another Supervisor Monitoring)',
    titleBeingMonitored: 'Silent Monitor (Disabled - Being Monitored)',
    titleStopFirst: 'Stop current monitoring first',
  },
  whisper: {
    mode: 'WHISPER',
    Icon: Mic,
    enabledStyle: {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      backgroundColor: '#e9d5ff',
      color: '#6b21a8',
      borderColor: '#d8b4fe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    titleActive: 'Whisper',
    titleNoPermission: 'No permission for Whisper',
    titleOtherSupervisor: 'Whisper (Disabled - Another Supervisor Monitoring)',
    titleBeingMonitored: 'Whisper (Disabled - Being Monitored)',
    titleStopFirst: 'Stop current monitoring first',
  },
  barge: {
    mode: 'BARGE_IN',
    Icon: Users,
    enabledStyle: {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      backgroundColor: '#fed7aa',
      color: '#9a3412',
      borderColor: '#fdba74',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    titleActive: 'Barge In',
    titleNoPermission: 'No permission for Barge In',
    titleOtherSupervisor: 'Barge In (Disabled - Another Supervisor Monitoring)',
    titleBeingMonitored: 'Barge In (Disabled - Being Monitored)',
    titleStopFirst: 'Stop current monitoring first',
  },
}

const disabledStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  borderColor: '#e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'not-allowed',
  opacity: 0.5,
}

type ChannelButtonProps = Readonly<
  {
    channel: Channel
  } & Omit<MonitoringToolbarProps, 'showMonitoringButtons'>
>

function MonitoringChannelButton({
  channel,
  isMonitored,
  isSupervisorMonitoringCard,
  isCurrentUserCard,
  disableStartMonitoringMustStopFirst,
  hasSilentMonitoringPermission,
  hasWhisperMonitoringPermission,
  hasBargeInPermission,
  primaryDevice,
  dn,
  startMonitoringLocal,
}: ChannelButtonProps) {
  const cfg = CHANNEL[channel]
  const hasPerm = permissionForChannel(
    channel,
    hasSilentMonitoringPermission,
    hasWhisperMonitoringPermission,
    hasBargeInPermission
  )

  if (!hasPerm) {
    return (
      <Button variant="light" size="sm" className="p-0 border" disabled style={disabledStyle} title={cfg.titleNoPermission}>
        <cfg.Icon size={8} />
      </Button>
    )
  }

  if (isSupervisorMonitoringCard && !isCurrentUserCard) {
    return (
      <Button variant="light" size="sm" className="p-0 border" disabled style={disabledStyle} title={cfg.titleOtherSupervisor}>
        <cfg.Icon size={8} />
      </Button>
    )
  }

  if (isSupervisorMonitoringCard && isCurrentUserCard) {
    return null
  }

  if (isMonitored) {
    return (
      <Button variant="light" size="sm" className="p-0 border" disabled style={disabledStyle} title={cfg.titleBeingMonitored}>
        <cfg.Icon size={8} />
      </Button>
    )
  }

  if (disableStartMonitoringMustStopFirst) {
    return (
      <Button variant="light" size="sm" className="p-0 border" disabled style={disabledStyle} title={cfg.titleStopFirst}>
        <cfg.Icon size={8} />
      </Button>
    )
  }

  return (
    <Button
      variant="light"
      size="sm"
      className="p-0 border"
      style={cfg.enabledStyle}
      title={cfg.titleActive}
      onClick={async (e) => {
        e.stopPropagation()
        if (!primaryDevice) {
          return
        }
        await startMonitoringLocal(dn, cfg.mode, 'NONE', {
          dn,
          deviceName: primaryDevice.deviceName,
        })
      }}
    >
      <cfg.Icon size={8} />
    </Button>
  )
}

const CHANNELS: Channel[] = ['silent', 'whisper', 'barge']

export function UserCardMonitoringToolbar({
  showMonitoringButtons,
  isMonitored,
  isSupervisorMonitoringCard,
  isCurrentUserCard,
  disableStartMonitoringMustStopFirst,
  hasSilentMonitoringPermission,
  hasWhisperMonitoringPermission,
  hasBargeInPermission,
  primaryDevice,
  dn,
  startMonitoringLocal,
}: MonitoringToolbarProps) {
  if (!showMonitoringButtons) {
    return null
  }

  return (
    <div className="d-flex gap-1">
      {CHANNELS.map((channel) => (
        <MonitoringChannelButton
          key={channel}
          channel={channel}
          isMonitored={isMonitored}
          isSupervisorMonitoringCard={isSupervisorMonitoringCard}
          isCurrentUserCard={isCurrentUserCard}
          disableStartMonitoringMustStopFirst={disableStartMonitoringMustStopFirst}
          hasSilentMonitoringPermission={hasSilentMonitoringPermission}
          hasWhisperMonitoringPermission={hasWhisperMonitoringPermission}
          hasBargeInPermission={hasBargeInPermission}
          primaryDevice={primaryDevice}
          dn={dn}
          startMonitoringLocal={startMonitoringLocal}
        />
      ))}
    </div>
  )
}
