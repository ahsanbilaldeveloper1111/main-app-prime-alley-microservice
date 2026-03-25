import React, { useMemo } from 'react'
import { Card, Col } from 'react-bootstrap'
import UserDummyImage from '@assets/images/user-dummy.jpg'
import { getStorageImageUrl } from '@utils/imageUtils'
import { CtiDevice, ActiveMonitoring, ShowPopup } from '@components/live-calls/utils/types'
import {
  userCardStatusFromSectionKey,
  getNormalizedMonitoringType,
  computeUserCardCallStatus,
  getUserCardBorderStyle,
  getActivePartyForDn,
  lookupUserDataExtensionByDn,
  applyUserCardDeviceClick,
  computeUserCardMonitoringDerived,
  type MonitoringWithSessions,
} from './userCardHelpers'
import {
  UserCardSupervisionBadge,
  UserCardAgentStatusBadge,
  UserCardLiveCallBadgeColumn,
  UserCardDeviceOrbRow,
  UserCardCallDetailsSection,
} from './UserCardParts'
import { UserCardMonitoringToolbar } from './UserCardMonitoringToolbar'
import { useUserCardExtensionData } from './useUserCardExtensionData'

type WallboardUserExtension = {
  team_name?: string[]
  image_path?: string
  name?: string
  user_name?: string
}

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
  startMonitoringLocal: (dn: string, monitorType: string, toneType: string | undefined, showPopup: ShowPopup | null) => Promise<boolean>
  selectedTone: Record<string, string>
  isDnInActiveCall: (dn: string) => boolean
  userAddress?: string | null
  monitoringStartTime?: Record<string, Date>
  idleSinceByDn?: Record<string, string>
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
  startMonitoringLocal,
  selectedTone,
  isDnInActiveCall,
  userAddress,
  monitoringStartTime,
  idleSinceByDn
}) => {

  const extensionData = useUserCardExtensionData(dn, getUserDataExtensions)
  const ext = extensionData as WallboardUserExtension | null | undefined

  // Get user image URL - ensure it always has a value
  const userImageUrl = useMemo(() => {
    if (!ext) {
      return UserDummyImage.src
    }

    const imagePath = ext.image_path
    if (imagePath) {
      try {
        const url = getStorageImageUrl(imagePath)
        return url || UserDummyImage.src
      } catch (error) {
        console.error(`[UserCard ${dn}] Error getting image URL:`, error)
        return UserDummyImage.src
      }
    }
    return UserDummyImage.src
  }, [ext, dn])

  // Get team names for filtering
  const teamNames = useMemo(() => {
    return ext?.team_name || []
  }, [ext])

  const idleStartTime = useMemo(() => {
    if (sectionKey !== 'activeIdle') return null
    return idleSinceByDn?.[String(dn)] || null
  }, [dn, idleSinceByDn, sectionKey])

  const handleDeviceClick = (deviceName: string, deviceType: string, terminalState: string) => {
    applyUserCardDeviceClick({
      dn,
      deviceName,
      deviceType,
      terminalState,
      session,
      getCallStateForDevice,
      activeMonitoring,
      selectedTone,
      setSelectedMonitor,
      setTempMonitorSelection,
      setSelectedTone,
      setShowPopup,
    })
  }

  const primaryDevice = useMemo(() => {
    const registeredDevices = deviceList.filter((d: CtiDevice) => d.terminalState === 'REGISTERED')
    if (registeredDevices.length > 0) {
      return registeredDevices[0]
    }
    return deviceList[0] || null
  }, [deviceList])

  const status = useMemo(() => userCardStatusFromSectionKey(sectionKey), [sectionKey])

  const deviceStatus: 'active' | 'offline' = useMemo(
    () => (primaryDevice?.terminalState === 'REGISTERED' ? 'active' : 'offline'),
    [primaryDevice]
  )

  const cardStyle = useMemo(() => getUserCardBorderStyle(status, deviceStatus), [status, deviceStatus])

  const callStatus = useMemo(() => computeUserCardCallStatus(call, active, dn), [call, active, dn])

  const { callFrom, callTo, callStartTime, callId } = useMemo(() => {
    const party = getActivePartyForDn(call, dn)
    return {
      callFrom: party?.callingAddress || call?.parties?.[0]?.callingAddress || 'N/A',
      callTo: party?.calledAddress || call?.parties?.[0]?.calledAddress || 'N/A',
      callStartTime: party?.startTime || call?.parties?.[0]?.startTime || call?.startTime || null,
      callId: call?.callId || party?.callId || call?.parties?.[0]?.callId || null,
    }
  }, [call, dn])

  const isSupervisorMonitoring = Boolean(activeMonitoring.monitor === dn && activeMonitoring.type)
  const supervisionType = isSupervisorMonitoring
    ? getNormalizedMonitoringType(activeMonitoring.type)
    : undefined

  const userName = useMemo(() => {
    if (ext?.name) return ext.name
    if (ext?.user_name) return ext.user_name
    return String(dn)
  }, [ext, dn])

  const monitoredAgentDn = isSupervisorMonitoring ? activeMonitoring.dn : null
  const monitoredAgentData = useMemo(() => {
    if (!monitoredAgentDn || !getUserDataExtensions) {
      return null
    }
    try {
      const userDataExtensions = (getUserDataExtensions() || {}) as Record<string, unknown>
      return lookupUserDataExtensionByDn(userDataExtensions, monitoredAgentDn) as WallboardUserExtension | null
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting monitored agent data:`, error)
      return null
    }
  }, [monitoredAgentDn, getUserDataExtensions])

  const monitoredAgentName =
    monitoredAgentData?.name || monitoredAgentData?.user_name || monitoredAgentDn || 'N/A'

  const monitoringDerived = useMemo(
    () =>
      computeUserCardMonitoringDerived({
        callStatus,
        call,
        dn,
        sectionKey,
        active,
        userAddress,
        activeMonitoring: activeMonitoring as MonitoringWithSessions,
      }),
    [callStatus, call, dn, sectionKey, active, userAddress, activeMonitoring]
  )

  const { showCallControls, showMonitoringButtons, thisCardIsMonitored, disableStartMonitoringMustStopFirst } =
    monitoringDerived
  const hasSilentMonitoringPermission = !!session?.user?.permissions?.includes('silent-monitoring-cti')
  const hasWhisperMonitoringPermission = !!session?.user?.permissions?.includes('whisper-monitoring-cti')
  const hasBargeInPermission = !!session?.user?.permissions?.includes('barge-in-cti')
  const showCallStatusBadge = active && call && callStatus && status !== 'Live Coaching'

  const cardAnimClass = cardAnimations[dn] ? `card-${cardAnimations[dn]}` : ''

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
        className={`shadow-sm border-0 ${cardAnimClass}`.trim()}
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
            
            {status === 'Live Coaching' && supervisionType && (
              <UserCardSupervisionBadge supervisionType={supervisionType} />
            )}

            {status === 'Available & Idle' && deviceStatus && (
              <UserCardAgentStatusBadge deviceStatus={deviceStatus} />
            )}

            {showCallStatusBadge && callStatus && (
              <UserCardLiveCallBadgeColumn
                callStatus={callStatus}
                active={active}
                call={call}
                dn={dn}
                callStartTime={callStartTime}
                callId={callId}
              />
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
            <UserCardCallDetailsSection
              status={status}
              dn={dn}
              isSupervisorMonitoring={isSupervisorMonitoring}
              monitoredAgentDn={monitoredAgentDn}
              monitoredAgentName={monitoredAgentName}
              monitoringStartTime={monitoringStartTime}
              idleStartTime={idleStartTime}
              call={call}
              callFrom={callFrom}
              callTo={callTo}
            />
          </div>

          {/* Stop Monitoring Button - Only on supervisor's card who is monitoring (current user only) */}
          {activeMonitoring.monitor === dn && activeMonitoring.type && userAddress && dn === userAddress && (
            <div className="mb-2">
              {/* <Button
                variant="danger"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (activeMonitoring.type && activeMonitoring.dn) {
                    // Convert normalized type back to API format
                    const normalizedType = getNormalizedMonitoringType(activeMonitoring.type)
                    let stopType = 'SILENT' // default
                    if (normalizedType === 'silent-monitor') {
                      stopType = 'SILENT'
                    } else if (normalizedType === 'whisper') {
                      stopType = 'WHISPER'
                    } else if (normalizedType === 'barge-in') {
                      stopType = 'BARGE_IN'
                    } else {
                      // If already in API format, use as is
                      const upperType = activeMonitoring.type.toUpperCase()
                      if (upperType === 'SILENT' || upperType === 'WHISPER' || upperType === 'BARGE_IN') {
                        stopType = upperType
                      }
                    }
                    await stopMonitoring(activeMonitoring.dn, stopType)
                  }
                }}
                className="w-100"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <i className="material-icons-two-tone me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                  stop
                </i>
                Stop Monitoring
              </Button> */}
            </div>
          )}

          {/* Bottom Section - Device & Controls */}
          {/* Green = Active, Red = Offline */}
          <div className="d-flex justify-content-between align-items-center mt-auto">
            <UserCardDeviceOrbRow
              deviceList={deviceList}
              dn={dn}
              userAddress={userAddress}
              activeMonitoring={activeMonitoring}
              getCallStateForDevice={getCallStateForDevice}
              onDeviceClick={handleDeviceClick}
              stopMonitoring={stopMonitoring}
              hasSilentMonitoringPermission={hasSilentMonitoringPermission}
              hasWhisperMonitoringPermission={hasWhisperMonitoringPermission}
              hasBargeInPermission={hasBargeInPermission}
            />

            {showCallControls && (
              <UserCardMonitoringToolbar
                showMonitoringButtons={showMonitoringButtons}
                isMonitored={thisCardIsMonitored}
                isSupervisorMonitoringCard={activeMonitoring.monitor === dn}
                isCurrentUserCard={Boolean(userAddress && dn === userAddress)}
                disableStartMonitoringMustStopFirst={disableStartMonitoringMustStopFirst}
                hasSilentMonitoringPermission={hasSilentMonitoringPermission}
                hasWhisperMonitoringPermission={hasWhisperMonitoringPermission}
                hasBargeInPermission={hasBargeInPermission}
                primaryDevice={primaryDevice}
                dn={dn}
                startMonitoringLocal={startMonitoringLocal}
              />
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  )
}

export default UserCard

