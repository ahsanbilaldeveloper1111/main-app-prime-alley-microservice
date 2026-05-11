// src/pages/api/analysis-stream.js
import { WebSocket } from 'ws';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get parameters from query string
  const { uuid, date, localPartyNumber, ownerUsername, imagicle, callDuration, callType, remotePartyNumber, dateTime } = req.query;

  // Accept VITE_* (current SPA env schema) with the legacy keys as fallback so
  // operators can keep their existing env files. The sidecar reads .env at
  // startup via dotenv/config, so all of these resolve from the same file.
  const websocketProtocol =
    process.env.VITE_AIML_WEBSOCKET_PROTOCOL ||
    process.env.WEBSOCKET_PROTOCOL ||
    'wss';
  const analysisHostEnv =
    process.env.VITE_PRIVATE_AIML_SOCKET_URL ||
    process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL;

  if (!analysisHostEnv) {
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'Analysis server URL not configured. Set VITE_PRIVATE_AIML_SOCKET_URL (or NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL) in the streaming sidecar env.' })}\n\n`);
    res.end();
    return;
  }
  
  // Log connection for monitoring
  
  // console.log('Analysis server config:', { 
  //   host: process.env.NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL, 
  //   protocol: websocketProtocol 
  // });
  
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
  const analysisServerHost = analysisHostEnv;
   
  //Old Analysis Server URL
//  const analysisServerUrl = `${websocketProtocol}://${analysisServerHost}/ws/analysis/${uuid}/${date}/${localPartyNumber}/${ownerUsername}/${imagicle}/`;

  //New Analysis Server URL
  //  const analysisServerUrl = `${websocketProtocol}://${analysisServerHost}/ws/analysis-v2/${uuid}/${date}/${localPartyNumber}/${ownerUsername}/${imagicle}/`;
  
  //ML Gateway Analysis Server URL
   const analysisServerUrl = `${websocketProtocol}://${analysisServerHost}/ws/analysis/${uuid}/${date}/${localPartyNumber}/${ownerUsername}/${imagicle}/${callDuration}/${remotePartyNumber}/${callType}/${dateTime}/`;
  
  console.log('Connecting to analysis server:', analysisServerUrl);
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('Connection timeout to analysis server');
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'timeout', message: 'Connection timeout to analysis server' })}\n\n`);
  }, 10000);
  
  // Build WebSocket options
  // Note: The 'ws' library automatically sets the 'Host' header from the URL
  // We should NOT manually set 'Host' as it must match the server we're connecting to
  const originHeader =
    process.env.VITE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const wsOptions = {
    headers: {
      'User-Agent': 'MainApp',
      // Origin header identifies where the request is coming from (client app).
      // Falls back gracefully if neither key is set in the sidecar's env.
      ...(originHeader && { 'Origin': originHeader }),
    }
  };

  // Add SSL options only for secure connections
  if (websocketProtocol === 'wss') {
    wsOptions.rejectUnauthorized = false; // Accept self-signed certificates
  }


  const wsAnalysis = new WebSocket(analysisServerUrl, wsOptions);

  // Send initial connection status
  // res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to analysis server...', step: 'Connecting to server' })}\n\n`);
  
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
    
    // res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected', message: 'Connected to analysis server',step: 'Connected to server' })}\n\n`);
    
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
    try {
      // Parse message to check for error status
      const messageStr = data.toString();
      let messageData = null;
      
      try {
        messageData = JSON.parse(messageStr);
      } catch (parseError) {
        // Not JSON, forward as-is
        console.log('Message is not JSON, forwarding as string');
      }
      
      // Check if message indicates an error
      if (messageData && messageData.status === 'error') {
        console.error('Error received from analysis server:', messageData);
        
        // Close WebSocket connection on error
        if (wsAnalysis.readyState === WebSocket.OPEN || wsAnalysis.readyState === WebSocket.CONNECTING) {
          wsAnalysis.close(1000, 'Error received from server');
        }
        
        // Forward error message to client
        const sseData = `data: ${messageStr}\n\n`;
        res.write(sseData);
        if (res.flush) {
          res.flush();
        }
        
        // End the SSE connection after sending error
        clearTimeout(connectionTimeout);
        clearInterval(keepAlive);
        setTimeout(() => {
          if (!res.destroyed) {
            res.end();
          }
        }, 100);
        return;
      }
      
      // Forward normal message to client via SSE
      const sseData = `data: ${messageStr}\n\n`;
      res.write(sseData);
      // Force flush the response
      if (res.flush) {
        res.flush();
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      // Forward the raw message if processing fails
      try {
        const sseData = `data: ${data.toString()}\n\n`;
        res.write(sseData);
        if (res.flush) {
          res.flush();
        }
      } catch (writeError) {
        console.error('Failed to write error message to client:', writeError);
      }
    }
  });

  wsAnalysis.on('close', (code, reason) => {
    console.log('Analysis server connection closed:', code, reason);
    clearTimeout(connectionTimeout);
    clearInterval(keepAlive);
    
    // Code 1005 means "No Status Received" - abnormal closure, don't retry
    // Code 1006 means "Abnormal Closure" - also don't retry
    const isAbnormalClosure = code === 1005 || code === 1006;
    
    // Send disconnect message to client with error status for abnormal closures
    // This signals the client not to retry automatically
    const disconnectMessage = JSON.stringify({ 
      type: 'connection', 
      status: isAbnormalClosure ? 'error' : 'disconnected', 
      message: isAbnormalClosure 
        ? 'Analysis server connection closed abnormally. Please check server status.' 
        : 'Analysis server disconnected', 
      code, 
      reason: reason?.toString() || 'No reason provided',
      shouldRetry: !isAbnormalClosure
    });
    
    // Only write if response is still writable
    if (!res.destroyed && !res.writableEnded) {
      res.write(`data: ${disconnectMessage}\n\n`);
      
      // End the SSE connection after sending disconnect message
      // This prevents the client from retrying automatically
      setTimeout(() => {
        if (!res.destroyed && !res.writableEnded) {
          res.end();
        }
      }, 100);
    }
  });

  wsAnalysis.on('error', (error) => {
    console.error('Analysis server error:', error.message);
    console.error('Error code:', error.code);
    console.error('Connection URL:', analysisServerUrl);
    console.error('WebSocket options:', JSON.stringify(wsOptions, null, 2));
    clearTimeout(connectionTimeout);
    clearInterval(keepAlive);
    
    // Close WebSocket if still open
    if (wsAnalysis.readyState === WebSocket.OPEN || wsAnalysis.readyState === WebSocket.CONNECTING) {
      wsAnalysis.close(1000, 'Connection error');
    }
    
    // Send error to client and end connection
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      status: 'error', 
      message: `WebSocket connection failed: ${error.message}`, 
      code: error.code,
      details: `The external WebSocket server at ${analysisServerHost} is not responding. Please check if the server is running and accessible.`
    })}\n\n`);
    
    // End the SSE connection after sending error
    setTimeout(() => {
      if (!res.destroyed) {
        res.end();
      }
    }, 100);
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
