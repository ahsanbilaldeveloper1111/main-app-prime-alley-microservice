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

import Link from 'next/link'
import { clearAllLocalStorage, getLocalStorageInfo } from '../../utils/localStorageUtils'
import { useSession } from 'next-auth/react';
import { startMonitoring, stopMonitoring as stopMonitoringAPI, startBargeInMonitoring, stopBargeInMonitoring as stopBargeInMonitoringAPI } from '@utils/dialer'

import '@assets/scss/common.scss';
import '@assets/scss/live-calls.scss';
import { FiX } from 'react-icons/fi'
import './live-calls-test.scss'


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

// Simulation User interface
interface SimulationUser {
  id: number
  name: string
  status: 'supervision' | 'oncall' | 'online' | 'offline'
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
  const {
    summaryData,
    dnsMap,
    error,
    isInitialized,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    eventLog,
    userAddress,
    syncPersistedCallStates
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
  const [simulationUsers, setSimulationUsers] = useState<SimulationUser[]>([
    { id: 584, name: "User One", status: "oncall" },
    { id: 583, name: "User Two", status: "oncall" },
    { id: 502, name: "User Three", status: "online" },
    { id: 513, name: "User Four", status: "online" },
    { id: 521, name: "User Five", status: "online" },
    { id: 525, name: "User Six", status: "online" },
    { id: 541, name: "User Seven", status: "online" },
    { id: 542, name: "User Eight", status: "online" },
    { id: 543, name: "User Nine", status: "online" },
    { id: 545, name: "User Ten", status: "online" },
    { id: 546, name: "User Eleven", status: "online" },
    { id: 562, name: "User Twelve", status: "online" },
    { id: 578, name: "User Thirteen", status: "online" },
    { id: 579, name: "User Fourteen", status: "online" },
    { id: 580, name: "User Fifteen", status: "online" },
    { id: 581, name: "User Sixteen", status: "online" },
    { id: 582, name: "User Seventeen", status: "online" },
    { id: 587, name: "User Eighteen", status: "online" },
    { id: 511, name: "User Nineteen", status: "offline" }
  ])
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
    
    // Check if DN is being monitored (In Supervision)
    if (activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName) {
      return 'supervision'
    }
    
    // Check if DN has active calls (On Call)
    if (active && call) {
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

  // Simulation categorization function
  const categorizeSimulationUser = (user: SimulationUser) => {
    return user.status
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
    console.log(`${action} action for:`, dn)
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
      case 'oncall':
        return 'On Call'
      case 'online':
        return 'Active/Idle'
      case 'offline':
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
      case 'oncall':
        return 'call'
      case 'online':
        return 'check_circle'
      case 'offline':
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
      case 'oncall':
        return '#dc3545' // Red for active calls
      case 'online':
        return '#28a745' // Green for active/idle
      case 'offline':
        return '#6c757d' // Gray for down/offline
      default:
        return '#6c757d'
    }
  }

  // Helper function to get section order for direction calculation
  const getSectionOrder = (section: string) => {
    switch (section) {
      case 'supervision': return 0
      case 'oncall': return 1
      case 'online': return 2
      case 'offline': return 3
      default: return 3
    }
  }

  // Simulation functions
  const simulateUserStatusChange = () => {
    if (!isSimulationMode) return
    
    const randomUser = simulationUsers[Math.floor(Math.random() * simulationUsers.length)]
    const STATUSES: SimulationUser['status'][] = ["supervision", "oncall", "online", "offline"]
    let newStatus: SimulationUser['status']
    
    do {
      newStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)]
    } while (newStatus === randomUser.status)
    
    setSimulationUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === randomUser.id ? { ...user, status: newStatus } : user
      )
    )
  }

  // Toggle simulation mode
  const toggleSimulationMode = () => {
    setIsSimulationMode(!isSimulationMode)
  }

  // Start/stop simulation
  useEffect(() => {
    if (isSimulationMode) {
      simulationIntervalRef.current = setInterval(simulateUserStatusChange, 5000)
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [isSimulationMode, simulationUsers])

  // FLIP Animation functions - Exact copy from reference code
  const animateCardMove = useCallback((dn: string, fromSection: string, toSection: string) => {
    console.log(`Starting FLIP animation for ${dn} from ${fromSection} to ${toSection}`)
    
    // Get the stored BEFORE position from ref
    const first = cardPositionsRef.current[dn]
    if (!first) {
      console.log(`No stored BEFORE position for ${dn}`)
      return
    }
    
    console.log(`Using stored BEFORE position for ${dn}:`, first)

    // Get the card in its new position
    const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
    if (!card) {
      console.log(`Card not found for ${dn}`)
      return
    }

    // Get the AFTER position
    const last = card.getBoundingClientRect()
    console.log(`AFTER position for ${dn}:`, last)

    // Calculate the differences
    const dx = first.x - last.left
    const dy = first.y - last.top
    const sx = first.width / last.width
    const sy = first.height / last.height

    console.log(`FLIP calculations for ${dn}:`, { dx, dy, sx, sy })

    // Apply the FLIP animation
    card.style.transition = 'none'
    card.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`
    card.classList.add('anim-moving')

    // Force a reflow
    card.getBoundingClientRect()

    // Animate to the final position
    requestAnimationFrame(() => {
      card.style.transition = 'transform .55s cubic-bezier(.2,.9,.2,1)'
      card.style.transform = 'none'
    })

    // Clean up after animation
    const handleTransitionEnd = () => {
      card.classList.remove('anim-moving')
      card.style.transition = ''
      card.style.transform = ''
      setAnimatingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(dn)
        return newSet
      })
      card.removeEventListener('transitionend', handleTransitionEnd)
    }
    card.addEventListener('transitionend', handleTransitionEnd)

    // Glow effect when returning to a known section
    const remembered = lastPositions[dn]?.[toSection]
    if (remembered !== undefined) {
      card.classList.add('return-glow')
      setTimeout(() => card.classList.remove('return-glow'), 600)
    }
  }, [lastPositions])

  // Store card positions before re-render
  const storeCardPositions = useCallback(() => {
    const cards = document.querySelectorAll('[data-dn]')
    cards.forEach(card => {
      const dn = card.getAttribute('data-dn')
      if (dn) {
        const rect = card.getBoundingClientRect()
        cardPositionsRef.current[dn] = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }
      }
    })
  }, [])

  // Check for section changes and trigger animations
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const dnsList = Object.values(dnsMap)
    const currentSections: { [dn: string]: string } = {}
    
    dnsList.forEach(({ dn, devices }) => {
      const deviceList = Object.values(devices || {})
      const call = getDnCallState(dn)
      const active = hasActiveCalls(dn)
      const section = categorizeDns(dn, deviceList, call, active)
      currentSections[dn] = section
    })

    // Check for changes and trigger animations
    Object.keys(currentSections).forEach(dn => {
      const currentSection = currentSections[dn]
      const previousSection = previousSectionsRef.current[dn]
      
      if (previousSection && previousSection !== currentSection) {
        console.log(`Section change detected for ${dn}: ${previousSection} -> ${currentSection}`)
        setAnimatingCards(prev => new Set(prev).add(dn))
        animateCardMove(dn, previousSection, currentSection)
      }
    })

    // Update previous sections
    previousSectionsRef.current = currentSections
  }, [isInitialized, dnsMap, userAddress, getDnCallState, hasActiveCalls, animateCardMove])

  // Store positions before re-render
  useLayoutEffect(() => {
    storeCardPositions()
  })

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Handle fullscreen change
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
  const categorizedDns = useMemo(() => {
    if (!isInitialized || !dnsMap) return {}
    
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

    return sections
  }, [isInitialized, dnsMap, userAddress, getDnCallState, hasActiveCalls])

  // Memoize simulation data
  const categorizedSimulationUsers = useMemo(() => {
    if (!isSimulationMode) return {
      supervision: [] as SimulationUser[],
      oncall: [] as SimulationUser[],
      online: [] as SimulationUser[],
      offline: [] as SimulationUser[]
    }
    
    const sections = {
      supervision: [] as SimulationUser[],
      oncall: [] as SimulationUser[],
      online: [] as SimulationUser[],
      offline: [] as SimulationUser[]
    }

    simulationUsers.forEach(user => {
      const section = categorizeSimulationUser(user)
      sections[section as keyof typeof sections].push(user)
    })

    return sections
  }, [isSimulationMode, simulationUsers])

  // Rest of the component functions (monitoring, device selection, etc.)
  // ... (keeping the existing functions from live-calls page)

  // Error and loading states
  if (error) {
    return (
      <div className="alert alert-danger m-3">
        Connection Error: {error}
      </div>
    )
  }

  if (!isInitialized && !isSimulationMode) {
    return (
      <div className="alert alert-info m-3">
        Connecting to server...
      </div>
    )
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Calls Test" />

      {/* Header */}
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Live View Test</h2>
              </Col>

              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons d-flex gap-2">
                  <Button
                    variant={isSimulationMode ? "danger" : "success"}
                    size="sm"
                    onClick={toggleSimulationMode}
                    className="d-flex align-items-center"
                  >
                    <i className="material-icons-two-tone me-2">
                      {isSimulationMode ? 'stop' : 'play_arrow'}
                    </i>
                    {isSimulationMode ? 'Stop Simulation' : 'Start Simulation'}
                  </Button>
                  
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

      {/* Dashboard */}
      <Row className="mt-3">
        <Col md={12}>
          <div className="container-fluid pt-3 pb-3">
            {isSimulationMode ? (
              // Simulation Mode
              <div className="dashboard">
                <div className="control-bar">
                  <h1>
                    <span className="material-icons">dashboard</span>
                    Live View Test - Simulation Mode
                  </h1>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Automatic simulation running…
                  </span>
                </div>

                {['supervision', 'oncall', 'online', 'offline'].map(sectionKey => {
                  const sectionUsers = categorizedSimulationUsers[sectionKey as keyof typeof categorizedSimulationUsers] || []
                  const hasContent = sectionUsers.length > 0

                  return (
                    <div key={sectionKey} className="dashboard-section">
                      <div className="section-header">
                        <span className="material-icons">{getSectionIcon(sectionKey)}</span>
                        {getSectionTitle(sectionKey)}
                        <div className="count-badge">{sectionUsers.length}</div>
                      </div>
                      <div className="card-grid" id={`${sectionKey}Grid`}>
                        {hasContent && sectionUsers.map((user: SimulationUser) => (
                          <div
                            key={user.id}
                            className={`user-card status-${user.status}`}
                            data-id={user.id}
                          >
                            <div className="card-id">{user.id}</div>
                            <div className="user-name">{user.name}</div>
                            <div className="status-text">
                              <span className="status-indicator"></span>
                              <span>{user.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Real CTI Mode
              <div>
                {(() => {
                  // Group DNs by sections
                  const dnsList = Object.values(dnsMap || {})
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
                        
                        {sectionDns.length > 0 && (
                          <>
                            <div className="progress-container">
                              <div className="progress" style={{ height: '6px', backgroundColor: '#e9ecef' }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar" 
                                  style={{ 
                                    width: `${summaryData?.extensions > 0 ? (sectionDns.length / summaryData.extensions) * 100 : 0}%`,
                                    backgroundColor: getSectionColor(sectionKey),
                                    transition: 'width 0.3s ease'
                                  }}
                                  aria-valuenow={sectionDns.length}
                                  aria-valuemin={0}
                                  aria-valuemax={summaryData?.extensions || 0}
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
                                        <div className="card-hover-overlay">
                                          <p>
                                            <strong>EXT:</strong> <span>{dn}</span>
                                          </p>
                                          <p>
                                            <strong>Status:</strong> <span>{cls}</span>
                                          </p>
                                          {active && call && (
                                            <p>
                                              <strong>Call State:</strong> <span>{call.currentState || 'Unknown'}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center text-muted py-4">
                              <i className="material-icons-two-tone" style={{ fontSize: '3rem', opacity: 0.3 }}>
                                {getSectionIcon(sectionKey)}
                              </i>
                              <p className="mt-2 mb-0">No {getSectionTitle(sectionKey).toLowerCase()} extensions</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </React.Fragment>
  )
}

LiveCallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default LiveCallDashboard