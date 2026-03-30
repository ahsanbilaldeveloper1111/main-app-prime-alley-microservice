function stringifyApiScalar(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return String(value);
  return fallback;
}

/** One row from project `members` (API): match `extension_number` to session user phone/extension. */
export type ProjectMemberRoleRow = {
  extension_number?: string | number | null;
  role?: string | null;
};

function resolveMembersFromProject(project: unknown): ProjectMemberRoleRow[] | undefined {
  if (project == null || typeof project !== "object") return undefined;
  const p = project as Record<string, unknown>;
  const apiData = p.apiData as { members?: ProjectMemberRoleRow[] } | null | undefined;
  if (Array.isArray(apiData?.members)) return apiData.members;
  if (Array.isArray(p.members)) return p.members as ProjectMemberRoleRow[];
  return undefined;
}

function resolveOwnerExtension(project: unknown): string {
  if (project == null || typeof project !== "object") return "";
  const p = project as Record<string, unknown>;
  const api = p.apiData as Record<string, unknown> | undefined;
  const raw = p.owner_extension_number ?? api?.owner_extension_number;
  return stringifyApiScalar(raw).trim();
}

/** NextAuth session → value to match against `members[].extension_number`. */
export function getSessionPhoneOrExtension(
  session: { user?: unknown } | null | undefined,
): string {
  const u = session?.user as { phone?: string; extension?: string } | undefined;
  return stringifyApiScalar(u?.phone).trim() || stringifyApiScalar(u?.extension).trim();
}

/** Resolved role for permission checks (API may also send `owner` on a row or `manager`; both are mapped here). */
export type ProjectMemberResolvedRole = "admin" | "viewer" | "member" | null;

/**
 * Finds the member whose `extension_number` equals the signed-in user's `phone` (or `extension` fallback).
 * @returns `admin` (includes row role `owner`), `viewer`, `member` (includes `manager`), or `null` if not listed / unknown.
 */
export function getProjectMemberRoleForSessionUser(
  members: ProjectMemberRoleRow[] | null | undefined,
  sessionUserPhoneOrExtension: string | null | undefined,
): ProjectMemberResolvedRole {
  const needle = stringifyApiScalar(sessionUserPhoneOrExtension).trim();
  if (!needle || !Array.isArray(members)) return null;
  for (const m of members) {
    if (stringifyApiScalar(m.extension_number).trim() !== needle) continue;
    const r = String(m.role ?? "").trim().toLowerCase();
    if (r === "admin" || r === "owner") return "admin";
    if (r === "viewer") return "viewer";
    if (r === "member" || r === "manager") return "member";
    return null;
  }
  return null;
}

function allowsAdministerFromResolvedRole(role: ProjectMemberResolvedRole): boolean {
  return role === "admin";
}

function allowsTaskContributionFromResolvedRole(role: ProjectMemberResolvedRole): boolean {
  return role === "admin" || role === "member";
}

/**
 * Project settings and membership: members tab, statuses, labels, edit/delete project.
 * Only **admin** (and project owner when `owner_extension_number` matches). **Member** and **viewer** are denied.
 * If `members` is missing or empty, allows (API may omit the list).
 */
export function canAdministerProjectFromMembers(
  project: unknown,
  sessionUserPhoneOrExtension: string | null | undefined,
): boolean {
  const needle = stringifyApiScalar(sessionUserPhoneOrExtension).trim();
  const ownerExt = resolveOwnerExtension(project);
  if (needle && ownerExt && needle === ownerExt) {
    return true;
  }
  const members = resolveMembersFromProject(project);
  if (!Array.isArray(members) || members.length === 0) {
    return true;
  }
  const role = getProjectMemberRoleForSessionUser(members, sessionUserPhoneOrExtension);
  return allowsAdministerFromResolvedRole(role);
}

/**
 * Task-level work: create/edit/move tasks, board actions, task detail edit/delete.
 * **Admin** and **member** (and owner / empty-members fallback). **Viewer** is read-only here.
 */
export function canManageProjectFromMembers(
  project: unknown,
  sessionUserPhoneOrExtension: string | null | undefined,
): boolean {
  const needle = stringifyApiScalar(sessionUserPhoneOrExtension).trim();
  const ownerExt = resolveOwnerExtension(project);
  if (needle && ownerExt && needle === ownerExt) {
    return true;
  }
  const members = resolveMembersFromProject(project);
  if (!Array.isArray(members) || members.length === 0) {
    return true;
  }
  const role = getProjectMemberRoleForSessionUser(members, sessionUserPhoneOrExtension);
  return allowsTaskContributionFromResolvedRole(role);
}
