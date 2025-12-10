// src/pages/api/cti-stomp-stream.js
import { Client } from '@stomp/stompjs';

// Connection pool to reuse STOMP connections
const connectionPool = new Map();
const CONNECTION_TIMEOUT = 300000; // 5 minutes
const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds

// Track which connections have subscriptions set up
const subscriptionsSetup = new Set();

// Clean up stale connections
const cleanupStaleConnections = () => {
  const now = Date.now();
  for (const [key, connection] of connectionPool.entries()) {
    if (now - connection.lastUsed > CONNECTION_TIMEOUT) {
      if (connection.client && connection.client.connected) {
        connection.client.deactivate();
      }
      connectionPool.delete(key);
    }
  }
};

// Set up periodic cleanup
setInterval(cleanupStaleConnections, 60000); // Every minute

// Store SSE response streams for each connection
const sseStreams = new Map();

// Optimized subscription setup
const setupSubscriptions = (client, connectionKey) => {
  // Check if subscriptions are already set up for this connection
  if (subscriptionsSetup.has(connectionKey)) {
    console.log('⚠️ Subscriptions already set up for connection:', connectionKey, '- skipping');
    return;
  }
  
  console.log('🔧 Setting up STOMP subscriptions for connection:', connectionKey);
  const streams = sseStreams.get(connectionKey) || [];
  console.log(`📊 Found ${streams.length} SSE stream(s) for connection: ${connectionKey}`);
  
  // Subscribe to complete-state
  const sub1 = client.subscribe('/user/topic/complete-state', (message) => {
    console.log('🔔 STOMP complete-state message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];
      console.log(`📤 Sending complete-state to ${currentStreams.length} SSE stream(s)`);
      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'complete_state', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }
            console.log(`✅ Sent complete-state to stream ${index + 1}`);
          } catch (writeErr) {
            console.error(`❌ Error writing to stream ${index + 1}:`, writeErr);
          }
        } else {
          console.log(`⚠️ Stream ${index + 1} is destroyed, skipping`);
        }
      });
    } catch (err) {
      console.error('Error parsing complete-state payload:', err);
    }
  });
  console.log('✅ Subscribed to complete-state with ID:', sub1.id);
  
  // Subscribe to dns-states
  const sub2 = client.subscribe('/user/topic/dns-states', (message) => {
    console.log('🔔 STOMP dns-states message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];
      console.log(`📤 Sending dns-states to ${currentStreams.length} SSE stream(s)`);
      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'dns_states', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }
            console.log(`✅ Sent dns-states to stream ${index + 1}`);
          } catch (writeErr) {
            console.error(`❌ Error writing to stream ${index + 1}:`, writeErr);
          }
        } else {
          console.log(`⚠️ Stream ${index + 1} is destroyed, skipping`);
        }
      });
    } catch (err) {
      console.error('Error parsing dns-states payload:', err);
    }
  });
  console.log('✅ Subscribed to dns-states with ID:', sub2.id);
  
  // Subscribe to call-events
  const sub3 = client.subscribe('/user/topic/call-events', (message) => {
    console.log('🔔 STOMP call-events message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];
      console.log(`📤 Sending call-events to ${currentStreams.length} SSE stream(s)`);
      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'call_events', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }
            console.log(`✅ Sent call-events to stream ${index + 1}`);
          } catch (writeErr) {
            console.error(`❌ Error writing to stream ${index + 1}:`, writeErr);
          }
        } else {
          console.log(`⚠️ Stream ${index + 1} is destroyed, skipping`);
        }
      });
    } catch (err) {
      console.error('Error parsing call-events payload:', err);
    }
  });
  console.log('✅ Subscribed to call-events with ID:', sub3.id);
  
  // Mark subscriptions as set up
  subscriptionsSetup.add(connectionKey);
  console.log('✅ Subscriptions setup complete for connection:', connectionKey);
};

