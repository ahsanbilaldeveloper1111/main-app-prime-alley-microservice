# CTI Socket Connection Test

This directory contains test files to verify that the CTI socket connection is working properly.

## Test Files

### 1. `test-cti-socket.js` - Backend Socket Test
Direct WebSocket connection test to the CTI server.

**Usage:**
```bash
npm run test:cti-socket
```

**What it tests:**
- Direct WebSocket connection to CTI server
- STOMP protocol handshake
- Subscription to all CTI topics
- Event reception and parsing

**Expected output:**
```
🧪 CTI Socket Connection Test
============================
Configuration: {
  host: '192.168.39.53',
  port: '8008',
  protocol: 'ws',
  websocketUrl: 'ws://192.168.39.53:8008/ws',
  userAddress: '512'
}

🚀 Starting CTI connection test...
🔗 Connecting to: ws://192.168.39.53:8008/ws
STOMP Debug: Opening Web Socket...
STOMP Debug: Web Socket Opened...
✅ STOMP Connected successfully!
📡 Setting up subscriptions...
✅ Subscription 1: complete-state (ID: sub-0)
✅ Subscription 2: dns-states (ID: sub-1)
✅ Subscription 3: call-events (ID: sub-2)
📤 Requesting initial state...
✅ All subscriptions active. Listening for events...
Press Ctrl+C to stop
```

### 2. `test-cti-frontend.html` - Frontend Integration Test
Browser-based test that uses the SSE proxy endpoint.

**Usage:**
1. Start your Next.js development server: `npm run dev`
2. Open `test-cti-frontend.html` in your browser
3. Click "Connect" to test the SSE endpoint

**What it tests:**
- SSE endpoint connectivity
- Event streaming from server to client
- Real-time event display
- Connection status monitoring

**Features:**
- Real-time event log
- Connection statistics
- Event type filtering
- Manual connect/disconnect controls

## Configuration

The tests use these environment variables:
- `NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL` - CTI server host (default: 192.168.39.53)
- `CTI_SERVER_PORT` - CTI server port (default: 8008)
- `WEBSOCKET_PROTOCOL` - WebSocket protocol (default: ws)

## Troubleshooting

### If the backend test fails:
1. Check if the CTI server is running on the correct host/port
2. Verify the WebSocket endpoint is accessible
3. Check firewall settings
4. Verify the authentication token is valid

### If the frontend test fails:
1. Ensure the Next.js development server is running
2. Check browser console for errors
3. Verify the SSE endpoint is accessible
4. Check network connectivity

### Common Issues:
- **Connection timeout**: CTI server might be down or unreachable
- **Authentication error**: Token might be expired or invalid
- **No events received**: Subscriptions might not be set up correctly
- **CORS errors**: Check server CORS configuration

## Expected Behavior

When working correctly, you should see:
1. Successful WebSocket connection
2. STOMP handshake completion
3. Active subscriptions to all topics
4. Real-time events being received
5. Proper event parsing and display

## Test Data

The tests use a hardcoded test token and user address:
- **Token**: `eyJhbGciOiJIUzI1NiJ9...` (test JWT token)
- **User Address**: `512`

Make sure these match your CTI server configuration.
