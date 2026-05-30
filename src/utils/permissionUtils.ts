import { useAuthContext } from "../auth/AuthProvider";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

/**
 * Drop-in replacement for the previous `usePermissions` (which used
 * `useSession()` from next-auth). Backed by `<AuthProvider>` so existing
 * callsites keep their shape.
 */
export const usePermissions = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, permissions } =
    useAuthContext();
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: () => isAdmin,
    permissions,
  };
};

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/main-settings/users-teams/user-directory": ["view-users"],
  "/main-settings/users-teams/supervisor-teams": ["view-teams"],
  "/main-settings/users-teams/management-groups": ["view-groups"],
  "/main-settings/users-teams/ranks-and-permissions": ["view-ranks"],
  "/main-settings/users-teams": ["view-users"],
  "/gsm/dashboard": ["view-gsm"],
  "/gsm/list": ["view-gsm"],
  "/gsm/assign": ["view-gsm"],
  "/gsm/ports": ["view-gsm"],
  "/gsm/inbox": ["view-gsm"],
  "/call-logs/dashboard": [PERMISSIONS.VIEW_CALL_LOGS],
  "/call-logs": [PERMISSIONS.VIEW_CALL_LOGS],
  "/call-recordings/dashboard": [PERMISSIONS.VIEW_CALL_RECORDINGS],
  "/call-recordings": [PERMISSIONS.VIEW_CALL_RECORDINGS],
  "/ai-ml/dashboard": ["view-ai-ml"],
  "/ai-ml/audio-transcription": ["view-ai-ml"],
  "/ai-ml/translate": ["view-ai-ml"],
  "/ai-ml/get-transcription": ["view-ai-ml"],
  "/ai-ml/analysis": ["view-ai-ml"],
  "/reports": ["view-reports"],
};

export const checkRoutePermission = (
  pathname: string,
  permissions: string[],
): boolean => {
  const required = ROUTE_PERMISSIONS[pathname];
  if (!required) return true;
  return required.some((permission) => permissions.includes(permission));
};
