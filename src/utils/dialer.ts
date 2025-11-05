import axiosInstance from './axios'
import { toast } from 'react-toastify'

interface DialParams {
  callingAddress: string
  calledAddress: string
  callingDeviceType: string
  callingDeviceName: string
}

interface EndCallParams {
  callId: string
  callingAddress: string
  calledAddress: string
  callingDeviceType: string
  callingDeviceName: string
}

interface AttendCallParams {
  callId: string
  callingAddress: string
  calledAddress: string
  controllerAddress: string
  controllerDeviceName: string
  controllerDeviceType: string
}

interface MergeCallsParams {
  heldCallId: string
  activeCallId: string
  callingAddress: string
  callingDeviceType: string
  callingDeviceName: string
}

interface DialResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
  responseData?: any
}

interface MonitoringParams {
  monitorDeviceType: string
  monitorDeviceName: string
  monitoredDeviceType: string
  monitoredDeviceName: string
  monitoredDeviceDn: string
  type: string
  tone: string
  monitor: string
}

interface StopMonitoringParams {
  monitorDeviceType: string
  monitorDeviceName: string
  monitor: string
}

interface StartBargeInMonitoringParams {
  monitorDeviceType: string
  monitorDeviceName: string
  monitoredDeviceType: string
  monitoredDeviceName: string
  type: string
  tone: string
  monitor: string
}

interface StopBargeInMonitoringParams {
  monitorDeviceType: string
  monitorDeviceName: string
  monitor: string
}


export const validateResponse = (response: any) => {
  const responseData = response?.data;
  console.log(responseData, "responseData cti");
  if(responseData?.status === 'success'){
    console.log(responseData, "yes cti");
    return {
      success: true,
      data: responseData,
      message: responseData?.responseData?.message
    }
  }else{
    toast.error(responseData?.responseData?.message);
    return {
      success: false,
      error: responseData?.responseData?.message,
      data: responseData
    }
  }
}

/**
 * Make a call using the CTI dial API
 * @param params - The dialing parameters
 * @returns Promise with the dial response
 */
export const makeCall = async (params: DialParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/dialCall', params);
    
    return validateResponse(response);

  } catch (error) {
    console.error('Error calling dial API:', error)
    return {
      success: false,
      error: 'Network error occurred while making call'
    }
  }
}

export const endCall = async (params: EndCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/endCall', params);

    return validateResponse(response);

  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while ending call'
    }
  }
}

export const attendCall = async (params: AttendCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/answerCall', params);

    return validateResponse(response);

  } catch (error) {
    console.error('Error calling attend-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while attending call'
    }
  }
}

export const holdCall = async (params: EndCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/holdCall', params);

    return validateResponse(response);
    
  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while ending call'
    }
  }
}

export const resumeCall = async (params: any): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/resumeCall', params);

    return validateResponse(response);

  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while ending call'
    }
  }
}

export const RemoveCall = async (params: any): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/removeCall', params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling remove-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while removing call'
    }
  }
}

export const mergeCalls = async (params: MergeCallsParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/mergeCall', params);

    return validateResponse(response);
    
  } catch (error) {
    console.error('Error calling merge-calls API:', error)
    return {
      success: false,
      error: 'Network error occurred while merging calls'
    }
  }
}

interface TransferCallParams {
  callId: string
  transferInitiatorAddress: string
  transferInitiatorDeviceType: string
  transferInitiatorDeviceName: string
  transferAddress: string
  targetAddress: string
  mode: string
}

export const transferCalls = async (params: TransferCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post('/cti/transferCall', params);

    return validateResponse(response);
  } catch (error) {
    
    console.error('Error calling transfer-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while transferring call'
    }
  }
}

export const startMonitoring = async (params: any): Promise<any> => {
  try {
    const response = await axiosInstance.post('/cti/startMonitoring', params);

    return validateResponse(response);
  } catch (error) {
    console.error('Error calling start-monitoring API:', error)
    return {
      success: false,
      error: 'Network error occurred while starting monitoring'
    }
  }
}

export const stopMonitoring = async (params: StopMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post('/cti/stopMonitoring', params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling stop-monitoring API:', error)
    return {
      success: false,
      error: 'Network error occurred while stopping monitoring'
    }
  }
}

export const startBargeInMonitoring = async (params: StartBargeInMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post('/cti/startBargeIn', params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling start-barge-in-monitoring API:', error)
    console.error('Error calling start-barge-in-monitoring API:', error)
    return {
      success: false,
      error: 'Network error occurred while starting barge-in monitoring'
    }
  }
}

export const stopBargeInMonitoring = async (params: StopBargeInMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post('/cti/stopBargeIn', params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling stop-barge-in-monitoring API:', error)
    return {
      success: false,
      error: 'Network error occurred while stopping barge-in monitoring'
    }
  }
}


export const GetCallLegs = async (params: any): Promise<any> => {
  try {
    const response = await axiosInstance.post('/cti/getCallLegs', params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling get-call-legs API:', error)
    return {
      success: false,
      error: 'Network error occurred while getting call legs'
    }
  }
}

/**
 * Get calling device information from CTI data
 * @param userAddress - The user's extension number
 * @param dnsMap - The CTI devices map
 * @returns Device information or null if not available
 */
export const getCallingDeviceInfo = (
  userAddress: string, 
  dnsMap: Record<string, { dn: string; devices: Record<string, any> }>
) => {
  if (!userAddress || !dnsMap[userAddress]) {
    return null
  }

  const userDevices = Object.values(dnsMap[userAddress].devices || {})
  if (userDevices.length === 0) {
    return null
  }

  // Get the first available device (you can modify this logic based on your needs)
  const device = userDevices[0]
  return {
    callingAddress: userAddress,
    callingDeviceType: device.deviceType || "SOFT_HARD",
    callingDeviceName: device.deviceName || "WebCTI"
  }
}

/**
 * Get all available devices for a user extension
 * @param userAddress - The user's extension number
 * @param dnsMap - The CTI devices map
 * @returns Array of devices or null if not available
 */
export const getAllUserDevices = (
  userAddress: string, 
  dnsMap: Record<string, { dn: string; devices: Record<string, any> }>
) => {
  if (!userAddress || !dnsMap[userAddress]) {
    return null
  }

  const userDevices = Object.values(dnsMap[userAddress].devices || {})
  if (userDevices.length === 0) {
    return null
  }

  return userDevices.map(device => ({
    deviceName: device.deviceName || "Unknown",
    deviceType: device.deviceType || "UNKNOWN",
    terminalState: device.terminalState || "UNKNOWN",
    when: device.when || new Date().toISOString(),
    details: device.details || "No details available"
  }))
}