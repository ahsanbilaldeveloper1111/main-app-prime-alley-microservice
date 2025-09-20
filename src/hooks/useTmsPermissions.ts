import { useMemo, useCallback } from 'react';
import { useTmsSessionContext } from '../contexts/TmsSessionContext';

/**
 * React hook for TMS permissions
 * Provides easy access to TMS session permissions with reactive updates
 * Now uses NextAuth session instead of localStorage
 * 
 * Optimized version that directly uses context state without duplication
 */
export const useTmsPermissions = () => {
  const tmsSession = useTmsSessionContext();

  // Memoize permissions to prevent unnecessary recalculations
  const permissions = useMemo(() => {
    return tmsSession.isValid ? tmsSession.getPermissions() : [];
  }, [tmsSession.isValid, tmsSession.getPermissions]);

  // Memoize permission checking functions to prevent unnecessary re-renders
  const hasPermission = useCallback((permission: string, module: string, checkCustomerType: string = ''): boolean => {
    return tmsSession.hasPermission(permission, module, checkCustomerType);
  }, [tmsSession.hasPermission]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return tmsSession.hasAnyPermission(permissions);
  }, [tmsSession.hasAnyPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return tmsSession.hasAllPermissions(permissions);
  }, [tmsSession.hasAllPermissions]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    permissions,
    isValid: tmsSession.isValid,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [
    permissions,
    tmsSession.isValid,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);
};
