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

export const resumeCall = async (params: EndCallParams): Promise<DialResponse> => {
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
