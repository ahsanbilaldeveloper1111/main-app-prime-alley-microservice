import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import { FiX } from 'react-icons/fi'
import { ShowPopup, ActiveMonitoring } from './_types'
import { isDnInActiveCall } from './_helpers'

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

const MonitoringModal: React.FC<MonitoringModalProps> = ({
  show,
  showPopup,
  activeMonitoring,
  selectedMonitor,
  tempMonitorSelection,
  selectedTone,
  session,
  dnsMap,
  onHide,
  onReset,
  onStartMonitoring,
  onMonitorSelect,
  onBargeInSelect,
  onStopMonitoring,
  isDnInActiveCallFn
}) => {
  const isCurrentlyMonitoring = showPopup && 
    activeMonitoring.dn === showPopup.dn && 
    activeMonitoring.type && 
    activeMonitoring.deviceName === showPopup.deviceName

  const hasMonitoringPermissions = session?.user?.permissions?.some((permission: string) => 
    ['silent-monitoring-cti', 'whisper-monitoring-cti', 'barge-in-cti'].includes(permission)
  )

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="sm"
      centered
      backdrop="static"
    >
      <Modal.Header className="d-flex align-items-center justify-content-between">
        <Modal.Title>
          <div className="text-center">
            <span className="small">Agent - {showPopup?.dn} - Monitoring</span>
          </div>
        </Modal.Title>
        <FiX size={20} onClick={onHide} style={{ cursor: 'pointer' }} />
      </Modal.Header>
      <Modal.Body>
        {isCurrentlyMonitoring ? (
          <div className="text-center">
            <p className="mb-3">
              Currently monitoring with
            </p>
            <span className="status-badge primary mb-3 d-block">
              <strong>{activeMonitoring.type}</strong>
            </span>
            <div>
              <Button
                variant="danger"
                onClick={() => showPopup && activeMonitoring.type && onStopMonitoring(showPopup.dn, activeMonitoring.type)}
                className="w-100"
              >
                Stop Monitoring
              </Button>
            </div>
          </div>
        ) : showPopup ? (
          <>
            {!hasMonitoringPermissions ? (
              <div className="text-center text-muted">
                <i className="material-icons-two-tone mb-2" style={{ fontSize: '2rem' }}>lock</i>
                <p>You do not have permission to monitor calls.</p>
                <small>Contact your administrator to request monitoring permissions.</small>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-left">Monitor Type Selection</h6>
                  <div className="row g-2">
                    {session?.user?.permissions?.includes('silent-monitoring-cti') && (
                      <div className="col-6">
                        <Button
                          variant={selectedMonitor[showPopup.dn] === 'SILENT' ? 'danger' : 'primary'}
                          disabled={
                            (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'SILENT') ||
                            !isDnInActiveCallFn(showPopup.dn)
                          }
                          onClick={() =>
                            onMonitorSelect(showPopup.dn, 'SILENT')
                          }
                          className="w-100 text-center d-inline-block app-button"
                          size="sm"
                        >
                          Silent
                        </Button>
                      </div>
                    )}
                    {session?.user?.permissions?.includes('whisper-monitoring-cti') && (
                      <div className="col-6">
                        <Button
                          variant={selectedMonitor[showPopup.dn] === 'WHISPER' ? 'danger' : 'primary'}
                          disabled={
                            (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'WHISPER') ||
                            !isDnInActiveCallFn(showPopup.dn)
                          }
                          onClick={() =>
                            onMonitorSelect(showPopup.dn, 'WHISPER')
                          }
                          className="w-100 text-center d-inline-block app-button"
                          size="sm"
                        >
                          Whisper
                        </Button>
                      </div>
                    )}
                    {session?.user?.permissions?.includes('barge-in-cti') && (
                      <div className="col-12">
                        <Button
                          variant={selectedMonitor[showPopup.dn] === 'BARGE_IN' ? 'danger' : 'primary'}
                          disabled={!isDnInActiveCallFn(showPopup.dn)}
                          onClick={() => onBargeInSelect(showPopup.dn)}
                          className="w-100 text-center d-inline-block app-button"
                          size="sm"
                        >
                          Barge In
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {tempMonitorSelection[showPopup.dn] && (
                  <div className="">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <span className="small text-muted d-block me-2 mb-1">
                        Monitor type selected
                      </span>
                      <span className="small status-badge primary d-block">
                        <strong>{tempMonitorSelection[showPopup.dn]}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="default" 
          className="app-button btn-sm"
          disabled={!showPopup?.dn || !tempMonitorSelection[showPopup.dn]}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button 
          variant="primary" 
          className="app-button btn-sm" 
          onClick={() => {
            if (showPopup?.dn && tempMonitorSelection[showPopup.dn]) {
              const toneToUse = selectedTone[showPopup.dn] || 'NONE'
              onStartMonitoring(
                showPopup.dn, 
                tempMonitorSelection[showPopup.dn] as 'SILENT' | 'WHISPER' | 'BARGE_IN', 
                toneToUse
              )
            }
          }}
          disabled={
            !showPopup?.dn || 
            !tempMonitorSelection[showPopup.dn] ||
            !session?.user?.permissions?.includes(
              tempMonitorSelection[showPopup.dn] === 'SILENT' ? 'silent-monitoring-cti' :
              tempMonitorSelection[showPopup.dn] === 'WHISPER' ? 'whisper-monitoring-cti' :
              tempMonitorSelection[showPopup.dn] === 'BARGE_IN' ? 'barge-in-cti' : ''
            )
          }
        >
          Start Monitoring
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MonitoringModal

