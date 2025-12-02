import axiosInstance from '@utils/axios';

export interface RegisterFCMTokenRequest {
  fcmToken: string;
  deviceId?: string;
  deviceType?: string;
  platform?: string;
}

export interface RegisterFCMTokenResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UnregisterFCMTokenRequest {
  fcmToken: string;
}

/**
 * Notification API service
 * Handles all API calls related to FCM token management
 */
class NotificationAPI {
  /**
   * Check if localStorage is available and accessible
   */
  private isStorageAvailable(): boolean {
    if (globalThis.window === undefined) {
      return false;
    }
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register FCM token with the backend
   */
  async registerToken(
    token: string,
    options?: {
      deviceId?: string;
      deviceType?: string;
      platform?: string;
    }
  ): Promise<RegisterFCMTokenResponse> {
    try {
      const payload: RegisterFCMTokenRequest = {
        fcmToken: token,
        deviceId: options?.deviceId || this.getDeviceId(),
        deviceType: options?.deviceType || this.getDeviceType(),
        platform: options?.platform || this.getPlatform(),
      };

      const response = await axiosInstance.post('users/notifications/register-token', payload);

      if (response.data) {
        return {
          success: true,
          message: response.data.message || 'Token registered successfully',
        };
      }

      return {
        success: false,
        error: 'Invalid response from server',
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to register FCM token',
      };
    }
  }

  /**
   * Unregister FCM token from the backend
   */
  async unregisterToken(token: string): Promise<RegisterFCMTokenResponse> {
    try {
      const payload: UnregisterFCMTokenRequest = {
        fcmToken: token,
      };

      const response = await axiosInstance.post('users/notifications/unregister-token', payload);

      if (response.data) {
        return {
          success: true,
          message: response.data.message || 'Token unregistered successfully',
        };
      }

      return {
        success: false,
        error: 'Invalid response from server',
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to unregister FCM token',
      };
    }
  }

  /**
   * Get device ID (from localStorage or generate one)
   */
  private getDeviceId(): string {
    // Always try to get from storage, but handle errors gracefully
    try {
      if (this.isStorageAvailable()) {
        const deviceId = localStorage.getItem('deviceId');
        if (deviceId) {
          return deviceId;
        }
        
        // Generate new ID and try to store it
        const newDeviceId = this.generateDeviceId();
        try {
          if (this.isStorageAvailable()) {
            localStorage.setItem('deviceId', newDeviceId);
          }
        } catch {
          // Storage write failed, but we can still return the generated ID
        }
        return newDeviceId;
      }
    } catch {
      // Storage access failed, generate ID without storing
    }
    
    // Fallback: generate ID without storage
    return this.generateDeviceId();
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${random}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    if (globalThis.window === undefined) {
      return 'unknown';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    if (globalThis.window === undefined) {
      return 'unknown';
    }

    const userAgent = navigator.userAgent;
    if (userAgent.includes('Win')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || /iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    return 'unknown';
  }
}

// Export singleton instance
export const notificationAPI = new NotificationAPI();
export default notificationAPI;

