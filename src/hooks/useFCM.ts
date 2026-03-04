import { useState, useEffect, useCallback, useRef } from 'react';
import fcmService, { FCMTokenResponse, NotificationPayload } from '@services/fcmService';
import notificationAPI from '@services/notificationApi';
import { toast } from 'react-toastify';

export interface UseFCMReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  refreshToken: () => Promise<void>;
  registerToken: () => Promise<boolean>;
  unregisterToken: () => Promise<boolean>;
}

/**
 * Custom hook for managing FCM tokens and notifications
 * @param autoRegister - Whether to automatically register token with backend
 * @param setupListener - Whether to set up foreground message listener (default: true)
 */
export const useFCM = (autoRegister: boolean = true, setupListener: boolean = true): UseFCMReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const registrationAttempted = useRef<boolean>(false);
  const tokenRegistered = useRef<boolean>(false);

  // Check if FCM is supported
  useEffect(() => {
    setIsSupported(fcmService.isSupported());
    setPermission(fcmService.getPermissionStatus());
  }, []);

  // Initialize FCM and get token
  const initializeFCM = useCallback(async () => {
    if (!fcmService.isSupported()) {
      setError('FCM is not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait for service worker to be ready
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (error) {
          // Service worker not ready
        }
      }

      // Request permission if needed
      const currentPermission = fcmService.getPermissionStatus();
      
      if (currentPermission === 'default') {
        const newPermission = await fcmService.requestPermission();
        setPermission(newPermission);

        if (newPermission !== 'granted') {
          setError(`Notification permission is ${newPermission}`);
          setIsLoading(false);
          return;
        }
      } else {
        setPermission(currentPermission);
        if (currentPermission !== 'granted') {
          setError(`Notification permission is ${currentPermission}`);
          setIsLoading(false);
          return;
        }
      }

      // Get FCM token
      const tokenResponse: FCMTokenResponse = await fcmService.getToken();

      if (tokenResponse.success && tokenResponse.token) {
        setToken(tokenResponse.token);
        setError(null);

        // Auto-register token if enabled
        if (autoRegister && !tokenRegistered.current) {
          await registerTokenWithBackend(tokenResponse.token);
        }
      } else {
        const errorMsg = tokenResponse.error || 'Failed to get FCM token';
        setError(errorMsg);
        setToken(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoRegister]);

  // Register token with backend
  const registerTokenWithBackend = useCallback(async (fcmToken: string): Promise<boolean> => {
    if (tokenRegistered.current) {
      return true;
    }

    try {
      const response = await notificationAPI.registerToken(fcmToken);
      if (response.success) {
        tokenRegistered.current = true;
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }, []);

  // Initialize on mount - wait a bit for service worker to be ready
  useEffect(() => {
    if (!registrationAttempted.current && isSupported) {
      registrationAttempted.current = true;
      
      // Wait for service worker to be registered (if available)
      const initWithDelay = async () => {
        if ('serviceWorker' in navigator) {
          try {
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            // Add a small delay to ensure everything is set up
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            // Service worker not available, continuing anyway
          }
        }
        initializeFCM();
      };
      
      initWithDelay();
    }
  }, [isSupported, initializeFCM]);

  // Set up foreground message listener
  useEffect(() => {
    if (!setupListener || !isSupported || permission !== 'granted') {
      return;
    }

    const setupMessageListener = async () => {
      try {
        await fcmService.setupForegroundMessageListener((payload: NotificationPayload) => {
          //console.log('[FCM] Received foreground message:', payload);
          
          // Handle foreground notification
          const title = payload.notification?.title || 'New Notification';
          const body = payload.notification?.body || '';

          // Show toast notification
          // toast.info(body, {
          //   position: 'top-right',
          //   autoClose: 5000,
          //   hideProgressBar: false,
          //   closeOnClick: true,
          //   pauseOnHover: true,
          //   draggable: true,
          // });

          // You can also show a browser notification
          if (Notification.permission === 'granted') {
            // Generate unique tag if not provided to ensure each notification is shown separately
            // Use timestamp + random to ensure uniqueness
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

            //console.log('[FCM] Showing notification with tag:', uniqueTag, notificationOptions);
            
            try {
              new Notification(title, notificationOptions);
              console.log('[FCM] Notification shown successfully');
            } catch (error) {
              console.error('[FCM] Error showing notification:', error);
            }
          } else {
            console.warn('[FCM] Notification permission not granted:', Notification.permission);
          }
        });
      } catch (err) {
        console.error('[FCM] Error setting up message listener:', err);
      }
    };

    setupMessageListener();
  }, [setupListener, isSupported, permission]);

  // Request permission manually
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    setIsLoading(true);
    try {
      const newPermission = await fcmService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        await initializeFCM();
      } else {
        setError(`Notification permission is ${newPermission}`);
      }

      return newPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, [initializeFCM]);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<void> => {
    fcmService.clearTokenCache();
    tokenRegistered.current = false;
    await initializeFCM();
  }, [initializeFCM]);

  // Register token manually
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (!token) {
      setError('No token available to register');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await registerTokenWithBackend(token);
      if (success) {
        setError(null);
      } else {
        setError('Failed to register token');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, registerTokenWithBackend]);

  // Unregister token
  const unregisterToken = useCallback(async (): Promise<boolean> => {
    if (!token) {
      setError('No token available to unregister');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await notificationAPI.unregisterToken(token);
      if (response.success) {
        tokenRegistered.current = false;
        setError(null);
        return true;
      } else {
        setError(response.error || 'Failed to unregister token');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return {
    token,
    isLoading,
    error,
    permission,
    isSupported,
    requestPermission,
    refreshToken,
    registerToken,
    unregisterToken,
  };
};

export default useFCM;

