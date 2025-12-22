# CTI System Flow Explanation

## Overview
The CTI (Computer Telephony Integration) system is designed to provide a **single, global connection** that is established once when the app loads, and then all pages can use its functions and data throughout the application.

## Architecture Flow

### 1. **Connection Establishment (On App Load)**

**Location:** `src/components/providers.tsx` → `src/contexts/CtiContext.tsx`

```
App Start
  ↓
Providers Component loads
  ↓
CtiProvider wraps entire app
  ↓
useCtiStomp('/ws', 'global-cti-instance', 'global') is called
  ↓
Single WebSocket/SSE connection established
  ↓
Connection persists for entire app lifecycle
```

**Key Points:**
- Connection is established **once** when `CtiProvider` mounts
- Uses `'global-cti-instance'` as instance ID (shared across all components)
- Connection is **NOT** recreated when components mount/unmount
- All components share the **same connection**

### 2. **Global Context Provider**

**File:** `src/contexts/CtiContext.tsx`

The `CtiProvider` component:
- Wraps the entire app (in `providers.tsx`)
- Maintains a single `useCtiStomp` hook instance
- Processes CTI events and maintains `activeCalls` state
- Exposes functions and data via React Context

**What it provides:**
```typescript
{
  // Connection state
  isInitialized: boolean
  userAddress: string
  error: string | null
  
  // Data
  dnsMap: Record<string, {...}>  // All extensions/devices
  callStateMap: Record<string, {...}>  // Call states
  activeCalls: Map<string, {...}>  // Active calls (for UI)
  
  // Main call function - USE THIS!
  dialNumber: (phoneNumber: string) => Promise<{success: boolean, error?: string}>
  
  // Other call operations
  makeCall: (params) => Promise<any>
  endCall: (params) => Promise<any>
  holdCall: (params) => Promise<any>
  resumeCall: (params) => Promise<any>
  // ... etc
}
```

### 3. **Call Function - `dialNumber`**

**Location:** `src/contexts/CtiContext.tsx` (line ~541)

**This is the main function to trigger calls from anywhere in the app:**

```typescript
const dialNumber = async (phoneNumber: string) => {
  // 1. Clean phone number (remove spaces, dashes, brackets)
  const cleanedNumber = phoneNumber
    .replace(/\s+/g, '')      // Remove spaces
    .replace(/-/g, '')        // Remove dashes
    .replace(/[()]/g, '')     // Remove brackets
    // ... etc
  
  // 2. Check if number can be dialed (not already in call)
  const dialCheck = canDialNumber(cleanedNumber);
  if (!dialCheck.canDial) {
    return { success: false, error: dialCheck.reason };
  }
  
  // 3. Get device info automatically
  const deviceInfo = getCallingDeviceInfo(...);
  
  // 4. Make the API call
  return await makeCallAPI({
    callingAddress: deviceInfo.callingAddress,
    calledAddress: cleanedNumber,
    callingDeviceType: deviceInfo.callingDeviceType,
    callingDeviceName: deviceInfo.callingDeviceName
  });
}
```

**Usage Example:**
```typescript
import { useCti } from '../contexts/CtiContext';

const MyComponent = () => {
  const { dialNumber, isInitialized } = useCti();
  
  const handleCall = async () => {
    const result = await dialNumber('123-456-7890');
    if (result.success) {
      // Call started!
    }
  };
};
```

### 4. **Event Processing & Active Calls Tracking**

**Location:** `src/contexts/CtiContext.tsx` (line ~164)

When CTI events are received:
1. Events come through the WebSocket/SSE connection
2. `useCtiStomp` hook receives events and adds them to `eventLog`
3. `CtiProvider` watches `eventLog` and processes new events
4. Updates `activeCalls` Map based on event type:
   - `DIALING` → Creates call with status 'dialing'
   - `RINGING` → Updates to status 'ringing'
   - `CONNECTED`/`ANSWERED` → Updates to status 'connected'
   - `ENDED`/`DISCONNECTED` → Removes from activeCalls

**Active Calls State:**
```typescript
activeCalls: Map<string, {
  id: string
  number: string
  status: 'dialing' | 'ringing' | 'connected' | 'onHold' | 'ended'
  startTime: Date
  callId?: string
  callingAddress?: string
  calledAddress?: string
  duration?: number
}>
```

### 5. **Global Floating Call Bar**

**Location:** `src/components/GlobalFloatingCallBar.tsx`

**Rendered in:** `src/pages/_app.tsx` (line 55)

