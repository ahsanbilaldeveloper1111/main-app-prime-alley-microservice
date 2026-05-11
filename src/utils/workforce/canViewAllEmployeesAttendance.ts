/**
 * Workforce attendance: admins / root may query any employee (with filters). Other users are
 * scoped to their Control Hub team (see `getTeamUsers` + `parseTeamUsersResponseForAttendanceScope`).
 *
 * Admin flag: aligned with `usePermissions().isAdmin()` (`Boolean(session.user.is_admin)`), not only `"1"`.
 */
export type AttendancePrivilegedSessionUser = {
  is_admin?: string | number | boolean | null;
  user_type?: string | null;
  role?: string | null;
  username?: string | null;
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

/** Backend role / userType strings that imply full attendance (when `is_admin` is missing or stale). */
function isAdministratorRoleLabel(role: string | null | undefined): boolean {
  const r = String(role ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
  if (r === "") return false;
  const tokens = r.split(" ");
  return tokens.some(
    (t) => t === "admin" || t === "administrator" || t === "superadmin" || t === "super_admin",
  );
}

export function canViewAllEmployeesAttendance(
  user: AttendancePrivilegedSessionUser | null | undefined,
): boolean {
  if (!user) return false;
  if (isTruthyAdminFlag(user.is_admin)) return true;
  if (isRootLike(user.user_type ?? undefined)) return true;
  if (isRootLike(user.role ?? undefined)) return true;
  if (isRootLike(user.username ?? undefined)) return true;
  if (isAdministratorRoleLabel(user.role ?? undefined)) return true;
  if (isAdministratorRoleLabel(user.user_type ?? undefined)) return true;
  return false;
}
