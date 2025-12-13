// src/pages/api/cti-stomp-stream.js
import { Client } from '@stomp/stompjs';

// Connection pool to reuse STOMP connections
const connectionPool = new Map();
// TEST MODE: Set to 2 minutes (120000ms) for local testing
// PRODUCTION: Set to 2.5 hours (9000000ms) - backend token expires in 3 hours
const CONNECTION_TIMEOUT = 9000000;//process.env.NODE_ENV === 'development' ? 120000 : 9000000; // 2 min (test) or 2.5 hours (prod)
const KEEP_ALIVE_INTERVAL = 4000; // 4 seconds

// Track which connections have subscriptions set up
const subscriptionsSetup = new Set();

// Track subscriptions per connection for proper cleanup
const connectionSubscriptions = new Map(); // connectionKey -> [sub1, sub2, sub3]

// Clean up subscriptions for a connection
const cleanupSubscriptions = (connectionKey) => {
  const subscriptions = connectionSubscriptions.get(connectionKey) || [];
  if (subscriptions.length > 0) {
    console.log(`🧹 Cleaning up ${subscriptions.length} subscription(s) for ${connectionKey}`);
  }
  subscriptions.forEach((sub, index) => {
    try {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
        console.log(`  ✅ Unsubscribed subscription ${index + 1} for ${connectionKey}`);
      }
    } catch (err) {
      console.error(`  ❌ Error unsubscribing subscription ${index + 1} for ${connectionKey}:`, err);
    }
  });
  connectionSubscriptions.delete(connectionKey);
  subscriptionsSetup.delete(connectionKey);
};

// Clean up stale connections
const cleanupStaleConnections = () => {
  const now = Date.now();
  for (const [key, connection] of connectionPool.entries()) {
    const age = now - connection.lastUsed;
    if (age > CONNECTION_TIMEOUT) {
      const ageMinutes = Math.floor(age / 60000);
      const timeoutMinutes = Math.floor(CONNECTION_TIMEOUT / 60000);
      console.log(`🧹 Cleaning up stale connection: ${key} (age: ${ageMinutes}min, timeout: ${timeoutMinutes}min)`);
      // Unsubscribe before deactivating to prevent orphaned subscriptions on backend
      cleanupSubscriptions(key);
      if (connection.client && connection.client.connected) {
        try {
          connection.client.deactivate();
        } catch (err) {
          console.error('Error deactivating client:', err);
        }
      }
      connectionPool.delete(key);
    }
  }
};

// Set up periodic cleanup
// TEST MODE: Check every 10 seconds for faster testing
// PRODUCTION: Check every 60 seconds
const CLEANUP_INTERVAL = process.env.NODE_ENV === 'development' ? 10000 : 60000;
setInterval(cleanupStaleConnections, CLEANUP_INTERVAL);

// Store SSE response streams for each connection
const sseStreams = new Map();

// Track reconnection attempts to prevent multiple simultaneous reconnections
const reconnectingConnections = new Set();

// Track backoff per connection to avoid reconnect thrashing
const reconnectBackoffMs = new Map(); // connectionKey -> ms (starts 1s, caps 10s)

// Track connections that need a fresh JWT before reconnecting
const authRequiredConnections = new Set();

// Simple auth error detector (mirrors frontend POC patterns)
const looksLikeAuthError = (message = '', body = '', reason = '') => {
  const s = `${message} ${body} ${reason}`.toLowerCase();
  return (
    s.includes('unauthorized') ||
    s.includes('expired') ||
    (s.includes('jwt') && (s.includes('invalid') || s.includes('exp'))) ||
    s.includes('authentication failed') ||
    (s.includes('auth') && s.includes('fail')) ||
    (s.includes('token') && (s.includes('invalid') || s.includes('expired')))
  );
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getBackoff = (connectionKey) => reconnectBackoffMs.get(connectionKey) || 1000;
const bumpBackoff = (connectionKey) => {
  const next = Math.min(getBackoff(connectionKey) * 2, 10000);
  reconnectBackoffMs.set(connectionKey, next);
  return next;
};
const resetBackoff = (connectionKey) => reconnectBackoffMs.set(connectionKey, 1000);

// Optimized subscription setup
const setupSubscriptions = (client, connectionKey) => {
  // Prevent duplicate subscriptions for the same connectionKey
  if (subscriptionsSetup.has(connectionKey)) {
    console.log('✅ Subscriptions already set up for connection:', connectionKey);
    return;
  }

  // Clean up any existing subscriptions first (defensive)
  cleanupSubscriptions(connectionKey);

  console.log('Setting up STOMP subscriptions for connection:', connectionKey);

  const subscriptions = [];

  
  // Subscribe to complete-state
  const sub1 = client.subscribe('/user/topic/complete-state', (message) => {
    console.log('STOMP complete-state message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];

      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed && !res.closed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'complete_state', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }

          } catch (error_) {
            // Remove destroyed streams from the list
            const streams = sseStreams.get(connectionKey) || [];
            const streamIndex = streams.indexOf(res);
            if (streamIndex > -1) {
              streams.splice(streamIndex, 1);
            }
          }
        } 
      });
    } catch (err) {
      console.error('Error parsing complete-state payload:', err);
    }
  });
  //console.log('Subscribed to complete-state with ID:', sub1.id);
  
  // Subscribe to dns-states
  const sub2 = client.subscribe('/user/topic/dns-states', (message) => {
    //console.log('STOMP dns-states message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];
      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed && !res.closed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'dns_states', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }

          } catch (error_) {
            console.error(`❌ Error writing to stream ${index + 1}:`, error_);
            // Remove destroyed streams from the list
            const streams = sseStreams.get(connectionKey) || [];
            const streamIndex = streams.indexOf(res);
            if (streamIndex > -1) {
              streams.splice(streamIndex, 1);
            }
          }
        } 
      });
    } catch (err) {
      console.error('Error parsing dns-states payload:', err);
    }
  });
  
  // Subscribe to call-events
  const sub3 = client.subscribe('/user/topic/call-events', (message) => {
    console.log('STOMP call-events message received');
    try {
      const payload = JSON.parse(message.body);
      const currentStreams = sseStreams.get(connectionKey) || [];
      
      currentStreams.forEach((res, index) => {
        if (!res.destroyed && !res.closed) {
          try {
            const sseData = `data: ${JSON.stringify({ type: 'call_events', data: payload })}\n\n`;
            res.write(sseData);
            if (res.flush) {
              res.flush();
            }

          } catch (error_) {
            console.error(`❌ Error writing to stream ${index + 1}:`, error_);
            // Remove destroyed streams from the list
            const streams = sseStreams.get(connectionKey) || [];
            const streamIndex = streams.indexOf(res);
            if (streamIndex > -1) {
              streams.splice(streamIndex, 1);
            }
          }
        }
      });
    } catch (err) {
      console.error('Error parsing call-events payload:', err);
    }
  });
  
  // Store all subscriptions for this connection
  subscriptions.push(sub1, sub2, sub3);
  connectionSubscriptions.set(connectionKey, subscriptions);
  
  // Mark subscriptions as set up
  subscriptionsSetup.add(connectionKey);
  
  console.log('✅ STOMP subscriptions set up for connection:', connectionKey);

};

