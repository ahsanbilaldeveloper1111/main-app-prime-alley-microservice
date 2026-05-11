import type { MainAppDepartmentLookup, MainAppUserLookup } from "@hooks/useMainAppLookups";
import {
  findMainAppUserByOrgChartUserId,
  normalizeOrgChartUserKey,
} from "@utils/workforce/orgChartMainAppUserMatch";

/** API org-chart-tree node shape */
export interface ApiOrgChartNode {
  id?: number;
  user_id?: string;
  parent_id?: number | string | null;
  parent_profile_id?: number | string | null;
  department_id?: string;
  job_title?: string;
  status?: string;
  is_on_leave_today?: boolean;
  designation?: string;
  attendance?: { status?: string; check_in_at?: string | null; check_out_at?: string | null };
  children?: ApiOrgChartNode[];
  [key: string]: unknown;
}

export type OrgChartEmployeeStatus = "On Leave" | "Active" | "Inactive";

/** Resolved employee node used by tree UI + sidebar */
export interface OrgChartEmployee {
  id: string;
  userId?: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  status?: OrgChartEmployeeStatus;
  children?: OrgChartEmployee[];
}

/** Sidebar/API raw profile (org-chart tree row). */
export type OrgChartRawProfile = ApiOrgChartNode;

export function serializeOrgChartFiltersKey(
  departmentId: string | undefined,
  userIds: string[] | undefined,
  /** Included so React Query refetches when team attendance scope changes. */
  attendanceScopeKey = "",
): string {
  const sorted = [...(userIds ?? [])].sort((a, b) => a.localeCompare(b)).join(",");
  return `${departmentId ?? ""}|${sorted}|${attendanceScopeKey}`;
}

export function buildOrgChartTreeRequestParams(
  departmentId?: string,
  userIds?: string[],
): { department_id?: string; user_ids?: string[] } | undefined {
  const params: { department_id?: string; user_ids?: string[] } = {};
  if (departmentId != null && departmentId !== "") params.department_id = departmentId;
  if (userIds != null && userIds.length > 0) params.user_ids = userIds;
  return Object.keys(params).length ? params : undefined;
}

export function parseOrgChartTreeResponse(raw: unknown): ApiOrgChartNode[] {
  if (Array.isArray(raw)) return raw as ApiOrgChartNode[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: ApiOrgChartNode[] }).data;
  }
  return [];
}

export function employeeStatusFromApiNode(node: ApiOrgChartNode): OrgChartEmployeeStatus {
  if (node.is_on_leave_today) return "On Leave";
  const rawStatus = (node.status ?? "").toString().toLowerCase();
  if (rawStatus === "inactive") return "Inactive";
  return "Active";
}

export function formatAttendanceLabel(attStatus: string | undefined): string {
  if (attStatus === undefined || attStatus === "" || attStatus === "none") {
    return "No Attendance";
  }
  if (attStatus === "checked_in") return "Checked in";
  if (attStatus === "checked_out") return "Checked out";
  return attStatus.replaceAll("_", " ");
}

export function flattenOrgChartTeam(
  emp: OrgChartEmployee | null,
  out: OrgChartEmployee[] = [],
): OrgChartEmployee[] {
  if (!emp) return out;
  if (emp.id !== "root") out.push(emp);
  (emp.children ?? []).forEach((c) => flattenOrgChartTeam(c, out));
  return out;
}

export function buildRawProfileByIdMap(nodes: ApiOrgChartNode[]): Record<string, ApiOrgChartNode> {
  const map: Record<string, ApiOrgChartNode> = {};
  const walk = (list: ApiOrgChartNode[]) => {
    list.forEach((n) => {
      if (n.id != null) map[String(n.id)] = n;
      if (n.children?.length) walk(n.children);
    });
  };
  if (nodes.length) walk(nodes);
  return map;
}

export function collectOrgChartUserIds(nodes: ApiOrgChartNode[]): Set<string> {
  const set = new Set<string>();
  const walk = (list: ApiOrgChartNode[]) => {
    list.forEach((n) => {
      if (n.user_id != null) set.add(String(n.user_id));
      if (n.children?.length) walk(n.children);
    });
  };
  if (nodes.length) walk(nodes);
  return set;
}

