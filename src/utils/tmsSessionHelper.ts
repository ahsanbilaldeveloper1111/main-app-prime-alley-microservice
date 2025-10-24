/**
 * TMS Session Helper Utility
 * Provides reusable functions for loading TMS session data using tmsSessionId from cookies
 */

import React from 'react';

export interface TmsSessionData {
  user?: any;
  accessToken?: string;
  expiresAt?: number;
  tmsPermissions?: any[];
  user_type?: string;
  [key: string]: any;
}

/**
 * Get tmsSessionId from browser cookies
 * @returns {string | null} The tmsSessionId or null if not found
 */
export const getTmsSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tmsSessionIdCookie = cookies.find(cookie =>
    cookie.trim().startsWith('tmsSessionId=')
  );
  
  return tmsSessionIdCookie ? tmsSessionIdCookie.split('=')[1] : null;
};

/**
 * Load TMS session data using tmsSessionId from cookies
 * @param {string} sessionId - Optional sessionId, if not provided will extract from cookies
 * @returns {Promise<TmsSessionData | null>} The session data or null if failed
 */
export const loadTmsSession = async (sessionId?: string): Promise<TmsSessionData | null> => {
  const tmsSessionId = sessionId || getTmsSessionId();
  
  if (!tmsSessionId) {
    console.log('No tmsSessionId found in cookies');
    return null;
  }

  try {
    const response = await fetch(`/api/auth/app-session?sessionId=${tmsSessionId}`);
    
    if (response.ok) {
      const sessionData = await response.json();
      //console.log('TMS session data loaded successfully:', sessionData);
      return sessionData;
    } else {
      console.log('Failed to fetch TMS session data:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching TMS session data:', error);
    return null;
  }
};

/**
 * Load TMS session data using the alternative TMS session API endpoint
 * @param {string} sessionId - Optional sessionId, if not provided will extract from cookies
 * @returns {Promise<TmsSessionData | null>} The session data or null if failed
 */
export const loadTmsSessionFromTmsApi = async (sessionId?: string): Promise<TmsSessionData | null> => {
  const tmsSessionId = sessionId || getTmsSessionId();
  
  if (!tmsSessionId) {
    console.log('No tmsSessionId found in cookies');
    return null;
  }

  try {
    const response = await fetch('/api/tms/session');
    
    if (response.ok) {
      const result = await response.json();
      console.log('TMS session data loaded from TMS API:', result);
      return result.session || result;
    } else {
      console.log('Failed to fetch TMS session data from TMS API:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching TMS session data from TMS API:', error);
    return null;
  }
};

/**
 * Check if TMS session is valid
 * @param {TmsSessionData | null} sessionData - The session data to validate
 * @returns {boolean} True if session is valid, false otherwise
 */
export const isTmsSessionValid = (sessionData: TmsSessionData | null): boolean => {
  if (!sessionData) return false;
  
  // Check if session has required data
  if (!sessionData.user) return false;
  
  // Check if session is expired (if expiresAt is provided)
  if (sessionData.expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    return sessionData.expiresAt > now;
  }
  
  return true;
};

/**
 * Get user data from TMS session
 * @param {TmsSessionData | null} sessionData - The session data
 * @returns {any | null} The user data or null if not available
 */
export const getTmsUser = (sessionData: TmsSessionData | null): any | null => {
  return sessionData?.user || null;
};

/**
 * Get TMS permissions from session
 * @param {TmsSessionData | null} sessionData - The session data
 * @returns {any[]} Array of permissions or empty array
 */
export const getTmsPermissions = (sessionData: TmsSessionData | null): any[] => {
  return sessionData?.tmsPermissions || sessionData?.user?.tmsPermissions || [];
};

/**
 * Get customer type from session
 * @param {TmsSessionData | null} sessionData - The session data
 * @returns {string} The customer type or empty string
 */
export const getTmsCustomerType = (sessionData: TmsSessionData | null): string => {
  return sessionData?.user_type || sessionData?.user?.user_type || '';
};

/**
 * Check if user has specific permission
 * @param {TmsSessionData | null} sessionData - The session data
 * @param {string} action - The action to check
 * @param {string} module - The module to check
 * @returns {boolean} True if user has permission, false otherwise
 */
export const hasTmsPermission = (
  sessionData: TmsSessionData | null, 
  action: string, 
  module: string
): boolean => {
  const permissions = getTmsPermissions(sessionData);
  return permissions.some(permission => 
    permission.action === action && permission.module === module
  );
};

/**
 * React hook for loading TMS session data
 * @returns {Object} Object containing session data, loading state, and helper functions
 */
export const useTmsSessionHelper = () => {
  const [sessionData, setSessionData] = React.useState<TmsSessionData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadSession = React.useCallback(async (sessionId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadTmsSession(sessionId);
      setSessionData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load TMS session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isValid = React.useMemo(() => isTmsSessionValid(sessionData), [sessionData]);
  const user = React.useMemo(() => getTmsUser(sessionData), [sessionData]);
  const permissions = React.useMemo(() => getTmsPermissions(sessionData), [sessionData]);
  const customerType = React.useMemo(() => getTmsCustomerType(sessionData), [sessionData]);

  return {
    sessionData,
    isLoading,
    error,
    isValid,
    user,
    permissions,
    customerType,
    loadSession,
    hasPermission: (action: string, module: string) => hasTmsPermission(sessionData, action, module)
  };
};

