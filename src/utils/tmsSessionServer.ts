import { TmsSessionData, PermissionAction } from './tmsSession';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Server-side TMS session utility that reads from HTTP-only cookies
 * This replaces localStorage-based session management
 */
export const getServerTmsSession = async (req: any): Promise<TmsSessionData | null> => {
  try {
    // Get TMS session ID from cookie
    const sessionId = req.cookies?.tmsSessionId;
    
    console.log('getServerTmsSession - Session ID found:', !!sessionId);
    
    if (!sessionId) {
      console.log('getServerTmsSession - No tmsSessionId cookie found');
      return null;
    }

    // Retrieve session data from memory store
    if (!global.tmsSessions) {
      console.log('getServerTmsSession - No global session store found');
      return null;
    }

    const tmsSessionData = global.tmsSessions.get(sessionId);
    
    if (!tmsSessionData) {
      console.log('getServerTmsSession - Session not found in store');
      return null;
    }
    
    console.log('getServerTmsSession - Session data:', {
      hasAccessToken: !!tmsSessionData.accessToken,
      expiresAt: tmsSessionData.expiresAt,
      currentTime: nowSeconds(),
      isValid: tmsSessionData.expiresAt > nowSeconds()
    });
    
    // Check if session is still valid
    if (!tmsSessionData.accessToken || tmsSessionData.expiresAt <= nowSeconds()) {
      console.log('getServerTmsSession - Session expired, cleaning up');
      global.tmsSessions.delete(sessionId);
      return null;
    }

    return tmsSessionData;
  } catch (error) {
    console.error('Error reading TMS session:', error);
    return null;
  }
};

/**
 * Client-side TMS session utility that fetches from server
 * This replaces localStorage-based session management
 */
export const getClientTmsSession = async (): Promise<TmsSessionData | null> => {
  try {
    const response = await fetch('/api/tms/session');
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.session || null;
  } catch (error) {
    console.error('Error fetching TMS session:', error);
    return null;
  }
};

/**
 * TMS session validation utility
 */
export const isTmsSessionValid = (session: TmsSessionData | null): boolean => {
  if (!session) return false;
  return !!session.accessToken && session.expiresAt > nowSeconds();
};

/**
 * TMS session permission utilities
 */
export const getTmsPermissions = (session: TmsSessionData | null): any[] => {
  if (!session?.user?.user_access_info?.permissions) return [];
  return session.user.user_access_info.permissions;
};

export const getTmsCustomerType = (session: TmsSessionData | null): string => {
  if (!session?.user?.user_type) return '';
  return session.user.user_type;
};

export const hasTmsPermission = (
  session: TmsSessionData | null,
  action: string,
  module: string,
  checkCustomerType: string = ''
): boolean => {
  const permissions = getTmsPermissions(session);
  const customerType = getTmsCustomerType(session);

  const isSuperAdmin = permissions.some(
    (permission) => 
      permission.action === PermissionAction.ADMIN &&
      permission.module === 'global'
  );

  if (!isSuperAdmin) {
    const permission = permissions.some(permission => permission.module === module && permission.action === action);
    
    if (checkCustomerType) {
      return customerType == checkCustomerType && permission;
    }
    return permission;
  }

  return isSuperAdmin;
};

export const hasAnyTmsPermission = (session: TmsSessionData | null, permissions: string[]): boolean => {
  const userPermissions = getTmsPermissions(session);
  return permissions.some(permission => userPermissions.includes(permission));
};

export const hasAllTmsPermissions = (session: TmsSessionData | null, permissions: string[]): boolean => {
  const userPermissions = getTmsPermissions(session);
  return permissions.every(permission => userPermissions.includes(permission));
};
