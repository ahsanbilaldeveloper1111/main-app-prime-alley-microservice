import React, { useMemo, useEffect, useState } from 'react'
import { Button, Card, Col } from 'react-bootstrap'
import { Eye, Phone, CheckCircle, AlertCircle, Volume2, Mic, Users, Headset } from 'lucide-react'
import UserDummyImage from '@assets/images/user-dummy.jpg'
import { getStorageImageUrl } from '@utils/imageUtils'
import { CtiDevice, ActiveMonitoring, ShowPopup } from '@components/live-calls/utils/types'
import CallTimer from './CallTimer'
import IdleTimer from './IdleTimer'
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

  // State to force re-render when data becomes available
  const [dataCheckCounter, setDataCheckCounter] = useState(0)
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Get user extension data (image and team names)
  const extensionData = useMemo(() => {
    try {
      if (!getUserDataExtensions) {
        console.warn(`[UserCard ${dn}] getUserDataExtensions function not available`)
        return null
      }
      
      const userDataExtensions = getUserDataExtensions() || {}
      
      // userDataExtensions structure: { [dn]: { team_name: [], image_path: string, name: string, user_name: string } }
      // The data is directly on userDataExtensions, not nested under 'extensions'
      const dnString = String(dn)
      const dnNumber = Number(dn)
      
      // Try different DN formats to match the key
      const data = userDataExtensions[dn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      
      if (!data) {
        // Only log warning once to avoid spam
        if (dataCheckCounter === 0) {
          console.warn(`[UserCard ${dn}] No extension data found. Tried keys: ${dn}, ${dnString}, ${dnNumber}. Available keys:`, Object.keys(userDataExtensions).slice(0, 10))
        }
      }
      
      return data
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting extension data:`, error)
      return null
    }
  }, [dn, getUserDataExtensions, dataCheckCounter, forceUpdate])
  
  // Retry mechanism: Check periodically if data becomes available (for cloned tabs)
  // This is critical for cloned tabs where data arrives via cross-tab communication
  useEffect(() => {
    if (extensionData) {
      // Data is available, no need to retry
      return
    }
    
    if (!getUserDataExtensions) {
      return
    }
    
    // More aggressive retry: Check more frequently for the first few seconds
    // This helps when a tab is cloned and data arrives via cross-tab communication
    const maxRetries = 30 // Check for 30 seconds total
    let retryCount = 0
    
    // Check frequently (every 300ms) to catch data when it arrives via cross-tab communication
    // This helps when a tab is cloned and data arrives asynchronously
    const retryInterval = setInterval(() => {
      if (!getUserDataExtensions) {
        clearInterval(retryInterval)
        return
      }
      
      const userDataExtensions = getUserDataExtensions() || {}
      const dnString = String(dn)
      const dnNumber = Number(dn)
      const data = userDataExtensions[dn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      
      if (data) {
        // Data is now available, trigger re-render
        setDataCheckCounter(prev => prev + 1)
        setForceUpdate(prev => prev + 1)
        clearInterval(retryInterval)
      } else {
        retryCount++
        // Trigger periodic updates to force re-check (every 5 retries = 1.5 seconds)
        if (retryCount % 5 === 0) {
          setForceUpdate(prev => prev + 1)
        }
        if (retryCount >= maxRetries) {
          // Stop retrying after max attempts
          clearInterval(retryInterval)
        }
      }
    }, 300) // Check every 300ms
    
    return () => {
      clearInterval(retryInterval)
    }
  }, [extensionData, dn, getUserDataExtensions])
  
  // Also listen to storage events as a backup (cross-tab communication might use localStorage)
  useEffect(() => {
    if (extensionData) {
      return
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      // Check if userDataExtensions might have been updated
      if (getUserDataExtensions) {
        const userDataExtensions = getUserDataExtensions() || {}
        const dnString = String(dn)
        const dnNumber = Number(dn)
        const data = userDataExtensions[dn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
        
        if (data) {
          setDataCheckCounter(prev => prev + 1)
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [extensionData, dn, getUserDataExtensions])
  
  // Request data from master tab if not available (for cloned tabs)
  useEffect(() => {
    if (extensionData) {
      return
    }
    
    // Request userDataExtensions from master tab if not available
    // This helps when a tab is cloned and needs to request data
    // Use the correct BroadcastChannel name that matches crossTabCtiManager
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const channel = new BroadcastChannel('cti-broadcast-channel')
        const message = {
          type: 'cti_event',
          data: {
            type: 'request_user_data_extensions',
            data: null
          },
          timestamp: Date.now(),
          tabId: `tab-${Date.now()}`
        }
        channel.postMessage(message)
        // Keep channel open briefly to ensure message is sent
        setTimeout(() => {
          channel.close()
        }, 100)
      } catch (error) {
        // BroadcastChannel might not be available, ignore
        console.warn(`[UserCard ${dn}] Failed to request userDataExtensions via BroadcastChannel:`, error)
      }
    }
  }, [extensionData, dn])

  // Get user image URL - ensure it always has a value
  const userImageUrl = useMemo(() => {
    if (!extensionData) {
      return UserDummyImage.src
    }
    
    const imagePath = extensionData?.image_path
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
  }, [extensionData, dn])

  // Get team names for filtering
  const teamNames = useMemo(() => {
    return extensionData?.team_name || []
  }, [extensionData])

  const idleStartTime = useMemo(() => {
    if (sectionKey !== 'activeIdle') return null
    return idleSinceByDn?.[String(dn)] || null
  }, [dn, idleSinceByDn, sectionKey])

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
        // setNotification({ type: 'warning', message: 'You do not have permission to monitor calls' })
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

  // Get call status - check parties array to determine effective state
  const getCallStatus = (): string | undefined => {
    if (!call || !active) return undefined
    
    // Check if it's a conference call (more than 2 parties or explicitly marked as conference)
    const isConferenceCall = (call.isConference && !call.isOneToOne) || 
                            (call.parties && call.parties.length > 2)
    
    // If call has parties, check party-level status (handles cases where some parties are DROPPED but others are CONNECTED)
    if (call.parties && call.parties.length > 0) {
      // Filter parties involving this DN
      const filtered = call.parties.filter((p: any) => 
        p.callingAddress === dn || p.calledAddress === dn
      )
      
      if (filtered.length > 0) {
        // Check if all parties for this DN are dropped
        const allDropped = filtered.every((p: any) => 
          p.callStatus === 'DROPPED' || p.callStatus === 'DISCONNECTED'
        )
        
        if (allDropped) {
          return undefined // No active call for this DN
        }
        
        // Find the first active party (not DROPPED/DISCONNECTED)
        const activeParty = filtered.find((p: any) => 
          p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
        )
        
        if (activeParty) {
          const partyStatus = activeParty.callStatus || ''
          
          // Check if this DN is the calling party or called party
          const isCaller = activeParty.callingAddress === dn
          const isCallee = activeParty.calledAddress === dn
          
          // For conference calls, show "Conference Call"
          if (isConferenceCall && !allDropped) {
            return 'Conference Call'
          }
          
          // For connected calls, show "ONGOING" for calling party, "CONNECTED" for called party
          if (['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(partyStatus)) {
            if (isCaller) {
              return 'ONGOING' // Calling party shows "ONGOING"
            } else if (isCallee) {
              return 'CONNECTED' // Called party shows "CONNECTED"
            }
            return 'CONNECTED' // Fallback
          }
          
          // For RINGING state: show "Calling" for caller, "Ringing" for called party
          if (partyStatus === 'RINGING') {
            if (isCaller) {
              return 'Calling' // Calling party shows "Calling"
            } else if (isCallee) {
              return 'Ringing' // Called party shows "Ringing"
            }
            return 'Ringing' // Fallback
          }
          
          if (partyStatus === 'DIALING') {
            return 'OUTGOING'
          }
          
          if (partyStatus === 'ON_HOLD') {
            return 'On Hold'
          }
          
          return partyStatus
        }
      }
    }
    
    // Fallback to call.currentState if no parties or parties check didn't work
    const currentState = call.currentState || ''
    
    // Check role from call object if available
    const isCaller = call.role === 'calling'
    const isCallee = call.role === 'called'
    
    // For conference calls
    if (isConferenceCall) {
      return 'Conference Call'
    }
    
    if (['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(currentState)) {
      if (isCaller) {
        return 'ONGOING' // Calling party shows "ONGOING"
      } else if (isCallee) {
        return 'CONNECTED' // Called party shows "CONNECTED"
      }
      return 'CONNECTED' // Fallback
    }
    
    // For RINGING state: show "Calling" for caller, "Ringing" for called party
    if (currentState === 'RINGING') {
      if (isCaller) {
        return 'Calling' // Calling party shows "Calling"
      } else if (isCallee) {
        return 'Ringing' // Called party shows "Ringing"
      }
      return 'Ringing' // Fallback
    }
    
    if (currentState === 'DIALING') {
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

  // Get supervision type - normalize monitoring type format
  const getNormalizedMonitoringType = (type: string | null): string | undefined => {
    if (!type) return undefined
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

  // Check if this card is a supervisor doing monitoring
  const isSupervisorMonitoring = activeMonitoring.monitor === dn && activeMonitoring.type
  const supervisionType = isSupervisorMonitoring 
    ? getNormalizedMonitoringType(activeMonitoring.type)
    : undefined

  // Get user name - ensure it always has a value
  const userName = useMemo(() => {
    if (extensionData?.name) return extensionData.name
    if (extensionData?.user_name) return extensionData.user_name
    return String(dn) // Always return DN as fallback
  }, [extensionData, dn])

  // Get monitored agent's data (when supervisor is monitoring)
  const monitoredAgentDn = isSupervisorMonitoring ? activeMonitoring.dn : null
  const monitoredAgentData = useMemo(() => {
    if (!monitoredAgentDn || !getUserDataExtensions) {
      return null
    }
    try {
      const userDataExtensions = getUserDataExtensions() || {}
      const dnString = String(monitoredAgentDn)
      const dnNumber = Number(monitoredAgentDn)
      const data = userDataExtensions[monitoredAgentDn] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null
      return data
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting monitored agent data:`, error)
      return null
    }
  }, [monitoredAgentDn, getUserDataExtensions])

  const monitoredAgentName = monitoredAgentData?.name || monitoredAgentData?.user_name || monitoredAgentDn || 'N/A'

  // Get monitored agent's call information
  const monitoredAgentCall = useMemo(() => {
    if (!isSupervisorMonitoring || !activeMonitoring.deviceName || !monitoredAgentDn) {
      return null
    }
    try {
      return getCallStateForDevice(monitoredAgentDn, activeMonitoring.deviceName)
    } catch (error) {
      console.error(`[UserCard ${dn}] Error getting monitored agent call:`, error)
      return null
    }
  }, [isSupervisorMonitoring, activeMonitoring.deviceName, monitoredAgentDn, getCallStateForDevice, dn])

  const monitoredAgentHasActiveCall = monitoredAgentCall && 
    ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(monitoredAgentCall.currentState || '')

  // Get monitored agent's call startTime
  const monitoredAgentCallStartTime = monitoredAgentCall?.parties?.[0]?.startTime || 
                                      monitoredAgentCall?.eventTime || 
                                      null

  // Get call details - use active party (not DROPPED) for accurate display
  const getActiveParty = () => {
    if (!call?.parties || call.parties.length === 0) return null
    // Filter parties involving this DN and find the active one
    const filtered = call.parties.filter((p: any) => 
      (p.callingAddress === dn || p.calledAddress === dn) &&
      p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
    )
    // Return first active party, or fallback to first party if none found
    return filtered[0] || call.parties.find((p: any) => 
      p.callingAddress === dn || p.calledAddress === dn
    ) || call.parties[0]
  }
  
  const activeParty = getActiveParty()
  const callFrom = activeParty?.callingAddress || call?.parties?.[0]?.callingAddress || 'N/A'
  const callTo = activeParty?.calledAddress || call?.parties?.[0]?.calledAddress || 'N/A'
  
  // Get call startTime from active party (most accurate for ANSWERED/CONNECTED)
  // This is the actual call start time from the API, not eventTime
  // Check both parties array and direct call properties for startTime
  const callStartTime = activeParty?.startTime || 
                       call?.parties?.[0]?.startTime || 
                       call?.startTime || 
                       call?.eventTime || 
                       null
  // Get callId for unique timer key (ensures different calls on same DN have separate timers)
  const callId = call?.callId || activeParty?.callId || call?.parties?.[0]?.callId || null

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
  // Don't show monitoring buttons when call is in RINGING/OUTGOING state
  const isRingingCall = callStatus === 'OUTGOING' || 
                       callStatus === 'Calling' ||
                       callStatus === 'Ringing' ||
                       (call?.currentState === 'RINGING') ||
                       (call?.parties?.some((p: any) => 
                         (p.callingAddress === dn || p.calledAddress === dn) &&
                         (p.callStatus === 'RINGING' || p.callStatus === 'DIALING')
                       ))
  const showCallControls = active && call && sectionKey !== 'downOffline' && !isRingingCall
  // Monitoring buttons: supervisor (not in call) sees on both parties; caller sees only on the other party's card (never on own); called party sees on none
  const isThisCardInCall = !!(call?.parties?.length && call.parties.some((p: any) => p.callingAddress === dn || p.calledAddress === dn))
  const isCurrentUserInThisCall = !!(userAddress && call?.parties?.some((p: any) => p.callingAddress === userAddress || p.calledAddress === userAddress))
  const isCurrentUserCalledPartyInThisCall = !!(userAddress && call?.parties?.some((p: any) => p.calledAddress === userAddress))
  const isThisCardCurrentUser = !!(userAddress && dn === userAddress)
  const showMonitoringButtons = isCurrentUserInThisCall
    ? (!isCurrentUserCalledPartyInThisCall && isThisCardInCall && !isThisCardCurrentUser)
    : isThisCardInCall
  // When supervisor is already monitoring someone, disable Start Monitoring on all other cards until they stop
  const supervisorIsAlreadyMonitoring = !!(userAddress && activeMonitoring.monitor === userAddress && (activeMonitoring.dn || (activeMonitoring as any).sessions?.length > 0))
  const thisCardIsMonitored = (activeMonitoring as any).sessions?.some((s: { dn: string }) => s.dn === dn) || activeMonitoring.dn === dn
  const disableStartMonitoringMustStopFirst = supervisorIsAlreadyMonitoring && !thisCardIsMonitored
  // Show badge for all active calls including RINGING (separate from monitoring controls)
  const showCallStatusBadge = active && call && callStatus && status !== 'Live Coaching'

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
            {/* Green = CONNECTED (Active), Amber = Calling/Ringing */}
            {showCallStatusBadge && (
              <div 
                className="d-flex flex-column align-items-end gap-1"
                style={{ marginLeft: '8px' }}
              >
                <div 
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600',
                    backgroundColor: (callStatus === 'CONNECTED' || callStatus === 'ONGOING') ? '#dcfce7' : 
                                   callStatus === 'Conference Call' ? '#e9d5ff' : '#fef3c7',
                    color: (callStatus === 'CONNECTED' || callStatus === 'ONGOING') ? '#166534' : 
                           callStatus === 'Conference Call' ? '#6b21a8' : '#92400e',
                    border: `1px solid ${(callStatus === 'CONNECTED' || callStatus === 'ONGOING') ? '#bbf7d0' : 
                            callStatus === 'Conference Call' ? '#d8b4fe' : '#fde68a'}`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {(callStatus === 'CONNECTED' || callStatus === 'ONGOING' || callStatus === 'Conference Call') ? <CheckCircle size={10} /> : <Phone size={10} />}
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
                      startTime={callStartTime}
                      callId={callId}
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
            {status === 'Live Coaching' && isSupervisorMonitoring ? (
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
            ) : (status === 'Available & Idle' || status === 'Offline') ? (
              <>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">EXT:</span>
                  <span className="fw-semibold text-dark">{dn}</span>
                </div>
                {status === 'Available & Idle' && (
                  <div className="d-flex justify-content-between align-items-center mb-0" >
                    <span className="text-muted" style={{ color: 'rgb(245, 158, 11)' }}>Idle Time:</span>
                    <span className="fw-semibold text-dark ustify-content-end">
                      {idleStartTime ? (
                        <IdleTimer dn={String(dn)} isActive={true} startTime={idleStartTime} />
                      ) : (
                        <span style={{ fontSize: '0.55rem' }}>--:--:--</span>
                      )}
                    </span>
                  </div>
                )}
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
                {/* Show monitoring icon when active - only on supervisor's card who is monitoring (current user only) */}
                {activeMonitoring.monitor === dn && activeMonitoring.type && userAddress && dn === userAddress && (() => {
                  const normalizedType = getNormalizedMonitoringType(activeMonitoring.type)
                  if (!normalizedType) return null
                  
                  return (
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                      style={{ 
                        width: '28px', 
                        height: '28px',
                        backgroundColor: normalizedType === 'silent-monitor' ? '#1e40af' : 
                                       normalizedType === 'whisper' ? '#6b21a8' : '#9a3412',
                        color: '#ffffff',
                        border: `2px solid ${normalizedType === 'silent-monitor' ? '#1e40af' : 
                                normalizedType === 'whisper' ? '#6b21a8' : '#9a3412'}`,
                        cursor: 'pointer'
                      }}
                      title={`Stop ${normalizedType === 'silent-monitor' ? 'Silent Monitor' : 
                              normalizedType === 'whisper' ? 'Whisper' : 'Barge In'}`}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (activeMonitoring.type && activeMonitoring.dn) {
                          // Convert normalized type back to API format
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
                    >
                      {normalizedType === 'silent-monitor' ? (
                        <Volume2 size={12} />
                      ) : normalizedType === 'whisper' ? (
                        <Mic size={12} />
                      ) : (
                        <Users size={12} />
                      )}
                    </div>
                  )
                })()}
            </div>

            {showCallControls && (
              <div className="d-flex gap-1">
                {(() => {
                  if (!showMonitoringButtons) return null
                  const isMonitored = (activeMonitoring as any).sessions?.some((s: { dn: string }) => s.dn === dn) || activeMonitoring.dn === dn // This card is being monitored
                  const isSupervisorMonitoring = activeMonitoring.monitor === dn // This DN is a supervisor doing monitoring
                  const isCurrentUser = userAddress && dn === userAddress // This is current user's card
                  
                  // If this is a supervisor monitoring (but not current user): disable buttons
                  // If this is current user monitoring: hide buttons (stop button shown separately)
                  // If this card is being monitored: disable buttons
                  // Otherwise: show normal buttons
                  
                  if (isSupervisorMonitoring && !isCurrentUser) {
                    // Another supervisor is monitoring - disable all buttons
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Silent Monitor (Disabled - Another Supervisor Monitoring)"
                      >
                        <Volume2 size={8} />
                      </Button>
                    )
                  }
                  
                  if (isSupervisorMonitoring && isCurrentUser) {
                    // Current user is monitoring - hide buttons (stop button shown separately)
                    return null
                  }
                  
                  if (isMonitored) {
                    // Monitored agent's card - disable all monitoring buttons
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Silent Monitor (Disabled - Being Monitored)"
                      >
                        <Volume2 size={8} />
                      </Button>
                    )
                  }
                  
                  if (disableStartMonitoringMustStopFirst) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Stop current monitoring first"
                      >
                        <Volume2 size={8} />
                      </Button>
                    )
                  }
                  
                  return (
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
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!primaryDevice) return
                        await startMonitoringLocal(dn, 'SILENT', 'NONE', { dn, deviceName: primaryDevice.deviceName })
                      }}
                    >
                      <Volume2 size={8} />
                    </Button>
                  )
                })()}
                {(() => {
                  if (!showMonitoringButtons) return null
                  const isMonitored = (activeMonitoring as any).sessions?.some((s: { dn: string }) => s.dn === dn) || activeMonitoring.dn === dn
                  const isSupervisorMonitoring = activeMonitoring.monitor === dn
                  const isCurrentUser = userAddress && dn === userAddress
                  
                  if (isSupervisorMonitoring && !isCurrentUser) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Whisper (Disabled - Another Supervisor Monitoring)"
                      >
                        <Mic size={8} />
                      </Button>
                    )
                  }
                  
                  if (isSupervisorMonitoring && isCurrentUser) {
                    return null
                  }
                  
                  if (isMonitored) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Whisper (Disabled - Being Monitored)"
                      >
                        <Mic size={8} />
                      </Button>
                    )
                  }
                  
                  if (disableStartMonitoringMustStopFirst) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Stop current monitoring first"
                      >
                        <Mic size={8} />
                      </Button>
                    )
                  }
                  
                  return (
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
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!primaryDevice) return
                        await startMonitoringLocal(dn, 'WHISPER', 'NONE', { dn, deviceName: primaryDevice.deviceName })
                      }}
                    >
                      <Mic size={8} />
                    </Button>
                  )
                })()}
                {(() => {
                  if (!showMonitoringButtons) return null
                  const isMonitored = (activeMonitoring as any).sessions?.some((s: { dn: string }) => s.dn === dn) || activeMonitoring.dn === dn
                  const isSupervisorMonitoring = activeMonitoring.monitor === dn
                  const isCurrentUser = userAddress && dn === userAddress
                  
                  if (isSupervisorMonitoring && !isCurrentUser) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Barge In (Disabled - Another Supervisor Monitoring)"
                      >
                        <Users size={8} />
                      </Button>
                    )
                  }
                  
                  if (isSupervisorMonitoring && isCurrentUser) {
                    return null
                  }
                  
                  if (isMonitored) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Barge In (Disabled - Being Monitored)"
                      >
                        <Users size={8} />
                      </Button>
                    )
                  }
                  
                  if (disableStartMonitoringMustStopFirst) {
                    return (
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-0 border" 
                        disabled
                        style={{ 
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
                          opacity: 0.5
                        }}
                        title="Stop current monitoring first"
                      >
                        <Users size={8} />
                      </Button>
                    )
                  }
                  
                  return (
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
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!primaryDevice) return
                        await startMonitoringLocal(dn, 'BARGE_IN', 'NONE', { dn, deviceName: primaryDevice.deviceName })
                      }}
                    >
                      <Users size={8} />
                    </Button>
                  )
                })()}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  )
}

export default UserCard

