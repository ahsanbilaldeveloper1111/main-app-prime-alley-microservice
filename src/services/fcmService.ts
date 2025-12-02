import { getFCMToken, setupOnMessageListener } from '@config/firebase';

export interface FCMTokenResponse {
  success: boolean;
  token: string | null;
  error?: string;
}

export interface NotificationPayload {
  from?: string;
  messageId?: string;
  collapseKey?: string;
  notification?: {
    title?: string;
    body?: string;
    image?: string;
    icon?: string;
    badge?: string;
  };
  data?: {
    url?: string;
    tag?: string;
    notification_id?: string;
    messageId?: string;
    title?: string;
    description?: string;
    module?: string;
    created_at?: string;
  };
}

class FCMService {
  private vapidKey: string;
  private tokenCache: string | null = null;
  private tokenListeners: Set<(token: string | null) => void> = new Set();

  constructor() {
    // Get VAPID key from environment variables
    this.vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Get FCM token, with caching
   */
  async getToken(forceRefresh: boolean = false): Promise<FCMTokenResponse> {
    if (!this.vapidKey) {
      return {
        success: false,
        token: null,
        error: 'VAPID key is not configured',
      };
    }

    // Check permission first
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        error: `Notification permission is ${permission}`,
      };
    }

    // Return cached token if available and not forcing refresh
    if (this.tokenCache && !forceRefresh) {
      return {
        success: true,
        token: this.tokenCache,
      };
    }

    // Ensure service worker is ready
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
      } catch (error) {
        // Service worker not ready
      }
    }

    try {
      const token = await getFCMToken(this.vapidKey);
      if (token) {
        this.tokenCache = token;
        this.notifyTokenListeners(token);
        return {
          success: true,
          token,
        };
      } else {
        return {
          success: false,
          token: null,
          error: 'Failed to generate FCM token',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        token: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear cached token
   */
  clearTokenCache(): void {
    this.tokenCache = null;
  }

  /**
   * Subscribe to token updates
   */
  onTokenChange(callback: (token: string | null) => void): () => void {
    this.tokenListeners.add(callback);
    // Immediately call with current token if available
    if (this.tokenCache) {
      callback(this.tokenCache);
    }
    // Return unsubscribe function
    return () => {
      this.tokenListeners.delete(callback);
    };
  }

  /**
   * Notify all token listeners
   */
  private notifyTokenListeners(token: string | null): void {
    this.tokenListeners.forEach((callback) => {
      try {
        callback(token);
      } catch (error) {
        // Error in token listener
      }
    });
  }

  /**
   * Set up foreground message listener (continuous - handles multiple messages)
   */
  async setupForegroundMessageListener(
    onMessage: (payload: NotificationPayload) => void
  ): Promise<void> {
    try {
      // Set up continuous listener that will call onMessage for each notification received
      await setupOnMessageListener((payload) => {
        if (payload) {
          onMessage(payload);
        }
      });
    } catch (error) {
      console.error('[FCM Service] Error setting up foreground message listener:', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Export singleton instance
export const fcmService = new FCMService();
export default fcmService;

