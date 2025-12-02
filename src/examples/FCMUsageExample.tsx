/**
 * Example: How to use FCM (Firebase Cloud Messaging) in your components
 * 
 * This file demonstrates how to use the useFCM hook in your React components
 * to manage FCM tokens and handle notifications.
 */

import React from 'react';
import { useFCM } from '@hooks/useFCM';
import { toast } from 'react-toastify';

/**
 * Example 1: Basic usage with auto-registration
 * The token will be automatically obtained and registered with the backend
 */
export const BasicFCMExample: React.FC = () => {
  const { token, isLoading, error, permission, isSupported } = useFCM(true);

  if (!isSupported) {
    return <div>FCM is not supported in this browser</div>;
  }

  if (isLoading) {
    return <div>Loading FCM token...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (permission === 'denied') {
    return <div>Notification permission is denied. Please enable it in your browser settings.</div>;
  }

  return (
    <div>
      <h3>FCM Status</h3>
      <p>Token: {token ? `${token.substring(0, 20)}...` : 'No token'}</p>
      <p>Permission: {permission}</p>
    </div>
  );
};

/**
 * Example 2: Manual token management
 * Use this when you want to control when the token is registered
 */
export const ManualFCMExample: React.FC = () => {
  const {
    token,
    isLoading,
    error,
    permission,
    isSupported,
    requestPermission,
    refreshToken,
    registerToken,
    unregisterToken,
  } = useFCM(false); // Set autoRegister to false

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success('Notification permission granted!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleRegisterToken = async () => {
    const success = await registerToken();
    if (success) {
      toast.success('Token registered successfully!');
    } else {
      toast.error('Failed to register token');
    }
  };

  const handleRefreshToken = async () => {
    await refreshToken();
    toast.info('Token refreshed');
  };

  const handleUnregisterToken = async () => {
    const success = await unregisterToken();
    if (success) {
      toast.success('Token unregistered successfully!');
    } else {
      toast.error('Failed to unregister token');
    }
  };

  return (
    <div>
      <h3>FCM Token Management</h3>
      
      {!isSupported && <p>FCM is not supported in this browser</p>}
      
      {permission === 'default' && (
        <button onClick={handleRequestPermission} disabled={isLoading}>
          Request Notification Permission
        </button>
      )}
      
      {permission === 'granted' && (
        <>
          <p>Token: {token ? `${token.substring(0, 30)}...` : 'No token available'}</p>
          <p>Status: {isLoading ? 'Loading...' : 'Ready'}</p>
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={handleRegisterToken} disabled={isLoading || !token}>
              Register Token
            </button>
            <button onClick={handleRefreshToken} disabled={isLoading}>
              Refresh Token
            </button>
            <button onClick={handleUnregisterToken} disabled={isLoading || !token}>
              Unregister Token
            </button>
          </div>
        </>
      )}
      
      {permission === 'denied' && (
        <p>Notification permission is denied. Please enable it in your browser settings.</p>
      )}
    </div>
  );
};

/**
 * Example 3: Display FCM token in settings page
 * This is useful for debugging or showing the token to users
 */
export const FCMTokenDisplay: React.FC = () => {
  const { token, isLoading, error, permission } = useFCM(true);

  if (isLoading) {
    return <div>Loading token...</div>;
  }

  if (error) {
    return <div>Error loading token: {error}</div>;
  }

  if (permission !== 'granted') {
    return <div>Notification permission is not granted</div>;
  }

  return (
    <div>
      <h4>FCM Token</h4>
      <textarea
        readOnly
        value={token || 'No token available'}
        style={{ width: '100%', minHeight: '100px' }}
      />
      <button
        onClick={() => {
          if (token) {
            navigator.clipboard.writeText(token);
            toast.success('Token copied to clipboard!');
          }
        }}
        disabled={!token}
      >
        Copy Token
      </button>
    </div>
  );
};

export default BasicFCMExample;

