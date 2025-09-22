// Simple SSE test endpoint for debugging
export default function handler(req, res) {
  console.log('🧪 Simple SSE endpoint called');
  console.log('🧪 Method:', req.method);
  console.log('🧪 Headers:', req.headers);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🧪 Setting up SSE response');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  console.log('🧪 SSE headers set, sending initial message');
  
  // Send initial message
  const initialMessage = { type: 'test', message: 'Simple SSE test started', timestamp: new Date().toISOString() };
  console.log('🧪 Sending initial message:', initialMessage);
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

  // Send test messages every 2 seconds
  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (!res.destroyed) {
      const message = { 
        type: 'test', 
        message: `Test message ${count}`, 
        timestamp: new Date().toISOString(),
        count: count
      };
      console.log(`🧪 Sending test message ${count}:`, message);
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    } else {
      console.log('🧪 Response destroyed, stopping interval');
      clearInterval(interval);
    }
  }, 2000);

  // Cleanup on disconnect
  res.on('close', () => {
    console.log('🧪 Simple SSE client disconnected (close)');
    clearInterval(interval);
  });

  res.on('finish', () => {
    console.log('🧪 Simple SSE client disconnected (finish)');
    clearInterval(interval);
  });

  res.on('error', (err) => {
    console.log('🧪 Simple SSE error:', err);
    clearInterval(interval);
  });
  
  console.log('🧪 Simple SSE setup complete');
}
