// src/pages/api/analysis-stream.js
import { WebSocket } from 'ws';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Create WebSocket connection to analysis server
  const analysisServerUrl = 'wss://192.165.26.26:9000/ws/analysis/E2E6535F-0D0A-4623-85BA-2E424FCC1CC9/2025-09-15/581/pa1/';
  
  console.log('🔗 Connecting to analysis server:', analysisServerUrl);
  
  const wsAnalysis = new WebSocket(analysisServerUrl);

  // Send initial connection status
  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to analysis server...' })}\n\n`);

  // Handle analysis server connection
  wsAnalysis.on('open', () => {
    console.log('✅ Connected to analysis server');
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected', message: 'Connected to analysis server' })}\n\n`);
  });

  wsAnalysis.on('message', (data) => {
    console.log('📨 Message from analysis server:', data.toString());
    // Forward message to client via SSE
    res.write(`data: ${data.toString()}\n\n`);
  });

  wsAnalysis.on('close', (code, reason) => {
    console.log('🔌 Analysis server connection closed:', code, reason);
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'disconnected', message: 'Analysis server disconnected', code, reason })}\n\n`);
  });

  wsAnalysis.on('error', (error) => {
    console.error('❌ Analysis server error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: error.message })}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔌 Client disconnected');
    if (wsAnalysis.readyState === WebSocket.OPEN) {
      wsAnalysis.close();
    }
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
}
