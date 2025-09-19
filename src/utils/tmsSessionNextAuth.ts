import { TmsSessionData, PermissionAction } from './tmsSession';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

interface TmsSessionState {
  session: TmsSessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tmsPermissions: any[];
  tmsCustomerType: string;
  isRefreshing: boolean;
}

/**
 * TMS Session utility that uses server-side session instead of localStorage
 * This provides the same interface as the original tmsSession but uses HTTP-only cookies
 */
export const useTmsSession = () => {
  const { data: nextAuthSession, status } = useSession();
  const [state, setState] = useState<TmsSessionState>({
    session: null,
    isLoading: true,
    isAuthenticated: false,
    tmsPermissions: [],
    tmsCustomerType: '',
    isRefreshing: false,
  });
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Helper function to get TMS session ID from cookies
  const getTmsSessionId = useCallback((): string | null => {
        if (typeof window === 'undefined') return null;
        
        const cookies = document.cookie.split(';');
        const tmsSessionIdCookie = cookies.find(cookie =>
          cookie.trim().startsWith('tmsSessionId=')
        );
        
    return tmsSessionIdCookie ? tmsSessionIdCookie.split('=')[1] : null;
  }, []);

  // Helper function to create TmsSessionData from API response
  const createTmsSessionData = useCallback((sessionData: any): TmsSessionData => {
    const accessTokenExpires = sessionData.user?.access_token_expires;
    const expiresAt = accessTokenExpires ? nowSeconds() + parseInt(accessTokenExpires.toString()) : 0;
    
    return {
      accessToken: sessionData.user?.access_token || '',
      expiresAt: expiresAt,
      user: sessionData.user
    };
  }, []);

  // Unified session fetching function
  const fetchSessionData = useCallback(async (sessionId?: string): Promise<boolean> => {
    try {
      const tmsSessionId = sessionId || getTmsSessionId();

      if (!tmsSessionId) {
        setState(prev => ({
          ...prev,
          session: null,
          isAuthenticated: false,
          tmsPermissions: [],
          tmsCustomerType: '',
          isLoading: false,
        }));
        return false;
      }

      const response = await fetch(`/api/auth/app-session?sessionId=${tmsSessionId}`);
      
      if (!response.ok) {
        setState(prev => ({
          ...prev,
          session: null,
          isAuthenticated: false,
          tmsPermissions: [],
          tmsCustomerType: '',
          isLoading: false,
        }));
        return false;
      }

      const sessionData = await response.json();
      const tmsSessionData = createTmsSessionData(sessionData);
      const permissions = sessionData?.user?.tmsPermissions || [];
      const customerType = sessionData?.user?.user_type || '';
      
      setState(prev => ({
        ...prev,
        session: tmsSessionData,
        isAuthenticated: !!tmsSessionData.accessToken,
        tmsPermissions: permissions,
        tmsCustomerType: customerType,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error fetching TMS session:', error);
      setState(prev => ({
        ...prev,
        session: null,
        isAuthenticated: false,
        tmsPermissions: [],
        tmsCustomerType: '',
        isLoading: false,
      }));
      return false;
    }
  }, [getTmsSessionId, createTmsSessionData]);

  // Main effect to handle session initialization and restoration
  useEffect(() => {
    const initializeSession = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      // Try to restore from NextAuth session first
    if (status === 'authenticated' && nextAuthSession?.user?.sessionId) {
        await fetchSessionData(nextAuthSession.user.sessionId);
      } else if (status === 'unauthenticated' || status === 'loading') {
        // Try to restore from cookies
        await fetchSessionData();
    } else {
        setState(prev => ({
          ...prev,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    };

    initializeSession();
  }, [status, nextAuthSession?.user?.sessionId, fetchSessionData]);

  // Reset initialization flag when status changes to allow re-initialization
  useEffect(() => {
    if (status === 'unauthenticated') {
      isInitializedRef.current = false;
    }
  }, [status]);

  const getRemainingSeconds = useCallback((): number => {
    if (!state.session) return 0;
    return Math.max(0, state.session.expiresAt - nowSeconds());
  }, [state.session]);

  const isValid = useCallback((): boolean => {
    if (!state.session) return false;
    
    const hasAccessToken = !!state.session.accessToken;
    const isNotExpired = state.session.expiresAt > nowSeconds();
    
    return hasAccessToken && isNotExpired;
  }, [state.session]);

  // Session validation and refresh with optimized logic
  useEffect(() => {
    const validateAndRefreshSession = async () => {
      if (!state.session || !isValid() || state.isRefreshing) {
        return;
      }

      const timeUntilExpiry = getRemainingSeconds();
      if (timeUntilExpiry < 120) { // 2 minutes
        console.log('TMS session expires soon, attempting to refresh...');
        
        setState(prev => ({ ...prev, isRefreshing: true }));
        
        const success = await fetchSessionData();
        if (!success) {
              console.log('Failed to refresh TMS session, clearing session');
        }
        
        setState(prev => ({ ...prev, isRefreshing: false }));
      }
    };

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set up refresh timeout
    const timeUntilExpiry = getRemainingSeconds();
    if (timeUntilExpiry > 0) {
      const refreshTime = Math.max(0, timeUntilExpiry - 120) * 1000; // Refresh 2 minutes before expiry
      refreshTimeoutRef.current = setTimeout(validateAndRefreshSession, refreshTime);
    }

    // Also run immediately if needed
    validateAndRefreshSession();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [state.session, isValid, getRemainingSeconds, fetchSessionData]);

  const getPermissions = useCallback((): any[] => {
    return state.tmsPermissions;
  }, [state.tmsPermissions]);

  const getCustomerType = useCallback((): string => {
    return state.tmsCustomerType;
  }, [state.tmsCustomerType]);

  const hasPermission = useCallback((action: string, module: string, checkCustomerType: string = ''): boolean => {
    const permissions = state.tmsPermissions;
    const customerType = state.tmsCustomerType;

    // Check if user is super admin (has admin_global permission)
    const isSuperAdmin = permissions.includes('admin_global');

    if (isSuperAdmin) {
      return true;
    }

    // Check for specific permission in format "action_module"
    const permissionString = `${action}_${module}`;
    const hasSpecificPermission = permissions.includes(permissionString);
    
    if (checkCustomerType) {
      return customerType === checkCustomerType && hasSpecificPermission;
    }
    
    return hasSpecificPermission;
  }, [state.tmsPermissions, state.tmsCustomerType]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => state.tmsPermissions.includes(permission));
  }, [state.tmsPermissions]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => state.tmsPermissions.includes(permission));
  }, [state.tmsPermissions]);

  // Clear TMS session data
  const clearTmsSession = useCallback(() => {
    console.log('Clearing TMS session data...');
    setState({
      session: null,
      isAuthenticated: false,
      tmsPermissions: [],
      tmsCustomerType: '',
      isLoading: false,
      isRefreshing: false,
    });
    
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Reset initialization flag
    isInitializedRef.current = false;
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Core session data
    session: state.session,
    isValid: isValid(),
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    
    // Utility methods (memoized)
    getRemainingSeconds,
    getPermissions,
    getCustomerType,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Session management
    refresh: () => fetchSessionData(),
    clear: clearTmsSession,
  }), [
    state.session,
    state.isAuthenticated,
    state.isLoading,
    state.isRefreshing,
    isValid,
    getRemainingSeconds,
    getPermissions,
    getCustomerType,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    fetchSessionData,
    clearTmsSession,
  ]);
};

/**
 * Server-side TMS session utility for use in API routes
 * This can be used in getServerSideProps, API routes, etc.
 */
export const getServerTmsSession = async (req: any, res: any) => {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/tms/session`, {
      headers: {
        cookie: req.headers.cookie || '',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching TMS session:', error);
    return null;
  }
};
