import React, { ReactElement, useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import DeviceSelectionModal from '../../../components/DeviceSelectionModal'
import PageLoader from '@components/PageLoader'
import { useSession } from 'next-auth/react'
import '@assets/scss/common.scss'
import '@assets/scss/live-calls.scss'
import { useCti } from '@hooks/useCti'
import { CtiDevice } from '@components/live-calls/utils/types'
import SummaryCards from './partials/SummaryCards'
import FilterBar from './partials/FilterBar'
import MonitoringModal from './partials/MonitoringModal'
import PageHeader from './partials/PageHeader'
import SectionsRenderer from './partials/SectionsRenderer'
import { 
  categorizeDns as categorizeDnsHelper, 
  isDnInActiveCall as isDnInActiveCallHelper,
  getLocalStorageCallStatesInfo
} from '@components/live-calls/utils/helpers'
import { CUSTOM_STYLES } from '@components/live-calls/utils/constants'
import { useMonitoring } from '@components/live-calls/utils/useMonitoring'
import { 
  handleMonitorSelect as handleMonitorSelectHelper,
  handleBargeInSelect as handleBargeInSelectHelper,
  resetMonitorSelection as resetMonitorSelectionHelper,
  handleDeviceSelect as handleDeviceSelectHelper,
  handleDeviceSelectionCancel as handleDeviceSelectionCancelHelper
} from '@components/live-calls/utils/handlers'
import { animateCardMove as animateCardMoveHelper } from '@components/live-calls/utils/animationHelpers'

// Parse server timestamp as UTC when no timezone is present (backend often sends UTC without 'Z')
function parseServerTime(isoOrDate: string | null | undefined): number {
  if (!isoOrDate || typeof isoOrDate !== 'string') return 0
  const s = isoOrDate.trim()
  if (!s) return 0
  const hasTz = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)
  const toParse = hasTz ? s : s + 'Z'
  const ms = new Date(toParse).getTime()
  return Number.isFinite(ms) ? ms : 0
}

