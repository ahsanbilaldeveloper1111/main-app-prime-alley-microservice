export interface TmsSessionData {
  accessToken: string;
  expiresAt: number; // epoch seconds
  user?: {
    id?: string;
    name?: string;
    email?: string;
    user_access_info?: {
      permissions?: Array<{
        module: string;
        action: string;
      }>;
    };
    [key: string]: any;
  };
}

const TMS_SESSION_STORAGE_KEY = 'tmsSession';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ADMIN = 'admin'
}


export const tmsSession = {
  save(session: TmsSessionData): void {
    console.warn('⚠️  tmsSession.save() is deprecated. Please migrate to NextAuth session management.');
    console.warn('   Use useTmsSessionCompat() hook instead for backward compatibility.');
    console.warn('   Session data is now managed server-side through NextAuth.');
    
    try {
      if (typeof window === 'undefined') return;
      // Use localStorage for cross-tab persistence
      window.localStorage.setItem(TMS_SESSION_STORAGE_KEY, JSON.stringify(session));
      // Also clear from sessionStorage to avoid conflicts
      window.sessionStorage.removeItem(TMS_SESSION_STORAGE_KEY);
    } catch (err) {
      // Fallback to sessionStorage if localStorage is not available
      try {
        if (typeof window === 'undefined') return;
        window.sessionStorage.setItem(TMS_SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (_) {
        // Ignore
      }
    }
  },

  load(): TmsSessionData | null {
    console.warn('⚠️  tmsSession.load() is deprecated. Please migrate to NextAuth session management.');
    console.warn('   Use useTmsSessionCompat() hook instead for backward compatibility.');
    console.warn('   Session data is now managed server-side through NextAuth.');
    
    try {
      if (typeof window === 'undefined') return null;
      // Try localStorage first for cross-tab persistence
      const raw = window.localStorage.getItem(TMS_SESSION_STORAGE_KEY) || window.sessionStorage.getItem(TMS_SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as TmsSessionData;
    } catch {
      return null;
    }
  },

  clear(): void {
    console.warn('⚠️  tmsSession.clear() is deprecated. Please migrate to NextAuth session management.');
    console.warn('   Use NextAuth signOut() instead for proper session cleanup.');
    console.warn('   Session data is now managed server-side through NextAuth.');
    
    try {
      if (typeof window === 'undefined') return;
      // Clear from both storage types
      window.localStorage.removeItem(TMS_SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(TMS_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  },

  isValid(): boolean {
    const s = this.load();
    if (!s) return false;
    return !!s.accessToken && s.expiresAt > nowSeconds();
  },

  getRemainingSeconds(): number {
    const s = this.load();
    if (!s) return 0;
    return Math.max(0, s.expiresAt - nowSeconds());
  },

  /**
   * Get all permissions from TMS session in the format "action_module"
   * @returns Array of permission strings like ["view_audit_log", "view_company"]
   */
  getPermissions(): any[] {
    const s = this.load();
    if (!s?.user?.user_access_info?.permissions) return [];
    
    // return s.user.user_access_info.permissions.map(permission => 
    //   `${permission.action}_${permission.module}`
    // );

    return s.user.user_access_info.permissions;
  },

  getCustomerType(): string {
    const s = this.load();
    if (!s?.user?.user_type) return '';
    return s.user.user_type;
  },

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check in format "action_module" (e.g., "view_audit_log")
   * @returns boolean - true if permission exists, false otherwise
   */
  hasPermission(action: string, module: string, checkCustomerType: string=''): boolean {

    

    const permissions = this.getPermissions();
    const customerType = this.getCustomerType();
  
  const isSuperAdmin = permissions.some(
      (permission) => 
          permission.action === PermissionAction.ADMIN &&
          permission.module === 'global'
      );

      
  if(!isSuperAdmin){
    const permission = permissions.some(permission => permission.module === module && permission.action === action);
     
        
        if(checkCustomerType){
          
          return customerType == checkCustomerType  && permission;

        }
        return permission;
      
  }

  return isSuperAdmin;

  },

 

  /**
   * Check if user has any of the specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean - true if any permission exists, false otherwise
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.some(permission => userPermissions.includes(permission));
  },

  /**
   * Check if user has all of the specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean - true if all permissions exist, false otherwise
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.every(permission => userPermissions.includes(permission));
  }
};
