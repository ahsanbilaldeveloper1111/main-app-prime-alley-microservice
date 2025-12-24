import { useEffect, useRef, useMemo } from 'react'
import { GetCallLegs } from '@utils/dialer'
import { getLocalStorageCallStatesInfo } from './_helpers'

/**
 * Custom hook for Live Calls effects
 */
export const useLiveCallsEffects = ({
  isInitialized,
  dnsMap,
  loading,
  getDnCallState,
  hasActiveCalls,
  categorizedDns,
  activeMonitoring,
  getCallStateForDevice,
  previousSectionsRef,
  cardPositionsRef,
  animateCardMove,
  getActiveCallIdsFromLocalStorage,
  hasCalledGetCallLegsRef,
  hasCalledOnAllLoadedRef,
  getActiveCallIdsFromLocalStorageRef,
  openMenuDn,
  notification,
  eventLog,
  setLoading,
  setTempMonitorSelection,
  setOpenMenuDn,
  setNotification,
  setRestoredCallStates,
  setActiveMonitoring,
  setMonitoringStartTime,
  setSelectedMonitor,
  setSelectedTone,
  setTempMonitorSelection: setTempMonitorSelection2,
  previousSectionsRef: previousSectionsRef2,
  cardPositionsRef: cardPositionsRef2,
  setAnimatingCards
}: any) => {
  // Initialize previous sections when data is first loaded
  useEffect(() => {
    if (isInitialized && dnsMap && Object.keys(previousSectionsRef.current).length === 0) {
      const dnsList = Object.values(dnsMap)
      const initialSections: { [dn: string]: string } = {}
      
      dnsList.forEach(({ dn, devices }: any) => {
        const deviceList = Object.values(devices || {})
        const call = getDnCallState(dn)
        const active = hasActiveCalls(dn)
        // Note: categorizeDns function needs to be passed or imported
        // For now, we'll skip this initialization
      })
      
      previousSectionsRef.current = initialSections
    }
  }, [isInitialized, dnsMap, getDnCallState, hasActiveCalls])

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      
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

  // Auto-clear monitoring state when call ends
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !isInitialized || !dnsMap) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const monitoredDevice = dnsMap[monitoredDn]?.devices?.[monitoredDeviceName]
    
    if (!monitoredDevice) {
      setActiveMonitoring({ dn: null, type: null, deviceName: null })
      setMonitoringStartTime((prev: any) => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      return
    }

    const deviceCall = getCallStateForDevice(monitoredDn, monitoredDeviceName)
    const isDeviceActiveCall = deviceCall && 
      ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED', 'RINGING'].includes(deviceCall.currentState || '')

    if (!isDeviceActiveCall) {
      console.log('Call ended, clearing monitoring state for:', monitoredDn, monitoredDeviceName)
      setActiveMonitoring({ dn: null, type: null, deviceName: null })
      setMonitoringStartTime((prev: any) => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      setSelectedMonitor((prev: any) => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      setSelectedTone((prev: any) => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      setTempMonitorSelection2((prev: any) => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      setNotification({
        type: 'info',
        message: `Monitoring automatically stopped for ${monitoredDn} - call ended`
      })
    }
  }, [activeMonitoring, dnsMap, isInitialized, getCallStateForDevice, categorizedDns, hasActiveCalls, setActiveMonitoring, setMonitoringStartTime, setSelectedMonitor, setSelectedTone, setTempMonitorSelection2, setNotification])

  // Handle FLIP animations when cards change sections
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const animationsToTrigger: Array<{ dn: string; fromSection: string; toSection: string }> = []
    
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      const previousSection = previousSectionsRef2.current[dn]
      
      if (previousSection && previousSection !== currentSection) {
        const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
        if (card) {
          const rect = card.getBoundingClientRect()
          cardPositionsRef2.current[dn] = {
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
      previousSectionsRef2.current[dn] = currentSection as string
    })
    
    if (animationsToTrigger.length > 0) {
      requestAnimationFrame(() => {
        animationsToTrigger.forEach(({ dn, fromSection, toSection }) => {
          animateCardMove(dn, fromSection, toSection)
        })
      })
    }
  }, [categorizedDns, animateCardMove, isInitialized, dnsMap, previousSectionsRef2, cardPositionsRef2, setAnimatingCards])

  // Set loading state
  useEffect(() => {
    if (isInitialized && Object.keys(dnsMap).length > 0) {
      setLoading(false)
    }
  }, [isInitialized, dnsMap, setLoading])

  // Execute on all loaded
  const dnsMapKeys = useMemo(() => Object.keys(dnsMap || {}).sort().join(','), [dnsMap])
  
  useEffect(() => {
    if (!loading && isInitialized && dnsMapKeys.length > 0 && !hasCalledOnAllLoadedRef.current) {
      hasCalledOnAllLoadedRef.current = true
      
      const executeOnAllLoaded = async () => {
        const activeCallIds = getActiveCallIdsFromLocalStorageRef.current()
        
        if (activeCallIds && activeCallIds.length > 0 && !hasCalledGetCallLegsRef.current) {
          hasCalledGetCallLegsRef.current = true
          try {
            const params = {
              callIds: activeCallIds
            }
            
            const response = await GetCallLegs(params)
            console.log('GetCallLegs response:', response)
          } catch (error) {
            console.error('Error calling GetCallLegs:', error)
            hasCalledGetCallLegsRef.current = false
          }
        }
      }
      
      executeOnAllLoaded()
    }
  }, [loading, isInitialized, dnsMapKeys, hasCalledOnAllLoadedRef, hasCalledGetCallLegsRef, getActiveCallIdsFromLocalStorageRef])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        openMenuDn &&
        !event.target.closest('.card') &&
        !event.target.closest('.dropdown-menu')
      ) {
        setTempMonitorSelection((prev: any) => ({ ...prev, [openMenuDn!]: null }))
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
  }, [notification, setNotification])

  // Inject custom styles
  useEffect(() => {
    // Styles are now in constants.ts and injected via CUSTOM_STYLES
    // This effect can be removed if styles are handled differently
  }, [])
}

