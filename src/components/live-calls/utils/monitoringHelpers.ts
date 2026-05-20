import React from 'react'
import { CtiDevice, ShowPopup, PendingMonitoringData, AvailableDevice } from './types'
import {
  startMonitoring,
  stopMonitoring as stopMonitoringAPI,
  startBargeInMonitoring,
  stopBargeInMonitoring as stopBargeInMonitoringAPI,
} from '@utils/dialer'
import {
  resolveMonitoredDeviceNameFromParties,
} from '@components/communications/wallboards-live/wallboardEventParsing'
import { ctiAddressesEquivalent } from '@utils/ctiAddressMatching'
import { normalizeCtiApiMonitoringDeviceType } from '@utils/ctiApiDeviceType'

export type MonitoringSessionSnapshot = {
  dn: string | null
  type: string | null
  monitor?: string
  deviceName?: string | null
  monitorDeviceType?: string
  monitorDeviceName?: string
}

type ResolvedMonitorDevice = {
  monitorDeviceType: string
  monitorDeviceName: string
}

type ResolvedMonitoredDevice = {
  monitoredDeviceType: string
  monitoredDeviceName: string
}

function pickRegisteredOrFirstDevice(
  devices: Record<string, CtiDevice> | undefined,
): CtiDevice | null {
  if (!devices) {
    return null
  }
  const list = Object.values(devices)
  if (list.length === 0) {
    return null
  }
  return list.find((d) => d.terminalState === 'REGISTERED') ?? list[0]
}

/** Resolve supervisor device for stop APIs (matches start-monitoring device when possible). */
export function resolveMonitorDeviceForStop(
  userAddress: string | null,
  dnsMap: Record<string, unknown>,
  session: MonitoringSessionSnapshot | undefined,
): ResolvedMonitorDevice | null {
  if (session?.monitorDeviceType && session?.monitorDeviceName) {
    return {
      monitorDeviceType: normalizeCtiApiMonitoringDeviceType(session.monitorDeviceType),
      monitorDeviceName: session.monitorDeviceName,
    }
  }
  const dnEntry = userAddress
    ? (dnsMap[userAddress] as { devices?: Record<string, CtiDevice> } | undefined)
    : undefined
  const device = pickRegisteredOrFirstDevice(dnEntry?.devices)
  if (!device?.deviceType || !device?.deviceName) {
    return null
  }
  return {
    monitorDeviceType: normalizeCtiApiMonitoringDeviceType(device.deviceType),
    monitorDeviceName: device.deviceName,
  }
}

/** Resolve agent device for stop barge — critical after transfer when session deviceName is stale. */
export function resolveMonitoredDeviceForStop(
  monitoredDn: string,
  dnsMap: Record<string, unknown>,
  session: MonitoringSessionSnapshot | undefined,
  getCallStatesForDn?: (dn: string) => unknown[],
  monitorDn?: string,
): ResolvedMonitoredDevice | null {
  const dnEntry = dnsMap[monitoredDn] as { devices?: Record<string, CtiDevice> } | undefined
  const sessionDeviceName = session?.deviceName

  if (sessionDeviceName && dnEntry?.devices?.[sessionDeviceName]) {
    const d = dnEntry.devices[sessionDeviceName]
    return {
      monitoredDeviceType: normalizeCtiApiMonitoringDeviceType(d.deviceType),
      monitoredDeviceName: d.deviceName,
    }
  }

  if (getCallStatesForDn && monitorDn) {
    const calls = getCallStatesForDn(monitoredDn) as Array<{
      parties?: Array<{
        callingAddress?: string
        calledAddress?: string
        callingDeviceName?: string
        calledDeviceName?: string
        callStatus?: string
      }>
      isMonitoring?: boolean
    }>
    for (const call of calls) {
      if (!call.parties?.length) {
        continue
      }
      const fromParties = resolveMonitoredDeviceNameFromParties(
        call.parties,
        monitorDn,
        monitoredDn,
      )
      if (fromParties && dnEntry?.devices?.[fromParties]) {
        const d = dnEntry.devices[fromParties]
        return {
          monitoredDeviceType: normalizeCtiApiMonitoringDeviceType(d.deviceType),
          monitoredDeviceName: d.deviceName,
        }
      }
    }
  }

  const fallback = pickRegisteredOrFirstDevice(dnEntry?.devices)
  if (!fallback?.deviceType || !fallback?.deviceName) {
    return null
  }
  return {
    monitoredDeviceType: normalizeCtiApiMonitoringDeviceType(fallback.deviceType),
    monitoredDeviceName: fallback.deviceName,
  }
}

function findMonitoringCallIdForStop(
  monitoredDn: string,
  monitorDn: string,
  getCallStatesForDn: (dn: string) => unknown[],
): string | undefined {
  const calls = getCallStatesForDn(monitoredDn) as Array<{
    callId?: string
    isMonitoring?: boolean
    monitoring?: { monitorDn?: string; monitoredDn?: string }
  }>
  for (const call of calls) {
    if (!call.callId) {
      continue
    }
    if (call.isMonitoring === true) {
      return call.callId
    }
    const m = call.monitoring
    if (
      m?.monitorDn &&
      m?.monitoredDn &&
      ctiAddressesEquivalent(m.monitorDn, monitorDn) &&
      ctiAddressesEquivalent(m.monitoredDn, monitoredDn)
    ) {
      return call.callId
    }
  }
  return calls.find((c) => c.callId)?.callId
}

export function buildStopBargeInPayload(
  monitoredDn: string,
  userAddress: string | null,
  dnsMap: Record<string, unknown>,
  session: MonitoringSessionSnapshot | undefined,
  getCallStatesForDn?: (dn: string) => unknown[],
): {
  monitorDeviceType: string
  monitorDeviceName: string
  monitor: string
  monitoredDeviceType: string
  monitoredDeviceName: string
  monitoredDeviceDn: string
  type: string
  tone: string
  callId?: string
} | null {
  const monitorDevice = resolveMonitorDeviceForStop(userAddress, dnsMap, session)
  const monitorDn = session?.monitor ?? userAddress ?? ''
  const monitoredDevice = resolveMonitoredDeviceForStop(
    monitoredDn,
    dnsMap,
    session,
    getCallStatesForDn,
    monitorDn || undefined,
  )

  if (!monitorDevice || !monitoredDevice || !userAddress) {
    return null
  }

  const callId =
    getCallStatesForDn && monitorDn
      ? findMonitoringCallIdForStop(monitoredDn, monitorDn, getCallStatesForDn)
      : undefined

  return {
    monitorDeviceType: monitorDevice.monitorDeviceType,
    monitorDeviceName: monitorDevice.monitorDeviceName,
    monitor: userAddress,
    monitoredDeviceType: monitoredDevice.monitoredDeviceType,
    monitoredDeviceName: monitoredDevice.monitoredDeviceName,
    monitoredDeviceDn: monitoredDn,
    type: 'BARGE_IN',
    tone: 'NONE',
    ...(callId ? { callId } : {}),
  }
}

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
    monitorDeviceType: normalizeCtiApiMonitoringDeviceType(monitorDeviceType),
    monitorDeviceName,
    monitoredDeviceType: normalizeCtiApiMonitoringDeviceType(monitoredDeviceType),
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
        monitor: userAddress || undefined,
        deviceName: showPopup?.deviceName || undefined,
        monitorDeviceType: payload.monitorDeviceType,
        monitorDeviceName: monitorDevice.deviceName
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
  setShowPageLoader: (show: boolean) => void,
  activeMonitoring?: { dn: string | null; type: string | null; monitor?: string; deviceName?: string | null; monitorDeviceType?: string; monitorDeviceName?: string }
): Promise<boolean> => {
  try {
    // Use the monitor device that was used when starting monitoring
    // If not available in activeMonitoring, try to get from dnsMap
    let monitorDeviceType = activeMonitoring?.monitorDeviceType
    let monitorDeviceName = activeMonitoring?.monitorDeviceName
    
    if (!monitorDeviceType || !monitorDeviceName) {
      // Fallback: get from dnsMap for the supervisor
      if (userAddress && dnsMap[userAddress]) {
        const devices = Object.values(dnsMap[userAddress].devices || {}) as any[]
        if (devices.length > 0) {
          // Prefer registered device, otherwise use first available
          const device = devices.find((d: any) => d.terminalState === 'REGISTERED') || devices[0]
          monitorDeviceName = monitorDeviceName || device?.deviceName
          monitorDeviceType = monitorDeviceType || device?.deviceType
        }
      }
      
      if (!monitorDeviceType || !monitorDeviceName) {
        console.error('Monitor device information not available', {
          activeMonitoring,
          userAddress,
          hasDnsMap: userAddress ? !!dnsMap[userAddress] : false
        })
        return false
      }
    }
    
    const stopParams = {
      monitorDeviceType: normalizeCtiApiMonitoringDeviceType(monitorDeviceType),
      monitorDeviceName: monitorDeviceName,
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
  setShowPageLoader: (show: boolean) => void,
  activeMonitoring?: { dn: string | null; type: string | null; monitor?: string; deviceName?: string | null; monitorDeviceType?: string; monitorDeviceName?: string }
): Promise<boolean> => {
  try {
    // Use the monitor device that was used when starting monitoring
    // If not available in activeMonitoring, try to get from dnsMap
    let monitorDeviceType = activeMonitoring?.monitorDeviceType
    let monitorDeviceName = activeMonitoring?.monitorDeviceName
    
    if (!monitorDeviceType || !monitorDeviceName) {
      // Fallback: get from dnsMap for the supervisor
      if (userAddress && dnsMap[userAddress]) {
        const devices = Object.values(dnsMap[userAddress].devices || {}) as any[]
        if (devices.length > 0) {
          // Prefer registered device, otherwise use first available
          const device = devices.find((d: any) => d.terminalState === 'REGISTERED') || devices[0]
          monitorDeviceName = monitorDeviceName || device?.deviceName
          monitorDeviceType = monitorDeviceType || device?.deviceType
        }
      }
      
      if (!monitorDeviceType || !monitorDeviceName) {
        console.error('Monitor device information not available', {
          activeMonitoring,
          userAddress,
          hasDnsMap: userAddress ? !!dnsMap[userAddress] : false
        })
        return false
      }
    }
    
    const stopParams = {
      monitorDeviceType: normalizeCtiApiMonitoringDeviceType(monitorDeviceType),
      monitorDeviceName: monitorDeviceName,
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
  setShowPageLoader: (show: boolean) => void,
  monitoringSession?: MonitoringSessionSnapshot,
  getCallStatesForDn?: (dn: string) => unknown[],
): Promise<boolean> => {
  try {
    const stopParams = buildStopBargeInPayload(
      dn,
      userAddress,
      dnsMap,
      monitoringSession,
      getCallStatesForDn,
    )

    if (!stopParams) {
      console.error('Stop barge-in: could not resolve monitor/monitored devices', {
        monitoredDn: dn,
        monitoringSession,
        userAddress,
      })
      return false
    }

    console.log('[Monitoring] POST /cti/stopBargeIn', stopParams)

    setShowPageLoader(true)
    const response = await stopBargeInMonitoringAPI(stopParams).finally(() => {
      setShowPageLoader(false)
    })

    if (response.success) {
      return true
    }
    console.error('Failed to stop barge-in monitoring:', response.error)
    return false
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
  setShowPopup: React.Dispatch<React.SetStateAction<ShowPopup | null>>,
  monitoringSession?: MonitoringSessionSnapshot,
  getCallStatesForDn?: (dn: string) => unknown[],
): Promise<boolean> => {
  let success = false

  switch (type) {
    case 'SILENT':
      success = await stopSilentMonitoring(dn, userAddress, dnsMap, setShowPageLoader, monitoringSession)
      break
    case 'WHISPER':
      success = await stopWhisperMonitoring(dn, userAddress, dnsMap, setShowPageLoader, monitoringSession)
      break
    case 'BARGE_IN':
      success = await stopBargeInMonitoringLocal(
        dn,
        userAddress,
        dnsMap,
        setShowPageLoader,
        monitoringSession,
        getCallStatesForDn,
      )
      break
    default:
      console.error('Unknown monitoring type:', type)
      return false
  }

  if (success) {
    setActiveMonitoring({ dn: null, type: null, deviceName: null, monitorDeviceType: undefined, monitorDeviceName: undefined })
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
    const typeLabel = type.toLowerCase().replace('_', ' ')
    const deviceHint =
      type === 'BARGE_IN'
        ? ' Could not resolve monitor or agent device after transfer — try refreshing the wallboard.'
        : ''
    setNotification({
      type: 'danger',
      message: `Failed to stop ${typeLabel} monitoring for ${dn}.${deviceHint}`,
    })
  }

  return success
}

