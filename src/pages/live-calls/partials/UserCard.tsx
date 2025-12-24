import React, { useMemo } from 'react'
import { Button } from 'react-bootstrap'
import UserDummyImage from '@assets/images/user-dummy.jpg'
import { getStorageImageUrl } from '@utils/imageUtils'
import { CtiDevice, ActiveMonitoring, ShowPopup } from '@components/live-calls/utils/types'
import CallTimer from './CallTimer'
import { 
  getCardLevelStatus, 
  getColor, 
  getText, 
  getDeviceIconClass, 
  getDeviceTypeLabel,
  getSectionColor,
  getSectionTitle
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
  const cls = getCardLevelStatus(deviceList)
  const callColor = active && call ? getColor(
    call.currentState || '',
    call.isConference || false,
    call.isOneToOne || false,
    call.role || '',
    call.parties || [],
    dn,
    cls
  ) : 'black'

  const cardClasses = `card-wrapper position-relative ${animatingCards.has(dn) ? 'animating' : ''}`

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

  return (
    <div className="col-6 col-sm-4 col-md-3 col-lg-2 m-0 mb-3">
      <div className={cardClasses}>
        <div 
          className={`card text-white ${cls} shadow-sm position-relative mb-0 new-card-design ${
            cardAnimations[dn] ? `card-${cardAnimations[dn]}` : ''
          }`}
          data-dn={String(dn)}
          data-teams={teamNames && teamNames.length > 0 ? JSON.stringify(teamNames) : ''}
          data-team-names={teamNames && teamNames.length > 0 ? teamNames.join(',') : ''}
          style={{
            borderColor: getSectionColor(sectionKey),
            boxShadow: `${getSectionColor(sectionKey)}40`,
            height: '100%',
            minHeight: '140px'
          }}
        >
          {/* Hover Overlay */}
          {!(sectionKey === 'supervision' || (activeMonitoring.dn === dn && activeMonitoring.type)) && (
            <div className="card-hover-overlay">
              <p>
                <strong>EXT:</strong> <span>{dn}</span>
              </p>
              <>
                <p>
                  <strong>From:</strong> <span>{call?.parties[0]?.callingAddress || 'N/A'}</span>
                </p>
                <p>
                  <strong>To:</strong> <span>{call?.parties[0]?.calledAddress || 'N/A'}</span>
                </p>
              </>
            </div>
          )}

          {/* Information Section */}
          <div className="card-info-section">
            <div className="user-avatar">
              <img 
                src={userImageUrl} 
                alt="User" 
                onError={(e) => {
                  e.currentTarget.src = UserDummyImage.src
                }}
              />
            </div>
            <div className="user-info">
              <h6 className="extension-number" title={dn}>{dn}</h6>
              <p className="user-name">User name</p>
              <p className="status-text">
                <span 
                  className="status-indicator" 
                  style={{ 
                    display: 'inline-block',
                    width: '10px', 
                    height: '10px',
                    borderRadius: '50%',
                    marginRight: '5px',
                    backgroundColor: getSectionColor(sectionKey) 
                  }}
                />
                {getSectionTitle(sectionKey)}
              </p>
            </div>
          </div>

          {/* Timer Section */}
          {active && call && (
            <div className="card-timer-section" style={{ color: callColor }}>
              <p className="mb-0">
                {getText(
                  call.currentState || '',
                  call.isConference || false,
                  call.isOneToOne || false,
                  call.parties || [],
                  dn
                )}
              </p>
              <CallTimer 
                dn={dn}
                isActive={active && call ? true : false} 
              />
            </div>
          )}

          {/* Stop Monitoring Button */}
          {activeMonitoring.dn === dn && activeMonitoring.type && (
            <div className="card-monitoring-section" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>
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

          {/* Device Icons Section */}
          <div className="current-devices-section">
            <div className="device-icons">
              {deviceList
                .filter((device: CtiDevice) => device.terminalState === 'REGISTERED' || device.terminalState === 'UNREGISTERED')
                .map((device: CtiDevice) => {
                  const { deviceName, deviceType, terminalState } = device
                  const iconClass = getDeviceIconClass(deviceType)
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

                  return (
                    <div 
                      key={deviceName}
                      className={`device-icon-wrapper position-relative ${isDeviceActiveCall ? 'active' : ''} ${
                        activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName === deviceName ? 'monitoring' : ''
                      }`}
                      title={getDeviceTypeLabel(deviceType)}
                      onClick={() => handleDeviceClick(deviceName, deviceType, terminalState)}
                    >
                      <i
                        className={iconClass}
                        style={{
                          fontSize: '1rem',
                          color: dotColor
                        }}
                      >
                        {deviceType === 'SOFT'
                          ? 'headset_mic'
                          : deviceType === 'HARD'
                            ? 'phone'
                            : deviceType === 'ANDROID'
                              ? 'android'
                              : deviceType === 'IOS'
                                ? 'phone_iphone'
                                : 'device_unknown'
                        }
                      </i>
                      <span
                        className="device-status-dot"
                        style={{ backgroundColor: dotColor }}
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCard

