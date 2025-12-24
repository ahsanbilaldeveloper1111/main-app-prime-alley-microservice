import React from 'react'
import { ShowPopup, PendingMonitoringData, CtiDevice } from './_types'
import { executeMonitoring } from './_monitoringHelpers'

/**
 * Handle monitor type selection
 */
export const handleMonitorSelect = (
  dn: string,
  monitorType: string,
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  setSelectedMonitor((prev) => ({ ...prev, [dn]: monitorType }))
  setTempMonitorSelection((prev) => ({ ...prev, [dn]: monitorType }))
  setSelectedTone((prev) => ({ ...prev, [dn]: 'NONE' }))
}

/**
 * Handle tone selection
 */
export const handleToneSelect = (
  dn: string,
  toneType: string,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  setSelectedTone((prev) => ({ ...prev, [dn]: toneType }))
}

/**
 * Handle barge-in selection
 */
export const handleBargeInSelect = (
  dn: string,
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  setSelectedMonitor((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))
  setTempMonitorSelection((prev) => ({ ...prev, [dn]: 'BARGE_IN' }))
  setSelectedTone((prev) => ({ ...prev, [dn]: 'NONE' }))
}

/**
 * Reset monitor selection
 */
export const resetMonitorSelection = (
  showPopup: ShowPopup | null,
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  if (showPopup?.dn) {
    setSelectedMonitor((prev) => ({ ...prev, [showPopup.dn]: '' }))
    setTempMonitorSelection((prev) => ({ ...prev, [showPopup.dn]: '' }))
    setSelectedTone((prev) => ({ ...prev, [showPopup.dn]: 'NONE' }))
  }
}

/**
 * Handle device selection for monitoring
 */
export const handleDeviceSelect = (
  device: any,
  pendingMonitoringData: PendingMonitoringData | null,
  dnsMap: Record<string, any>,
  userAddress: string | null,
  showPopup: ShowPopup | null,
  setShowPageLoader: (show: boolean) => void,
  setActiveMonitoring: React.Dispatch<React.SetStateAction<any>>,
  setMonitoringStartTime: React.Dispatch<React.SetStateAction<Record<string, Date>>>,
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>,
  setShowDeviceSelectionModal: (show: boolean) => void,
  setAvailableDevices: (devices: any[]) => void,
  setPendingMonitoringData: (data: PendingMonitoringData | null) => void
) => {
  console.log('Device selected for monitoring:', device)
  
  if (!pendingMonitoringData) {
    console.error('No pending monitoring data found')
    setNotification({ type: 'danger', message: 'No pending monitoring data found' })
    return
  }

  const monitoredDevice = dnsMap[pendingMonitoringData.dn]?.devices?.[pendingMonitoringData.monitoredDeviceName]
  if (!monitoredDevice) {
    console.error('Monitored device not found')
    setNotification({ type: 'danger', message: 'Monitored device not found' })
    return
  }

  executeMonitoring(
    pendingMonitoringData.dn,
    pendingMonitoringData.monitorType,
    pendingMonitoringData.toneType,
    device,
    monitoredDevice,
    userAddress,
    showPopup,
    setShowPageLoader,
    setActiveMonitoring,
    setMonitoringStartTime,
    setNotification
  )

  setShowDeviceSelectionModal(false)
  setAvailableDevices([])
  setPendingMonitoringData(null)
}

/**
 * Handle device selection cancel
 */
export const handleDeviceSelectionCancel = (
  setShowDeviceSelectionModal: (show: boolean) => void,
  setAvailableDevices: (devices: any[]) => void,
  setPendingMonitoringData: (data: PendingMonitoringData | null) => void
) => {
  setShowDeviceSelectionModal(false)
  setAvailableDevices([])
  setPendingMonitoringData(null)
}

