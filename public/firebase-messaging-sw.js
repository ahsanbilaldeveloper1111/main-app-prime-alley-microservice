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
    return;
  }

  const messaging = getMessagingInstance();
  if (messaging) {
    messaging.onBackgroundMessage((payload) => {
      handleBackgroundMessage(payload);
    });
    backgroundMessageHandlerSetup = true;
  }
}

// Listen for Firebase config from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (initializeFirebase()) {
      setupBackgroundMessageHandler();
    }
  }
});

// Try to initialize on service worker activation
self.addEventListener('activate', () => {
  // If config is already available, initialize
  if (firebaseConfig) {
    if (initializeFirebase()) {
      setupBackgroundMessageHandler();
    }
  }
});

function handleBackgroundMessage(payload) {
  console.log('[Service Worker] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  
  // Generate unique tag if not provided to ensure each notification is shown separately
  // Use timestamp + random to ensure uniqueness
  const uniqueTag = payload.data?.tag || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const notificationOptions = {
    body: payload.notification?.body || '',
    image: payload.notification?.image,
    data: payload.data || {},
    tag: uniqueTag,
    requireInteraction: payload.data?.requireInteraction === 'true',
    silent: payload.data?.silent === 'true',
  };

  // Only include icon if provided in payload (avoid 404 errors)
  if (payload.notification?.icon) {
    notificationOptions.icon = payload.notification.icon;
  }

  // Only include badge if provided in payload (avoid 404 errors)
  if (payload.notification?.badge) {
    notificationOptions.badge = payload.notification.badge;
  }

  console.log('[Service Worker] Showing notification with tag:', uniqueTag, notificationOptions);
  
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[Service Worker] Notification shown successfully');
    })
    .catch((error) => {
      console.error('[Service Worker] Error showing notification:', error);
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

