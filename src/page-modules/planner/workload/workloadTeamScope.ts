import { getTeamUsers } from "@utils/teams";
import type { AssigneeMatch, WorkloadQueryBase, WorkloadRangePreset } from "@utils/tasks";
import { workloadProjectFilterQuery } from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadProjectFilterValue } from "@page-modules/planner/workload/workloadDomain";

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
  const candidates = [record.extension_number, record.extension, record.phone];
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

export async function fetchWorkloadTeamScope(
  sessionUserId: string,
  sessionExtension = "",
): Promise<WorkloadTeamScopeResult> {
  const selfId = sessionUserId.trim();
  const viewerExt = sessionExtension.trim();
  if (!selfId && !viewerExt) return IDLE_SCOPE;

  const numericId = Number(selfId);
  const raw = await getTeamUsers(
    undefined,
    Number.isFinite(numericId) ? numericId : undefined,
  );
  return parseWorkloadTeamScope(raw, selfId, viewerExt);
}
