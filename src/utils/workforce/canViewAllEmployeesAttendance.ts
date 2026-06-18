import { HEADER_CONSTANTS } from "@constants/headerConstants";

const VIEW_ALL_COMPANY_EMPLOYEES =
  HEADER_CONSTANTS.PERMISSIONS.VIEW_ALL_COMPANY_EMPLOYEES_STAFF_MANAGEMENT;

/**
 * Workforce attendance / org-chart: who may load **company-wide** data vs **hierarchy-scoped**
 * (`GetHierarchyData` staff-management module).
 *
 * - **Team members** see only their team (plus self).
 * - **Company-wide** when any of: `is_admin` from auth, portal `user_type` root/admin/administrator,
 *   literal `root` on `role` / `username` (legacy), or **view all company employees** permission.
 * - **Not** inferred from generic job-title strings on `role` (e.g. HR “Administrator”) — those stay team-scoped.
 */
export type AttendancePrivilegedSessionUser = {
  is_admin?: string | number | boolean | null;
  user_type?: string | null;
  role?: string | null;
  username?: string | null;
  permissions?: readonly string[] | null;
};

function isTruthyAdminFlag(isAdmin: string | number | boolean | null | undefined): boolean {
  if (isAdmin == null) return false;
  if (typeof isAdmin === "boolean") return isAdmin;
  if (typeof isAdmin === "number") return isAdmin === 1;
  const s = String(isAdmin).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function isRootLike(value: string | null | undefined): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "root";
}

/** Login `userType` (and similar) — root / admin / administrator widen attendance; see module doc. */
function isElevatedPortalUserType(value: string | null | undefined): boolean {
  const t = String(value ?? "")
    .trim()
    .toLowerCase();
  return t === "root" || t === "admin" || t === "administrator";
}

export function canViewAllEmployeesAttendance(
  user: AttendancePrivilegedSessionUser | null | undefined,
): boolean {
  if (!user) return false;
  if (isTruthyAdminFlag(user.is_admin)) return true;
  if (isElevatedPortalUserType(user.user_type ?? undefined)) return true;
  if (isRootLike(user.role ?? undefined)) return true;
  if (isRootLike(user.username ?? undefined)) return true;
  if (user.permissions?.includes(VIEW_ALL_COMPANY_EMPLOYEES)) {
    return true;
  }
  return false;
}
