import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react'
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
  console.log('CallTimer render:', { dn, isActive, elapsedTime, isRunning })
  
  if (!isActive) {
    return null
  }

  return (
    <p className={`call-timer ${isRunning ? 'running' : ''}`}>{elapsedTime}</p>
  )
}

const CtiDashboard = () => {
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
  
  // Initialize previous sections when data is first loaded
  useEffect(() => {
    if (isInitialized && dnsMap && Object.keys(previousSections).length === 0) {
      const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
      const initialSections: { [dn: string]: string } = {}
      
      dnsList.forEach(({ dn, devices }) => {
        const deviceList = Object.values(devices || {})
        const call = getDnCallState(dn)
        const active = hasActiveCalls(dn)
        const section = categorizeDns(dn, deviceList, call, active)
        initialSections[dn] = section
      })
      
      setPreviousSections(initialSections)
    }
  }, [isInitialized, dnsMap, userAddress, getDnCallState, hasActiveCalls, previousSections])
  
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

  // FLIP Animation functions
  const animateCardMove = useCallback((dn: string, fromSection: string, toSection: string) => {
    console.log(`Starting FLIP animation for ${dn} from ${fromSection} to ${toSection}`)
    
    // Get the stored first position
    const first = cardPositions[dn]
    if (!first) {
      console.log(`No stored position for ${dn}`)
      return
    }

    // Mark as animating
    setAnimatingCards(prev => new Set(Array.from(prev).concat(dn)))

    // Get the card in its new position
    const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
    if (!card) {
  
      setAnimatingCards(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(dn)
        return newSet
      })
      return
    }

    const last = card.getBoundingClientRect()

    // Calculate the difference
    const dx = first.x - last.left
    const dy = first.y - last.top
    const sx = first.width / last.width
    const sy = first.height / last.height


    // Apply the FLIP animation
    card.style.transition = 'none'
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    card.classList.add('anim-moving')

    // Force reflow
    card.offsetHeight

    // Animate to final position
    requestAnimationFrame(() => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      card.style.transform = 'translate(0, 0) scale(1)'
    })

    // Add return glow if returning to a known position
    setLastPositions(prevLastPositions => {
      const remembered = prevLastPositions[dn]?.[toSection]
      if (remembered !== undefined) {
        card.classList.add('return-glow')
        setTimeout(() => card.classList.remove('return-glow'), 600)
      }
      return prevLastPositions
    })

    // Clean up after animation
    const handleTransitionEnd = () => {
      card.classList.remove('anim-moving')
      card.style.transition = ''
      card.style.transform = ''
      setAnimatingCards(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(dn)
        return newSet
      })
      card.removeEventListener('transitionend', handleTransitionEnd)
     
    }

    card.addEventListener('transitionend', handleTransitionEnd, { once: true })
  }, [cardPositions])

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
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err)
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

  // Handle FLIP animations when cards change sections
  useEffect(() => {
    if (!isInitialized || !dnsMap) return

    const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
    const newPreviousSections: { [dn: string]: string } = {}
    const animationsToTrigger: Array<{ dn: string; fromSection: string; toSection: string }> = []
    
    dnsList.forEach(({ dn, devices }) => {
      const deviceList = Object.values(devices || {})
      const call = getDnCallState(dn)
      const active = hasActiveCalls(dn)
      const currentSection = categorizeDns(dn, deviceList, call, active)
      const previousSection = previousSections[dn]
      
      // Store the new section for this DN
      newPreviousSections[dn] = currentSection
      
      // If section changed, trigger FLIP animation
      if (previousSection && previousSection !== currentSection) {
        
        // Get the current position BEFORE React re-renders
        const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
        if (card) {
          const first = card.getBoundingClientRect()
          
          // Store the position for the animation
          setCardPositions(prev => ({
            ...prev,
            [dn]: { x: first.left, y: first.top, width: first.width, height: first.height }
          }))
          
          // Queue animation to trigger after state updates
          animationsToTrigger.push({ dn, fromSection: previousSection, toSection: currentSection })
        } else {
          
        }
      }
    })
    
    // Update all previous sections in one batch
    setPreviousSections(prev => ({
      ...prev,
      ...newPreviousSections
    }))
    
    // Trigger animations after state updates with longer delay
    if (animationsToTrigger.length > 0) {
      setTimeout(() => {
        animationsToTrigger.forEach(({ dn, fromSection, toSection }) => {
          animateCardMove(dn, fromSection, toSection)
        })
      }, 100) // Increased delay to ensure DOM is updated
    }
  }, [dnsMap, isInitialized, userAddress, hasActiveCalls, getDnCallState, activeMonitoring, animateCardMove, getSectionKey])


  // Clear CTI call states on page load
  useEffect(() => {
    const clearCtiCallStates = () => {
      try {
        // Clear specific CTI call states
        localStorage.removeItem('cti_call_states')
        localStorage.removeItem('cti_call_states_timestamp')
        
      } catch (error) {
        console.error('Error clearing call states:', error)
      }
    }

    // Clear on component mount
    clearCtiCallStates()
  }, [])

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
    
    /* FLIP Animation Styles */
    .anim-moving {
      z-index: 1000 !important;
      pointer-events: none !important;
      border-width: 3px !important;
    }
    
    .return-glow {
      box-shadow: 0 0 20px rgba(255, 193, 7, 0.6) !important;
      animation: returnGlow 0.6s ease-out;
    }
    
    @keyframes returnGlow {
      0% {
        box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
      }
      100% {
        box-shadow: 0 0 0 rgba(255, 193, 7, 0);
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
    
  `

  // Effects
  useEffect(() => {
    if (isInitialized && Object.keys(dnsMap).length > 0) {
      setLoading(false)
    }
  }, [isInitialized, dnsMap])

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
    console.log('Popup state changed:', showPopup)
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

  // Helper functions
  const getCardLevelStatus = (devices: CtiDevice[]) => {
    if (!devices || devices.length === 0) return 'unregistered'
    if (devices.some(d => d.terminalState === 'REGISTERED')) return 'registered'
    if (devices.some(d => d.terminalState === 'STALE')) return 'stale'
    return 'unregistered'
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

    console.log('Selected Monitor:', dn, monitorType)
    console.log('dn:', dn)
    console.log('devices:', devices)
    console.log('Monitor type selected, waiting for tone selection...')
  }

  const handleToneSelect = (dn: string, toneType: string) => {
    setSelectedTone((prev) => ({ ...prev, [dn]: toneType }))

    if (tempMonitorSelection[dn] && toneType) {
      startMonitoringLocal(dn, tempMonitorSelection[dn] as 'SILENT' | 'WHISPER' | 'BARGE_IN', toneType)
    }

    console.log('Selected Tone:', dn, toneType)
    console.log('dn:', dn)
  }

  const handleBargeInSelect = (dn: string) => {
    setSelectedMonitor((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))
    setTempMonitorSelection((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))

    console.log('Selected Barge In:', dn)
    console.log('dn:', dn)
    console.log('Barge In selected, waiting for tone selection...')
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
    if (!toneType) {
      console.error('Tone is required for all monitoring types')
      setNotification({ type: 'danger', message: 'Tone selection is required to start monitoring' })
      return false
    }

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
        toneType,
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
      return await executeMonitoring(dn, monitorType, toneType, monitorDevice, monitoredDevice)
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
    console.log('Monitoring API Payload:', payload)

    try {
      let response;
      
      // Use appropriate API based on monitoring type
      if (monitorType === 'BARGE_IN') {
        console.log('Calling startBargeInMonitoring API...')
        response = await startBargeInMonitoring(payload)
      } else {
        // For SILENT and WHISPER monitoring
        console.log('Calling startMonitoring API...')
        response = await startMonitoring(payload)
      }

      if (response.success) {
        console.log(`${monitorType} monitoring started successfully for:`, dn)
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
        console.error('Failed to start monitoring:', response.error)
        setNotification({ type: 'danger', message: response.error || 'Failed to start monitoring' })
        return false
      }
    } catch (error) {
      console.error('Error starting monitoring:', error)
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

      console.log('Stopping silent monitoring with params:', stopParams)
      const response = await stopMonitoringAPI(stopParams)
      
      if (response.success) {
        console.log('Silent monitoring stopped successfully for:', dn)
        return true
      } else {
        console.error('Failed to stop silent monitoring:', response.error)
        return false
      }
    } catch (error) {
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
      const response = await stopMonitoringAPI(stopParams)
      
      if (response.success) {
        console.log('Whisper monitoring stopped successfully for:', dn)
        return true
      } else {
        console.error('Failed to stop whisper monitoring:', response.error)
        return false
      }
    } catch (error) {
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

      console.log('Stopping barge-in monitoring with params:', stopParams)
      const response = await stopBargeInMonitoringAPI(stopParams)
      
      if (response.success) {
        console.log('Barge-in monitoring stopped successfully for:', dn)
        return true
      } else {
        console.error('Failed to stop barge-in monitoring:', response.error)
        return false
      }
    } catch (error) {
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
    if (conf && !isOneToOne) return '#6f42c1'

    // Handle HELD state directly if no parties or if state is already HELD
    if (state === 'HELD') return '#2563eb'
    
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
    if ((state === 'DROPPED' || state === 'DISCONNECTED') && allDropped) {
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
    if (isConference && !isOneToOne) return 'Conference'
    
    // Handle HELD state directly if no parties or if state is already HELD
    if (state === 'HELD') return 'On Hold'
    
    const filtered = parties.filter((p: any) => p.callingAddress === dn || p.calledAddress === dn)
    if (!filtered.length) return dn
    
    const allDropped = filtered.every((p: any) => p.callStatus === 'DROPPED')
    const activeParty = filtered.find((p: any) => p.callStatus !== 'DROPPED') || filtered[0]
    
    let effectiveState = state
    if ((state === 'DROPPED' || state === 'DISCONNECTED') && !allDropped) {
      if (activeParty.callStatus === 'CONNECTED') effectiveState = 'ANSWERED'
      else if (activeParty.callStatus === 'ON_HOLD') effectiveState = 'HELD'
    }
    
    if ((effectiveState === 'DROPPED' || effectiveState === 'DISCONNECTED') && allDropped) return dn
    
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
      <div className="alert alert-info m-3">
        Connecting to server...
      </div>
    )
  }

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Calls" />

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

     


       {/* CTI Summary Cards */}
       {/* <PageSummaryGrid 
         cards={[
           {
             id: 'total-extensions',
             title: 'Total Extensions',
             value: summaryData.extensions,
             description: 'All extensions in the system',
             delay: 0.1,
             animationDuration: 1000,
             fontStyle: 'style-2'
           },
          //  {
          //    id: 'in-supervision',
          //    title: 'In Supervision',
          //    value: (() => {
          //      const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
          //      return dnsList.filter(({ dn, devices }) => {
          //        const deviceList = Object.values(devices || {})
          //        const call = getDnCallState(dn)
          //        const active = hasActiveCalls(dn)
          //        return categorizeDns(dn, deviceList, call, active) === 'supervision'
          //      }).length
          //    })(),
          //    description: 'Extensions being monitored',
          //    delay: 0.2,
          //    animationDuration: 1000,
          //    fontStyle: 'style-2'
          //  },
           {
             id: 'on-call',
             title: 'On Call',
             value: (() => {
               const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
               return dnsList.filter(({ dn, devices }) => {
                 const deviceList = Object.values(devices || {})
                 const call = getDnCallState(dn)
                 const active = hasActiveCalls(dn)
                 return categorizeDns(dn, deviceList, call, active) === 'onCall'
               }).length
             })(),
             description: 'Extensions with active calls',
             delay: 0.3,
             animationDuration: 1000,
             fontStyle: 'style-2'
           },
           {
             id: 'active-idle',
             title: 'Active/Idle',
             value: (() => {
               const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
               return dnsList.filter(({ dn, devices }) => {
                 const deviceList = Object.values(devices || {})
                 const call = getDnCallState(dn)
                 const active = hasActiveCalls(dn)
                 return categorizeDns(dn, deviceList, call, active) === 'activeIdle'
               }).length
             })(),
             description: 'Online and available extensions',
             delay: 0.4,
             animationDuration: 1000,
             fontStyle: 'style-2'
           },
           {
             id: 'down-offline',
             title: 'Down/Offline',
             value: (() => {
               const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
               return dnsList.filter(({ dn, devices }) => {
                 const deviceList = Object.values(devices || {})
                 const call = getDnCallState(dn)
                 const active = hasActiveCalls(dn)
                 return categorizeDns(dn, deviceList, call, active) === 'downOffline'
               }).length
             })(),
             description: 'Offline or down extensions',
             delay: 0.5,
             animationDuration: 1000,
             fontStyle: 'style-2'
           }
         ]}
       /> */}




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
                  const dnsList = Object.values(dnsMap).filter(({ dn }) => dn !== userAddress)
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
                                    {/* Hover Overlay */}
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
                                        {deviceList.map((device: CtiDevice) => {
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
                                              title={`${deviceName} (${terminalState})`}
                                              onClick={() => {
                                                if (isDeviceActiveCall) {
                                                  console.log('Opening popup for:', dn, deviceName)
                                                  setShowPopup({ dn: dn, deviceName })
                                                  handleMonitorSelect(dn, 'SILENT', Object.values(dnsMap[dn]?.devices || {}))
                                                } else if (terminalState === 'STALE') {
                                                  console.log('Device is STALE, popup disabled')
                                                } else {
                                                  console.log('Device not in active call, popup disabled')
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
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <i className="ti ti-settings me-2"></i>
              <span>Extension - {showPopup?.dn}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showPopup && activeMonitoring.dn === showPopup.dn && activeMonitoring.type ? (
            <div className="text-center">
              <p className="mb-3">
                Currently monitoring with: <strong>{activeMonitoring.type}</strong>
              </p>
              <div>
                <p className="mb-2 small text-muted">
                  Tone: <strong>{selectedTone[showPopup.dn] || 'Not selected'}</strong>
                </p>
                <Button
                  variant="danger"
                  onClick={() => stopMonitoring(showPopup.dn, activeMonitoring.type!)}
                  disabled={!selectedTone[showPopup.dn]}
                >
                  Stop{' '}
                  {activeMonitoring.type === 'SILENT'
                    ? 'Silent'
                    : activeMonitoring.type === 'WHISPER'
                      ? 'Barge In'
                      : 'Barge In'}
                </Button>
              </div>
            </div>
          ) : showPopup ? (
            <>
              <div className="mb-4">
                <h6 className="fw-bold mb-3 text-center">Monitor Type</h6>
                <div className="row g-2">
                  <div className="col-6">
                    <Button
                      variant={selectedMonitor[showPopup.dn] === 'SILENT' ? 'primary' : 'outline-primary'}
                      disabled={
                        (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'SILENT') ||
                        !isDnInActiveCall(showPopup.dn)
                      }
                      onClick={() =>
                        handleMonitorSelect(showPopup.dn, 'SILENT', Object.values(dnsMap[showPopup.dn]?.devices || {}))
                      }
                      className="w-100"
                      size="sm"
                    >
                      Silent
                    </Button>
                  </div>
                  <div className="col-6">
                    <Button
                      variant={selectedMonitor[showPopup.dn] === 'WHISPER' ? 'primary' : 'outline-primary'}
                      disabled={
                        (tempMonitorSelection[showPopup.dn] && tempMonitorSelection[showPopup.dn] !== 'WHISPER') ||
                        !isDnInActiveCall(showPopup.dn)
                      }
                      onClick={() =>
                        handleMonitorSelect(showPopup.dn, 'WHISPER', Object.values(dnsMap[showPopup.dn]?.devices || {}))
                      }
                      className="w-100"
                      size="sm"
                    >
                      Whisper
                    </Button>
                  </div>
                  <div className="col-12">
                    <Button
                      variant={selectedMonitor[showPopup.dn] === 'BARGE_IN' ? 'primary' : 'outline-primary'}
                      disabled={!isDnInActiveCall(showPopup.dn)}
                      onClick={() => handleBargeInSelect(showPopup.dn)}
                      className="w-100"
                      size="sm"
                    >
                      Barge In
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold mb-3 text-center">Tone</h6>
                <div className="row g-2">
                  {Object.entries(toneLabels).map(([key, label]) => {
                    const isDisabled = !tempMonitorSelection[showPopup.dn] || !isDnInActiveCall(showPopup.dn)

                    return (
                      <div key={key} className="col-6">
                        <Button
                          variant={selectedTone[showPopup.dn] === key ? 'success' : 'outline-secondary'}
                          disabled={isDisabled}
                          onClick={isDisabled ? undefined : () => handleToneSelect(showPopup.dn, key)}
                          size="sm"
                          className="w-100"
                        >
                          {label}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {tempMonitorSelection[showPopup.dn] && (
                <div className="">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="material-icons-two-tone me-2">info</i>
                    <span>
                      Monitor type selected: <strong>{tempMonitorSelection[showPopup.dn]}</strong>
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPopup(null)}>
            Close
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

CtiDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDashboard
