import React, { ReactElement, useState, useEffect, useRef } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Row, Alert, Badge } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Link from 'next/link'
import useCtiStomp from '../../../hooks/useCtiStomp'
import { makeCall, endCall, holdCall, resumeCall, getCallingDeviceInfo, mergeCalls,transferCalls } from '../../../utils/dialer'
import Select from 'react-select'

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
  const [isInProtectedMode, setIsInProtectedMode] = useState(false)
  const [transferCallId, setTransferCallId] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [mergedCalls, setMergedCalls] = useState<Map<string, {
    id: string
    mergedCallId: string
    members: Array<{
      id: string
      number: string
      callId: string
      callingAddress?: string
      calledAddress?: string
      callingDeviceName?: string
      callingDeviceType?: string
      startTime: Date
      status: string
    }>
    startTime: Date
    status: string
  }>>(new Map())
  const processedEventsRef = useRef<Set<string>>(new Set())

  // Helper functions
  const getAvailableExtensions = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .map(({ dn }) => dn)
  }

  const getAvailableExtensionsForTransfer = () => {
    return Object.values(dnsMap)
      .filter(({ dn }) => dn !== userAddress)
      .filter(({ dn }) => {
        // Filter out extensions that are currently in calls
        const isInCall = Array.from(activeCalls.values()).some(call => 
          call.number === dn && ['connected', 'ringing', 'dialing'].includes(call.status)
        )
        return !isInCall
      })
      .map(({ dn }) => dn)
  }

  // Save call states to localStorage
  const saveCallStatesToStorage = (calls: Map<string, any>) => {
    try {
      console.log('Saving call states to localStorage...')
      
      // Convert activeCalls to the format expected by localStorage
      const callsToPersist: Record<string, any> = {}
      calls.forEach((call, callId) => {
        if (call.status === 'connected' || call.status === 'retrieved') {
          callsToPersist[callId] = {
            callId: callId,
            eventTime: call.startTime?.toISOString(),
            parties: [{
              callId: callId,
              callingAddress: call.callingAddress,
              calledAddress: call.calledAddress,
              callingDeviceName: call.callingDeviceName,
              callingDeviceType: call.callingDeviceType,
              callStatus: call.status.toUpperCase()
            }],
            isTerminating: false
          }
        }
      })

      // Also save merged calls
      if (mergedCalls.size > 0) {
        const mergedCallsToPersist: Record<string, any> = {}
        mergedCalls.forEach((mergedCall, mergedCallId) => {
          mergedCallsToPersist[mergedCallId] = {
            callId: mergedCallId,
            eventTime: mergedCall.startTime.toISOString(),
            parties: mergedCall.members.map(member => ({
              callId: member.callId,
              callingAddress: member.callingAddress,
              calledAddress: member.calledAddress,
              callingDeviceName: member.callingDeviceName,
              callingDeviceType: member.callingDeviceType,
              callStatus: member.status.toUpperCase()
            })),
            isTerminating: false,
            isMerged: true,
            members: mergedCall.members
          }
        })
        
        // Save merged calls to separate localStorage key
        localStorage.setItem('cti_merged_calls', JSON.stringify(mergedCallsToPersist))
        console.log('Saved merged calls to localStorage:', mergedCallsToPersist)
      } else {
        localStorage.removeItem('cti_merged_calls')
        console.log('Cleared merged calls from localStorage')
      }

      if (Object.keys(callsToPersist).length > 0) {
        localStorage.setItem('cti_call_states', JSON.stringify(callsToPersist))
        localStorage.setItem('cti_call_states_timestamp', new Date().toISOString())
        console.log('Saved call states to localStorage:', callsToPersist)
      } else {
        // If no active calls, clear storage
        localStorage.removeItem('cti_call_states')
        localStorage.removeItem('cti_call_states_timestamp')
        console.log('No active calls to persist, cleared localStorage')
      }
    } catch (error) {
      console.error('Error saving call states to localStorage:', error)
    }
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
    
    // Enter protected mode to prevent premature termination of existing calls
    setIsInProtectedMode(true)
    
    // Auto-exit protected mode after 30 seconds to prevent indefinite protection
    setTimeout(() => {
      if (isInProtectedMode) {
        console.log('Auto-exiting protected mode after 30 seconds')
        setIsInProtectedMode(false)
      }
    }, 30000)
    
    // Don't create a call entry here - let the CTI events handle it
    // This prevents duplicate call entries from being created

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
        
        // if (localCallStatus === 'ended') {
        //   toast.info(`Call to ${dialedNumber} has ended`)
        //   return
        // }
        
        // toast.success(`Call ${localCallStatus === 'connected' ? 'connected' : 'initiated'} to ${dialedNumber}`)
      } else {
        console.error('Dial API error:', result.error)
        setCallStatus('ended')
        toast.error(`Failed to connect: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling dial API:', error)
      setCallStatus('ended')
      toast.error('Failed to connect: Network error')
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
      // Save to localStorage after updating
      setTimeout(() => saveCallStatesToStorage(newMap), 0)
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
    // Clear merged calls
    setMergedCalls(new Map())
    // Clear localStorage
    localStorage.removeItem('cti_call_states')
    localStorage.removeItem('cti_call_states_timestamp')
    localStorage.removeItem('cti_merged_calls')
    
    setCallStatus('idle')
    setDialedNumber('')
    setShowInvalidWarning(false)
    setCallStartTime(null)
    setCallDuration(0)
    setProcessingCalls(new Set())
    setSelectedCallsForMerge(new Set())
    processedEventsRef.current.clear()
    
    //console.log('Manually cleared all call-related data')
    toast.info('All call data cleared')
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
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
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
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
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
        // Create merged call entry
        const mergedCallId = `merged_${Date.now()}`
        const mergedCall = {
          id: mergedCallId,
          mergedCallId: mergedCallId, // Use generated ID
          members: [
            {
              id: heldCall.id,
              number: heldCall.number,
              callId: heldCall.callId,
              callingAddress: heldCall.callingAddress,
              calledAddress: heldCall.calledAddress,
              callingDeviceName: heldCall.callingDeviceName,
              callingDeviceType: heldCall.callingDeviceType,
              startTime: heldCall.startTime,
              status: 'connected'
            },
            {
              id: activeCall.id,
              number: activeCall.number,
              callId: activeCall.callId,
              callingAddress: activeCall.callingAddress,
              calledAddress: activeCall.calledAddress,
              callingDeviceName: activeCall.callingDeviceName,
              callingDeviceType: activeCall.callingDeviceType,
              startTime: activeCall.startTime,
              status: 'connected'
            }
          ],
          startTime: new Date(),
          status: 'connected'
        }

        // Add to merged calls
        setMergedCalls(prev => {
          const newMap = new Map(prev)
          newMap.set(mergedCallId, mergedCall)
          return newMap
        })

        // Remove both calls from active calls
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          newMap.delete(heldCall.id)
          newMap.delete(activeCall.id)
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
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

  const handleTransferCall = async (callId: string, targetExtension: string) => {
    // Check if this is a call from activeCalls or a member from mergedCalls
    let call = activeCalls.get(callId)
    let isMergedCallMember = false
    
    if (!call) {
      // Check if it's a merged call member
      for (const mergedCall of Array.from(mergedCalls.values())) {
        const member = mergedCall.members.find((m: any) => m.id === callId)
        if (member) {
          call = member
          isMergedCallMember = true
          break
        }
      }
    }
    
    if (!call) {
      toast.error('Call not found')
      return
    }

    // Check if call has a valid callId
    if (!call.callId) {
      toast.error('Call ID not available yet. Please wait for the call to be established.')
      return
    }

    // Check if target extension is valid
    if (!isDialedNumberValid(targetExtension)) {
      toast.error('Invalid target extension')
      return
    }

    // Check if target extension is available (not in a call)
    const targetCall = Array.from(activeCalls.values()).find(c => 
      c.number === targetExtension && ['connected', 'ringing', 'dialing'].includes(c.status)
    )
    
    if (targetCall) {
      toast.error(`Extension ${targetExtension} is currently busy`)
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

      // Call the transfer API
      const result = await transferCalls({
        callId: call.callId,
        transferInitiatorAddress: callingDevice.callingAddress,
        transferInitiatorDeviceType: callingDevice.callingDeviceType,
        transferInitiatorDeviceName: callingDevice.callingDeviceName,
        transferAddress: call.calledAddress || call.number,
        targetAddress: targetExtension,
        mode: 'BLIND'
      })

      if (result.success) {
        if (isMergedCallMember) {
          // Handle transfer of merged call member
          // Remove the member from the merged call
          setMergedCalls(prev => {
            const newMap = new Map(prev)
            for (const [mergedCallId, mergedCall] of Array.from(newMap.entries())) {
              const memberIndex = mergedCall.members.findIndex((m: any) => m.id === callId)
              if (memberIndex !== -1) {
                const updatedMembers = mergedCall.members.filter((m: any) => m.id !== callId)
                
                if (updatedMembers.length === 0) {
                  // If no members left, remove the entire merged call
                  newMap.delete(mergedCallId)
                  console.log('Removed merged call with no members left after transfer')
                } else if (updatedMembers.length === 1) {
                  // If only one member left, convert back to regular call
                  const remainingMember = updatedMembers[0]
                  const regularCall = {
                    id: remainingMember.id,
                    number: remainingMember.number,
                    startTime: remainingMember.startTime,
                    status: remainingMember.status,
                    callId: remainingMember.callId,
                    callingAddress: remainingMember.callingAddress,
                    calledAddress: remainingMember.calledAddress,
                    callingDeviceName: remainingMember.callingDeviceName,
                    callingDeviceType: remainingMember.callingDeviceType,
                    duration: 0
                  }
                  
                  // Add back to active calls
                  setActiveCalls(prev => {
                    const newActiveMap = new Map(prev)
                    newActiveMap.set(remainingMember.id, regularCall)
                    return newActiveMap
                  })
                  
                  // Remove the merged call
                  newMap.delete(mergedCallId)
                  console.log('Converted merged call back to regular call after transfer')
                } else {
                  // Update the merged call with remaining members
                  newMap.set(mergedCallId, {
                    ...mergedCall,
                    members: updatedMembers
                  })
                  console.log('Updated merged call after member transfer')
                }
                break
              }
            }
            
            // Save to localStorage after updating
            setTimeout(() => {
              const currentActiveCalls = new Map(activeCalls)
              saveCallStatesToStorage(currentActiveCalls)
            }, 0)
            
            return newMap
          })
        } else {
          // Handle transfer of regular call
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            const existingCall = newMap.get(callId)
            if (existingCall) {
              newMap.set(callId, { ...existingCall, status: 'ended' })
            }
            // Save to localStorage after updating
            setTimeout(() => saveCallStatesToStorage(newMap), 0)
            return newMap
          })
          
          // Remove transferred call after a delay
          setTimeout(() => removeCall(callId), 2000)
        }
        
        // Close transfer modal
        setShowTransferModal(false)
        setTransferCallId(null)
        setTransferTarget('')
        
        toast.success(`Call transferred to ${targetExtension} successfully`)
      } else {
        console.error('Transfer call API error:', result.error)
        toast.error(`Failed to transfer call: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling transfer call API:', error)
      toast.error('Failed to transfer call: Network error')
    } finally {
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
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
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
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
      
      // Safety check: ensure we have a valid event with parties data
      if (!latestEvent || !latestEvent.parties || !Array.isArray(latestEvent.parties) || latestEvent.parties.length === 0) {
        console.warn('Invalid event data received:', latestEvent)
        return
      }
      
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
        setTimeout(() => cleanupEndedCalls(), 150)
        setTimeout(() => cleanupDuplicateMergedMembers(), 200)
      }
      
      // Log current state after processing event
      console.log('Active calls after processing event:', Array.from(activeCalls.values()).map(call => ({
        id: call.id,
        number: call.number,
        status: call.status,
        callId: call.callId,
        startTime: call.startTime.toLocaleTimeString(),
        duration: call.duration
      })))
      
      // Special logging for RINGING calls to track status preservation
      const ringingCalls = Array.from(activeCalls.values()).filter(call => call.status === 'ringing')
      if (ringingCalls.length > 0) {
        console.log('RINGING calls that should maintain their status:', ringingCalls.map(call => ({
          id: call.id,
          number: call.number,
          status: call.status,
          callId: call.callId
        })))
      }
      
      // Log the specific event that was processed
      console.log('Event processed successfully:', {
        eventType: latestEvent.eventType,
        callStatus: latestEvent.parties?.[0]?.callStatus,
        callingAddress: latestEvent.parties?.[0]?.callingAddress,
        calledAddress: latestEvent.parties?.[0]?.calledAddress
      })
      
      
      // Log all events for debugging
      console.log('CTI Event received:', {
        eventType: latestEvent?.eventType,
        eventName: latestEvent?.eventName,
        parties: latestEvent?.parties,
        callStatus: latestEvent?.parties?.[0]?.callStatus,
        callId: latestEvent?.parties?.[0]?.callId,
        callingAddress: latestEvent?.parties?.[0]?.callingAddress,
        calledAddress: latestEvent?.parties?.[0]?.calledAddress
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
      
      // Helper function to find or create a call entry
      const findOrCreateCall = (eventData: any) => {
        // Safety check: ensure we have valid event data
        if (!eventData || !eventData.callingAddress || !eventData.calledAddress) {
          console.warn('Invalid event data passed to findOrCreateCall:', eventData)
          return null
        }
        
        const { callId, callingAddress, calledAddress, callStatus, callingDeviceName } = eventData
        
        // First try to find by callId (most reliable)
        let existingCall = Array.from(activeCalls.values()).find(call => 
          call.callId === callId && callId
        )
        
        // If not found by callId, try to find by addresses
        if (!existingCall) {
          existingCall = Array.from(activeCalls.values()).find(call => 
            call.callingAddress === callingAddress && 
            call.calledAddress === calledAddress
          )
        }
        
        // If still not found, try to find by number (for outgoing calls)
        if (!existingCall && callingAddress === userAddress) {
          existingCall = Array.from(activeCalls.values()).find(call => 
            call.number === calledAddress && 
            ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
          )
        }
        
        // If still not found, try to find by number (for incoming calls)
        if (!existingCall && calledAddress === userAddress) {
          existingCall = Array.from(activeCalls.values()).find(call => 
            call.number === callingAddress && 
            ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
          )
        }
        
        return existingCall
      }
      
      // Helper function to update call status
      const updateCallStatus = (callId: string, newStatus: string, eventData?: any) => {
        // Safety check: ensure we have valid parameters
        if (!callId || !newStatus) {
          console.warn('Invalid parameters passed to updateCallStatus:', { callId, newStatus })
          return
        }
        
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          const existingCall = newMap.get(callId)
          if (existingCall) {
            // Validate status transition
            const validTransitions: { [key: string]: string[] } = {
              'dialing': ['ringing', 'connected', 'ended'],
              'ringing': ['connected', 'ended'],
              'connected': ['onHold', 'ended'],
              'onHold': ['connected', 'ended'],
              'ended': []
            }
            
            const currentStatus = existingCall.status
            if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
              console.warn(`Invalid status transition from ${currentStatus} to ${newStatus} for call ${existingCall.number}`, {
                callId: existingCall.id,
                number: existingCall.number,
                oldStatus: currentStatus,
                newStatus: newStatus,
                validTransitions: validTransitions[currentStatus],
                eventData: eventData
              })
              return newMap
            }
            
            // Special protection for RINGING status - only allow CONNECTED to override it
            if (currentStatus === 'ringing' && newStatus === 'connected' && eventData?.callStatus !== 'CONNECTED') {
              console.warn(`🚫 BLOCKED: Preventing status override from RINGING to CONNECTED without explicit CONNECTED event`, {
                callId: existingCall.id,
                number: existingCall.number,
                oldStatus: currentStatus,
                newStatus: newStatus,
                eventCallStatus: eventData?.callStatus,
                eventData: eventData
              })
              return newMap
            }
            
            // Update start time when transitioning to connected state for accurate timing
            let newStartTime = existingCall.startTime
            if (newStatus === 'connected' && existingCall.status !== 'connected') {
              newStartTime = new Date()
              console.log(`Call ${existingCall.number} connected`)
            }
            
            const updatedCall = {
              ...existingCall,
              status: newStatus,
              startTime: newStartTime,
              ...(eventData?.callId && { callId: eventData.callId }),
              ...(eventData?.callingAddress && { callingAddress: eventData.callingAddress }),
              ...(eventData?.calledAddress && { calledAddress: eventData.calledAddress }),
              ...(eventData?.callingDeviceName && { callingDeviceName: eventData.callingDeviceName })
            }
            newMap.set(callId, updatedCall)
            console.log(`Updated call ${existingCall.number} status from ${currentStatus} to ${newStatus}`, {
              callId: existingCall.id,
              number: existingCall.number,
              oldStatus: currentStatus,
              newStatus: newStatus,
              eventData: eventData
            })
            
            // Save to localStorage after updating
            setTimeout(() => saveCallStatesToStorage(newMap), 0)
          }
          return newMap
        })
      }
      
      // Helper function to create new call entry
      const createNewCall = (eventData: any, status: string = 'ringing') => {
        // Safety check: ensure we have valid event data
        if (!eventData || !eventData.callingAddress || !eventData.calledAddress) {
          console.warn('Invalid event data passed to createNewCall:', eventData)
          return null
        }
        
        const { callId, callingAddress, calledAddress, callingDeviceName } = eventData
        
        // Validate input data
        if (!callingAddress || !calledAddress) {
          console.warn('Missing calling or called address, cannot create call entry')
          return null
        }
        
        // Determine if this is incoming or outgoing call
        const isIncoming = calledAddress === userAddress
        const callNumber = isIncoming ? callingAddress : calledAddress
        
        // Validate call number
        if (!callNumber || callNumber === 'Unknown') {
          console.warn('Invalid call number, cannot create call entry')
          return null
        }
        
        // Check if we already have a call for this number to prevent duplicates
        const existingCallForNumber = Array.from(activeCalls.values()).find(call => 
          call.number === callNumber && 
          ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
        )
        
        if (existingCallForNumber) {
                      console.log(`Call already exists for number ${callNumber}, updating instead of creating new`)
          // Update the existing call with new information
          updateCallStatus(existingCallForNumber.id, status, eventData)
          return existingCallForNumber.id
        }
        
        // Also check if we have a call with the same callId to prevent duplicates
        if (callId) {
          const existingCallById = Array.from(activeCalls.values()).find(call => 
            call.callId === callId
          )
          
          if (existingCallById) {
            console.log(`Call already exists with callId ${callId}, updating instead of creating new`)
            updateCallStatus(existingCallById.id, status, eventData)
            return existingCallById.id
          }
        }
        
        // Additional check: if this is an outgoing call, check if we have any dialing/ringing calls
        // that might be the same call in a different state
        if (!isIncoming && callingAddress === userAddress) {
          const existingOutgoingCall = Array.from(activeCalls.values()).find(call => 
            call.callingAddress === userAddress && 
            call.number === calledAddress &&
            ['dialing', 'ringing'].includes(call.status)
          )
          
          if (existingOutgoingCall) {
            console.log(`Outgoing call already exists for ${calledAddress}, updating instead of creating new`)
            updateCallStatus(existingOutgoingCall.id, status, eventData)
            return existingOutgoingCall.id
          }
        }
        
        // Create new call entry
        const newCallId = `${isIncoming ? 'incoming' : 'outgoing'}_${Date.now()}`
        const newCall = {
          id: newCallId,
          number: callNumber,
          status: status,
          startTime: new Date(),
          callId: callId,
          callingAddress: callingAddress,
          calledAddress: calledAddress,
          callingDeviceName: callingDeviceName,
          duration: 0
        }
        
        setActiveCalls(prev => {
          const newMap = new Map(prev)
          newMap.set(newCallId, newCall)
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
          return newMap
        })
        
                    console.log(`Created new ${status} call entry for ${callNumber} with ID ${newCallId}`)
        return newCallId
      }
      
      // Handle ANSWERED event
      if (latestEvent.eventType === 'ANSWERED' && latestEvent.parties && latestEvent.parties.length > 0) {
        console.log('ANSWERED event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        if (!eventData) {
          console.warn('No event data found in ANSWERED event')
          return
        }
        
        const existingCall = findOrCreateCall(eventData)
        
        if (existingCall) {
          updateCallStatus(existingCall.id, 'connected', eventData)
          // setTimeout(() => {
          //   toast.success(`Call to ${existingCall.number} answered and connected!`)
          // }, 0)
        } else {
          // Create new call entry if none exists
          const newCallId = createNewCall(eventData, 'connected')
          if (newCallId) {
            // setTimeout(() => {
            //   toast.success(`Call answered and connected!`)
            // }, 0)
          }
        }
      }
      
      // Handle CallCtlTermConnTalkingEvImpl event (call connected and talking)
      if ((latestEvent.eventType === 'CallCtlTermConnTalkingEvImpl' || 
           latestEvent.eventName === 'CallCtlTermConnTalkingEvImpl' ||
           latestEvent.eventType === 'RETRIEVED') && latestEvent.parties && latestEvent.parties.length > 0) {
        console.log('CallCtlTermConnTalkingEvImpl/RETRIEVED event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        if (!eventData) {
          console.warn('No event data found in CallCtlTermConnTalkingEvImpl/RETRIEVED event')
          return
        }
        
        const existingCall = findOrCreateCall(eventData)
        
                  if (existingCall) {
            // Update call status based on the event's callStatus field
            const eventCallStatus = eventData.callStatus
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
            
            // Prevent overriding RINGING status with CONNECTED unless explicitly allowed
            if (existingCall.status === 'ringing' && localStatus === 'connected' && eventCallStatus !== 'CONNECTED') {
              console.log('BLOCKED: Skipping status update from ringing to connected to prevent override')
              return
            }
            
            updateCallStatus(existingCall.id, localStatus, eventData)
          
          // Show toast outside of setState to avoid side effects
          // setTimeout(() => {
          //   if (localStatus === 'connected') {
          //     toast.success(`Call to ${existingCall.number} connected and talking!`)
          //   } else {
          //     toast.info(`Call to ${existingCall.number} status: ${localStatus}`)
          //   }
          // }, 0)
        } else {
          // Create new call entry if none exists
          const newCallId = createNewCall(eventData, eventData.callStatus?.toLowerCase() || 'connected')
          if (newCallId) {
            // setTimeout(() => {
            //   toast.info(`Call status updated to ${eventData.callStatus?.toLowerCase() || 'connected'}`)
            // }, 0)
          }
        }
      }
      
      // Handle incoming call events
      if (latestEvent.eventType === 'INCOMING_CALL' && latestEvent.parties) {
        console.log('INCOMING_CALL event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        
        // Check if this is an incoming call to our user address
        if (eventData.calledAddress === userAddress) {
          const newCallId = createNewCall(eventData, 'ringing')
          if (newCallId) {
            setTimeout(() => {
              toast.info(`Incoming call from ${eventData.callingAddress}`)
            }, 0)
          }
        }
      }
      
      // Handle outgoing call initiation (DIALING event or similar)
      if (latestEvent.eventType === 'DIALING' && latestEvent.parties) {
        console.log('DIALING event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        
        // Check if this is an outgoing call from our user address
        if (eventData.callingAddress === userAddress) {
          const newCallId = createNewCall(eventData, 'dialing')
          if (newCallId) {
            // Exit protected mode when dialing starts
            setIsInProtectedMode(false)
            
            setTimeout(() => {
              toast.info(`Dialing ${eventData.calledAddress}...`)
            }, 0)
          }
        }
      }
      
      // Handle call ringing state (RINGING event for both incoming and outgoing calls)
      if (latestEvent.eventType === 'RINGING' && latestEvent.parties) {
        console.log('RINGING event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        
        // Check if this is an incoming call to our user address
        if (eventData.calledAddress === userAddress) {
          // Try to find existing call first
          const existingCall = findOrCreateCall(eventData)
          
          if (existingCall) {
            updateCallStatus(existingCall.id, 'ringing', eventData)
            setTimeout(() => {
              toast.info(`Incoming call from ${eventData.callingAddress} is ringing...`)
            }, 0)
          } else {
            // Create new call entry if none exists
            const newCallId = createNewCall(eventData, 'ringing')
            if (newCallId) {
              setTimeout(() => {
                toast.info(`Incoming call from ${eventData.callingAddress} is ringing...`)
              }, 0)
            }
          }
        }
        // Check if this is an outgoing call from our user address
        if (eventData.callingAddress === userAddress) {
          // Try to find existing call first
          const existingCall = findOrCreateCall(eventData)
          
          if (existingCall) {
            updateCallStatus(existingCall.id, 'ringing', eventData)
            // setTimeout(() => {
            //   toast.info(`${eventData.calledAddress} is ringing...`)
            // }, 0)
          } else {
            // Create new call entry if none exists
            const newCallId = createNewCall(eventData, 'ringing')
            if (newCallId) {
              // setTimeout(() => {
              //   toast.info(`${eventData.calledAddress} is ringing...`)
              // }, 0)
            }
          }
        }
      }
      
      // Handle call state change events
      if (latestEvent.eventType === 'CALL_STATE_CHANGE' && latestEvent.parties) {
        console.log('CALL_STATE_CHANGE event received:', latestEvent)
        
        const eventData = latestEvent.parties[0]
        const existingCall = findOrCreateCall(eventData)
        
        if (existingCall && eventData.callStatus) {
          // Map CTI call status to our local status
          let localStatus: string
          switch (eventData.callStatus) {
            case 'RINGING': localStatus = 'ringing'; break
            case 'CONNECTED': localStatus = 'connected'; break
            case 'ON_HOLD': localStatus = 'onHold'; break
            case 'ENDED':
            case 'DISCONNECTED':
            case 'DROPPED': localStatus = 'ended'; break
            default: localStatus = 'dialing'
          }
          
          updateCallStatus(existingCall.id, localStatus, eventData)
          
          // Handle call ending
          if (localStatus === 'ended') {
            setTimeout(() => removeCall(existingCall.id), 2000)
          }
          
          // Exit protected mode when call is connected
          if (localStatus === 'connected') {
            setIsInProtectedMode(false)
          }
        }
      }
      
      // Handle any event with callStatus field (general fallback)
      if (latestEvent.parties?.[0]?.callStatus && 
          !['INCOMING_CALL', 'DISCONNECTED', 'DROPPED', 'ENDED', 'ANSWERED', 'CallCtlTermConnTalkingEvImpl', 'RETRIEVED', 'RINGING'].includes(latestEvent.eventType)) {
        console.log('Event with callStatus field received:', latestEvent.eventType, latestEvent.parties[0].callStatus)
        
        const eventData = latestEvent.parties[0]
        const existingCall = findOrCreateCall(eventData)
        
        if (existingCall) {
          // Map CTI call status to our local status
          let localStatus: string
          switch (eventData.callStatus) {
            case 'RINGING': localStatus = 'ringing'; break
            case 'CONNECTED': localStatus = 'connected'; break
            case 'ON_HOLD': localStatus = 'onHold'; break
            case 'ENDED':
            case 'DISCONNECTED':
            case 'DROPPED': localStatus = 'ended'; break
            default: localStatus = 'dialing'
          }
          
      
          
          updateCallStatus(existingCall.id, localStatus, eventData)
          
          // Handle call ending
          if (localStatus === 'ended') {
            setTimeout(() => removeCall(existingCall.id), 2000)
          }
          
          // Exit protected mode when call is connected
          if (localStatus === 'connected') {
            setIsInProtectedMode(false)
          }
        }
      }
      
      // Handle any event with CONNECTED status (ensure we catch all connected events)
      // Only process if this is not a RINGING event to prevent status override
      if (latestEvent.parties?.[0]?.callStatus === 'CONNECTED' && 
          !['ANSWERED', 'CallCtlTermConnTalkingEvImpl', 'RETRIEVED', 'RINGING'].includes(latestEvent.eventType)) {
        console.log('CONNECTED status event received:', latestEvent.eventType, latestEvent.eventName)
        
        const eventData = latestEvent.parties[0]
        const existingCall = findOrCreateCall(eventData)
        
        if (existingCall) {
          // Only update to connected if the call is not currently in ringing state
          if (existingCall.status !== 'ringing') {
            updateCallStatus(existingCall.id, 'connected', eventData)
            //console.log('Call status updated successfully to connected')
            
            // Exit protected mode when call is connected
            setIsInProtectedMode(false)
          } else {
            //console.log('BLOCKED: Skipping CONNECTED status update for ringing call to prevent override')
          }
        } else {
          // Only create new call entry for outgoing calls that we initiated
          if (eventData.callingAddress === userAddress) {
            const newCallId = createNewCall(eventData, 'connected')
            if (newCallId) {
              // setTimeout(() => {
              //   toast.success(`Call to ${eventData.calledAddress} connected!`)
              // }, 0)
            }
          }
        }
      }
      
      // Handle call termination events
      if (['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType) && latestEvent.parties) {
        const eventData = latestEvent.parties[0]
        
        // Enhanced logging to debug call termination
        console.log(`${latestEvent.eventType} event received:`, {
          eventType: latestEvent.eventType,
          eventCallId: eventData.callId,
          callingAddress: eventData.callingAddress,
          calledAddress: eventData.calledAddress,
          eventTime: latestEvent.eventTime,
          allActiveCalls: Array.from(activeCalls.values()).map(call => ({
            id: call.id,
            number: call.number,
            status: call.status,
            callId: call.callId
          }))
        })
        
        const existingCall = findOrCreateCall(eventData)
        
        if (existingCall) {
          console.log(`${latestEvent.eventType} event processed for call:`, {
            callId: existingCall.id,
            number: existingCall.number,
            status: existingCall.status,
            callIdFromEvent: existingCall.callId
          })
          
          // Check if this termination is legitimate or if it's a false positive
          // Some CTI systems send termination events when making new calls
          const isLegitimateTermination = checkIfTerminationIsLegitimate(latestEvent, existingCall)
          
          if (isLegitimateTermination) {
            updateCallStatus(existingCall.id, 'ended')
            
            // Remove ended call after a delay
            setTimeout(() => removeCall(existingCall.id), 2000)
            
            // Show toast outside of setState to avoid side effects
            setTimeout(() => {
              toast.info(`Call to ${existingCall.number} ${latestEvent.eventType.toLowerCase()}`)
            }, 0)
          } else {
            console.log(`Delaying ${latestEvent.eventType} event - potential false positive, will re-evaluate in 10 seconds`)
            
            // Instead of ignoring, delay the termination to see if it's really legitimate
            // This handles cases where the CTI system sends premature termination events
            setTimeout(() => {
              // Re-check if the call is still active
              const currentCall = activeCalls.get(existingCall.id)
              if (currentCall && currentCall.status !== 'ended') {
                console.log(`Call ${existingCall.number} still active after 10s delay - termination was false positive`)
                // Don't terminate the call
              } else {
                console.log(`Call ${existingCall.number} confirmed terminated after 10s delay - proceeding with cleanup`)
                updateCallStatus(existingCall.id, 'ended')
                setTimeout(() => removeCall(existingCall.id), 2000)
              }
            }, 10000) // 10 second delay
          }
        } else {
          console.log(`${latestEvent.eventType} event received but no matching call found`)
        }
      }
    }
  }, [eventLog]) // Removed activeCalls dependency

  // Clear call data only on page refresh
  useEffect(() => {
    // Check if this is a page refresh using performance navigation API
    const isPageRefresh = () => {
      if (window.performance && window.performance.navigation) {
        return window.performance.navigation.type === 1 // TYPE_RELOAD
      }
      return false
    }

    // Clear data only on page refresh
    if (isPageRefresh()) {
      //console.log('Page refresh detected - clearing call data')
      // Clear all call-related data
      setActiveCalls(new Map())
      // Clear merged calls
      setMergedCalls(new Map())
      // Clear localStorage
      localStorage.removeItem('cti_call_states')
      localStorage.removeItem('cti_call_states_timestamp')
      localStorage.removeItem('cti_merged_calls')
      
      setCallStatus('idle')
      setDialedNumber('')
      setShowInvalidWarning(false)
      setCallStartTime(null)
      setCallDuration(0)
      setProcessingCalls(new Set())
      setSelectedCallsForMerge(new Set())
      processedEventsRef.current.clear()
      
      //console.log('Cleared all call-related data on page refresh')
    } else {
      //console.log('Page navigation detected - preserving call data')
    }
  }, [])

  // Restore call states from localStorage on component mount
  useEffect(() => {
    const restoreCallStatesFromStorage = () => {
      try {
        const storedCallStates = localStorage.getItem('cti_call_states')
        const storedTimestamp = localStorage.getItem('cti_call_states_timestamp')
        
        if (!storedCallStates || !storedTimestamp) {
          console.log('No stored call states found in localStorage')
          return
        }

        const timestamp = new Date(storedTimestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)

        // Check if stored data is still valid (not expired - 24 hours)
        if (hoursDiff > 24) {
          console.log('Stored call states expired, clearing localStorage')
          localStorage.removeItem('cti_call_states')
          localStorage.removeItem('cti_call_states_timestamp')
          return
        }

        const parsedCallStates = JSON.parse(storedCallStates)
        console.log('Restoring call states from localStorage:', parsedCallStates)
        
        // Convert stored call states to activeCalls format
        const restoredCalls = new Map()
        Object.entries(parsedCallStates).forEach(([callId, callEvent]: [string, any]) => {
          if (callEvent.parties && callEvent.parties.length > 0) {
            const party = callEvent.parties[0]
            if (party.callStatus && ['CONNECTED', 'RETRIEVED'].includes(party.callStatus)) {
              const callData = {
                id: callId,
                number: party.calledAddress || party.callingAddress || 'Unknown',
                startTime: new Date(callEvent.eventTime || Date.now()),
                status: party.callStatus.toLowerCase(),
                callId: callId,
                callingAddress: party.callingAddress,
                calledAddress: party.calledAddress,
                callingDeviceName: party.callingDeviceName,
                callingDeviceType: party.callingDeviceType,
                duration: 0
              }
              restoredCalls.set(callId, callData)
            }
          }
        })

        if (restoredCalls.size > 0) {
          setActiveCalls(restoredCalls)
          console.log(`Restored ${restoredCalls.size} call states from localStorage`)
        }

        // Also restore merged calls
        const storedMergedCalls = localStorage.getItem('cti_merged_calls')
        if (storedMergedCalls) {
          try {
            const parsedMergedCalls = JSON.parse(storedMergedCalls)
            const restoredMergedCalls = new Map()
            
            Object.entries(parsedMergedCalls).forEach(([mergedCallId, mergedCallData]: [string, any]) => {
              if (mergedCallData.members && Array.isArray(mergedCallData.members)) {
                const mergedCall = {
                  id: mergedCallId,
                  mergedCallId: mergedCallId,
                  members: mergedCallData.members.map((member: any) => ({
                    id: member.id,
                    number: member.number,
                    callId: member.callId,
                    callingAddress: member.callingAddress,
                    calledAddress: member.calledAddress,
                    callingDeviceName: member.callingDeviceName,
                    callingDeviceType: member.callingDeviceType,
                    startTime: new Date(member.startTime || Date.now()),
                    status: member.status
                  })),
                  startTime: new Date(mergedCallData.eventTime || Date.now()),
                  status: 'connected'
                }
                restoredMergedCalls.set(mergedCallId, mergedCall)
              }
            })

            if (restoredMergedCalls.size > 0) {
              setMergedCalls(restoredMergedCalls)
              console.log(`Restored ${restoredMergedCalls.size} merged call states from localStorage`)
            }
          } catch (error) {
            console.error('Error restoring merged call states from localStorage:', error)
            localStorage.removeItem('cti_merged_calls')
          }
        }
      } catch (error) {
        console.error('Error restoring call states from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('cti_call_states')
        localStorage.removeItem('cti_call_states_timestamp')
      }
    }

    // Restore call states on component mount
    restoreCallStatesFromStorage()
  }, [])

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
        // Save to localStorage after cleanup
        setTimeout(() => saveCallStatesToStorage(newMap), 0)
      }
      
      return newMap
    })
  }

  // Clean up ended calls and update localStorage
  const cleanupEndedCalls = () => {
    setActiveCalls(prev => {
      const newMap = new Map(prev)
      const toRemove: string[] = []
      
      // Find ended calls that should be removed
      Array.from(newMap.values()).forEach(call => {
        if (call.status === 'ended') {
          toRemove.push(call.id)
        }
      })
      
      // Remove ended calls
      toRemove.forEach(callId => {
        newMap.delete(callId)
        //console.log('Removed ended call:', callId)
      })
      
      if (toRemove.length > 0) {
        //console.log('Cleaned up ended calls')
        // console.log(`Cleaned up ${toRemove.length} ended calls`)
        // Save to localStorage after cleanup
        setTimeout(() => saveCallStatesToStorage(newMap), 0)
      }
      
      return newMap
    })
  }

  // Clean up duplicate members in merged calls
  const cleanupDuplicateMergedMembers = () => {
    setMergedCalls(prev => {
      const newMap = new Map(prev)
      let hasChanges = false
      
      newMap.forEach((mergedCall, mergedCallId) => {
        const memberIds = mergedCall.members.map(m => m.id)
        const uniqueMemberIds = Array.from(new Set(memberIds))
        
        if (memberIds.length !== uniqueMemberIds.length) {
          console.log(`🧹 Cleaning up duplicate members in merged call ${mergedCallId}`)
          const uniqueMembers = mergedCall.members.filter((member, index) => 
            memberIds.indexOf(member.id) === index
          )
          
          newMap.set(mergedCallId, {
            ...mergedCall,
            members: uniqueMembers
          })
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        console.log('🧹 Cleaned up duplicate members in merged calls')
        // Save to localStorage after cleanup
        setTimeout(() => {
          const currentActiveCalls = new Map(activeCalls)
          saveCallStatesToStorage(currentActiveCalls)
        }, 0)
      }
      
      return newMap
    })
  }

  // Check if a call is part of a merged call
  const isCallMerged = (callId: string) => {
    return Array.from(mergedCalls.values()).some(mergedCall =>
      mergedCall.members.some(member => member.id === callId)
    )
  }

  // Remove a member from a merged call
  const removeMemberFromMergedCall = (mergedCallId: string, memberId: string) => {
    console.log(`🔄 Removing member ${memberId} from merged call ${mergedCallId}`)
    
    setMergedCalls(prev => {
      const newMap = new Map(prev)
      const mergedCall = newMap.get(mergedCallId)
      
      if (!mergedCall) {
        console.log('❌ Merged call not found')
        return newMap
      }
      
      console.log(`📞 Merged call members before removal:`, mergedCall.members.map(m => ({
        id: m.id,
        number: m.number,
        callId: m.callId
      })))
      
      // Remove the member
      const updatedMembers = mergedCall.members.filter(member => member.id !== memberId)
      
      console.log(`Merged call members after removal:`, updatedMembers.map(m => ({
        id: m.id,
        number: m.number,
        callId: m.callId
      })))
      
              if (updatedMembers.length === 0) {
          // If no members left, remove the entire merged call
          newMap.delete(mergedCallId)
          console.log('Removed merged call with no members left')
          
          // Save to localStorage after updating - use current active calls
          setTimeout(() => {
            const currentActiveCalls = new Map(activeCalls)
            saveCallStatesToStorage(currentActiveCalls)
          }, 0)
        } else if (updatedMembers.length === 1) {
        // If only one member left, convert back to regular call
        const remainingMember = updatedMembers[0]
        const regularCall = {
          id: remainingMember.id,
          number: remainingMember.number,
          startTime: remainingMember.startTime,
          status: remainingMember.status,
          callId: remainingMember.callId,
          callingAddress: remainingMember.callingAddress,
          calledAddress: remainingMember.calledAddress,
          callingDeviceName: remainingMember.callingDeviceName,
          callingDeviceType: remainingMember.callingDeviceType,
          duration: 0
        }
        
        console.log(`Converting merged call back to regular call for member:`, {
          id: remainingMember.id,
          number: remainingMember.number,
          callId: remainingMember.callId
        })
        
        // Add back to active calls
        setActiveCalls(prev => {
          const newActiveMap = new Map(prev)
          newActiveMap.set(remainingMember.id, regularCall)
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newActiveMap), 0)
          return newActiveMap
        })
        
        // Remove the merged call
        newMap.delete(mergedCallId)
        console.log('Converted merged call back to regular call')
      } else {
        // Update the merged call with remaining members
        const updatedMergedCall = {
          ...mergedCall,
          members: updatedMembers
        }
        
        // Validate that we don't have duplicate member IDs
        const memberIds = updatedMembers.map(m => m.id)
        const uniqueMemberIds = Array.from(new Set(memberIds))
        
        if (memberIds.length !== uniqueMemberIds.length) {
          console.warn('⚠️ Duplicate member IDs detected, filtering out duplicates')
          const uniqueMembers = updatedMembers.filter((member, index) => 
            memberIds.indexOf(member.id) === index
          )
          updatedMergedCall.members = uniqueMembers
        }
        
        newMap.set(mergedCallId, updatedMergedCall)
        console.log('Updated merged call with remaining members:', updatedMergedCall.members.map(m => ({
          id: m.id,
          number: m.number,
          callId: m.callId
        })))
        
        // Save to localStorage after updating - use current active calls
        setTimeout(() => {
          const currentActiveCalls = new Map(activeCalls)
          saveCallStatesToStorage(currentActiveCalls)
        }, 0)
      }
      
      return newMap
    })
  }

  // Get merged call for a specific call ID
  const getMergedCallForMember = (callId: string) => {
    return Array.from(mergedCalls.values()).find(mergedCall =>
      mergedCall.members.some(member => member.id === callId)
    )
  }

  // Debug function to inspect merged call state
  const debugMergedCalls = () => {
    console.log('Debug: Current merged calls state:')
    mergedCalls.forEach((mergedCall, mergedCallId) => {
      console.log(`  Merged Call ${mergedCallId}:`, {
        id: mergedCall.id,
        mergedCallId: mergedCall.mergedCallId,
        startTime: mergedCall.startTime,
        status: mergedCall.status,
        members: mergedCall.members.map(m => ({
          id: m.id,
          number: m.number,
          callId: m.callId,
          callingAddress: m.callingAddress,
          calledAddress: m.calledAddress
        }))
      })
    })
    
    console.log('Debug: Current active calls state:')
    activeCalls.forEach((call, callId) => {
      console.log(`  Active Call ${callId}:`, {
        id: call.id,
        number: call.number,
        status: call.status,
        callId: call.callId,
        callingAddress: call.callingAddress,
        calledAddress: call.calledAddress
      })
    })
  }

  // Check if a termination event is legitimate or a false positive
  const checkIfTerminationIsLegitimate = (event: any, call: any) => {
    // If the call is currently connected and we receive a termination event,
    // it might be a false positive from the CTI system when making new calls
    
    // Check if this is a recent call (within last 30 seconds)
    const callAge = Date.now() - call.startTime.getTime()
    const isRecentCall = callAge < 30000 // 30 seconds
    
    // Check if we have other active calls
    const otherActiveCalls = Array.from(activeCalls.values()).filter(c => 
      c.id !== call.id && ['connected', 'ringing', 'dialing'].includes(c.status)
    )
    
    // Check if this termination event has a very recent timestamp (within last 5 seconds)
    const eventAge = Date.now() - new Date(event.eventTime).getTime()
    const isRecentEvent = eventAge < 5000 // 5 seconds
    
    // Check if we're currently in the process of making a new call
    const isCurrentlyDialing = isDialing || Array.from(activeCalls.values()).some(c => c.status === 'dialing')
    
    // If it's a recent call, recent event, and we're currently dialing or have other active calls,
    // this might be a false positive termination
    if (isRecentCall && isRecentEvent && (isCurrentlyDialing || otherActiveCalls.length > 0 || isInProtectedMode)) {
      console.log(`⚠️ Potential false positive termination detected:`, {
        callId: call.id,
        callNumber: call.number,
        callAge: `${Math.round(callAge / 1000)}s`,
        eventAge: `${Math.round(eventAge / 1000)}s`,
        otherActiveCalls: otherActiveCalls.length,
        isCurrentlyDialing,
        reason: 'Recent call termination during active call session or dialing'
      })
      return false
    }
    
    // If the call has been active for a while, it's more likely legitimate
    if (callAge > 30000) {
      console.log(`Legitimate termination detected:`, {
        callId: call.id,
        callNumber: call.number,
        callAge: `${Math.round(callAge / 1000)}s`,
        reason: 'Call has been active for sufficient time'
      })
      return true
    }
    
    // Default to legitimate if we can't determine
    console.log(`Termination legitimacy unclear:`, {
      callId: call.id,
      callNumber: call.number,
      callAge: `${Math.round(callAge / 1000)}s`,
      eventAge: `${Math.round(eventAge / 1000)}s`,
      otherActiveCalls: otherActiveCalls.length,
      isCurrentlyDialing
    })
    return true
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
                {/* {isInProtectedMode && (
                  <Badge bg="warning" className="ms-2">
                    <i className="material-icons-two-tone me-1">shield</i>
                    Protected Mode
                  </Badge>
                )} */}
                {/* {getActiveCallsCount() > 0 && (
                  <Badge bg="success" className="ms-2">
                    {getActiveCallsCount()} Active Call{getActiveCallsCount() !== 1 ? 's' : ''}
                  </Badge>
                )} */}
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

              {/* Merged Calls Section */}
              {mergedCalls.size > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      <i className="material-icons-two-tone me-2">call_merge</i>
                      Merged Calls
                    </h6>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => cleanupDuplicateMergedMembers()}
                        title="Clean up duplicate members"
                      >
                        <i className="material-icons-two-tone me-1">cleaning_services</i>
                        Clean
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => debugMergedCalls()}
                        title="Debug merged calls state"
                      >
                        <i className="material-icons-two-tone me-1">bug_report</i>
                        Debug
                      </Button>
                    </div>
                  </div>
                  {Array.from(mergedCalls.values()).map((mergedCall) => (
                    <div key={mergedCall.id} className="mb-3">
                      <Alert variant="success" className="mb-2 p-0">
                        <div className="merged-call-header">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                              <i className="material-icons-two-tone me-2">call_merge</i>
                              Conference Call
                            </h6>
                            <small>
                              Started: {mergedCall.startTime.toLocaleTimeString()}
                            </small>
                          </div>
                        </div>
                        
                        <div className="row px-3 pb-3">
                          {mergedCall.members.map((member) => (
                            <Col md={6} key={member.id} className="mb-2">
                              <div className="merged-call-member p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">Call to {member.number}</h6>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      className="transfer-member-btn"
                                      onClick={() => {
                                        setTransferCallId(member.id)
                                        setShowTransferModal(true)
                                      }}
                                      title="Transfer call"
                                    >
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="remove-member-btn"
                                      onClick={() => removeMemberFromMergedCall(mergedCall.id, member.id)}
                                      title="Remove from conference"
                                    >
                                      <i className="material-icons-two-tone">call_end</i>
                                    </Button>
                                  </div>
                                </div>
                                <div className="small text-muted">
                                  <div>Call ID: {member.callId}</div>
                                  <div>From: {member.callingAddress}</div>
                                  <div>To: {member.calledAddress}</div>
                                  {member.callingDeviceName && (
                                    <div>Device: {member.callingDeviceName}</div>
                                  )}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </div>
                      </Alert>
                    </div>
                  ))}
                  
                  {/* Debug Information */}
                  <div className="mt-3 p-2 bg-light rounded">
                    <small className="text-muted">
                      <strong>Debug Info:</strong> {mergedCalls.size} merged call(s) with{' '}
                      {Array.from(mergedCalls.values()).reduce((total, mc) => total + mc.members.length, 0)} total members
                    </small>
                  </div>
                </div>
              )}

              <Row>
              {Array.from(activeCalls.values()).filter(call => 
                ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status) && !isCallMerged(call.id)
              ).map((call) => (
                <Col md={6} key={call.id} className="mb-4">
                  <Alert 
                    variant={isCallSelectedForMerge(call.id) ? "primary" : "info"} 
                    className={`text-center ${isCallSelectedForMerge(call.id) ? 'border-primary border-3' : ''}`}
                  >
                    <h6 className="mb-2">
                      Call to {call.number || 'Unknown'}
                      {isCallSelectedForMerge(call.id) && (
                        <span className="ms-2">
                          <i className="material-icons-two-tone text-primary">check_circle</i>
                          Selected for Merge
                        </span>
                      )}
                    </h6>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <i className={`material-icons-two-tone me-2 text-${getStatusBadgeVariant(call.status)}`}>
                        {getStatusIcon(call.status)}
                      </i>
                      <span className="text-capitalize fw-bold">
                        {call.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="small text-muted">
                      Started: {call.startTime ? call.startTime.toLocaleTimeString() : 'Unknown'}
                    </div>
                    
                    {(call.status === 'connected' || call.status === 'onHold') && (
                      <div className="mt-2">
                        <div className="h5 text-success mb-0">
                          {call.duration ? formatDuration(call.duration) : '00:00'}
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
                        <div className="col-4">
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
                        <div className="col-4">
                          <Button
                            variant="info"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              setTransferCallId(call.id)
                              setShowTransferModal(true)
                            }}
                            disabled={processingCalls.has(call.id)}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Transfer'}
                          </Button>
                        </div>
                        <div className="col-4">
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

        /* Merged call box styles */
        .merged-call-member {
          transition: all 0.2s ease;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          background-color: #f8f9fa;
        }
        
        .merged-call-member:hover {
          border-color: #adb5bd;
          background-color: #e9ecef;
        }
        
        .merged-call-header {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          border-radius: 0.375rem 0.375rem 0 0;
          padding: 0.75rem;
          margin: -0.75rem -0.75rem 1rem -0.75rem;
        }
        
        .remove-member-btn {
          transition: all 0.2s ease;
        }
        
        .remove-member-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
        }
        
        .transfer-member-btn {
          transition: all 0.2s ease;
        }
        
        .transfer-member-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.3);
        }

        /* Transfer modal styles */
        .modal-overlay {
          animation: fadeIn 0.2s ease-in-out;
        }
        
        .modal-content {
          animation: slideIn 0.2s ease-in-out;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 1rem;
        }
        
        .modal-footer {
          border-top: 1px solid #dee2e6;
          padding-top: 1rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
      `}</style>

      {/* Transfer Call Modal */}
      {showTransferModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="modal-header mb-3">
              <h5 className="mb-0">
                Transfer Call
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowTransferModal(false)
                  setTransferCallId(null)
                  setTransferTarget('')
                }}
              ></button>
            </div>
            
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Target Extension:</label>
                <div className="row g-2">
                  
                  
                  <div className="popExtension">
                    <input type="text" className="form-control" placeholder="Search extensions" onChange={(e) => setExtensionSearch(e.target.value)} />
                    {getAvailableExtensionsForTransfer().filter(extension => 
                      extension.toLowerCase().includes(extensionSearch.toLowerCase())
                    ).map((extension) => (
                      <div key={extension} className="col-4 popExtensioList">
                        <button
                          type="button"
                          className={`btn w-100 ${transferTarget === extension ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setTransferTarget(extension)}
                        >
                          {extension}
                        </button>
                      </div>
                    ))}
                  </div>



                </div>
                {getAvailableExtensionsForTransfer().length === 0 && (
                  <div className="alert alert-warning">
                    <i className="material-icons-two-tone me-2">warning</i>
                    No available extensions for transfer
                  </div>
                )}
              </div>
              
              {/* {transferTarget && (
                <div className="alert alert-info">
                  <i className="material-icons-two-tone me-2">info</i>
                  Call will be transferred to extension <strong>{transferTarget}</strong>
                </div>
              )} */}
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowTransferModal(false)
                  setTransferCallId(null)
                  setTransferTarget('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!transferTarget || !transferCallId}
                onClick={() => {
                  if (transferCallId && transferTarget) {
                    handleTransferCall(transferCallId, transferTarget)
                  }
                }}
              >
                Transfer Call
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}

CtiDialer.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDialer
