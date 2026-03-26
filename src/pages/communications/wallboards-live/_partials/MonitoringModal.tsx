import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import { FiX } from 'react-icons/fi'
import { ShowPopup, ActiveMonitoring } from '@components/live-calls/utils/types'

interface MonitoringModalProps {
  show: boolean
  showPopup: ShowPopup | null
  activeMonitoring: ActiveMonitoring
  selectedMonitor: Record<string, string>
  tempMonitorSelection: Record<string, string | null>
  selectedTone: Record<string, string>
  session: any
  dnsMap: Record<string, any>
  onHide: () => void
  onReset: () => void
  onStartMonitoring: (dn: string, monitorType: string, toneType: string) => void
  onMonitorSelect: (dn: string, monitorType: string) => void
  onBargeInSelect: (dn: string) => void
  onStopMonitoring: (dn: string, type: string) => Promise<boolean>
  isDnInActiveCallFn: (dn: string) => boolean
}

const MONITORING_PERMISSION_ANY = [
  'silent-monitoring-cti',
  'whisper-monitoring-cti',
  'barge-in-cti'
] as const

type MonitorMode = 'SILENT' | 'WHISPER' | 'BARGE_IN'

const MONITOR_TYPE_ROWS: ReadonlyArray<{
  mode: MonitorMode
  permission: string
  label: string
  colClass: string
  respectOtherTempSelection: boolean
}> = [
  {
    mode: 'SILENT',
    permission: 'silent-monitoring-cti',
    label: 'Silent',
    colClass: 'col-6',
    respectOtherTempSelection: true
  },
  {
    mode: 'WHISPER',
    permission: 'whisper-monitoring-cti',
    label: 'Whisper',
    colClass: 'col-6',
    respectOtherTempSelection: true
  },
  {
    mode: 'BARGE_IN',
    permission: 'barge-in-cti',
    label: 'Barge In',
    colClass: 'col-12',
    respectOtherTempSelection: false
  }
]

function userHasAnyMonitoringPermission(permissions: string[] | undefined): boolean {
  if (!permissions?.length) {
    return false
  }
  return MONITORING_PERMISSION_ANY.some((id) => permissions.includes(id))
}

function isMonitoringActiveForPopup(
  showPopup: ShowPopup | null,
  activeMonitoring: ActiveMonitoring
): boolean {
  if (!showPopup) {
    return false
  }
  return (
    activeMonitoring.dn === showPopup.dn &&
    Boolean(activeMonitoring.type) &&
    activeMonitoring.deviceName === showPopup.deviceName
  )
}

function permissionForMonitorMode(selection: string | null | undefined): string {
  if (selection === 'SILENT') return 'silent-monitoring-cti'
  if (selection === 'WHISPER') return 'whisper-monitoring-cti'
  if (selection === 'BARGE_IN') return 'barge-in-cti'
  return ''
}

function userMayStartWithSelection(
  permissions: string[] | undefined,
  selection: string | null | undefined
): boolean {
  const required = permissionForMonitorMode(selection)
  if (!required) {
    return false
  }
  return Boolean(permissions?.includes(required))
}

function monitorButtonDisabled(
  dn: string,
  mode: MonitorMode,
  tempSelection: string | null | undefined,
  respectOtherTempSelection: boolean,
  isDnInActiveCall: boolean
): boolean {
  if (!isDnInActiveCall) {
    return true
  }
  if (!respectOtherTempSelection) {
    return false
  }
  return Boolean(tempSelection && tempSelection !== mode)
}

interface MonitoringModalActiveViewProps {
  showPopup: ShowPopup
  activeMonitoring: ActiveMonitoring
  onStopMonitoring: (dn: string, type: string) => Promise<boolean>
}

