import React, { ReactElement, useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Dropdown } from 'react-bootstrap'
import DeviceSelectionModal from '../../components/DeviceSelectionModal'
import { toast } from 'react-toastify'
import UserDummyImage from '@assets/images/user-dummy.jpg'
import '@assets/scss/gsm-dashboard.scss'
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid'
import moment from 'moment'
import useCtiStomp from '../../hooks/useCtiStomp'
import useGlobalCallTimer from '../../hooks/useGlobalCallTimer'
import dynamic from 'next/dynamic'
import PageLoader from '@components/PageLoader'

import Link from 'next/link'
import { clearAllLocalStorage, getLocalStorageInfo } from '../../utils/localStorageUtils'
import { useSession } from 'next-auth/react';
import { startMonitoring, stopMonitoring as stopMonitoringAPI, startBargeInMonitoring, stopBargeInMonitoring as stopBargeInMonitoringAPI, GetCallLegs } from '@utils/dialer'

import '@assets/scss/common.scss';
import '@assets/scss/live-calls.scss';
import { FiX } from 'react-icons/fi'


interface CtiDevice {
  dn: string
  deviceName: string
  status: string
  terminalState: string
  deviceType: string
}

interface DnData {
  dn: string
  devices: Record<string, CtiDevice>
}

// CallTimer component for displaying elapsed time
const CallTimer: React.FC<{ dn: string; isActive: boolean }> = ({ dn, isActive }) => {
  const { elapsedTime, isRunning } = useGlobalCallTimer(dn, isActive)
  
  // Debug logging
  //console.log('CallTimer render:', { dn, isActive, elapsedTime, isRunning })
  
  if (!isActive) {
    return null
  }

  return (
    <p className={`call-timer ${isRunning ? 'running' : ''}`}>{elapsedTime}</p>
  )
}

