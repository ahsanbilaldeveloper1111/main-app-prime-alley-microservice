# Global CTI Context Provider

## Overview

The Global CTI Context Provider provides a centralized way to access CTI (Computer Telephony Integration) functionality throughout your Next.js application. It wraps the `useCtiStomp` hook and provides a unified interface for:

- Making and managing calls
- Accessing real-time call status
- Getting device information
- Listening to call events

## Architecture

The CTI Context Provider:
1. **Uses a single global socket connection** - All pages share the same CTI connection instance (`global-cti-instance`)
2. **Automatically manages device information** - Call operations automatically retrieve device info if not provided
3. **Provides real-time updates** - All components using the context receive live updates about call states

## Setup

The CTI Provider is already integrated into your application via `src/components/providers.tsx`. It wraps your entire app, so no additional setup is required.

## Usage

### Basic Example

```tsx
import { useCti } from '@/contexts/CtiContext';
// or
import { useCti } from '@/hooks/useCti';

function MyComponent() {
  const { 
    isInitialized, 
    userAddress, 
    summaryData,
    makeCall,
    endCall 
  } = useCti();
  
  // Use the CTI functionality
}
```

### Making a Call

```tsx
const { makeCall, isInitialized } = useCti();

const handleDial = async () => {
  if (!isInitialized) {
    console.error('CTI not initialized');
    return;
  }
  
  // Option 1: Let the context automatically get device info
  const result = await makeCall({
    calledAddress: '1234' // Extension number
  });
  
  if (result.success) {
    console.log('Call initiated');
  }
};
```

### Ending a Call

```tsx
const { endCall, getCallStatesForDn, userAddress } = useCti();

const handleEndCall = async (callId: string) => {
  // Get the call to find the called address
  const calls = getCallStatesForDn(userAddress);
  const call = calls.find(c => c.callId === callId);
  
  if (call) {
    const result = await endCall({
      callId: call.callId,
      calledAddress: call.parties?.[0]?.calledAddress || ''
    });
  }
};
```

### Checking Call Status

```tsx
const { 
  hasActiveCalls, 
  getDnCallState, 
  getCallStatesForDn,
  userAddress 
} = useCti();

// Check if user has any active calls
const hasCalls = hasActiveCalls(userAddress);

// Get the most recent call state for a DN
const callState = getDnCallState(userAddress);

// Get all active calls for a DN
const allCalls = getCallStatesForDn(userAddress);
```

### Listening to Call Events

```tsx
const { eventLog, isInitialized } = useCti();

useEffect(() => {
  if (isInitialized && eventLog.length > 0) {
    const latestEvent = eventLog[eventLog.length - 1];
    
    switch (latestEvent.eventType) {
      case 'RINGING':
        console.log('Incoming call!');
        break;
      case 'ANSWERED':
        console.log('Call answered!');
        break;
      case 'DISCONNECTED':
        console.log('Call disconnected!');
        break;
    }
  }
}, [eventLog, isInitialized]);
```

## API Reference

### Connection State

- `isInitialized: boolean` - Whether the CTI connection is established
- `error: string | null` - Any connection errors
- `userAddress: string` - The current user's extension number

### Data

- `dnsMap: Record<string, {...}>` - Map of all extensions and their devices
- `callStateMap: Record<string, {...}>` - Map of all active calls
- `eventLog: any[]` - Array of recent CTI events
- `summaryData: {...}` - Summary statistics (extensions, online, offline, connected, etc.)

### Helper Functions

- `getDevicesForDn(dn: string): any[]` - Get all devices for an extension
- `getCallStatesForDn(dn: string): any[]` - Get all active calls for an extension
- `hasActiveCalls(dn: string): boolean` - Check if an extension has active calls
- `getDnCallState(dn: string): any` - Get the most recent call state for an extension
- `getCallStateForDevice(dn: string, deviceName: string): any` - Get call state for a specific device
- `getAllCallIds(): string[]` - Get all active call IDs
- `getActiveCallIdsFromLocalStorage(): string[]` - Get active call IDs from localStorage

### Call Operations

All call operations automatically retrieve device information if not provided:

- `makeCall(params): Promise<any>` - Make a call
  - `params.calledAddress: string` (required)
  - `params.callingAddress?: string` (optional, auto-retrieved)
  - `params.callingDeviceType?: string` (optional, auto-retrieved)
  - `params.callingDeviceName?: string` (optional, auto-retrieved)

- `endCall(params): Promise<any>` - End a call
  - `params.callId: string` (required)
  - `params.calledAddress: string` (required)
  - Other params optional (auto-retrieved)

- `holdCall(params): Promise<any>` - Put a call on hold
- `resumeCall(params): Promise<any>` - Resume a held call
- `attendCall(params): Promise<any>` - Answer an incoming call
- `mergeCalls(params): Promise<any>` - Merge two calls into a conference
- `transferCall(params): Promise<any>` - Transfer a call to another extension

### Device Helpers

- `getCallingDeviceInfo(): {...} | null` - Get the current user's calling device info
- `getAllUserDevices(): any[] | null` - Get all devices for the current user

## Important Notes

1. **Single Global Connection**: The context uses a single global socket connection (`global-cti-instance`). This means:
   - All pages share the same connection
   - Call states are synchronized across all components
   - No duplicate connections are created

2. **Automatic Device Info**: Most call operations will automatically retrieve device information if not provided. This simplifies usage but you can still provide explicit device info if needed.

3. **Real-time Updates**: All components using `useCti()` will automatically receive updates when call states change.

4. **Existing Pages**: The existing Live View and Dialer pages continue to work as before - they use their own `useCtiStomp` instances with specific screen IDs (`liveView` and `dialer`). The global context is separate and doesn't interfere with them.

## Examples

See `src/contexts/CtiContext.example.tsx` for complete usage examples.

