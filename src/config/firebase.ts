import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Get Firebase configuration from environment variables
const getFirebaseConfig = (): FirebaseConfig => {
  const config: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  // Validate required configuration
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  return config;
};

// Initialize Firebase app
let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = (): FirebaseApp | null => {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const config = getFirebaseConfig();

  // Only initialize if we have the minimum required config
  if (!config.apiKey || !config.projectId) {
    return null;
  }

  try {
    firebaseApp = initializeApp(config);
    return firebaseApp;
  } catch (error) {
    return null;
  }
};

// Get Firebase Messaging instance
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  // Return existing messaging instance if available
  if (messaging) {
    return messaging;
  }

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if messaging is supported
  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  // Wait for service worker to be ready (required for FCM)
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.ready;
    } catch (error) {
      // Service worker not ready, but continuing
    }
  }

  // Initialize Firebase app if not already initialized
  const app = initializeFirebase();
  if (!app) {
    return null;
  }

  try {
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    return null;
  }
};

// Helper function to safely get service worker registration with pushManager
const getServiceWorkerWithPushManager = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in globalThis)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Wait a bit to ensure service worker is fully active
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify pushManager exists and is accessible
    if (registration && 'pushManager' in registration && registration.pushManager) {
      // Test that pushManager is actually accessible
      try {
        // Just check if pushManager property exists and is not null/undefined
        if (registration.pushManager) {
          return registration;
        }
      } catch {
        // pushManager not accessible
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Get FCM token
export const getFCMToken = async (vapidKey: string): Promise<string | null> => {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
      return null;
    }

    // Get service worker registration with pushManager
    const serviceWorkerRegistration = await getServiceWorkerWithPushManager();

    // Build token options - only include serviceWorkerRegistration if valid
    const tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = {
      vapidKey: vapidKey,
      ...(serviceWorkerRegistration && { serviceWorkerRegistration }),
    };

    // Try to get token
    const token = await getToken(messagingInstance, tokenOptions);
    return token || null;
  } catch (error: unknown) {
    // If error is related to pushManager and we had a serviceWorkerRegistration, try without it
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('pushManager')) {
      try {
        const messagingInstance = await getFirebaseMessaging();
        if (messagingInstance) {
          const token = await getToken(messagingInstance, { vapidKey: vapidKey });
          return token || null;
        }
      } catch {
        // Still failed
      }
    }
    return null;
  }
};

// Set up continuous listener for foreground messages
export const setupOnMessageListener = async (
  callback: (payload: any) => void
): Promise<void> => {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (messagingInstance) {
      // onMessage is a continuous listener - it will call the callback for each message
      onMessage(messagingInstance, (payload) => {
        callback(payload);
      });
    }
  } catch (error) {
    console.error('[Firebase] Error setting up message listener:', error);
  }
};

// Legacy function for backward compatibility (deprecated - only handles one message)
export const onMessageListener = (): Promise<any> => {
  return new Promise((resolve) => {
    getFirebaseMessaging()
      .then((messagingInstance) => {
        if (messagingInstance) {
          onMessage(messagingInstance, (payload) => {
            resolve(payload);
          });
        }
      })
      .catch((error) => {
        resolve(null);
      });
  });
};

// Export Firebase app instance
export const getFirebaseApp = (): FirebaseApp | null => {
  return firebaseApp || initializeFirebase();
};

const firebaseExports = {
  initializeFirebase,
  getFirebaseMessaging,
  getFCMToken,
  setupOnMessageListener,
  onMessageListener,
  getFirebaseApp,
};

export default firebaseExports;