const LiveCallDashboard = () => {
  const { data:session, status } = useSession();
  const [showPageLoader, setShowPageLoader] = useState(false)
  const {
    summaryData,
    dnsMap,
    callStateMap,
    error,
    isInitialized,
    isReconnecting,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    getCallStatesForDn,
    eventLog,
    userAddress,
    getActiveCallIdsFromLocalStorage,
    getAllCallIds,
    getUserTeams,
    getUserDataExtensions
  } = useCti()


  // Default state for filters (add these state variables if they don't exist)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Default filter functions (implement these based on your needs)
  const applyFilters = () => {
    // Implement filter logic here
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTeam('all');
    setSelectedStatus('all');
    setSortBy('none');
  };

  const [loading, setLoading] = useState(true)
  const [openMenuDn, setOpenMenuDn] = useState<string | null>(null)
  const [selectedMonitor, setSelectedMonitor] = useState<Record<string, string>>({})
  const [selectedTone, setSelectedTone] = useState<Record<string, string>>({})
  const [tempMonitorSelection, setTempMonitorSelection] = useState<Record<string, string | null>>({})
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)
  const [activeMonitoring, setActiveMonitoring] = useState<{ dn: string | null; type: string | null; monitor?: string; deviceName?: string | null; monitorDeviceType?: string; monitorDeviceName?: string }>({
    dn: null,
    type: null
  })
  const [monitoringStartTime, setMonitoringStartTime] = useState<{ [dn: string]: Date }>({})
  const [showPopup, setShowPopup] = useState<{ dn: string; deviceName: string } | null>(null)
  const [restoredCallStates, setRestoredCallStates] = useState<number>(0)
  
  // Refs
  const hasCalledGetCallLegsRef = useRef(false)
  const hasCalledOnAllLoadedRef = useRef(false)
  const getActiveCallIdsFromLocalStorageRef = useRef(getActiveCallIdsFromLocalStorage)
  const [cardAnimations, setCardAnimations] = useState<{ [dn: string]: 'adding' | null }>({})
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set())
  const cardPositionsRef = useRef<{ [dn: string]: { x: number; y: number; width: number; height: number } }>({})
  const previousSectionsRef = useRef<{ [dn: string]: string }>({})
  
  // Update ref when function changes
  useEffect(() => {
    getActiveCallIdsFromLocalStorageRef.current = getActiveCallIdsFromLocalStorage
  }, [getActiveCallIdsFromLocalStorage])
  
  // Monitoring hook
  const {
    showDeviceSelectionModal,
    setShowDeviceSelectionModal,
    availableDevices,
    setAvailableDevices,
    pendingMonitoringData,
    setPendingMonitoringData,
    startMonitoringLocal,
    stopMonitoring: stopMonitoringFromHook
  } = useMonitoring(
    userAddress,
    dnsMap,
    setShowPageLoader,
    setActiveMonitoring,
    setMonitoringStartTime,
    setNotification,
    setSelectedMonitor,
    setSelectedTone,
    setTempMonitorSelection,
    setShowPopup,
    activeMonitoring
  )
  
  // Helper function to categorize DNs into sections (wrapper for imported helper)
  const categorizeDns = (dn: string, devices: CtiDevice[], call: any, active: boolean) => {
    return categorizeDnsHelper(
      dn,
      devices,
      call,
      active,
      activeMonitoring,
      getCallStateForDevice,
      getCallStatesForDn,
      userAddress
    )
  }
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    supervision: false,
    onCall: false,
    activeIdle: false,
    downOffline: false
  })
  
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const expandAll = () => {
    setCollapsedSections({
      supervision: false,
      onCall: false,
      activeIdle: false,
      downOffline: false
    })
  }
  
  const collapseAll = () => {
    setCollapsedSections({
      supervision: true,
      onCall: true,
      activeIdle: true,
      downOffline: true
    })
  }
  
  // Initialize previous sections when data is first loaded
  useEffect(() => {
    if (isInitialized && dnsMap && Object.keys(previousSectionsRef.current).length === 0) {
      const dnsList = Object.values(dnsMap)
      const initialSections: { [dn: string]: string } = {}
      
      dnsList.forEach(({ dn, devices }: any) => {
        const deviceList = Object.values(devices || {}) as CtiDevice[]
        const call = getDnCallState(dn)
        const active = hasActiveCalls(dn)
        const section = categorizeDns(dn, deviceList, call, active)
        initialSections[dn] = section
      })
      
      previousSectionsRef.current = initialSections
    }
  }, [isInitialized, dnsMap, userAddress, getDnCallState, hasActiveCalls, categorizeDns])

  // FLIP Animation function
  const animateCardMove = useCallback((dn: string, fromSection: string, toSection: string) => {
    animateCardMoveHelper(dn, cardPositionsRef, setAnimatingCards)
  }, [setAnimatingCards])

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
       // console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
       // console.error('Error attempting to exit fullscreen:', err)
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      setIsFullscreen(isFullscreen)
      
      if (isFullscreen) {
        document.body.classList.add('fullscreen-mode')
      } else {
        document.body.classList.remove('fullscreen-mode')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.body.classList.remove('fullscreen-mode')
    }
  }, [])



  // Check for restored call states on component mount
  useEffect(() => {
    const info = getLocalStorageCallStatesInfo()
    if (info.count > 0) {
      setRestoredCallStates(info.count)
    }
  }, [setRestoredCallStates])

  // Memoize the expensive calculations to prevent unnecessary re-renders
  const categorizedDns = useMemo(() => {
    if (!isInitialized || !dnsMap) return {}
    
    const dnsList = Object.values(dnsMap)
    const result: { [dn: string]: string } = {}
    
      dnsList.forEach(({ dn, devices }: any) => {
        const deviceList = Object.values(devices || {}) as CtiDevice[]
        const call = getDnCallState(dn)
        const active = hasActiveCalls(dn)
        result[dn] = categorizeDns(dn, deviceList, call, active)
      })
    
    return result
  }, [dnsMap, isInitialized, hasActiveCalls, getDnCallState, categorizeDns, activeMonitoring, eventLog])

  // Calculate counts from categorizedDns
  const supervisionCount = useMemo(() => {
    return Object.values(categorizedDns).filter(section => section === 'supervision').length;
  }, [categorizedDns]);

  const onCallCount = useMemo(() => {
    return Object.values(categorizedDns).filter(section => section === 'onCall').length;
  }, [categorizedDns]);

  const activeIdleCount = useMemo(() => {
    return Object.values(categorizedDns).filter(section => section === 'activeIdle').length;
  }, [categorizedDns]);

  const downOfflineCount = useMemo(() => {
    return Object.values(categorizedDns).filter(section => section === 'downOffline').length;
  }, [categorizedDns]);

  // Track registered DNs with their timestamps for oldest idle calculation (when = online, lastCallEndTime = last call ended)
  const [registeredDnsStore, setRegisteredDnsStore] = useState<Record<string, { deviceName: string; when: string; lastCallEndTime?: string }>>({})

  // Idle tracking (Available & Idle only) - keyed by DN
  // - initialized only for REGISTERED extensions
  // - updated when an extension transitions into activeIdle (e.g. call ended)
  // - initialized when an extension becomes REGISTERED from UNREGISTERED
  // - cleared when extension goes offline / unregistered
  const [idleSinceByDn, setIdleSinceByDn] = useState<Record<string, string>>({})
  const prevSectionByDnRef = useRef<Record<string, string>>({})
  const prevIsRegisteredByDnRef = useRef<Record<string, boolean>>({})
  const prevDnsInCallRef = useRef<Set<string>>(new Set())

  // When a call ends (DN was in call, now is not), set their idle since to now so idle time updates immediately
  useEffect(() => {
    if (!callStateMap || typeof callStateMap !== 'object') return
    const currentDnsInCall = new Set<string>()
    Object.values(callStateMap).forEach((call: any) => {
      if (call?.isTerminating) return
      if (!call?.parties?.length) return
      call.parties.forEach((p: any) => {
        if (p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED') {
          if (p.callingAddress) currentDnsInCall.add(String(p.callingAddress))
          if (p.calledAddress) currentDnsInCall.add(String(p.calledAddress))
        }
      })
    })
    const prev = prevDnsInCallRef.current
    const justEnded = Array.from(prev).filter(dn => !currentDnsInCall.has(dn))
    prevDnsInCallRef.current = currentDnsInCall
    if (justEnded.length > 0) {
      const nowIso = new Date().toISOString()
      setIdleSinceByDn(prevState => {
        let next = prevState
        justEnded.forEach(dn => {
          if (next[dn] !== nowIso) {
            if (next === prevState) next = { ...prevState }
            next[dn] = nowIso
          }
        })
        return next
      })
    }
  }, [callStateMap])

  // Process complete_state events to track registered devices
  useEffect(() => {
    if (!eventLog || eventLog.length === 0) return

    // Process the latest complete_state event (find from end to get most recent)
    const completeStateEvents = eventLog.filter((e: any) => 
      e.type === 'initial-state' || 
      (e.data?.type === 'complete_state') ||
      (e.type === 'complete_state')
    )
    
    if (completeStateEvents.length > 0) {
      // Get the most recent complete_state event
      const completeStateEvent = completeStateEvents[completeStateEvents.length - 1]
      
      if (completeStateEvent) {
        let devices: any[] = []
        
        // Handle different event structures
        if (completeStateEvent.data) {
          if (Array.isArray(completeStateEvent.data)) {
            devices = completeStateEvent.data
          } else if (completeStateEvent.data.data && Array.isArray(completeStateEvent.data.data)) {
            devices = completeStateEvent.data.data
          } else if (typeof completeStateEvent.data === 'object') {
            // It's a dnsMap structure
            devices = Object.values(completeStateEvent.data).flatMap((dnData: any) => 
              Object.values(dnData.devices || {})
            )
          }
        }

        const registered: Record<string, { deviceName: string; when: string; lastCallEndTime?: string }> = {}
        devices.forEach((device: any) => {
          if (device.terminalState === 'REGISTERED' && device.dn && device.deviceName && device.when) {
            const key = `${device.dn}_${device.deviceName}`
            registered[key] = {
              deviceName: device.deviceName,
              when: device.when,
              ...(device.lastCallEndTime && { lastCallEndTime: device.lastCallEndTime })
            }
          }
        })
        
        if (Object.keys(registered).length > 0) {
          setRegisteredDnsStore(prev => ({ ...prev, ...registered }))
        }
      }
    }
  }, [eventLog])

  // Process dns_states events to update registered devices
  useEffect(() => {
    if (!eventLog || eventLog.length === 0) return

    // Get the most recent dns_states events (process all to handle state changes)
    const dnsStateEvents = eventLog
      .filter((e: any) => 
        e.type === 'dns_states' || 
        (e.data?.type === 'dns_states') ||
        (e.type === 'dns_states' && e.data)
      )

    // Process events in order (oldest to newest) to handle state transitions correctly
    dnsStateEvents.forEach((event: any) => {
      let device = null
      
      // Handle different event structures
      if (event.data) {
        if (event.data.data) {
          device = event.data.data
        } else if (event.data.dn) {
          device = event.data
        }
      } else if (event.dn) {
        device = event
      }
      
      if (device && device.dn && device.deviceName) {
        const key = `${device.dn}_${device.deviceName}`
        
        if (device.terminalState === 'REGISTERED' && device.when) {
          // Add or update registered device (preserve lastCallEndTime if dns_states doesn't send it)
          setRegisteredDnsStore(prev => ({
            ...prev,
            [key]: {
              deviceName: device.deviceName,
              when: device.when,
              ...(device.lastCallEndTime && { lastCallEndTime: device.lastCallEndTime }),
              ...(prev[key]?.lastCallEndTime && !device.lastCallEndTime && { lastCallEndTime: prev[key].lastCallEndTime })
            }
          }))
        } else if (device.terminalState === 'UNREGISTERED' || device.terminalState === 'STALE') {
          // Remove unregistered device
          setRegisteredDnsStore(prev => {
            const updated = { ...prev }
            delete updated[key]
            return updated
          })
        }
      }
    })
  }, [eventLog])

  // Also process dnsMap changes to sync with current state
  useEffect(() => {
    if (!dnsMap) return

    const registered: Record<string, { deviceName: string; when: string; lastCallEndTime?: string }> = {}
    Object.values(dnsMap).forEach((dnData: any) => {
      Object.values(dnData.devices || {}).forEach((device: any) => {
        if (device.terminalState === 'REGISTERED' && device.dn && device.deviceName) {
          const key = `${device.dn}_${device.deviceName}`
          const existing = registeredDnsStore[key]
          registered[key] = {
            deviceName: device.deviceName,
            when: existing?.when || device.when || new Date().toISOString(),
            ...(device.lastCallEndTime && { lastCallEndTime: device.lastCallEndTime }),
            ...(existing?.lastCallEndTime && !device.lastCallEndTime && { lastCallEndTime: existing.lastCallEndTime })
          }
        }
      })
    })

    // Remove devices that are no longer in dnsMap
    const currentKeys = new Set(Object.keys(registered))
    setRegisteredDnsStore(prev => {
      const updated: Record<string, { deviceName: string; when: string; lastCallEndTime?: string }> = {}
      Object.entries(prev).forEach(([key, value]) => {
        if (currentKeys.has(key)) {
          updated[key] = value
        }
      })
      return { ...updated, ...registered }
    })
  }, [dnsMap])

  // Calculate oldest idle DN
  const oldestIdleInfo = useMemo(() => {
    const idleDns = Object.entries(categorizedDns)
      .filter(([_, section]) => section === 'activeIdle')
      .map(([dn]) => dn)

    if (idleDns.length === 0) return null

    // Find the oldest registered device for each idle DN
    let oldest: { dn: string; deviceName: string; when: string } | null = null

    idleDns.forEach(dn => {
      // Find all registered devices for this DN
      Object.entries(registeredDnsStore).forEach(([key, value]) => {
        const [storeDn] = key.split('_')
        if (storeDn === dn) {
          if (!oldest || new Date(value.when) < new Date(oldest.when)) {
            oldest = {
              dn: storeDn,
              deviceName: value.deviceName,
              when: value.when
            }
          }
        }
      })
    })

    return oldest
  }, [categorizedDns, registeredDnsStore])

  // Maintain idle timestamps per DN (no localStorage; driven by existing CTI state updates)
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const dnsList = Object.values(dnsMap) as any[]
    const nowIso = new Date().toISOString()

    // Idle since from complete_state: when = registered/online, lastCallEndTime = last call ended.
    // Per device: idle since = max(when, lastCallEndTime). Per DN: latest across devices.
    const getIdleSinceIsoFromCompleteState = (dn: string): string | undefined => {
      const dnEntry = dnsList.find((d: any) => String(d.dn) === dn)
      const deviceList = dnEntry ? (Object.values(dnEntry.devices || {}) as any[]) : []
      let latestMs: number | undefined
      deviceList.forEach((device: any) => {
        if (device.terminalState !== 'REGISTERED') return
        const whenMs = parseServerTime(device.when)
        const lastCallEndMs = parseServerTime(device.lastCallEndTime)
        const idleSinceMs = whenMs && lastCallEndMs ? Math.max(whenMs, lastCallEndMs) : (whenMs || lastCallEndMs)
        if (!idleSinceMs) return
        if (latestMs === undefined || idleSinceMs > latestMs) latestMs = idleSinceMs
      })
      return latestMs !== undefined ? new Date(latestMs).toISOString() : undefined
    }

    // Idle since from registered store: max(when, lastCallEndTime) per device, then latest across devices
    const getLatestRegisteredWhenIso = (dn: string): string | undefined => {
      let latestMs: number | undefined
      Object.entries(registeredDnsStore).forEach(([key, value]) => {
        const [storeDn] = key.split('_')
        if (storeDn !== String(dn) || !value?.when) return
        const whenMs = parseServerTime(value.when)
        const lastCallEndMs = parseServerTime(value.lastCallEndTime)
        const idleSinceMs = whenMs && lastCallEndMs ? Math.max(whenMs, lastCallEndMs) : whenMs
        if (!idleSinceMs) return
        if (latestMs === undefined || idleSinceMs > latestMs) latestMs = idleSinceMs
      })
      return latestMs !== undefined ? new Date(latestMs).toISOString() : undefined
    }

    const currentSectionByDn = categorizedDns as Record<string, string>

    setIdleSinceByDn(prev => {
      let next = prev

      const seenDns = new Set<string>()

      dnsList.forEach(({ dn, devices }: any) => {
        const dnKey = String(dn)
        seenDns.add(dnKey)

        const deviceList = Object.values(devices || {}) as CtiDevice[]
        const isRegistered = deviceList.some(d => d.terminalState === 'REGISTERED')
        const currentSection = currentSectionByDn[dnKey]
        const prevSection = prevSectionByDnRef.current[dnKey]
        const prevIsRegistered = prevIsRegisteredByDnRef.current[dnKey] || false

        const shouldClear = !isRegistered || currentSection === 'downOffline'
        if (shouldClear) {
          if (next[dnKey] !== undefined) {
            if (next === prev) next = { ...prev }
            delete next[dnKey]
          }
          prevIsRegisteredByDnRef.current[dnKey] = isRegistered
          prevSectionByDnRef.current[dnKey] = currentSection
          return
        }

        if (currentSection === 'activeIdle') {
          const transitionedIntoIdle = !!prevSection && prevSection !== 'activeIdle'

          if (transitionedIntoIdle) {
            if (next === prev) next = { ...prev }
            next[dnKey] = nowIso
          } else {
            // Prefer idle since from complete_state (when + lastCallEndTime), then registered store, then keep previous or now
            const fromCompleteState = getIdleSinceIsoFromCompleteState(dnKey)
            const idleIso = fromCompleteState || getLatestRegisteredWhenIso(dnKey) || next[dnKey] || nowIso
            if (next === prev) next = { ...prev }
            next[dnKey] = idleIso
          }
        }

        prevIsRegisteredByDnRef.current[dnKey] = isRegistered
        prevSectionByDnRef.current[dnKey] = currentSection
      })

      // Drop stale keys for DNs no longer present
      Object.keys(next).forEach(dnKey => {
        if (!seenDns.has(dnKey)) {
          if (next === prev) next = { ...prev }
          delete next[dnKey]
        }
      })

      // Return prev if unchanged to avoid re-render loop (deps like categorizedDns can be new refs each render)
      const prevKeys = Object.keys(prev)
      if (Object.keys(next).length === prevKeys.length && prevKeys.every(k => next[k] === prev[k])) return prev
      return next
    })
  }, [categorizedDns, dnsMap, isInitialized, registeredDnsStore])

  // Helper function to clear monitoring state
  const clearMonitoringState = useCallback((monitoredDn: string, reason: string = 'call ended') => {
    console.log('[Monitoring] clearMonitoringState called', { monitoredDn, reason, currentState: activeMonitoring })
    setActiveMonitoring({ dn: null, type: null, deviceName: null, monitor: undefined })
    setMonitoringStartTime(prev => {
      const newState = { ...prev }
      delete newState[monitoredDn]
      return newState
    })
    setSelectedMonitor(prev => {
      const newState = { ...prev }
      delete newState[monitoredDn]
      return newState
    })
    setSelectedTone(prev => {
      const newState = { ...prev }
      delete newState[monitoredDn]
      return newState
    })
    setTempMonitorSelection(prev => {
      const newState = { ...prev }
      delete newState[monitoredDn]
      return newState
    })
    setNotification({
      type: 'info',
      message: `Monitoring automatically stopped for ${monitoredDn} - ${reason}`
    })
  }, [setActiveMonitoring, setMonitoringStartTime, setSelectedMonitor, setSelectedTone, setTempMonitorSelection, setNotification, activeMonitoring])

  // Listen for DROPPED/DISCONNECTED events to clear monitoring state immediately
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !eventLog || eventLog.length === 0) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const supervisorDn = activeMonitoring.monitor // Supervisor's DN (e.g., 107)

    // Check the most recent events for DROPPED/DISCONNECTED events related to monitoring
    // Only check the LAST event to avoid processing old events repeatedly
    const lastEvent = eventLog[eventLog.length - 1]
    if (!lastEvent || !lastEvent.parties || lastEvent.parties.length === 0) return

    // Case 1: Check for CallObservationEndedEvImpl event - this always means monitoring ended
    // IMPORTANT: Only clear if this is a DISCONNECTED event, not if monitoring is being established
    if (lastEvent.eventName === 'CallObservationEndedEvImpl' && lastEvent.eventType === 'DISCONNECTED' && supervisorDn) {
      const involvesSupervisorAndAgent = lastEvent.parties.some((p: any) => {
        const involvesSupervisor = p.callingAddress === supervisorDn || p.calledAddress === supervisorDn
        const involvesAgent = p.callingAddress === monitoredDn || p.calledAddress === monitoredDn
        return involvesSupervisor && involvesAgent
      })

      // Only clear if the call is actually terminating (not just starting)
      if (involvesSupervisorAndAgent && lastEvent.isTerminating === true) {
        console.log('[Monitoring] Clearing monitoring state - CallObservationEndedEvImpl detected', { 
          supervisorDn, 
          monitoredDn, 
          eventType: lastEvent.eventType, 
          eventName: lastEvent.eventName,
          callId: lastEvent.callId,
          isTerminating: lastEvent.isTerminating
        })
        clearMonitoringState(monitoredDn, 'monitoring call ended')
        return
      }
    }

    // Case 2: DROPPED/DISCONNECTED event involving the monitored DN and device (agent's call ended)
    // Only process if this is the last event and call is actually terminating
    if ((lastEvent.eventType === 'DROPPED' || lastEvent.eventType === 'DISCONNECTED') && 
        lastEvent.isTerminating === true && 
        lastEvent.hasActiveParticipants === false) {
      const involvesMonitoredDn = lastEvent.parties.some((p: any) => 
        (p.callingAddress === monitoredDn || p.calledAddress === monitoredDn) &&
        (p.callingDeviceName === monitoredDeviceName || p.calledDeviceName === monitoredDeviceName)
      )

      if (involvesMonitoredDn) {
        console.log('[Monitoring] Clearing monitoring state - agent call ended', { 
          monitoredDn, 
          eventType: lastEvent.eventType, 
          callId: lastEvent.callId,
          isTerminating: lastEvent.isTerminating
        })
        clearMonitoringState(monitoredDn, 'call dropped')
        return
      }
    }

    // Case 3: DISCONNECTED event involving both supervisor and agent (monitoring call ended)
    // This happens when the supervisor ends the monitoring call (e.g., from Jabber)
    // Only process if this is the last event and call is actually terminating
    if ((lastEvent.eventType === 'DISCONNECTED' || lastEvent.eventType === 'DROPPED') && 
        supervisorDn && 
        lastEvent.isTerminating === true && 
        lastEvent.hasActiveParticipants === false) {
      const involvesSupervisorAndAgent = lastEvent.parties.some((p: any) => {
        const involvesSupervisor = p.callingAddress === supervisorDn || p.calledAddress === supervisorDn
        const involvesAgent = p.callingAddress === monitoredDn || p.calledAddress === monitoredDn
        return involvesSupervisor && involvesAgent
      })

      if (involvesSupervisorAndAgent) {
        console.log('[Monitoring] Clearing monitoring state - monitoring call ended', { 
          supervisorDn, 
          monitoredDn, 
          eventType: lastEvent.eventType, 
          eventName: lastEvent.eventName,
          callId: lastEvent.callId,
          isTerminating: lastEvent.isTerminating,
          hasActiveParticipants: lastEvent.hasActiveParticipants
        })
        clearMonitoringState(monitoredDn, 'monitoring call ended')
        return
      }
    }
  }, [eventLog, activeMonitoring.dn, activeMonitoring.deviceName, activeMonitoring.monitor, clearMonitoringState])

  // Detect monitoring start from events and set monitoring state
  // Use a ref to track the last processed event sequence to avoid re-processing
  const lastProcessedEventSequenceRef = useRef<number | null>(null)
  
  useEffect(() => {
    if (!eventLog || eventLog.length === 0 || !dnsMap || !isInitialized || !userAddress) return

    // Only process the most recent event to avoid infinite loops
    const lastEvent = eventLog[eventLog.length - 1]
    if (!lastEvent || !lastEvent.parties || lastEvent.parties.length === 0) return
    
    // Skip if we've already processed this event
    if (lastProcessedEventSequenceRef.current !== null && 
        lastEvent.sequence !== undefined && 
        lastEvent.sequence <= lastProcessedEventSequenceRef.current) {
      return
    }

    // Case 1: Event has explicit monitoring info (isMonitoring: true) - HIGHEST PRIORITY
    if (lastEvent.isMonitoring && lastEvent.monitoring && lastEvent.parties && lastEvent.parties.length > 0) {
      const monitoring = lastEvent.monitoring as any
      const monitorDn = monitoring.monitorDn // Supervisor DN (e.g., 107)
      const monitoredDn = monitoring.monitoredDn // Agent DN (e.g., 103)
      const monitoringType = monitoring.monitoringType // e.g., "SILENT", "WHISPER", "BARGE_IN"

      // Only set if this is for the current user (supervisor)
      if (monitorDn === userAddress && monitoredDn && monitoringType) {
        // Find the monitored device name from the event parties
        // Check all parties to find the one involving the monitored DN
        // The monitored DN could be either callingAddress or calledAddress
        let monitoredDeviceName: string | null = null
        
        // First, try to find party where monitoredDn is the calledAddress (supervisor calling agent)
        let monitoredParty = lastEvent.parties.find((p: any) => 
          p.calledAddress === monitoredDn && p.callingAddress === monitorDn
        )
        if (monitoredParty) {
          monitoredDeviceName = monitoredParty.calledDeviceName || monitoredParty.callingDeviceName || null
        }
        
        // If not found, try where monitoredDn is the callingAddress (agent calling supervisor)
        if (!monitoredDeviceName) {
          monitoredParty = lastEvent.parties.find((p: any) => 
            p.callingAddress === monitoredDn && p.calledAddress === monitorDn
          )
          if (monitoredParty) {
            monitoredDeviceName = monitoredParty.callingDeviceName || monitoredParty.calledDeviceName || null
          }
        }
        
        // If still not found, try any party involving monitoredDn
        if (!monitoredDeviceName) {
          monitoredParty = lastEvent.parties.find((p: any) => 
            p.calledAddress === monitoredDn || p.callingAddress === monitoredDn
          )
          if (monitoredParty) {
            // If monitoredDn is calledAddress, use calledDeviceName; if callingAddress, use callingDeviceName
            monitoredDeviceName = monitoredDn === monitoredParty.calledAddress 
              ? monitoredParty.calledDeviceName 
              : monitoredParty.callingDeviceName || null
          }
        }
        
        // If not found in parties, try to get from dnsMap (get first registered device or first available)
        if (!monitoredDeviceName && dnsMap[monitoredDn]) {
          const devices = Object.values(dnsMap[monitoredDn].devices || {}) as any[]
          if (devices.length > 0) {
            // Prefer registered device, otherwise use first available
            monitoredDeviceName = devices.find((d: any) => d.terminalState === 'REGISTERED')?.deviceName || devices[0]?.deviceName || null
          }
        }

        // Set monitoring state - always update if monitoring info is present in event
        // This ensures monitoring is recognized immediately, even if deviceName is not found yet
        const shouldUpdate = !activeMonitoring.dn || 
                             activeMonitoring.dn !== monitoredDn || 
                             (monitoredDeviceName && activeMonitoring.deviceName !== monitoredDeviceName) ||
                             activeMonitoring.monitor !== monitorDn ||
                             activeMonitoring.type !== monitoringType

        if (shouldUpdate) {
          // Get monitor device information from the event or dnsMap
          // The supervisor's device is in the event parties (callingDeviceName when supervisor is calling)
          let monitorDeviceName: string | undefined = undefined
          let monitorDeviceType: string | undefined = undefined
          
          // Try to get from event parties (supervisor is the calling party)
          const supervisorParty = lastEvent.parties.find((p: any) => 
            p.callingAddress === monitorDn || p.calledAddress === monitorDn
          )
          if (supervisorParty) {
            monitorDeviceName = supervisorParty.callingDeviceName || supervisorParty.calledDeviceName || undefined
            // Try to get device type from dnsMap
            if (monitorDeviceName && dnsMap[monitorDn]) {
              const devices = Object.values(dnsMap[monitorDn].devices || {}) as any[]
              const device = devices.find((d: any) => d.deviceName === monitorDeviceName)
              if (device) {
                monitorDeviceType = device.deviceType || undefined
              }
            }
          }
          
          // Fallback: get from dnsMap if not found in event
          if (!monitorDeviceName && dnsMap[monitorDn]) {
            const devices = Object.values(dnsMap[monitorDn].devices || {}) as any[]
            if (devices.length > 0) {
              // Prefer registered device, otherwise use first available
              const device = devices.find((d: any) => d.terminalState === 'REGISTERED') || devices[0]
              monitorDeviceName = device?.deviceName || undefined
              monitorDeviceType = device?.deviceType || undefined
            }
          }
          
          console.log('[Monitoring] Setting monitoring state from event (Case 1 - isMonitoring: true)', {
            monitorDn,
            monitoredDn,
            monitoringType,
            monitoredDeviceName: monitoredDeviceName || 'pending',
            monitorDeviceName: monitorDeviceName || 'pending',
            monitorDeviceType: monitorDeviceType || 'pending',
            eventName: lastEvent.eventName,
            eventType: lastEvent.eventType,
            callId: lastEvent.callId,
            sequence: lastEvent.sequence,
            currentState: activeMonitoring,
            partyInfo: monitoredParty,
            allParties: lastEvent.parties
          })
          setActiveMonitoring({
            dn: monitoredDn,
            type: monitoringType,
            monitor: monitorDn,
            deviceName: monitoredDeviceName || undefined,
            monitorDeviceName: monitorDeviceName,
            monitorDeviceType: monitorDeviceType
          })
          if (!monitoringStartTime[monitoredDn]) {
            setMonitoringStartTime(prev => ({ ...prev, [monitoredDn]: new Date() }))
          }
          // Mark this event as processed
          if (lastEvent.sequence !== undefined) {
            lastProcessedEventSequenceRef.current = lastEvent.sequence
          }
        }
      }
    }
  }, [eventLog, dnsMap, isInitialized, userAddress, activeMonitoring, setActiveMonitoring, setMonitoringStartTime, monitoringStartTime])

  // Auto-clear monitoring state when call ends
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !isInitialized || !dnsMap) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const monitoredDevice = dnsMap[monitoredDn]?.devices?.[monitoredDeviceName]
    
    if (!monitoredDevice) {
      clearMonitoringState(monitoredDn, 'device not found')
      return
    }

    const deviceCall = getCallStateForDevice(monitoredDn, monitoredDeviceName)
    const isDeviceActiveCall = deviceCall && 
      !deviceCall.isTerminating &&
      deviceCall.parties &&
      deviceCall.parties.length > 0 &&
      deviceCall.parties.some((p: any) => 
        p.callStatus !== 'DROPPED' && 
        p.callStatus !== 'DISCONNECTED' &&
        ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED', 'RINGING'].includes(p.callStatus)
      )

    if (!isDeviceActiveCall) {
      clearMonitoringState(monitoredDn, 'call ended')
    }
  }, [activeMonitoring, dnsMap, isInitialized, getCallStateForDevice, categorizedDns, hasActiveCalls, clearMonitoringState])

  // Handle FLIP animations when cards change sections
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const animationsToTrigger: Array<{ dn: string; fromSection: string; toSection: string }> = []
    
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      const previousSection = previousSectionsRef.current[dn]
      
      if (previousSection && previousSection !== currentSection) {
        const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
        if (card) {
          const rect = card.getBoundingClientRect()
          cardPositionsRef.current[dn] = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          }
        }
        
        animationsToTrigger.push({ dn, fromSection: previousSection, toSection: currentSection as string })
      }
    })
    
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      previousSectionsRef.current[dn] = currentSection as string
    })
    
    if (animationsToTrigger.length > 0) {
      requestAnimationFrame(() => {
        animationsToTrigger.forEach(({ dn, fromSection, toSection }) => {
          animateCardMove(dn, fromSection, toSection)
        })
      })
    }
  }, [categorizedDns, animateCardMove, isInitialized, dnsMap])





  // Set loading state
  useEffect(() => {
    if (isInitialized && Object.keys(dnsMap).length > 0) {
      setLoading(false)
    }
  }, [isInitialized, dnsMap])

  // Execute on all loaded
  const dnsMapKeys = useMemo(() => Object.keys(dnsMap || {}).sort().join(','), [dnsMap])
  
  useEffect(() => {
    if (!loading && isInitialized && dnsMapKeys.length > 0 && !hasCalledOnAllLoadedRef.current) {
      hasCalledOnAllLoadedRef.current = true
      
      const executeOnAllLoaded = async () => {
        const { GetCallLegs } = await import('@utils/dialer')
        const activeCallIds = getActiveCallIdsFromLocalStorageRef.current()
        
        // if (activeCallIds && activeCallIds.length > 0 && !hasCalledGetCallLegsRef.current) {
        //   hasCalledGetCallLegsRef.current = true
        //   try {
        //     const params = {
        //       callIds: activeCallIds
        //     }
            
        //     const response = await GetCallLegs(params)
        //     console.log('GetCallLegs response:', response)
        //   } catch (error) {
        //     console.error('Error calling GetCallLegs:', error)
        //     hasCalledGetCallLegsRef.current = false
        //   }
        // }
      }
      
      executeOnAllLoaded()
    }
  }, [loading, isInitialized, dnsMapKeys])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        openMenuDn &&
        !event.target.closest('.card') &&
        !event.target.closest('.dropdown-menu')
      ) {
        setTempMonitorSelection((prev) => ({ ...prev, [openMenuDn!]: null }))
        setOpenMenuDn(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuDn, setTempMonitorSelection, setOpenMenuDn])

  // Notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Inject custom styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = CUSTOM_STYLES
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Handler functions
  const handleMonitorSelect = (dn: string, monitorType: string) => {
    handleMonitorSelectHelper(dn, monitorType, setSelectedMonitor, setTempMonitorSelection, setSelectedTone)
  }

  const handleBargeInSelect = (dn: string) => {
    handleBargeInSelectHelper(dn, setSelectedMonitor, setTempMonitorSelection, setSelectedTone)
  }

  const resetMonitorSelection = () => {
    resetMonitorSelectionHelper(showPopup, setSelectedMonitor, setTempMonitorSelection, setSelectedTone)
  }

  const handleDeviceSelect = (device: any) => {
    handleDeviceSelectHelper(
      device,
      pendingMonitoringData,
      dnsMap,
      userAddress,
      showPopup,
      setShowPageLoader,
      setActiveMonitoring,
      setMonitoringStartTime,
      setNotification,
      setShowDeviceSelectionModal,
      setAvailableDevices,
      setPendingMonitoringData
    )
  }

  const handleDeviceSelectionCancel = () => {
    handleDeviceSelectionCancelHelper(setShowDeviceSelectionModal, setAvailableDevices, setPendingMonitoringData)
  }

  const stopMonitoring = async (dn: string, type: string) => {
    return await stopMonitoringFromHook(dn, type)
  }

  const isDnInActiveCall = (dn: string) => {
    return isDnInActiveCallHelper(dn, getDnCallState)
  }



  // Don't show CTI loading when user is not authenticated (avoids "page stuck on loading" when session expires or user logs out)
  if (status === 'unauthenticated') {
    return null
  }

  // Error and loading states
  if (error) {
    return (
      <div className="alert alert-danger m-3">
        Connection Error: {error}
      </div>
    )
  }

  // Full loading only when not initialized and not reconnecting (reconnecting keeps UI visible with a small banner)
  if (!isInitialized && !isReconnecting) {
    return (
      <>
      <PageLoader isLoading={true} />
      <div className="alert alert-info m-3">
        Connecting to server...
      </div>
      </>
    )
  }

  return (
    <div className="live-calls-wrapper">
      {isReconnecting && (
        <div
          className="alert alert-warning mb-0 rounded-0 d-flex align-items-center justify-content-center gap-2"
          style={{ fontSize: '0.875rem' }}
          role="status"
          aria-live="polite"
        >
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          Reconnecting to server...
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Calls" showPageLoader={showPageLoader && !isReconnecting} />

      {/* Header */}
      <PageHeader
        session={session}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        collapsedSections={collapsedSections}
        expandAll={expandAll}
        collapseAll={collapseAll}
        showFilterBar={showFilterBar}
        toggleFilterBar={() => setShowFilterBar(!showFilterBar)}
      />

          {/* Summary Dashboard */}
          <SummaryCards
            supervisionCount={supervisionCount}
            onCallCount={onCallCount}
            activeIdleCount={activeIdleCount}
            downOfflineCount={downOfflineCount}
            callStateMap={callStateMap}
            categorizedDns={categorizedDns}
            oldestIdleInfo={oldestIdleInfo}
            getUserDataExtensions={getUserDataExtensions}
          />

          {/* Sticky Filter Bar */}
          {showFilterBar && (
            <FilterBar
              searchQuery={searchQuery}
              selectedTeam={selectedTeam}
              selectedStatus={selectedStatus}
              sortBy={sortBy}
              setSearchQuery={setSearchQuery}
              setSelectedTeam={setSelectedTeam}
              setSelectedStatus={setSelectedStatus}
              setSortBy={setSortBy}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              getUserTeams={getUserTeams}
            />
          )}

            

      {/* Notification */}
      {/* {notification && (
        <div className="notification-container">
          <div
            className={`alert alert-${notification.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}
          >
            {notification.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification(null)}
            />
          </div>
        </div>
      )} */}

      {/* CTI Table */}
      <SectionsRenderer
        dnsMap={dnsMap}
        summaryData={summaryData}
        getDnCallState={getDnCallState}
        hasActiveCalls={hasActiveCalls}
        categorizeDns={categorizeDns}
        animatingCards={animatingCards}
        cardAnimations={cardAnimations}
        activeMonitoring={activeMonitoring}
        showPopup={showPopup}
        session={session}
        getUserDataExtensions={getUserDataExtensions}
        getCallStateForDevice={getCallStateForDevice}
        setSelectedMonitor={setSelectedMonitor}
        setTempMonitorSelection={setTempMonitorSelection}
        setSelectedTone={setSelectedTone}
        setShowPopup={setShowPopup}
        setNotification={setNotification}
        stopMonitoring={stopMonitoring}
        startMonitoringLocal={startMonitoringLocal}
        selectedTone={selectedTone}
        isDnInActiveCall={isDnInActiveCall}
        userAddress={userAddress}
        monitoringStartTime={monitoringStartTime}
        idleSinceByDn={idleSinceByDn}
        loading={loading}
        selectedTeam={selectedTeam}
        selectedStatus={selectedStatus}
        sortBy={sortBy}
        searchQuery={searchQuery}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
      />

      {/* Device Options Popup Modal */}
      {/* <MonitoringModal
        show={!!showPopup}
        showPopup={showPopup}
        activeMonitoring={activeMonitoring}
        selectedMonitor={selectedMonitor}
        tempMonitorSelection={tempMonitorSelection}
        selectedTone={selectedTone}
        session={session}
        dnsMap={dnsMap}
        onHide={() => setShowPopup(null)}
        onReset={resetMonitorSelection}
        onStartMonitoring={(dn: string, monitorType: string, toneType: string) => {
          startMonitoringLocal(dn, monitorType as 'SILENT' | 'WHISPER' | 'BARGE_IN', toneType, showPopup)
          setShowPopup(null)
        }}
        onMonitorSelect={handleMonitorSelect}
        onBargeInSelect={handleBargeInSelect}
        onStopMonitoring={stopMonitoring}
        isDnInActiveCallFn={isDnInActiveCall}
      /> */}

      {/* Device Selection Modal for Monitoring */}
      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={handleDeviceSelectionCancel}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={pendingMonitoringData?.dn || ''}
        userAddress={userAddress}
        context="monitoring"
        monitorType={pendingMonitoringData?.monitorType}
        toneType={pendingMonitoringData?.toneType}
        getUserDataExtensions={getUserDataExtensions}
      />

    </div>
  )
}

LiveCallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default LiveCallDashboard
