import React, { ReactElement, useState, useEffect, useRef } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Row, Alert, Badge } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Link from 'next/link'
import useCtiStomp from '../../../hooks/useCtiStomp'
import { makeCall, endCall, holdCall, resumeCall, getCallingDeviceInfo, mergeCalls } from '../../../utils/dialer'

const CtiDialer = () => {
  // CTI Socket hook integration
  const {
    summaryData,
    dnsMap,
    error,
    isInitialized,
    userAddress,
    eventLog
  } = useCtiStomp()

  // Simplified state
  const [dialedNumber, setDialedNumber] = useState('')
  const [isDialing, setIsDialing] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'onHold' | 'ended' | 'ringing'>('idle')
  const [showInvalidWarning, setShowInvalidWarning] = useState(false)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState<number>(0)
  const [activeCalls, setActiveCalls] = useState<Map<string, {
    id: string
    number: string
    startTime: Date
    status: string
    callId?: string
    callingAddress?: string
    calledAddress?: string
    callingDeviceName?: string
    callingDeviceType?: string
    duration?: number
  }>>(new Map())
  const [extensionSearch, setExtensionSearch] = useState('')
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [selectedCallsForMerge, setSelectedCallsForMerge] = useState<Set<string>>(new Set())
  const processedEventsRef = useRef<Set<string>>(new Set())

  // Helper functions
  const getAvailableExtensions = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .map(({ dn }) => dn)
  }

  const isDialedNumberValid = (number: string) => {
    return getAvailableExtensions().includes(number)
  }

  const getFilteredExtensions = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .filter(({ dn }) => 
        extensionSearch === '' || 
        dn.toLowerCase().includes(extensionSearch.toLowerCase())
      )
  }

  const getCardLevelStatus = (devices: any[]) => {
    if (!devices || devices.length === 0) return 'unregistered'
    if (devices.some(d => d.terminalState === 'REGISTERED')) return 'registered'
    if (devices.some(d => d.terminalState === 'STALE')) return 'stale'
    return 'unregistered'
  }

  const isDnInActiveCall = (dn: string) => {
    return Array.from(activeCalls.values()).some(call => 
      call.number === dn && 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    )
  }

  const canDialNumber = (number: string) => {
    // Check if this number is already in an active call
    const existingCall = Array.from(activeCalls.values()).find(call => 
      call.number === number && 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    )
    
    if (existingCall) {
      return {
        canDial: false,
        reason: `Number ${number} is already in a ${existingCall.status} call`,
        existingCall
      }
    }
    
    return { canDial: true }
  }

  const getActiveCallForNumber = (number: string) => {
    return Array.from(activeCalls.values()).find(call => 
      call.number === number && 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    )
  }

  // Dialer functions
  const handleDialPadClick = (number: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + number)
    }
  }

  const handleClear = () => setDialedNumber('')
  const handleBackspace = () => setDialedNumber(prev => prev.slice(0, -1))

  const handleExtensionClick = (extensionNumber: string) => {
    // Check if we can dial this number
    const dialCheck = canDialNumber(extensionNumber)
    if (!dialCheck.canDial) {
      toast.warning(dialCheck.reason)
      return
    }
    
    setDialedNumber(extensionNumber)
    setShowInvalidWarning(false)
  }

  const handleDial = async () => {
    if (!dialedNumber.trim() || !isDialedNumberValid(dialedNumber)) {
      setShowInvalidWarning(true)
      toast.error(`Cannot dial ${dialedNumber} - not an available extension`)
      return
    }

    // Check if we can dial this number
    const dialCheck = canDialNumber(dialedNumber)
    if (!dialCheck.canDial) {
      toast.warning(dialCheck.reason)
      return
    }

    const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
    if (!callingDevice) {
      toast.error('No calling device information available')
      return
    }

    setIsDialing(true)
    setCallStatus('dialing')
    setShowInvalidWarning(false)
    
    const callId = `call_${Date.now()}`
    const newCall = {
      id: callId,
      number: dialedNumber,
      status: 'dialing',
      startTime: new Date(),
      duration: 0
    }
    
    // Add to active calls map
    setActiveCalls(prev => new Map(prev).set(callId, newCall))

    try {
      const result = await makeCall({
        callingAddress: callingDevice.callingAddress,
        calledAddress: dialedNumber,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      })

      if (result.success) {
        const responseData = result.data.responseData
        const callStatusFromAPI = responseData.status
        
        console.log('Dial API response:', responseData)
        
        let localCallStatus: 'dialing' | 'connected' | 'onHold' | 'ended' | 'ringing'
        switch (callStatusFromAPI) {
          case 'RINGING': localCallStatus = 'ringing'; break
          case 'CONNECTED': localCallStatus = 'connected'; break
          case 'ON_HOLD': localCallStatus = 'onHold'; break
          case 'ENDED':
          case 'DISCONNECTED':
          case 'DROPPED': localCallStatus = 'ended'; break
          default: localCallStatus = 'dialing'
        }
        
        console.log('Mapped call status:', localCallStatus)
        setCallStatus(localCallStatus)
        
        if (localCallStatus === 'ended') {
          const callToEnd = {
            ...newCall,
            status: 'ended',
            callId: responseData.callId,
            callingAddress: responseData.callingAddress,
            calledAddress: responseData.calledAddress,
            callingDeviceName: responseData.callingDeviceName,
            callingDeviceType: responseData.callingDeviceType,
            duration: 0
          }
          
          // Update the call in active calls
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            newMap.set(callId, callToEnd)
            return newMap
          })
          
          // Remove ended call after a delay
          setTimeout(() => removeCall(callId), 2000)
          toast.info(`Call to ${dialedNumber} has ended`)
          return
        }
        
        const updatedCall = {
          ...newCall,
          status: localCallStatus,
          callId: responseData.callId,
          callingAddress: responseData.callingAddress,
          calledAddress: responseData.calledAddress,
          callingDeviceName: responseData.callingDeviceName,
          callingDeviceType: responseData.callingDeviceType,
          duration: 0
        }
        
        console.log('Setting active call:', updatedCall)
        
        // Update the call in active calls
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          newMap.set(callId, updatedCall)
          return newMap
        })
        
        toast.success(`Call ${localCallStatus === 'connected' ? 'connected' : 'initiated'} to ${dialedNumber}`)
      } else {
        console.error('Dial API error:', result.error)
        setCallStatus('ended')
        toast.error(`Failed to connect: ${result.error}`)
        setTimeout(() => removeCall(callId), 0)
      }
    } catch (error) {
      console.error('Error calling dial API:', error)
      setCallStatus('ended')
      toast.error('Failed to connect: Network error')
      setTimeout(() => removeCall(callId), 0)
    } finally {
      setIsDialing(false)
    }
  }

  const removeCall = (callId: string) => {
    setActiveCalls(prev => {
      const newMap = new Map(prev)
      // Only remove if the call still exists
      if (newMap.has(callId)) {
        newMap.delete(callId)
      }
      return newMap
    })
    
    // Remove from merge selection if it was selected
    setSelectedCallsForMerge(prev => {
      const newSet = new Set(prev)
      newSet.delete(callId)
      return newSet
    })
  }

  const clearCallStates = async () => {
    // Clear all active calls
    setActiveCalls(new Map())
    setCallStatus('idle')
    setDialedNumber('')
    setShowInvalidWarning(false)
    setCallStartTime(null)
    setCallDuration(0)
  }

  const handleHoldCall = async (callId: string) => {
    const call = activeCalls.get(callId)
    if (!call) {
      toast.error('Call not found')
      return
    }

    // Check if call has a valid callId
    if (!call.callId) {
      toast.error('Call ID not available yet. Please wait for the call to be established.')
      return
    }

    // Set processing state
    setProcessingCalls(prev => new Set(prev).add(callId))

    try {
      // Get calling device info for the API call
      const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
      if (!callingDevice) {
        toast.error('No calling device information available')
        return
      }

      // Call the holdCall API
      const result = await holdCall({
        callId: call.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: call.calledAddress || call.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      })

      if (result.success) {
        // Update local call status to onHold
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const existingCall = newMap.get(callId)
          if (existingCall) {
            newMap.set(callId, { ...existingCall, status: 'onHold' })
          }
          return newMap
        })
        toast.success('Call put on hold')
      } else {
        console.error('Hold call API error:', result.error)
        toast.error(`Failed to hold call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling hold call API:', error)
      toast.error('Failed to hold call: Network error')
    } finally {
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleResumeCall = async (callId: string) => {
    const call = activeCalls.get(callId)
    if (!call) {
      toast.error('Call not found')
      return
    }

    // Check if call has a valid callId
    if (!call.callId) {
      toast.error('Call ID not available yet. Please wait for the call to be established.')
      return
    }

    // Set processing state
    setProcessingCalls(prev => new Set(prev).add(callId))

    try {
      // Get calling device info for the API call
      const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
      if (!callingDevice) {
        toast.error('No calling device information available')
        return
      }

      // Call the resumeCall API
      const result = await resumeCall({
        callId: call.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: call.calledAddress || call.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      })

      if (result.success) {
        // Update local call status to connected
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const existingCall = newMap.get(callId)
          if (existingCall) {
            newMap.set(callId, { ...existingCall, status: 'connected' })
          }
          return newMap
        })
        toast.success('Call resumed')
      } else {
        console.error('Resume call API error:', result.error)
        toast.error(`Failed to resume call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling resume call API:', error)
      toast.error('Failed to resume call: Network error')
    } finally {
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleMergeCalls = async () => {
    if (selectedCallsForMerge.size !== 2) {
      toast.error('Please select exactly 2 calls to merge')
      return
    }

    const selectedCallIds = Array.from(selectedCallsForMerge)
    const call1 = activeCalls.get(selectedCallIds[0])
    const call2 = activeCalls.get(selectedCallIds[1])

    if (!call1 || !call2) {
      toast.error('Selected calls not found')
      return
    }

    // Determine which call is held and which is active
    let heldCall: any, activeCall: any
    if (call1.status === 'onHold' && call2.status === 'connected') {
      heldCall = call1
      activeCall = call2
    } else if (call2.status === 'onHold' && call1.status === 'connected') {
      heldCall = call2
      activeCall = call1
    } else {
      // If both are connected or both are on hold, use the first as held and second as active
      heldCall = call1
      activeCall = call2
    }

    // Get calling device info for the API call
    const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
    if (!callingDevice) {
      toast.error('No calling device information available')
      return
    }

    // Check if calls have valid callIds
    if (!heldCall.callId || !activeCall.callId) {
      toast.error('Call IDs not available for merging')
      return
    }

    try {
      // Call the mergeCalls API
      const result = await mergeCalls({
        heldCallId: heldCall.callId,
        activeCallId: activeCall.callId,
        callingAddress: callingDevice.callingAddress,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      })

      if (result.success) {
        // Remove the held call and update the active call status
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          newMap.delete(heldCall.id)
          
          // Update the active call to show it's now merged
          const existingActiveCall = newMap.get(activeCall.id)
          if (existingActiveCall) {
            newMap.set(activeCall.id, { 
              ...existingActiveCall, 
              status: 'connected',
              number: `${activeCall.number} + ${heldCall.number}`
            })
          }
          
          return newMap
        })

        // Clear selection
        setSelectedCallsForMerge(new Set())
        toast.success('Calls merged successfully')
      } else {
        console.error('Merge calls API error:', result.error)
        toast.error(`Failed to merge calls: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling merge calls API:', error)
      toast.error('Failed to merge calls: Network error')
    }
  }

  const handleEndCall = async (callId: string) => {
    const call = activeCalls.get(callId)
    if (!call) {
      toast.error('Call not found')
      return
    }

    // Check if call has a valid callId
    if (!call.callId) {
      toast.error('Call ID not available yet. Please wait for the call to be established.')
      return
    }

    // Set processing state
    setProcessingCalls(prev => new Set(prev).add(callId))

    try {
      // Get calling device info for the API call
      const callingDevice = getCallingDeviceInfo(userAddress, dnsMap)
      if (!callingDevice) {
        toast.error('No calling device information available')
        return
      }

      // Call the endCall API
      const result = await endCall({
        callId: call.callId,
        callingAddress: callingDevice.callingAddress,
        calledAddress: call.calledAddress || call.number,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      })

      if (result.success) {
        // Update local call status to ended
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const existingCall = newMap.get(callId)
          if (existingCall) {
            newMap.set(callId, { ...existingCall, status: 'ended' })
          }
          return newMap
        })
        
        // Remove ended call after a delay
        setTimeout(() => removeCall(callId), 1000)
        toast.success('Call ended successfully')
      } else {
        console.error('End call API error:', result.error)
        toast.error(`Failed to end call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling end call API:', error)
      toast.error('Failed to end call: Network error')
    } finally {
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

    // Event handling for CTI events
  useEffect(() => {
    if (eventLog && eventLog.length > 0) {
      const latestEvent = eventLog[eventLog.length - 1]
      
      // Create a unique event identifier to prevent processing the same event multiple times
      // Include eventType, callId, and eventTime to ensure unique identification
      const eventId = `${latestEvent.eventType}_${latestEvent.parties?.[0]?.callId || 'unknown'}_${latestEvent.eventTime || Date.now()}`
      
      // Skip if we've already processed this event
      if (processedEventsRef.current.has(eventId)) {
        console.log('Event already processed, skipping:', eventId)
        return
      }
      
      // Mark this event as processed
      processedEventsRef.current.add(eventId)
      
      // Clean up old processed events (keep only last 50)
      if (processedEventsRef.current.size > 50) {
        const eventsArray = Array.from(processedEventsRef.current)
        processedEventsRef.current = new Set(eventsArray.slice(-25))
      }
      
      // Auto-cleanup duplicate calls every 10 events to prevent accumulation
      if (processedEventsRef.current.size % 10 === 0) {
        setTimeout(() => cleanupDuplicateCalls(), 100)
      }
      
      // Log all events for debugging
      console.log('CTI Event received:', {
        eventType: latestEvent.eventType,
        eventName: latestEvent.eventName,
        parties: latestEvent.parties,
        callStatus: latestEvent.parties?.[0]?.callStatus,
        callId: latestEvent.parties?.[0]?.callId,
        callingAddress: latestEvent.parties?.[0]?.callingAddress,
        calledAddress: latestEvent.parties?.[0]?.calledAddress
      })
      
      // Log current active calls for debugging
      console.log('Current active calls:', Array.from(activeCalls.values()).map(call => ({
        id: call.id,
        number: call.number,
        status: call.status,
        callId: call.callId,
        callingAddress: call.callingAddress,
        calledAddress: call.calledAddress
      })))
      
      // Handle ANSWERED event
      if (latestEvent.eventType === 'ANSWERED' && latestEvent.parties) {
        console.log('ANSWERED event received:', latestEvent)
        
        // Find matching call by calling/called addresses
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const matchingCall = Array.from(newMap.values()).find(call => 
            call.callingAddress === latestEvent.parties[0]?.callingAddress && 
            call.calledAddress === latestEvent.parties[0]?.calledAddress
          )
          
          if (matchingCall) {
            console.log('Matching call found:', matchingCall)
            
            // Update call status to connected
            const call = newMap.get(matchingCall.id)
            if (call) {
              newMap.set(matchingCall.id, { 
                ...call, 
                status: 'connected',
                callId: latestEvent.parties[0]?.callId || call.callId,
                duration: 0
              })
            }
            
            // Show toast outside of setState to avoid side effects
            setTimeout(() => {
              toast.success(`Call to ${matchingCall.number} answered and connected!`)
            }, 0)
          } else {
            console.log('No matching call found for ANSWERED event')
          }
          
          return newMap
        })
      }
      
      // Handle CallCtlTermConnTalkingEvImpl event (call connected and talking)
      if ((latestEvent.eventType === 'CallCtlTermConnTalkingEvImpl' || 
           latestEvent.eventName === 'CallCtlTermConnTalkingEvImpl' ||
           latestEvent.eventType === 'RETRIEVED') && latestEvent.parties) {
        console.log('CallCtlTermConnTalkingEvImpl/RETRIEVED event received:', latestEvent)
        console.log('Event type:', latestEvent.eventType, 'Event name:', latestEvent.eventName)
        
                  // Find matching call by calling/called addresses or callId
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            console.log('Current active calls for matching:', Array.from(newMap.values()).map(c => ({
              id: c.id,
              number: c.number,
              status: c.status,
              callId: c.callId,
              callingAddress: c.callingAddress,
              calledAddress: c.calledAddress
            })))
            
            let matchingCall = Array.from(newMap.values()).find(call => 
              call.callId === latestEvent.parties[0]?.callId
            )
            
            console.log('Trying to match call by callId:', latestEvent.parties[0]?.callId, 'Found:', matchingCall?.number)
            
            // If not found by callId, try to find by addresses
            if (!matchingCall) {
              matchingCall = Array.from(newMap.values()).find(call => 
                call.callingAddress === latestEvent.parties[0]?.callingAddress && 
                call.calledAddress === latestEvent.parties[0]?.calledAddress
              )
              console.log('Trying to match call by addresses:', {
                callingAddress: latestEvent.parties[0]?.callingAddress,
                calledAddress: latestEvent.parties[0]?.calledAddress,
                found: matchingCall?.number
              })
            }
          
          if (matchingCall) {
            console.log('Matching call found for CallCtlTermConnTalkingEvImpl:', matchingCall)
            console.log('Current call status:', matchingCall.status)
            console.log('Event call status:', latestEvent.parties[0]?.callStatus)
            
            // Update call status based on the event's callStatus field
            const eventCallStatus = latestEvent.parties[0]?.callStatus
            let localStatus = 'connected' // default to connected
            
            if (eventCallStatus) {
              switch (eventCallStatus) {
                case 'RINGING': localStatus = 'ringing'; break
                case 'CONNECTED': localStatus = 'connected'; break
                case 'ON_HOLD': localStatus = 'onHold'; break
                case 'ENDED':
                case 'DISCONNECTED':
                case 'DROPPED': localStatus = 'ended'; break
                default: localStatus = 'connected'
              }
            }
            
            console.log('Updating call status from', matchingCall.status, 'to', localStatus)
            
            const call = newMap.get(matchingCall.id)
            if (call) {
              newMap.set(matchingCall.id, { 
                ...call, 
                status: localStatus,
                callId: latestEvent.parties[0]?.callId || call.callId,
                callingAddress: latestEvent.parties[0]?.callingAddress || call.callingAddress,
                calledAddress: latestEvent.parties[0]?.calledAddress || call.calledAddress,
                callingDeviceName: latestEvent.parties[0]?.callingDeviceName || call.callingDeviceName,
                duration: 0
              })
            }
            
            // Show toast outside of setState to avoid side effects
            setTimeout(() => {
              if (localStatus === 'connected') {
                toast.success(`Call to ${matchingCall.number} connected and talking!`)
              } else {
                toast.info(`Call to ${matchingCall.number} status: ${localStatus}`)
              }
            }, 0)
          } else {
            // This might be an incoming call that we need to create
            console.log('No matching call found for CallCtlTermConnTalkingEvImpl event - might be incoming call')
            console.log('Event details:', {
              callId: latestEvent.parties[0]?.callId,
              callingAddress: latestEvent.parties[0]?.callingAddress,
              calledAddress: latestEvent.parties[0]?.calledAddress,
              callStatus: latestEvent.parties[0]?.callStatus
            })
            
            // Check if this is an incoming call to our user address
            if (latestEvent.parties[0]?.calledAddress === userAddress) {
              const incomingCallId = `incoming_${Date.now()}`
              const incomingCall = {
                id: incomingCallId,
                number: latestEvent.parties[0]?.callingAddress || 'Unknown',
                status: 'connected',
                startTime: new Date(),
                callId: latestEvent.parties[0]?.callId,
                callingAddress: latestEvent.parties[0]?.callingAddress,
                calledAddress: latestEvent.parties[0]?.calledAddress,
                callingDeviceName: latestEvent.parties[0]?.callingDeviceName,
                duration: 0
              }
              
              newMap.set(incomingCallId, incomingCall)
              
              // Show toast for incoming call
              setTimeout(() => {
                toast.success(`Incoming call from ${incomingCall.number} connected!`)
              }, 0)
            } else if (latestEvent.parties[0]?.callingAddress === userAddress) {
              // This is an outgoing call from our user that we need to track
              // Check if this call already exists to prevent duplicates
              const existingCall = findExistingCall(
                latestEvent.parties[0]?.callId,
                latestEvent.parties[0]?.callingAddress,
                latestEvent.parties[0]?.calledAddress
              )
              
              if (existingCall) {
                console.log('Call already exists for RETRIEVED event, updating instead of creating new:', existingCall.number)
                // Update the existing call with new information
                const call = newMap.get(existingCall.id)
                if (call) {
                  newMap.set(existingCall.id, { 
                    ...call, 
                    status: 'connected',
                    callId: latestEvent.parties[0]?.callId || call.callId,
                    callingAddress: latestEvent.parties[0]?.callingAddress || call.callingAddress,
                    calledAddress: latestEvent.parties[0]?.calledAddress || call.calledAddress,
                    callingDeviceName: latestEvent.parties[0]?.callingDeviceName || call.callingDeviceName
                  })
                }
              } else {
                console.log('Creating outgoing call entry for RETRIEVED event')
                const outgoingCallId = `outgoing_${Date.now()}`
                const outgoingCall = {
                  id: outgoingCallId,
                  number: latestEvent.parties[0]?.calledAddress || 'Unknown',
                  status: 'connected',
                  startTime: new Date(),
                  callId: latestEvent.parties[0]?.callId,
                  callingAddress: latestEvent.parties[0]?.callingAddress,
                  calledAddress: latestEvent.parties[0]?.calledAddress,
                  callingDeviceName: latestEvent.parties[0]?.callingDeviceName,
                  duration: 0
                }
                
                newMap.set(outgoingCallId, outgoingCall)
                
                // Show toast for outgoing call
                setTimeout(() => {
                  toast.success(`Call to ${outgoingCall.number} connected!`)
                }, 0)
              }
            } else {
              // If we still can't find a match, log this for debugging
              console.log('No matching call found and not creating new entry. Event details:', {
                eventType: latestEvent.eventType,
                eventName: latestEvent.eventName,
                callId: latestEvent.parties[0]?.callId,
                callingAddress: latestEvent.parties[0]?.callingAddress,
                calledAddress: latestEvent.parties[0]?.calledAddress,
                callStatus: latestEvent.parties[0]?.callStatus,
                userAddress: userAddress
              })
            }
          }
          
          return newMap
        })
      }
      
      // Handle incoming call events
      if (latestEvent.eventType === 'INCOMING_CALL' && latestEvent.parties) {
        console.log('INCOMING_CALL event received:', latestEvent)
        
        // Check if this is an incoming call to our user address
        if (latestEvent.parties[0]?.calledAddress === userAddress) {
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            const incomingCallId = `incoming_${Date.now()}`
            const incomingCall = {
              id: incomingCallId,
              number: latestEvent.parties[0]?.callingAddress || 'Unknown',
              status: 'ringing',
              startTime: new Date(),
              callId: latestEvent.parties[0]?.callId,
              callingAddress: latestEvent.parties[0]?.callingAddress,
              calledAddress: latestEvent.parties[0]?.calledAddress,
              callingDeviceName: latestEvent.parties[0]?.callingDeviceName,
              duration: 0
            }
            
            newMap.set(incomingCallId, incomingCall)
            
            // Show toast for incoming call
            setTimeout(() => {
              toast.info(`Incoming call from ${incomingCall.number}`)
            }, 0)
            
            return newMap
          })
        }
      }
      
      // Handle call state change events
      if (latestEvent.eventType === 'CALL_STATE_CHANGE' && latestEvent.parties) {
        console.log('CALL_STATE_CHANGE event received:', latestEvent)
        
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const matchingCall = Array.from(newMap.values()).find(call => 
            call.callId === latestEvent.parties[0]?.callId
          )
          
          if (matchingCall && latestEvent.parties[0]?.callStatus) {
            console.log('Updating call state for:', matchingCall.number, 'to:', latestEvent.parties[0].callStatus)
            
            // Map CTI call status to our local status
            let localStatus: string
            switch (latestEvent.parties[0].callStatus) {
              case 'RINGING': localStatus = 'ringing'; break
              case 'CONNECTED': localStatus = 'connected'; break
              case 'ON_HOLD': localStatus = 'onHold'; break
              case 'ENDED':
              case 'DISCONNECTED':
              case 'DROPPED': localStatus = 'ended'; break
              default: localStatus = 'dialing'
            }
            
            const call = newMap.get(matchingCall.id)
            if (call) {
              newMap.set(matchingCall.id, { 
                ...call, 
                status: localStatus,
                callId: latestEvent.parties[0]?.callId || call.callId
              })
            }
            
            // Handle call ending
            if (localStatus === 'ended') {
              setTimeout(() => removeCall(matchingCall.id), 2000)
            }
          }
          
          return newMap
        })
      }
      
      // Handle any event with callStatus field (general fallback)
      if (latestEvent.parties?.[0]?.callStatus && !['INCOMING_CALL', 'DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType)) {
        console.log('Event with callStatus field received:', latestEvent.eventType, latestEvent.parties[0].callStatus)
        
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          let matchingCall = Array.from(newMap.values()).find(call => 
            call.callId === latestEvent.parties[0]?.callId
          )
          
          // If not found by callId, try to find by addresses
          if (!matchingCall) {
            matchingCall = Array.from(newMap.values()).find(call => 
              call.callingAddress === latestEvent.parties[0]?.callingAddress && 
              call.calledAddress === latestEvent.parties[0]?.calledAddress
            )
          }
          
          if (matchingCall) {
            console.log('Matching call found for event with callStatus:', matchingCall.number, 'status:', latestEvent.parties[0].callStatus)
            
            // Map CTI call status to our local status
            let localStatus: string
            switch (latestEvent.parties[0].callStatus) {
              case 'RINGING': localStatus = 'ringing'; break
              case 'CONNECTED': localStatus = 'connected'; break
              case 'ON_HOLD': localStatus = 'onHold'; break
              case 'ENDED':
              case 'DISCONNECTED':
              case 'DROPPED': localStatus = 'ended'; break
              default: localStatus = 'dialing'
            }
            
            const call = newMap.get(matchingCall.id)
            if (call) {
              newMap.set(matchingCall.id, { 
                ...call, 
                status: localStatus,
                callId: latestEvent.parties[0]?.callId || call.callId,
                callingAddress: latestEvent.parties[0]?.callingAddress || call.callingAddress,
                calledAddress: latestEvent.parties[0]?.calledAddress || call.calledAddress,
                callingDeviceName: latestEvent.parties[0]?.callingDeviceName || call.callingDeviceName
              })
            }
            
            // Handle call ending
            if (localStatus === 'ended') {
              setTimeout(() => removeCall(matchingCall.id), 2000)
            }
          }
          
          return newMap
        })
      }
      
      // Handle any event with CONNECTED status (ensure we catch all connected events)
      if (latestEvent.parties?.[0]?.callStatus === 'CONNECTED') {
        console.log('CONNECTED status event received:', latestEvent.eventType, latestEvent.eventName)
        
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          let matchingCall = Array.from(newMap.values()).find(call => 
            call.callId === latestEvent.parties[0]?.callId
          )
          
          // If not found by callId, try to find by addresses
          if (!matchingCall) {
            matchingCall = Array.from(newMap.values()).find(call => 
              call.callingAddress === latestEvent.parties[0]?.callingAddress && 
              call.calledAddress === latestEvent.parties[0]?.calledAddress
            )
          }
          
                      if (matchingCall) {
              console.log('Updating call to CONNECTED status:', matchingCall.number, 'from status:', matchingCall.status)
              
              const call = newMap.get(matchingCall.id)
              if (call) {
                newMap.set(matchingCall.id, { 
                  ...call, 
                  status: 'connected',
                  callId: latestEvent.parties[0]?.callId || call.callId,
                  callingAddress: latestEvent.parties[0]?.callingAddress || call.callingAddress,
                  calledAddress: latestEvent.parties[0]?.calledAddress || call.calledAddress,
                  callingDeviceName: latestEvent.parties[0]?.callingDeviceName || call.callingDeviceName
                })
                
                console.log('Call status updated successfully to connected')
              }
                        } else {
              // If no matching call found, check if we should create one for outgoing calls
              if (latestEvent.parties[0]?.callingAddress === userAddress) {
                // Check if this call already exists to prevent duplicates
                const existingCall = findExistingCall(
                  latestEvent.parties[0]?.callId,
                  latestEvent.parties[0]?.callingAddress,
                  latestEvent.parties[0]?.calledAddress
                )
                
                if (existingCall) {
                  console.log('Call already exists, updating instead of creating new:', existingCall.number)
                  // Update the existing call with new information
                  const call = newMap.get(existingCall.id)
                  if (call) {
                    newMap.set(existingCall.id, { 
                      ...call, 
                      status: 'connected',
                      callId: latestEvent.parties[0]?.callId || call.callId,
                      callingAddress: latestEvent.parties[0]?.callingAddress || call.callingAddress,
                      calledAddress: latestEvent.parties[0]?.calledAddress || call.calledAddress,
                      callingDeviceName: latestEvent.parties[0]?.callingDeviceName || call.callingDeviceName
                    })
                  }
                } else {
                  console.log('Creating new call entry for CONNECTED event')
                  const newCallId = `connected_${Date.now()}`
                  const newCall = {
                    id: newCallId,
                    number: latestEvent.parties[0]?.calledAddress || 'Unknown',
                    status: 'connected',
                    startTime: new Date(),
                    callId: latestEvent.parties[0]?.callId,
                    callingAddress: latestEvent.parties[0]?.callingAddress,
                    calledAddress: latestEvent.parties[0]?.calledAddress,
                    callingDeviceName: latestEvent.parties[0]?.callingDeviceName,
                    duration: 0
                  }
                  
                  newMap.set(newCallId, newCall)
                  
                  setTimeout(() => {
                    toast.success(`Call to ${newCall.number} connected!`)
                  }, 0)
                }
              }
            }
          
          return newMap
        })
      }
      
      // Handle call termination events
      if (['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType) && latestEvent.parties) {
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const matchingCall = Array.from(newMap.values()).find(call => 
            call.callId === latestEvent.parties[0]?.callId
          )
          
          if (matchingCall) {
            console.log(`${latestEvent.eventType} event received for active call:`, matchingCall)
            
            // Update call status to ended
            const call = newMap.get(matchingCall.id)
            if (call) {
              newMap.set(matchingCall.id, { ...call, status: 'ended' })
            }
            
            // Remove ended call after a delay - use the callId from the closure
            const callIdToRemove = matchingCall.id
            setTimeout(() => removeCall(callIdToRemove), 2000)
            
            // Show toast outside of setState to avoid side effects
            setTimeout(() => {
              toast.info(`Call to ${matchingCall.number} ${latestEvent.eventType.toLowerCase()}`)
            }, 0)
          }
          
          return newMap
        })
      }
    }
  }, [eventLog]) // Removed activeCalls dependency

  // Timer effect for call duration - now handles multiple calls
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    
    // Get current active calls to avoid closure issues
    const currentActiveCalls = Array.from(activeCalls.entries())
    
    currentActiveCalls.forEach(([callId, call]) => {
      if (call.status === 'connected') {
        const interval = setInterval(() => {
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            const existingCall = newMap.get(callId)
            // Only update if the call still exists and is still connected
            if (existingCall && existingCall.status === 'connected') {
              // Update duration in the call object
              const now = new Date()
              const duration = Math.round((now.getTime() - existingCall.startTime.getTime()) / 1000)
              newMap.set(callId, { ...existingCall, duration })
            }
            return newMap
          })
        }, 1000)
        intervals.push(interval)
      }
    })
    
    return () => {
      intervals.forEach(interval => clearInterval(interval))
    }
  }, [activeCalls.size]) // Only depend on the size, not the entire Map

  // Utility functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'dialing': return 'warning'
      case 'ringing': return 'info'
      case 'onHold': return 'warning'
      case 'ended': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return 'call'
      case 'dialing': return 'call_made'
      case 'ringing': return 'ring_volume'
      case 'onHold': return 'pause_circle'
      case 'ended': return 'call_end'
      default: return 'phone'
    }
  }

  // Get active calls count
  const getActiveCallsCount = () => {
    return Array.from(activeCalls.values()).filter(call => 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    ).length
  }

  const canMergeCalls = () => {
    const activeCallsList = Array.from(activeCalls.values()).filter(call => 
      ['connected', 'onHold'].includes(call.status)
    )
    return activeCallsList.length >= 2
  }

  const getMergeableCalls = () => {
    return Array.from(activeCalls.values()).filter(call => 
      ['connected', 'onHold'].includes(call.status)
    )
  }

  const toggleCallSelectionForMerge = (callId: string) => {
    setSelectedCallsForMerge(prev => {
      const newSet = new Set(prev)
      if (newSet.has(callId)) {
        // Remove if already selected
        newSet.delete(callId)
      } else {
        // Add if not selected, but limit to 2 calls
        if (newSet.size < 2) {
          newSet.add(callId)
        } else {
          // If already 2 selected, replace the first one
          const firstCallId = Array.from(newSet)[0]
          newSet.delete(firstCallId)
          newSet.add(callId)
        }
      }
      return newSet
    })
  }

  const isCallSelectedForMerge = (callId: string) => {
    return selectedCallsForMerge.has(callId)
  }

  const findExistingCall = (callId?: string, callingAddress?: string, calledAddress?: string) => {
    if (!callId && !callingAddress && !calledAddress) return null
    
    return Array.from(activeCalls.values()).find(call => {
      // Match by callId if available
      if (callId && call.callId === callId) return true
      
      // Match by addresses if available
      if (callingAddress && calledAddress && 
          call.callingAddress === callingAddress && 
          call.calledAddress === calledAddress) return true
      
      // Match by number and calling address
      if (callingAddress && call.callingAddress === callingAddress && 
          call.number === calledAddress) return true
      
      return false
    })
  }

  const isDuplicateCall = (callId?: string, callingAddress?: string, calledAddress?: string) => {
    return findExistingCall(callId, callingAddress, calledAddress) !== null
  }

  const cleanupDuplicateCalls = () => {
    setActiveCalls(prev => {
      const newMap = new Map(prev)
      const seenCalls = new Map<string, string>() // number -> callId
      const toRemove: string[] = []
      
      // Find duplicate calls by number
      Array.from(newMap.values()).forEach(call => {
        if (seenCalls.has(call.number)) {
          // Keep the one with the most recent startTime, remove the older one
          const existingCallId = seenCalls.get(call.number)!
          const existingCall = newMap.get(existingCallId)
          
          if (existingCall && call.startTime < existingCall.startTime) {
            toRemove.push(call.id)
          } else {
            toRemove.push(existingCallId)
            seenCalls.set(call.number, call.id)
          }
        } else {
          seenCalls.set(call.number, call.id)
        }
      })
      
      // Remove duplicate calls
      toRemove.forEach(callId => {
        newMap.delete(callId)
        console.log('Removed duplicate call:', callId)
      })
      
      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} duplicate calls`)
      }
      
      return newMap
    })
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
              {getActiveCallsCount() > 0 && (
                <Badge bg="success" className="ms-2">
                  {getActiveCallsCount()} Active Call{getActiveCallsCount() !== 1 ? 's' : ''}
                </Badge>
              )}
            </h2>
            <Link href="/cti" className="btn btn-outline-secondary">
              <i className="material-icons-two-tone me-2">arrow_back</i>
              Back to CTI
            </Link>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Dialer Section */}
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
                {/* Extensions */}
                <Col md={4} style={{ backgroundColor: '#2c466159' }}>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 text-start mt-3">
                      <i className="material-icons-two-tone me-2">people</i>
                      Available Extensions
                    </h6>
                    
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search extensions..."
                        value={extensionSearch}
                        onChange={(e) => setExtensionSearch(e.target.value)}
                      />
                      {extensionSearch && (
                        <button
                          className="btn btn-outline-secondary mt-2"
                          type="button"
                          onClick={() => setExtensionSearch('')}
                        >
                          <i className="material-icons-two-tone">clear</i>
                        </button>
                      )}
                    </div>

                    <div className="extensions-grid mb-3">
                      {getFilteredExtensions().map(({ dn, devices }) => {
                        const deviceList = Object.values(devices || {})
                        const cls = getCardLevelStatus(deviceList)
                        const isOnline = cls === 'registered'
                        const hasActiveCall = isDnInActiveCall(dn)
                        const activeCall = getActiveCallForNumber(dn)
                        
                        return (
                          <button
                            key={dn}
                            type="button"
                            className={`extension-button ${isOnline ? 'online' : 'offline'} ${
                              dialedNumber === dn ? 'selected' : ''
                            } ${hasActiveCall ? 'active-call' : ''}`}
                            onClick={() => handleExtensionClick(dn)}
                            disabled={!isOnline || hasActiveCall}
                            title={`${dn} - ${isOnline ? 'Online' : 'Offline'}${hasActiveCall ? ` (${activeCall?.status} Call)` : ''}`}
                          >
                            <div className="d-flex flex-column align-items-center">
                              <span className="fw-bold">{dn}</span>
                              <small className={isOnline ? 'text-success' : 'text-muted'}>
                                {isOnline ? '● Online' : '○ Offline'}
                              </small>
                              {hasActiveCall && activeCall && (
                                <small className="text-primary">
                                  ● {activeCall.status.charAt(0).toUpperCase() + activeCall.status.slice(1)}
                                </small>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
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

                {/* Dial Pad */}
                <Col md={8} style={{ backgroundColor: 'rgb(44 70 97)' }}>
                  {/* Display Number */}
                  <div className="mb-4">
                    <div className="display-4 fw-bold mb-2 text-primary">
                      {dialedNumber || '0'}
                    </div>
                    
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
                      disabled={!dialedNumber.trim() || isDialing || !isDialedNumberValid(dialedNumber) || !canDialNumber(dialedNumber).canDial}
                    >
                      <i className="material-icons-two-tone me-2">call</i>
                      {isDialing ? 'Dialing...' : 'Dial'}
                    </Button>
                    
                    {/* Show warning if number is already in active call */}
                    {/* {dialedNumber && !canDialNumber(dialedNumber).canDial && (
                      <div className="alert alert-warning py-2">
                        <i className="material-icons-two-tone me-2">warning</i>
                        <small>{canDialNumber(dialedNumber).reason}</small>
                      </div>
                    )} */}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Call Progress Section */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="material-icons-two-tone me-2">call</i>
                  Active Calls ({getActiveCallsCount()})
                  {canMergeCalls() && (
                    <Badge bg="info" className="ms-2">
                      <i className="material-icons-two-tone me-1">call_merge</i>
                      Merge Available
                    </Badge>
                  )}
                </h5>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={cleanupDuplicateCalls}
                  title="Clean up duplicate calls"
                >
                  <i className="material-icons-two-tone me-1">cleanup</i>
                  Clean Duplicates
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Merge Calls Section */}
              {canMergeCalls() && (
                <div className="mb-4">
                  <Alert variant="info">
                    <h6 className="mb-3">
                      <i className="material-icons-two-tone me-2">call_merge</i>
                      Merge Calls
                    </h6>
                    <p className="mb-3">
                      Select two calls to merge them into a conference call.
                    </p>
                    
                    {/* Call Selection for Merge */}
                    <div className="row g-2 mb-3">
                      {getMergeableCalls().map((call) => (
                        <div key={call.id} className="col-md-6">
                          <div 
                            className={`p-3 border rounded cursor-pointer merge-call-selection ${
                              isCallSelectedForMerge(call.id) 
                                ? 'selected' 
                                : ''
                            }`}
                            onClick={() => toggleCallSelectionForMerge(call.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{call.number}</strong>
                                <br />
                                <small className={isCallSelectedForMerge(call.id) ? 'text-white-50' : 'text-muted'}>
                                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                                </small>
                              </div>
                              <div>
                                {isCallSelectedForMerge(call.id) && (
                                  <i className="material-icons-two-tone text-white">check_circle</i>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Merge Button */}
                    <div className="text-center">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleMergeCalls}
                        disabled={selectedCallsForMerge.size !== 2}
                      >
                        <i className="material-icons-two-tone me-2">call_merge</i>
                        Merge Selected Calls
                      </Button>
                      {selectedCallsForMerge.size > 0 && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2"
                          onClick={() => setSelectedCallsForMerge(new Set())}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </Alert>
                </div>
              )}
              <Row>
              {Array.from(activeCalls.values()).filter(call => 
                ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
              ).map((call) => (
                <Col md={6} key={call.id} className="mb-4">
                  <Alert 
                    variant={isCallSelectedForMerge(call.id) ? "primary" : "info"} 
                    className={`text-center ${isCallSelectedForMerge(call.id) ? 'border-primary border-3' : ''}`}
                  >
                    <h6 className="mb-2">
                      Call to {call.number}
                      {isCallSelectedForMerge(call.id) && (
                        <span className="ms-2">
                          <i className="material-icons-two-tone text-primary">check_circle</i>
                          Selected for Merge
                        </span>
                      )}
                    </h6>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      {/* <i className={`material-icons-two-tone me-2 text-${getStatusBadgeVariant(call.status)}`}>
                        {getStatusIcon(call.status)}
                      </i> */}
                      <span className="text-capitalize fw-bold">
                        {call.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="small text-muted">
                      Started: {call.startTime.toLocaleTimeString()}
                    </div>
                    
                    {(call.status === 'connected' || call.status === 'onHold') && call.duration && (
                      <div className="mt-2">
                        <div className="h5 text-success mb-0">
{formatDuration(call.duration)}
                        </div>
                        
                      </div>
                    )}
                    
                    {/* {call.callId && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted d-block">Call ID: <strong>{call.callId}</strong></small>
                        <small className="text-muted d-block">From: <strong>{call.callingAddress}</strong></small>
                        <small className="text-muted d-block">To: <strong>{call.calledAddress}</strong></small>
                        {call.callingDeviceName && (
                          <small className="text-muted d-block">Device: <strong>{call.callingDeviceName}</strong></small>
                        )}
                      </div>
                    )} */}
                  </Alert>

                  {/* Call Control Buttons */}
                  <div className="row g-2 mb-3">
                    {call.status === 'connected' && (
                      <>
                        <div className="col-6">
                          <Button
                            variant="warning"
                            size="sm"
                            className="w-100"
                            onClick={() => handleHoldCall(call.id)}
                            disabled={processingCalls.has(call.id)}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Hold Call'}
                          </Button>
                        </div>
                        <div className="col-6">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100"
                            onClick={() => handleEndCall(call.id)}
                            disabled={processingCalls.has(call.id)}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'End Call'}
                          </Button>
                        </div>
                      </>
                    )}

                    {call.status === 'onHold' && (
                      <>
                        <div className="col-6">
                          <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={() => handleResumeCall(call.id)}
                            disabled={processingCalls.has(call.id)}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Resume Call'}
                          </Button>
                        </div>
                        <div className="col-6">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100"
                            onClick={() => handleEndCall(call.id)}
                            disabled={processingCalls.has(call.id)}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'End Call'}
                          </Button>
                        </div>
                      </>
                    )}

                    {call.status === 'dialing' && (
                      <div className="col-12">
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-100"
                          onClick={() => handleEndCall(call.id)}
                          disabled={processingCalls.has(call.id)}
                        >
                          {processingCalls.has(call.id) ? 'Processing...' : 'Cancel'}
                        </Button>
                      </div>
                    )}

                    {call.status === 'ringing' && (
                      <div className="col-12">
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-100"
                          onClick={() => handleEndCall(call.id)}
                          disabled={processingCalls.has(call.id)}
                        >
                          {processingCalls.has(call.id) ? 'Processing...' : 'Cancel'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Col>
              ))}

              {getActiveCallsCount() === 0 && (
                <Col md={12} className="text-center text-muted py-4">
                  <i className="material-icons-two-tone mb-2" style={{ fontSize: '3rem' }}>call_end</i>
                  <p>No active calls</p>
                </Col>
              )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
          display: block;
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
        
        /* Merge call selection styles */
        .merge-call-selection {
          transition: all 0.2s ease;
        }
        
        .merge-call-selection:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .merge-call-selection.selected {
          border-color: #0d6efd !important;
          background-color: #0d6efd !important;
          color: white !important;
        }
        
        .merge-call-selection.selected:hover {
          background-color: #0b5ed7 !important;
        }
      `}</style>
    </React.Fragment>
  )
}

CtiDialer.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDialer
