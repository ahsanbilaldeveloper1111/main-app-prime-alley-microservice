// src/pages/api/cti-stomp-stream.js
import { Client } from '@stomp/stompjs';

// Connection pool to reuse STOMP connections
const connectionPool = new Map();
const CONNECTION_TIMEOUT = 9000000; // 2.5 hours
const KEEP_ALIVE_INTERVAL = 4000; // 30 seconds

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

// Track reconnection attempts to prevent multiple simultaneous reconnections
const reconnectingConnections = new Set();

// Optimized subscription setup
const setupSubscriptions = (client, connectionKey) => {
  // Always set up subscriptions - even if they were set up before, they might have been lost
  // during reconnection. The STOMP client will handle duplicate subscriptions gracefully.
  console.log('Setting up STOMP subscriptions for connection:', connectionKey);
  const streams = sseStreams.get(connectionKey) || [];
  
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

  
  // Mark subscriptions as set up
  subscriptionsSetup.add(connectionKey);
  
  console.log('✅ STOMP subscriptions set up for connection:', connectionKey);

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

  const connectionKey = `${userAddress}-${token.substring(0, 20)}`;
  
  // Check connection pool for existing connection
  const existingConnection = connectionPool.get(connectionKey);
  
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

  // If we have an existing STOMP client, use it
  if (existingConnection && existingConnection.client && existingConnection.client.connected) {
    console.log('🔄 Reusing existing STOMP connection for user:', userAddress);
    existingConnection.lastUsed = Date.now();
    
    // Always ensure subscriptions are set up for reused connections
    // Clear the flag first to force fresh subscription setup
    subscriptionsSetup.delete(connectionKey);
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
      reconnectDelay: 5000,      // Wait 5 seconds before reconnecting
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
        
        // Clear reconnection flag if it was set
        reconnectingConnections.delete(connectionKey);
        
        // Clear old subscriptions setup flag to ensure fresh subscriptions are set up
        // This is important after reconnection
        subscriptionsSetup.delete(connectionKey);
        
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
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        const streams = sseStreams.get(connectionKey) || [];
        streams.forEach(stream => {
          if (!stream.destroyed && !stream.closed) {
            try {
              stream.write(`data: ${JSON.stringify({ type: 'stomp_error', message: frame.headers.message || 'STOMP error' })}\n\n`);
              if (stream.flush) {
                stream.flush();
              }
            } catch (err) {
              console.error('Error writing STOMP error to stream:', err);
            }
          }
        });
        
        // Attempt to reconnect like a fresh page
        if (streams.length > 0) {
          // Check if already reconnecting to avoid multiple simultaneous attempts
          if (reconnectingConnections.has(connectionKey)) {
            console.log(`⚠️ Reconnection already in progress for: ${connectionKey}`);
            return;
          }
          
          console.log(`🔄 STOMP error occurred, will attempt to reconnect like a fresh page...`);
          
          // Mark as reconnecting
          reconnectingConnections.add(connectionKey);
          
          // Remove from connection pool
          const existingConnection = connectionPool.get(connectionKey);
          if (existingConnection && existingConnection.client === client) {
            connectionPool.delete(connectionKey);
            subscriptionsSetup.delete(connectionKey);
            if (client) {
              try {
                client.deactivate();
              } catch (err) {
                console.error('Error deactivating client:', err);
              }
            }
          }
          
          // Notify streams about reconnection
          streams.forEach(stream => {
            if (!stream.destroyed && !stream.closed) {
              try {
                stream.write(`data: ${JSON.stringify({ 
                  type: 'connection', 
                  status: 'reconnecting', 
                  message: 'Reconnecting to CTI server after STOMP error...', 
                  preserveState: true
                })}\n\n`);
                if (stream.flush) {
                  stream.flush();
                }
              } catch (err) {
                console.error('Error writing reconnect message to stream:', err);
              }
            }
          });
          
          // Attempt to reconnect after a delay - reset and try all connection attempts
          setTimeout(() => {
            const currentStreams = sseStreams.get(connectionKey) || [];
            if (currentStreams.length > 0 && !connectionPool.has(connectionKey)) {
              console.log(`🔄 Attempting to reconnect after STOMP error for connection: ${connectionKey}`);
              // Reset connection attempt counter for reconnection (like a fresh page)
              currentAttempt = 0;
              // Create a new client and try all connection attempts
              tryConnection(connectionAttempts[0]);
            } else {
              console.log('⚠️ No active streams or connection already exists, skipping reconnection');
              reconnectingConnections.delete(connectionKey);
            }
          }, 3000);
        }
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error.message);
        
        // Try next connection attempt
        currentAttempt++;
        if (currentAttempt < connectionAttempts.length) {
          console.log(`❌ Connection failed, trying next attempt...`);
          setTimeout(() => {
            if (client) {
              try {
                client.deactivate();
              } catch (err) {
                console.error('Error deactivating client:', err);
              }
            }
            tryConnection(connectionAttempts[currentAttempt]);
          }, 1000);
        } else {
          console.error('❌ All connection attempts failed, will retry like a fresh page...');
          
          const streams = sseStreams.get(connectionKey) || [];
          
          // If there are active streams, attempt to reconnect like a fresh page
          if (streams.length > 0) {
            // Check if already reconnecting to avoid multiple simultaneous attempts
            if (reconnectingConnections.has(connectionKey)) {
              console.log(`⚠️ Reconnection already in progress for: ${connectionKey}`);
              return;
            }
            
            // Mark as reconnecting
            reconnectingConnections.add(connectionKey);
            
            // Remove from connection pool
            const existingConnection = connectionPool.get(connectionKey);
            if (existingConnection && existingConnection.client === client) {
              connectionPool.delete(connectionKey);
              subscriptionsSetup.delete(connectionKey);
            }
            
            // Notify streams about reconnection
            streams.forEach(stream => {
              if (!stream.destroyed && !stream.closed) {
                try {
                  stream.write(`data: ${JSON.stringify({ 
                    type: 'connection', 
                    status: 'reconnecting', 
                    message: 'Reconnecting to CTI server after connection error...', 
                    preserveState: true
                  })}\n\n`);
                  if (stream.flush) {
                    stream.flush();
                  }
                } catch (err) {
                  console.error('Error writing reconnect message to stream:', err);
                }
              }
            });
            
            // Attempt to reconnect after a delay - reset and try all connection attempts like a fresh page
            setTimeout(() => {
              const currentStreams = sseStreams.get(connectionKey) || [];
              if (currentStreams.length > 0 && !connectionPool.has(connectionKey)) {
                console.log(`🔄 Attempting to reconnect after all connection attempts failed for: ${connectionKey}`);
                // Reset connection attempt counter for reconnection (like a fresh page)
                currentAttempt = 0;
                // Create a new client and try all connection attempts again
                tryConnection(connectionAttempts[0]);
              } else {
                console.log('⚠️ No active streams or connection already exists, skipping reconnection');
                reconnectingConnections.delete(connectionKey);
              }
            }, 3000);
          } else {
            // No active streams, just clean up
            clearTimeout(connectionTimeout);
            clearInterval(keepAlive);
            reconnectingConnections.delete(connectionKey);
            
            streams.forEach(stream => {
              if (!stream.destroyed && !stream.closed) {
                try {
                  stream.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    status: 'error', 
                    message: `All WebSocket connection attempts failed`, 
                    details: `Tried ${connectionAttempts.length} different URLs. Please check if the CTI server is running and accessible.`
                  })}\n\n`);
                } catch (err) {
                  console.error('Error writing error message to stream:', err);
                }
              }
            });
          }
        }
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        
        // Remove from connection pool if it was closed
        const existingConnection = connectionPool.get(connectionKey);
        if (existingConnection && existingConnection.client === client) {
          connectionPool.delete(connectionKey);
          subscriptionsSetup.delete(connectionKey);
        }
        
        const streams = sseStreams.get(connectionKey) || [];
        
        // If there are active streams, always attempt to reconnect (even for code 1000)
        // This ensures the connection stays alive as long as the user is on the page
        if (streams.length > 0) {
          // Check if already reconnecting to avoid multiple simultaneous attempts
          if (reconnectingConnections.has(connectionKey)) {
            console.log(`⚠️ Reconnection already in progress for: ${connectionKey}`);
            return;
          }
          
          console.log(`🔄 WebSocket closed (code: ${event.code}), will attempt to reconnect like a fresh page...`);
          
          // Mark as reconnecting
          reconnectingConnections.add(connectionKey);
          
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
                  preserveState: true  // Signal to client to preserve existing state
                })}\n\n`);
                if (stream.flush) {
                  stream.flush();
                }
              } catch (err) {
                console.error('Error writing reconnect message to stream:', err);
              }
            }
          });
          
          // Attempt to reconnect after a delay - reset and try all connection attempts like a fresh page
          setTimeout(() => {
            // Check if there are still active streams before reconnecting
            const currentStreams = sseStreams.get(connectionKey) || [];
            if (currentStreams.length > 0 && !connectionPool.has(connectionKey)) {
              console.log(`🔄 Attempting to reconnect WebSocket for connection: ${connectionKey} (like a fresh page)`);
              // Reset connection attempt counter for reconnection (like a fresh page)
              currentAttempt = 0;
              // Create a new client and try all connection attempts again
              tryConnection(connectionAttempts[0]);
            } else {
              console.log('⚠️ No active streams or connection already exists, skipping reconnection');
              reconnectingConnections.delete(connectionKey);
            }
          }, 3000); // Wait 3 seconds before reconnecting
        }
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