**What it does:**
- Shows on **every page** (except `/cti/dialer` and `/cti/live-calls`)
- Displays active call information (number, duration)
- Provides dial button to start new calls
- Provides end call button for active calls
- Uses `useCti()` hook to access:
  - `activeCalls` - to show current call
  - `dialNumber` - to make calls
  - `endCall` - to end calls
  - `formatDuration` - to show call duration

**Flow when call button clicked in CRM page:**
```
User clicks call button in CRM data page
  ↓
handleCallClick() calls dialNumber(phone)
  ↓
dialNumber() makes API call via makeCallAPI()
  ↓
CTI server processes call
  ↓
CTI events flow back through WebSocket
  ↓
CtiProvider processes events
  ↓
activeCalls state updates
  ↓
GlobalFloatingCallBar re-renders (uses activeCalls)
  ↓
Bottom bar shows call has started! ✅
```

## Complete Flow Example: Calling from CRM Page

### Step 1: User clicks call button
**File:** `src/pages/crm/data/index.tsx` (line ~1600)

```typescript
const handleCallClick = async (item: CrmDataItem) => {
  const phone = item.phone;
  
  // Get dialNumber function from global context
  const { dialNumber, isInitialized } = useCti();
  
  if (!isInitialized) {
    toast.error("CTI not initialized");
    return;
  }
  
  // Call the function - just pass phone number!
  const result = await dialNumber(phone);
  
  if (result.success) {
    toast.success(`Calling ${item.name}...`);
  }
};
```

### Step 2: dialNumber processes the call
**File:** `src/contexts/CtiContext.tsx`

1. Cleans phone number: `"123-456-7890"` → `"1234567890"`
2. Checks if number can be dialed
3. Gets device info automatically
4. Calls `makeCallAPI()` with device info

### Step 3: API call made
**File:** `src/utils/dialer.ts`

The `makeCallAPI` function sends POST request to `/api/cti/make-call`

### Step 4: CTI events received
**File:** `src/hooks/useCtiStomp.ts`

- WebSocket/SSE connection receives events
- Events added to `eventLog`
- Events broadcasted to all tabs (if cross-tab enabled)

### Step 5: Active calls updated
**File:** `src/contexts/CtiContext.tsx` (line ~164)

- `useEffect` watches `eventLog`
- Processes `DIALING`, `RINGING`, `CONNECTED` events
- Updates `activeCalls` Map

### Step 6: UI updates
**File:** `src/components/GlobalFloatingCallBar.tsx`

- Component uses `useCti()` to get `activeCalls`
- Re-renders when `activeCalls` changes
- Shows call number, duration, end call button

## Key Files Summary

| File | Purpose |
|------|---------|
| `src/components/providers.tsx` | Wraps app with `CtiProvider` |
| `src/contexts/CtiContext.tsx` | **Main context** - provides `dialNumber` and all CTI functions |
| `src/hooks/useCtiStomp.ts` | Manages WebSocket/SSE connection (single instance) |
| `src/components/GlobalFloatingCallBar.tsx` | Bottom bar that shows on all pages |
| `src/pages/_app.tsx` | Renders `GlobalFloatingCallBar` globally |
| `src/pages/crm/data/index.tsx` | Example: Uses `dialNumber` to make calls |

## How to Use in Any Page

```typescript
import { useCti } from '../contexts/CtiContext';

const MyPage = () => {
  const { 
    dialNumber,      // Main function to call
    activeCalls,     // Current active calls
    isInitialized,  // Connection status
    endCall,         // End a call
    formatDuration   // Format call duration
  } = useCti();
  
  const handleCall = async (phoneNumber: string) => {
    if (!isInitialized) {
      toast.error("CTI not ready");
      return;
    }
    
    const result = await dialNumber(phoneNumber);
    if (result.success) {
      // Call started! The floating bar will automatically show it
    }
  };
  
  return (
    <button onClick={() => handleCall('123-456-7890')}>
      Call
    </button>
  );
};
```

## Important Notes

1. **Single Connection:** Only ONE connection exists for the entire app (established in `CtiProvider`)
2. **Shared State:** All components share the same `activeCalls` state
3. **Automatic Updates:** When you call `dialNumber()`, the floating bar automatically updates
4. **No Manual State Management:** You don't need to manage call state - it's handled automatically
5. **Cross-Tab Support:** Connection is shared across browser tabs (master tab maintains connection)

## Current Status

✅ Connection established once on app load  
✅ Functions available everywhere via `useCti()` hook  
✅ `dialNumber(phoneNumber)` function works  
✅ Global floating bar shows on all pages  
✅ CRM data page uses `dialNumber`  
✅ Floating bar automatically shows active calls  

**Everything is working as designed!** 🎉

