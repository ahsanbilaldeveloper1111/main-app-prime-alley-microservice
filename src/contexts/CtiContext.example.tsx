/**
 * Example usage of the global CTI Context
 * 
 * The CTI Context is automatically available throughout your Next.js application
 * once you wrap your app with the CtiProvider (already done in providers.tsx).
 * 
 * You can use the useCti hook in any component to access:
 * - Call status and state information
 * - Call operations (makeCall, endCall, holdCall, etc.)
 * - Device information
 * - Real-time call events
 */

import React from 'react';
import { useCti } from './CtiContext';

// Example 1: Simple component that displays call status
export const CallStatusDisplay: React.FC = () => {
  const { isInitialized, userAddress, summaryData, hasActiveCalls } = useCti();
  
  if (!isInitialized) {
    return <div>Connecting to CTI server...</div>;
  }
  
  return (
    <div>
      <h3>CTI Status</h3>
      <p>User: {userAddress}</p>
      <p>Active Calls: {summaryData.connected}</p>
      <p>On Hold: {summaryData.on_hold}</p>
      <p>Has Active Calls: {hasActiveCalls(userAddress) ? 'Yes' : 'No'}</p>
    </div>
  );
};

// Example 2: Component that can make calls
export const QuickDialComponent: React.FC<{ number: string }> = ({ number }) => {
  const { makeCall, isInitialized, getCallingDeviceInfo } = useCti();
  const [isDialing, setIsDialing] = React.useState(false);
  
  const handleDial = async () => {
    if (!isInitialized) {
      alert('CTI not initialized');
      return;
    }
    
    setIsDialing(true);
    try {
      // Option 1: Let the context automatically get device info
      const result = await makeCall({
        calledAddress: number
      });
      
      // Option 2: Provide device info explicitly
      // const deviceInfo = getCallingDeviceInfo();
      // if (deviceInfo) {
      //   const result = await makeCall({
      //     callingAddress: deviceInfo.callingAddress,
      //     calledAddress: number,
      //     callingDeviceType: deviceInfo.callingDeviceType,
      //     callingDeviceName: deviceInfo.callingDeviceName
      //   });
      // }
      
      if (result.success) {
        console.log('Call initiated successfully');
      } else {
        console.error('Failed to make call:', result.error);
      }
    } catch (error) {
      console.error('Error making call:', error);
    } finally {
      setIsDialing(false);
    }
  };
  
  return (
    <button onClick={handleDial} disabled={isDialing || !isInitialized}>
      {isDialing ? 'Dialing...' : `Call ${number}`}
    </button>
  );
};

// Example 3: Component that displays active calls and can end them
export const ActiveCallsList: React.FC = () => {
  const { 
    callStateMap, 
    endCall, 
    userAddress, 
    getCallStatesForDn,
    getCallingDeviceInfo 
  } = useCti();
  
  const activeCalls = getCallStatesForDn(userAddress);
  
  const handleEndCall = async (callId: string, calledAddress: string) => {
    const result = await endCall({
      callId,
      calledAddress,
      // Device info will be automatically retrieved
      callingAddress: getCallingDeviceInfo()?.callingAddress || '',
      callingDeviceType: getCallingDeviceInfo()?.callingDeviceType || '',
      callingDeviceName: getCallingDeviceInfo()?.callingDeviceName || ''
    });
    
    if (result.success) {
      console.log('Call ended successfully');
    } else {
      console.error('Failed to end call:', result.error);
    }
  };
  
  return (
    <div>
      <h3>Active Calls</h3>
      {activeCalls.length === 0 ? (
        <p>No active calls</p>
      ) : (
        <ul>
          {activeCalls.map((call) => (
            <li key={call.callId}>
              <div>
                <p>Call ID: {call.callId}</p>
                <p>Status: {call.currentState}</p>
                <p>Parties: {call.parties?.length || 0}</p>
                <button onClick={() => handleEndCall(call.callId, call.parties?.[0]?.calledAddress || '')}>
                  End Call
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Example 4: Component that listens to call events
export const CallEventListener: React.FC = () => {
  const { eventLog, isInitialized } = useCti();
  
  React.useEffect(() => {
    if (isInitialized && eventLog.length > 0) {
      const latestEvent = eventLog[eventLog.length - 1];
      console.log('Latest CTI event:', latestEvent);
      
      // Handle specific event types
      if (latestEvent.eventType === 'RINGING') {
        console.log('Incoming call!');
      } else if (latestEvent.eventType === 'ANSWERED') {
        console.log('Call answered!');
      } else if (latestEvent.eventType === 'DISCONNECTED') {
        console.log('Call disconnected!');
      }
    }
  }, [eventLog, isInitialized]);
  
  return null; // This component doesn't render anything
};

// Example 5: Component that shows device information
export const DeviceInfoDisplay: React.FC = () => {
  const { 
    getAllUserDevices, 
    getCallingDeviceInfo, 
    dnsMap, 
    userAddress 
  } = useCti();
  
  const devices = getAllUserDevices();
  const deviceInfo = getCallingDeviceInfo();
  
  return (
    <div>
      <h3>Device Information</h3>
      {deviceInfo && (
        <div>
          <p>Calling Address: {deviceInfo.callingAddress}</p>
          <p>Device Type: {deviceInfo.callingDeviceType}</p>
          <p>Device Name: {deviceInfo.callingDeviceName}</p>
        </div>
      )}
      
      <h4>All User Devices</h4>
      {devices && devices.length > 0 ? (
        <ul>
          {devices.map((device, index) => (
            <li key={index}>
              {device.deviceName} ({device.deviceType}) - {device.terminalState}
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices found</p>
      )}
    </div>
  );
};

