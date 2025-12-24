import React, { ReactElement, useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import DeviceSelectionModal from '../../components/DeviceSelectionModal'
import PageLoader from '@components/PageLoader'
import { useSession } from 'next-auth/react'
import '@assets/scss/common.scss'
import '@assets/scss/live-calls.scss'
import { useCti } from '@hooks/useCti'
import { CtiDevice } from './partials/_types'
import SummaryCards from './partials/SummaryCards'
import FilterBar from './partials/FilterBar'
import MonitoringModal from './partials/MonitoringModal'
import PageHeader from './partials/PageHeader'
import SectionsRenderer from './partials/SectionsRenderer'
import { 
  categorizeDns as categorizeDnsHelper, 
  isDnInActiveCall as isDnInActiveCallHelper,
  getLocalStorageCallStatesInfo
} from './partials/_helpers'
import { CUSTOM_STYLES } from './partials/_constants'
import { useMonitoring } from './partials/_useMonitoring'
import { 
  handleMonitorSelect as handleMonitorSelectHelper,
  handleBargeInSelect as handleBargeInSelectHelper,
  resetMonitorSelection as resetMonitorSelectionHelper,
  handleDeviceSelect as handleDeviceSelectHelper,
  handleDeviceSelectionCancel as handleDeviceSelectionCancelHelper
} from './partials/_handlers'
import { animateCardMove as animateCardMoveHelper } from './partials/_animationHelpers'

const LiveCallDashboard = () => {
  const { data:session, status } = useSession();
  const [showPageLoader, setShowPageLoader] = useState(false)
  const {
    summaryData,
    dnsMap,
    callStateMap,
    error,
    isInitialized,
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
  const [activeMonitoring, setActiveMonitoring] = useState<{ dn: string | null; type: string | null; monitor?: string; deviceName?: string | null }>({
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
    setShowPopup
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
      getCallStatesForDn
    )
  }
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  
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

  // Auto-clear monitoring state when call ends
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !isInitialized || !dnsMap) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const monitoredDevice = dnsMap[monitoredDn]?.devices?.[monitoredDeviceName]
    
    if (!monitoredDevice) {
      setActiveMonitoring({ dn: null, type: null, deviceName: null })
      setMonitoringStartTime(prev => {
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
        message: `Monitoring automatically stopped for ${monitoredDn} - call ended`
      })
    }
  }, [activeMonitoring, dnsMap, isInitialized, getCallStateForDevice, categorizedDns, hasActiveCalls, setActiveMonitoring, setMonitoringStartTime, setSelectedMonitor, setSelectedTone, setTempMonitorSelection, setNotification])

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



  // Error and loading states
  if (error) {
    return (
      <div className="alert alert-danger m-3">
        Connection Error: {error}
      </div>
    )
  }

  if (!isInitialized) {
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
    <>
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Calls" showPageLoader={showPageLoader} />

      {/* Header */}
      <PageHeader
        session={session}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

          {/* Summary Dashboard */}
          <SummaryCards
            supervisionCount={supervisionCount}
            onCallCount={onCallCount}
            activeIdleCount={activeIdleCount}
            downOfflineCount={downOfflineCount}
            callStateMap={callStateMap}
            categorizedDns={categorizedDns}
          />

          {/* Sticky Filter Bar */}
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

            

      {/* Notification */}
      {notification && (
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
      )}

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
        selectedTone={selectedTone}
        isDnInActiveCall={isDnInActiveCall}
        loading={loading}
        selectedTeam={selectedTeam}
        searchQuery={searchQuery}
      />

      {/* Device Options Popup Modal */}
      <MonitoringModal
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
      />

      {/* Device Selection Modal for Monitoring */}
      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={handleDeviceSelectionCancel}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={pendingMonitoringData?.dn || ''}
        context="monitoring"
        monitorType={pendingMonitoringData?.monitorType}
        toneType={pendingMonitoringData?.toneType}
      />

    </>
  )
}

LiveCallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default LiveCallDashboard
