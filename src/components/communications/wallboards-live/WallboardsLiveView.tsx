import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  type SetStateAction,
} from 'react'
import BreadcrumbItem from '@common/BreadcrumbItem'
import DeviceSelectionModal from '@components/DeviceSelectionModal'
import PageLoader from '@components/PageLoader'
import { useSession } from 'next-auth/react'
import { useCti } from '@hooks/useCti'
import { CtiDevice } from '@components/live-calls/utils/types'
import SummaryCards from '@page-modules/communications/wallboards-live/_partials/SummaryCards'
import PageHeader from '@page-modules/communications/wallboards-live/_partials/PageHeader'
import SectionsRenderer from '@page-modules/communications/wallboards-live/_partials/SectionsRenderer'
import {
  buildWallboardMonitoringPayloadFromEvent,
  computeNextIdleSinceMap,
  devicePayloadFromDnsStateEvent,
  devicesArrayFromCompleteStateEvent,
  findLatestMonitoringEventFromLog,
  isCompleteStateLikeEvent,
  monitoringPayloadDiffersFromActive,
  pickBestMonitoringPayloadFromCallStateMap,
  registeredEntriesFromDevices,
  type RegisteredDeviceEntry,
  parseWallboardTimestampToMs,
} from '@components/communications/wallboards-live/wallboardEventParsing'
import {
  categorizeDns as categorizeDnsHelper,
  dnHasActiveCallForWallboard,
  isDnInActiveCall as isDnInActiveCallHelper,
} from '@components/live-calls/utils/helpers'
import type { MonitoringTeardownHint } from '@components/live-calls/utils/types'
import { resolveWallboardDisplayCall } from '@components/communications/wallboards-live/wallboardEventParsing'
import { CUSTOM_STYLES } from '@components/live-calls/utils/constants'
import { useMonitoring } from '@components/live-calls/utils/useMonitoring'
import {
  handleDeviceSelect as handleDeviceSelectHelper,
  handleDeviceSelectionCancel as handleDeviceSelectionCancelHelper,
} from '@components/live-calls/utils/handlers'
import { animateCardMove as animateCardMoveHelper } from '@components/live-calls/utils/animationHelpers'

