import axiosInstance from './axios'
import { toast } from 'react-toastify'

// CTI API Endpoints
export const CTI_ENDPOINTS = {
  DIAL_CALL: '/cti/dialCall',
  END_CALL: '/cti/endCall',
  ANSWER_CALL: '/cti/answerCall',
  HOLD_CALL: '/cti/holdCall',
  RESUME_CALL: '/cti/resumeCall',
  REMOVE_CALL: '/cti/removeCall',
  MERGE_CALL: '/cti/mergeCall',
  TRANSFER_CALL: '/cti/transferCall',
  START_MONITORING: '/cti/startMonitoring',
  STOP_MONITORING: '/cti/stopMonitoring',
  START_BARGE_IN: '/cti/startBargeIn',
  STOP_BARGE_IN: '/cti/stopBargeIn',
  GET_CALL_LEGS: '/cti/getCallLegs',
  GET_ONGOING_CALLS: '/cti/getOngoingCalls',
} as const;

// CTI Error Messages
export const CTI_ERROR_MESSAGES = {
  FAILED_TO_ESTABLISH_CALL: 'Failed to establish call.',
  FAILED_TO_END_CALL: 'Failed to end call.',
  FAILED_TO_ANSWER_CALL: 'Failed to answer call.',
  FAILED_TO_HOLD_CALL: 'Failed to hold call.',
  FAILED_TO_RESUME_CALL: 'Failed to resume call.',
  FAILED_TO_REMOVE_CALL: 'Failed to remove call.',
  FAILED_TO_MERGE_CALLS: 'Failed to merge calls.',
  FAILED_TO_TRANSFER_CALL: 'Failed to transfer call.',
  FAILED_TO_START_MONITORING: 'Failed to start monitoring.',
  FAILED_TO_STOP_MONITORING: 'Failed to stop monitoring.',
  FAILED_TO_START_BARGE_IN: 'Failed to start barge-in monitoring.',
  FAILED_TO_STOP_BARGE_IN: 'Failed to stop barge-in monitoring.',
  NETWORK_ERROR_DIAL: 'Network error occurred while making call',
  NETWORK_ERROR_END: 'Network error occurred while ending call',
  NETWORK_ERROR_ATTEND: 'Network error occurred while attending call',
  NETWORK_ERROR_HOLD: 'Network error occurred while holding call',
  NETWORK_ERROR_RESUME: 'Network error occurred while resuming call',
  NETWORK_ERROR_REMOVE: 'Network error occurred while removing call',
  NETWORK_ERROR_MERGE: 'Network error occurred while merging calls',
  NETWORK_ERROR_TRANSFER: 'Network error occurred while transferring call',
  NETWORK_ERROR_START_MONITORING: 'Network error occurred while starting monitoring',
  NETWORK_ERROR_STOP_MONITORING: 'Network error occurred while stopping monitoring',
  NETWORK_ERROR_START_BARGE_IN: 'Network error occurred while starting barge-in monitoring',
  NETWORK_ERROR_STOP_BARGE_IN: 'Network error occurred while stopping barge-in monitoring',
  NETWORK_ERROR_GET_CALL_LEGS: 'Network error occurred while getting call legs',
  NETWORK_ERROR_GET_ONGOING_CALLS: 'Network error occurred while getting ongoing calls',
} as const;

