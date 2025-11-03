// src/pages/api/analysis-stream.js
import { WebSocket } from 'ws';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get parameters from query string
  const { uuid, date, localPartyNumber, ownerUsername, imagicle } = req.query;
  
  // Get WebSocket protocol configuration
  const websocketProtocol = process.env.WEBSOCKET_PROTOCOL || 'wss';
  
  // Check if analysis server URL is configured
  if (!process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL) {
    console.error('❌ Analysis server URL not configured: NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL');
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'Analysis server URL not configured. Please set NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL environment variable.' })}\n\n`);
    res.end();
    return;
  }
  
  // Log connection for monitoring
  console.log('SSE connection request:', { uuid, date, localPartyNumber, ownerUsername, imagicle });
  console.log('Analysis server config:', { 
    host: process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL, 
    protocol: websocketProtocol 
  });
  
  // Validate required parameters
  if (!uuid || !date || !localPartyNumber || !ownerUsername || !imagicle) {
    console.error('❌ Missing required parameters:', { uuid, date, localPartyNumber, ownerUsername, imagicle });
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'Missing required parameters: uuid, date, localPartyNumber, ownerUsername, imagicle' })}\n\n`);
    res.end();
    return;
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    'Transfer-Encoding': 'chunked'
  });

  // Create WebSocket connection to analysis server
  const analysisServerHost = process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL;
  const analysisServerUrl = `${websocketProtocol}://${analysisServerHost}/ws/analysis/${uuid}/${date}/${localPartyNumber}/${ownerUsername}/${imagicle}/`;
  
  console.log('🔗 Connecting to analysis server:', analysisServerUrl);
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('⏰ Connection timeout to analysis server');
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'timeout', message: 'Connection timeout to analysis server' })}\n\n`);
  }, 10000);
  
  const wsOptions = {
    headers: {
      'User-Agent': 'Next.js Analysis Client',
      'Origin': 'http://localhost:3000'
    }
  };

  // Add SSL options only for secure connections
  if (websocketProtocol === 'wss') {
    wsOptions.rejectUnauthorized = false; // Accept self-signed certificates
  }

  const wsAnalysis = new WebSocket(analysisServerUrl, wsOptions);

  // Send initial connection status
  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to analysis server...' })}\n\n`);
  
  // Send keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    }
  }, 30000);

  // Handle analysis server connection
  wsAnalysis.on('open', () => {
    console.log('Connected to analysis server');
    clearTimeout(connectionTimeout);
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected', message: 'Connected to analysis server' })}\n\n`);
    
    // Send command to start analysis
    const analysisCommand = {
      action: 'start_analysis',
      uuid: uuid,
      date: date,
      localPartyNumber: localPartyNumber,
      ownerUsername: ownerUsername,
      imagicle: imagicle
    };
    
    wsAnalysis.send(JSON.stringify(analysisCommand));
  });

  wsAnalysis.on('message', (data) => {
    // Forward message to client via SSE
    const sseData = `data: ${data.toString()}\n\n`;
    res.write(sseData);
    // Force flush the response
    if (res.flush) {
      res.flush();
    }
  });

  wsAnalysis.on('close', (code, reason) => {
    console.log('Analysis server connection closed:', code, reason);
    clearTimeout(connectionTimeout);
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'disconnected', message: 'Analysis server disconnected', code, reason })}\n\n`);
  });

  wsAnalysis.on('error', (error) => {
    console.error('Analysis server error:', error.message);
    clearTimeout(connectionTimeout);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      status: 'error', 
      message: `WebSocket connection failed: ${error.message}`, 
      code: error.code,
      details: `The external WebSocket server at ${process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL} is not responding. Please check if the server is running and accessible.`
    })}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    if (wsAnalysis.readyState === WebSocket.OPEN) {
      wsAnalysis.close();
    }
  });

  // Handle response close
  res.on('close', () => {
    clearInterval(keepAlive);
  });

  // Handle response finish
  res.on('finish', () => {
    clearInterval(keepAlive);
  });

}