const WallboardsLiveView: React.FC = () => {
  const { data:session, status } = useSession();
  const [showPageLoader, setShowPageLoader] = useState(false)
  const {
    summaryData,
    dnsMap,
    callStateMap,
    error,
    isInitialized,
    isReconnecting,
    getDnCallState,
    getCallStateForDevice,
    getCallStatesForDn,
    eventLog,
    userAddress,
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
  const [wallboardChrome, setWallboardChrome] = useState<{
    selectedMonitor: Record<string, string>
    tempMonitorSelection: Record<string, string | null>
    cardAnimations: { [dn: string]: 'adding' | null }
  }>({
    selectedMonitor: {},
    tempMonitorSelection: {},
    cardAnimations: {},
  })

  const setSelectedMonitor = useCallback((action: SetStateAction<Record<string, string>>) => {
    setWallboardChrome((prev) => ({
      ...prev,
      selectedMonitor: typeof action === 'function' ? action(prev.selectedMonitor) : action,
    }))
  }, [])

  const setTempMonitorSelection = useCallback((action: SetStateAction<Record<string, string | null>>) => {
    setWallboardChrome((prev) => ({
      ...prev,
      tempMonitorSelection: typeof action === 'function' ? action(prev.tempMonitorSelection) : action,
    }))
  }, [])

  const [selectedTone, setSelectedTone] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)
  const [activeMonitoring, setActiveMonitoring] = useState<{ dn: string | null; type: string | null; monitor?: string; deviceName?: string | null; monitorDeviceType?: string; monitorDeviceName?: string }>({
    dn: null,
    type: null
  })
  const [monitoringStartTime, setMonitoringStartTime] = useState<{ [dn: string]: Date }>({})
  const [showPopup, setShowPopup] = useState<{ dn: string; deviceName: string } | null>(null)

  // Refs
  /** Stale CTI snapshots may still list a session after stop; skip refilling until map drops it or key changes. */
  const suppressedMonitoringRefillKeyRef = useRef<string | null>(null)
  const [monitoringTeardown, setMonitoringTeardown] = useState<MonitoringTeardownHint | null>(null)
  /** First hydration from server when React state is still empty (refresh / SSE before events). */
  const monitoringSnapshotAppliedRef = useRef(false)
  const activeMonitoringRef = useRef(activeMonitoring)
  useEffect(() => {
    activeMonitoringRef.current = activeMonitoring
  }, [activeMonitoring])

  const { cardAnimations } = wallboardChrome
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set())
  const cardPositionsRef = useRef<{ [dn: string]: { x: number; y: number; width: number; height: number } }>({})
  const previousSectionsRef = useRef<{ [dn: string]: string }>({})
  
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
  
  const getWallboardCallForDn = useCallback(
    (dn: string) =>
      resolveWallboardDisplayCall(
        dn,
        activeMonitoring,
        monitoringTeardown,
        getDnCallState,
        getCallStateForDevice,
        getCallStatesForDn,
      ),
    [
      activeMonitoring,
      monitoringTeardown,
      getDnCallState,
      getCallStateForDevice,
      getCallStatesForDn,
    ],
  )

  useEffect(() => {
    if (activeMonitoring.dn && activeMonitoring.type) {
      setMonitoringTeardown(null)
    }
  }, [activeMonitoring.dn, activeMonitoring.type])

  const wallboardHasActiveCalls = useCallback(
    (dn: string) =>
      dnHasActiveCallForWallboard(
        dn,
        getCallStatesForDn,
        activeMonitoring,
        monitoringTeardown,
      ),
    [getCallStatesForDn, activeMonitoring, monitoringTeardown],
  )

  // Helper function to categorize DNs into sections (wrapper for imported helper)
  const categorizeDns = useCallback(
    (dn: string, devices: CtiDevice[], call: unknown, active: boolean) => {
      return categorizeDnsHelper({
        dn,
        devices,
        call,
        active,
        activeMonitoring,
        getCallStateForDevice,
        getCallStatesForDn,
        userAddress,
        monitoringTeardown,
      })
    },
    [
      activeMonitoring,
      getCallStateForDevice,
      getCallStatesForDn,
      userAddress,
      monitoringTeardown,
    ],
  )
  
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
      
      dnsList.forEach(({ dn, devices }: { dn: string; devices?: Record<string, CtiDevice> }) => {
        const deviceList = Object.values(devices ?? {})
        const call = getWallboardCallForDn(dn)
        const active = wallboardHasActiveCalls(dn)
        const section = categorizeDns(dn, deviceList, call, active)
        initialSections[dn] = section
      })
      
      previousSectionsRef.current = initialSections
    }
  }, [isInitialized, dnsMap, userAddress, getWallboardCallForDn, wallboardHasActiveCalls, categorizeDns])

  // FLIP Animation function
  const animateCardMove = useCallback((dn: string, fromSection: string, toSection: string) => {
    animateCardMoveHelper(dn, cardPositionsRef, setAnimatingCards)
  }, [setAnimatingCards])

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {
        /* ignore */
      })
      return
    }
    document.documentElement.requestFullscreen().then(() => {
      setIsFullscreen(true)
    }).catch(() => {
      /* ignore */
    })
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



  // Memoize the expensive calculations to prevent unnecessary re-renders
  const categorizedDns = useMemo(() => {
    if (!isInitialized || !dnsMap) return {}
    
    const dnsList = Object.values(dnsMap)
    const result: { [dn: string]: string } = {}
    
      dnsList.forEach(({ dn, devices }: { dn: string; devices?: Record<string, CtiDevice> }) => {
        const deviceList = Object.values(devices ?? {})
        const call = getWallboardCallForDn(dn)
        const active = wallboardHasActiveCalls(dn)
        result[dn] = categorizeDns(dn, deviceList, call, active)
      })
    
    return result
  }, [
    dnsMap,
    isInitialized,
    wallboardHasActiveCalls,
    getWallboardCallForDn,
    categorizeDns,
    activeMonitoring,
    eventLog,
  ])

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
  const [registeredDnsStore, setRegisteredDnsStore] = useState<Record<string, RegisteredDeviceEntry>>({})

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
    if (!eventLog?.length) return

    const completeStateEvents = eventLog.filter(isCompleteStateLikeEvent)
    const completeStateEvent = completeStateEvents.at(-1)
    if (!completeStateEvent) return

    const devices = devicesArrayFromCompleteStateEvent(completeStateEvent)
    const registered = registeredEntriesFromDevices(
      devices as ReadonlyArray<{
        terminalState?: string
        dn?: string
        deviceName?: string
        when?: string
        lastCallEndTime?: string
      }>
    )

    if (Object.keys(registered).length > 0) {
      setRegisteredDnsStore((prev) => ({ ...prev, ...registered }))
    }
  }, [eventLog])

  // Process dns_states events to update registered devices
  useEffect(() => {
    if (!eventLog?.length) return

    const dnsStateEvents = eventLog.filter(
      (e: { type?: string; data?: { type?: string } }) =>
        e.type === 'dns_states' || e.data?.type === 'dns_states' || (e.type === 'dns_states' && e.data)
    )

    dnsStateEvents.forEach((event) => {
      const device = devicePayloadFromDnsStateEvent(event)
      const dn = device?.dn
      const deviceName = device?.deviceName
      if (!dn || !deviceName) return

      const key = `${dn}_${deviceName}`

      if (device.terminalState === 'REGISTERED' && device.when) {
        const when = device.when
        setRegisteredDnsStore((prev) => ({
          ...prev,
          [key]: {
            deviceName,
            when,
            ...(device.lastCallEndTime && { lastCallEndTime: device.lastCallEndTime }),
            ...(prev[key]?.lastCallEndTime &&
              !device.lastCallEndTime && { lastCallEndTime: prev[key].lastCallEndTime }),
          },
        }))
        return
      }

      if (device.terminalState === 'UNREGISTERED' || device.terminalState === 'STALE') {
        setRegisteredDnsStore((prev) => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
      }
    })
  }, [eventLog])

  // Also process dnsMap changes to sync with current state
  useEffect(() => {
    if (!dnsMap) return

    const registered: Record<string, RegisteredDeviceEntry> = {}
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
      const updated: Record<string, RegisteredDeviceEntry> = {}
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

    const dnsList = Object.values(dnsMap) as Array<{ dn: unknown; devices?: Record<string, CtiDevice> }>
    const nowIso = new Date().toISOString()

    setIdleSinceByDn((prev) =>
      computeNextIdleSinceMap({
        prev,
        dnsList,
        currentSectionByDn: categorizedDns,
        registeredDnsStore,
        prevSectionByDnRef,
        prevIsRegisteredByDnRef,
        nowIso,
        parseServerTimeFn: parseWallboardTimestampToMs,
      })
    )
  }, [categorizedDns, dnsMap, isInitialized, registeredDnsStore])

  // Helper function to clear monitoring state
  const clearMonitoringState = useCallback((monitoredDn: string, reason: string = 'call ended') => {
    console.log('[Monitoring] clearMonitoringState called', { monitoredDn, reason })
    const snap = activeMonitoringRef.current
    suppressedMonitoringRefillKeyRef.current = snap.monitor
      ? `${snap.monitor}:${monitoredDn}`
      : `*:${monitoredDn}`
    monitoringSnapshotAppliedRef.current = false
    setMonitoringTeardown({
      monitorDn: snap.monitor,
      monitoredDn,
    })
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
  }, [setActiveMonitoring, setMonitoringStartTime, setSelectedMonitor, setSelectedTone, setTempMonitorSelection, setNotification])

  // Listen for terminal monitoring events and clear monitoring state immediately.
  // stopBargeInMonitoringAPI can emit DROPPED while the underlying customer call remains active,
  // so do not require hasActiveParticipants === false for the monitoring leg itself.
  useEffect(() => {
    if (!activeMonitoring.dn || !eventLog?.length) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const supervisorDn = activeMonitoring.monitor // Supervisor's DN (e.g., 107)

    const lastEvent = eventLog.at(-1)
    if (!lastEvent?.parties?.length) return

    const isTerminatedParty = (party: any) =>
      party?.callStatus === 'DROPPED' ||
      party?.callStatus === 'DISCONNECTED' ||
      party?.callStatus === 'ENDED'
    const involvesDn = (party: any, dn: string) => party?.callingAddress === dn || party?.calledAddress === dn
    const terminalEventType =
      lastEvent.eventType === 'DROPPED' ||
      lastEvent.eventType === 'DISCONNECTED' ||
      lastEvent.eventType === 'ENDED'

    // Case 1: Explicit observation end event (CTI-specific).
    if (
      lastEvent.eventName === 'CallObservationEndedEvImpl' &&
      terminalEventType &&
      supervisorDn &&
      lastEvent.parties.some((party: any) => involvesDn(party, supervisorDn) && involvesDn(party, monitoredDn))
    ) {
      console.log('[Monitoring] Clearing monitoring state - CallObservationEndedEvImpl detected', {
        supervisorDn,
        monitoredDn,
        eventType: lastEvent.eventType,
        eventName: lastEvent.eventName,
        callId: lastEvent.callId,
      })
      clearMonitoringState(monitoredDn, 'monitoring call ended')
      return
    }

    // Case 2: Terminal event on the supervisor<->agent monitoring leg.
    if (
      terminalEventType &&
      supervisorDn &&
      lastEvent.parties.some(
        (party: any) => isTerminatedParty(party) && involvesDn(party, supervisorDn) && involvesDn(party, monitoredDn)
      )
    ) {
      console.log('[Monitoring] Clearing monitoring state - monitoring leg terminated', {
        supervisorDn,
        monitoredDn,
        eventType: lastEvent.eventType,
        eventName: lastEvent.eventName,
        callId: lastEvent.callId,
      })
      clearMonitoringState(monitoredDn, 'monitoring call ended')
      return
    }

    // Case 3: Monitored device itself has terminal status in this event.
    if (
      terminalEventType &&
      lastEvent.parties.some((party: any) => {
        if (!isTerminatedParty(party) || !involvesDn(party, monitoredDn)) {
          return false
        }
        if (!monitoredDeviceName) {
          return true
        }
        return party?.callingDeviceName === monitoredDeviceName || party?.calledDeviceName === monitoredDeviceName
      })
    ) {
      console.log('[Monitoring] Clearing monitoring state - monitored party terminated', {
        monitoredDn,
        monitoredDeviceName,
        eventType: lastEvent.eventType,
        callId: lastEvent.callId,
      })
      clearMonitoringState(monitoredDn, 'call dropped')
    }
  }, [eventLog, activeMonitoring.dn, activeMonitoring.deviceName, activeMonitoring.monitor, clearMonitoringState])

  // Refill activeMonitoring after refresh from callStateMap (SSE ongoing_calls merge) when eventLog has not replayed yet
  useEffect(() => {
    if (!isInitialized || !dnsMap || !callStateMap) {
      return
    }

    const payload = pickBestMonitoringPayloadFromCallStateMap(
      callStateMap as Record<string, unknown>,
      dnsMap,
    )
    if (!payload) {
      suppressedMonitoringRefillKeyRef.current = null
      return
    }

    const sessionKey = `${payload.monitorDn}:${payload.monitoredDn}`
    const sup = suppressedMonitoringRefillKeyRef.current
    if (sup === sessionKey || sup === `*:${payload.monitoredDn}`) {
      return
    }

    const applyPayload = () => {
      console.log('[Monitoring] Setting monitoring state from callStateMap (ongoing_calls / refresh)', {
        ...payload,
      })
      setMonitoringTeardown(null)
      setActiveMonitoring({
        dn: payload.monitoredDn,
        type: payload.monitoringType,
        monitor: payload.monitorDn,
        deviceName: payload.monitoredDeviceName,
        monitorDeviceName: payload.monitorDeviceName,
        monitorDeviceType: payload.monitorDeviceType,
      })
      setMonitoringStartTime((prev) =>
        prev[payload.monitoredDn] ? prev : { ...prev, [payload.monitoredDn]: new Date() }
      )
    }

    if (!activeMonitoring.dn && !activeMonitoring.type) {
      if (!monitoringSnapshotAppliedRef.current) {
        monitoringSnapshotAppliedRef.current = true
        applyPayload()
      }
      return
    }

    if (!monitoringPayloadDiffersFromActive(activeMonitoring, payload)) {
      return
    }

    applyPayload()
  }, [
    callStateMap,
    dnsMap,
    isInitialized,
    activeMonitoring,
    setActiveMonitoring,
    setMonitoringStartTime,
  ])

  // Detect monitoring start from events and set monitoring state
  // Use a ref to track the last processed event sequence to avoid re-processing
  const lastProcessedEventSequenceRef = useRef<number | null>(null)
  
  useEffect(() => {
    if (!eventLog?.length || !dnsMap || !isInitialized) return

    const monitoringEvent = findLatestMonitoringEventFromLog(eventLog)
    if (!monitoringEvent?.parties?.length) return

    if (
      lastProcessedEventSequenceRef.current !== null &&
      monitoringEvent.sequence !== undefined &&
      monitoringEvent.sequence <= lastProcessedEventSequenceRef.current
    ) {
      return
    }

    const payload = buildWallboardMonitoringPayloadFromEvent(
      monitoringEvent.parties,
      monitoringEvent.monitoring as { monitorDn?: string; monitoredDn?: string; monitoringType?: string },
      dnsMap,
    )
    if (!payload) return

    const sessionKey = `${payload.monitorDn}:${payload.monitoredDn}`
    const sup = suppressedMonitoringRefillKeyRef.current
    if (sup === sessionKey || sup === `*:${payload.monitoredDn}`) {
      return
    }

    const applyPayload = () => {
      console.log('[Monitoring] Setting monitoring state from event (latest monitoring entry in log)', {
        ...payload,
        eventName: monitoringEvent.eventName,
        eventType: monitoringEvent.eventType,
        callId: monitoringEvent.callId,
        sequence: monitoringEvent.sequence,
      })
      setMonitoringTeardown(null)
      setActiveMonitoring({
        dn: payload.monitoredDn,
        type: payload.monitoringType,
        monitor: payload.monitorDn,
        deviceName: payload.monitoredDeviceName,
        monitorDeviceName: payload.monitorDeviceName,
        monitorDeviceType: payload.monitorDeviceType,
      })
      setMonitoringStartTime((prev) =>
        prev[payload.monitoredDn] ? prev : { ...prev, [payload.monitoredDn]: new Date() }
      )
      if (monitoringEvent.sequence !== undefined) {
        lastProcessedEventSequenceRef.current = monitoringEvent.sequence
      }
    }

    if (!activeMonitoring.dn && !activeMonitoring.type) {
      if (!monitoringSnapshotAppliedRef.current) {
        monitoringSnapshotAppliedRef.current = true
        applyPayload()
      }
      return
    }

    if (!monitoringPayloadDiffersFromActive(activeMonitoring, payload)) return

    applyPayload()
  }, [
    eventLog,
    dnsMap,
    isInitialized,
    activeMonitoring,
    setActiveMonitoring,
    setMonitoringStartTime,
  ])

  // Auto-clear monitoring state when call ends
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !isInitialized || !dnsMap) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName

    const isCallActive = (call: { isTerminating?: boolean; parties?: Array<{ callStatus?: string }> } | null) =>
      Boolean(
        call &&
          !call.isTerminating &&
          call.parties?.some(
            (p) =>
              p.callStatus !== 'DROPPED' &&
              p.callStatus !== 'DISCONNECTED' &&
              ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED', 'RINGING'].includes(p.callStatus ?? '')
          )
      )

    const deviceCall = getCallStateForDevice(monitoredDn, monitoredDeviceName)
    if (isCallActive(deviceCall)) {
      return
    }

    const dnCall = getDnCallState(monitoredDn)
    if (isCallActive(dnCall)) {
      return
    }

    const monitoredDevice = dnsMap[monitoredDn]?.devices?.[monitoredDeviceName]
    if (!monitoredDevice && !deviceCall && !dnCall) {
      clearMonitoringState(monitoredDn, 'device not found')
      return
    }

    clearMonitoringState(monitoredDn, 'call ended')
  }, [activeMonitoring, dnsMap, isInitialized, getCallStateForDevice, getDnCallState, clearMonitoringState])

  useEffect(() => {
    if (!monitoringTeardown) {
      return
    }
    const timer = setTimeout(() => setMonitoringTeardown(null), 12000)
    return () => clearTimeout(timer)
  }, [monitoringTeardown])

  // Handle FLIP animations when cards change sections
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const animationsToTrigger: Array<{ dn: string; fromSection: string; toSection: string }> = []
    
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      const previousSection = previousSectionsRef.current[dn]
      
      if (previousSection && previousSection !== currentSection) {
        const el = document.querySelector(`[data-dn="${dn}"]`)
        if (el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect()
          cardPositionsRef.current[dn] = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          }
        }

        animationsToTrigger.push({ dn, fromSection: previousSection, toSection: currentSection })
      }
    })
    
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      previousSectionsRef.current[dn] = currentSection
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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const menuDn = openMenuDn
      if (!menuDn || target.closest('.card') || target.closest('.dropdown-menu')) return
      setTempMonitorSelection((prev) => ({ ...prev, [menuDn]: null }))
      setOpenMenuDn(null)
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
      styleElement.remove()
    }
  }, [])

  const handleDeviceSelect = (device: Parameters<typeof handleDeviceSelectHelper>[0]) => {
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
    const snap = activeMonitoringRef.current
    const sessionKey = snap.monitor ? `${snap.monitor}:${dn}` : `*:${dn}`
    const ok = await stopMonitoringFromHook(dn, type)
    if (ok) {
      suppressedMonitoringRefillKeyRef.current = sessionKey
      monitoringSnapshotAppliedRef.current = false
      setMonitoringTeardown({
        monitorDn: snap.monitor,
        monitoredDn: dn,
      })
    }
    return ok
  }

  const isDnInActiveCall = (dn: string) => {
    return isDnInActiveCallHelper(
      dn,
      getWallboardCallForDn,
      getCallStatesForDn,
      activeMonitoring,
      monitoringTeardown,
    )
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
         

      {/* CTI Table */}
      <SectionsRenderer
        dnsMap={dnsMap}
        summaryData={summaryData}
        getDnCallState={getWallboardCallForDn}
        hasActiveCalls={wallboardHasActiveCalls}
        categorizeDns={categorizeDns}
        animatingCards={animatingCards}
        cardAnimations={cardAnimations}
        activeMonitoring={activeMonitoring}
        showPopup={showPopup}
        session={session}
        getUserDataExtensions={getUserDataExtensions}
        getCallStatesForDn={getCallStatesForDn}
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

export default WallboardsLiveView