// Handle POST requests for publishing STOMP messages
const handlePublishMessage = (req, res) => {
  const { token, userAddress, destination, body, screenId = 'default' } = req.body;
  
  if (!token || !userAddress || !destination) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: token, userAddress, destination' 
    });
  }
  
  const connectionKey = `${userAddress}:${screenId}`;
  let existingConnection = connectionPool.get(connectionKey);
  
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
  const { token, userAddress, screenId = 'default' } = req.query;
  
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
  // Note: Don't set Transfer-Encoding explicitly - let Node.js handle it automatically
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no'
  });

  const connectionKey = `${userAddress}:${screenId}`;
  
  // Check connection pool for existing connection
  let existingConnection = connectionPool.get(connectionKey);
  
  // Add this SSE stream to the connection's stream list BEFORE setting up subscriptions
  if (!sseStreams.has(connectionKey)) {
    sseStreams.set(connectionKey, []);
  }
  sseStreams.get(connectionKey).push(res);
 
  
  // Send keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    if (!res.destroyed && !res.closed) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
        if (res.flush) {
          res.flush();
        }
      } catch (err) {
        console.error('Error sending keep-alive ping:', err);
        clearInterval(keepAlive);
      }
    } else {
      clearInterval(keepAlive);
    }
  }, KEEP_ALIVE_INTERVAL);

  // If the token changed for this screen, restart the STOMP connection so CONNECT uses the latest JWT
  if (existingConnection && existingConnection.token && existingConnection.token !== token) {
    console.log(`🔄 Token changed for ${connectionKey}; restarting STOMP connection with fresh JWT`);
    authRequiredConnections.delete(connectionKey);
    reconnectingConnections.delete(connectionKey);
    try {
      cleanupSubscriptions(connectionKey);
      if (existingConnection.client && existingConnection.client.connected) {
        existingConnection.client.deactivate();
      }
    } catch (err) {
      console.error('Error restarting client for fresh JWT:', err);
    }
    connectionPool.delete(connectionKey);
    existingConnection = null;
  }

  // If we have an existing STOMP client, use it
  if (existingConnection && existingConnection.client && existingConnection.client.connected) {
    console.log('🔄 Reusing existing STOMP connection for user:', userAddress);
    existingConnection.lastUsed = Date.now();
    
    // Always ensure subscriptions are set up for reused connections
    // setupSubscriptions will clean up old subscriptions first if needed
    console.log('📡 Setting up subscriptions for reused connection:', connectionKey);
    setupSubscriptions(existingConnection.client, connectionKey);
    
    // Write connection message and flush
    try {
      const sseData = `data: ${JSON.stringify({ type: 'stomp_connected', message: 'STOMP connected' })}\n\n`;
      res.write(sseData);
      if (res.flush) {
        res.flush();
      }
      console.log('✅ Sent stomp_connected to new SSE stream');
    } catch (err) {
      console.error('Error writing stomp_connected message:', err);
    }
    
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
        // If no more SSE streams, clean up subscriptions and connection
        // This prevents orphaned subscriptions on the backend
       cleanupSubscriptions(connectionKey);
        let existingConnection = connectionPool.get(connectionKey);
        if (existingConnection && existingConnection.client) {
          try {
            if (existingConnection.client.connected) {
              existingConnection.client.deactivate();
            }
          } catch (err) {
            console.error('Error deactivating client during cleanup:', err);
          }
        }
        connectionPool.delete(connectionKey);
        reconnectingConnections.delete(connectionKey);
      }
    };
    
    req.on('aborted', () => {
      console.log('⚠️ Request aborted by client (existing connection)');
      cleanup();
    });

    req.on('close', () => {
      console.log('⚠️ Request closed by client (existing connection)');
      cleanup();
    });

    res.on('close', () => {
      console.log('⚠️ Response closed (existing connection)');
      cleanup();
    });

    res.on('finish', () => {
      console.log('⚠️ Response finished (existing connection)');
      cleanup();
    });

    res.on('error', (err) => {
      console.error('❌ Response error (existing connection):', err);
      cleanup();
    });
    
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
  
  console.log('===============================================');
  console.log('Creating new CTI STOMP connection for user:', userAddress);
  
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('⏰ Connection timeout to CTI server');
    if (!res.destroyed && !res.closed) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', status: 'timeout', message: 'Connection timeout to CTI server' })}\n\n`);
        // Don't call res.end() here - let the connection stay open for SSE
      } catch (err) {
        console.error('Error writing timeout message:', err);
      }
    }
  }, 15000);
  
  // Send initial connection message
  try {
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connecting', message: 'Connecting to CTI server...' })}\n\n`);
    if (res.flush) {
      res.flush();
    }
  } catch (err) {
    console.error('Error writing initial connection message:', err);
  }
  
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
      // Heartbeat configuration to keep WebSocket alive
      heartbeatIncoming: 4000,  // Expect heartbeat from server every 10 seconds
      heartbeatOutgoing: 4000,  // Send heartbeat to server every 10 seconds
      // Automatic reconnection configuration
      reconnectDelay: 0,         // We handle reconnect manually (with backoff)
      connectionTimeout: 10000,  // Connection timeout
      // Don't automatically deactivate on close - we'll handle reconnection manually
      forceBinaryWSFrames: false,
      appendMissingNULL: false,
      debug: (str) => {
        // Disable debug logging for production
      },
      onConnect: (frame) => {
        console.log('STOMP Connected successfully for user:', userAddress);
        clearTimeout(connectionTimeout);
        // Successful connect: reset backoff and clear auth-required state
        resetBackoff(connectionKey);
        authRequiredConnections.delete(connectionKey);
        
        // Clear reconnection flag if it was set
        reconnectingConnections.delete(connectionKey);
        
        // Clear old subscriptions setup flag to ensure fresh subscriptions are set up
        // This is important after reconnection
        subscriptionsSetup.delete(connectionKey);
        
        // Add to connection pool
        connectionPool.set(connectionKey, {
          client,
          lastUsed: Date.now(),
          userAddress,
          token
        });
        
        // Set up subscriptions (this will use the streams already added)
        setupSubscriptions(client, connectionKey);
        
        // Notify all SSE streams
        const streams = sseStreams.get(connectionKey) || [];
        console.log(`📤 Notifying ${streams.length} SSE stream(s) of STOMP connection`);
        streams.forEach((stream, index) => {
          if (!stream.destroyed && !stream.closed) {
            try {
              const sseData = `data: ${JSON.stringify({ type: 'stomp_connected', message: 'STOMP connected' })}\n\n`;
              stream.write(sseData);
              if (stream.flush) {
                stream.flush();
              }
              console.log(`✅ Sent stomp_connected to stream ${index + 1}`);
            } catch (error_) {
              console.error(`❌ Error writing stomp_connected to stream ${index + 1}:`, error_);
              // Remove destroyed streams from the list
              const streamIndex = streams.indexOf(stream);
              if (streamIndex > -1) {
                streams.splice(streamIndex, 1);
              }
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
      onStompError: async (frame) => {
        console.error('STOMP Error:', frame);
        const msg = frame?.headers?.message || 'STOMP error';
        const body = frame?.body || '';
        const isAuth = looksLikeAuthError(msg, body);

        const streams = sseStreams.get(connectionKey) || [];

        if (isAuth) {
          // Mark connection as requiring a fresh JWT and stop reconnect thrash
          authRequiredConnections.add(connectionKey);

          // Clean up and drop the current client so we don't loop with an expired token
          try { cleanupSubscriptions(connectionKey); } catch {}
          try { await client.deactivate(); } catch {}

          if (connectionPool.has(connectionKey)) {
            connectionPool.delete(connectionKey);
          }
          reconnectingConnections.delete(connectionKey);

          // Notify clients to refresh token and re-open SSE (or hit this endpoint again with a fresh token)
          streams.forEach(stream => {
            if (!stream.destroyed && !stream.closed) {
              try {
                stream.write(`data: ${JSON.stringify({
                  type: 'connection',
                  status: 'auth_required',
                  message: 'Authentication expired/invalid. Refresh JWT and reconnect.',
                  preserveState: true
                })}

`);
                if (stream.flush) stream.flush();
              } catch (err) {
                console.error('Error writing auth_required to stream:', err);
              }
            }
          });

          return;
        }

        // Non-auth errors: report and let onWebSocketClose drive reconnection
        streams.forEach(stream => {
          if (!stream.destroyed && !stream.closed) {
            try {
              stream.write(`data: ${JSON.stringify({ type: 'stomp_error', message: msg })}

`);
              if (stream.flush) stream.flush();
            } catch (err) {
              console.error('Error writing stomp_error to stream:', err);
            }
          }
        });

        console.error(`STOMP Error details: ${msg}`);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        
        // Clean up subscriptions when WebSocket closes to prevent orphaned subscriptions
        cleanupSubscriptions(connectionKey);
        
        // Remove from connection pool if it was closed
        let existingConnection = connectionPool.get(connectionKey);
        if (existingConnection && existingConnection.client === client) {
          connectionPool.delete(connectionKey);
        }
        
        const streams = sseStreams.get(connectionKey) || [];

        // Detect auth-related closes (expired/invalid JWT). In this case, do NOT auto-reconnect with the same token.
        const isAuthClose =
          event?.code === 1008 ||
          event?.code === 1002 ||
          looksLikeAuthError('', '', event?.reason || '');

        if (streams.length > 0) {
          if (isAuthClose) {
            authRequiredConnections.add(connectionKey);
            reconnectingConnections.delete(connectionKey);

            streams.forEach(stream => {
              if (!stream.destroyed && !stream.closed) {
                try {
                  stream.write(`data: ${JSON.stringify({
                    type: 'connection',
                    status: 'auth_required',
                    message: 'Authentication expired/invalid. Refresh JWT and reconnect.',
                    code: event.code,
                    reason: event.reason,
                    preserveState: true
                  })}\n\n`);
                  if (stream.flush) stream.flush();
                } catch (err) {
                  console.error('Error writing auth_required message to stream:', err);
                }
              }
            });

            return;
          }

          // If auth refresh is required, wait until a new SSE call arrives with a fresh token.
          if (authRequiredConnections.has(connectionKey)) {
            console.log(`⚠️ Auth refresh required for ${connectionKey}; skipping auto-reconnect.`);
            return;
          }

          // Avoid multiple simultaneous attempts
          if (reconnectingConnections.has(connectionKey)) {
            console.log(`⚠️ Reconnection already in progress for: ${connectionKey}`);
            return;
          }

          console.log(`🔄 WebSocket closed (code: ${event.code}), scheduling reconnect...`);

          reconnectingConnections.add(connectionKey);

          const delay = getBackoff(connectionKey);

          // Notify streams about reconnection (use 'reconnecting' status to preserve state)
          streams.forEach(stream => {
            if (!stream.destroyed && !stream.closed) {
              try {
                stream.write(`data: ${JSON.stringify({
                  type: 'connection',
                  status: 'reconnecting',
                  message: 'Reconnecting to CTI server...',
                  code: event.code,
                  reason: event.reason,
                  preserveState: true,
                  retryInMs: delay
                })}\n\n`);
                if (stream.flush) stream.flush();
              } catch (err) {
                console.error('Error writing reconnect message to stream:', err);
              }
            }
          });

          // Exponential backoff for next attempt if this one fails again
          bumpBackoff(connectionKey);

          setTimeout(() => {
            const currentStreams = sseStreams.get(connectionKey) || [];
            if (currentStreams.length > 0 && !connectionPool.has(connectionKey) && !authRequiredConnections.has(connectionKey)) {
              console.log(`🔄 Attempting to reconnect WebSocket for connection: ${connectionKey} (fresh attempt)`);
              currentAttempt = 0;
              tryConnection(connectionAttempts[0]);
            } else {
              console.log('⚠️ No active streams, auth required, or connection already exists; skipping reconnection');
              reconnectingConnections.delete(connectionKey);
            }
          }, delay);
        }      }
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
      // If no more SSE streams, clean up subscriptions and connection
      // This prevents orphaned subscriptions on the backend
      cleanupSubscriptions(connectionKey);
      let existingConnection = connectionPool.get(connectionKey);
      if (existingConnection && existingConnection.client) {
        try {
          if (existingConnection.client.connected) {
            existingConnection.client.deactivate();
          }
        } catch (err) {
          console.error('Error deactivating client during cleanup:', err);
        }
      }
      connectionPool.delete(connectionKey);
      reconnectingConnections.delete(connectionKey);
    }
  };

  // Handle request abort (client disconnected)
  req.on('aborted', () => {
    console.log('⚠️ Request aborted by client');
    cleanup();
  });

  req.on('close', () => {
    console.log('⚠️ Request closed by client');
    cleanup();
  });

  res.on('close', () => {
    console.log('⚠️ Response closed');
    cleanup();
  });

  res.on('finish', () => {
    console.log('⚠️ Response finished');
    cleanup();
  });

  res.on('error', (err) => {
    console.error('❌ Response error:', err);
    cleanup();
  });
}

