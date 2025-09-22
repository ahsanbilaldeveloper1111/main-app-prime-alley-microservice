// Simple SSE test endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🧪 Test SSE endpoint called');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'test', message: 'SSE test connection established' })}\n\n`);

  // Send test messages every 2 seconds
  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ 
        type: 'test', 
        message: `Test message ${count}`, 
        timestamp: new Date().toISOString() 
      })}\n\n`);
    } else {
      clearInterval(interval);
    }
  }, 2000);

  // Cleanup on disconnect
  res.on('close', () => {
    console.log('🧪 Test SSE client disconnected');
    clearInterval(interval);
  });

  res.on('error', (err) => {
    console.log('🧪 Test SSE error:', err);
    clearInterval(interval);
  });
}
