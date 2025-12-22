# Cross-Tab CTI Sharing

This document explains how the CTI context, socket connection, and events are shared across browser tabs.

## Overview

The cross-tab CTI manager ensures that:
- **Only one WebSocket connection** is maintained across all tabs (the "master" tab)
- **All tabs receive CTI events** in real-time via BroadcastChannel API
- **State is synchronized** across all tabs automatically
- **Automatic failover** - if the master tab closes, another tab takes over

## How It Works

### 1. Master Tab Election

- When a tab loads, it checks if there's already a master tab
- If no master exists or the master hasn't sent a heartbeat in 5 seconds, the tab becomes the master
- The master tab maintains the WebSocket connection
- Master tab sends heartbeat every 2 seconds

### 2. Cross-Tab Communication

- Uses **BroadcastChannel API** for cross-tab communication
- Master tab broadcasts:
  - CTI events (call events, state changes)
  - State updates (dnsMap, callStateMap, summaryData, etc.)
- Non-master tabs listen to broadcasts and update their local state

### 3. Connection Management

- **Master tab**: Creates and maintains the WebSocket/SSE connection
- **Non-master tabs**: Skip connection creation, receive events via BroadcastChannel
- If master tab closes, another tab automatically becomes master and creates connection

## Implementation Details

### Files

1. **`src/utils/crossTabCtiManager.ts`**
   - Manages cross-tab communication
   - Handles master tab election
   - Broadcasts events and state updates

2. **`src/hooks/useCtiStomp.ts`**
   - Integrated with cross-tab manager
   - Only master tab creates WebSocket connection
   - Broadcasts events when master, listens when not master

### Usage

The cross-tab sharing is **automatic** - no code changes needed in components using `useCti()` or `useCtiStomp()`.

### Browser Support

- **Modern browsers**: Full support via BroadcastChannel API
- **Older browsers**: Falls back to normal behavior (each tab has its own connection)

## Benefits

1. **Reduced server load**: Only one WebSocket connection per user session
2. **Consistent state**: All tabs see the same CTI state
3. **Better performance**: Less network traffic
4. **Automatic failover**: Seamless transition if master tab closes

## Testing

To test cross-tab sharing:

1. Open the application in one tab
2. Open the same application in another tab
3. Make a call or trigger a CTI event in one tab
4. Verify the event appears in both tabs
5. Close the master tab
6. Verify another tab automatically becomes master and continues working

## Debugging

Check browser console for logs:
- `[CrossTabCtiManager]` - Cross-tab manager logs
- `[cti-stomp-...]` - CTI connection logs

Monitor localStorage:
- `cti_master_tab_id` - Current master tab ID
- `cti_master_tab_id_heartbeat` - Last heartbeat timestamp