function MonitoringModalActiveView({
  showPopup,
  activeMonitoring,
  onStopMonitoring
}: Readonly<MonitoringModalActiveViewProps>) {
  const handleStop = () => {
    const monitorType = activeMonitoring.type
    if (!monitorType) {
      return
    }
    void onStopMonitoring(showPopup.dn, monitorType)
  }

  return (
    <div className="text-center">
      <p className="mb-3">Currently monitoring with</p>
      <span className="status-badge primary mb-3 d-block">
        <strong>{activeMonitoring.type}</strong>
      </span>
      <div>
        <Button variant="danger" onClick={handleStop} className="w-100">
          Stop Monitoring
        </Button>
      </div>
    </div>
  )
}

interface MonitoringModalSelectionProps {
  showPopup: ShowPopup
  session: any
  selectedMonitor: Record<string, string>
  tempMonitorSelection: Record<string, string | null>
  isDnInActiveCallFn: (dn: string) => boolean
  onMonitorSelect: (dn: string, monitorType: string) => void
  onBargeInSelect: (dn: string) => void
}

function MonitoringModalSelection({
  showPopup,
  session,
  selectedMonitor,
  tempMonitorSelection,
  isDnInActiveCallFn,
  onMonitorSelect,
  onBargeInSelect
}: Readonly<MonitoringModalSelectionProps>) {
  const dn = showPopup.dn
  const permissions: string[] | undefined = session?.user?.permissions
  const tempForDn = tempMonitorSelection[dn]
  const inCall = isDnInActiveCallFn(dn)

  return (
    <>
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-left">Monitor Type Selection</h6>
        <div className="row g-2">
          {MONITOR_TYPE_ROWS.map((row) => {
            if (!permissions?.includes(row.permission)) {
              return null
            }
            const disabled = monitorButtonDisabled(
              dn,
              row.mode,
              tempForDn,
              row.respectOtherTempSelection,
              inCall
            )
            const variant = selectedMonitor[dn] === row.mode ? 'danger' : 'primary'
            const handleClick =
              row.mode === 'BARGE_IN'
                ? () => onBargeInSelect(dn)
                : () => onMonitorSelect(dn, row.mode)

            return (
              <div key={row.mode} className={row.colClass}>
                <Button
                  variant={variant}
                  disabled={disabled}
                  onClick={handleClick}
                  className="w-100 text-center d-inline-block app-button"
                  size="sm"
                >
                  {row.label}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {tempForDn ? (
        <div className="">
          <div className="d-flex flex-column align-items-center justify-content-center">
            <span className="small text-muted d-block me-2 mb-1">Monitor type selected</span>
            <span className="small status-badge primary d-block">
              <strong>{tempForDn}</strong>
            </span>
          </div>
        </div>
      ) : null}
    </>
  )
}

interface MonitoringModalBodyProps {
  isCurrentlyMonitoring: boolean
  showPopup: ShowPopup | null
  hasMonitoringPermissions: boolean
  activeMonitoring: ActiveMonitoring
  session: any
  selectedMonitor: Record<string, string>
  tempMonitorSelection: Record<string, string | null>
  isDnInActiveCallFn: (dn: string) => boolean
  onMonitorSelect: (dn: string, monitorType: string) => void
  onBargeInSelect: (dn: string) => void
  onStopMonitoring: (dn: string, type: string) => Promise<boolean>
}

function MonitoringModalBody({
  isCurrentlyMonitoring,
  showPopup,
  hasMonitoringPermissions,
  activeMonitoring,
  session,
  selectedMonitor,
  tempMonitorSelection,
  isDnInActiveCallFn,
  onMonitorSelect,
  onBargeInSelect,
  onStopMonitoring
}: Readonly<MonitoringModalBodyProps>) {
  if (isCurrentlyMonitoring && showPopup) {
    return (
      <MonitoringModalActiveView
        showPopup={showPopup}
        activeMonitoring={activeMonitoring}
        onStopMonitoring={onStopMonitoring}
      />
    )
  }

  if (!showPopup) {
    return null
  }

  if (!hasMonitoringPermissions) {
    return (
      <div className="text-center text-muted">
        <i className="material-icons-two-tone mb-2" style={{ fontSize: '2rem' }}>
          lock
        </i>
        <p>You do not have permission to monitor calls.</p>
        <small>Contact your administrator to request monitoring permissions.</small>
      </div>
    )
  }

  return (
    <MonitoringModalSelection
      showPopup={showPopup}
      session={session}
      selectedMonitor={selectedMonitor}
      tempMonitorSelection={tempMonitorSelection}
      isDnInActiveCallFn={isDnInActiveCallFn}
      onMonitorSelect={onMonitorSelect}
      onBargeInSelect={onBargeInSelect}
    />
  )
}

interface MonitoringModalFooterProps {
  showPopup: ShowPopup | null
  tempMonitorSelection: Record<string, string | null>
  selectedTone: Record<string, string>
  session: any
  onReset: () => void
  onStartMonitoring: (dn: string, monitorType: string, toneType: string) => void
}

function MonitoringModalFooter({
  showPopup,
  tempMonitorSelection,
  selectedTone,
  session,
  onReset,
  onStartMonitoring
}: Readonly<MonitoringModalFooterProps>) {
  const dn = showPopup?.dn
  const selection = dn ? tempMonitorSelection[dn] : undefined
  const canUseSelection = Boolean(dn && selection)
  const permissions: string[] | undefined = session?.user?.permissions
  const startAllowed = canUseSelection && userMayStartWithSelection(permissions, selection)

  const handleStart = () => {
    if (!dn || !selection) {
      return
    }
    const toneToUse = selectedTone[dn] || 'NONE'
    onStartMonitoring(dn, selection as MonitorMode, toneToUse)
  }

  return (
    <>
      <Button
        variant="default"
        className="app-button btn-sm"
        disabled={!canUseSelection}
        onClick={onReset}
      >
        Reset
      </Button>
      <Button
        variant="primary"
        className="app-button btn-sm"
        onClick={handleStart}
        disabled={!startAllowed}
      >
        Start Monitoring
      </Button>
    </>
  )
}

const MonitoringModal: React.FC<Readonly<MonitoringModalProps>> = ({
  show,
  showPopup,
  activeMonitoring,
  selectedMonitor,
  tempMonitorSelection,
  selectedTone,
  session,
  dnsMap: _dnsMap,
  onHide,
  onReset,
  onStartMonitoring,
  onMonitorSelect,
  onBargeInSelect,
  onStopMonitoring,
  isDnInActiveCallFn
}) => {
  const isCurrentlyMonitoring = isMonitoringActiveForPopup(showPopup, activeMonitoring)
  const hasMonitoringPermissions = userHasAnyMonitoringPermission(session?.user?.permissions)

  return (
    <Modal show={show} onHide={onHide} size="sm" centered backdrop="static">
      <Modal.Header className="d-flex align-items-center justify-content-between">
        <Modal.Title>
          <div className="text-center">
            <span className="small">Agent - {showPopup?.dn} - Monitoring</span>
          </div>
        </Modal.Title>
        <FiX size={20} onClick={onHide} style={{ cursor: 'pointer' }} />
      </Modal.Header>
      <Modal.Body>
        <MonitoringModalBody
          isCurrentlyMonitoring={isCurrentlyMonitoring}
          showPopup={showPopup}
          hasMonitoringPermissions={hasMonitoringPermissions}
          activeMonitoring={activeMonitoring}
          session={session}
          selectedMonitor={selectedMonitor}
          tempMonitorSelection={tempMonitorSelection}
          isDnInActiveCallFn={isDnInActiveCallFn}
          onMonitorSelect={onMonitorSelect}
          onBargeInSelect={onBargeInSelect}
          onStopMonitoring={onStopMonitoring}
        />
      </Modal.Body>
      <Modal.Footer>
        <MonitoringModalFooter
          showPopup={showPopup}
          tempMonitorSelection={tempMonitorSelection}
          selectedTone={selectedTone}
          session={session}
          onReset={onReset}
          onStartMonitoring={onStartMonitoring}
        />
      </Modal.Footer>
    </Modal>
  )
}

export default MonitoringModal
