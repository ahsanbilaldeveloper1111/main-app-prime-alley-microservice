import React, { ReactElement, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Row, Alert, Badge } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Link from 'next/link'
import useCtiStomp from '../../../hooks/useCtiStomp'
import { makeCall, endCall, holdCall, resumeCall, getCallingDeviceInfo, getAllUserDevices, mergeCalls,transferCalls, RemoveCall, attendCall} from '../../../utils/dialer'
import DeviceSelectionModal from '../../../components/DeviceSelectionModal'
import Select from 'react-select'
import { FaLastfmSquare } from 'react-icons/fa'
import { usePermissions } from '../../../utils/permissionUtils'

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import "@assets/scss/pgDialer.scss";


const CtiDialer = () => {
  const router = useRouter()
  const [showPageLoader, setShowPageLoader] = useState(false)
  
  // Permission checks
  const { hasPermission } = usePermissions()
  
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
  const [extensionSearch, setExtensionSearch] = useState('');
  const [extensionPopSearch, setExtensionPopSearch] = useState('');
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set())
  const [selectedCallsForMerge, setSelectedCallsForMerge] = useState<Set<string>>(new Set())
  const [isInProtectedMode, setIsInProtectedMode] = useState(false)
  const [transferCallId, setTransferCallId] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [incomingCall, setIncomingCall] = useState<{
    callId: string
    callingAddress: string
    calledAddress: string
    controllerAddress: string
    controllerDeviceName: string
    controllerDeviceType: string
    startTime: Date
  } | null>(null)
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false)
  const [incomingCallTimer, setIncomingCallTimer] = useState<NodeJS.Timeout | null>(null)
  const [mergedCalls, setMergedCalls] = useState<Map<string, {
    id: string
    conferenceCallId?: string
    callingDeviceName?: string
    callingDeviceType?: string

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
  const hasAutoDialedRef = useRef<boolean>(false)
  
  // Device selection state
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<any[]>([])
  const [pendingDialedNumber, setPendingDialedNumber] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<any>(null)

  // Debug: Monitor activeCalls changes
  useEffect(() => {
    // console.log(`📊 Active calls state changed:`, {
    //   count: activeCalls.size,
    //   calls: Array.from(activeCalls.values()).map(call => ({
    //     id: call.id,
    //     number: call.number,
    //     status: call.status,
    //     callId: call.callId
    //   }))
    // })
  }, [activeCalls])

  // Helper functions
  const getStoredCallerInfo = () => {
    try {
      const stored = localStorage.getItem('cti_caller_info')
      if (stored) {
        const callerInfo = JSON.parse(stored)
        //console.log('📋 Retrieved stored caller info:', callerInfo)
        return callerInfo
      }
    } catch (error) {
      console.error('Error retrieving stored caller info:', error)
    }
    return null
  }

  const getCallingDeviceInfoForAPI = () => {
    // First try to get from stored caller info
    const storedCallerInfo = getStoredCallerInfo()
    if (storedCallerInfo) {
      return {
        callingAddress: storedCallerInfo.callingAddress,
        callingDeviceType: storedCallerInfo.callingDeviceType,
        callingDeviceName: storedCallerInfo.callingDeviceName
      }
    }
    
    // Fallback to the original method
    return getCallingDeviceInfo(userAddress, dnsMap)
  }

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
      //console.log('Saving call states to localStorage...')
      
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
            conferenceCallId: mergedCall.conferenceCallId,
            callingDeviceName: mergedCall.callingDeviceName,
            callingDeviceType: mergedCall.callingDeviceType,
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

  // Input handlers for paste and keyboard input
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and limit length
    const numbersOnly = value.replace(/[^0-9]/g, '')
    if (numbersOnly.length <= 15) {
      setDialedNumber(numbersOnly)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    // Extract only numbers from pasted text
    const numbersOnly = pastedText.replace(/[^0-9]/g, '')
    if (numbersOnly.length <= 15) {
      setDialedNumber(numbersOnly)
    } else {
      // If pasted text is too long, truncate it
      setDialedNumber(numbersOnly.substring(0, 15))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to dial
    if (e.key === 'Enter') {
      e.preventDefault()
      if (dialedNumber.trim()) {
        handleDial()
      }
      return
    }
    
    // Allow backspace, delete, arrow keys, tab
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      return
    }
    
    // Allow numbers 0-9
    if (e.key >= '0' && e.key <= '9') {
      return
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return
    }
    
    // Prevent all other keys
    e.preventDefault()
  }

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
    // Check permission for dialing calls
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to dial calls')
      return
    }

    // Check if we can dial this number
    const dialCheck = canDialNumber(dialedNumber)
    if (!dialCheck.canDial) {
      toast.warning(dialCheck.reason)
      return
    }

    // Check if user has multiple devices
    const userDevices = getAllUserDevices(userAddress, dnsMap)
    if (!userDevices) {
      toast.error('No calling device information available')
      return
    }

    console.log('User devices found:', userDevices.length, userDevices)

    // If user has multiple devices, show device selection modal
    if (userDevices.length > 1) {
      console.log('Multiple devices detected, showing device selection modal')
      setAvailableDevices(userDevices)
      setPendingDialedNumber(dialedNumber)
      setShowDeviceSelectionModal(true)
      return
    }

    // If only one device, proceed with dialing
    const callingDevice = getCallingDeviceInfoForAPI()
    if (!callingDevice) {
      toast.error('No calling device information available')
      return
    }

    if(dialedNumber.length ===0) {
      toast.error('Please enter a number to dial')
      return
    }

    await performDial(callingDevice, dialedNumber)
  }

  const performDial = async (callingDevice: any, numberToDial: string) => {
    // console.log('📞 performDial called with:', {
    //   callingDevice,
    //   numberToDial
    // });
    
    setIsDialing(true)
    setCallStatus('dialing')
    setShowInvalidWarning(false)
    
    // Enter protected mode to prevent premature termination of existing calls
    setIsInProtectedMode(true)
    
    // Auto-exit protected mode after 30 seconds to prevent indefinite protection
    setTimeout(() => {
      if (isInProtectedMode) {
       // console.log('Auto-exiting protected mode after 30 seconds')
        setIsInProtectedMode(false)
      }
    }, 30000)
    
    // Don't create a call entry here - let the CTI events handle it
    // This prevents duplicate call entries from being created

    try {
      const apiParams = {
        callingAddress: callingDevice.callingAddress,
        calledAddress: numberToDial,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      };
      
      //console.log('📞 Making API call with params:', apiParams);
      setShowPageLoader(true);
      const result = await makeCall(apiParams);

      //console.log(result, "result cti");
      if (result.success) { 
        setShowPageLoader(false);
        //console.log( "yes true");
        const responseData = result.data.responseData
        const callStatusFromAPI = responseData.status
        
       // console.log('Dial API response:', responseData)
        
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
        setShowPageLoader(false);
        console.error('Dial API error:', result.error)
        setCallStatus('ended')
        toast.error(`Failed to connect: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling dial API:', error)
      setCallStatus('ended')
      toast.error('Failed to connect: Network error')
    } finally {
      setIsDialing(false);
      setShowPageLoader(false);
    }
  }

  const removeCall = (callId: string) => {
    console.log(`Removing call from active calls:`, callId)
    setActiveCalls(prev => {
      const newMap = new Map(prev)
      // Only remove if the call still exists
      if (newMap.has(callId)) {
        const callToRemove = newMap.get(callId)
        // console.log(`Call removed:`, {
        //   id: callToRemove?.id,
        //   number: callToRemove?.number,
        //   status: callToRemove?.status,
        //   callId: callToRemove?.callId
        // })
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
    hasAutoDialedRef.current = false
    
    //console.log('Manually cleared all call-related data')
    toast.info('All call data cleared')
  }

  // Device selection handlers
  const handleDeviceSelect = (device: any) => {
    //console.log('🎯 Device selected:', device)
    const callingDevice = {
      callingAddress: userAddress,
      callingDeviceType: device.deviceType,
      callingDeviceName: device.deviceName
    }
    
   // console.log('🎯 Calling device info for API:', callingDevice)
    
    // Store the selected device info in localStorage for consistent use
    const callerInfo = {
      callingAddress: userAddress,
      callingDeviceName: device.deviceName,
      callingDeviceType: device.deviceType,
      selectedAt: new Date().toISOString()
    }
    
    localStorage.setItem('cti_caller_info', JSON.stringify(callerInfo))
   // console.log('💾 Stored caller info in localStorage:', callerInfo)
    
    setSelectedDevice(device)
    setShowDeviceSelectionModal(false)
    
    // Proceed with dialing using selected device
    performDial(callingDevice, pendingDialedNumber)
  }

  const handleDeviceSelectionCancel = () => {
    setShowDeviceSelectionModal(false)
    setAvailableDevices([])
    setPendingDialedNumber('')
    setSelectedDevice(null)
  }

  const handleHoldCall = async (callId: string) => {
    // Check permission for holding calls
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to hold calls')
      return
    }

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
      // For incoming calls, use the call's stored addresses
      // For outgoing calls, get calling device info
      let callingAddress, calledAddress, callingDeviceType, callingDeviceName;
      
      if (call.callingAddress && call.calledAddress) {
        // This is an incoming call - use stored addresses
        callingAddress = call.callingAddress;
        calledAddress = call.calledAddress;
        callingDeviceType = call.callingDeviceType || 'SOFT';
        callingDeviceName = call.callingDeviceName || 'WebCTI';
      } else {
        // This is an outgoing call - get calling device info
        const callingDevice = getCallingDeviceInfoForAPI()
        if (!callingDevice) {
          toast.error('No calling device information available')
          return
        }
        callingAddress = callingDevice.callingAddress;
        calledAddress = call.calledAddress || call.number;
        callingDeviceType = callingDevice.callingDeviceType;
        callingDeviceName = callingDevice.callingDeviceName;
      }

      setShowPageLoader(true);
      // Call the holdCall API
      const result = await holdCall({
        callId: call.callId,
        callingAddress: callingAddress,
        calledAddress: calledAddress,
        callingDeviceType: callingDeviceType,
        callingDeviceName: callingDeviceName
      });

      if (result.success) {
        setShowPageLoader(false);
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
        setShowPageLoader(false);
        console.error('Hold call API error:', result.error)
        toast.error(`Failed to hold call: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling hold call API:', error)
      toast.error('Failed to hold call: Network error')
    } finally {
      setShowPageLoader(false);
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleResumeCall = async (callId: string) => {
    // Check permission for resuming calls
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to resume calls')
      return
    }

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
      // For incoming calls, use the call's stored addresses
      // For outgoing calls, get calling device info
      let callingAddress, calledAddress, callingDeviceType, callingDeviceName;
      
      if (call.callingAddress && call.calledAddress) {
        // This is an incoming call - use stored addresses
        callingAddress = call.callingAddress;
        calledAddress = call.calledAddress;
        callingDeviceType = call.callingDeviceType || 'SOFT';
        callingDeviceName = call.callingDeviceName || 'WebCTI';
      } else {
        // This is an outgoing call - get calling device info
        const callingDevice = getCallingDeviceInfoForAPI()
        if (!callingDevice) {
          toast.error('No calling device information available')
          return
        }
        callingAddress = callingDevice.callingAddress;
        calledAddress = call.calledAddress || call.number;
        callingDeviceType = callingDevice.callingDeviceType;
        callingDeviceName = callingDevice.callingDeviceName;
      }

      setShowPageLoader(true);
      // Call the resumeCall API
      const result = await resumeCall({
        callId: call.callId,
        callingAddress: callingAddress,
        calledAddress: calledAddress,
        callingDeviceType: callingDeviceType,
        callingDeviceName: callingDeviceName
      })

      if (result.success) {
        setShowPageLoader(false);
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
        setShowPageLoader(false);
        console.error('Resume call API error:', result.error)
        toast.error(`Failed to resume call: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling resume call API:', error)
      toast.error('Failed to resume call: Network error')
    } finally {
      setShowPageLoader(false);
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleMergeCalls = async () => {
    // Check permission for merging calls
    if (!hasPermission('merge-call-cti')) {
      toast.error('You do not have permission to merge calls')
      return
    }

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
    const callingDevice = getCallingDeviceInfoForAPI()
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
      setShowPageLoader(true);
      // Call the mergeCalls API
      const result = await mergeCalls({
        heldCallId: heldCall.callId,
        activeCallId: activeCall.callId,
        callingAddress: callingDevice.callingAddress,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName
      });

      setShowPageLoader(false);

      if (result.success) {
        // Create merged call entry
        const mergedCallId = `merged_${Date.now()}`
        const mergedCall = {
          id: mergedCallId,
          
          conferenceCallId:result?.responseData?.conferenceCallId,
          callingDeviceName: callingDevice.callingDeviceName,
          callingDeviceType: callingDevice.callingDeviceType,
          
          mergedCallId: mergedCallId,
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
      setShowPageLoader(false);
      console.error('Error calling merge calls API:', error)
      toast.error('Failed to merge calls: Network error')
    } finally {
      setShowPageLoader(false);
    }
  }

  const handleTransferCall = async (callId: string, targetExtension: string) => {
    // Check permission for transferring calls
    if (!hasPermission('transfer-call-cti')) {
      toast.error('You do not have permission to transfer calls')
      return
    }

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
      const callingDevice = getCallingDeviceInfoForAPI()
      if (!callingDevice) {
        toast.error('No calling device information available')
        return
      }

      setShowPageLoader(true);
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
        setShowPageLoader(false);
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
                 // console.log('Removed merged call with no members left after transfer')
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
                 // console.log('Converted merged call back to regular call after transfer')
                } else {
                  // Update the merged call with remaining members
                  newMap.set(mergedCallId, {
                    ...mergedCall,
                    members: updatedMembers
                  })
                  //console.log('Updated merged call after member transfer')
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
          setShowPageLoader(false);
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
        setShowPageLoader(false);
        console.error('Transfer call API error:', result.error)
        toast.error(`Failed to transfer call: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling transfer call API:', error)
      toast.error('Failed to transfer call: Network error')
    } finally {
      setShowPageLoader(false);
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleEndCall = async (callId: string) => {
    // Check permission for ending calls
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to end calls')
      return
    }

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
      // For incoming calls, use the call's stored addresses
      // For outgoing calls, get calling device info
      let callingAddress, calledAddress, callingDeviceType, callingDeviceName;
      
      if (call.callingAddress && call.calledAddress) {
        // This is an incoming call - use stored addresses
        callingAddress = call.callingAddress;
        calledAddress = call.calledAddress;
        callingDeviceType = call.callingDeviceType || 'SOFT';
        callingDeviceName = call.callingDeviceName || 'WebCTI';
      } else {
        // This is an outgoing call - get calling device info
        const callingDevice = getCallingDeviceInfoForAPI()
        if (!callingDevice) {
          toast.error('No calling device information available')
          return
        }
        callingAddress = callingDevice.callingAddress;
        calledAddress = call.calledAddress || call.number;
        callingDeviceType = callingDevice.callingDeviceType;
        callingDeviceName = callingDevice.callingDeviceName;
      }

      setShowPageLoader(true);
      // Call the endCall API
      const result = await endCall({
        callId: call.callId,
        callingAddress: callingAddress,
        calledAddress: calledAddress,
        callingDeviceType: callingDeviceType,
        callingDeviceName: callingDeviceName
      })

      if (result.success) {
        setShowPageLoader(false);
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
        setShowPageLoader(false);
        console.error('End call API error:', result.error)
        toast.error(`Failed to end call: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling end call API:', error)
      toast.error('Failed to end call: Network error')
    } finally {
      setShowPageLoader(false);
      // Clear processing state
      setProcessingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(callId)
        return newSet
      })
    }
  }

  const handleAttendCall = async () => {
    // Check permission for attending calls
    if (!hasPermission('dial-call-cti')) {
      toast.error('You do not have permission to answer calls')
      return
    }

    if (!incomingCall) {
      toast.error('No incoming call to attend')
      return
    }

    // Clear the timer
    if (incomingCallTimer) {
      clearTimeout(incomingCallTimer)
      setIncomingCallTimer(null)
    }

    try {
      setShowPageLoader(true);
      
     // console.log(incomingCall, "incomingCall");
      // Call the attendCall API with the required payload
      const result = await attendCall({
        callId: incomingCall.callId,
        callingAddress: incomingCall.callingAddress,
        calledAddress: incomingCall.calledAddress,
        controllerAddress: incomingCall.controllerAddress,
        controllerDeviceName: incomingCall.controllerDeviceName,
        controllerDeviceType: incomingCall.controllerDeviceType
      })

      if (result.success) {
        setShowPageLoader(false);
        
        // Close the incoming call modal
        setShowIncomingCallModal(false)
        setIncomingCall(null)
        
        // Create a new call entry in activeCalls
        const newCallId = `incoming_${Date.now()}`
        const newCall = {
          id: newCallId,
          number: incomingCall.callingAddress,
          status: 'connected',
          startTime: new Date(),
          callId: incomingCall.callId,
          callingAddress: incomingCall.callingAddress,
          calledAddress: incomingCall.calledAddress,
          callingDeviceName: incomingCall.controllerDeviceName,
          callingDeviceType: incomingCall.controllerDeviceType,
          duration: 0
        }

        setActiveCalls(prev => {
          const newMap = new Map(prev)
          newMap.set(newCallId, newCall)
          // Save to localStorage after updating
          setTimeout(() => saveCallStatesToStorage(newMap), 0)
          return newMap
        })
        
        toast.success('Call attended successfully')
      } else {
        setShowPageLoader(false);
        console.error('Attend call API error:', result.error)
        toast.error(`Failed to attend call: ${result.error}`)
      }
    } catch (error) {
      setShowPageLoader(false);
      console.error('Error calling attend call API:', error)
      toast.error('Failed to attend call: Network error')
    }
  }

  const handleRejectCall = () => {
    // Clear the timer
    if (incomingCallTimer) {
      clearTimeout(incomingCallTimer)
      setIncomingCallTimer(null)
    }
    
    // Close the incoming call modal without attending
    setShowIncomingCallModal(false)
    setIncomingCall(null)
    toast.info('Call rejected')
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
       // console.log('Event already processed, skipping:', eventId)
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
      }
      
      // Log current state after processing event
      // console.log('Active calls after processing event:', Array.from(activeCalls.values()).map(call => ({
      //   id: call.id,
      //   number: call.number,
      //   status: call.status,
      //   callId: call.callId,
      //   startTime: call.startTime.toLocaleTimeString(),
      //   duration: call.duration
      // })))
      
      // Special logging for RINGING calls to track status preservation
      const ringingCalls = Array.from(activeCalls.values()).filter(call => call.status === 'ringing')
      if (ringingCalls.length > 0) {
        // console.log('RINGING calls that should maintain their status:', ringingCalls.map(call => ({
        //   id: call.id,
        //   number: call.number,
        //   status: call.status,
        //   callId: call.callId
        // })))
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
        
        const { callId, callingAddress, calledAddress, callStatus, callingDeviceName, callingDeviceType } = eventData
        
        // First try to find by callId (most reliable)
        let existingCall = Array.from(activeCalls.values()).find(call => 
          call.callId === callId && callId
        )
        
        console.log(`findOrCreateCall - Looking for call:`, {
          eventCallId: callId,
          callingAddress,
          calledAddress,
          callStatus,
          foundByCallId: !!existingCall
        })
        
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
        
        console.log(`findOrCreateCall - Result:`, {
          found: !!existingCall,
          callId: existingCall?.id,
          number: existingCall?.number,
          status: existingCall?.status,
          callIdFromEvent: existingCall?.callId
        })
        
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
              console.warn(`BLOCKED: Preventing status override from RINGING to CONNECTED without explicit CONNECTED event`, {
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
              ...(eventData?.callingDeviceName && { callingDeviceName: eventData.callingDeviceName }),
              ...(eventData?.callingDeviceType && { callingDeviceType: eventData.callingDeviceType })
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
        
        const { callId, callingAddress, calledAddress, callingDeviceName, callingDeviceType } = eventData
        
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
          callingDeviceType: callingDeviceType,
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
          // Clear any existing timer
          if (incomingCallTimer) {
            clearTimeout(incomingCallTimer)
          }
          
          // Show incoming call modal with attend/reject options
          setIncomingCall({
            callId: eventData.callId || `incoming_${Date.now()}`,
            callingAddress: eventData.callingAddress,
            calledAddress: eventData.calledAddress,
            controllerAddress: eventData.controllerAddress || userAddress,
            controllerDeviceName: eventData.controllerDeviceName || 'WebCTI',
            controllerDeviceType: eventData.controllerDeviceType || 'SOFT_HARD',
            startTime: new Date()
          })
          setShowIncomingCallModal(true)
          
          // Set auto-dismiss timer (30 seconds)
          const timer = setTimeout(() => {
            setShowIncomingCallModal(false)
            setIncomingCall(null)
            toast.info('Incoming call timed out')
          }, 30000)
          setIncomingCallTimer(timer)
          
          // Also create a call entry for tracking
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
          console.log('Incoming RINGING call detected for user:', userAddress)
          
          // Clear any existing timer
          if (incomingCallTimer) {
            clearTimeout(incomingCallTimer)
          }
          
          // Get device information for user 109 from dnsMap
          const userDeviceInfo = dnsMap[userAddress]
          const userDevices = userDeviceInfo ? Object.values(userDeviceInfo.devices || {}) : []
          const activeUserDevice = userDevices.find(device => device.terminalState === 'REGISTERED')
          
          // Show incoming call modal with attend/reject options
          setIncomingCall({
            callId: eventData.callId || `incoming_${Date.now()}`,
            callingAddress: eventData.callingAddress,
            calledAddress: eventData.calledAddress,
            controllerAddress: userAddress,
            controllerDeviceName: activeUserDevice?.deviceName || '',
            controllerDeviceType: activeUserDevice?.deviceType || '',
            startTime: new Date()
          })
          setShowIncomingCallModal(true)
          
          // Set auto-dismiss timer (30 seconds)
          const timer = setTimeout(() => {
            setShowIncomingCallModal(false)
            setIncomingCall(null)
            toast.info('Incoming call timed out')
          }, 30000)
          setIncomingCallTimer(timer)
          
          // Also create a call entry for tracking
          const newCallId = createNewCall(eventData, 'ringing')
          if (newCallId) {
            setTimeout(() => {
              toast.info(`Incoming call from ${eventData.callingAddress}`)
            }, 0)
          }
        }
        // Check if this is an outgoing call from our user address
        else if (eventData.callingAddress === userAddress) {
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
      console.log(`🔍 Checking for termination events:`, {
        eventType: latestEvent.eventType,
        hasParties: !!latestEvent.parties,
        isTerminationEvent: ['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType)
      })
      
      // Check if incoming call was terminated by caller
      if (['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType) && latestEvent.parties && incomingCall) {
        const eventData = latestEvent.parties[0]
        if (eventData.callId === incomingCall.callId || 
            (eventData.callingAddress === incomingCall.callingAddress && eventData.calledAddress === incomingCall.calledAddress)) {
          console.log('Incoming call terminated by caller')
          
          // Clear the timer
          if (incomingCallTimer) {
            clearTimeout(incomingCallTimer)
            setIncomingCallTimer(null)
          }
          
          // Close the incoming call modal
          setShowIncomingCallModal(false)
          setIncomingCall(null)
          
          toast.info('Incoming call ended by caller')
          return
        }
      }
      
      if (['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType) && latestEvent.parties) {
        const eventData = latestEvent.parties[0]
        
        // Enhanced logging to debug call termination
        console.log(`🔴 ${latestEvent.eventType} event received:`, {
          eventType: latestEvent.eventType,
          eventCallId: eventData.callId,
          callingAddress: eventData.callingAddress,
          calledAddress: eventData.calledAddress,
          callStatus: eventData.callStatus,
          eventTime: latestEvent.eventTime,
          allActiveCalls: Array.from(activeCalls.values()).map(call => ({
            id: call.id,
            number: call.number,
            status: call.status,
            callId: call.callId
          }))
        })
        
        let existingCall = findOrCreateCall(eventData)
        
        console.log(`🔍 Termination handler - Call found:`, {
          found: !!existingCall,
          callId: existingCall?.id,
          number: existingCall?.number,
          status: existingCall?.status,
          callIdFromEvent: existingCall?.callId
        })
        
        if (existingCall) {
          console.log(`${latestEvent.eventType} event processed for call:`, {
            callId: existingCall.id,
            number: existingCall.number,
            status: existingCall.status,
            callIdFromEvent: existingCall.callId
          })
        } else {
          // Fallback: Try to find call by callId directly
          console.log(`⚠️ Call not found by normal matching, trying fallback search...`)
          const fallbackCall = Array.from(activeCalls.values()).find(call => 
            call.callId === eventData.callId
          )
          
          if (fallbackCall) {
            console.log(`✅ Fallback search found call:`, {
              id: fallbackCall.id,
              number: fallbackCall.number,
              status: fallbackCall.status,
              callId: fallbackCall.callId
            })
            // Use the fallback call
            existingCall = fallbackCall
          } else {
            console.log(`❌ No call found even with fallback search`)
            return
          }
        }
        
        // Check if this termination is legitimate or if it's a false positive
        // Some CTI systems send termination events when making new calls
        const isLegitimateTermination = checkIfTerminationIsLegitimate(latestEvent, existingCall)
        
        if (isLegitimateTermination) {
          console.log(`✅ Legitimate termination confirmed, removing call immediately`)
          
          // Update call status to ended and remove in one state update
          setActiveCalls(prev => {
            const newMap = new Map(prev)
            const callToUpdate = newMap.get(existingCall.id)
            
            console.log(`🔄 Before update - Active calls count:`, newMap.size)
            console.log(`🔄 Before update - Call to update:`, callToUpdate)
            
            if (callToUpdate) {
              console.log(`🔄 Updating call status to ended and removing:`, {
                id: callToUpdate.id,
                number: callToUpdate.number,
                oldStatus: callToUpdate.status,
                newStatus: 'ended'
              })
              
              // Remove the call immediately (no need to update status first)
              newMap.delete(existingCall.id)
              
              console.log(`🗑️ Call removed from active calls:`, {
                id: existingCall.id,
                number: existingCall.number
              })
              console.log(`🗑️ After removal - Active calls count:`, newMap.size)
              console.log(`🗑️ Remaining calls:`, Array.from(newMap.values()).map(call => ({
                id: call.id,
                number: call.number,
                status: call.status
              })))
            }
            
            // Save to localStorage after updating
            setTimeout(() => saveCallStatesToStorage(newMap), 0)
            return newMap
          })
          
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
  }, [eventLog]) // Removed activeCalls dependency

  // Handle URL query parameter for dialedNumber and auto-dial
  useEffect(() => {
    if (router.isReady && router.query.dialedNumber && !hasAutoDialedRef.current) {
      const numberFromUrl = router.query.dialedNumber as string
      console.log('URL dialedNumber parameter found:', numberFromUrl)
      
      // Only set if it's a valid number and not already set
      if (numberFromUrl && numberFromUrl.trim() !== '' && !dialedNumber) {
        // Extract only numbers from the URL parameter
        const numbersOnly = numberFromUrl.replace(/[^0-9]/g, '')
        if (numbersOnly.length > 0 && numbersOnly.length <= 15) {
          setDialedNumber(numbersOnly)
          console.log('Prefilled dialed number from URL:', numbersOnly)
          
          // Mark that we're about to auto-dial to prevent multiple calls
          hasAutoDialedRef.current = true
          
          // Auto-dial after a short delay to ensure the component is fully loaded
          setTimeout(() => {
            console.log('Auto-dialing number from URL:', numbersOnly)
            handleDial()
          }, 1000) // 1 second delay
        }
      }
    }
  }, [router.isReady, router.query.dialedNumber, dialedNumber])

  // Clear call data on every page load
  useEffect(() => {
    //console.log('Page load detected - clearing call data from localStorage')
    
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
    hasAutoDialedRef.current = false
    
   // console.log('Cleared all call-related data on page load')
  }, [])

  // Clear stored caller info on page load to start fresh
  useEffect(() => {
    localStorage.removeItem('cti_caller_info')
   // console.log('🧹 Cleared stored caller info on page load')
  }, [])

  // Cleanup incoming call timer on unmount
  useEffect(() => {
    return () => {
      if (incomingCallTimer) {
        clearTimeout(incomingCallTimer)
      }
    }
  }, [incomingCallTimer])

  // Note: Call state restoration is disabled - all call states are cleared on page load

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



  // Check if a call is part of a merged call
  const isCallMerged = (callId: string) => {
    return Array.from(mergedCalls.values()).some(mergedCall =>
      mergedCall.members.some(member => member.id === callId)
    )
  }

  // Remove a member from a merged call
  const removeMemberFromMergedCall = async (mergedCallId: string, memberId: string) => {
    // Check permission for removing from conference calls
    if (!hasPermission('merge-call-cti')) {
      toast.error('You do not have permission to remove participants from conference calls')
      return
    }

    const mergedCall = mergedCalls.get(mergedCallId);
    
    if (!mergedCall) {
      console.log('Merged call not found')
      return
    }

    console.log(`Removing member ${memberId} from merged call ${mergedCallId}`)
    console.log(mergedCall, "mergdCall cti");
    console.log(memberId, "memberId cti");
    console.log( "=====================");
    
    const memberToRemove = mergedCall.members.find(member => member.id === memberId);
    console.log(memberToRemove, "memberToRemove cti");
    console.log( "=====================");

    // Find the corresponding party callId for this member
    const partyCallId = mergedCall.members.find(member => member.id === memberId)?.callId || '';
    console.log(partyCallId, "partyCallId cti");
    console.log( "=====================");

    const payloadRemoveCall={
      callId: partyCallId || mergedCall.conferenceCallId || '',
      
      calledAddress: memberToRemove?.calledAddress || '',

      callingAddress: memberToRemove?.callingAddress,
      callingDeviceType: mergedCall.callingDeviceType || '',
      callingDeviceName: mergedCall.callingDeviceName || ''
    };
    console.log(payloadRemoveCall, "payloadRemoveCall cti");

    const removeFromMergedCall = await RemoveCall(payloadRemoveCall);
    console.log(removeFromMergedCall, "removeFromMergedCall cti");
    console.log( "=====================");



      
      // if (!mergedCall) {
      //   console.log('Merged call not found')
      //   return newMap
      // }
      
      // console.log(`Merged call members before removal:`, mergedCall.members.map(m => ({
      //   id: m.id,
      //   number: m.number,
      //   callId: m.callId
      // })))  

      // // Remove the member
      // const updatedMembers = mergedCall.members.filter(member => member.id !== memberId)
      
      // console.log(`Merged call members after removal:`, updatedMembers.map(m => ({
      //   id: m.id,
      //   number: m.number,
      //   callId: m.callId
      // })))
      
      //   if (updatedMembers.length === 0) {
      //     // If no members left, remove the entire merged call
      //     newMap.delete(mergedCallId)
      //     console.log('Removed merged call with no members left')
          
      //     // Save to localStorage after updating - use current active calls
      //     setTimeout(() => {
      //       const currentActiveCalls = new Map(activeCalls)
      //       saveCallStatesToStorage(currentActiveCalls)
      //     }, 0)
      //   } else if (updatedMembers.length === 1) {
      //   // If only one member left, convert back to regular call
      //   const remainingMember = updatedMembers[0]
      //   const regularCall = {
      //     id: remainingMember.id,
      //     number: remainingMember.number,
      //     startTime: remainingMember.startTime,
      //     status: remainingMember.status,
      //     callId: remainingMember.callId,
      //     callingAddress: remainingMember.callingAddress,
      //     calledAddress: remainingMember.calledAddress,
      //     callingDeviceName: remainingMember.callingDeviceName,
      //     callingDeviceType: remainingMember.callingDeviceType,
      //     duration: 0
      //   }
        
      //   console.log(`Converting merged call back to regular call for member:`, {
      //     id: remainingMember.id,
      //     number: remainingMember.number,
      //     callId: remainingMember.callId
      //   })
        
      //   // Add back to active calls
      //   setActiveCalls(prev => {
      //     const newActiveMap = new Map(prev)
      //     newActiveMap.set(remainingMember.id, regularCall)
      //     // Save to localStorage after updating
      //     setTimeout(() => saveCallStatesToStorage(newActiveMap), 0)
      //     return newActiveMap
      //   })
        
      //   // Remove the merged call
      //   newMap.delete(mergedCallId)
      //   console.log('Converted merged call back to regular call')
      // } else {
      //   // Update the merged call with remaining members
      //   const updatedMergedCall = {
      //     ...mergedCall,
      //     members: updatedMembers
      //   }
        
      //   // Validate that we don't have duplicate member IDs
      //   const memberIds = updatedMembers.map(m => m.id)
      //   const uniqueMemberIds = Array.from(new Set(memberIds))
        
      //   if (memberIds.length !== uniqueMemberIds.length) {
      //     console.warn('⚠️ Duplicate member IDs detected, filtering out duplicates')
      //     const uniqueMembers = updatedMembers.filter((member, index) => 
      //       memberIds.indexOf(member.id) === index
      //     )
      //     updatedMergedCall.members = uniqueMembers
      //   }
        
      //   newMap.set(mergedCallId, updatedMergedCall)
      //   console.log('Updated merged call with remaining members:', updatedMergedCall.members.map(m => ({
      //     id: m.id,
      //     number: m.number,
      //     callId: m.callId
      //   })))
        
      //   // Save to localStorage after updating - use current active calls
      //   setTimeout(() => {
      //     const currentActiveCalls = new Map(activeCalls)
      //     saveCallStatesToStorage(currentActiveCalls)
      //   }, 0)
      // }
      
    //    return newMap
    // })
  }

  // Get merged call for a specific call ID
  const getMergedCallForMember = (callId: string) => {
    return Array.from(mergedCalls.values()).find(mergedCall =>
      mergedCall.members.some(member => member.id === callId)
    )
  }

  

  // Check if a termination event is legitimate or a false positive
  const checkIfTerminationIsLegitimate = (event: any, call: any) => {
    // If the call is currently connected and we receive a termination event,
    // it might be a false positive from the CTI system when making new calls
    
    // Check if this is a very recent call (within last 3 seconds)
    const callAge = Date.now() - call.startTime.getTime()
    const isVeryRecentCall = callAge < 3000 // 3 seconds
    
    // Check if we have other active calls
    const otherActiveCalls = Array.from(activeCalls.values()).filter(c => 
      c.id !== call.id && ['connected', 'ringing', 'dialing'].includes(c.status)
    )
    
    // Check if this termination event has a very recent timestamp (within last 1 second)
    const eventAge = Date.now() - new Date(event.eventTime).getTime()
    const isVeryRecentEvent = eventAge < 1000 // 1 second
    
    // Check if we're currently in the process of making a new call
    const isCurrentlyDialing = isDialing || Array.from(activeCalls.values()).some(c => c.status === 'dialing')
    
    // Only treat as false positive if it's a VERY recent call AND very recent event AND we're actively dialing
    // This is much more restrictive to avoid blocking legitimate terminations
    if (isVeryRecentCall && isVeryRecentEvent && isCurrentlyDialing) {
      console.log(`⚠️ Potential false positive termination detected:`, {
        callId: call.id,
        callNumber: call.number,
        callAge: `${Math.round(callAge / 1000)}s`,
        eventAge: `${Math.round(eventAge / 1000)}s`,
        isCurrentlyDialing,
        reason: 'Very recent call termination during active dialing'
      })
      return false
    }
    
    // If the call has been active for more than 3 seconds, it's likely legitimate
    if (callAge > 3000) {
      console.log(`Legitimate termination detected:`, {
        callId: call.id,
        callNumber: call.number,
        callAge: `${Math.round(callAge / 1000)}s`,
        reason: 'Call has been active for sufficient time'
      })
      return true
    }
    
    // Default to legitimate if we can't determine
    // console.log(`Termination legitimacy unclear:`, {
    //   callId: call.id,
    //   callNumber: call.number,
    //   callAge: `${Math.round(callAge / 1000)}s`,
    //   eventAge: `${Math.round(eventAge / 1000)}s`,
    //   otherActiveCalls: otherActiveCalls.length,
    //   isCurrentlyDialing
    // })
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
        Connecting to server...
      </div>
    )
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CTI" mainLink="/cti" subTitle="Live Dialer" showPageLoader={showPageLoader} />


      <PageHeader title="Live Dialer"
      buttons={
        <Link href="/cti" className="btn btn-primary">
          <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>arrow_back</i>
          Back
        </Link>
      }
       /> 

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
            <Card.Body className="text-center pg-dialer-container">
              <Row>
                {/* Extensions */}
                <Col md={4} style={{ backgroundColor: 'rgb(198 203 208 / 35%)' }}>
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
                <Col md={8} style={{ backgroundColor: '#fff' }}>
                  {/* Display Number */}
                  <div className="mb-4">
                    <div className="display-4 fw-bold mb-2 text-primary">
                      <input
                        type="text"
                        value={dialedNumber}
                        onChange={handleNumberInput}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        className="form-control form-control-lg text-center border-0 bg-transparent text-primary fw-bold"
                        style={{ 
                          fontSize: '1.5rem', 
                          outline: 'none',
                          boxShadow: 'none',
                          borderBottom: '2px solid transparent',
                          transition: 'border-bottom-color 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderBottomColor = '#0d6efd'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderBottomColor = 'transparent'
                        }}
                        placeholder="Type number"
                        maxLength={15}
                        autoComplete="off"
                        title=""
                      />
                    </div>
                    
                   
                    
                    {showInvalidWarning && (
                      <div className="alert alert-warning py-2 mb-3">
                        <i className="material-icons-two-tone me-2">warning</i>
                        <small>This number is not an available extension</small>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-center gap-2 mb-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="app-button text-center"
                        onClick={handleBackspace}
                        disabled={!dialedNumber}
                      >
                        <i className="material-icons-two-tone" style={{ backgroundColor: '#fff' }}>backspace</i>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="app-button text-center"
                        onClick={handleClear}
                        
                        disabled={!dialedNumber}
                      >
                        <i className="material-icons-two-tone" style={{ backgroundColor: '#fff' }}>clear</i>
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
                             className="w-100 py-3 app-button text-center d-block"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                            <b>{num}</b>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      {[4, 5, 6].map((num) => (
                        <div key={num} className="col-4">
                          <Button
                            variant="outline-primary"
                           
                            className="w-100 py-3 app-button text-center d-block"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                             <b>{num}</b>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      {[7, 8, 9].map((num) => (
                        <div key={num} className="col-4">
                          <Button
                             variant="outline-primary"
                            
                             className="w-100 py-3 app-button text-center d-block"
                            onClick={() => handleDialPadClick(num.toString())}
                          >
                             <b>{num}</b>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <Button
                          variant="outline-primary"
                         
                          className="w-100 py-3 app-button text-center d-block"
                          onClick={() => handleDialPadClick('*')}
                        >
                          <b><i className="material-icons-two-tone">*</i></b>
                          
                        </Button>
                      </div>
                      <div className="col-4">
                        <Button
                           variant="outline-primary"
                          
                           className="w-100 py-3 app-button text-center d-block"
                          onClick={() => handleDialPadClick('0')}
                        >
                          <b>0</b>
                        </Button>
                      </div>
                      <div className="col-4">
                        <Button
                          variant="outline-primary"
                         
                          className="w-100 py-3 app-button text-center d-block"
                          onClick={() => handleDialPadClick('#')}
                        >
                          <b>#</b>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dial Button */}
                  <div className="text-center">
                    <Button
                      variant="primary"
                     
                      className="w-100 py-3 app-button text-center d-block mb-4 btnDial"
                      onClick={handleDial}
                      disabled={!hasPermission('dial-call-cti')}
                    >
                      <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>call</i>
                      {isDialing ? 'Dialing...' : 'Dial'}
                    </Button>
                    
                    {!hasPermission('dial-call-cti') && (
                      <div className="alert alert-warning py-2">
                        <i className="material-icons-two-tone me-2">warning</i>
                        <small>You do not have permission to dial calls</small>
                      </div>
                    )}
                    
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
                      Merge Available
                    </Badge>
                  )}
                </h5>
                
              </div>
            </Card.Header>
            <Card.Body>
              {/* Merge Calls Section */}
              {canMergeCalls() && hasPermission('merge-call-cti') && (
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
                        className="app-button text-center d-inline-block"
                        onClick={handleMergeCalls}
                        disabled={selectedCallsForMerge.size !== 2}
                      >
                        <i className="material-icons-two-tone me-2">call_merge</i>
                        Merge Selected Calls
                      </Button>
                      {selectedCallsForMerge.size > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-2 app-button text-center"
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
                                    {/* <Button
                                      variant="outline-info"
                                      size="sm"
                                      className="transfer-member-btn"
                                      onClick={() => {
                                        setTransferCallId(member.id)
                                        setShowTransferModal(true)
                                      }}
                                      title="Transfer call"
                                    >
                                    </Button> */}
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="remove-member-btn"
                                      onClick={() => removeMemberFromMergedCall(mergedCall.id, member.id)}
                                      disabled={!hasPermission('merge-call-cti')}
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
                  
                 
                </div>
              )}

              <Row>
              {(() => {
                const activeCallsToRender = Array.from(activeCalls.values()).filter(call => 
                  ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status) && !isCallMerged(call.id)
                )
                // console.log(`🎨 Rendering active calls:`, {
                //   totalActiveCalls: activeCalls.size,
                //   callsToRender: activeCallsToRender.length,
                //   calls: activeCallsToRender.map(call => ({
                //     id: call.id,
                //     number: call.number,
                //     status: call.status,
                //     callId: call.callId
                //   }))
                // })
                return activeCallsToRender
              })().map((call) => (
                <Col md={6} key={`${call.id}-${call.status}-${call.callId}`} className="mb-4">
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
                            className="w-100 app-button text-center d-block"
                            onClick={() => handleHoldCall(call.id)}
                            disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Hold Call'}
                          </Button>
                        </div>
                        <div className="col-4">
                          <Button
                            variant="info"
                            size="sm"
                            className="w-100 app-button text-center d-block"
                            onClick={() => {
                              setTransferCallId(call.id)
                              setShowTransferModal(true)
                            }}
                            disabled={processingCalls.has(call.id) || !hasPermission('transfer-call-cti')}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Transfer'}
                          </Button>
                        </div>
                        <div className="col-4">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100 app-button text-center d-block"
                            onClick={() => handleEndCall(call.id)}
                            disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
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
                            className="w-100 app-button text-center d-block"
                            onClick={() => handleResumeCall(call.id)}
                            disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
                          >
                            {processingCalls.has(call.id) ? 'Processing...' : 'Resume Call'}
                          </Button>
                        </div>
                        <div className="col-6">
                          <Button
                            variant="danger"
                            size="sm"
                            className="w-100 app-button text-center d-block"
                            onClick={() => handleEndCall(call.id)}
                            disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
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
                          className="w-100 app-button text-center d-block"
                          onClick={() => handleEndCall(call.id)}
                          disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
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
                          className="w-100 app-button text-center d-block"
                          onClick={() => handleEndCall(call.id)}
                          disabled={processingCalls.has(call.id) || !hasPermission('dial-call-cti')}
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
        @keyframes ring {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        .incoming-call-content {
          position: relative;
        }
        
        .modal-overlay {
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          //border: 2px solid #28a745;
          //animation: pulse 2s infinite;
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
                
                <div className="row g-2">
                  
                  
                    <div className="popExtension">
                      <input type="text" className="form-control" placeholder="Search extensions" onChange={(e) => setExtensionPopSearch(e.target.value)} />
                     <Row>
                      <Col md={12} className="mt-2 popExtensioList">
                      {getAvailableExtensionsForTransfer().filter(extension => 
                        extension.toLowerCase().includes(extensionPopSearch.toLowerCase())
                      ).map((extension) => {
                        // Get extension status from dnsMap
                        const extensionData = dnsMap[extension]
                        const deviceList = extensionData ? Object.values(extensionData.devices || {}) : []
                        const status = getCardLevelStatus(deviceList)
                        const isOnline = status === 'registered'
                        
                        return (
                          <div key={extension} className="mt-2">
                            <button
                              type="button"
                              className={`btn btn-sm d-block app-button  w-100 ${transferTarget === extension ? 'btn-primary' : 'btn-default'}`}
                              onClick={() => setTransferTarget(extension)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">{extension}</span>
                                <small className={isOnline ? 'text-success' : 'text-muted'}>
                                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                                </small>
                              </div>
                            </button>
                          </div>
                        )
                      })}
                      </Col>
                     </Row>
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
                className="btn btn-default app-button"
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
                className="btn btn-primary app-button"
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

      {/* Incoming Call Modal */}
      {showIncomingCallModal && incomingCall && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            //animation: 'pulse 2s infinite'
          }}>
            <div className="incoming-call-content">
              <div className="mb-4">
                <i className="material-icons-two-tone" style={{ 
                  fontSize: '4rem', 
                  color: '#28a745',
                  animation: 'ring 1s infinite'
                }}>
                  call
                </i>
              </div>
              
              <h4 className="mb-3 text-primary">Incoming Call</h4>
              
              <div className="mb-4">
                <h5 className="mb-2">
                  <i className="material-icons-two-tone me-2">phone</i>
                  {incomingCall.callingAddress}
                </h5>
                <p className="text-muted mb-0">
                  Calling to {incomingCall.calledAddress}
                </p>
                <small className="text-muted">
                  Started: {incomingCall.startTime.toLocaleTimeString()}
                </small>
              </div>
              
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col-6">
                    <Button
                      variant="success"
                    
                      className="w-100 py-3 app-button text-center d-block"
                      onClick={handleAttendCall}
                      disabled={showPageLoader || !hasPermission('dial-call-cti')}
                    >
                      <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>call</i>
                      {showPageLoader ? 'Answering...' : 'Answer Call'}
                    </Button>
                  </div>
                  <div className="col-6">
                    <Button
                      variant="secondary"
                      className="w-100 py-3 app-button text-center d-block"
                      onClick={handleRejectCall}
                      disabled={showPageLoader}
                    >
                      <i className="material-icons-two-tone me-2" style={{ backgroundColor: '#fff' }}>call_end</i>
                      Ignore Call
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="small text-muted">
                <div>Call ID: {incomingCall.callId}</div>
                <div>Controller: {incomingCall.controllerDeviceName}</div>
                <div>Device Type: {incomingCall.controllerDeviceType}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Selection Modal */}
      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={handleDeviceSelectionCancel}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={userAddress || ''}
      />
    </React.Fragment>
  )
}

CtiDialer.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>
}

export default CtiDialer
