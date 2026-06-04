import axiosInstance from "@utils/axios";
import { fetchUsersDirectoryList, getParentUsers } from "@utils/users";
import { getMainAppUsers, setStaffManagementCompanyIdentifier } from "@utils/staffManagement";
import type { AssigneeMatch, WorkloadQueryBase, WorkloadRangePreset } from "@utils/tasks";
import { workloadProjectFilterQuery } from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadProjectFilterValue } from "@page-modules/planner/workload/workloadDomain";

export type WorkloadCompanyScope = Readonly<{
  companyId: string;
  companyIdentifier: string;
}>;

function readStringCandidate(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Logged-in user's company (id + identifier from session). */
export function readWorkloadCompanyScopeFromSession(
  user: unknown,
): WorkloadCompanyScope | null {
  if (user == null || typeof user !== "object") return null;
  const record = user as Record<string, unknown>;
  const companyId = readStringCandidate(record.company_id);
  const companyIdentifier = readStringCandidate(record.company_identifier);
  if (!companyId && !companyIdentifier) return null;
  return { companyId, companyIdentifier };
}

/** True when a directory / hierarchy user row belongs to the viewer's company. */
export function userRowMatchesCompanyScope(
  row: unknown,
  scope: WorkloadCompanyScope,
): boolean {
  if (row == null || typeof row !== "object") return false;
  const record = row as Record<string, unknown>;

  const directId = readStringCandidate(record.company_id);
  const directIdentifier = readStringCandidate(record.company_identifier);
  if (scope.companyId && directId && directId === scope.companyId) return true;
  if (
    scope.companyIdentifier &&
    directIdentifier &&
    directIdentifier === scope.companyIdentifier
  ) {
    return true;
  }
  if (directId || directIdentifier) return false;

  const company = record.company;
  if (company != null && typeof company === "object") {
    const nested = company as Record<string, unknown>;
    const nestedId =
      readStringCandidate(nested.id) || readStringCandidate(nested.company_id);
    const nestedIdentifier =
      readStringCandidate(nested.identifier) ||
      readStringCandidate(nested.company_identifier) ||
      readStringCandidate(nested.tenant_id);
    if (scope.companyId && nestedId) return nestedId === scope.companyId;
    if (scope.companyIdentifier && nestedIdentifier) {
      return nestedIdentifier === scope.companyIdentifier;
    }
    return false;
  }

  // Rows without company metadata are treated as in-scope (JWT/module-scoped lists).
  return true;
}

function filterUserRowsForCompanyScope(
  rows: readonly unknown[],
  scope: WorkloadCompanyScope | null,
): unknown[] {
  if (!scope) return [...rows];
  return rows.filter((row) => userRowMatchesCompanyScope(row, scope));
}

export type WorkloadTeamScopeResult = Readonly<{
  loading: boolean;
  /** Listed in Control Hub `team_owners` (manager / team owner) for the user's team */
  isTeamOwner: boolean;
  /** In `team_member` but not an owner — Workload is manager-only per product spec */
  isTeamMemberOnly: boolean;
  /** Phone/extension values for everyone on the team roster (owners + members) */
  teamExtensions: string[];
}>;

const IDLE_SCOPE: WorkloadTeamScopeResult = {
  loading: false,
  isTeamOwner: false,
  isTeamMemberOnly: false,
  teamExtensions: [],
};

type TeamUserRow = Readonly<{
  id?: number | string;
  phone?: string | null;
  phone_no?: string | null;
  phone_number?: string | null;
  extension?: string | null;
  extension_number?: string | null;
}>;

function readTeamUserId(row: unknown): string {
  if (row == null || typeof row !== "object") return "";
  const id = (row as TeamUserRow).id;
  if (typeof id === "number" && Number.isFinite(id)) return String(Math.floor(id));
  if (typeof id === "string" && id.trim()) return id.trim();
  return "";
}

function readTeamUserExtension(row: unknown): string {
  if (row == null || typeof row !== "object") return "";
  const record = row as TeamUserRow;
  const candidates = [
    record.extension_number,
    record.extension,
    record.phone,
    record.phone_no,
    record.phone_number,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readTeamUserLists(raw: unknown): {
  teamMembers: unknown[];
  teamOwners: unknown[];
} {
  if (raw == null) return { teamMembers: [], teamOwners: [] };
  if (Array.isArray(raw)) {
    return { teamMembers: raw, teamOwners: [] };
  }
  if (typeof raw !== "object") {
    return { teamMembers: [], teamOwners: [] };
  }
  const data = raw as Record<string, unknown>;
  const teamMembers = Array.isArray(data.team_member) ? data.team_member : [];
  const teamOwners = Array.isArray(data.team_owners) ? data.team_owners : [];
  return { teamMembers, teamOwners };
}

function collectUniqueExtensions(rows: readonly unknown[]): string[] {
  const extensions = new Set<string>();
  for (const row of rows) {
    const ext = readTeamUserExtension(row);
    if (ext) extensions.add(ext);
  }
  return [...extensions];
}

function teamRowMatchesViewer(
  row: unknown,
  sessionUserId: string,
  sessionExtension: string,
): boolean {
  if (sessionUserId && readTeamUserId(row) === sessionUserId) {
    return true;
  }
  const viewerExt = sessionExtension.trim();
  if (!viewerExt) return false;
  return readTeamUserExtension(row) === viewerExt;
}

export function parseWorkloadTeamScope(
  raw: unknown,
  sessionUserId: string,
  sessionExtension = "",
): WorkloadTeamScopeResult {
  const selfId = sessionUserId.trim();
  const viewerExt = sessionExtension.trim();
  const { teamMembers, teamOwners } = readTeamUserLists(raw);

  if (!selfId && !viewerExt) {
    return IDLE_SCOPE;
  }
  if (teamMembers.length === 0 && teamOwners.length === 0) {
    return IDLE_SCOPE;
  }

  const isTeamOwner = teamOwners.some((row) =>
    teamRowMatchesViewer(row, selfId, viewerExt),
  );
  const isTeamMember = teamMembers.some((row) =>
    teamRowMatchesViewer(row, selfId, viewerExt),
  );
  const isTeamMemberOnly = isTeamMember && !isTeamOwner;
  const roster = [...teamOwners, ...teamMembers];
  const teamExtensions = collectUniqueExtensions(roster);

  return {
    loading: false,
    isTeamOwner,
    isTeamMemberOnly,
    teamExtensions,
  };
}

type BuildWorkloadQueryInput = Readonly<{
  viewerExtension: string;
  teamScope: Pick<WorkloadTeamScopeResult, "isTeamOwner" | "teamExtensions">;
  memberFilter: string;
  assigneeMatch: AssigneeMatch;
  range: WorkloadRangePreset;
  customStart: string;
  customEnd: string;
  customRangeValid: boolean;
  projectFilter: WorkloadProjectFilterValue;
}>;

function buildWorkloadQueryBase(input: BuildWorkloadQueryInput): WorkloadQueryBase {
  const base: WorkloadQueryBase = {
    assignee_match: input.assigneeMatch,
    range: input.range,
    ...workloadProjectFilterQuery(input.projectFilter),
  };
  if (input.range === "custom" && input.customRangeValid) {
    base.start = input.customStart;
    base.end = input.customEnd;
  }
  return base;
}

/** Non-root grid/board: `extension_numbers[]` from team roster (not only the viewer). */
function resolveTeamMemberExtensionNumbers(
  input: BuildWorkloadQueryInput,
): string[] | undefined {
  if (input.memberFilter !== "all") {
    const single = input.memberFilter.trim();
    return single ? [single] : undefined;
  }
  const roster = input.teamScope.teamExtensions
    .map((ext) => ext.trim())
    .filter(Boolean);
  if (roster.length > 0) {
    return [...new Set(roster)];
  }
  return undefined;
}

/**
 * Team owner (root): no `extension_number` / `extension_numbers` — server resolves the team from JWT.
 */
export function buildWorkloadSummaryQuery(input: BuildWorkloadQueryInput): WorkloadQueryBase {
  const base = buildWorkloadQueryBase(input);
  if (input.teamScope.isTeamOwner) {
    return base;
  }
  const viewer = input.viewerExtension.trim();
  if (viewer) {
    base.extension_number = viewer;
  }
  return base;
}

/**
 * Team owner (root): no extension params.
 * Otherwise: `extension_numbers[]` for grid/board scope.
 */
export function buildWorkloadGridBoardQuery(input: BuildWorkloadQueryInput): WorkloadQueryBase {
  const base = buildWorkloadQueryBase(input);
  if (input.teamScope.isTeamOwner) {
    return base;
  }
  const extensions = resolveTeamMemberExtensionNumbers(input);
  if (extensions?.length) {
    base.extension_numbers = extensions;
  }
  return base;
}

type DirectoryUserRow = Readonly<{
  extension?: string | number | null;
  extension_number?: string | number | null;
  phone?: string | number | null;
  phone_no?: string | null;
  phone_number?: string | number | null;
}>;

function readDirectoryUserExtension(row: unknown): string {
  if (row == null || typeof row !== "object") return "";
  const record = row as DirectoryUserRow;
  const candidates = [
    record.extension_number,
    record.extension,
    record.phone,
    record.phone_no,
    record.phone_number,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function collectExtensionsFromUserRows(rows: readonly unknown[]): string[] {
  const extensions = new Set<string>();
  for (const row of rows) {
    const ext = readDirectoryUserExtension(row);
    if (ext) extensions.add(ext);
  }
  return [...extensions];
}

/** Company-wide roster for root / company admin (same company as the logged-in user). */
export async function fetchCompanyWorkloadRoster(
  companyScope: WorkloadCompanyScope | null = null,
): Promise<string[]> {
  if (companyScope?.companyIdentifier) {
    setStaffManagementCompanyIdentifier(companyScope.companyIdentifier);
    try {
      const staffUsers = await getMainAppUsers(companyScope.companyIdentifier);
      const scopedStaff = filterUserRowsForCompanyScope(
        Array.isArray(staffUsers) ? staffUsers : [],
        companyScope,
      );
      const fromStaff = collectExtensionsFromUserRows(scopedStaff);
      if (fromStaff.length > 0) return fromStaff;
    } catch {
      // Fall through to filtered directory sources.
    }
  }

  try {
    const parentUsers = await getParentUsers();
    if (Array.isArray(parentUsers) && parentUsers.length > 0) {
      const scoped = filterUserRowsForCompanyScope(parentUsers, companyScope);
      const fromParent = collectExtensionsFromUserRows(scoped);
      if (fromParent.length > 0) return fromParent;
    }
  } catch {
    // Fall through to paginated directory list.
  }

  try {
    const directory = await fetchUsersDirectoryList();
    const scoped = filterUserRowsForCompanyScope(directory, companyScope);
    const fromDirectory = collectExtensionsFromUserRows(scoped);
    if (fromDirectory.length > 0) return fromDirectory;
  } catch {
    return [];
  }

  return [];
}

/** Extensions that may appear in workload member lists for the logged-in user's company. */
export function buildWorkloadCompanyExtensionAllowlist(input: Readonly<{
  companyScope: WorkloadCompanyScope | null;
  companyRoster?: readonly string[];
  hierarchyExtensions?: unknown[] | null;
  teamExtensions?: readonly string[];
  viewerExtension?: string;
}>): ReadonlySet<string> | undefined {
  if (!input.companyScope) return undefined;

  const allowlist = new Set<string>();
  const add = (ext: string) => {
    const normalized = ext.trim();
    if (normalized) allowlist.add(normalized);
  };

  for (const ext of input.companyRoster ?? []) add(ext);
  for (const ext of input.teamExtensions ?? []) add(ext);

  if (Array.isArray(input.hierarchyExtensions)) {
    for (const row of input.hierarchyExtensions) {
      if (!userRowMatchesCompanyScope(row, input.companyScope)) continue;
      if (row == null || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      const candidates = [
        record.extension_number,
        record.extension,
        record.phone,
        record.id,
      ];
      for (const value of candidates) {
        const normalized = readStringCandidate(value);
        if (normalized) {
          add(normalized);
          break;
        }
      }
    }
  }

  const viewer = input.viewerExtension?.trim();
  if (viewer) add(viewer);

  return allowlist.size > 0 ? allowlist : undefined;
}

export async function fetchWorkloadTeamScope(
  sessionUserId: string,
  sessionExtension = "",
): Promise<WorkloadTeamScopeResult> {
  const selfId = sessionUserId.trim();
  const viewerExt = sessionExtension.trim();
  if (!selfId && !viewerExt) return IDLE_SCOPE;

  const numericId = Number(selfId);
  const id = Number.isFinite(numericId) ? numericId : undefined;
  if (!id) {
    return parseWorkloadTeamScope(null, selfId, viewerExt);
  }
  try {
    // Use a workload-specific fetch so team-scope failures don't toast
    // (e.g. backend "Group Not Found" for users without a team).
    const response = await axiosInstance.post("teams/users", { id });
    const payload = (response?.data as { data?: unknown } | undefined)?.data;
    return parseWorkloadTeamScope(payload, selfId, viewerExt);
  } catch {
    // Fall back to viewer-only scope; UI will still render with padding logic.
    return {
      loading: false,
      isTeamOwner: false,
      isTeamMemberOnly: false,
      teamExtensions: viewerExt ? [viewerExt] : [],
    };
  }
}
