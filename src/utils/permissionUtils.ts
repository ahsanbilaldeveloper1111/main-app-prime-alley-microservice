import { useSession } from 'next-auth/react';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS } = HEADER_CONSTANTS;

export const usePermissions = () => {
  const { data: session } = useSession();
  
  const hasPermission = (permission: string): boolean => {
    if (!session?.user?.permissions) {
      return false;
    }
    
    return session.user.permissions?.includes(permission) || false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!session?.user?.permissions) {
      return false;
    }
    
    return permissions.some(permission => session.user.permissions?.includes(permission) || false);
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!session?.user?.permissions) {
      return false;
    }
    
    return permissions.every(permission => session.user.permissions?.includes(permission) || false);
  };
  
  const isAdmin = (): boolean => {
    return Boolean(session?.user?.is_admin);
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    permissions: session?.user?.permissions || [],
  };
};

export const checkRoutePermission = (pathname: string, permissions: string[]): boolean => {
  // Define route-permission mappings
  const routePermissions: Record<string, string[]> = {
    '/controlhub/users': ['view-users'],
    '/controlhub/ranks': ['view-ranks'],
    '/controlhub/groups': ['view-groups'],
    '/gsm/dashboard': ['view-gsm'],
    '/gsm/list': ['view-gsm'],
    '/gsm/assign': ['view-gsm'],
    '/gsm/ports': ['view-gsm'],
    '/gsm/inbox': ['view-gsm'],
    '/call-logs/dashboard': [PERMISSIONS.VIEW_CALL_LOGS],
    '/call-logs': [PERMISSIONS.VIEW_CALL_LOGS],
    '/call-recordings/dashboard': [PERMISSIONS.VIEW_CALL_RECORDINGS],
    '/call-recordings': [PERMISSIONS.VIEW_CALL_RECORDINGS],
    '/ai-ml/dashboard': ['view-ai-ml'],
    '/ai-ml/audio-transcription': ['view-ai-ml'],
    '/ai-ml/translate': ['view-ai-ml'],
    '/ai-ml/get-transcription': ['view-ai-ml'],
    '/ai-ml/analysis': ['view-ai-ml'],
    '/reports': ['view-reports'],
  };
  
  // Check if the route requires specific permissions
  const requiredPermissions = routePermissions[pathname];
  if (!requiredPermissions) {
    // Route doesn't require specific permissions
    return true;
  }
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => permissions.includes(permission));
};