// Handle POST requests for publishing STOMP messages
const handlePublishMessage = (req, res) => {
  const { token, userAddress, destination, body } = req.body;
  
  if (!token || !userAddress || !destination) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: token, userAddress, destination' 
    });
  }
  
  const connectionKey = `${userAddress}-${token.substring(0, 20)}`;
  const existingConnection = connectionPool.get(connectionKey);
  
  if (!existingConnection || !existingConnection.client || !existingConnection.client.connected) {
    return res.status(400).json({ 
      success: false, 
      error: 'No active STOMP connection found. Please establish SSE connection first.' 
    });
  }
  
  try {
    existingConnection.client.publish({
      destination,
      body: body || ''
    });
    
    existingConnection.lastUsed = Date.now();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message published successfully' 
    });
  } catch (error) {
    console.error('Error publishing STOMP message:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export default function handler(req, res) {
  // Handle POST requests for publishing messages
  if (req.method === 'POST') {
    return handlePublishMessage(req, res);
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get parameters from query string
  const { token, userAddress } = req.query;
  
  // Get WebSocket protocol configuration
  const websocketProtocol = process.env.WEBSOCKET_PROTOCOL || 'ws';
  
  // Check if CTI server URL is configured
  if (!process.env.NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL) {
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'CTI server URL not configured. Please set NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL environment variable.' })}\n\n`);
    res.end();
    return;
  }
  
  // Validate required parameters
  if (!token || !userAddress) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'Missing required parameters: token, userAddress' })}\n\n`);
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
    'X-Accel-Buffering': 'no',
    'Transfer-Encoding': 'chunked'
  });

  const connectionKey = `${userAddress}-${token.substring(0, 20)}`;
  
  // Check connection pool for existing connection
  const existingConnection = connectionPool.get(connectionKey);
  
  // Add this SSE stream to the connection's stream list BEFORE setting up subscriptions
  if (!sseStreams.has(connectionKey)) {
    sseStreams.set(connectionKey, []);
  }
  sseStreams.get(connectionKey).push(res);
  console.log(`📝 Added SSE stream to connection ${connectionKey}. Total streams: ${sseStreams.get(connectionKey).length}`);
  
  // Send keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    }
  }, KEEP_ALIVE_INTERVAL);

  // If we have an existing STOMP client, use it
  if (existingConnection && existingConnection.client && existingConnection.client.connected) {
    console.log('🔄 Reusing existing STOMP connection for user:', userAddress);
    existingConnection.lastUsed = Date.now();
    
    // Write connection message and flush
    const sseData = `data: ${JSON.stringify({ type: 'stomp_connected', message: 'STOMP connected' })}\n\n`;
    res.write(sseData);
    if (res.flush) {
      res.flush();
    }
    console.log('✅ Sent stomp_connected to new SSE stream');
    
    // Request initial state
    existingConnection.client.publish({
      destination: '/app/request/initial-state',
      body: ''
    });
    
    // Cleanup on disconnect
    const cleanup = () => {
      clearInterval(keepAlive);
      const streams = sseStreams.get(connectionKey) || [];
      const index = streams.indexOf(res);
      if (index > -1) {
        streams.splice(index, 1);
      }
      if (streams.length === 0) {
        sseStreams.delete(connectionKey);
      }
    };
    
    res.on('close', cleanup);
    res.on('finish', cleanup);
    res.on('error', cleanup);
    
    return;
  }

  // Create new STOMP client connection to CTI server
  const ctiServerHost = process.env.NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL;
  const ctiServerPort = process.env.CTI_SERVER_PORT || '8008';
  
  // Connection attempts
  const connectionAttempts = [
    `ws://${ctiServerHost}:${ctiServerPort}/ws`,
    `ws://${ctiServerHost}/ws`,
    `wss://${ctiServerHost}:${ctiServerPort}/ws`
  ];
  
  console.log('🔗 Creating new CTI STOMP connection for user:', userAddress);
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('⏰ Connection timeout to CTI server');
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'error', status: 'timeout', message: 'Connection timeout to CTI server' })}\n\n`);
      res.end();
    }
  }, 15000);
  
  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to CTI server...' })}\n\n`);
  
  let currentAttempt = 0;
  let client = null;

  const tryConnection = (url) => {
    console.log(`🔄 Attempting connection ${currentAttempt + 1}/${connectionAttempts.length}: ${url}`);
    
    if (!url) {
      console.error('❌ Invalid URL provided:', url);
      return;
    }
    
    client = new Client({
      brokerURL: url,
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'user-address': userAddress
      },
      debug: (str) => {
        // Disable debug logging for production
      },
      onConnect: (frame) => {
        console.log('✅ STOMP Connected successfully for user:', userAddress);
        clearTimeout(connectionTimeout);
        
        // Add to connection pool
        connectionPool.set(connectionKey, {
          client,
          lastUsed: Date.now(),
          userAddress
        });
        
        // Set up subscriptions (this will use the streams already added)
        setupSubscriptions(client, connectionKey);
        
        // Notify all SSE streams
        const streams = sseStreams.get(connectionKey) || [];
        console.log(`📤 Notifying ${streams.length} SSE stream(s) of STOMP connection`);
        streams.forEach((stream, index) => {
          if (!stream.destroyed) {
            try {
              const sseData = `data: ${JSON.stringify({ type: 'stomp_connected', message: 'STOMP connected' })}\n\n`;
              stream.write(sseData);
              if (stream.flush) {
                stream.flush();
              }
              console.log(`✅ Sent stomp_connected to stream ${index + 1}`);
              
              // Send a test message to verify the stream is working
              setTimeout(() => {
                if (!stream.destroyed) {
                  const testData = `data: ${JSON.stringify({ type: 'test', message: 'SSE stream is working', timestamp: Date.now() })}\n\n`;
                  stream.write(testData);
                  if (stream.flush) {
                    stream.flush();
                  }
                  console.log(`✅ Sent test message to stream ${index + 1}`);
                }
              }, 1000);
            } catch (writeErr) {
              console.error(`❌ Error writing stomp_connected to stream ${index + 1}:`, writeErr);
            }
          }
        });
        
        // Request initial state
        client.publish({
          destination: '/app/request/initial-state',
          body: ''
        });
        
        console.log('📡 STOMP subscriptions established');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        const streams = sseStreams.get(connectionKey) || [];
        streams.forEach(stream => {
          if (!stream.destroyed) {
            stream.write(`data: ${JSON.stringify({ type: 'stomp_error', message: frame.headers.message || 'STOMP error' })}\n\n`);
          }
        });
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error.message);
        
        // Try next connection attempt
        currentAttempt++;
        if (currentAttempt < connectionAttempts.length) {
          console.log(`❌ Connection failed, trying next attempt...`);
          setTimeout(() => {
            if (client) {
              client.deactivate();
            }
            tryConnection(connectionAttempts[currentAttempt]);
          }, 1000);
        } else {
          console.error('❌ All connection attempts failed');
          clearTimeout(connectionTimeout);
          clearInterval(keepAlive);
          
          const streams = sseStreams.get(connectionKey) || [];
          streams.forEach(stream => {
            if (!stream.destroyed) {
              stream.write(`data: ${JSON.stringify({ 
                type: 'error', 
                status: 'error', 
                message: `All WebSocket connection attempts failed`, 
                details: `Tried ${connectionAttempts.length} different URLs. Please check if the CTI server is running and accessible.`
              })}\n\n`);
              stream.end();
            }
          });
        }
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        const streams = sseStreams.get(connectionKey) || [];
        streams.forEach(stream => {
          if (!stream.destroyed) {
            stream.write(`data: ${JSON.stringify({ type: 'connection', status: 'disconnected', message: 'CTI server disconnected', code: event.code, reason: event.reason })}\n\n`);
          }
        });
      }
    });

    // Activate the client
    client.activate();
  };

  // Start the first connection attempt
  tryConnection(connectionAttempts[0]);

  // Cleanup handlers
  const cleanup = () => {
    clearTimeout(connectionTimeout);
    clearInterval(keepAlive);
    const streams = sseStreams.get(connectionKey) || [];
    const index = streams.indexOf(res);
    if (index > -1) {
      streams.splice(index, 1);
    }
    if (streams.length === 0) {
      sseStreams.delete(connectionKey);
    }
  };

  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('finish', cleanup);
  res.on('error', cleanup);
}

