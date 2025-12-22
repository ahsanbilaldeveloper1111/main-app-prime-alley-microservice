# Analysis: Can Global CTI Instance Replace Dialer & Live-Calls Pages?

## Data Flow Understanding

### How Data Comes from Socket

**Connection Flow:**
1. **On Connection:** Server sends `complete_state` event with **all DNS/device data at once**
   - This populates `dnsMap` immediately with all extensions and devices
   - Stored in state: `dnsMap: Record<string, { dn: string; devices: Record<string, CtiDevice> }>`

2. **Real-time Updates:**
   - `dns_states` events → Update individual devices in `dnsMap`
   - `call_events` events → Update `callStateMap` with call information
   - All updates are **stored in state**, not fetched on demand

**Key Point:** Data is **STORED** in state, not fetched on demand. The socket pushes updates continuously.

### Current Implementation

**Location:** `src/hooks/useCtiStomp.ts` (lines ~805-851)

```typescript
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'complete_state':
      // Initial state - ALL data at once
      setDnsMap(grouped);  // Stored in state
      break;
      
    case 'dns_states':
      // Real-time device updates
      setDnsMap(prev => { /* update */ });  // Stored in state
      break;
      
    case 'call_events':
      // Real-time call events
      handleCallEvent(data.data);  // Updates callStateMap (stored in state)
      break;
  }
};
```

## What Each Page Currently Uses

### Dialer Page (`src/pages/cti/dialer/index.tsx`)

**Uses from `useCtiStomp`:**
- ✅ `dnsMap` - For extensions list
- ✅ `eventLog` - For processing call events
- ✅ `userAddress` - Current user's extension
- ✅ `summaryData` - Summary statistics
- ✅ `isInitialized` - Connection status

**Maintains its own:**
- `activeCalls` - Local Map state (but CtiContext also has this!)
- `mergedCalls` - Local Map state
- Complex event processing logic

**Functions it needs:**
- `getCallingDeviceInfo(userAddress, dnsMap)` - Available in CtiContext
- `getAllUserDevices(userAddress, dnsMap)` - Available in CtiContext
- `makeCall`, `endCall`, `holdCall`, etc. - All available in CtiContext

### Live-Calls Page (`src/pages/live-calls/index.tsx`)

**Uses from `useCtiStomp`:**
- ✅ `dnsMap` - For all extensions/devices display
- ✅ `callStateMap` - For call states
- ✅ `eventLog` - For real-time updates
- ✅ `summaryData` - Summary statistics
- ✅ `userAddress` - Current user's extension
- ✅ `isInitialized` - Connection status

**Helper functions it needs:**
- ✅ `getDnCallState(dn)` - Available in CtiContext
- ✅ `getCallStatesForDn(dn)` - Available in CtiContext
- ✅ `hasActiveCalls(dn)` - Available in CtiContext
- ✅ `getCallStateForDevice(dn, deviceName)` - Available in CtiContext
- ✅ `getAllCallIds()` - Available in CtiContext
- ✅ `getActiveCallIdsFromLocalStorage()` - Available in CtiContext

**Additional features:**
- Monitoring functionality (`startMonitoring`, `stopMonitoring`) - These are API calls, not socket-related
- Barge-in monitoring - API calls

## Can Global Instance Replace Them?

### ✅ YES - All Required Data is Available

**CtiContext provides:**
```typescript
{
  // All data from socket (STORED in state)
  dnsMap: ctiStomp.dnsMap,              // ✅ Available
  callStateMap: ctiStomp.callStateMap,  // ✅ Available
  eventLog: ctiStomp.eventLog,          // ✅ Available
  summaryData: ctiStomp.summaryData,    // ✅ Available
  userAddress: ctiStomp.userAddress,    // ✅ Available
  isInitialized: ctiStomp.isInitialized, // ✅ Available
  
  // All helper functions
  getDnCallState: ctiStomp.getDnCallState,                    // ✅ Available
  getCallStatesForDn: ctiStomp.getCallStatesForDn,           // ✅ Available
  hasActiveCalls: ctiStomp.hasActiveCalls,                   // ✅ Available
  getCallStateForDevice: ctiStomp.getCallStateForDevice,     // ✅ Available
  getAllCallIds: ctiStomp.getAllCallIds,                     // ✅ Available
  getActiveCallIdsFromLocalStorage: ...,                    // ✅ Available
  getDevicesForDn: ctiStomp.getDevicesForDn,                 // ✅ Available
  
  // Device helpers
  getCallingDeviceInfo: () => {...},                         // ✅ Available
  getAllUserDevices: () => {...},                            // ✅ Available
  
  // Call operations
  makeCall, dialNumber, endCall, holdCall, resumeCall, ...   // ✅ All Available
  
  // Active calls (for dialer)
  activeCalls: Map<string, {...}>,                          // ✅ Available
}
```

