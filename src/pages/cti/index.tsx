import React, { ReactElement, useEffect, useState, useCallback } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, Dropdown } from 'react-bootstrap'
import { DashboardData } from '@utils/GsmManagement'
import { toast } from 'react-toastify'
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import '@assets/scss/gsm-dashboard.scss'
import AnimatedNumber from '@components/AnimatedNumber'
import moment from 'moment'
import useCtiStomp from '../../hooks/useCtiStomp'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { set } from 'nprogress'
import Link from 'next/link'
import { clearAllLocalStorage, getLocalStorageInfo } from '../../utils/localStorageUtils'
import { useSession } from 'next-auth/react';

const baseUrl = ''
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

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
      console.log('=== CTI Event Log ===')
      eventLog.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, event)
        console.log('Event Type:', event.type || 'Unknown')
        console.log('Event Data:', event.data || event)
        console.log('Timestamp:', event.timestamp || new Date().toISOString())
        console.log('---')
      })
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
      startMonitoring(dn, tempMonitorSelection[dn] as 'SILENT' | 'WHISPER' | 'BARGE_IN', toneType)
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

  const startMonitoring = async (dn: string, monitorType: string, toneType?: string) => {
    if (!toneType) {
      console.error('Tone is required for all monitoring types')
      setNotification({ type: 'danger', message: 'Tone selection is required to start monitoring' })
      return false
    }

    console.log(`${monitorType} monitoring started successfully for:`, dn)
    setActiveMonitoring({ dn, type: monitorType, deviceName: showPopup?.deviceName || undefined })
    setMonitoringStartTime(prev => ({ ...prev, [dn]: new Date() }))

    const message = `Started ${monitorType.toLowerCase().replace('_', ' ')} monitoring for ${dn} with ${toneType} tone`
    setNotification({ type: 'success', message })

    return true
  }

  const stopSilentMonitoring = async (dn: string) => {
    return true
    try {
      const response = await fetch(`${baseUrl}/api/cti/stop-silent-monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dn })
      })

      if (response.ok) {
        console.log('Silent monitoring stopped successfully for:', dn)
        return true
      } else {
        console.error('Failed to stop silent monitoring for:', dn)
        return false
      }
    } catch (error) {
      console.error('Error stopping silent monitoring:', error)
      return false
    }
  }

  const stopWhisperMonitoring = async (dn: string) => {
    return true
  }

  const stopBargeInMonitoring = async (dn: string) => {
    return true
    try {
      const response = await fetch(`${baseUrl}/api/cti/stop-barge-in-monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dn })
      })

      if (response.ok) {
        console.log('Barge in monitoring stopped successfully for:', dn)
        return true
      } else {
        console.error('Failed to stop barge in monitoring for:', dn)
        return false
      }
    } catch (error) {
      console.error('Error stopping barge in monitoring:', error)
      return false
    }
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
        success = await stopBargeInMonitoring(dn)
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
      RINGING: role === 'calling' ? 'red' : 'green',
      ANSWERED: 'green',
      CONNECTED: 'green',
      RETRIEVED: 'green',
      HELD: 'white'
    }[effectiveState as keyof typeof getColor] || '#6c757d'
  }

  const getText = (state: string, isConference: boolean, isOneToOne: boolean, parties: any[] = [], dn: string) => {
    if (isConference && !isOneToOne) return 'Call in Progress'
    
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
    
    return {
      RINGING: isCaller ? 'Calling' : isCallee ? 'Incoming' : effectiveState,
      ANSWERED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
      RETRIEVED: isCaller ? 'Outgoing' : isCallee ? 'CONNECTED' : effectiveState,
      HELD: 'On Hold'
    }[effectiveState as keyof typeof getText] || effectiveState
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
        Connecting to CTI server...
      </div>
    )
  }

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="CTI" />

      {/* Header */}
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex justify-content-between">
            <h2 className="mb-0">CTI</h2>
            <div className="d-flex gap-2">
              {/* <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="d-flex align-items-center"
              >
                <i className="material-icons-two-tone me-2">bug_report</i>
                {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
              </Button> */}
              
              {/* <Button
                variant="primary"
                onClick={() => setShowDialer(true)}
                className="d-flex align-items-center"
              >
                <i className="material-icons-two-tone me-2">dialpad</i>
                Dialer
              </Button> */}

              {session?.user?.permissions?.includes('dial-call-cti') && (
              <Link 
                href="/cti/dialer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-primary d-flex align-items-center"
              >
                <i className="material-icons-two-tone me-2">open_in_new</i>
                Dialer
              </Link>
              )}

            </div>
          </div>
        </Col>
      </Row>

      {/* Debug Information */}
      {showDebugInfo && (
        <Row className="mb-3">
          <Col md={12}>
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="material-icons-two-tone me-2">bug_report</i>
                  Debug Information - Call State Persistence
                </h6>
              </div>
              <div className="card-body">
                <Row>
                  <Col md={6}>
                    <h6>LocalStorage Call States</h6>
                    {(() => {
                      const info = getLocalStorageInfo()
                      return (
                        <div>
                          <p><strong>Total Keys:</strong> {info.totalKeys}</p>
                          <p><strong>CTI Keys:</strong> {info.ctiKeys}</p>
                          <p><strong>App Keys:</strong> {info.appKeys}</p>
                          <p><strong>Total Size:</strong> {info.totalSize}</p>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={clearLocalStorageCallStates}
                            className="mt-2"
                          >
                            <i className="material-icons-two-tone me-2">clear</i>
                            Clear All LocalStorage
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={syncPersistedCallStates}
                            className="mt-2 ms-2"
                            disabled={!isInitialized}
                          >
                            <i className="material-icons-two-tone me-2">sync</i>
                            Sync with Server
                          </Button>
                        </div>
                      )
                    })()}
                  </Col>
                  <Col md={6}>
                    <h6>Current Call States</h6>
                    <p><strong>Active Calls:</strong> {Object.keys(eventLog.filter(e => e.type === 'call-events')).length}</p>
                    <p><strong>Total Events:</strong> {eventLog.length}</p>
                    <p><strong>Last Event:</strong> {eventLog.length > 0 ? new Date(eventLog[eventLog.length - 1]?.timestamp || Date.now()).toLocaleString() : 'None'}</p>
                    <p><strong>Restored from Storage:</strong> {restoredCallStates}</p>
                  </Col>
                </Row>
                {(() => {
                  const info = getLocalStorageCallStatesInfo()
                  if (info.data && Object.keys(info.data).length > 0) {
                    return (
                      <Row className="mt-3">
                        <Col md={12}>
                          <h6>Persisted Call Details</h6>
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Call ID</th>
                                  <th>Event Type</th>
                                  <th>Parties</th>
                                  <th>Status</th>
                                  <th>Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(info.data).map(([callId, callEvent]: [string, any]) => (
                                  <tr key={callId}>
                                    <td><code>{callId.substring(0, 8)}...</code></td>
                                    <td>{callEvent.eventType || callEvent.currentState}</td>
                                    <td>
                                      {callEvent.parties?.map((p: any, idx: number) => (
                                        <div key={idx} className="small">
                                          {p.callingAddress} → {p.calledAddress} ({p.callStatus})
                                        </div>
                                      ))}
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        callEvent.isTerminating ? 'bg-danger' : 'bg-success'
                                      }`}>
                                        {callEvent.isTerminating ? 'Terminated' : 'Active'}
                                      </span>
                                    </td>
                                    <td>{new Date(callEvent.eventTime).toLocaleTimeString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Col>
                      </Row>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* Statistics Cards */}
      <Row>
        <Col md={3}>
          <div className="card statistics-card-1">
            <div className="card-body">
              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
              <div className="d-flex align-items-center">
                <div className="avtar bg-brand-color-1 text-white me-3">
                  <i className="material-icons-two-tone text-white">call</i>
                </div>
                <div>
                  <p className="text-muted mb-0">Extensions</p>
                  <div className="d-flex align-items-end">
                    {summaryData.extensions > 0 ? (
                      <AnimatedNumber value={summaryData.extensions} duration={1000} />
                    ) : (
                      <h2 className="mb-0 f-w-500">0</h2>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="card statistics-card-1">
            <div className="card-body">
              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
              <div className="d-flex align-items-center">
                <div className="avtar bg-brand-color-1 text-white me-3">
                  <i className="material-icons-two-tone text-white">call</i>
                </div>
                <div>
                  <p className="text-muted mb-0">Online Devices</p>
                  <div className="d-flex align-items-end">
                    {summaryData.online > 0 ? (
                      <AnimatedNumber value={summaryData.online} duration={1000} />
                    ) : (
                      <h2 className="mb-0 f-w-500">0</h2>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="card statistics-card-1">
            <div className="card-body">
              <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
              <div className="d-flex align-items-center">
                <div className="avtar bg-brand-color-1 text-white me-3">
                  <i className="material-icons-two-tone text-white">call</i>
                </div>
                <div>
                  <p className="text-muted mb-0">On Hold</p>
                  <div className="d-flex align-items-end">
                    <h2 className="mb-0 f-w-500">{summaryData.on_hold}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="card statistics-card-1">
            <div className="card-body">
              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
              <div className="d-flex align-items-center">
                <div className="avtar bg-brand-color-1 text-white me-3">
                  <i className="material-icons-two-tone text-white">call</i>
                </div>
                <div>
                  <p className="text-muted mb-0">Connected</p>
                  <div className="d-flex align-items-end">
                    {summaryData.connected > 0 ? (
                      <AnimatedNumber value={summaryData.connected} />
                    ) : (
                      <h2 className="mb-0 f-w-500">0</h2>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
          <div className="card">
            <div className="card-header">
              <h5>
                <i className="material-icons-two-tone me-2">table_chart</i>
                CTI Extensions
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table cti-table">
                  <thead>
                    <tr>
                      <th className="text-center">Extension</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Call Status</th>
                      <th className="text-center">Devices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(dnsMap).map(({ dn, devices }) => {
                      const deviceList = Object.values(devices || {})
                      const call = getDnCallState(dn)
                      const active = hasActiveCalls(dn)
                      const cls = getCardLevelStatus(deviceList)

                      return (
                        <tr key={dn} className={cls}>
                          <td className="text-center">
                            <div className="extension-number">
                              <i className="material-icons-two-tone extension-icon">phone</i>
                              <strong>{dn}</strong>
                            </div>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                cls === 'registered'
                                  ? 'bg-success'
                                  : cls === 'unregistered'
                                    ? 'bg-danger'
                                    : 'bg-warning'
                              }`}
                            >
                              {cls === 'registered'
                                ? 'ONLINE'
                                : cls === 'unregistered'
                                  ? 'OFFLINE'
                                  : 'STALE'
                              }
                            </span>
                          </td>
                          <td className="text-center">
                            {active && call ? (
                              <div className="call-status-container">
                                <div
                                  className="call-status-text"
                                  style={{
                                    color: getColor(
                                      call.currentState || '',
                                      call.isConference || false,
                                      call.isOneToOne || false,
                                      call.role || '',
                                      call.parties || [],
                                      dn,
                                      cls
                                    )
                                  }}
                                >
                                  {getText(
                                    call.currentState || '',
                                    call.isConference || false,
                                    call.isOneToOne || false,
                                    call.parties || [],
                                    dn
                                  )}
                                </div>
                                {/* Show "from extension" for incoming calls */}
                                {getText(
                                  call.currentState || '',
                                  call.isConference || false,
                                  call.isOneToOne || false,
                                  call.parties || [],
                                  dn
                                ) === 'Incoming' &&
                                  call.parties &&
                                  call.parties.length > 0 && (
                                    <div className="call-details small text-muted mt-1">
                                      Caller:{' '}
                                      <b>
                                        {call.parties.find(p => p.calledAddress === dn)?.callingAddress || 'Unknown'}
                                      </b>
                                    </div>
                                  )}
                                {/* Show "from extension" for call started (RETRIEVED) calls */}
                                {getText(
                                  call.currentState || '',
                                  call.isConference || false,
                                  call.isOneToOne || false,
                                  call.parties || [],
                                  dn
                                ) === 'Call Started' &&
                                  call.parties &&
                                  call.parties.length > 0 && (
                                    <div className="call-details small text-muted mt-1">
                                      Caller:{' '}
                                      <b>
                                        {call.parties.find(p => p.calledAddress === dn)?.callingAddress || 'Unknown'}
                                      </b>
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="badge bg-secondary">IDLE</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="device-grid">
                              {deviceList
                               // .filter(device => device.terminalState !== 'STALE')
                                .map(({ deviceName, deviceType, terminalState }) => {
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
                                    //console.log('deviceCall', deviceCall)

                                  return (
                                    <div key={deviceName} className="d-flex align-items-center">
                                      <div
                                        className={`device-icon ${isDeviceActiveCall ? 'active' : ''} ${
                                          activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName === deviceName ? 'monitoring' : ''
                                        }`}
                                        title={`${deviceName} (${terminalState})`}
                                        onClick={() => { //terminalState !== 'STALE' &&
                                          if ( isDeviceActiveCall) {
                                            console.log('Opening popup for:', dn, deviceName)
                                            setShowPopup({ dn: dn, deviceName })
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
                                            fontSize: '1.2rem',
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
                                      
                                      {/* Individual Stop Button for Monitored Device */}
                                      {activeMonitoring.dn === dn && activeMonitoring.type && activeMonitoring.deviceName === deviceName && (
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => stopMonitoring(dn, activeMonitoring.type!)}
                                          className="ms-1 device-stop-btn"
                                          title={`Stop ${activeMonitoring.type === 'SILENT' ? 'Silent' : 
                                                   activeMonitoring.type === 'WHISPER' ? 'Whisper' : 
                                                   'Barge In'} Monitoring`}
                                        >
                                         
                                          <span className="device-stop-label">
                                            Stop {activeMonitoring.type === 'SILENT' ? 'Silent' : 
                                             activeMonitoring.type === 'WHISPER' ? 'Whisper' : 
                                             'Barge In'} Monitoring
                                          </span>
                                        </Button>
                                      )}
                                    </div>
                                  )
                                })}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {loading && (
                      <tr>
                        <td colSpan={4} className="text-center">
                          <div className="loading-spinner">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    
                  </tbody>
                </table>
              </div>
            </div>
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

      


    </React.Fragment>
  )
}

CtiDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDashboard
