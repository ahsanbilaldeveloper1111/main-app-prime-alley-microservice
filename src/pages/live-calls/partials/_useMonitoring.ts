import { useState } from 'react'
import { ShowPopup, PendingMonitoringData, AvailableDevice, CtiDevice } from './_types'
import { 
  getUserDevices, 
  hasMultipleDevices, 
  executeMonitoring as executeMonitoringHelper,
  stopMonitoring as stopMonitoringHelper
} from './_monitoringHelpers'

/**
 * Custom hook for monitoring functionality
 */
export const useMonitoring = (
  userAddress: string | null,
  dnsMap: Record<string, any>,
  setShowPageLoader: (show: boolean) => void,
  setActiveMonitoring: React.Dispatch<React.SetStateAction<any>>,
  setMonitoringStartTime: React.Dispatch<React.SetStateAction<Record<string, Date>>>,
  setNotification: React.Dispatch<React.SetStateAction<{ type: string; message: string } | null>>,
  setSelectedMonitor: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setSelectedTone: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setTempMonitorSelection: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setShowPopup: React.Dispatch<React.SetStateAction<ShowPopup | null>>
) => {
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([])
  const [pendingMonitoringData, setPendingMonitoringData] = useState<PendingMonitoringData | null>(null)

  const startMonitoringLocal = async (
    dn: string,
    monitorType: string,
    toneType: string | undefined,
    showPopup: ShowPopup | null
  ): Promise<boolean> => {
    const finalToneType = toneType || 'NONE'

    const monitoredDevice = dnsMap[dn]?.devices?.[showPopup?.deviceName || '']
    if (!monitoredDevice) {
      console.error('Monitored device not found')
      setNotification({ type: 'danger', message: 'Monitored device not found' })
      return false
    }

    if (hasMultipleDevices(userAddress, dnsMap)) {
      setAvailableDevices(getUserDevices(userAddress, dnsMap))
      setPendingMonitoringData({
        dn,
        monitorType,
        toneType: finalToneType,
        monitoredDeviceName: monitoredDevice.deviceName,
        monitoredDeviceType: monitoredDevice.deviceType
      })
      setShowDeviceSelectionModal(true)
      return false
    } else {
      const userDevices = getUserDevices(userAddress, dnsMap)
      if (userDevices.length === 0) {
        console.error('No user devices available')
        setNotification({ type: 'danger', message: 'No user devices available for monitoring' })
        return false
      }
      
      const monitorDevice = userDevices[0]
      return await executeMonitoringHelper(
        dn,
        monitorType,
        finalToneType,
        monitorDevice,
        monitoredDevice,
        userAddress,
        showPopup,
        setShowPageLoader,
        setActiveMonitoring,
        setMonitoringStartTime,
        setNotification
      )
    }
  }

  const stopMonitoring = async (dn: string, type: string): Promise<boolean> => {
    return await stopMonitoringHelper(
      dn,
      type,
      userAddress,
      dnsMap,
      setShowPageLoader,
      setActiveMonitoring,
      setMonitoringStartTime,
      setSelectedMonitor,
      setSelectedTone,
      setTempMonitorSelection,
      setNotification,
      setShowPopup
    )
  }

  return {
    showDeviceSelectionModal,
    setShowDeviceSelectionModal,
    availableDevices,
    setAvailableDevices,
    pendingMonitoringData,
    setPendingMonitoringData,
    startMonitoringLocal,
    stopMonitoring
  }
}

