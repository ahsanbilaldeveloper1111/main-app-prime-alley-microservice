import { isAxiosError } from "axios";
import {
  getWorkloadSummary,
  type WorkloadBoardColumn,
  type WorkloadGridCell,
  type WorkloadGridData,
  type WorkloadGridMember,
} from "@utils/tasks";
import {
  filterWorkloadMemberExtensions,
  getWorkloadWeekRange,
  workloadProjectFilterQuery,
  type WorkloadPlannerFilterState,
  type WorkloadProjectFilterValue,
} from "@page-modules/planner/workload/workloadDomain";
import {
  buildWorkloadCompanyExtensionAllowlist,
  resolveWorkloadPrivilegedRosterExtensions,
  resolveWorkloadTeamRosterExtensions,
  type WorkloadCompanyScope,
} from "@page-modules/planner/workload/workloadTeamScope";

type MainView = "grid" | "board";

export function isWorkloadForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}

export function workloadPlannerErrorMessage(err: unknown): string {
  if (
    isAxiosError(err) &&
    typeof err.response?.data === "object" &&
    err.response.data !== null
  ) {
    const msg = (err.response.data as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function buildWorkloadQueryBase(
  extension: string,
  appliedFilters: WorkloadPlannerFilterState,
  appliedRangeValid: boolean,
): Parameters<typeof getWorkloadSummary>[0] {
  const { range, customStart, customEnd, assigneeMatch, projectFilter, memberFilter } =
    appliedFilters;
  const base: Parameters<typeof getWorkloadSummary>[0] = {
    extension_number: extension,
    assignee_match: assigneeMatch,
    range,
    ...workloadProjectFilterQuery(projectFilter),
  };
  if (range === "custom" && appliedRangeValid) {
    base.start = customStart;
    base.end = customEnd;
  }
  if (memberFilter !== "all") {
    base.extension_numbers = [memberFilter];
  }
  return base;
}

export function buildWorkloadQueryKeyParams(
  extension: string,
  appliedFilters: WorkloadPlannerFilterState,
  appliedProjectFilterKey: string,
) {
  const { range, customStart, customEnd, assigneeMatch, memberFilter } = appliedFilters;
  return {
    ext: extension,
    range,
    match: assigneeMatch,
    start: range === "custom" ? customStart : undefined,
    end: range === "custom" ? customEnd : undefined,
    member: memberFilter,
    project: appliedProjectFilterKey,
  };
}

export function resolveAppliedProjectFilterKey(projectFilter: WorkloadProjectFilterValue): string {
  if (projectFilter === "all") return "all";
  if (projectFilter === "none") return "none";
  return String(projectFilter);
}

export function resolveWorkloadGridRangeFallback(
  appliedFilters: WorkloadPlannerFilterState,
  appliedRangeValid: boolean,
): { start: string; end: string } {
  const { range, customStart, customEnd } = appliedFilters;
  if (range === "custom" && appliedRangeValid) {
    return { start: customStart, end: customEnd };
  }
  return getWorkloadWeekRange(range === "next_week" ? "next_week" : "this_week");
}

export function resolveWorkloadMemberExtensions(
  displayGridData: WorkloadGridData | undefined,
  extension: string,
  boardColumns: WorkloadBoardColumn[] | undefined,
): string[] {
  const fromDisplay = displayGridData?.members?.map((m) => m.extension_number) ?? [];
  if (fromDisplay.length > 0) return fromDisplay;
  if (extension) return [extension];
  return boardColumns?.map((c) => c.extension_number) ?? [];
}

export function computeWorkloadLoadingMain(
  queriesEnabled: boolean,
  mainView: MainView,
  summaryPending: boolean,
  gridPending: boolean,
  boardPending: boolean,
): boolean {
  if (!queriesEnabled) return true;
  if (summaryPending) return true;
  if (mainView === "grid" && gridPending) return true;
  return mainView === "board" && boardPending;
}

export function computeWorkloadIsApplyingFilters(
  hasPendingFilters: boolean,
  queriesEnabled: boolean,
  mainView: MainView,
  summaryFetching: boolean,
  gridFetching: boolean,
  boardFetching: boolean,
): boolean {
  if (hasPendingFilters || !queriesEnabled) return false;
  if (summaryFetching) return true;
  if (mainView === "grid" && gridFetching) return true;
  return mainView === "board" && boardFetching;
}

export type WorkloadSelectedCellState = Readonly<{
  extension: string;
  date: string;
  member?: Pick<WorkloadGridMember, "name" | "display_name">;
  cell?: WorkloadGridCell;
}> | null;

export function readWorkloadSessionUserId(user: unknown): string {
  if (user == null || typeof user !== "object") return "";
  const id = (user as { id?: string | number | null }).id;
  return id == null ? "" : String(id).trim();
}

export function readIsCompanyAdminFromSession(user: unknown): boolean {
  if (user == null || typeof user !== "object") return false;
  const value = (user as { is_company_admin?: unknown }).is_company_admin;
  return value === true || value === "1" || value === 1;
}

export function mergeWorkloadFilterMemberExtensions(
  isWorkloadRoot: boolean,
  rosterExtensions: readonly string[],
  memberExtensions: readonly string[],
): string[] {
  if (!isWorkloadRoot || rosterExtensions.length === 0) {
    return [...memberExtensions];
  }
  const merged = new Set<string>();
  for (const ext of rosterExtensions) {
    const normalized = ext.trim();
    if (normalized) merged.add(normalized);
  }
  for (const ext of memberExtensions) {
    const normalized = ext.trim();
    if (normalized) merged.add(normalized);
  }
  return [...merged];
}

export function buildWorkloadCellMap(
  cells: WorkloadGridCell[] | undefined,
  cellKeyFn: (extension: string, date: string) => string,
): Map<string, WorkloadGridCell> {
  const map = new Map<string, WorkloadGridCell>();
  if (!Array.isArray(cells)) return map;
  for (const cell of cells) {
    map.set(cellKeyFn(cell.extension_number, cell.date), cell);
  }
  return map;
}

export function resolveWorkloadPageCompanyAllowlist(
  isWorkloadRoot: boolean,
  input: Readonly<{
    companyScope: WorkloadCompanyScope | null;
    companyRoster?: readonly string[];
    hierarchyExtensions?: unknown[] | null;
    teamExtensions?: readonly string[];
    viewerExtension?: string;
  }>,
): ReadonlySet<string> | undefined {
  if (isWorkloadRoot) return undefined;
  return buildWorkloadCompanyExtensionAllowlist(input);
}

export function resolveWorkloadPageRosterExtensions(input: Readonly<{
  isWorkloadRoot: boolean;
  isTeamMemberOnly: boolean;
  teamExtensions: readonly string[];
  viewerExtension: string;
  companyRoster: readonly string[];
  hierarchyExtensions: unknown[] | null | undefined;
  hierarchyUsers: unknown[] | null | undefined;
  companyExtensionAllowlist: ReadonlySet<string> | undefined;
}>): string[] {
  const raw = input.isWorkloadRoot
    ? resolveWorkloadPrivilegedRosterExtensions({
        companyRoster: input.companyRoster,
        hierarchyExtensions: input.hierarchyExtensions,
        hierarchyUsers: input.hierarchyUsers,
        viewerExtension: input.viewerExtension,
      })
    : resolveWorkloadTeamRosterExtensions({
        isTeamMemberOnly: input.isTeamMemberOnly,
        teamExtensions: input.teamExtensions,
        viewerExtension: input.viewerExtension,
      });
  return filterWorkloadMemberExtensions(raw, input.companyExtensionAllowlist);
}
