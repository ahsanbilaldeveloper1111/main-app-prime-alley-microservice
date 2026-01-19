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
  // This includes RINGING calls - they should appear in Live Calls section
  const allCallsForDn = getCallStatesForDn(dn)
  let hasActiveCallForDn = false
  
  if (allCallsForDn.length > 0) {
    for (const callState of allCallsForDn) {
      if (callState.isTerminating) continue
      
      // Check if call state is RINGING (should appear in Live Calls)
      if (callState.currentState === 'RINGING') {
        hasActiveCallForDn = true
        break
      }
      
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
 * Note: Calls are limited to 1 hour. After 1 hour, calls automatically end and need to be re-called.
 * This function caps ongoing calls at 1 hour and uses endTime if available.
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
  
  const ONE_HOUR_IN_SECONDS = 3600 // 1 hour limit
  
  const callsWithDuration = allCalls.map((call: any) => {
    // DEBUG: Log call details to identify 52-hour issue
    const debugInfo: any = {
      callId: call.callId,
      isTerminating: call.isTerminating,
      hasActiveParticipants: call.hasActiveParticipants,
      partiesCount: call.parties?.length || 0,
      parties: call.parties?.map((p: any) => ({
        callStatus: p.callStatus,
        startTime: p.startTime,
        endTime: p.endTime
      })) || []
    }
    let startTime: Date | null = null
    let endTime: Date | null = null
    
    // FIRST: Check for endTime (call has ended) - this is the priority
    // Priority 1: Check endTime in parties first
    if (call.parties && call.parties.length > 0) {
      const firstParty = call.parties[0]
      if (firstParty.endTime) {
        try {
          const parsedMoment = moment.utc(firstParty.endTime)
          if (parsedMoment.isValid()) {
            endTime = parsedMoment.toDate()
          }
        } catch (e) {
          endTime = new Date(firstParty.endTime)
        }
      }
    }
    
    // Priority 2: Check call.endTime if not found in parties
    if (!endTime && call.endTime) {
      try {
        const parsedMoment = moment.utc(call.endTime)
        if (parsedMoment.isValid()) {
          endTime = parsedMoment.toDate()
        }
      } catch (e) {
        endTime = new Date(call.endTime)
      }
    }
    
    // SECOND: Get startTime (needed for both ended and ongoing calls)
    // Priority 1: Use startTime from the first party (most accurate)
    if (call.parties && call.parties.length > 0 && call.parties[0].startTime) {
      try {
        const parsedMoment = moment.utc(call.parties[0].startTime)
        if (parsedMoment.isValid()) {
          startTime = parsedMoment.toDate()
        }
      } catch (e) {
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
    
    // Priority 3: Use eventTime as last resort for startTime
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
      debugInfo.error = 'No startTime found'
      console.warn('[calculateLongestCallDuration] No startTime for call:', debugInfo)
      return { ...call, durationSeconds: 0 }
    }
    
    // DEBUG: Add timing info
    debugInfo.startTime = startTime.toISOString()
    debugInfo.endTime = endTime ? endTime.toISOString() : null
    debugInfo.startTimeSource = call.parties?.[0]?.startTime ? 'parties[0].startTime' : 
                                 call.startTime ? 'call.startTime' : 
                                 call.eventTime ? 'call.eventTime' : 'unknown'
    debugInfo.endTimeSource = call.parties?.[0]?.endTime ? 'parties[0].endTime' : 
                              call.endTime ? 'call.endTime' : null
    
    // Calculate duration
    let durationSeconds: number
    if (endTime) {
      // Call has ended - use actual endTime (no cap needed, endTime is the actual end)
      const startTimeMs = startTime.getTime()
      const endTimeMs = endTime.getTime()
      durationSeconds = Math.max(0, Math.floor((endTimeMs - startTimeMs) / 1000))
      debugInfo.durationType = 'ended'
      debugInfo.durationSeconds = durationSeconds
      debugInfo.durationHours = (durationSeconds / 3600).toFixed(2)
    } else {
      // Ongoing call - calculate from startTime to now, but cap at 1 hour
      const now = Date.now()
      const startTimeMs = startTime.getTime()
      const calculatedDuration = Math.max(0, Math.floor((now - startTimeMs) / 1000))
      // Cap at 1 hour (calls automatically end after 1 hour)
      durationSeconds = Math.min(calculatedDuration, ONE_HOUR_IN_SECONDS)
      debugInfo.durationType = 'ongoing'
      debugInfo.calculatedDurationSeconds = calculatedDuration
      debugInfo.calculatedDurationHours = (calculatedDuration / 3600).toFixed(2)
      debugInfo.cappedDurationSeconds = durationSeconds
      
      // WARNING: If calculated duration is > 1 hour, this indicates a problem
      if (calculatedDuration > ONE_HOUR_IN_SECONDS) {
        console.warn('[calculateLongestCallDuration] ⚠️ Call duration exceeds 1 hour limit:', {
          ...debugInfo,
          issue: 'Call appears to be ongoing for more than 1 hour. Possible causes:',
          possibleCauses: [
            '1. Stale startTime from old call that was not properly cleaned up',
            '2. Missing endTime when call should have ended',
            '3. Call not being removed from callStateMap when it ended',
            '4. Timezone/date parsing issue causing incorrect startTime',
            '5. eventTime fallback used instead of actual startTime'
          ]
        })
      }
    }
    
    return { ...call, durationSeconds, _debug: debugInfo }
  }).filter((call: any) => call.durationSeconds > 0)
  
  if (callsWithDuration.length === 0) return '--:--'
  
  const longest = callsWithDuration.reduce((max: any, call: any) => {
    return call.durationSeconds > max.durationSeconds ? call : max
  }, callsWithDuration[0])
  
  if (longest.durationSeconds === 0) return '--:--'
  
  // DEBUG: Log the longest call details if it's suspiciously long
  if (longest.durationSeconds > ONE_HOUR_IN_SECONDS) {
    console.warn('[calculateLongestCallDuration] 🚨 Longest call exceeds 1 hour:', {
      callId: longest.callId,
      durationSeconds: longest.durationSeconds,
      durationHours: (longest.durationSeconds / 3600).toFixed(2),
      debug: longest._debug
    })
  }
  
  const hours = Math.floor(longest.durationSeconds / 3600)
  const minutes = Math.floor((longest.durationSeconds % 3600) / 60)
  const seconds = longest.durationSeconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