### Data Storage vs On-Demand

**Answer: Data is STORED, not fetched on demand**

1. **Initial Load:**
   - When connection establishes, server sends `complete_state` with ALL data
   - This populates `dnsMap` and `callStateMap` immediately
   - Data is stored in React state

2. **Real-time Updates:**
   - Socket continuously pushes `dns_states` and `call_events`
   - State is updated incrementally
   - No need to "request" data - it's pushed automatically

3. **For Replacement:**
   - ✅ Since data is stored, both pages can use the same global instance
   - ✅ No need to "request" data when page loads - it's already there
   - ✅ Both pages will see the same real-time updates
   - ✅ No data duplication or synchronization issues

## Replacement Strategy

### For Dialer Page

**Current:** Uses `useCtiStomp('/ws', undefined, 'dialer')` - Creates separate connection

**Replace with:** `useCti()` - Uses global connection

**Changes needed:**
1. Replace `useCtiStomp` import with `useCti`
2. Remove local `activeCalls` state (use from context)
3. Use `dialNumber()` instead of manual `makeCall()` calls
4. Use context's `activeCalls` instead of local state
5. Keep `mergedCalls` local (dialer-specific feature)

**Benefits:**
- ✅ Single connection (already established)
- ✅ Shared `activeCalls` state (floating bar will show calls)
- ✅ Simpler code (less state management)
- ✅ Consistent with rest of app

### For Live-Calls Page

**Current:** Uses `useCtiStomp('/ws', undefined, 'liveView')` - Creates separate connection

**Replace with:** `useCti()` - Uses global connection

**Changes needed:**
1. Replace `useCtiStomp` import with `useCti`
2. All data and functions are already available
3. No changes to monitoring functions (they're API calls, not socket-related)

**Benefits:**
- ✅ Single connection (already established)
- ✅ Real-time updates from global connection
- ✅ No duplicate data
- ✅ Consistent state across app

## Potential Issues & Solutions

### Issue 1: Active Calls State

**Problem:** Dialer maintains its own `activeCalls` state, but CtiContext also has one.

**Solution:**
- Use CtiContext's `activeCalls` for consistency
- Dialer's local state can be removed
- Floating bar and dialer will show same calls

### Issue 2: Event Processing

**Problem:** Dialer has complex event processing logic (lines ~1258-2057).

**Solution:**
- CtiContext already processes events and updates `activeCalls`
- Dialer's event processing can be simplified or removed
- Use CtiContext's processed `activeCalls` directly

### Issue 3: Merged Calls

**Problem:** Dialer maintains `mergedCalls` state locally.

**Solution:**
- Keep `mergedCalls` local (dialer-specific feature)
- Or move to CtiContext if needed globally

### Issue 4: Incoming Call Modal

**Problem:** Dialer shows incoming call modal.

**Solution:**
- This can stay in dialer (page-specific UI)
- Or move to global floating bar (better UX)

## Migration Checklist

### Dialer Page
- [ ] Replace `useCtiStomp` with `useCti()`
- [ ] Remove local `activeCalls` state
- [ ] Use `activeCalls` from context
- [ ] Replace `makeCall()` calls with `dialNumber()`
- [ ] Simplify event processing (use context's processed data)
- [ ] Keep `mergedCalls` local or move to context
- [ ] Test all call operations

### Live-Calls Page
- [ ] Replace `useCtiStomp` with `useCti()`
- [ ] Verify all helper functions work
- [ ] Test real-time updates
- [ ] Test monitoring functionality (API calls should still work)
- [ ] Test categorization and display

## Conclusion

**✅ YES, the global instance CAN replace both pages!**

**Reasons:**
1. ✅ All required data is available (`dnsMap`, `callStateMap`, `eventLog`, etc.)
2. ✅ All required functions are available (helpers, call operations)
3. ✅ Data is stored in state (not fetched on demand) - perfect for sharing
4. ✅ Single connection is more efficient
5. ✅ Consistent state across entire app

**Data Storage:**
- Data comes from socket on connection (`complete_state`)
- Updates come in real-time (`dns_states`, `call_events`)
- All stored in React state
- No need to "request" data - it's pushed automatically
- Both pages can use the same stored data

**Recommendation:**
Proceed with replacement! The global instance provides everything needed, and using it will:
- Reduce code duplication
- Ensure consistent state
- Improve performance (single connection)
- Simplify maintenance

