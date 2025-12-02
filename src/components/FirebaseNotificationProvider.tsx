'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
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

  useEffect(() => {
    // Register service worker for background notifications
    if (globalThis.window !== undefined && 'serviceWorker' in navigator && isInitialized) {
      const registerServiceWorker = async () => {
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

          // Register service worker
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });

          // Wait for service worker to be ready
          const activeRegistration = await navigator.serviceWorker.ready;

          // Wait a bit to ensure service worker is fully initialized with push support
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify pushManager is available and accessible
          if (!activeRegistration || !('pushManager' in activeRegistration) || !activeRegistration.pushManager) {
            return;
          }

          // Pass Firebase config to service worker
          const activeWorker = activeRegistration.active;
          if (activeWorker) {
            activeWorker.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig,
            });
            
            // Wait a bit for service worker to process the config
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch {
          // Error registering service worker - silently fail
          // This can happen if service workers are not supported or blocked
        }
      };

      registerServiceWorker();
    }
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
  // Use ref for addNotification to avoid re-setting up listener when it changes
  const listenerSetupRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isSupported || permission !== 'granted' || listenerSetupRef.current) {
      return;
    }

    // Use setTimeout to ensure this listener is set up AFTER any other useFCM hooks
    // This ensures our listener (which saves to localStorage) is the active one
    // Since Firebase's onMessage replaces the previous listener, we want to be last
    const timeoutId = setTimeout(async () => {
      if (listenerSetupRef.current) {
        return; // Already set up
      }
      
      try {
        console.log('[FirebaseNotificationProvider] Setting up foreground message listener...');
        await fcmService.setupForegroundMessageListener((payload: NotificationPayload) => {
          console.log('[FirebaseNotificationProvider] Received foreground message:', payload);
          console.log('[FirebaseNotificationProvider] Calling addNotification...');
          
          // Add notification to context (this will save to localStorage)
          // Use ref to get latest addNotification function
          try {
            addNotificationRef.current(payload);
            console.log('[FirebaseNotificationProvider] addNotification called successfully');
          } catch (error) {
            console.error('[FirebaseNotificationProvider] Error calling addNotification:', error);
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
        listenerSetupRef.current = true;
        console.log('[FirebaseNotificationProvider] Listener set up successfully');
      } catch (err) {
        console.error('[FirebaseNotificationProvider] Error setting up listener:', err);
      }
    }, 500); // Small delay to ensure we're the last one to set up the listener

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSupported, permission]);

  return <>{children}</>;
};

export default FirebaseNotificationProvider;

