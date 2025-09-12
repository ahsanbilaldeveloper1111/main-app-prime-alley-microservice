import { useState, useEffect } from 'react';
import { useTmsSessionCompat } from './useTmsSessionCompat';




/**
 * React hook for TMS permissions
 * Provides easy access to TMS session permissions with reactive updates
 * Now uses NextAuth session instead of localStorage
 */
export const useTmsPermissions = () => {
  const { modernTmsSession } = useTmsSessionCompat();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const valid = modernTmsSession.isValid;
    setIsValid(valid);
    
    if (valid) {
      setPermissions(modernTmsSession.getPermissions());
    } else {
      setPermissions([]);
    }
  }, [modernTmsSession.isValid, modernTmsSession.session]);

  const hasPermission = (permission: string, module: string, checkCustomerType: string=''): boolean => {
    return modernTmsSession.hasPermission(permission, module, checkCustomerType);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return modernTmsSession.hasAnyPermission(permissions);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return modernTmsSession.hasAllPermissions(permissions);
  };

  return {
    permissions,
    isValid,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