export interface BuildOrgChartDisplayTreeParams {
  orgChartTreeRaw: ApiOrgChartNode[];
  users: MainAppUserLookup[];
  departments: MainAppDepartmentLookup[];
  companyName: string;
  selectedDepartmentLabel: string;
  selectedUserIds: readonly string[];
}

export function buildOrgChartDisplayTree(params: BuildOrgChartDisplayTreeParams): OrgChartEmployee | null {
  const {
    orgChartTreeRaw,
    users,
    departments,
    companyName,
    selectedDepartmentLabel,
    selectedUserIds,
  } = params;
  if (!orgChartTreeRaw.length) return null;

  const getName = (userId: string | undefined) => {
    if (!userId) return "—";
    const u = findMainAppUserByOrgChartUserId(users, userId);
    return u?.name ?? userId;
  };

  const getDeptName = (departmentId: string | undefined) => {
    if (!departmentId) return "—";
    const d = departments.find((x) => String(x.id) === String(departmentId));
    return d?.name ?? departmentId;
  };

  const apiNodeToEmployee = (node: ApiOrgChartNode): OrgChartEmployee => {
    const status = employeeStatusFromApiNode(node);
    const uid = node.user_id;
    const desRaw = node.designation;
    const designation = typeof desRaw === "string" ? desRaw.trim() : "";
    const title = designation === "" ? "—" : designation;
    return {
      id: String(node.id ?? ""),
      userId: uid === undefined || uid === null ? undefined : String(uid),
      name: getName(node.user_id),
      title,
      department: getDeptName(node.department_id),
      avatar: "",
      status,
      children:
        node.children && node.children.length > 0 ? node.children.map(apiNodeToEmployee) : undefined,
    };
  };

  const roots = orgChartTreeRaw.map(apiNodeToEmployee);
  const isChartFiltered =
    selectedDepartmentLabel !== "All Department" || selectedUserIds.length > 0;
  const syntheticRoot: OrgChartEmployee = {
    id: "root",
    name: companyName,
    title: "",
    department: "",
    avatar: "",
    status: "Active",
    children: roots,
  };

  return roots.length === 1 && !isChartFiltered ? roots[0] : syntheticRoot;
}

export function filterMainAppUsersInOrgChart(
  mainAppUsers: MainAppUserLookup[],
  orgChartUserIds: Set<string>,
): MainAppUserLookup[] {
  return (mainAppUsers ?? []).filter((u) => {
    const phoneKey = normalizeOrgChartUserKey(u.phone);
    return (
      (phoneKey !== "" && orgChartUserIds.has(phoneKey)) || orgChartUserIds.has(String(u.id))
    );
  });
}

export function findOrgChartEmployeeParent(
  tree: OrgChartEmployee,
  targetId: string,
  parent: OrgChartEmployee | null = null,
): OrgChartEmployee | null {
  if (tree.id === targetId) {
    return parent;
  }
  const children = tree.children;
  if (!children) {
    return null;
  }
  for (const child of children) {
    const result = findOrgChartEmployeeParent(child, targetId, tree);
    if (result !== null) {
      return result;
    }
  }
  return null;
}

export function collectSubtreeIdsForUser(
  orgData: OrgChartEmployee,
  selectedUserId: string,
): Set<string> {
  const set = new Set<string>();
  const collectSubtree = (emp: OrgChartEmployee): void => {
    set.add(emp.id);
    (emp.children ?? []).forEach(collectSubtree);
  };
  const findAndCollect = (emp: OrgChartEmployee): boolean => {
    if (emp.userId === selectedUserId) {
      collectSubtree(emp);
      return true;
    }
    for (const c of emp.children ?? []) {
      if (findAndCollect(c)) return true;
    }
    return false;
  };
  if (orgData.id === "root" && orgData.children) {
    orgData.children.forEach((c) => findAndCollect(c));
  } else {
    findAndCollect(orgData);
  }
  return set;
}

/** Union of subtree node ids for each selected org-chart `user_id`. */
export function collectSubtreeIdsForUsers(
  orgData: OrgChartEmployee,
  selectedUserIds: readonly string[],
): Set<string> {
  const merged = new Set<string>();
  for (const raw of selectedUserIds) {
    const uid = String(raw).trim();
    if (uid === "") continue;
    collectSubtreeIdsForUser(orgData, uid).forEach((id) => merged.add(id));
  }
  return merged;
}
