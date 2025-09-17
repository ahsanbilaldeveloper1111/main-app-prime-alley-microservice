import { TmsSessionData, PermissionAction } from './tmsSession';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * TMS Session utility that uses server-side session instead of localStorage
 * This provides the same interface as the original tmsSession but uses HTTP-only cookies
 */
export const useTmsSession = () => {
  const { data: nextAuthSession, status } = useSession();
  const [session, setSession] = useState<TmsSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tmsPermissions, setTmsPermissions] = useState<any[]>([]);
  const [tmsCustomerType, setTmsCustomerType] = useState<string>('');

  // Fetch TMS permissions directly using tmsSessionId
  const fetchTmsPermissions = useCallback(async () => {
    try {
      // Get tmsSessionId from cookie or localStorage
      const getTmsSessionId = () => {
        if (typeof window === 'undefined') return null;
        
        // Try to get from cookie first
        const cookies = document.cookie.split(';');
        const tmsSessionIdCookie = cookies.find(cookie =>
          cookie.trim().startsWith('tmsSessionId=')
        );
        
        if (tmsSessionIdCookie) {
          return tmsSessionIdCookie.split('=')[1];
        }
        
        // Fallback to localStorage
        return localStorage.getItem('tmsSessionId');
      };

      const tmsSessionId = getTmsSessionId();
      console.log('Fetching TMS permissions for session ID:', tmsSessionId);

      if (!tmsSessionId) {
        console.log('No TMS session ID found');
        setTmsPermissions([]);
        setTmsCustomerType('');
        setSession(null);
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch(`/api/auth/app-session?sessionId=${tmsSessionId}`);
      
      if (!response.ok) {
        console.log('Failed to fetch TMS session data');
        setTmsPermissions([]);
        setTmsCustomerType('');
        setSession(null);
        setIsAuthenticated(false);
        return;
      }

      const sessionData = await response.json();
      console.log('TMS session data:', sessionData);
      
      // Set the full session data
      console.log('Setting session data:', {
        tmsSession: sessionData.user.tmsSession,
        hasAccessToken: !!sessionData.user.tmsSession?.accessToken,
        expiresAt: sessionData.user.tmsSession?.expiresAt,
        user: sessionData.user.tmsSession?.user
      });
      
      setSession(sessionData.user.tmsSession);
      setIsAuthenticated(!!sessionData.user.tmsSession);
      
      // Extract permissions from TMS session
      const permissions = sessionData?.user?.tmsSession?.user?.user_access_info?.permissions || [];
      const customerType = sessionData?.user?.tmsSession?.user?.user_type || '';
      
      console.log('TMS permissions from session:', permissions);
      console.log('TMS customer type from session:', customerType);
      
      setTmsPermissions(permissions);
      setTmsCustomerType(customerType);
    } catch (error) {
      console.error('Error fetching TMS permissions:', error);
      setTmsPermissions([]);
      setTmsCustomerType('');
      setSession(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch full session data using session ID
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!nextAuthSession?.user?.sessionId) {
        setSession(null);
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch(`/api/auth/app-session?sessionId=${nextAuthSession.user.sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch full session');
      }

      const fullSession = await response.json();
      setSession(fullSession.user.tmsSession);
      setIsAuthenticated(!!fullSession.user.tmsSession);
    } catch (error) {
      console.error('Error fetching TMS session:', error);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [nextAuthSession?.user?.sessionId]);

  // Fetch session when NextAuth session changes
  useEffect(() => {
    if (status === 'authenticated' && nextAuthSession?.user?.sessionId) {
      fetchSession();
    } else {
      setSession(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [status, nextAuthSession, fetchSession]);

  // Fetch TMS permissions when component mounts or when tmsSessionId changes
  useEffect(() => {
    fetchTmsPermissions();
  }, [fetchTmsPermissions]);

  // Also try to restore session from cookie on initial load
  useEffect(() => {
    const restoreSessionFromCookie = async () => {
      if (typeof window === 'undefined') return;
      
      // Check if we have a tmsSessionId in cookie
      const cookies = document.cookie.split(';');
      const tmsSessionIdCookie = cookies.find(cookie =>
        cookie.trim().startsWith('tmsSessionId=')
      );
      
      if (tmsSessionIdCookie) {
        const tmsSessionId = tmsSessionIdCookie.split('=')[1];
        console.log('Found TMS session ID in cookie, attempting to restore session:', tmsSessionId);
        
        try {
          const response = await fetch(`/api/auth/app-session?sessionId=${tmsSessionId}`);
          
          if (response.ok) {
            const sessionData = await response.json();
            console.log('Successfully restored TMS session from cookie:', sessionData);
            
            // Set the session data
            console.log('Restoring session data:', {
              tmsSession: sessionData.user.tmsSession,
              hasAccessToken: !!sessionData.user.tmsSession?.accessToken,
              expiresAt: sessionData.user.tmsSession?.expiresAt,
              user: sessionData.user.tmsSession?.user
            });
            
            setSession(sessionData.user.tmsSession);
            setIsAuthenticated(!!sessionData.user.tmsSession);
            
            // Extract permissions
            const permissions = sessionData?.user?.tmsSession?.user?.user_access_info?.permissions || [];
            const customerType = sessionData?.user?.tmsSession?.user?.user_type || '';
            
            setTmsPermissions(permissions);
            setTmsCustomerType(customerType);
          } else {
            console.log('Failed to restore TMS session from cookie, clearing cookie');
            // Clear invalid cookie
            document.cookie = 'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
            localStorage.removeItem('tmsSessionId');
          }
        } catch (error) {
          console.error('Error restoring TMS session from cookie:', error);
          // Clear invalid cookie
          document.cookie = 'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
          localStorage.removeItem('tmsSessionId');
        }
      }
    };
    
    // Run this on initial load and when status changes
    if (status === 'unauthenticated' || status === 'loading' || status === 'authenticated') {
      restoreSessionFromCookie();
    }
  }, [status, nextAuthSession]);

  const getRemainingSeconds = useCallback((): number => {
    if (!session) return 0;
    return Math.max(0, session.expiresAt - nowSeconds());
  }, [session]);

  const isValid = useCallback((): boolean => {
    if (!session) {
      console.log('isValid: No session found');
      return false;
    }
    
    const hasAccessToken = !!session.accessToken;
    const isNotExpired = session.expiresAt > nowSeconds();
    const currentTime = nowSeconds();
    
    console.log('isValid check:', {
      hasAccessToken,
      isNotExpired,
      currentTime,
      expiresAt: session.expiresAt,
      timeUntilExpiry: session.expiresAt - currentTime,
      session: session
    });
    
    return hasAccessToken && isNotExpired;
  }, [session]);

  // Session validation and refresh
  useEffect(() => {
    const validateAndRefreshSession = async () => {
      if (!session || !isValid()) {
        return;
      }

      // Check if session expires in the next 5 minutes
      const timeUntilExpiry = getRemainingSeconds();
      if (timeUntilExpiry < 300) { // 5 minutes
        console.log('TMS session expires soon, attempting to refresh...');
        
        try {
          // Try to refresh the session by fetching it again
          const cookies = document.cookie.split(';');
          const tmsSessionIdCookie = cookies.find(cookie =>
            cookie.trim().startsWith('tmsSessionId=')
          );
          
          if (tmsSessionIdCookie) {
            const tmsSessionId = tmsSessionIdCookie.split('=')[1];
            const response = await fetch(`/api/auth/app-session?sessionId=${tmsSessionId}`);
            
            if (response.ok) {
              const sessionData = await response.json();
              console.log('TMS session refreshed successfully');
              
              // Update session data
              setSession(sessionData.user.tmsSession);
              setIsAuthenticated(!!sessionData.user.tmsSession);
              
              // Update permissions
              const permissions = sessionData?.user?.tmsSession?.user?.user_access_info?.permissions || [];
              const customerType = sessionData?.user?.tmsSession?.user?.user_type || '';
              
              setTmsPermissions(permissions);
              setTmsCustomerType(customerType);
            } else {
              console.log('Failed to refresh TMS session, clearing session');
              setSession(null);
              setIsAuthenticated(false);
              setTmsPermissions([]);
              setTmsCustomerType('');
            }
          }
        } catch (error) {
          console.error('Error refreshing TMS session:', error);
          setSession(null);
          setIsAuthenticated(false);
          setTmsPermissions([]);
          setTmsCustomerType('');
        }
      }
    };

    // Run validation every minute
    const interval = setInterval(validateAndRefreshSession, 60000);
    
    // Also run immediately
    validateAndRefreshSession();

    return () => clearInterval(interval);
  }, [session, isValid, getRemainingSeconds]);

  const getPermissions = useCallback((): any[] => {
    
    return tmsPermissions;
  }, [tmsPermissions]);

  const getCustomerType = useCallback((): string => {
    return tmsCustomerType;
  }, [tmsCustomerType]);

  const hasPermission = useCallback((action: string, module: string, checkCustomerType: string = ''): boolean => {
    const permissions = getPermissions();
    const customerType = getCustomerType();

    const isSuperAdmin = permissions.some(
      (permission) => 
        permission.action === 'admin' &&
        permission.module === 'global'
    );

    //console.log('Is super admin:', isSuperAdmin,action,module,checkCustomerType);

    if (!isSuperAdmin) {
      //console.log('not super admin:');
      const permission = permissions.some(permission => permission.module === module && permission.action === action);
      
     // console.log('Permission found:', permission);
      
      if (checkCustomerType) {
        const result = customerType == checkCustomerType && permission;
        //console.log('Permission with customer type check:', result);
        return result;
      }
      return permission;
    }

    //console.log('is super admin return:', isSuperAdmin);
    return isSuperAdmin;
  }, [getPermissions, getCustomerType]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    const userPermissions = getPermissions();
    return permissions.some(permission => userPermissions.includes(permission));
  }, [getPermissions]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    const userPermissions = getPermissions();
    return permissions.every(permission => userPermissions.includes(permission));
  }, [getPermissions]);

  // Memoize the session data to prevent unnecessary re-renders
  const sessionData = useMemo(() => session, [session]);
  const isValidValue = useMemo(() => isValid(), [isValid]);

  return {
    // Core session data
    session: sessionData,
    isValid: isValidValue,
    isAuthenticated,
    isLoading,
    
    // Utility methods (memoized)
    getRemainingSeconds,
    getPermissions,
    getCustomerType,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Refresh function
    refresh: fetchSession,
  };
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
