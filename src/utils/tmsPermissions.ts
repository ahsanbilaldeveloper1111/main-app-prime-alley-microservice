/**
 * Utility functions for TMS permissions
 * TMS auth has been removed - these functions now return false/empty values
 */

/**
 * Check if user has a specific permission
 * @param permission - Permission to check in format "action_module" (e.g., "view_audit_log")
 * @returns boolean - always returns false since TMS auth is removed
 */
export const hasTmsPermission = (permission: string, module: string): boolean => {
  return false;
};

/**
 * Check if user has any of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean - always returns false since TMS auth is removed
 */
export const hasAnyTmsPermission = (permissions: string[]): boolean => {
  return false;
};

/**
 * Check if user has all of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean - always returns false since TMS auth is removed
 */
export const hasAllTmsPermissions = (permissions: string[]): boolean => {
  return false;
};

/**
 * Get all permissions from TMS session
 * @returns Array of permission strings - always returns empty array since TMS auth is removed
 */
export const getTmsPermissions = (): string[] => {
  return [];
};

/**
 * Check if TMS session is valid
 * @returns boolean - always returns false since TMS auth is removed
 */
export const isTmsSessionValid = (): boolean => {
  return false;
};

// Common permission constants for easy reference
export const TMS_PERMISSIONS = {
  // Audit Log permissions
  VIEW_AUDIT_LOG: 'view_audit_log',
  EDIT_AUDIT_LOG: 'edit_audit_log',
  DELETE_AUDIT_LOG: 'delete_audit_log',
  
  // Company permissions
  VIEW_COMPANY: 'view_company',
  EDIT_COMPANY: 'edit_company',
  DELETE_COMPANY: 'delete_company',
  CREATE_COMPANY: 'create_company',
  
  // User permissions
  VIEW_USER: 'view_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  CREATE_USER: 'create_user',
  
  // Add more permissions as needed
} as const;

// Type for permission keys
export type TmsPermission = typeof TMS_PERMISSIONS[keyof typeof TMS_PERMISSIONS];