const LiveCallDashboard = () => {
  const { data:session, status } = useSession();
  const [showPageLoader, setShowPageLoader] = useState(false)
  const {
    summaryData,
    dnsMap,
    error,
    isInitialized,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    getCallStatesForDn,
    eventLog,
    userAddress,
    syncPersistedCallStates,
    getActiveCallIdsFromLocalStorage,
    getAllCallIds
  } = useCtiStomp()

  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<string | null>(null)
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
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [restoredCallStates, setRestoredCallStates] = useState<number>(0)
  
  // Ref to track if GetCallLegs has been called to prevent multiple calls
  const hasCalledGetCallLegsRef = useRef(false)
  // Ref to track if onAllLoaded has been called to prevent infinite loops
  const hasCalledOnAllLoadedRef = useRef(false)
  // Ref to store stable function reference to avoid dependency issues
  const getActiveCallIdsFromLocalStorageRef = useRef(getActiveCallIdsFromLocalStorage)
  
  // Update ref when function changes
  useEffect(() => {
    getActiveCallIdsFromLocalStorageRef.current = getActiveCallIdsFromLocalStorage
  }, [getActiveCallIdsFromLocalStorage])
  
  // Popover state management
  const [activePopover, setActivePopover] = useState<string | null>(null)
  const popoverRefs = useRef<{ [dn: string]: HTMLDivElement | null }>({})
  
  // Animation state management
  const [cardAnimations, setCardAnimations] = useState<{ [dn: string]: 'adding' | null }>({})
  const [previousSections, setPreviousSections] = useState<{ [dn: string]: string }>({})
  
  // FLIP Animation state
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set())
  const [cardPositions, setCardPositions] = useState<{ [dn: string]: { x: number; y: number; width: number; height: number } }>({})
  const [lastPositions, setLastPositions] = useState<{ [dn: string]: { [section: string]: number } }>({})
  
  // Use ref to store card positions to avoid dependency issues
  const cardPositionsRef = useRef<{ [dn: string]: { x: number; y: number; width: number; height: number } }>({})
  
  // Use ref to track previous sections to avoid infinite loops
  const previousSectionsRef = useRef<{ [dn: string]: string }>({})
  
  // Simulation state
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [simulationUsers, setSimulationUsers] = useState<Array<{ id: number; name: string; status: 'supervision' | 'oncall' | 'online' | 'offline' }>>([])
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Helper functions
  const getCardLevelStatus = (devices: CtiDevice[]) => {
    if (!devices || devices.length === 0) return 'unregistered'
    if (devices.some(d => d.terminalState === 'REGISTERED')) return 'registered'
    if (devices.some(d => d.terminalState === 'STALE')) return 'stale'
    return 'unregistered'
  }

  // Helper function to categorize DNs into sections
  const categorizeDns = (dn: string, devices: CtiDevice[], call: any, active: boolean) => {
    const cls = getCardLevelStatus(devices)
    
    // Check if DN is being monitored (In Supervision) - only if call is still active
    if (activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName) {
      // Check if the monitored device still has an active call
      const monitoredDevice = devices.find(d => d.deviceName === activeMonitoring.deviceName)
      if (monitoredDevice) {
        const deviceCall = getCallStateForDevice(dn, activeMonitoring.deviceName)
        const isDeviceActiveCall = deviceCall && 
          ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED', 'RINGING'].includes(deviceCall.currentState || '')
        
        if (isDeviceActiveCall) {
          return 'supervision'
        }
      }
      // If call ended, clear monitoring state
      // Note: This will be handled by useEffect below, but we don't return supervision here
    }
    
    // Check if DN has active calls (On Call)
    // CRITICAL: Check ALL calls for this DN, not just the one passed in
    // A DN should only be "onCall" if it has at least one active (non-DROPPED) party in ANY call
    const allCallsForDn = getCallStatesForDn(dn)
    let hasActiveCallForDn = false
    
    if (allCallsForDn.length > 0) {
      // Check each call to see if this DN has any active parties
      for (const callState of allCallsForDn) {
        // Skip terminating calls
        if (callState.isTerminating) continue
        
        if (callState.parties && callState.parties.length > 0) {
          // Filter parties involving this DN and check they are active (not DROPPED/DISCONNECTED)
          // IMPORTANT: Double-check that parties are truly active (defensive programming)
          const dnParties = callState.parties.filter((p: any) => {
            const involvesDn = (p.callingAddress === dn || p.calledAddress === dn)
            const isActive = p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
            return involvesDn && isActive
          })
          
          // If we found active parties for this DN in this call, mark as active
          if (dnParties.length > 0) {
            hasActiveCallForDn = true
            break
          }
        }
      }
    }
    
    
    
    // Only show as "onCall" if there are active parties for this DN in any call
    if (hasActiveCallForDn) {
      return 'onCall'
    }
    
    // Check device status (Active/Idle vs Down/Offline)
    if (cls === 'registered') {
      return 'activeIdle'
    } else if (cls === 'unregistered' || cls === 'stale') {
      return 'downOffline'
    }
    
    return 'downOffline' // Default fallback
  }
  
  // Initialize previous sections when data is first loaded
  useEffect(() => {
    if (isInitialized && dnsMap && Object.keys(previousSectionsRef.current).length === 0) {
      const dnsList = Object.values(dnsMap)
      const initialSections: { [dn: string]: string } = {}
      
      dnsList.forEach(({ dn, devices }) => {
        const deviceList = Object.values(devices || {})
        const call = getDnCallState(dn)
        const active = hasActiveCalls(dn)
        const section = categorizeDns(dn, deviceList, call, active)
        initialSections[dn] = section
      })
      
      previousSectionsRef.current = initialSections
    }
  }, [isInitialized, dnsMap, userAddress, getDnCallState, hasActiveCalls])
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Popover handlers
  const handlePopoverToggle = (dn: string) => {
    setActivePopover(activePopover === dn ? null : dn)
  }

  const handlePopoverHide = () => {
    setActivePopover(null)
  }

  const handleActionClick = (dn: string, action: string) => {
    //console.log(`${action} action for:`, dn)
    setActivePopover(null)
  }
  
  // Device selection modal state
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<Array<{
    deviceName: string;
    deviceType: string;
    terminalState: string;
    when: string;
    details: string;
  }>>([])
  const [pendingMonitoringData, setPendingMonitoringData] = useState<{
    dn: string;
    monitorType: string;
    toneType: string;
    monitoredDeviceName: string;
    monitoredDeviceType: string;
  } | null>(null)

  // Helper function to clear localStorage call states
  const clearLocalStorageCallStates = () => {
    try {
      clearAllLocalStorage()
      setNotification({ type: 'success', message: 'LocalStorage call states cleared successfully' })
      // Force a page reload to see the effect
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setNotification({ type: 'danger', message: 'Failed to clear localStorage call states' })
    }
  }

  // Helper function to get localStorage call states info
  const getLocalStorageCallStatesInfo = () => {
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

  // Helper function to count active monitoring sessions
  const getActiveMonitoringCount = () => {
    return activeMonitoring.dn && activeMonitoring.type && activeMonitoring.deviceName ? 1 : 0
  }

  // Helper function to get section title
  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'supervision':
        return 'In Supervision'
      case 'onCall':
        return 'On Call'
      case 'activeIdle':
        return 'Active/Idle'
      case 'downOffline':
        return 'Down/Offline'
      default:
        return 'Unknown'
    }
  }

  // Helper function to get section icon
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'supervision':
        return 'visibility'
      case 'onCall':
        return 'call'
      case 'activeIdle':
        return 'check_circle'
      case 'downOffline':
        return 'error'
      default:
        return 'help'
    }
  }

  // Helper function to get section color
  const getSectionColor = (section: string) => {
    switch (section) {
      case 'supervision':
        return '#ffc107' // Amber for supervision
      case 'onCall':
        return '#dc3545' // Red for active calls
      case 'activeIdle':
        return '#28a745' // Green for active/idle
      case 'downOffline':
        return '#6c757d' // Gray for down/offline
      default:
        return '#6c757d'
    }
  }

  // Helper function to get section order for direction calculation
  const getSectionOrder = (section: string) => {
    switch (section) {
      case 'supervision': return 0
      case 'onCall': return 1
      case 'activeIdle': return 2
      case 'downOffline': return 3
      default: return 3
    }
  }

  // FLIP Animation functions - Exact copy from reference code
  const animateCardMove = useCallback((dn: string, fromSection: string, toSection: string) => {
   
    // Get the stored BEFORE position from ref
    const first = cardPositionsRef.current[dn]
    if (!first) {
     return
    }
    
    
    // Get the card in its new position
    const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
    if (!card) {
     return
    }

    // Mark as animating
    setAnimatingCards(prev => new Set(Array.from(prev).concat(dn)))

    
    
    // Get the LAST position (where the card is now after DOM update)
    const lastRect = card.getBoundingClientRect()
    const last = {
      x: lastRect.left,
      y: lastRect.top,
      width: lastRect.width,
      height: lastRect.height
    }
    

    // Calculate the transform needed (exact same as reference)
    const dx = first.x - last.x
    const dy = first.y - last.y
    const sx = first.width / last.width
    const sy = first.height / last.height


    // Check if there's actually movement to animate
    if (dx === 0 && dy === 0 && sx === 1 && sy === 1) {

      setAnimatingCards(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(dn)
        return newSet
      })
      return
    }

    // Apply FLIP animation exactly like reference code
    card.style.transition = 'none'
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    card.classList.add('anim-moving')
    card.style.backgroundColor = 'rgba(255, 255, 0, 0.3)' // Temporary visual indicator
    
    // Add status glow animation (from reference)
    card.classList.add('status-glow')
    
    // Force reflow (same as reference)
    card.offsetHeight
    
    // Animate to final position (exact same as reference)
    requestAnimationFrame(() => {
      card.style.transition = 'transform 0.55s cubic-bezier(0.2, 0.9, 0.2, 1)'
      card.style.transform = 'none'
      
    })

    // Clean up after animation (exact same as reference)
    card.addEventListener('transitionend', () => {
    
      card.classList.remove('anim-moving')
      card.classList.remove('status-glow')
      card.style.backgroundColor = '' // Remove visual indicator
      card.style.transition = ''
      card.style.transform = ''
      
      setAnimatingCards(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(dn)
        return newSet
      })
    }, { once: true })
  }, [])

  const getSectionKey = (section: string) => {
    switch (section) {
      case 'supervision': return 'supervision'
      case 'onCall': return 'oncall'
      case 'activeIdle': return 'online'
      case 'downOffline': return 'offline'
      default: return 'offline'
    }
  }

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
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])



  // Check for restored call states on component mount
  useEffect(() => {
    const info = getLocalStorageCallStatesInfo()
    if (info.count > 0) {
      setRestoredCallStates(info.count)
      // setNotification({ 
      //   type: 'info', 
      //   message: `Restored ${info.count} call state(s) from localStorage` 
      // })
    }
  }, [])

  // Memoize the expensive calculations to prevent unnecessary re-renders
  // Note: eventLog is included to trigger recalculation when new events arrive
  const categorizedDns = useMemo(() => {
    if (!isInitialized || !dnsMap) return {}
    
    const dnsList = Object.values(dnsMap)
    const result: { [dn: string]: string } = {}
    
    dnsList.forEach(({ dn, devices }) => {
      const deviceList = Object.values(devices || {})
      const call = getDnCallState(dn)
      const active = hasActiveCalls(dn)
      result[dn] = categorizeDns(dn, deviceList, call, active)
    })
    
    return result
  }, [dnsMap, isInitialized, userAddress, hasActiveCalls, getDnCallState, getCallStatesForDn, activeMonitoring, eventLog])

  // Auto-clear monitoring state when call ends
  useEffect(() => {
    if (!activeMonitoring.dn || !activeMonitoring.deviceName || !isInitialized || !dnsMap) return

    const monitoredDn = activeMonitoring.dn
    const monitoredDeviceName = activeMonitoring.deviceName
    const monitoredDevice = dnsMap[monitoredDn]?.devices?.[monitoredDeviceName]
    
    if (!monitoredDevice) {
      // Device not found, clear monitoring
      setActiveMonitoring({ dn: null, type: null, deviceName: null })
      setMonitoringStartTime(prev => {
        const newState = { ...prev }
        delete newState[monitoredDn]
        return newState
      })
      return
    }

    // Check if the monitored device still has an active call
    const deviceCall = getCallStateForDevice(monitoredDn, monitoredDeviceName)
    const isDeviceActiveCall = deviceCall && 
      ['CONNECTED', 'ON_HOLD', 'ANSWERED', 'RETRIEVED', 'RINGING'].includes(deviceCall.currentState || '')

    if (!isDeviceActiveCall) {
      // Call ended, clear monitoring state
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
  }, [activeMonitoring, dnsMap, isInitialized, getCallStateForDevice, categorizedDns, hasActiveCalls])

  // Handle FLIP animations when cards change sections
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    //console.log('Animation useEffect triggered, categorizedDns:', categorizedDns)
    const animationsToTrigger: Array<{ dn: string; fromSection: string; toSection: string }> = []
    
    // First pass: Check for changes and capture positions
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      const previousSection = previousSectionsRef.current[dn]
      
      //console.log(`DN ${dn}: previous=${previousSection}, current=${currentSection}`)
      
      // If section changed, capture BEFORE position and queue animation
      if (previousSection && previousSection !== currentSection) {
        //console.log(`🎯 SECTION CHANGE DETECTED for ${dn}: ${previousSection} -> ${currentSection}`)
        
        // Capture the BEFORE position immediately (before DOM updates)
        const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
        if (card) {
          const rect = card.getBoundingClientRect()
          cardPositionsRef.current[dn] = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          }
          //console.log(`Captured BEFORE position for ${dn}:`, cardPositionsRef.current[dn])
        } else {
          //console.log(`Card not found for ${dn} during position capture`)
        }
        
        // Queue animation to trigger after state updates
        animationsToTrigger.push({ dn, fromSection: previousSection, toSection: currentSection })
        //console.log(`Queued animation for ${dn}`)
      } else if (!previousSection) {
        //console.log(`Initializing previous section for ${dn}: ${currentSection}`)
      }
    })
    
    // Second pass: Update the ref with new previous sections
    Object.entries(categorizedDns).forEach(([dn, currentSection]) => {
      previousSectionsRef.current[dn] = currentSection
    })
    
    //console.log(`Total animations to trigger: ${animationsToTrigger.length}`)
    
    // Trigger animations after DOM has been updated
    if (animationsToTrigger.length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        //console.log('Triggering animations after RAF:', animationsToTrigger)
        animationsToTrigger.forEach(({ dn, fromSection, toSection }) => {
          animateCardMove(dn, fromSection, toSection)
        })
      })
    }
  }, [categorizedDns, animateCardMove])




  // Custom styles
  const customStyles = `
    .btn:hover i {
      background-color: #fff;
    }
    .kebab-menu-button {
      background: none;
      border: none;
      font-size: 1.2rem;
      color: #6c757d;
      cursor: pointer;
      text-decoration: none;
    }
    .kebab-menu-button:hover {
      color: #495057;
    }
    .dropdown-menu {
      min-width: 200px;
    }
    .dropdown-header {
      font-weight: 600;
      color: #6c757d;
      padding: 0.5rem 1rem 0.25rem;
    }
    .dropdown-divider {
      margin: 0.25rem 0;
    }
    .call-details {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 0.25rem;
      font-style: italic;
    }
    .call-status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .device-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      align-items: center;
    }
    .device-grid .d-flex {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .device-icon {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
    }
    .device-icon:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .device-icon.active {
      background-color: #4caf5052 !important;
    }
    .device-icon.monitoring {
      border: 2px solid #ffc107 !important;
      box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
    }
    .device-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
    }
    .monitoring-indicator {
      position: absolute;
      bottom: 0.25rem;
      right: 0.25rem;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #ffc107;
      animation: monitoring-pulse 2s infinite;
    }
    @keyframes monitoring-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(255, 193, 7, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
      }
    }
    .device-menu-dropdown {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      z-index: 10;
    }
    .device-kebab-button {
      background: none;
      border: none;
      font-size: 0.875rem;
      color: #6c757d;
      cursor: pointer;
      text-decoration: none;
      padding: 0.125rem;
      border-radius: 0.25rem;
      transition: all 0.2s ease;
    }
    .device-kebab-button:hover {
      color: #495057;
      background-color: rgba(0, 0, 0, 0.1);
    }
    .device-kebab-button:focus {
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    .device-stop-btn {
      min-width: auto;
      height: 28px;
      padding: 0.25rem 0.5rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border: 1px solid #dc3545;
      background-color: transparent;
      color: #dc3545;
      gap: 0.25rem;
    }
    .device-stop-btn:hover {
      background-color: #dc3545;
      color: white;
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
    }
    .device-stop-btn:focus {
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }
    .device-stop-label {
      font-size: 0.625rem;
      font-weight: 500;
      margin-left: 0.25rem;
      white-space: nowrap;
    }
    .monitoring-status {
      border-radius: 0.375rem;
      overflow: hidden;
    }
    .monitoring-status .alert-sm {
      padding: 0.5rem 0.75rem;
      margin: 0;
      border: 1px solid #ffc107;
      background-color: #fff3cd;
    }
    .monitoring-status .alert-sm .btn {
      border-radius: 0.25rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .monitoring-status .alert-sm .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .monitoring-status .material-icons-two-tone {
      color: #856404;
    }
    .monitoring-status small {
      font-size: 0.75rem;
      line-height: 1.2;
    }
    
    /* Card styles */
    .card-wrapper {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius:10px;
    }
    
    .card-wrapper:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    /* Simple slide animations */
    .card-wrapper.slide-up {
      animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .card-wrapper.slide-down {
      animation: slideDown 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    @keyframes slideUp {
      0% {
        transform: translateY(30px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideDown {
      0% {
        transform: translateY(-30px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    
    .section-transition {
      position: relative;
      overflow: hidden;
    }
    
    .section-container {
      min-height: 150px;
      border: 2px dashed rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(248, 249, 250, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
    }
    
   
    
    .section-container:hover {
     
      
    }
    
    .section-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .section-container:hover::before {
      opacity: 0.3;
    }
    
    .section-container.has-content {
      border: none;
      background: transparent;
    }
    
    .empty-section-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 150px;
      color: #6c757d;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    
    .empty-section-placeholder .material-icons-two-tone {
      font-size: 3rem;
      opacity: 0.3;
      margin-bottom: 1rem;
    }
    
    /* Section-specific styling */
    .section-container[data-section="supervision"] {
      border-color: rgba(255, 193, 7, 0.3);
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.02) 100%);
    }
    
    .section-container[data-section="onCall"] {
      border-color: rgba(220, 53, 69, 0.3);
      background: linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(220, 53, 69, 0.02) 100%);
    }
    
    .section-container[data-section="activeIdle"] {
      border-color: rgba(40, 167, 69, 0.3);
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.05) 0%, rgba(40, 167, 69, 0.02) 100%);
    }
    
    .section-container[data-section="downOffline"] {
      border-color: rgba(108, 117, 125, 0.3);
      background: linear-gradient(135deg, rgba(108, 117, 125, 0.05) 0%, rgba(108, 117, 125, 0.02) 100%);
    }
    
    .dial-pad .btn {
      font-size: 1.5rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .dial-pad .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .call-status-indicator {
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .call-status-indicator .spinner-border {
      width: 1.5rem;
      height: 1.5rem;
    }
    .extensions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: block;
     
      max-height: 330px;
      overflow-y: auto;
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      background-color: #f8f9fa;
    }
    .extension-item {
      margin: 0;
      display: block;
      padding: 0;
      margin-bottom: 5px !important;
    }
    .extension-button {
      width: 100%;
      // min-height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      background-color: #fff;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .extension-button.online {
      border-color: #198754;
      color: #198754;
    }
    .extension-button.offline {
      border-color: #6c757d;
      color: #6c757d;
    }
    .extension-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .extension-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .extension-button:focus {
      outline: none;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    
    /* Call Status Color Styles */
    .call-status-calling {
      color: #d97706 !important; /* Orange for calling/ringing */
    }
    
    .call-status-connected {
      color: #059669 !important; /* Green for connected */
    }
    
    .call-status-held {
      color: #2563eb !important; /* Blue for held */
    }
    
    .call-status-incoming {
      color: #dc2626 !important; /* Red for incoming */
    }
    
    .call-status-outgoing {
      color: #d97706 !important; /* Orange for outgoing */
    }
    
    .call-status-conference {
      color: #6f42c1 !important; /* Purple for conference */
    }
    
    /* FLIP Animation Styles - Based on reference code */
    .anim-moving {
      transition: transform 0.55s cubic-bezier(0.2, 0.9, 0.2, 1), opacity 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) !important;
      z-index: 9999 !important;
      box-shadow: 0 15px 40px rgba(0,0,0,0.35) !important;
      opacity: 1 !important;
      pointer-events: none !important;
      border-width:3px;
    }
    
    .status-glow {
      animation: statusGlow 0.6s ease-out;
    }
    
    @keyframes statusGlow {
      0% {
        box-shadow: 0 0 0 0 currentColor;
        border-color: #e5e7eb;
      }
      40% {
        box-shadow: 0 0 0 4px currentColor;
        border-color: currentColor;
      }
      100% {
        box-shadow: 0 0 0 0 currentColor;
        border-color: #e5e7eb;
      }
    }
    
    /* Card transition styles */
    .card-wrapper {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-wrapper.animating {
      transition: none !important;
    }
    
    /* Smooth section transitions */
    .section-container {
      transition: all 0.3s ease;
    }
    
    .section-container .row {
      transition: all 0.3s ease;
    }
      .device-icon-wrapper.position-relative.active.monitoring {
    display: none !important;
}
    
  `

  // Effects
  useEffect(() => {
    if (isInitialized && Object.keys(dnsMap).length > 0) {
      setLoading(false)
    }
  }, [isInitialized, dnsMap])

  // Function that runs when all things are loaded - only once
  // Use a stable key based on dnsMap content to avoid re-running when object reference changes
  const dnsMapKeys = useMemo(() => Object.keys(dnsMap || {}).sort().join(','), [dnsMap])
  
  useEffect(() => {
    // Only run if page is fully loaded (loading is false), initialized, we have data, haven't called onAllLoaded yet
    if (!loading && isInitialized && dnsMapKeys.length > 0 && !hasCalledOnAllLoadedRef.current) {
      hasCalledOnAllLoadedRef.current = true // Mark as called immediately to prevent re-entry
      
      // Execute the logic directly instead of using onAllLoaded to avoid infinite loops
      const executeOnAllLoaded = async () => {
        //console.log('All data loaded successfully!')
        
        // Get active call IDs from localStorage (currentState != DISCONNECTED) - use ref to avoid dependency issues
        const activeCallIds = getActiveCallIdsFromLocalStorageRef.current()
        //console.log('Active call IDs from localStorage (currentState != DISCONNECTED):', activeCallIds)
        
        // Call GetCallLegs with the call IDs if we have any - only once
        if (activeCallIds && activeCallIds.length > 0 && !hasCalledGetCallLegsRef.current) {
          hasCalledGetCallLegsRef.current = true // Mark as called before making the request
          try {
            const params = {
              callIds: activeCallIds
            }
            
            const response = await GetCallLegs(params)
            console.log('GetCallLegs response:', response)
          } catch (error) {
            console.error('Error calling GetCallLegs:', error)
            hasCalledGetCallLegsRef.current = false // Reset on error so it can retry if needed
          }
        } else {
          //console.log('No active call IDs found in localStorage')
        }
      }
      
      executeOnAllLoaded()
    }
  }, [loading, isInitialized, dnsMapKeys])

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
  }, [openMenuDn])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    //console.log('Popup state changed:', showPopup)
  }, [showPopup])

  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = customStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [customStyles])

  useEffect(() => {
    if (eventLog && eventLog.length > 0) {
      // console.log('=== CTI Event Log ===')
      // eventLog.forEach((event, index) => {
      //   console.log(`Event ${index + 1}:`, event)
      //   console.log('Event Type:', event.type || 'Unknown')
      //   console.log('Event Data:', event.data || event)
      //   console.log('Timestamp:', event.timestamp || new Date().toISOString())
      //   console.log('---')
      // })
    }
  }, [eventLog])

  // Constants
  const toneLabels = {
    NONE: 'No Tone',
    LOCAL: 'Notify Me',
    REMOTE: 'Notify Agent',
    BOTH: 'Notify Both'
  }

  const getDeviceIconClass = (deviceType: string) => {
    switch (deviceType) {
      case 'SOFT':
        return 'material-icons-two-tone'
      case 'HARD':
        return 'material-icons-two-tone'
      case 'ANDROID':
        return 'material-icons-two-tone'
      case 'IOS':
        return 'material-icons-two-tone'
      default:
        return 'material-icons-two-tone'
    }
  }

  const handleMonitorSelect = (dn: string, monitorType: string, devices: CtiDevice[]) => {
    setSelectedMonitor((prev) => ({ ...prev, [dn]: monitorType }))
    setTempMonitorSelection((prev) => ({ ...prev, [dn]: monitorType }))
    // Automatically set tone to 'NONE' as default
    setSelectedTone((prev) => ({ ...prev, [dn]: 'NONE' }))
  }

  const handleToneSelect = (dn: string, toneType: string) => {
    setSelectedTone((prev) => ({ ...prev, [dn]: toneType }))
  }

  const handleBargeInSelect = (dn: string) => {
    setSelectedMonitor((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))
    setTempMonitorSelection((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))
    // Automatically set tone to 'NONE' as default
    setSelectedTone((prev) => ({ ...prev, [dn]: 'NONE' }))
  }

  const resetMonitorSelection = () => {
    if (showPopup?.dn) {
      setSelectedMonitor((prev) => ({ ...prev, [showPopup.dn]: '' }))
      setTempMonitorSelection((prev) => ({ ...prev, [showPopup.dn]: '' }))
      setSelectedTone((prev) => ({ ...prev, [showPopup.dn]: 'NONE' }))
    }
  }

  // Helper function to create API payload
  const createMonitoringPayload = (
    monitorDeviceType: string,
    monitorDeviceName: string,
    monitoredDeviceType: string,
    monitoredDeviceName: string,
    type: string,
    tone: string,
    monitor: string,
    monitoredDeviceDn: string
  ) => {
    return {
      monitorDeviceType,
      monitorDeviceName,
      monitoredDeviceType,
      monitoredDeviceName,
      type,
      tone,
      monitor,
      monitoredDeviceDn
    }
  }

  // Helper function to get user's available devices
  const getUserDevices = () => {
    if (!userAddress || !dnsMap[userAddress]) return []
    
    const devices = Object.values(dnsMap[userAddress].devices || {})
    return devices.map(device => ({
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      terminalState: device.terminalState,
      when: new Date().toISOString(),
      details: `Status: ${device.terminalState}`
    }))
  }

  // Check if user has multiple devices
  const hasMultipleDevices = () => {
    const devices = getUserDevices()
    return devices.length > 1
  }

  const startMonitoringLocal = async (dn: string, monitorType: string, toneType?: string) => {
    // Default tone to 'NONE' if not provided
    const finalToneType = toneType || 'NONE'

    // Get monitored device info
    const monitoredDevice = dnsMap[dn]?.devices?.[showPopup?.deviceName || '']
    if (!monitoredDevice) {
      console.error('Monitored device not found')
      setNotification({ type: 'danger', message: 'Monitored device not found' })
      return false
    }

    // Check if user has multiple devices for monitoring
    if (hasMultipleDevices()) {
      // Show device selection modal
      setAvailableDevices(getUserDevices())
      setPendingMonitoringData({
        dn,
        monitorType,
        toneType: finalToneType,
        monitoredDeviceName: monitoredDevice.deviceName,
        monitoredDeviceType: monitoredDevice.deviceType
      })
      setShowDeviceSelectionModal(true)
      return false // Don't proceed yet, wait for device selection
    } else {
      // Use the only available device
      const userDevices = getUserDevices()
      if (userDevices.length === 0) {
        console.error('No user devices available')
        setNotification({ type: 'danger', message: 'No user devices available for monitoring' })
        return false
      }
      
      const monitorDevice = userDevices[0]
    
      return await executeMonitoring(dn, monitorType, finalToneType, monitorDevice, monitoredDevice)
    }
  }

  // Execute monitoring with selected devices
  const executeMonitoring = async (
    dn: string, 
    monitorType: string, 
    toneType: string, 
    monitorDevice: any, 
    monitoredDevice: CtiDevice
  ) => {
    // Create API payload
    const payload = createMonitoringPayload(
      monitorDevice.deviceType,
      monitorDevice.deviceName,
      monitoredDevice.deviceType,
      monitoredDevice.deviceName,
      monitorType,
      toneType,
      userAddress,
      monitoredDevice.dn,
    )

    // Console log the payload
    //console.log('Monitoring API Payload:', payload);
    setShowPageLoader(true);


    try {
      let response;
      
      // Use appropriate API based on monitoring type
      if (monitorType === 'BARGE_IN') {
        //console.log('Calling startBargeInMonitoring API...')
        response = await startBargeInMonitoring(payload).finally(() => {
          setShowPageLoader(false);
        });
      } else {
        // For SILENT and WHISPER monitoring
       // console.log('Calling startMonitoring API...')
        response = await startMonitoring(payload).finally(() => {
          setShowPageLoader(false);
        });
      }

      if (response.success) {
        setShowPageLoader(false);
       // console.log(`${monitorType} monitoring started successfully for:`, dn)
        setActiveMonitoring({ 
          dn, 
          type: monitorType, 
          deviceName: showPopup?.deviceName || undefined 
        })
        setMonitoringStartTime(prev => ({ ...prev, [dn]: new Date() }))

        const message = `Started ${monitorType.toLowerCase().replace('_', ' ')} monitoring for ${dn} with ${toneType} tone`
        setNotification({ type: 'success', message })
        return true
      } else {
        setShowPageLoader(false);
       // console.error('Failed to start monitoring:', response.error)
        setNotification({ type: 'danger', message: response.error || 'Failed to start monitoring' })
        return false
      }
    } catch (error) {
      setShowPageLoader(false);
     // console.error('Error starting monitoring:', error)
      setNotification({ type: 'danger', message: 'Error starting monitoring' })
      return false
    }
  }

  const stopSilentMonitoring = async (dn: string) => {
    try {
      // Get user's device info for stop monitoring
      const userDevices = getUserDevices()
      if (userDevices.length === 0) {
        console.error('No user devices available for stopping monitoring')
        return false
      }
      
      const monitorDevice = userDevices[0]
      const stopParams = {
        monitorDeviceType: monitorDevice.deviceType,
        monitorDeviceName: monitorDevice.deviceName,
        monitor: userAddress || ''
      }

      setShowPageLoader(true);
      const response = await stopMonitoringAPI(stopParams).finally(() => {
        setShowPageLoader(false);
      });
      
      if (response.success) {
        setShowPageLoader(false);
        
        return true
      } else {
        console.error('Failed to stop silent monitoring:', response.error)
        return false
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error stopping silent monitoring:', error)
      return false
    }
  }

  const stopWhisperMonitoring = async (dn: string) => {
    try {
      // Get user's device info for stop monitoring
      const userDevices = getUserDevices()
      if (userDevices.length === 0) {
        console.error('No user devices available for stopping monitoring')
        return false
      }
      
      const monitorDevice = userDevices[0]
      const stopParams = {
        monitorDeviceType: monitorDevice.deviceType,
        monitorDeviceName: monitorDevice.deviceName,
        monitor: userAddress || ''
      }

      console.log('Stopping whisper monitoring with params:', stopParams)
      setShowPageLoader(true);
      const response = await stopMonitoringAPI(stopParams).finally(() => {
        setShowPageLoader(false);
      });
      
      if (response.success) {
        setShowPageLoader(false);
        //console.log('Whisper monitoring stopped successfully for:', dn)
        return true
      } else {
        setShowPageLoader(false);
        console.error('Failed to stop whisper monitoring:', response.error)
        return false
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error stopping whisper monitoring:', error)
      return false
    }
  }

  const stopBargeInMonitoringLocal = async (dn: string) => {
    try {
      // Get user's device info for stop monitoring
      const userDevices = getUserDevices()
      if (userDevices.length === 0) {
        console.error('No user devices available for stopping monitoring')
        return false
      }
      
      const monitorDevice = userDevices[0]
      const stopParams = {
        monitorDeviceType: monitorDevice.deviceType,
        monitorDeviceName: monitorDevice.deviceName,
        monitor: userAddress || ''
      }

      setShowPageLoader(true);
      const response = await stopBargeInMonitoringAPI(stopParams).finally(() => {
        setShowPageLoader(false);
      });
      
      if (response.success) {
        setShowPageLoader(false);
        //console.log('Barge-in monitoring stopped successfully for:', dn)
        return true
      } else {
        setShowPageLoader(false);
        console.error('Failed to stop barge-in monitoring:', response.error)
        return false
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error stopping barge-in monitoring:', error)
      return false
    }
  }

  // Device selection handlers
  const handleDeviceSelect = (device: any) => {
    console.log('Device selected for monitoring:', device)
    
    if (!pendingMonitoringData) {
      console.error('No pending monitoring data found')
      setNotification({ type: 'danger', message: 'No pending monitoring data found' })
      return
    }

    // Get monitored device info
    const monitoredDevice = dnsMap[pendingMonitoringData.dn]?.devices?.[pendingMonitoringData.monitoredDeviceName]
    if (!monitoredDevice) {
      console.error('Monitored device not found')
      setNotification({ type: 'danger', message: 'Monitored device not found' })
      return
    }

    // Execute monitoring with selected device
    executeMonitoring(
      pendingMonitoringData.dn,
      pendingMonitoringData.monitorType,
      pendingMonitoringData.toneType,
      device,
      monitoredDevice
    )

    // Close modal and reset state
    setShowDeviceSelectionModal(false)
    setAvailableDevices([])
    setPendingMonitoringData(null)
  }

  const handleDeviceSelectionCancel = () => {
    setShowDeviceSelectionModal(false)
    setAvailableDevices([])
    setPendingMonitoringData(null)
  }

  const stopMonitoring = async (dn: string, type: string) => {
    let success = false

    switch (type) {
      case 'SILENT':
        success = await stopSilentMonitoring(dn)
        break
      case 'WHISPER':
        success = await stopWhisperMonitoring(dn)
        break
      case 'BARGE_IN':
        success = await stopBargeInMonitoringLocal(dn)
        break
      default:
        console.error('Unknown monitoring type:', type)
        return false
    }

    if (success) {
      setActiveMonitoring({ dn: null, type: null, deviceName: null })
      setMonitoringStartTime(prev => {
        const newState = { ...prev }
        delete newState[dn]
        return newState
      })

      setSelectedMonitor((prev) => {
        const newState = { ...prev }
        delete newState[dn]
        return newState
      })

      setSelectedTone((prev) => {
        const newState = { ...prev }
        delete newState[dn]
        return newState
      })

      setTempMonitorSelection((prev) => {
        const newState = { ...prev }
        delete newState[dn]
        return newState
      })

      setNotification({
        type: 'success',
        message: `Stopped ${type.toLowerCase().replace('_', ' ')} monitoring for ${dn}`
      })

      setShowPopup(null)
    } else {
      setNotification({
        type: 'danger',
        message: `Failed to stop ${type.toLowerCase().replace('_', ' ')} monitoring for ${dn}`
      })
    }

    return success
  }

  const isDnInActiveCall = (dn: string) => {
    const call = getDnCallState(dn)
    if (!call || !call.parties) return false
    const activeParticipants = call.parties.filter(
      (p: any) =>
        (p.callingAddress === dn || p.calledAddress === dn) &&
        (p.callStatus === 'CONNECTED' || p.callStatus === 'ON_HOLD')
    )
    return activeParticipants.length > 0
  }

  const getIcon = (state: string, conf: boolean, isOneToOne: boolean, role: string, parties: any[] = [], dn: string) => {
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

  const getColor = (state: string, conf: boolean, isOneToOne: boolean, role: string, parties: any[] = [], dn: string, terminalState: string) => {
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
    // If all parties are dropped, return terminal state color instead of conference/call color
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

    // Only show conference color if not all parties are dropped
    if (conf && !isOneToOne && !allDropped) return '#6f42c1'

    // Handle HELD state directly if no parties or if state is already HELD
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
      RINGING: role === 'calling' ? '#d97706' : '#dc2626', // calling: orange, incoming: red
      ANSWERED: '#059669', // connected: green
      CONNECTED: '#059669', // connected: green
      RETRIEVED: '#059669', // connected: green
      HELD: '#2563eb' // held: blue
    }[effectiveState as keyof typeof getColor] || '#6c757d'
  }

  const getText = (state: string, isConference: boolean, isOneToOne: boolean, parties: any[] = [], dn: string) => {
    const filtered = parties.filter((p: any) => p.callingAddress === dn || p.calledAddress === dn)
    if (!filtered.length) return dn
    
    const allDropped = filtered.every((p: any) => p.callStatus === 'DROPPED')
    // If all parties are dropped, don't show conference/call text, just return DN
    if ((state === 'DROPPED' || state === 'DISCONNECTED' || allDropped) && allDropped) {
      return dn
    }
    
    // Only show Conference text if not all parties are dropped
    if (isConference && !isOneToOne && !allDropped) return 'Conference'
    
    // Handle HELD state directly if no parties or if state is already HELD
    if (state === 'HELD') return 'On Hold'
    
    const activeParty = filtered.find((p: any) => p.callStatus !== 'DROPPED') || filtered[0]
    
    let effectiveState = state
    if ((state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped) {
      if (activeParty.callStatus === 'CONNECTED') effectiveState = 'ANSWERED'
      else if (activeParty.callStatus === 'ON_HOLD') effectiveState = 'HELD'
    }
    
    const isCaller = activeParty.callingAddress === dn
    const isCallee = activeParty.calledAddress === dn
    
    // Debug logging
    // console.log('getText debug:', {
    //   state,
    //   effectiveState,
    //   isConference,
    //   isOneToOne,
    //   parties: parties.length,
    //   dn,
    //   activeParty: activeParty?.callStatus
    // })
    
    const stateMap = {
      RINGING: isCaller ? 'Calling' : isCallee ? 'Incoming' : effectiveState,
      ANSWERED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
      RETRIEVED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
      HELD: 'On Hold',
      CONNECTED: isCaller ? 'Outgoing' : isCallee ? 'Connected' : effectiveState,
      ON_HOLD: 'On Hold'
    }
    
    const result = stateMap[effectiveState as keyof typeof stateMap] || effectiveState
   // console.log('getText result:', result, 'for state:', effectiveState)
    return result
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
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Calls" showPageLoader={showPageLoader} />

      {/* Header */}
      


      <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={5}>
                      
                      <h2 className="mb-0">Live View</h2>
                    </Col>


                    <Col md={7} className="d-flex justify-content-end">
                      
                    <div className="action-buttons d-flex gap-2">
                       
                    {session?.user?.permissions?.includes('dial-call-cti') && (
              <Link 
                href="/cti/dialer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary d-flex align-items-center"
              >
                <i className="material-icons-two-tone me-2 text-white">open_in_new</i>
                Dialer
              </Link>
              )}
              
              <Button
                variant="info"
                size="sm"
                onClick={toggleFullscreen}
                className="d-flex align-items-center"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </i>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              
              {/* Debug Animation Button */}

                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

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
      <Row className="mt-3">
        <Col md={12}>
        <div className="container-fluid pt-3 pb-3">
                {(() => {
                  // Use the global getSectionColor function

                  // Group DNs by sections
                  const dnsList = Object.values(dnsMap)
                  const sections = {
                    supervision: [] as any[],
                    onCall: [] as any[],
                    activeIdle: [] as any[],
                    downOffline: [] as any[]
                  }

                  dnsList.forEach(({ dn, devices }) => {
                    const deviceList = Object.values(devices || {})
                    const call = getDnCallState(dn)
                    const active = hasActiveCalls(dn)
                    const section = categorizeDns(dn, deviceList, call, active)
                    
                    sections[section as keyof typeof sections].push({ dn, devices: deviceList, call, active })
                  })

                  // Define section order
                  const sectionOrder = ['supervision', 'onCall', 'activeIdle', 'downOffline']

                  return sectionOrder.map(sectionKey => {
                    const sectionDns = sections[sectionKey as keyof typeof sections]
                    const hasContent = sectionDns.length > 0

                    return (
                      <div key={sectionKey} className="mb-3 section-card-header" data-section={sectionKey} style={{ borderColor: getSectionColor(sectionKey) }}>
                        <div className="d-flex align-items-center justify-content-between card-header-top-section">
                          <div className="d-flex align-items-center">
                            <i className="material-icons-two-tone me-2" style={{ fontSize: '1.5rem' }}>
                              {getSectionIcon(sectionKey)}
                            </i>
                            <h6 className="mb-0 app-title-heading">{getSectionTitle(sectionKey)}</h6>
                          </div>
                           <span className="badge" style={{ backgroundColor: getSectionColor(sectionKey) }}>{sectionDns.length}</span>
                        </div>
                        {/* Progress Bar */}
                        
                        
                        {sectionDns.length > 0 && (
                          <>
                          <div className="progress-container">
                          <div className="progress" style={{ height: '6px', backgroundColor: '#e9ecef' }}>
                            <div 
                              className="progress-bar" 
                              role="progressbar" 
                              style={{ 
                                width: `${summaryData.extensions > 0 ? (sectionDns.length / summaryData.extensions) * 100 : 0}%`,
                                backgroundColor: getSectionColor(sectionKey),
                                transition: 'width 0.3s ease'
                              }}
                              aria-valuenow={sectionDns.length}
                              aria-valuemin={0}
                              aria-valuemax={summaryData.extensions}
                            ></div>
                          </div>
                        </div>
                          </>
                        )}
                        
                        <div className={`card-body-section ${hasContent ? 'has-content' : ''}`} data-section={sectionKey}>
                          {hasContent ? (
                            <div className="row g-3 justify-content-left align-items-left m-0">
                          {sectionDns.map(({ dn, devices: deviceList, call, active }) => {


                          
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

                            //console.log('callColor', callColor)

                            const cardClasses = `card-wrapper position-relative ${animatingCards.has(dn) ? 'animating' : ''}`

                            return (
                              <div key={dn} className="col-6 col-sm-4 col-md-3 col-lg-2 m-0 mb-3">
                                <div className={cardClasses}>
                                  <div 
                                    className={`card text-white ${cls} shadow-sm position-relative mb-0 new-card-design ${
                                      cardAnimations[dn] ? `card-${cardAnimations[dn]}` : ''
                                    }`}
                                    data-dn={dn}
                                    style={{
                                      borderColor: getSectionColor(sectionKey),
                                      boxShadow: `${getSectionColor(sectionKey)}40`,
                                      height: '100%',
                                      minHeight: '140px'
                                    }}
                                    >
                                    {/* Hover Overlay - Hidden when call is in supervision */}
                                    {!(sectionKey === 'supervision' || (activeMonitoring.dn === dn && activeMonitoring.type)) && (
                                      <div className="card-hover-overlay">
                                        <p>
                                          <strong>EXT:</strong> <span>{dn}</span>
                                        </p>

                                        {/* {call?.parties && call?.parties.length > 0 && ( */}
                                          <>
                                          <p>
                                            <strong>From:</strong> <span>{call?.parties[0]?.callingAddress || 'N/A'}</span>
                                          </p>
                                       
                                          <p>
                                            <strong>To:</strong> <span>{call?.parties[0]?.calledAddress || 'N/A'}</span>
                                          </p>
                                          </>
                                        {/* )} */}

                                        {/* {active && call && (
                                          <p className="small mb-0" style={{ color: callColor, padding: '2px',fontWeight: 'bold',textTransform: 'uppercase' }}>
                                            {(() => {
                                              
                                              const result = getText(
                                                call.currentState || '',
                                                call.isConference || false,
                                                call.isOneToOne || false,
                                                call.parties || [],
                                                dn
                                              )
                                              
                                              return result
                                            })()}
                                          </p>
                                        )} */}
                                      </div>
                                    )}

                                    {/* Section 1: Information Section */}
                                    <div className="card-info-section">
                                      <div className="user-avatar">
                                        <img src={UserDummyImage.src} alt="User" />
                                      </div>
                                      <div className="user-info">
                                        <h6 className="extension-number" title={dn}>{dn}</h6>
                                        <p className="user-name">User name</p>
                                        <p className="status-text">
                                          <span className="status-indicator" style={{ display: 'inline-block',width: '10px', height: '10px',borderRadius: '50%',marginRight: '5px',backgroundColor: getSectionColor(sectionKey) }}></span>
                                        {getSectionTitle(sectionKey)}
                                        </p>
                                      </div>
                                      {/* <div className="card-actions">
                                        <div 
                                          ref={(el) => { popoverRefs.current[dn] = el }}
                                          className="more-options"
                                          onClick={() => handlePopoverToggle(dn)}
                                        >
                                          <i className="material-icons-two-tone">more_vert</i>
                                          </div>
                                         
                                        
                                      </div> */}
                                    </div>

                                    {active && call && (
                                    <div className="card-timer-section" style={{ color: callColor }}>
                                   
                                          <p className=" mb-0">
                                            {(() => {
                                              
                                              const result = getText(
                                                call.currentState || '',
                                                call.isConference || false,
                                                call.isOneToOne || false,
                                                call.parties || [],
                                                dn
                                              )
                                              
                                              return result
                                            })()}
                                          </p>
                                       
                                        <CallTimer 
                                          dn={dn}
                                          isActive={active && call ? true : false} 
                                        />
                                    </div>
                                     )}

                                    {/* Stop Monitoring Button - Visible when monitoring is active */}
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

                                    {/* Section 2: Device Dropdown Section */}
                                    {/* <div className="device-dropdown-section">
                                      <select className="device-dropdown">
                                        <option value="">Select Device</option>
                                        {deviceList.map((device: CtiDevice) => (
                                          <option key={device.deviceName} value={device.deviceName}>
                                            {device.deviceName} ({device.terminalState})
                                          </option>
                                        ))}
                                      </select>
                                    </div> */}

                                    {/* Section 3: Current Device Icons Section */}
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

                                          const getDeviceTypeLabel = (type: string) => {
                                            switch (type) {
                                              case 'SOFT':
                                                return 'Soft'
                                              case 'HARD':
                                                return 'Phone'
                                              case 'ANDROID':
                                                return 'Android'
                                              case 'IOS':
                                                return 'iPhone'
                                              default:
                                                return ''
                                            }
                                          }

                                          const deviceCall = getCallStateForDevice(dn, deviceName)
                                          const isDeviceActiveCall =
                                            deviceCall &&
                                            ['CONNECTED', 'ON_HOLD', 'ANSWERED','RETRIEVED'].includes(deviceCall.currentState || '')

                                          return (
                                            <div 
                                              key={deviceName}
                                              className={`device-icon-wrapper position-relative ${isDeviceActiveCall ? 'active' : ''} ${
                                                activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName === deviceName ? 'monitoring' : ''
                                              }`}
                                              title={`${getDeviceTypeLabel(deviceType)}`}
                                              onClick={() => {
                                                // Check if user has any monitoring permissions
                                                const hasMonitoringPermissions = session?.user?.permissions?.some(permission => 
                                                  ['silent-monitoring-cti', 'whisper-monitoring-cti', 'barge-in-cti'].includes(permission)
                                                )
                                                
                                                // Allow opening popup if:
                                                // 1. Device has active call (for starting monitoring)
                                                // 2. This device is currently being monitored (for stopping monitoring)
                                                const isCurrentlyMonitored = activeMonitoring.dn === dn && 
                                                                              activeMonitoring.deviceName === deviceName && 
                                                                              activeMonitoring.type
                                                
                                                if (isDeviceActiveCall || isCurrentlyMonitored) {
                                                  if (hasMonitoringPermissions) {
                                                   
                                                    // If already monitoring, restore the state so stop button shows in modal
                                                    if (isCurrentlyMonitored && activeMonitoring.type) {
                                                      setSelectedMonitor((prev) => ({ ...prev, [dn]: activeMonitoring.type! }))
                                                      setTempMonitorSelection((prev) => ({ ...prev, [dn]: activeMonitoring.type! }))
                                                      // Preserve existing tone selection if available
                                                      if (!selectedTone[dn]) {
                                                        // Try to get from previous selection or set a default
                                                        setSelectedTone((prev) => ({ ...prev, [dn]: prev[dn] || 'NONE' }))
                                                      }
                                                    } else {
                                                      // New monitoring session - reset selections, default tone to 'NONE'
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
                                              }}
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
                          })}
                            </div>
                          ) : (
                            <>
                            {/* <div className="empty-section-placeholder">
                              <i className="material-icons-two-tone" style={{ fontSize: '1.5rem', color: getSectionColor(sectionKey) }}>{getSectionIcon(sectionKey)}</i>
                              <p className="mb-0">No devices in {getSectionTitle(sectionKey).toLowerCase()}</p>
                              <small>
                                {sectionKey === 'supervision' && 'No devices are currently being monitored'}
                                {sectionKey === 'onCall' && 'No devices are currently on active calls'}
                                {sectionKey === 'activeIdle' && 'No devices are currently online and available'}
                                {sectionKey === 'downOffline' && 'No devices are currently offline or down'}
                              </small>
                            </div> */}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
                {loading && (
                  <div className="col-12 text-center">
                    <div className="loading-spinner">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
        </Col>
      </Row>

      {/* Device Options Popup Modal */}
      <Modal
        show={!!showPopup}
        onHide={() => setShowPopup(null)}
        size="sm"
        centered
        backdrop="static"
      >
        <Modal.Header className="d-flex align-items-center justify-content-between">
          <Modal.Title>
            <div className="text-center">
              <span className="small">Agent - {showPopup?.dn} - Monitoring</span>
            </div>
          </Modal.Title>
            <FiX size={20} onClick={() => setShowPopup(null)} style={{ cursor: 'pointer' }} />
        </Modal.Header>
        <Modal.Body>
          {showPopup && activeMonitoring.dn === showPopup.dn && activeMonitoring.type && 
           activeMonitoring.deviceName === showPopup.deviceName ? (
            <div className="text-center">
              <p className="mb-3">
                Currently monitoring with
              </p>
              <span className="status-badge primary mb-3 d-block">
              <strong>{activeMonitoring.type}</strong>
              </span>
              <div>
                {/* <p className="mb-2 small text-muted">
                  Tone: <strong>{selectedTone[showPopup.dn] || 'N/A'}</strong>
                </p>
                <p className="mb-3 small text-muted">
                  Device: <strong>{showPopup.deviceName}</strong>
                </p> */}
                <Button
                  variant="danger"
                  onClick={() => stopMonitoring(showPopup.dn, activeMonitoring.type!)}
                  className="w-100"
                >
                  {/* <i className="material-icons-two-tone me-2" style={{ fontSize: '1.2rem', verticalAlign: 'middle' }}>
                    stop
                  </i> */}
                  Stop Monitoring
                </Button>
              </div>
            </div>
          ) : showPopup ? (
            <>
              {!session?.user?.permissions?.some(permission => 
                ['silent-monitoring-cti', 'whisper-monitoring-cti', 'barge-in-cti'].includes(permission)
              ) ? (
                <div className="text-center text-muted">
                  <i className="material-icons-two-tone mb-2" style={{ fontSize: '2rem' }}>lock</i>
                  <p>You do not have permission to monitor calls.</p>
                  <small>Contact your administrator to request monitoring permissions.</small>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 text-left">Monitor Type Selection</h6>
                    <div className="row g-2">
                  {session?.user?.permissions?.includes('silent-monitoring-cti') && (
                    <div className="col-6">
                      <Button
                        variant={selectedMonitor[showPopup.dn] === 'SILENT' ? 'danger' : 'primary'}
                        disabled={
                          (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'SILENT') ||
                          !isDnInActiveCall(showPopup.dn)
                        }
                        onClick={() =>
                          handleMonitorSelect(showPopup.dn, 'SILENT', Object.values(dnsMap[showPopup.dn]?.devices || {}))
                        }
                        className="w-100 text-center d-inline-block app-button"
                        size="sm"
                      >
                        Silent
                      </Button>
                    </div>
                  )}
                  {session?.user?.permissions?.includes('whisper-monitoring-cti') && (
                    <div className="col-6">
                      <Button
                        variant={selectedMonitor[showPopup.dn] === 'WHISPER' ? 'danger' : 'primary'}
                        disabled={
                          (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'WHISPER') ||
                          !isDnInActiveCall(showPopup.dn)
                        }
                        onClick={() =>
                          handleMonitorSelect(showPopup.dn, 'WHISPER', Object.values(dnsMap[showPopup.dn]?.devices || {}))
                        }
                        className="w-100 text-center d-inline-block app-button"
                        size="sm"
                      >
                        Whisper
                      </Button>
                    </div>
                  )}
                  {session?.user?.permissions?.includes('barge-in-cti') && (
                    <div className="col-12">
                      <Button
                        variant={selectedMonitor[showPopup.dn] === 'BARGE_IN' ? 'danger' : 'primary'}
                        disabled={!isDnInActiveCall(showPopup.dn)}
                        onClick={() => handleBargeInSelect(showPopup.dn)}
                        className="w-100 text-center d-inline-block app-button"
                        size="sm"
                      >
                        Barge In
                      </Button>
                    </div>
                  )}
                    </div>
                  </div>

                  {/* Tone Selection is hidden - default tone is 'NONE' */}

                  {tempMonitorSelection[showPopup.dn] && (
                    <div className="">
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        
                        <span className="small text-muted d-block me-2 mb-1">
                          Monitor type selected
                        </span>
                        <span className="small status-badge primary d-block">
                        <strong>{tempMonitorSelection[showPopup.dn]}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="default" 
            className="app-button btn-sm"
            disabled={!showPopup?.dn || !tempMonitorSelection[showPopup.dn]}
            onClick={() => resetMonitorSelection()}
          >
            Reset
          </Button>
          <Button 
            variant="primary" 
            className="app-button btn-sm" 
            onClick={() => {
              if (showPopup?.dn && tempMonitorSelection[showPopup.dn]) {
                // Use selected tone or default to 'NONE'
                const toneToUse = selectedTone[showPopup.dn] || 'NONE'
                startMonitoringLocal(showPopup.dn, tempMonitorSelection[showPopup.dn] as 'SILENT' | 'WHISPER' | 'BARGE_IN', toneToUse)
                setShowPopup(null)
              }
            }}
            disabled={
              !showPopup?.dn || 
              !tempMonitorSelection[showPopup.dn] ||
              !session?.user?.permissions?.includes(
                tempMonitorSelection[showPopup.dn] === 'SILENT' ? 'silent-monitoring-cti' :
                tempMonitorSelection[showPopup.dn] === 'WHISPER' ? 'whisper-monitoring-cti' :
                tempMonitorSelection[showPopup.dn] === 'BARGE_IN' ? 'barge-in-cti' : ''
              )
            }
          >
            Start Monitoring
          </Button>
        </Modal.Footer>
      </Modal>

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

    </React.Fragment>
  )
}

LiveCallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default LiveCallDashboard
