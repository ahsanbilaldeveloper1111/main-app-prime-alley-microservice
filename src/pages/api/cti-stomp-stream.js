// src/pages/api/cti-stomp-stream.js
import { Client } from '@stomp/stompjs';

// Connection pool to reuse connections
const connectionPool = new Map();
const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds

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

// Optimized subscription setup
const setupSubscriptions = (client, res) => {
  console.log('🔧 Setting up STOMP subscriptions for SSE client');
  
  // Subscribe to complete-state
  const sub1 = client.subscribe('/user/topic/complete-state', (message) => {
    console.log('🔔 STOMP complete-state message received:', message.body);
    try {
      const payload = JSON.parse(message.body);
      if (!res.destroyed) {
        console.log('📤 Sending complete-state to SSE client');
        res.write(`data: ${JSON.stringify({ type: 'complete_state', data: payload })}\n\n`);
      } else {
        console.log('⚠️ SSE response destroyed, not sending complete-state');
      }
    } catch (err) {
      console.error('Error parsing complete-state payload:', err);
    }
  });
  console.log('✅ Subscribed to complete-state with ID:', sub1.id);
  
  // Subscribe to dns-states
  const sub2 = client.subscribe('/user/topic/dns-states', (message) => {
    console.log('🔔 STOMP dns-states message received:', message.body);
    try {
      const payload = JSON.parse(message.body);
      if (!res.destroyed) {
        console.log('📤 Sending dns-states to SSE client');
        res.write(`data: ${JSON.stringify({ type: 'dns_states', data: payload })}\n\n`);
      } else {
        console.log('⚠️ SSE response destroyed, not sending dns-states');
      }
    } catch (err) {
      console.error('Error parsing dns-states payload:', err);
    }
  });
  console.log('✅ Subscribed to dns-states with ID:', sub2.id);
  
  // Subscribe to call-events
  const sub3 = client.subscribe('/user/topic/call-events', (message) => {
    console.log('🔔 STOMP call-events message received:', message.body);
    try {
      const payload = JSON.parse(message.body);
      if (!res.destroyed) {
        console.log('📤 Sending call-events to SSE client');
        res.write(`data: ${JSON.stringify({ type: 'call_events', data: payload })}\n\n`);
      } else {
        console.log('⚠️ SSE response destroyed, not sending call-events');
      }
    } catch (err) {
      console.error('Error parsing call-events payload:', err);
    }
  });
  console.log('✅ Subscribed to call-events with ID:', sub3.id);
};

// Helper function to set up SSE response for existing connection
const setupSSEResponse = (res, client, userAddress) => {
  console.log('🔧 Setting up SSE response for existing connection');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no',
    'Transfer-Encoding': 'chunked'
  });

  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected', message: 'Using existing STOMP connection' })}\n\n`);

  // Set up subscriptions for the existing connection
  console.log('🔧 Setting up subscriptions for existing connection');
  setupSubscriptions(client, res);

  // Set up keep-alive for existing connection
  const keepAlive = setInterval(() => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    }
  }, KEEP_ALIVE_INTERVAL);

  // Handle client disconnect
  res.on('close', () => {
    clearInterval(keepAlive);
  });

  res.on('finish', () => {
    clearInterval(keepAlive);
  });
};

