// test-cti-socket.js
// Test CTI socket connection to verify it's working

const { Client } = require('@stomp/stompjs');

// Configuration
const CTI_SERVER_HOST = process.env.NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL || '192.168.39.53';
const CTI_SERVER_PORT = process.env.CTI_SERVER_PORT || '8008';
const WEBSOCKET_PROTOCOL = process.env.WEBSOCKET_PROTOCOL || 'ws';

// Test token and user address
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyQWRkcmVzcyI6IjUxMiIsInN1YiI6IjUxMiIsImlzcyI6InNlbGYiLCJuYW1lIjoicHJpbWVjdGkiLCJpZCI6ImMyNWJmODQwLWFkYzctNDdmNy05YWUwLTYzMDk2MWQ4YzY5OCIsImV4cCI6MTc1ODUzNTk3NSwiaWF0IjoxNzU4NTI1MTc1LCJhdXRob3JpdGllcyI6WyJST0xFX0NMSUVOVCJdfQ.BFUY5rTTFg2ea4Hd9VQTL09c3yz3mKj3ttyvX2VX7RU';
const TEST_USER_ADDRESS = '512';

// WebSocket URL
const WEBSOCKET_URL = `${WEBSOCKET_PROTOCOL}://${CTI_SERVER_HOST}:${CTI_SERVER_PORT}/ws`;

console.log('🧪 CTI Socket Connection Test');
console.log('============================');
console.log('Configuration:', {
  host: CTI_SERVER_HOST,
  port: CTI_SERVER_PORT,
  protocol: WEBSOCKET_PROTOCOL,
  websocketUrl: WEBSOCKET_URL,
  userAddress: TEST_USER_ADDRESS
});
console.log('');

let client = null;
let eventCount = 0;
let subscriptionCount = 0;
let eventTypes = {
  complete_state: 0,
  dns_states: 0,
  call_events: 0,
  other: 0
};

// Test connection
const testConnection = () => {
  console.log('🚀 Starting CTI connection test...');
  console.log(`🔗 Connecting to: ${WEBSOCKET_URL}`);
  
  client = new Client({
    brokerURL: WEBSOCKET_URL,
    connectHeaders: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'user-address': TEST_USER_ADDRESS
    },
    debug: (str) => {
      console.log('STOMP Debug:', str);
    },
    onConnect: (frame) => {
      console.log('✅ STOMP Connected successfully!');
      console.log('📡 Setting up subscriptions...');
      
      // Subscribe to complete-state
      const sub1 = client.subscribe('/user/topic/complete-state', (message) => {
        eventCount++;
        eventTypes.complete_state++;
        console.log(`📨 [${eventCount}] Complete-state event received:`);
        console.log('   Body length:', message.body.length);
        console.log('   Timestamp:', new Date().toISOString());
        try {
          const data = JSON.parse(message.body);
          console.log('   Data preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } catch (err) {
          console.log('   Raw body:', message.body.substring(0, 200) + '...');
        }
        console.log('   ---');
      });
      subscriptionCount++;
      console.log(`✅ Subscription ${subscriptionCount}: complete-state (ID: ${sub1.id})`);
      
      // Subscribe to dns-states
      const sub2 = client.subscribe('/user/topic/dns-states', (message) => {
        eventCount++;
        eventTypes.dns_states++;
        console.log(`📨 [${eventCount}] DNS-states event received:`);
        console.log('   Body length:', message.body.length);
        console.log('   Timestamp:', new Date().toISOString());
        try {
          const data = JSON.parse(message.body);
          console.log('   Data preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } catch (err) {
          console.log('   Raw body:', message.body.substring(0, 200) + '...');
        }
        console.log('   ---');
      });
      subscriptionCount++;
      console.log(`✅ Subscription ${subscriptionCount}: dns-states (ID: ${sub2.id})`);
      
      // Subscribe to call-events
      const sub3 = client.subscribe('/user/topic/call-events', (message) => {
        eventCount++;
        eventTypes.call_events++;
        console.log(`📨 [${eventCount}] Call-events event received:`);
        console.log('   Body length:', message.body.length);
        console.log('   Timestamp:', new Date().toISOString());
        try {
          const data = JSON.parse(message.body);
          console.log('   Data preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } catch (err) {
          console.log('   Raw body:', message.body.substring(0, 200) + '...');
        }
        console.log('   ---');
      });
      subscriptionCount++;
      console.log(`✅ Subscription ${subscriptionCount}: call-events (ID: ${sub3.id})`);
      
      // Request initial state
      console.log('📤 Requesting initial state...');
      client.publish({
        destination: '/app/request/initial-state',
        body: ''
      });
      
      console.log('✅ All subscriptions active. Listening for events...');
      console.log('Press Ctrl+C to stop');
    },
    onStompError: (frame) => {
      console.error('❌ STOMP Error:', frame);
      console.error('Error details:', {
        command: frame.command,
        headers: frame.headers,
        body: frame.body
      });
    },
    onWebSocketError: (error) => {
      console.error('❌ WebSocket Error:', error);
      console.error('Error details:', {
        type: error.type,
        message: error.message,
        target: error.target?.url,
        readyState: error.target?.readyState
      });
    },
    onWebSocketClose: (event) => {
      console.log('🔌 WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
    }
  });

  // Activate the client
  client.activate();
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test...');
  if (client && client.connected) {
    client.deactivate();
  }
  console.log(`📊 Test Summary:`);
  console.log(`   - Total events received: ${eventCount}`);
  console.log(`   - Active subscriptions: ${subscriptionCount}`);
  console.log(`   - Event breakdown:`);
  console.log(`     • Complete-state events: ${eventTypes.complete_state}`);
  console.log(`     • DNS-states events: ${eventTypes.dns_states}`);
  console.log(`     • Call-events events: ${eventTypes.call_events}`);
  console.log(`     • Other events: ${eventTypes.other}`);
  console.log('👋 Test completed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the test
testConnection();
