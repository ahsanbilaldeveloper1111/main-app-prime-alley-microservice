import React, { useMemo } from 'react'
import { Button, Card, Col } from 'react-bootstrap'
import { Eye, Phone, CheckCircle, AlertCircle, Volume2, Mic, Users, Headset } from 'lucide-react'
import UserDummyImage from '@assets/images/user-dummy.jpg'
import { getStorageImageUrl } from '@utils/imageUtils'
import { CtiDevice, ActiveMonitoring, ShowPopup } from '@components/live-calls/utils/types'
import CallTimer from './CallTimer'
import { 
  getDeviceTypeLabel
} from '@components/live-calls/utils/helpers'

interface UserCardProps {
  dn: string
  devices: CtiDevice[]
  call: any
  active: boolean
  sectionKey: string
  animatingCards: Set<string>
  cardAnimations: { [dn: string]: 'adding' | null }
  activeMonitoring: ActiveMonitoring
  showPopup: ShowPopup | null
  session: any
  getUserDataExtensions: () => any
  getCallStateForDevice: (dn: string, deviceName: string) => any
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setShowPopup: React.Dispatch<React.SetStateAction<ShowPopup | null>>
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>
  stopMonitoring: (dn: string, type: string) => Promise<boolean>
  selectedTone: Record<string, string>
  isDnInActiveCall: (dn: string) => boolean
}

