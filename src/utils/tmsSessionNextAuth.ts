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
      //console.log('Fetching TMS permissions for session ID:', tmsSessionId);

      if (!tmsSessionId) {
       // console.log('No TMS session ID found');
        setTmsPermissions([]);
        setTmsCustomerType('');
        return;
      }

      const response = await fetch(`/api/auth/full-session?sessionId=${tmsSessionId}`);
      
      if (!response.ok) {
        //console.log('Failed to fetch TMS session data');
        setTmsPermissions([]);
        setTmsCustomerType('');
        return;
      }

      const sessionData = await response.json();
      //console.log('TMS session data:', sessionData);
      
      // Extract permissions from TMS session
      const permissions = sessionData?.user?.tmsSession?.user?.user_access_info?.permissions || [];
      const customerType = sessionData?.user?.tmsSession?.user?.user_type || '';
      
      //console.log('TMS permissions from session:', permissions);
      //console.log('TMS customer type from session:', customerType);
      
      setTmsPermissions(permissions);
      setTmsCustomerType(customerType);
    } catch (error) {
      console.error('Error fetching TMS permissions:', error);
      setTmsPermissions([]);
      setTmsCustomerType('');
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

      const response = await fetch(`/api/auth/full-session?sessionId=${nextAuthSession.user.sessionId}`);
      
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

  const isValid = useCallback((): boolean => {
    if (!session) return false;
    return !!session.accessToken && session.expiresAt > nowSeconds();
  }, [session]);

  const getRemainingSeconds = useCallback((): number => {
    if (!session) return 0;
    return Math.max(0, session.expiresAt - nowSeconds());
  }, [session]);

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
