// CTI test SSE endpoint that simulates events without STOMP
export default function handler(req, res) {
  console.log('🧪 CTI Test SSE endpoint called');
  console.log('🧪 Method:', req.method);
  console.log('🧪 Query:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, userAddress } = req.query;
  console.log('🔑 Token present:', !!token);
  console.log('👤 User address:', userAddress);

  console.log('🧪 Setting up CTI test SSE response');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  console.log('🧪 CTI test SSE headers set, sending initial message');
  
  // Send initial connection message
  const connectionMessage = { 
    type: 'connection', 
    status: 'connected', 
    message: 'CTI test SSE connection established',
    timestamp: new Date().toISOString()
  };
  console.log('🧪 Sending connection message:', connectionMessage);
  res.write(`data: ${JSON.stringify(connectionMessage)}\n\n`);

  // Send simulated CTI events
  let eventCount = 0;
  const interval = setInterval(() => {
    eventCount++;
    if (!res.destroyed) {
      // Simulate different types of CTI events
      const eventTypes = ['complete_state', 'dns_states', 'call_events'];
      const eventType = eventTypes[eventCount % eventTypes.length];
      
      let eventData;
      switch (eventType) {
        case 'complete_state':
          eventData = {
            type: 'complete_state',
            data: [
              { dn: '512', deviceName: 'CSFusman', deviceType: 'SOFT', terminalState: 'REGISTERED', status: 'CONNECTED' },
              { dn: '521', deviceName: 'CSFkamran', deviceType: 'SOFT', terminalState: 'REGISTERED', status: 'ON_HOLD' }
            ]
          };
          break;
        case 'dns_states':
          eventData = {
            type: 'dns_states',
            data: { dn: '512', deviceName: 'CSFusman', deviceType: 'SOFT', terminalState: 'REGISTERED', status: 'CONNECTED' }
          };
          break;
        case 'call_events':
          eventData = {
            type: 'call_events',
            data: { 
              callId: `test-call-${eventCount}`, 
              eventType: 'RINGING', 
              parties: [{ callingAddress: '512', calledAddress: '521', callStatus: 'RINGING' }]
            }
          };
          break;
      }
      
      console.log(`🧪 Sending CTI test event ${eventCount} (${eventType}):`, eventData);
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } else {
      console.log('🧪 CTI test response destroyed, stopping interval');
      clearInterval(interval);
    }
  }, 3000);

  // Cleanup on disconnect
  res.on('close', () => {
    console.log('🧪 CTI test SSE client disconnected (close)');
    clearInterval(interval);
  });

  res.on('finish', () => {
    console.log('🧪 CTI test SSE client disconnected (finish)');
    clearInterval(interval);
  });

  res.on('error', (err) => {
    console.log('🧪 CTI test SSE error:', err);
    clearInterval(interval);
  });
  
  console.log('🧪 CTI test SSE setup complete');
}
