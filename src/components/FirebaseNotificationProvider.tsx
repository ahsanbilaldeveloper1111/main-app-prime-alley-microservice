'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { initializeFirebase } from '@config/firebase';
import { useFCM } from '@hooks/useFCM';
import { useNotifications } from '../contexts/NotificationContext';
import fcmService, { NotificationPayload } from '@services/fcmService';
import { toast } from 'react-toastify';

interface FirebaseNotificationProviderProps {
  children: React.ReactNode;
  autoRegister?: boolean;
}

/**
 * Firebase Notification Provider
 * Initializes Firebase and manages FCM token lifecycle
 */
export const FirebaseNotificationProvider: React.FC<FirebaseNotificationProviderProps> = ({
  children,
  autoRegister = true,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const registeredTokenRef = useRef<string | null>(null);
  const attemptedTokenRef = useRef<string | null>(null); // Track attempted tokens (success or failure)
  const isRegisteringRef = useRef<boolean>(false);
  const registerTokenRef = useRef<(() => Promise<boolean>) | null>(null);
  const { addNotification } = useNotifications();
  // Disable auto-register and listener setup - we'll handle both manually
  const { token, isLoading, registerToken, isSupported, permission } = useFCM(false, false);
  
  // Store callbacks in refs to avoid dependency issues and stale closures
  const addNotificationRef = useRef(addNotification);
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);
  
  // Store registerToken in ref to avoid dependency issues
  useEffect(() => {
    registerTokenRef.current = registerToken;
  }, [registerToken]);

  useEffect(() => {
    // Initialize Firebase on client side only
    if (globalThis.window !== undefined) {
      try {
        const app = initializeFirebase();
        if (app) {
          setIsInitialized(true);
        }
      } catch {
        // Error initializing Firebase - silently fail
      }
    }
  }, []);

  // Function to send Firebase config to service worker
  const sendConfigToServiceWorker = async () => {
    if (globalThis.window === undefined || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      // Get Firebase config to pass to service worker
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      };

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Send config to all active service workers
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        });
        console.log('[FirebaseNotificationProvider] ✅ Firebase config sent to service worker');
      }

      // Also send to any waiting or installing workers
      if (registration.waiting) {
        registration.waiting.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        });
      }
      if (registration.installing) {
        registration.installing.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        });
      }
    } catch (error) {
      console.error('[FirebaseNotificationProvider] Error sending config to service worker:', error);
    }
  };

  useEffect(() => {
    // Register service worker for background notifications
    if (globalThis.window !== undefined && 'serviceWorker' in navigator && isInitialized) {
      const registerServiceWorker = async () => {
        try {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });

          // Wait for service worker to be ready
          const activeRegistration = await navigator.serviceWorker.ready;

          // Wait a bit to ensure service worker is fully initialized with push support
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify pushManager is available and accessible
          if (!activeRegistration || !('pushManager' in activeRegistration) || !activeRegistration.pushManager) {
            console.warn('[FirebaseNotificationProvider] PushManager not available');
            return;
          }

          // Send Firebase config to service worker
          await sendConfigToServiceWorker();

          // Listen for service worker updates and re-send config
          registration.addEventListener('updatefound', () => {
            console.log('[FirebaseNotificationProvider] Service worker update found, re-sending config');
            sendConfigToServiceWorker();
          });
        } catch (error) {
          console.error('[FirebaseNotificationProvider] Error registering service worker:', error);
        }
      };

      registerServiceWorker();
    }
  }, [isInitialized]);

  // Re-send config when tab becomes visible (handles background tab scenarios)
  useEffect(() => {
    if (globalThis.window === undefined || !isInitialized) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[FirebaseNotificationProvider] Tab became visible, ensuring service worker has config');
        sendConfigToServiceWorker();
        
        // Listen for messages from service worker about background notifications
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'BACKGROUND_NOTIFICATION') {
              console.log('[FirebaseNotificationProvider] Received background notification info from service worker');
              // The notification was already shown by the service worker
              // We could optionally add it to the context here if needed
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also send config periodically to ensure service worker always has it
    const configInterval = setInterval(() => {
      sendConfigToServiceWorker();
    }, 30000); // Every 30 seconds

    // Set up service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BACKGROUND_NOTIFICATION') {
          console.log('[FirebaseNotificationProvider] Background notification was shown by service worker');
        }
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(configInterval);
    };
  }, [isInitialized]);

  // Register token after user is authenticated
  useEffect(() => {
    // Reset when user logs out
    if (status === 'unauthenticated') {
      registeredTokenRef.current = null;
      attemptedTokenRef.current = null;
      isRegisteringRef.current = false;
      return;
    }

    // Only register if:
    // - auto-register is enabled
    // - user is authenticated
    // - we have a token
    // - not currently loading
    // - not already registering
    // - this token hasn't been attempted yet (prevents infinite retry loop)
    // - registerToken function is available
    if (
      autoRegister &&
      status === 'authenticated' &&
      session &&
      token &&
      !isLoading &&
      !isRegisteringRef.current &&
      attemptedTokenRef.current !== token && // Only try if this token hasn't been attempted
      registerTokenRef.current
    ) {
      isRegisteringRef.current = true;
      attemptedTokenRef.current = token; // Mark as attempted immediately to prevent retries
      
      registerTokenRef.current()
        .then((success) => {
          if (success) {
            registeredTokenRef.current = token;
          }
        })
        .catch(() => {
          // Error registering token after login - silently fail
        })
        .finally(() => {
          isRegisteringRef.current = false;
        });
    }
  }, [autoRegister, status, session, token, isLoading]);

  // Set up notification listener to add to context AND show notifications
  // The listener is set up once globally and persists across page navigations
  // We update the callback whenever addNotification changes to ensure it's always current
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    // Set up or update the listener callback
    // The listener itself persists across navigations, but we update the callback
    const setupListener = async () => {
      try {
        console.log('[FirebaseNotificationProvider] Setting up/updating foreground message listener...');
        await fcmService.setupForegroundMessageListener((payload: NotificationPayload) => {
          console.log('========== INCOMING NOTIFICATION ==========');
          console.log('Notification title:', payload.notification?.title || payload.data?.title);
          
          // Add notification to context (this will save to localStorage)
          // Use ref to get latest addNotification function
          try {
            addNotificationRef.current(payload);
            console.log('[FirebaseNotificationProvider] ✅ Notification added to context');
          } catch (error) {
            console.error('[FirebaseNotificationProvider] ❌ Error calling addNotification:', error);
          }
          
          // Also show toast notification
          const title = payload.notification?.title || payload.data?.title || 'New Notification';
          const body = payload.notification?.body || payload.data?.description || '';
          
          toast.info(body || title, {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Show browser notification if permission is granted
          if (globalThis.window !== undefined && 'Notification' in globalThis && globalThis.Notification.permission === 'granted') {
            try {
              const uniqueTag = payload.data?.tag || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              
              const notificationOptions: NotificationOptions = {
                body,
                tag: uniqueTag,
                data: payload.data,
              };

              // Only include icon if provided in payload (avoid 404 errors)
              if (payload.notification?.icon) {
                notificationOptions.icon = payload.notification.icon;
              }

              // Only include badge if provided in payload (avoid 404 errors)
              if (payload.notification?.badge) {
                notificationOptions.badge = payload.notification.badge;
              }

              new globalThis.Notification(title, notificationOptions);
            } catch (error) {
              console.error('[FirebaseNotificationProvider] Error showing browser notification:', error);
            }
          }
        });
        console.log('[FirebaseNotificationProvider] ✅ Listener callback updated');
      } catch (err) {
        console.error('[FirebaseNotificationProvider] Error setting up listener:', err);
      }
    };

    // Small delay to ensure Firebase is initialized
    const timeoutId = setTimeout(setupListener, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSupported, permission, addNotification]);

  // Monitor router events to ensure listener persists across navigation
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      console.log('[FirebaseNotificationProvider] Route change complete - listener should still be active');
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return <>{children}</>;
};

export default FirebaseNotificationProvider;

