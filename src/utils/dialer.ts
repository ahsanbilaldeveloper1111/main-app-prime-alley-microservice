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
}

/**
 * Make a call using the CTI dial API
 * @param params - The dialing parameters
 * @returns Promise with the dial response
 */
export const makeCall = async (params: DialParams): Promise<DialResponse> => {
  try {
    const response = await fetch('/api/cti/dialCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Call initiated successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to initiate call',
        data: errorData
      }
    }
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
    const response = await fetch('/api/cti/endCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Call ended successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to end call',
        data: errorData
      }
    }
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
    const response = await fetch('/api/cti/holdCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Call held successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to end call',
        data: errorData
      }
    }
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
    const response = await fetch('/api/cti/resumeCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Call resumed successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to end call',
        data: errorData
      }
    }
  } catch (error) {
    console.error('Error calling end-call API:', error)
    return {
      success: false,
      error: 'Network error occurred while ending call'
    }
  }
}

export const mergeCalls = async (params: MergeCallsParams): Promise<DialResponse> => {
  try {
    const response = await fetch('/api/cti/mergeCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Calls merged successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to merge calls',
        data: errorData
      }
    }
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
    const response = await fetch('/api/cti/transferCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        data: result,
        message: 'Call transferred successfully'
      }
    } else {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.message || 'Failed to transfer call',
        data: errorData
      }
    }
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
