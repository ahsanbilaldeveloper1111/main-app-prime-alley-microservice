/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Store Firebase config (will be set via message from main thread)
let firebaseConfig = null;
let messagingInstance = null;
let backgroundMessageHandlerSetup = false;

// Initialize Firebase function
function initializeFirebase() {
  if (!firebaseConfig) {
    return false;
  }

  try {
    // Check if Firebase is already initialized
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      return true;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Get Firebase Messaging instance
function getMessagingInstance() {
  try {
    if (messagingInstance) {
      return messagingInstance;
    }
    
    if (firebase.apps && firebase.apps.length > 0) {
      messagingInstance = firebase.messaging();
      return messagingInstance;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Set up background message handler when Firebase is initialized
function setupBackgroundMessageHandler() {
  if (backgroundMessageHandlerSetup) {
    //console.log('[Service Worker] Background message handler already set up');
    return;
  }

  const messaging = getMessagingInstance();
  if (messaging) {
    try {
      messaging.onBackgroundMessage((payload) => {
        console.log('[Service Worker] Background message received:', payload);
        handleBackgroundMessage(payload);
      });
      backgroundMessageHandlerSetup = true;
      console.log('[Service Worker] ✅ Background message handler set up successfully');
    } catch (error) {
      console.error('[Service Worker] Error setting up background message handler:', error);
      backgroundMessageHandlerSetup = false;
    }
  } else {
    console.warn('[Service Worker] Messaging instance not available for background handler');
  }
}

// Listen for Firebase config from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
   // console.log('[Service Worker] Received Firebase config from main thread');
    firebaseConfig = event.data.config;
    if (initializeFirebase()) {
      //console.log('[Service Worker] Firebase initialized, setting up background message handler');
      setupBackgroundMessageHandler();
    } else {
      console.error('[Service Worker] Failed to initialize Firebase');
    }
  }
});

// Try to initialize on service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Service worker activated');
  // If config is already available, initialize
  if (firebaseConfig) {
    console.log('[Service Worker] Config available, initializing Firebase');
    if (initializeFirebase()) {
      setupBackgroundMessageHandler();
    }
  } else {
    console.log('[Service Worker] Waiting for Firebase config from main thread');
  }
  // Ensure service worker takes control immediately
  event.waitUntil(self.clients.claim());
});

function handleBackgroundMessage(payload) {
  console.log('[Service Worker] ========== BACKGROUND NOTIFICATION ==========');
  console.log('[Service Worker] Received background message:', payload);
  console.log('[Service Worker] Notification title:', payload.notification?.title || payload.data?.title);
  console.log('[Service Worker] Notification body:', payload.notification?.body || payload.data?.description);
  console.log('[Service Worker] Message ID:', payload.messageId);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  
  // Generate unique tag if not provided to ensure each notification is shown separately
  // Use timestamp + random to ensure uniqueness
  const uniqueTag = payload.data?.tag || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  console.log('[Service Worker] Generated unique tag:', uniqueTag);
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.description || '',
    image: payload.notification?.image,
    data: payload.data || {},
    tag: uniqueTag,
    requireInteraction: payload.data?.requireInteraction === 'true',
    silent: payload.data?.silent === 'true',
  };

  // Only include icon if provided in payload (avoid 404 errors)
  if (payload.notification?.icon) {
    notificationOptions.icon = payload.notification.icon;
    //console.log('[Service Worker] Notification icon:', payload.notification.icon);
  }

  // Only include badge if provided in payload (avoid 404 errors)
  if (payload.notification?.badge) {
    notificationOptions.badge = payload.notification.badge;
    //console.log('[Service Worker] Notification badge:', payload.notification.badge);
  }

  console.log('[Service Worker] Notification options:', notificationOptions);
  console.log('[Service Worker] Showing notification with title:', notificationTitle);
  
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[Service Worker] ✅ Notification shown successfully');
      console.log('🔔 [Service Worker] ============================================');
    })
    .catch((error) => {
      console.error('[Service Worker] ❌ Error showing notification:', error);
      console.log('🔔 [Service Worker] ============================================');
    });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL from the notification data or use a default
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

