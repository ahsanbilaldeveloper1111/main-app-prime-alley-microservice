import { useTmsSession } from '../utils/tmsSessionNextAuth';
import { TmsSessionData, PermissionAction } from '../utils/tmsSession';
import { useMemo } from 'react';

/**
 * Backward compatibility hook that provides the same interface as the original tmsSession
 * but uses NextAuth session instead of localStorage
 */
export const useTmsSessionCompat = () => {
  const tmsSession = useTmsSession();

  // Memoize the compatibility object to prevent re-creation on every render
  const compatTmsSession = useMemo(() => ({
    // Core methods
    save: (session: TmsSessionData): void => {
      // No-op: session is managed by NextAuth
      console.warn('tmsSession.save() is deprecated. Session is now managed by NextAuth.');
    },

    load: (): TmsSessionData | null => {
      return tmsSession.session;
    },

    clear: (): void => {
      // No-op: session clearing is handled by NextAuth signOut
      console.warn('tmsSession.clear() is deprecated. Use NextAuth signOut() instead.');
    },

    // Validation methods
    isValid: (): boolean => {
      return tmsSession.isValid;
    },

    getRemainingSeconds: (): number => {
      return tmsSession.getRemainingSeconds();
    },

    // Permission methods
    getPermissions: (): any[] => {
      return tmsSession.getPermissions();
    },

    getCustomerType: (): string => {
      return tmsSession.getCustomerType();
    },

    hasPermission: (action: string, module: string, checkCustomerType: string = ''): boolean => {
      return tmsSession.hasPermission(action, module, checkCustomerType);
    },

    hasAnyPermission: (permissions: string[]): boolean => {
      return tmsSession.hasAnyPermission(permissions);
    },

    hasAllPermissions: (permissions: string[]): boolean => {
      return tmsSession.hasAllPermissions(permissions);
    },
  }), [tmsSession.session, tmsSession.isValid]);

  return {
    tmsSession: compatTmsSession,
    // Also expose the modern interface
    modernTmsSession: tmsSession,
  };
};
