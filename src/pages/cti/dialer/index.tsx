import React, { ReactElement, useState, useEffect } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Row, Modal, Form, Alert } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Link from 'next/link'
import useCtiStomp from '../../../hooks/useCtiStomp'
import { makeCall, getCallingDeviceInfo } from '../../../utils/dialer'

const CtiDialer = () => {
  // CTI Socket hook integration
  const {
    summaryData,
    dnsMap,
    error,
    isInitialized,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    eventLog,
    syncPersistedCallStates,
    userAddress
  } = useCtiStomp()

  // State for dialer functionality
  const [dialedNumber, setDialedNumber] = useState('')
  const [isDialing, setIsDialing] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'onHold' | 'ended' | 'ringing'>('idle')
  const [showCallStatus, setShowCallStatus] = useState(false)
  const [showInvalidWarning, setShowInvalidWarning] = useState(false)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState<number>(0)
  const [callHistory, setCallHistory] = useState<Array<{
    id: string
    number: string
    status: string
    startTime: Date
    endTime?: Date
    duration?: number
  }>>([])
  const [activeCall, setActiveCall] = useState<{
    id: string
    number: string
    startTime: Date
    status: string
    callId?: string
    callingAddress?: string
    calledAddress?: string
    callingDeviceName?: string
    callingDeviceType?: string
  } | null>(null)
  const [extensionSearch, setExtensionSearch] = useState('')
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set())

  // Get available extension numbers for validation
  const getAvailableExtensionNumbers = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .map(({ dn }) => dn)
  }

  // Check if dialed number is from available extensions
  const isDialedNumberValid = (number: string) => {
    const availableExtensions = getAvailableExtensionNumbers()
    return availableExtensions.includes(number)
  }

  // Filter extensions based on search
  const getFilteredExtensions = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .filter(({ dn }) => 
        extensionSearch === '' || 
        dn.toLowerCase().includes(extensionSearch.toLowerCase())
      )
  }

  // Helper function to get card level status (same as main CTI page)
  const getCardLevelStatus = (devices: any[]) => {
    if (!devices || devices.length === 0) return 'unregistered'
    if (devices.some(d => d.terminalState === 'REGISTERED')) return 'registered'
    if (devices.some(d => d.terminalState === 'STALE')) return 'stale'
    return 'unregistered'
  }

  // Helper function to check if DN is in active call
  const isDnInActiveCall = (dn: string) => {
    const call = getDnCallState(dn)
    if (!call || !call.parties) return false
    const activeParticipants = call.parties.filter(
      (p: any) =>
        (p.callingAddress === dn || p.calledAddress === dn) &&
        (p.callingAddress === dn || p.calledAddress === dn) &&
        (p.callStatus === 'CONNECTED' || p.callStatus === 'ON_HOLD')
    )
    return activeParticipants.length > 0
  }

  // Dialer helper functions
  const handleDialPadClick = (number: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + number)
    }
  }

  const handleBackspace = () => {
    setDialedNumber(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setDialedNumber('')
  }

  const handleExtensionClick = (extensionNumber: string) => {
    setDialedNumber(extensionNumber)
    setShowInvalidWarning(false) // Clear warning when valid extension is selected
  }

  const handleDial = async () => {
    if (dialedNumber.trim()) {
      // Check if dialed number is from available extensions
      if (!isDialedNumberValid(dialedNumber)) {
        setShowInvalidWarning(true) // Show warning when dial button is clicked
        toast.error(`Cannot dial ${dialedNumber} - not an available extension`)
        return
      }

      // Get calling device information from CTI events
      const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
      if (!callingDevice) {
        toast.error('No calling device information available')
        return
      }

      console.log('Calling device information:', callingDevice)
      console.log('User address from CTI:', userAddress)
      console.log('Available devices for user:', dnsMap[userAddress]?.devices)

      setIsDialing(true)
      setCallStatus('dialing')
      setShowInvalidWarning(false) // Clear warning when starting valid call
      
      // Create new call record
      const callId = `call_${Date.now()}`
      const newCall = {
        id: callId,
        number: dialedNumber,
        status: 'dialing',
        startTime: new Date()
      }
      
      setActiveCall(newCall)
      setCallHistory(prev => [newCall, ...prev])

      try {
        // Call API using utility function
        const result = await makeCall({
          callingAddress: callingDevice.callingAddress,
          calledAddress: dialedNumber,
          callingDeviceType: callingDevice.callingDeviceType,
          callingDeviceName: callingDevice.callingDeviceName
        })

        if (result.success) {
          console.log('Dial API response:', result.data)
          
          // Extract call information from API response
          const responseData = result.data.responseData
          const callStatusFromAPI = responseData.status
          
          // Map API status to local call status
          let localCallStatus: 'dialing' | 'connected' | 'onHold' | 'ended' | 'ringing'
          switch (callStatusFromAPI) {
            case 'RINGING':
              localCallStatus = 'ringing'
              break
            case 'CONNECTED':
              localCallStatus = 'connected'
              break
            case 'ON_HOLD':
              localCallStatus = 'onHold'
              break
            case 'ENDED':
            case 'DISCONNECTED':
            case 'DROPPED':
              localCallStatus = 'ended'
              break
            default:
              localCallStatus = 'dialing'
          }
          
          // Update call status based on API response
          setCallStatus(localCallStatus as 'connected' | 'dialing' | 'onHold' | 'ended')
          
          // If call is ended/dropped, clear states and remove from localStorage
          if (localCallStatus === 'ended') {
            // Clear active call
            setActiveCall(null)
            // Clear call status
            setCallStatus('idle')
            // Clear dialed number
            setDialedNumber('')
            // Remove from call history
            setCallHistory(prev => prev.filter(call => call.id !== callId))
            // Show ended message
            toast.info(`Call to ${dialedNumber} has ended`)
            return // Exit early since call is ended
          }
          
          // Update active call with full response data (only for active calls)
          setActiveCall(prev => prev ? {
            ...prev,
            status: localCallStatus,
            callId: responseData.callId,
            callingAddress: responseData.callingAddress,
            calledAddress: responseData.calledAddress,
            callingDeviceName: responseData.callingDeviceName,
            callingDeviceType: responseData.callingDeviceType
          } : null)
          
          // Update call history
          setCallHistory(prev => 
            prev.map(call => 
              call.id === callId 
                ? { 
                    ...call, 
                    status: localCallStatus,
                    callId: responseData.callId,
                    callingAddress: responseData.callingAddress,
                    calledAddress: responseData.calledAddress
                  }
                : call
            )
          )
          
          // Show appropriate message based on status
          if (localCallStatus === 'dialing') {
            toast.success(`Call initiated to ${dialedNumber} - Status: ${callStatusFromAPI}`)
          } else if (localCallStatus === 'connected') {
            toast.success(`Call connected to ${dialedNumber}`)
          } else {
            toast.info(`Call status: ${callStatusFromAPI}`)
          }
        } else {
          console.error('Dial API error:', result.error)
          setCallStatus('ended')
          setActiveCall(null)
          toast.error(`Failed to connect: ${result.error}`)
        }
      } catch (error) {
        console.error('Error calling dial API:', error)
        setCallStatus('ended')
        setActiveCall(null)
        toast.error('Failed to connect: Network error')
      } finally {
        setIsDialing(false)
      }
    }
  }

  // Function to clear call states and clean up
  const clearCallStates = () => {
    setActiveCall(null)
    setCallStatus('idle')
    setDialedNumber('')
    setShowInvalidWarning(false)
    setCallStartTime(null)
    setCallDuration(0)
    setProcessedEvents(new Set()) // Reset processed events tracking
    
    // Clear call from localStorage if we have the callId
    if (activeCall?.callId) {
      try {
        const storedCallStates = localStorage.getItem('cti_call_states')
        if (storedCallStates) {
          const parsedCallStates = JSON.parse(storedCallStates)
          delete parsedCallStates[activeCall.callId]
          localStorage.setItem('cti_call_states', JSON.stringify(parsedCallStates))
          console.log('Removed call from localStorage:', activeCall.callId)
        }
      } catch (error) {
        console.error('Error removing call from localStorage:', error)
      }
    }
  }

  const handleEndCall = () => {
    if (activeCall) {
      const endTime = new Date()
      const duration = Math.round((endTime.getTime() - activeCall.startTime.getTime()) / 1000)
      
      // Update call history with end time and duration
      setCallHistory(prev => 
        prev.map(call => 
          call.id === activeCall.id 
            ? { ...call, endTime, duration, status: 'ended' }
            : call
        )
      )
      
      // Clear all call states
      clearCallStates()
      
      toast.info('Call ended')
    }
  }

  // Listen for call events and handle ANSWERED event
  useEffect(() => {
    if (eventLog && eventLog.length > 0) {
      const latestEvent = eventLog[eventLog.length - 1]
      
      // Create a unique event identifier
      const eventId = `${latestEvent.eventType}-${latestEvent.callId}-${latestEvent.sequence}`
      
      // Skip if we've already processed this event
      if (processedEvents.has(eventId)) {
        return
      }
      
      // Handle ANSWERED event
      if (latestEvent.eventType === 'ANSWERED' && latestEvent.parties) {
        console.log('ANSWERED event received:', latestEvent)
        
        // Find the party that matches our active call
        const matchingParty = latestEvent.parties.find((p: any) => 
          p.callId === activeCall?.callId
        )
        
        if (matchingParty) {
          console.log('Matching party found:', matchingParty)
          
          // Mark this event as processed
          setProcessedEvents(prev => {
            const newSet = new Set(prev)
            newSet.add(eventId)
            return newSet
          })
          
          // Update call status to connected
          setCallStatus('connected')
          
          // Set call start time from the event
          if (matchingParty.startTime) {
            const startTime = new Date(matchingParty.startTime)
            setCallStartTime(startTime)
            console.log('Call start time set:', startTime)
          }
          
          // Update active call status without triggering the effect again
          setActiveCall(prev => {
            if (prev && prev.callId === matchingParty.callId) {
              return {
                ...prev,
                status: 'connected'
              }
            }
            return prev
          })
          
          // Update call history
          setCallHistory(prev => 
            prev.map(call => 
              call.id === activeCall?.id 
                ? { ...call, status: 'connected' }
                : call
            )
          )
          
          toast.success('Call answered and connected!')
        }
      }
    }
  }, [eventLog, processedEvents]) // Include processedEvents in dependencies

  // Timer effect to update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (callStartTime && callStatus === 'connected') {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.round((now.getTime() - callStartTime.getTime()) / 1000)
        setCallDuration(duration)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [callStartTime, callStatus])

  const handleHoldCall = () => {
    if (activeCall) {
      setCallStatus('onHold')
      setActiveCall(prev => prev ? { ...prev, status: 'onHold' } : null)
      
      // Update call history
      setCallHistory(prev => 
        prev.map(call => 
          call.id === activeCall.id 
            ? { ...call, status: 'onHold' }
            : call
        )
      )
      
      toast.info('Call put on hold')
    }
  }

  const handleResumeCall = () => {
    if (activeCall) {
      setCallStatus('connected')
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null)
      
      // Update call history
      setCallHistory(prev => 
        prev.map(call => 
          call.id === activeCall.id 
            ? { ...call, status: 'connected' }
            : call
        )
      )
      
      toast.info('Call resumed')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'dialing': return 'warning'
      case 'onHold': return 'warning'
      case 'ended': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return 'call'
      case 'dialing': return 'call_made'
      case 'onHold': return 'pause_circle'
      case 'ended': return 'call_end'
      default: return 'phone'
    }
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
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Dialer" />

      {/* Header */}
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex justify-content-between align-items-center">
            <h2 className="mb-0">
              <i className="material-icons-two-tone me-2">dialpad</i>
              CTI Dialer
            </h2>
            <Link href="/cti" className="btn btn-outline-secondary">
              <i className="material-icons-two-tone me-2">arrow_back</i>
              Back to CTI
            </Link>
          </div>
        </Col>
      </Row>

      <Row>
        {/* First Section: Dialer */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="material-icons-two-tone me-2">dialpad</i>
                Dialer
              </h5>
            </Card.Header>
            <Card.Body className="text-center">
              

              <Row>
                {/* Left Side: Available Extensions */}
                <Col md={4} style={{ backgroundColor: '#2c466159' }}>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 text-start mt-3">
                      <i className="material-icons-two-tone me-2">people</i>
                      Available Extensions
                    </h6>
                    
                    {/* Search Box */}
                    <div className="mb-3">
                      <div className="">
                        {/* <span className="input-group-text">
                          <i className="material-icons-two-tone">search</i>
                        </span> */}
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search extensions..."
                          value={extensionSearch}
                          onChange={(e) => setExtensionSearch(e.target.value)}
                        />
                        {extensionSearch && (
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setExtensionSearch('')}
                          >
                            <i className="material-icons-two-tone">clear</i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="extensions-grid mb-3">
                      {getFilteredExtensions().map(({ dn, devices }) => {
                        const deviceList = Object.values(devices || {})
                        const cls = getCardLevelStatus(deviceList)
                        const isOnline = cls === 'registered'
                        const hasActiveCall = isDnInActiveCall(dn)
                        
                        return (
                          <button
                            key={dn}
                            type="button"
                            className={`extension-button ${isOnline ? 'online' : 'offline'} ${
                              dialedNumber === dn ? 'selected' : ''
                            } ${hasActiveCall ? 'active-call' : ''}`}
                            onClick={() => handleExtensionClick(dn)}
                            disabled={!isOnline}
                            title={`${dn} - ${isOnline ? 'Online' : 'Offline'}${hasActiveCall ? ' (Active Call)' : ''}`}
                          >
                            <div className="d-flex flex-column align-items-center">
                              <span className="fw-bold">{dn}</span>
                              <small className={isOnline ? 'text-success' : 'text-muted'}>
                                {isOnline ? '● Online' : '○ Offline'}
                              </small>
                              {hasActiveCall && (
                                <small className="text-primary">
                                  ● Active Call
                                </small>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* No results message */}
                    {getFilteredExtensions().length === 0 && (
                      <div className="text-center text-muted py-3">
                        <i className="material-icons-two-tone mb-2" style={{ fontSize: '2rem' }}>search_off</i>
                        <p className="mb-0">
                          {extensionSearch ? `No extensions found matching "${extensionSearch}"` : 'No extensions available'}
                        </p>
                      </div>
                    )}
                  </div>
                </Col>

                {/* Right Side: Dial Pad */}
                <Col md={8} style={{ backgroundColor: 'rgb(44 70 97)' }}>


                {/* Display Number */}
              <div className="mb-4">
                <div className="display-4 fw-bold mb-2 text-primary">
                  {dialedNumber || '0'}
                </div>
                
                {/* Invalid number warning */}
                {showInvalidWarning && (
                  <div className="alert alert-warning py-2 mb-3">
                    <i className="material-icons-two-tone me-2">warning</i>
                    <small>This number is not an available extension</small>
                  </div>
                )}
                
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={handleBackspace}
                    disabled={!dialedNumber}
                  >
                    <i className="material-icons-two-tone">backspace</i>
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={handleClear}
                    disabled={!dialedNumber}
                  >
                    <i className="material-icons-two-tone">clear</i>
                  </Button>
                </div>
              </div>

                  {/* Dial Pad */}
                  <div className="dial-pad mb-4">
                    <div className="row g-2 mb-3">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="col-4">
                          <Button
                            variant="outline-primary"
                            size="lg"
                            className="w-100 py-3"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                            {num}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      {[4, 5, 6].map((num) => (
                        <div key={num} className="col-4">
                          <Button
                            variant="outline-primary"
                            size="lg"
                            className="w-100 py-3"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                            {num}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      {[7, 8, 9].map((num) => (
                        <div key={num} className="col-4">
                          <Button
                            variant="outline-primary"
                            size="lg"
                            className="w-100 py-3"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                            {num}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="w-100 py-3"
                          onClick={() => handleDialPadClick('*')}
                        >
                          *
                        </Button>
                      </div>
                      <div className="col-4">
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="w-100 py-3"
                          onClick={() => handleDialPadClick('0')}
                        >
                          0
                        </Button>
                      </div>
                      <div className="col-4">
                        <Button
                          variant="outline-primary"
                          size="lg"
                          className="w-100 py-3"
                          onClick={() => handleDialPadClick('#')}
                        >
                          #
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dial Button */}
                  <div className="text-center">
                    <Button
                      variant="info"
                      size="lg"
                      className="w-100 py-3 mb-4"
                      onClick={handleDial}
                      disabled={!dialedNumber.trim() || isDialing || !isDialedNumberValid(dialedNumber)}
                    >
                      <i className="material-icons-two-tone me-2">call</i>
                      {isDialing ? 'Dialing...' : 'Dial'}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Second Section: Progress */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="material-icons-two-tone me-2">call</i>
                Call Progress
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Active Call Status */}
              {activeCall && (
                <div className="mb-4">
                  <Alert variant="info" className="text-center">
                    <h6 className="mb-2">Active Call</h6>
                    <div className="display-6 fw-bold text-primary mb-2">
                      {activeCall.number}
                    </div>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <i className={`material-icons-two-tone me-2 text-${getStatusBadgeVariant(activeCall.status)}`}>
                        {getStatusIcon(activeCall.status)}
                      </i>
                      <span className="text-capitalize">{activeCall.status.replace('_', ' ')}</span>
                    </div>
                    <div className="small text-muted">
                      Started: {activeCall.startTime.toLocaleTimeString()}
                    </div>
                    
                    {/* Call Duration Timer */}
                    {callStatus === 'connected' && callStartTime && (
                      <div className="mt-2">
                        <div className="h5 text-success mb-0">
                          <i className="material-icons-two-tone me-2">timer</i>
                          {formatDuration(callDuration)}
                        </div>
                        <small className="text-muted">Call Duration</small>
                      </div>
                    )}
                    
                    {/* Call Details from API Response */}
                    {activeCall.callId && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted d-block">Call ID: <strong>{activeCall.callId}</strong></small>
                        <small className="text-muted d-block">From: <strong>{activeCall.callingAddress}</strong></small>
                        <small className="text-muted d-block">To: <strong>{activeCall.calledAddress}</strong></small>
                        {activeCall.callingDeviceName && (
                          <small className="text-muted d-block">Device: <strong>{activeCall.callingDeviceName}</strong></small>
                        )}
                      </div>
                    )}
                  </Alert>

                  {/* Call Control Buttons */}
                  <div className="row g-2 mb-3">
                    {callStatus === 'connected' && (
                      <>
                        <div className="col-6">
                          <Button
                            variant="warning"
                            size="sm"
                            className="w-100"
                            onClick={handleHoldCall}
                          >
                            <i className="material-icons-two-tone me-2">pause_circle</i>
                            Hold
                          </Button>
                        </div>
                        <div className="col-6">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100"
                            onClick={handleEndCall}
                          >
                            <i className="material-icons-two-tone me-2">call_end</i>
                            End
                          </Button>
                        </div>
                      </>
                    )}

                    {callStatus === 'onHold' && (
                      <>
                        <div className="col-6">
                          <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={handleResumeCall}
                          >
                            <i className="material-icons-two-tone me-2">play_circle</i>
                            Resume
                          </Button>
                        </div>
                        <div className="col-6">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100"
                            onClick={handleEndCall}
                          >
                            <i className="material-icons-two-tone me-2">call_end</i>
                            End
                          </Button>
                        </div>
                      </>
                    )}

                    {callStatus === 'dialing' && (
                      <div className="col-12">
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-100"
                          onClick={handleEndCall}
                        >
                          <i className="material-icons-two-tone me-2">call_end</i>
                          Cancel Call
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Call History */}
              {/* <div>
                <h6 className="mb-3">Recent Calls</h6>
                {callHistory.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="material-icons-two-tone mb-2" style={{ fontSize: '3rem' }}>call_end</i>
                    <p>No call history</p>
                  </div>
                ) : (
                  <div className="call-history" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {callHistory.map((call) => (
                      <div
                        key={call.id}
                        className={`d-flex justify-content-between align-items-center p-2 mb-2 rounded ${
                          call.id === activeCall?.id ? 'bg-light' : ''
                        }`}
                      >
                        <div className="d-flex align-items-center">
                          <i className={`material-icons-two-tone me-2 text-${getStatusBadgeVariant(call.status)}`}>
                            {getStatusIcon(call.status)}
                          </i>
                          <div>
                            <div className="fw-bold">{call.number}</div>
                            <small className="text-muted">
                              {call.startTime.toLocaleTimeString()}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge bg-${getStatusBadgeVariant(call.status)}`}>
                            {call.status.replace('_', ' ')}
                          </span>
                          {call.duration && (
                            <div className="small text-muted mt-1">
                              {formatDuration(call.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call Status Modal */}
      <Modal
        show={showCallStatus}
        onHide={() => setShowCallStatus(false)}
        size="sm"
        centered
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <i className="material-icons-two-tone me-2">call</i>
              <span>Call Status</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-4">
              <div className="display-6 fw-bold text-primary mb-2">
                {dialedNumber}
              </div>
              <div className="call-status-indicator">
                {callStatus === 'dialing' && (
                  <div className="d-flex align-items-center justify-content-center text-warning">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Dialing...</span>
                    </div>
                    <span>Dialing...</span>
                  </div>
                )}
                {callStatus === 'connected' && (
                  <div className="d-flex align-items-center justify-content-center text-success">
                    <i className="material-icons-two-tone me-2">call</i>
                    <span>Connected</span>
                  </div>
                )}
                {callStatus === 'onHold' && (
                  <div className="d-flex align-items-center justify-content-center text-warning">
                    <span>On Hold</span>
                  </div>
                )}
                {callStatus === 'ended' && (
                  <div className="d-flex align-items-center justify-content-center text-danger">
                    <span>Call Ended</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCallStatus(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .dial-pad .btn {
          font-size: 1.5rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .dial-pad .btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .extensions-grid {
          display:block;
          max-height: 300px;
          overflow-x: hidden;

          overflow-y: auto;
        }
        .extension-button {
          width: 100%;
          margin-bottom: 5px;
          padding: 5px;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          background-color: #fff;
          transition: all 0.2s ease;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .extension-button.online {
          border-color: #198754;
          color: #198754;
        }
        .extension-button.offline {
          border-color: #6c757d;
          color: #6c757d;
          opacity: 0.6;
          cursor: not-allowed;
        }
        .extension-button.selected {
          background-color: #0d6efd;
          color: white;
          border-color: #0d6efd;
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
        }
        .extension-button.active-call {
          border-color: #ffc107;
          color: #856404;
          background-color: #fff3cd;
        }
        .extension-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .extension-button:focus {
          outline: none;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .search-input-group {
          position: relative;
        }
        .search-input-group .form-control {
          border-radius: 0.375rem 0 0 0.375rem;
        }
        .search-input-group .btn {
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .search-input-group .input-group-text {
          background-color: #f8f9fa;
          border-color: #dee2e6;
        }
        .call-history::-webkit-scrollbar {
          width: 6px;
        }
        .call-history::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .call-history::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .call-history::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .extensions-grid::-webkit-scrollbar {
          width: 6px;
        }
        .extensions-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .extensions-grid::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .extensions-grid::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </React.Fragment>
  )
}

CtiDialer.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDialer
