import { useMemo, useCallback } from 'react';

/**
 * React hook for TMS permissions
 * TMS auth has been removed - this hook now returns empty permissions
 */
export const useTmsPermissions = () => {
  // Memoize permissions to prevent unnecessary recalculations
  const permissions = useMemo(() => {
    return [];
  }, []);

  // Memoize permission checking functions to prevent unnecessary re-renders
  const hasPermission = useCallback((permission: string, module: string, checkCustomerType: string = ''): boolean => {
    return false;
  }, []);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return false;
  }, []);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return false;
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    permissions,
    isValid: false,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);
};