// Mapping of endpoints to error messages
const ENDPOINT_ERROR_MAP: Record<string, string> = {
  [CTI_ENDPOINTS.DIAL_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_ESTABLISH_CALL,
  [CTI_ENDPOINTS.END_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_END_CALL,
  [CTI_ENDPOINTS.ANSWER_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_ANSWER_CALL,
  [CTI_ENDPOINTS.HOLD_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_HOLD_CALL,
  [CTI_ENDPOINTS.RESUME_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_RESUME_CALL,
  [CTI_ENDPOINTS.REMOVE_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_REMOVE_CALL,
  [CTI_ENDPOINTS.MERGE_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_MERGE_CALLS,
  [CTI_ENDPOINTS.TRANSFER_CALL]: CTI_ERROR_MESSAGES.FAILED_TO_TRANSFER_CALL,
  [CTI_ENDPOINTS.START_MONITORING]: CTI_ERROR_MESSAGES.FAILED_TO_START_MONITORING,
  [CTI_ENDPOINTS.STOP_MONITORING]: CTI_ERROR_MESSAGES.FAILED_TO_STOP_MONITORING,
  [CTI_ENDPOINTS.START_BARGE_IN]: CTI_ERROR_MESSAGES.FAILED_TO_START_BARGE_IN,
  [CTI_ENDPOINTS.STOP_BARGE_IN]: CTI_ERROR_MESSAGES.FAILED_TO_STOP_BARGE_IN,
};

/**
 * Shows error toast message for the given endpoint
 * @param endpoint - The CTI endpoint that failed
 */
const showEndpointError = (endpoint: string): void => {
  const errorMessage = ENDPOINT_ERROR_MAP[endpoint];
  if (errorMessage) {
    toast.error(errorMessage);
  }
};

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


export const validateResponse = (response: any, $endPoint: string = '') => {
  const responseData = response?.data;
  //console.log(responseData, "responseData cti");
  if(responseData?.status === 'success'){
    
    return {
      success: true,
      data: responseData,
      message: responseData?.responseData?.message
    }
  }else{
    showEndpointError($endPoint);
   // toast.error(responseData?.responseData?.message);
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
    const response = await axiosInstance.post(CTI_ENDPOINTS.DIAL_CALL, params);
    
    return validateResponse(response, CTI_ENDPOINTS.DIAL_CALL);

  } catch (error) {
    console.error('Error calling dial API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_DIAL
    }
  }
}

export const endCall = async (params: EndCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.END_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.END_CALL);

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
    const response = await axiosInstance.post(CTI_ENDPOINTS.ANSWER_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.ANSWER_CALL);

  } catch (error) {
    console.error('Error calling attend-call API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_ATTEND
    }
  }
}

export const holdCall = async (params: EndCallParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.HOLD_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.HOLD_CALL);
    
  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_HOLD
    }
  }
}

export const resumeCall = async (params: any): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.RESUME_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.RESUME_CALL);

  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_RESUME
    }
  }
}

export const RemoveCall = async (params: any): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.REMOVE_CALL, params);
    return validateResponse(response, CTI_ENDPOINTS.REMOVE_CALL);
  } catch (error) {
    console.error('Error calling remove-call API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_REMOVE
    }
  }
}

export const mergeCalls = async (params: MergeCallsParams): Promise<DialResponse> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.MERGE_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.MERGE_CALL);
    
  } catch (error) {
    console.error('Error calling merge-calls API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_MERGE
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
    const response = await axiosInstance.post(CTI_ENDPOINTS.TRANSFER_CALL, params);

    return validateResponse(response, CTI_ENDPOINTS.TRANSFER_CALL);
  } catch (error) {
    
    console.error('Error calling transfer-call API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_TRANSFER
    }
  }
}

export const startMonitoring = async (params: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.START_MONITORING, params);

    return validateResponse(response, CTI_ENDPOINTS.START_MONITORING);
  } catch (error) {
    console.error('Error calling start-monitoring API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_START_MONITORING
    }
  }
}

export const stopMonitoring = async (params: StopMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.STOP_MONITORING, params);
    return validateResponse(response, CTI_ENDPOINTS.STOP_MONITORING);
  } catch (error) {
    console.error('Error calling stop-monitoring API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_STOP_MONITORING
    }
  }
}

export const startBargeInMonitoring = async (params: StartBargeInMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.START_BARGE_IN, params);
    return validateResponse(response, CTI_ENDPOINTS.START_BARGE_IN);
  } catch (error) {
    console.error('Error calling start-barge-in-monitoring API:', error)
    console.error('Error calling start-barge-in-monitoring API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_START_BARGE_IN
    }
  }
}

export const stopBargeInMonitoring = async (params: StopBargeInMonitoringParams): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.STOP_BARGE_IN, params);
    return validateResponse(response, CTI_ENDPOINTS.STOP_BARGE_IN);
  } catch (error) {
    console.error('Error calling stop-barge-in-monitoring API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_STOP_BARGE_IN
    }
  }
}


export const GetCallLegs = async (params: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.GET_CALL_LEGS, params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling get-call-legs API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_GET_CALL_LEGS
    }
  }
}

export const GetOngoingCall = async (params: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(CTI_ENDPOINTS.GET_ONGOING_CALLS, params);
    return validateResponse(response);
  } catch (error) {
    console.error('Error calling get-call-legs API:', error)
    return {
      success: false,
      error: CTI_ERROR_MESSAGES.NETWORK_ERROR_GET_ONGOING_CALLS
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