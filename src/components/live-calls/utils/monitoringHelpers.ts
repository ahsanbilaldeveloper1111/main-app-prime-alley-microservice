import React from 'react'
import { CtiDevice, ShowPopup, PendingMonitoringData, AvailableDevice } from './types'
import { startMonitoring, stopMonitoring as stopMonitoringAPI, startBargeInMonitoring, stopBargeInMonitoring as stopBargeInMonitoringAPI } from '@utils/dialer'

/**
 * Create API payload for monitoring
 */
export const createMonitoringPayload = (
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

/**
 * Get user's available devices
 */
export const getUserDevices = (
  userAddress: string | null,
  dnsMap: Record<string, any>
): AvailableDevice[] => {
  if (!userAddress || !dnsMap[userAddress]) return []
  
  const devices = Object.values(dnsMap[userAddress].devices || {})
  return devices.map((device: any) => ({
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    terminalState: device.terminalState,
    when: new Date().toISOString(),
    details: `Status: ${device.terminalState}`
  }))
}

/**
 * Check if user has multiple devices
 */
export const hasMultipleDevices = (
  userAddress: string | null,
  dnsMap: Record<string, any>
): boolean => {
  const devices = getUserDevices(userAddress, dnsMap)
  return devices.length > 1
}

/**
 * Execute monitoring with selected devices
 */
export const executeMonitoring = async (
  dn: string,
  monitorType: string,
  toneType: string,
  monitorDevice: any,
  monitoredDevice: CtiDevice,
  userAddress: string | null,
  showPopup: ShowPopup | null,
  setShowPageLoader: (show: boolean) => void,
  setActiveMonitoring: React.Dispatch<React.SetStateAction<any>>,
  setMonitoringStartTime: React.Dispatch<React.SetStateAction<Record<string, Date>>>,
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>
): Promise<boolean> => {
  const payload = createMonitoringPayload(
    monitorDevice.deviceType,
    monitorDevice.deviceName,
    monitoredDevice.deviceType,
    monitoredDevice.deviceName,
    monitorType,
    toneType,
    userAddress || '',
    monitoredDevice.dn
  )

  setShowPageLoader(true)

  try {
    let response
    
    if (monitorType === 'BARGE_IN') {
      response = await startBargeInMonitoring(payload).finally(() => {
        setShowPageLoader(false)
      })
    } else {
      response = await startMonitoring(payload).finally(() => {
        setShowPageLoader(false)
      })
    }

    if (response.success) {
      setShowPageLoader(false)
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
      setShowPageLoader(false)
      setNotification({ type: 'danger', message: response.error || 'Failed to start monitoring' })
      return false
    }
  } catch (error) {
    setShowPageLoader(false)
    setNotification({ type: 'danger', message: 'Error starting monitoring' })
    return false
  }
}

/**
 * Stop silent monitoring
 */
export const stopSilentMonitoring = async (
  dn: string,
  userAddress: string | null,
  dnsMap: Record<string, any>,
  setShowPageLoader: (show: boolean) => void
): Promise<boolean> => {
  try {
    const userDevices = getUserDevices(userAddress, dnsMap)
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

    setShowPageLoader(true)
    const response = await stopMonitoringAPI(stopParams).finally(() => {
      setShowPageLoader(false)
    })
    
    if (response.success) {
      setShowPageLoader(false)
      return true
    } else {
      console.error('Failed to stop silent monitoring:', response.error)
      return false
    }
  } catch (error) {
    setShowPageLoader(false)
    console.error('Error stopping silent monitoring:', error)
    return false
  }
}

/**
 * Stop whisper monitoring
 */
export const stopWhisperMonitoring = async (
  dn: string,
  userAddress: string | null,
  dnsMap: Record<string, any>,
  setShowPageLoader: (show: boolean) => void
): Promise<boolean> => {
  try {
    const userDevices = getUserDevices(userAddress, dnsMap)
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

    setShowPageLoader(true)
    const response = await stopMonitoringAPI(stopParams).finally(() => {
      setShowPageLoader(false)
    })
    
    if (response.success) {
      setShowPageLoader(false)
      return true
    } else {
      setShowPageLoader(false)
      console.error('Failed to stop whisper monitoring:', response.error)
      return false
    }
  } catch (error) {
    setShowPageLoader(false)
    console.error('Error stopping whisper monitoring:', error)
    return false
  }
}

/**
 * Stop barge-in monitoring
 */
export const stopBargeInMonitoringLocal = async (
  dn: string,
  userAddress: string | null,
  dnsMap: Record<string, any>,
  setShowPageLoader: (show: boolean) => void
): Promise<boolean> => {
  try {
    const userDevices = getUserDevices(userAddress, dnsMap)
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

    setShowPageLoader(true)
    const response = await stopBargeInMonitoringAPI(stopParams).finally(() => {
      setShowPageLoader(false)
    })
    
    if (response.success) {
      setShowPageLoader(false)
      return true
    } else {
      setShowPageLoader(false)
      console.error('Failed to stop barge-in monitoring:', response.error)
      return false
    }
  } catch (error) {
    setShowPageLoader(false)
    console.error('Error stopping barge-in monitoring:', error)
    return false
  }
}

/**
 * Stop monitoring (wrapper for all monitoring types)
 */
export const stopMonitoring = async (
  dn: string,
  type: string,
  userAddress: string | null,
  dnsMap: Record<string, any>,
  setShowPageLoader: (show: boolean) => void,
  setActiveMonitoring: React.Dispatch<React.SetStateAction<any>>,
  setMonitoringStartTime: React.Dispatch<React.SetStateAction<Record<string, Date>>>,
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>,
  setShowPopup: React.Dispatch<React.SetStateAction<ShowPopup | null>>
): Promise<boolean> => {
  let success = false

  switch (type) {
    case 'SILENT':
      success = await stopSilentMonitoring(dn, userAddress, dnsMap, setShowPageLoader)
      break
    case 'WHISPER':
      success = await stopWhisperMonitoring(dn, userAddress, dnsMap, setShowPageLoader)
      break
    case 'BARGE_IN':
      success = await stopBargeInMonitoringLocal(dn, userAddress, dnsMap, setShowPageLoader)
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

    setSelectedMonitor(prev => {
      const newState = { ...prev }
      delete newState[dn]
      return newState
    })

    setSelectedTone(prev => {
      const newState = { ...prev }
      delete newState[dn]
      return newState
    })

    setTempMonitorSelection(prev => {
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