export default function handler(req, res) {
  console.log('🚀 CTI STOMP Stream API called');
  console.log('🚀 Method:', req.method);
  console.log('🚀 Headers:', req.headers);
  console.log('🚀 Query:', req.query);
  
  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get parameters from query string
  const { token, userAddress } = req.query;
  console.log('🔑 Token present:', !!token);
  console.log('👤 User address:', userAddress);
  
  // Get WebSocket protocol configuration
  const websocketProtocol = process.env.WEBSOCKET_PROTOCOL || 'ws';
  
  // Check if CTI server URL is configured
  if (!process.env.NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL) {
    console.error('❌ CTI server URL not configured: NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL');
    res.write(`data: ${JSON.stringify({ type: 'error', status: 'error', message: 'CTI server URL not configured. Please set NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL environment variable.' })}\n\n`);
    res.end();
    return;
  }
  
  // Validate required parameters
  if (!token || !userAddress) {
    console.error('❌ Missing required parameters:', { token: !!token, userAddress });
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

  // Check connection pool for existing connection
  const connectionKey = `${userAddress}-${token.substring(0, 20)}`;
  const existingConnection = connectionPool.get(connectionKey);
  
  // Always create new SSE connection, but reuse STOMP client if available
  let stompClient = null;
  if (existingConnection && existingConnection.client && existingConnection.client.connected) {
    console.log('🔄 Reusing existing STOMP connection for user:', userAddress);
    console.log('🔄 STOMP client connected:', existingConnection.client.connected);
    existingConnection.lastUsed = Date.now();
    stompClient = existingConnection.client;
  } else {
    console.log('🔄 Creating new STOMP connection for user:', userAddress);
  }

  // Set up Server-Sent Events
  console.log('🔧 Setting up new SSE connection');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff'
  });

  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Establishing STOMP connection...' })}\n\n`);
  console.log('📤 Sent initial connection message to SSE client');

  // Send keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    }
  }, KEEP_ALIVE_INTERVAL);

  // If we have an existing STOMP client, use it and set up subscriptions
  if (stompClient) {
    console.log('✅ Using existing STOMP client, setting up subscriptions');
    console.log('✅ STOMP client connected:', stompClient.connected);
    console.log('✅ STOMP client subscriptions:', Object.keys(stompClient.subscriptions || {}));
    
    const connectionMessage = { type: 'connection', status: 'connected', message: 'Using existing STOMP connection' };
    console.log('📤 Sending connection message:', connectionMessage);
    res.write(`data: ${JSON.stringify(connectionMessage)}\n\n`);
    
    // Set up subscriptions for this SSE client
    console.log('🔧 Setting up subscriptions for existing STOMP client');
    setupSubscriptions(stompClient, res);
    
    // Handle client disconnect
    res.on('close', () => {
      console.log('🔌 SSE client disconnected (close)');
      clearInterval(keepAlive);
    });
    res.on('finish', () => {
      console.log('🔌 SSE client disconnected (finish)');
      clearInterval(keepAlive);
    });
    res.on('error', (err) => {
      console.log('❌ SSE client error:', err);
      clearInterval(keepAlive);
    });
    
    return;
  }

  // Create new STOMP client connection to CTI server
  const ctiServerHost = process.env.NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL;
  const ctiServerPort = process.env.CTI_SERVER_PORT || '8008';
  
  // Optimized connection attempts - only try the most likely working URLs
  const connectionAttempts = [
    `ws://${ctiServerHost}:${ctiServerPort}/ws`,   // Primary: Non-SSL with port 8008
    `ws://${ctiServerHost}/ws`,                   // Fallback: Non-SSL without port
    `wss://${ctiServerHost}:${ctiServerPort}/ws`  // SSL fallback
  ];
  
  console.log('🔗 CTI connection attempt for user:', userAddress);
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('⏰ Connection timeout to CTI server');
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'error', status: 'timeout', message: 'Connection timeout to CTI server' })}\n\n`);
      res.end();
    }
  }, 15000);
  
  // Send initial connection status
  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to CTI server...' })}\n\n`);
  
  let currentAttempt = 0;
  let client = null;

  const tryConnection = (url) => {
    console.log(`🔄 Attempting connection ${currentAttempt + 1}/${connectionAttempts.length}: ${url}`);
    
    // Validate URL before creating client
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
        // console.log('STOMP Debug:', str);
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
        
        res.write(`data: ${JSON.stringify({ type: 'stomp_connected', message: 'STOMP connected' })}\n\n`);
        
        // Set up optimized subscriptions
        setupSubscriptions(client, res);
        
        // Request initial state
        client.publish({
          destination: '/app/request/initial-state',
          body: ''
        });
        
        console.log('📡 STOMP subscriptions established');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        res.write(`data: ${JSON.stringify({ type: 'stomp_error', message: frame.headers.message || 'STOMP error' })}\n\n`);
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
          
          if (!res.destroyed) {
            res.write(`data: ${JSON.stringify({ 
              type: 'error', 
              status: 'error', 
              message: `All WebSocket connection attempts failed`, 
              details: `Tried ${connectionAttempts.length} different URLs. Please check if the CTI server is running and accessible.`
            })}\n\n`);
            res.end();
          }
        }
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        res.write(`data: ${JSON.stringify({ type: 'connection', status: 'disconnected', message: 'CTI server disconnected', code: event.code, reason: event.reason })}\n\n`);
      }
    });

    // Activate the client
    client.activate();
  };

  // Start the first connection attempt
  tryConnection(connectionAttempts[0]);

  // Optimized cleanup handlers
  const cleanup = () => {
    console.log('🧹 Cleaning up SSE connection');
    clearTimeout(connectionTimeout);
    clearInterval(keepAlive);
    // Don't deactivate STOMP client here as it might be used by other SSE clients
    // The connection pool will handle cleanup of stale connections
  };

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔌 Request closed');
    cleanup();
  });

  // Handle response close
  res.on('close', () => {
    console.log('🔌 Response closed');
    cleanup();
  });

  // Handle response finish
  res.on('finish', () => {
    console.log('🔌 Response finished');
    cleanup();
  });

  // Handle response error
  res.on('error', (err) => {
    console.log('❌ Response error:', err);
    cleanup();
  });
}