const UserCard: React.FC<UserCardProps> = ({
  dn,
  devices: deviceList,
  call,
  active,
  sectionKey,
  animatingCards,
  cardAnimations,
  activeMonitoring,
  showPopup,
  session,
  getUserDataExtensions,
  getCallStateForDevice,
  setSelectedMonitor,
  setTempMonitorSelection,
  setSelectedTone,
  setShowPopup,
  setNotification,
  stopMonitoring,
  selectedTone,
  isDnInActiveCall
}) => {

  // Get user extension data (image and team names)
  const extensionData = useMemo(() => {
    try {
      if (!getUserDataExtensions) {
        return null
      }
      
      const userDataExtensions = getUserDataExtensions() || {}
      
      // userDataExtensions structure: { [dn]: { team_name: [], image_path: string } }
      // The data is directly on userDataExtensions, not nested under 'extensions'
      const dnString = String(dn)
      const dnNumber = Number(dn)
      
      // Try different DN formats to match the key
      const data = userDataExtensions[dn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      
      return data
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting extension data:`, error)
      return null
    }
  }, [dn, getUserDataExtensions])

  // Get user image URL
  const userImageUrl = useMemo(() => {
    if (!extensionData) {
      return UserDummyImage.src
    }
    
    const imagePath = extensionData?.image_path
    if (imagePath) {
      const url = getStorageImageUrl(imagePath)
      return url || UserDummyImage.src
    }
    return UserDummyImage.src
  }, [extensionData])

  // Get team names for filtering
  const teamNames = useMemo(() => {
    return extensionData?.team_name || []
  }, [extensionData])

  const handleDeviceClick = (deviceName: string, deviceType: string, terminalState: string) => {
    const hasMonitoringPermissions = session?.user?.permissions?.some((permission: string) => 
      ['silent-monitoring-cti', 'whisper-monitoring-cti', 'barge-in-cti'].includes(permission)
    )
    
    const deviceCall = getCallStateForDevice(dn, deviceName)
    const isDeviceActiveCall =
      deviceCall &&
      ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(deviceCall.currentState || '')

    const isCurrentlyMonitored = activeMonitoring.dn === dn && 
                                  activeMonitoring.deviceName === deviceName && 
                                  activeMonitoring.type
    
    if (isDeviceActiveCall || isCurrentlyMonitored) {
      if (hasMonitoringPermissions) {
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
        setShowPopup({ dn: dn, deviceName })
      } else {
        console.log('User does not have monitoring permissions')
        setNotification({ type: 'warning', message: 'You do not have permission to monitor calls' })
      }
    } else if (terminalState === 'STALE') {
      console.log('Device is STALE, popup disabled')
    } else {
      console.log('Device not in active call and not currently monitored, popup disabled')
    }
  }

  // Map sectionKey to status
  const getStatus = (): string => {
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

  // Get call status
  const getCallStatus = (): string | undefined => {
    if (!call || !active) return undefined
    const currentState = call.currentState || ''
    if (['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(currentState)) {
      return 'CONNECTED'
    }
    if (['RINGING', 'DIALING'].includes(currentState)) {
      return 'OUTGOING'
    }
    return currentState
  }

  // Get primary device
  const primaryDevice = useMemo(() => {
    const registeredDevices = deviceList.filter((d: CtiDevice) => d.terminalState === 'REGISTERED')
    if (registeredDevices.length > 0) {
      return registeredDevices[0]
    }
    return deviceList[0] || null
  }, [deviceList])

  // Get device type and status
  const deviceType = primaryDevice ? (primaryDevice.deviceType === 'SOFT' ? 'soft' : 'phone') : 'soft'
  const deviceStatus = primaryDevice?.terminalState === 'REGISTERED' ? 'active' : 'offline'

  // Get supervision type
  const supervisionType = activeMonitoring.dn === dn && activeMonitoring.type 
    ? (activeMonitoring.type === 'silent-monitor' ? 'silent-monitor' : 
       activeMonitoring.type === 'whisper' ? 'whisper' : 'barge-in')
    : undefined

  // Get user name
  const userName = extensionData?.name || extensionData?.user_name || dn

  // Get call details
  const callFrom = call?.parties?.[0]?.callingAddress || 'N/A'
  const callTo = call?.parties?.[0]?.calledAddress || 'N/A'

  // Determine card border style
  const getCardStyle = () => {
    const status = getStatus()
    if (status === 'Live Coaching') {
      return { borderLeft: '4px solid #f59e0b' }
    } else if (status === 'Live Calls') {
      return { borderLeft: '4px solid #22c55e' }
    } else if (status === 'Available & Idle') {
      // For active/idle, we'd need agentStatus which isn't directly available
      // We'll use device status as proxy
      return { borderLeft: deviceStatus === 'active' ? '4px solid #22c55e' : '4px solid #f59e0b' }
    } else if (status === 'Offline') {
      return { borderLeft: '4px solid #ef4444' }
    } else {
      return { borderLeft: '4px solid #94a3b8' }
    }
  }

  const cardStyle = getCardStyle()
  const status = getStatus()
  const callStatus = getCallStatus()
  const showCallControls = active && call && sectionKey !== 'downOffline'

  return (
    <Col 
      xs={12} 
      sm={6} 
      md={4} 
      lg={3} 
      xl={2} 
      className="mb-0"
      data-dn={String(dn)}
      data-teams={teamNames && teamNames.length > 0 ? JSON.stringify(teamNames) : ''}
      data-team-names={teamNames && teamNames.length > 0 ? teamNames.join(',') : ''}
    >
      <Card 
        className={`shadow-sm border-0  ${cardAnimations[dn] ? `card-${cardAnimations[dn]}` : ''}`}
        style={{ 
          borderRadius: '8px',
          ...cardStyle,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <Card.Body className="p-2 d-flex flex-column">
          {/* User Avatar and Status */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
              <div 
                className="position-relative me-2" 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  minWidth: '36px'
                }}
              >
                <img 
                  src={userImageUrl} 
                  alt={userName}
                  className="rounded-circle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    border: '2px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = UserDummyImage.src
                  }}
                />
                {/* Green dot indicator for Live Calls agents (Active/Connected) */}
                {status === 'Live Calls' && (
                  <span 
                    className="position-absolute rounded-circle" 
                    style={{ 
                      width: '10px', 
                      height: '10px',
                      backgroundColor: '#22c55e',
                      top: '-2px',
                      right: '-2px',
                      border: '2px solid white',
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                )}
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.7rem', color: '#1f2937' }}>
                  {userName}
                </h6>
              </div>
            </div>
            
            {/* Supervision Badge - For Live Coaching agents */}
            {status === 'Live Coaching' && supervisionType && (
              <div 
                className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                style={{ 
                  fontSize: '0.6rem', 
                  fontWeight: '600',
                  backgroundColor: supervisionType === 'silent-monitor' ? '#dbeafe' : 
                                   supervisionType === 'whisper' ? '#e9d5ff' : '#fed7aa',
                  color: supervisionType === 'silent-monitor' ? '#1e40af' : 
                         supervisionType === 'whisper' ? '#6b21a8' : '#9a3412',
                  border: `1px solid ${supervisionType === 'silent-monitor' ? '#bfdbfe' : 
                          supervisionType === 'whisper' ? '#d8b4fe' : '#fdba74'}`,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px',
                  textTransform: 'uppercase'
                }}
              >
                {supervisionType === 'silent-monitor' ? <Eye size={10} /> : 
                 supervisionType === 'whisper' ? <Mic size={9} /> : <Volume2 size={9} />}
                <span>{supervisionType === 'silent-monitor' ? 'Monitor' : 
                       supervisionType === 'whisper' ? 'Whisper' : 'Barge'}</span>
              </div>
            )}

            {/* Agent Status Badge - For Available & Idle agents */}
            {/* Green = Active, Amber = Idle */}
            {status === 'Available & Idle' && deviceStatus && (
              <div 
                className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                style={{ 
                  fontSize: '0.6rem', 
                  fontWeight: '600',
                  backgroundColor: deviceStatus === 'active' ? '#dcfce7' : '#fef3c7',
                  color: deviceStatus === 'active' ? '#166534' : '#92400e',
                  border: `1px solid ${deviceStatus === 'active' ? '#bbf7d0' : '#fde68a'}`,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px'
                }}
              >
                {deviceStatus === 'active' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                <span style={{ textTransform: 'capitalize' }}>{deviceStatus}</span>
              </div>
            )}

            {/* Call Status Badge - For Live Calls agents */}
            {/* Green = CONNECTED (Active), Amber = OUTGOING (Ringing) */}
            {showCallControls && callStatus && status !== 'Live Coaching' && (
              <div 
                className="d-flex flex-column align-items-end gap-1"
                style={{ marginLeft: '8px' }}
              >
                <div 
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600',
                    backgroundColor: callStatus === 'CONNECTED' ? '#dcfce7' : '#fef3c7',
                    color: callStatus === 'CONNECTED' ? '#166534' : '#92400e',
                    border: `1px solid ${callStatus === 'CONNECTED' ? '#bbf7d0' : '#fde68a'}`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {callStatus === 'CONNECTED' ? <CheckCircle size={10} /> : <Phone size={10} />}
                  <span>{callStatus}</span>
                </div>
                {active && call && (
                  <div 
                    className="px-2 py-1 rounded" 
                    style={{ 
                      fontSize: '0.05rem', 
                      fontWeight: '600',

                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#1e40af',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <CallTimer 
                      dn={dn}
                      isActive={active && call ? true : false} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Details */}
          <div 
            className="rounded p-2 mb-2" 
            style={{ 
              fontSize: '0.65rem',
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            {status === 'Live Coaching' && activeMonitoring.dn === dn && activeMonitoring.type ? (
              <>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Supervisor:</span>
                  <span className="fw-semibold text-dark">{dn}</span>
                </div>
                {activeMonitoring.deviceName && (
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Device:</span>
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.6rem' }}>{activeMonitoring.deviceName}</span>
                  </div>
                )}
                {active && call && (
                  <div className="d-flex justify-content-between mb-0">
                    <span className="text-muted">Duration:</span>
                    <span className="fw-semibold text-dark">
                      <CallTimer 
                        dn={dn}
                        isActive={active && call ? true : false} 
                      />
                    </span>
                  </div>
                )}
              </>
            ) : (status === 'Available & Idle' || status === 'Offline') ? (
              <>
                <div className="d-flex justify-content-between mb-0">
                  <span className="text-muted">EXT:</span>
                  <span className="fw-semibold text-dark">{dn}</span>
                </div>
              </>
            ) : (
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
            )}
          </div>

          {/* Stop Monitoring Button */}
          {activeMonitoring.dn === dn && activeMonitoring.type && (
            <div className="mb-2">
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (activeMonitoring.type) {
                    stopMonitoring(dn, activeMonitoring.type)
                  }
                }}
                className="w-100"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <i className="material-icons-two-tone me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                  stop
                </i>
                Stop Monitoring
              </Button>
            </div>
          )}

          {/* Bottom Section - Device & Controls */}
          {/* Green = Active, Red = Offline */}
          <div className="d-flex justify-content-between align-items-center mt-auto">
            <div className="d-flex gap-1">
              {deviceList
                .filter((device: CtiDevice) => device.terminalState === 'REGISTERED' || device.terminalState === 'UNREGISTERED')
                .map((device: CtiDevice) => {
                  const { deviceName, deviceType: devType, terminalState } = device
                  const dotColor =
                    terminalState === 'REGISTERED'
                      ? '#10b981'
                      : terminalState === 'UNREGISTERED'
                        ? '#ef4444'
                        : terminalState === 'STALE'
                          ? '#f59e0b'
                          : '#6b7280'

                  const deviceCall = getCallStateForDevice(dn, deviceName)
                  const isDeviceActiveCall =
                    deviceCall &&
                    ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(deviceCall.currentState || '')

                  const isCurrentlyMonitored = activeMonitoring.dn === dn && 
                                                activeMonitoring.type && 
                                                activeMonitoring.deviceName === deviceName

                  return (
                    <div 
                      key={deviceName}
                      className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                      style={{ 
                        width: '28px', 
                        height: '28px',
                        backgroundColor: terminalState === 'REGISTERED' ? '#dcfce7' : '#fee2e2',
                        color: terminalState === 'REGISTERED' ? '#166534' : '#991b1b',
                        border: `2px solid ${terminalState === 'REGISTERED' ? '#bbf7d0' : '#fecaca'}`,
                        cursor: (isDeviceActiveCall || isCurrentlyMonitored) ? 'pointer' : 'default',
                        opacity: isDeviceActiveCall ? 1 : 0.7
                      }}
                      // title={`${getDeviceTypeLabel(devType)} - ${deviceName}${isCurrentlyMonitored ? ' (Monitoring)' : ''}`}
                      title={`${getDeviceTypeLabel(devType)}`}
                      onClick={() => handleDeviceClick(deviceName, devType, terminalState)}
                    >
                      {devType === 'SOFT' ? (
                        <Headset size={12} />
                      ) : devType === 'HARD' ? (
                        <Phone size={12} />
                      ) : (
                        <Phone size={12} />
                      )}
                      {isCurrentlyMonitored && (
                        <span 
                          className="position-absolute rounded-circle" 
                          style={{ 
                            width: '8px', 
                            height: '8px',
                            backgroundColor: '#ef4444',
                            top: '-2px',
                            right: '-2px',
                            border: '2px solid white'
                          }}
                        />
                      )}
                    </div>
                  )
                })}
            </div>

            {showCallControls && (
              <div className="d-flex gap-1">
                <Button 
                  variant="light" 
                  size="sm" 
                  className="p-0 border" 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderColor: '#bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Silent Monitor"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (primaryDevice) {
                      handleDeviceClick(primaryDevice.deviceName, primaryDevice.deviceType, primaryDevice.terminalState)
                    }
                  }}
                >
                  <Volume2 size={8} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  className="p-0 border" 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px',
                    backgroundColor: '#e9d5ff',
                    color: '#6b21a8',
                    borderColor: '#d8b4fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Whisper"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (primaryDevice) {
                      handleDeviceClick(primaryDevice.deviceName, primaryDevice.deviceType, primaryDevice.terminalState)
                    }
                  }}
                >
                  <Mic size={8} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  className="p-0 border" 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px',
                    backgroundColor: '#fed7aa',
                    color: '#9a3412',
                    borderColor: '#fdba74',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Barge In"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (primaryDevice) {
                      handleDeviceClick(primaryDevice.deviceName, primaryDevice.deviceType, primaryDevice.terminalState)
                    }
                  }}
                >
                  <Users size={8} />
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  )
}

export default UserCard

