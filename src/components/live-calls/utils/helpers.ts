import { CtiDevice, ActiveMonitoring } from './types'
import { SECTION_CONFIG } from './constants'
import moment from 'moment'

/**
 * Get card level status based on device states
 */
export const getCardLevelStatus = (devices: CtiDevice[]): string => {
  if (!devices || devices.length === 0) return 'unregistered'
  if (devices.some(d => d.terminalState === 'REGISTERED')) return 'registered'
  if (devices.some(d => d.terminalState === 'STALE')) return 'stale'
  return 'unregistered'
}

/**
 * Categorize DN into sections based on monitoring, call state, and device status
 */
export const categorizeDns = (
  dn: string,
  devices: CtiDevice[],
  call: any,
  active: boolean,
  activeMonitoring: ActiveMonitoring,
  getCallStateForDevice: (dn: string, deviceName: string) => any,
  getCallStatesForDn: (dn: string) => any[],
  userAddress?: string | null
): string => {
  const cls = getCardLevelStatus(devices)
  
  // Check if this DN is a supervisor doing monitoring - show in supervision section
  // activeMonitoring.monitor = supervisor's DN who is monitoring
  // activeMonitoring.dn = agent's DN being monitored
  // Proceed if monitoring state is set (deviceName may be pending)
  if (activeMonitoring.monitor && activeMonitoring.monitor === dn && activeMonitoring.type && activeMonitoring.dn) {
    // Check if there's an active call between supervisor and agent (the monitoring call itself)
    const allCallsForSupervisor = getCallStatesForDn(dn) // Supervisor's calls
    const hasActiveMonitoringCall = allCallsForSupervisor.some((call: any) => {
      // Skip terminating calls
      if (call.isTerminating) return false
      if (!call.parties || call.parties.length === 0) return false
      
      // Check if this call involves both supervisor and the agent being monitored
      const hasMatchingParties = call.parties.some((p: any) => {
        const involvesSupervisor = p.callingAddress === dn || p.calledAddress === dn
        const involvesAgent = p.callingAddress === activeMonitoring.dn || p.calledAddress === activeMonitoring.dn
        return involvesSupervisor && involvesAgent
      })
      
      if (!hasMatchingParties) return false
      
      // Check if any party is still active (not DROPPED/DISCONNECTED)
      return call.parties.some((p: any) => {
        const involvesSupervisor = p.callingAddress === dn || p.calledAddress === dn
        const involvesAgent = p.callingAddress === activeMonitoring.dn || p.calledAddress === activeMonitoring.dn
        const isActive = p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
        return involvesSupervisor && involvesAgent && isActive
      })
    })
    
    // If monitoring call is active, show in supervision
    // We don't require the monitored call to be active because:
    // 1. The monitored call might be between the agent and a customer (108→103), which we don't track directly
    // 2. The monitoring call (107→103) being active is sufficient to show the supervisor in supervision
    if (hasActiveMonitoringCall) {
      return 'supervision'
    }
    
    // If deviceName is not set yet, still show in supervision (monitoring is starting, deviceName will be set from events)
    // This handles cases where monitoring was started but deviceName hasn't been extracted from events yet
    if (!activeMonitoring.deviceName) {
      return 'supervision'
    }
    
    // If monitoring call is not active but deviceName is set, check if monitored call is active
    if (activeMonitoring.deviceName) {
      const monitoredCall = getCallStateForDevice(activeMonitoring.dn, activeMonitoring.deviceName)
      
      // Show in supervision if monitored call is active (even if monitoring call ended)
      if (monitoredCall && !monitoredCall.isTerminating && monitoredCall.parties && monitoredCall.parties.length > 0) {
        const hasActiveParties = monitoredCall.parties.some((p: any) => 
          p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
        )
        if (hasActiveParties) {
          return 'supervision'
        }
      }
    }
    
    // Fall through to other checks if neither monitoring call nor monitored call is active
  }
  
  // Check if DN has active calls (On Call)
  const allCallsForDn = getCallStatesForDn(dn)
  let hasActiveCallForDn = false
  
  if (allCallsForDn.length > 0) {
    for (const callState of allCallsForDn) {
      if (callState.isTerminating) continue
      
      if (callState.parties && callState.parties.length > 0) {
        const dnParties = callState.parties.filter((p: any) => {
          const involvesDn = (p.callingAddress === dn || p.calledAddress === dn)
          const isActive = p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
          return involvesDn && isActive
        })
        
        if (dnParties.length > 0) {
          hasActiveCallForDn = true
          break
        }
      }
    }
  }
  
  if (hasActiveCallForDn) {
    return 'onCall'
  }
  
  // Check device status (Active/Idle vs Down/Offline)
  if (cls === 'registered') {
    return 'activeIdle'
  } else if (cls === 'unregistered' || cls === 'stale') {
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
export const getDeviceIconClass = (deviceType: string): string => {
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

/**
 * Get icon for call state
 */
export const getIcon = (
  state: string,
  conf: boolean,
  isOneToOne: boolean,
  role: string,
  parties: any[] = [],
  dn: string
): string | null => {
  const filtered = parties.filter((p: any) => p.callingAddress === dn || p.calledAddress === dn)
  if (!filtered.length) return null
  
  const allDropped = filtered.every((p: any) => p.callStatus === 'DROPPED')
  const activeParty = filtered.find((p: any) => p.callStatus !== 'DROPPED') || filtered[0]
  
  let effectiveState =
    (state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped
      ? activeParty.callStatus === 'CONNECTED'
        ? 'ANSWERED'
        : activeParty.callStatus === 'ON_HOLD'
          ? 'HELD'
          : state
      : state

  if ((effectiveState === 'DROPPED' || effectiveState === 'DISCONNECTED') && allDropped) return null
  if (conf && !isOneToOne) return 'material-icons-two-tone'

  const icons = {
    RINGING: role === 'calling' ? 'phone' : 'phone',
    ANSWERED: 'phone',
    RETRIEVED: 'phone',
    HELD: 'pause_circle'
  }
  
  return icons[effectiveState as keyof typeof icons] || null
}

/**
 * Get color for call state
 */
export const getColor = (
  state: string,
  conf: boolean,
  isOneToOne: boolean,
  role: string,
  parties: any[] = [],
  dn: string,
  terminalState: string
): string => {
  const filtered = parties.filter((p: any) => p.callingAddress === dn || p.calledAddress === dn)
  if (!filtered.length) {
    return terminalState === 'REGISTERED'
      ? '#17ba92'
      : terminalState === 'UNREGISTERED'
        ? '#c3352b'
        : terminalState === 'STALE'
          ? '#c39b22'
          : ''
  }

  const allDropped = filtered.every((p: any) => p.callStatus === 'DROPPED')
  if ((state === 'DROPPED' || state === 'DISCONNECTED' || allDropped) && allDropped) {
    switch (terminalState) {
      case 'REGISTERED':
        return '#17ba92'
      case 'UNREGISTERED':
        return '#c3352b'
      case 'STALE':
        return '#c39b22'
      default:
        return ''
    }
  }

  if (conf && !isOneToOne && !allDropped) return '#6f42c1'
  if (state === 'HELD') return '#2563eb'

  const activeParty = filtered.find((p: any) => p.callStatus !== 'DROPPED') || filtered[0]
  const effectiveState =
    (state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped
      ? activeParty.callStatus === 'CONNECTED'
        ? 'ANSWERED'
        : activeParty.callStatus === 'ON_HOLD'
          ? 'HELD'
          : state
      : state

  return {
    RINGING: role === 'calling' ? '#d97706' : '#dc2626',
    ANSWERED: '#059669',
    CONNECTED: '#059669',
    RETRIEVED: '#059669',
    HELD: '#2563eb'
  }[effectiveState as keyof typeof getColor] || '#6c757d'
}

/**
 * Get text for call state
 */
export const getText = (
  state: string,
  isConference: boolean,
  isOneToOne: boolean,
  parties: any[] = [],
  dn: string
): string => {
  const filtered = parties.filter((p: any) => p.callingAddress === dn || p.calledAddress === dn)
  if (!filtered.length) return dn
  
  const allDropped = filtered.every((p: any) => p.callStatus === 'DROPPED')
  if ((state === 'DROPPED' || state === 'DISCONNECTED' || allDropped) && allDropped) {
    return dn
  }
  
  if (isConference && !isOneToOne && !allDropped) return 'Conference'
  if (state === 'HELD') return 'On Hold'
  
  const activeParty = filtered.find((p: any) => p.callStatus !== 'DROPPED') || filtered[0]
  
  let effectiveState = state
  if ((state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped) {
    if (activeParty.callStatus === 'CONNECTED') effectiveState = 'ANSWERED'
    else if (activeParty.callStatus === 'ON_HOLD') effectiveState = 'HELD'
  }
  
  const isCaller = activeParty.callingAddress === dn
  const isCallee = activeParty.calledAddress === dn
  
  const stateMap = {
    RINGING: isCaller ? 'Calling' : isCallee ? 'Incoming' : effectiveState,
    ANSWERED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
    RETRIEVED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
    HELD: 'On Hold',
    CONNECTED: isCaller ? 'Outgoing' : isCallee ? 'Connected' : effectiveState,
    ON_HOLD: 'On Hold'
  }
  
  return stateMap[effectiveState as keyof typeof stateMap] || effectiveState
}

/**
 * Check if DN is in active call
 */
export const isDnInActiveCall = (
  dn: string,
  getDnCallState: (dn: string) => any
): boolean => {
  const call = getDnCallState(dn)
  if (!call || !call.parties) return false
  const activeParticipants = call.parties.filter(
    (p: any) =>
      (p.callingAddress === dn || p.calledAddress === dn) &&
      (p.callStatus === 'CONNECTED' || p.callStatus === 'ON_HOLD')
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

/**
 * Calculate longest call duration
 */
export const calculateLongestCallDuration = (callStateMap: Record<string, any>): string => {
  const allCalls = Object.values(callStateMap || {}).filter((call: any) => 
    !call.isTerminating && 
    call.parties && 
    call.parties.length > 0 &&
    call.parties.some((p: any) => 
      p.callStatus !== 'DROPPED' && 
      p.callStatus !== 'DISCONNECTED' &&
      ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED'].includes(p.callStatus)
    )
  )
  
  if (allCalls.length === 0) return '--:--'
  
  const callsWithDuration = allCalls.map((call: any) => {
    // Use the same logic as call timers: prioritize parties[0].startTime
    let startTime: Date | null = null
    
    // Priority 1: Use startTime from the first party (most accurate)
    if (call.parties && call.parties.length > 0 && call.parties[0].startTime) {
      try {
        // Parse as UTC (API typically sends UTC timestamps)
        const parsedMoment = moment.utc(call.parties[0].startTime)
        if (parsedMoment.isValid()) {
          startTime = parsedMoment.toDate()
        }
      } catch (e) {
        // Fallback to direct Date parsing
        startTime = new Date(call.parties[0].startTime)
      }
    }
    
    // Priority 2: Use call.startTime if available
    if (!startTime && call.startTime) {
      try {
        const parsedMoment = moment.utc(call.startTime)
        if (parsedMoment.isValid()) {
          startTime = parsedMoment.toDate()
        }
      } catch (e) {
        startTime = new Date(call.startTime)
      }
    }
    
    // Priority 3: Use eventTime as last resort
    if (!startTime && call.eventTime) {
      try {
        const parsedMoment = moment.utc(call.eventTime)
        if (parsedMoment.isValid()) {
          startTime = parsedMoment.toDate()
        }
      } catch (e) {
        startTime = new Date(call.eventTime)
      }
    }
    
    if (!startTime) {
      return { ...call, durationSeconds: 0 }
    }
    
    const now = Date.now()
    const startTimeMs = startTime.getTime()
    const durationSeconds = Math.max(0, Math.floor((now - startTimeMs) / 1000))
    return { ...call, durationSeconds }
  }).filter((call: any) => call.durationSeconds > 0)
  
  if (callsWithDuration.length === 0) return '--:--'
  
  const longest = callsWithDuration.reduce((max: any, call: any) => {
    return call.durationSeconds > max.durationSeconds ? call : max
  }, callsWithDuration[0])
  
  if (longest.durationSeconds === 0) return '--:--'
  
  const hours = Math.floor(longest.durationSeconds / 3600)
  const minutes = Math.floor((longest.durationSeconds % 3600) / 60)
  const seconds = longest.durationSeconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

