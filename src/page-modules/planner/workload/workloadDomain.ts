import {
  isExtensionPlaceholderLabel,
  lookupHierarchyExtensionDisplayName,
} from "@components/planner/plannerTasksListing/plannerTasksListingDomain";
import type { WorkloadGridData, WorkloadGridMember, WorkloadSummaryMember } from "@utils/tasks";

const MINUTES_PER_HOUR = 60;

type WorkloadMemberNameSource = Readonly<{
  name?: string | null;
  display_name?: string | null;
}>;

export function formatWorkloadMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0m";
  }
  const h = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const m = Math.round(totalMinutes % MINUTES_PER_HOUR);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatWorkloadPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
}

const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function formatWorkloadDayHeader(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const wd = WEEKDAY_SHORT[d.getDay()];
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${wd} ${month} ${day}`;
}

/** Two-line grid column header (weekday + month day), matching workload grid design. */
export function formatWorkloadGridDayHeader(isoDate: string): { weekday: string; dateLabel: string } {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { weekday: isoDate, dateLabel: "" };
  }
  const month = d.toLocaleString("en-US", { month: "short" });
  return {
    weekday: WEEKDAY_SHORT[d.getDay()] ?? "",
    dateLabel: `${month} ${d.getDate()}`,
  };
}

export type WorkloadGridCellVisualVariant = "empty" | "zero" | "filled";

export function workloadGridCellVisualVariant(
  cell: { task_count?: number; estimated_minutes?: number } | undefined,
): WorkloadGridCellVisualVariant {
  if (cell == null || (cell.task_count ?? 0) <= 0) return "empty";
  if ((cell.estimated_minutes ?? 0) <= 0) return "zero";
  return "filled";
}

export function workloadGridCellPercentLabel(loadPercent: number, variant: WorkloadGridCellVisualVariant): string {
  if (variant === "zero") return "0% Planned";
  const rounded = Math.round(loadPercent * 10) / 10;
  const base = `${rounded}%`;
  if (loadPercent > 100) return `${base} (over)`;
  return base;
}

export function isWorkloadCellOverCapacity(loadPercent: number): boolean {
  return Number.isFinite(loadPercent) && loadPercent > 100;
}

export function workloadCellHasUnestimated(cell: {
  has_unestimated?: boolean;
  unestimated_count?: number;
}): boolean {
  return cell.has_unestimated === true || (cell.unestimated_count ?? 0) > 0;
}

export function workloadCellBarFillClass(band: string): string {
  const safe = band.replace(/[^a-z0-9_-]/gi, "");
  return `workload-cell__bar-fill--${safe || "available"}`;
}

const WORKLOAD_AVATAR_PALETTE = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#4f46e5",
] as const;

export function workloadMemberAvatarColor(extensionNumber: string): string {
  const ext = extensionNumber.trim();
  let hash = 0;
  for (let i = 0; i < ext.length; i += 1) {
    const codePoint = ext.codePointAt(i) ?? 0;
    hash = Math.trunc(hash * 31 + codePoint);
    if (codePoint > 0xffff) i += 1;
  }
  const idx = Math.abs(hash) % WORKLOAD_AVATAR_PALETTE.length;
  return WORKLOAD_AVATAR_PALETTE[idx];
}

/** Board move dropdown label, e.g. `Mon · May 6`. */
export function formatWorkloadBoardMoveLabel(isoDate: string): string {
  const header = formatWorkloadDayHeader(isoDate);
  const space = header.indexOf(" ");
  if (space < 0) return header;
  return `${header.slice(0, space)} · ${header.slice(space + 1)}`;
}

/** Sidebar title date, e.g. `Wed, May 8`. */
/** Range label for board cards, e.g. `May 1 – May 30`. */
export function formatWorkloadRangeLabel(rangeStart: string, rangeEnd: string): string {
  const start = formatWorkloadShortDueDate(rangeStart);
  const end = formatWorkloadShortDueDate(rangeEnd);
  if (rangeStart.slice(0, 10) === rangeEnd.slice(0, 10)) return start;
  return `${start} – ${end}`;
}

export type WorkloadTaskCardAccent = "done" | "overdue" | "critical" | "high" | "medium" | "low";

export function workloadTaskCardAccent(task: {
  is_completed: boolean;
  is_overdue: boolean;
  priority: number;
}): WorkloadTaskCardAccent {
  if (task.is_completed) return "done";
  if (task.is_overdue) return "overdue";
  return workloadPriorityTone(task.priority);
}

export function formatWorkloadShortDueDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const slice = isoDate.slice(0, 10);
  const d = new Date(`${slice}T12:00:00`);
  if (Number.isNaN(d.getTime())) return slice;
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

/** Dropdown label: prefer name only (design); fall back to extension. */
export function formatWorkloadMemberAssignOption(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
): string {
  const ext = extensionNumber.trim();
  const base = workloadMemberBaseName(ext, hierarchyExtensions);
  if (base && base !== ext) return base;
  return formatWorkloadMemberLabel(ext, hierarchyExtensions);
}

export function formatWorkloadDayDetailDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const wd = d.toLocaleString("en-US", { weekday: "short" });
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${wd}, ${month} ${d.getDate()}`;
}

const DEFAULT_DAY_CAPACITY_MINUTES = 8 * MINUTES_PER_HOUR;

export function workloadDayCapacityMinutes(
  cellCapacityMinutes?: number | null,
): number {
  if (
    typeof cellCapacityMinutes === "number" &&
    Number.isFinite(cellCapacityMinutes) &&
    cellCapacityMinutes > 0
  ) {
    return cellCapacityMinutes;
  }
  return DEFAULT_DAY_CAPACITY_MINUTES;
}

export function workloadPriorityTone(
  priority: number,
): "critical" | "high" | "medium" | "low" {
  if (priority >= 3) return "critical";
  if (priority >= 2) return "high";
  if (priority === 1) return "medium";
  return "low";
}

export function workloadTaskProjectLabel(task: {
  project_id?: number | null;
  project_name?: string | null;
}): string {
  if (task.project_name?.trim()) return task.project_name.trim();
  if (task.project_id == null) return "Personal";
  return "—";
}

export function isWorkloadOrganizationTask(task: {
  type?: string | null;
  project_id?: number | null;
}): boolean {
  return task.type === "regular" && task.project_id == null;
}

export function formatWorkloadDayTotalSummary(
  estimatedMinutes: number,
  unestimatedCount: number,
): string {
  const estPart = `${formatWorkloadMinutes(estimatedMinutes)} estimated`;
  if (unestimatedCount <= 0) return `Total: ${estPart}`;
  const unestPart = `${unestimatedCount} unestimated task${unestimatedCount === 1 ? "" : "s"}`;
  return `Total: ${estPart} + ${unestPart}`;
}

const WORKLOAD_VIEW_STORAGE_KEY = "planner.workload.mainView";

export type WorkloadMainView = "grid" | "board";

export function readWorkloadMainViewPreference(): WorkloadMainView {
  if (globalThis.window === undefined) return "grid";
  const raw = globalThis.window.localStorage.getItem(WORKLOAD_VIEW_STORAGE_KEY);
  return raw === "board" ? "board" : "grid";
}

export function writeWorkloadMainViewPreference(view: WorkloadMainView): void {
  if (globalThis.window === undefined) return;
  globalThis.window.localStorage.setItem(WORKLOAD_VIEW_STORAGE_KEY, view);
}

type WorkloadTaskEstimateSource = Readonly<{
  estimated_minutes?: number | string | null;
  estimated_duration_minutes?: number | string | null;
  estimated_hours?: number | string | null;
  estimate_minutes?: number | string | null;
  duration_minutes?: number | string | null;
}>;

function parsePositiveMinutes(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

/** Resolve task estimate minutes from API fields (names vary by endpoint). */
export function resolveWorkloadTaskEstimateMinutes(task: WorkloadTaskEstimateSource): number {
  const candidates = [
    task.estimated_minutes,
    task.estimated_duration_minutes,
    task.estimate_minutes,
    task.duration_minutes,
  ];
  for (const value of candidates) {
    const minutes = parsePositiveMinutes(value);
    if (minutes != null) return minutes;
  }
  const hoursFloat = Number(task.estimated_hours);
  if (Number.isFinite(hoursFloat) && hoursFloat > 0) {
    return Math.round(hoursFloat * 60);
  }
  return 0;
}

export function isWorkloadTaskUnestimated(task: WorkloadTaskEstimateSource): boolean {
  return resolveWorkloadTaskEstimateMinutes(task) <= 0;
}

export function formatWorkloadTaskEstimate(task: WorkloadTaskEstimateSource): string {
  return formatWorkloadMinutes(resolveWorkloadTaskEstimateMinutes(task));
}

export function isSameCalendarDay(isoDate: string, now = new Date()): boolean {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function workloadPriorityLabel(priority: number): string {
  if (priority >= 3) return "Critical";
  if (priority >= 2) return "High";
  if (priority === 1) return "Medium";
  return "Low";
}

/** Map workload numeric priority to planner task API string values. */
export function workloadPriorityToApiString(priority: number): string {
  if (priority >= 3) return "urgent";
  if (priority >= 2) return "high";
  if (priority === 1) return "normal";
  return "low";
}

export type WorkloadTaskPatchFields = Readonly<{
  due_date?: string | null;
  extension_numbers?: string[];
  is_completed?: boolean;
  estimated_duration_minutes?: number;
}>;

/** Always include priority so partial updates do not clear it server-side. */
export function buildWorkloadTaskPatchBody(
  task: Readonly<{ priority: number }>,
  fields: WorkloadTaskPatchFields,
): WorkloadTaskPatchFields & { priority: string } {
  return {
    ...fields,
    priority: workloadPriorityToApiString(task.priority),
  };
}

/** API `load_band` values (TaskWorkloadController). */
export const WORKLOAD_LOAD_BANDS = [
  "available",
  "incomplete_data",
  "comfortable",
  "near_full",
  "overloaded",
] as const;

export type WorkloadLoadBand = (typeof WORKLOAD_LOAD_BANDS)[number];

const LOAD_BAND_LABELS: Record<string, string> = {
  available: "Available (0–70%)",
  comfortable: "Comfortable (70–90%)",
  near_full: "Near full (90–100%)",
  overloaded: "Overloaded (>100%)",
  incomplete_data: "Incomplete data",
};

export function workloadLoadBandLabel(band: string): string {
  return LOAD_BAND_LABELS[band] ?? band.replaceAll("_", " ");
}

/** Grid legend (reference design + Postman `load_band`). */
export const WORKLOAD_GRID_LEGEND_ITEMS = [
  { id: "available", swatch: "#22c55e", label: "Available (0–70%)" },
  { id: "comfortable", swatch: "#eab308", label: "Comfortable (70–90%)" },
  { id: "near_full", swatch: "#f97316", label: "Near full (90–100%)" },
  { id: "overloaded", swatch: "#ef4444", label: "Overloaded (>100%)" },
  { id: "incomplete_data", swatch: "#9ca3af", label: "Incomplete data" },
] as const;

/** BEM-style modifier for cell backgrounds (see `workload-view.scss`). */
export function workloadCellBandClass(band: string): string {
  const safe = band.replace(/[^a-z0-9_-]/gi, "");
  return `workload-cell--${safe || "unknown"}`;
}

export function workloadCellKey(extensionNumber: string, isoDate: string): string {
  return `${extensionNumber}|${isoDate}`;
}

/** Collect assignee extensions from grid API payload (members, root list, or cells). */
export function collectWorkloadMemberExtensionsFromGrid(grid: WorkloadGridData): string[] {
  const fromMembers = (grid.members ?? [])
    .map((m) => m.extension_number?.trim())
    .filter((ext): ext is string => Boolean(ext));
  if (fromMembers.length > 0) return [...new Set(fromMembers)];

  const fromRoot = (grid.extension_numbers ?? [])
    .map((ext) => String(ext).trim())
    .filter(Boolean);
  if (fromRoot.length > 0) return [...new Set(fromRoot)];

  const fromCells = (grid.cells ?? [])
    .map((c) => c.extension_number?.trim())
    .filter((ext): ext is string => Boolean(ext));
  return [...new Set(fromCells)];
}

function buildWorkloadGridMemberRow(
  extensionNumber: string,
  existing?: WorkloadGridMember,
): WorkloadGridMember {
  return {
    extension_number: extensionNumber,
    name: existing?.name ?? null,
    display_name: existing?.display_name ?? null,
    is_owner: existing?.is_owner,
    role: existing?.role ?? null,
  };
}

/**
 * When the API returns no `members`, fall back to the logged-in user's extension (and any
 * extensions discovered on cells). Ensures the PEOPLE row still renders like the reference UI.
 */
export function resolveWorkloadGridDisplayData(
  grid: WorkloadGridData | undefined,
  options: {
    viewerExtension: string;
    memberFilter?: string;
    rangeFallback?: WorkloadIsoDateRange;
    /** When the viewer is a team owner, use full roster if the API omits `members`. */
    teamExtensionNumbers?: string[];
  },
): WorkloadGridData | undefined {
  if (!grid) return undefined;

  const existingByExt = new Map<string, WorkloadGridMember>();
  for (const member of grid.members ?? []) {
    const ext = member.extension_number?.trim();
    if (ext) existingByExt.set(ext, member);
  }

  let extensionList = collectWorkloadMemberExtensionsFromGrid(grid);
  const viewer = options.viewerExtension.trim();

  if (options.memberFilter && options.memberFilter !== "all") {
    extensionList = [options.memberFilter.trim()];
  } else if (extensionList.length === 0) {
    const teamRoster = (options.teamExtensionNumbers ?? [])
      .map((ext) => ext.trim())
      .filter(Boolean);
    if (teamRoster.length > 0) {
      extensionList = [...new Set(teamRoster)];
    } else if (viewer) {
      extensionList = [viewer];
    }
  }

  const members = extensionList.map((ext) =>
    buildWorkloadGridMemberRow(ext, existingByExt.get(ext)),
  );

  let days = Array.isArray(grid.days) ? [...grid.days] : [];
  if (days.length === 0 && grid.range?.start && grid.range?.end) {
    days = listWorkloadDaysInRange(grid.range.start, grid.range.end);
  }
  if (days.length === 0 && options.rangeFallback) {
    days = listWorkloadDaysInRange(options.rangeFallback.start, options.rangeFallback.end);
  }

  const hasDisplayMembers = members.length > 0;
  const effectiveEmptyTeam = grid.empty_team === true && !hasDisplayMembers;

  return {
    ...grid,
    members,
    days,
    empty_team: effectiveEmptyTeam,
    empty_team_message: effectiveEmptyTeam ? grid.empty_team_message : null,
  };
}

/** Summary period panel: use API members or current viewer when empty. */
export function resolveWorkloadPeriodDisplayMembers(
  apiMembers: WorkloadSummaryMember[] | undefined,
  viewerExtension: string,
  teamExtensionNumbers?: string[],
): WorkloadSummaryMember[] {
  if (Array.isArray(apiMembers) && apiMembers.length > 0) {
    return apiMembers;
  }
  const roster = (teamExtensionNumbers ?? []).map((ext) => ext.trim()).filter(Boolean);
  if (roster.length > 0) {
    return roster.map((extension_number) => ({ extension_number }));
  }
  const viewer = viewerExtension.trim();
  if (!viewer) return [];
  return [
    {
      extension_number: viewer,
      load_band: "available",
      load_percent: 0,
      task_count: 0,
      unestimated_task_count: 0,
      is_overloaded: false,
    },
  ];
}

export function memberInitials(extensionNumber: string): string {
  const t = extensionNumber.trim();
  if (t.length <= 2) return t || "?";
  return t.slice(-2).toUpperCase();
}

/** Remove trailing `(ext)` / bare `ext` suffixes from a display name. */
export function stripExtensionSuffixFromDisplayName(
  displayName: string,
  extensionNumber: string,
): string {
  const ext = extensionNumber.trim();
  if (!ext) return displayName.trim();
  let result = displayName.trim();
  const parenExt = `(${ext})`;
  while (result.endsWith(parenExt)) {
    result = result.slice(0, -parenExt.length).trimEnd();
  }
  if (result.endsWith(ext)) {
    result = result.slice(0, -ext.length).trimEnd();
  }
  return result;
}

export function resolveWorkloadMemberName(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
  member?: WorkloadMemberNameSource | null,
): string {
  const ext = extensionNumber.trim();
  if (!ext) return "Unknown";
  const fromApi = member?.display_name?.trim() || member?.name?.trim();
  if (fromApi && !isExtensionPlaceholderLabel(fromApi, ext)) return fromApi;
  const fromHierarchy = lookupHierarchyExtensionDisplayName(ext, hierarchyExtensions);
  if (fromHierarchy && !isExtensionPlaceholderLabel(fromHierarchy, ext)) {
    return fromHierarchy;
  }
  return ext;
}

/** Person name without extension suffix (for labels and avatars). */
export function workloadMemberBaseName(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
  member?: WorkloadMemberNameSource | null,
): string {
  const ext = extensionNumber.trim();
  if (!ext) return "Unknown";
  const raw = resolveWorkloadMemberName(ext, hierarchyExtensions, member);
  const base = stripExtensionSuffixFromDisplayName(raw, ext);
  if (base && base !== ext) return base;
  return raw;
}

export function workloadMemberInitials(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
  member?: WorkloadMemberNameSource | null,
): string {
  const displayName = workloadMemberBaseName(extensionNumber, hierarchyExtensions, member);
  const ext = extensionNumber.trim();
  if (displayName !== ext && displayName.length > 0) {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  return memberInitials(ext);
}

export function formatWorkloadMemberLabel(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
  member?: WorkloadMemberNameSource | null,
): string {
  const ext = extensionNumber.trim();
  const base = workloadMemberBaseName(ext, hierarchyExtensions, member);
  if (!base || base === ext) return ext || "Unknown";
  return `${base} (${ext})`;
}

export type WorkloadWeekPreset = "this_week" | "next_week";

export type WorkloadIsoDateRange = Readonly<{
  start: string;
  end: string;
}>;

/** Format a local calendar date as `YYYY-MM-DD`. */
export function formatWorkloadIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the ISO-style week (Mon–Sun) containing `ref`. */
function mondayOfWorkloadWeek(ref: Date): Date {
  const monday = new Date(ref);
  monday.setHours(12, 0, 0, 0);
  const weekday = monday.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  monday.setDate(monday.getDate() + offset);
  return monday;
}

/** Preset week ranges (Monday–Sunday) for workload filters. */
export function getWorkloadWeekRange(
  preset: WorkloadWeekPreset,
  ref = new Date(),
): WorkloadIsoDateRange {
  const monday = mondayOfWorkloadWeek(ref);
  if (preset === "next_week") {
    monday.setDate(monday.getDate() + 7);
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatWorkloadIsoDate(monday),
    end: formatWorkloadIsoDate(sunday),
  };
}

export function isWorkloadCustomRangeValid(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start <= end;
}

/** Inclusive ISO date list from `start` through `end`. */
export function listWorkloadDaysInRange(start: string, end: string): string[] {
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [];
  }
  const days: string[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    days.push(formatWorkloadIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export type WorkloadProjectFilterValue = "all" | "none" | number;

export type WorkloadPriorityFilterValue =
  | "all"
  | "critical"
  | "high_plus"
  | "medium_plus";

export function workloadPassesPriorityFilter(
  priority: number,
  filter: WorkloadPriorityFilterValue,
): boolean {
  switch (filter) {
    case "critical":
      return priority >= 3;
    case "high_plus":
      return priority >= 2;
    case "medium_plus":
      return priority >= 1;
    default:
      return true;
  }
}

export function workloadProjectFilterSelectValue(
  projectFilter: WorkloadProjectFilterValue,
): string {
  if (projectFilter === "all") return "all";
  if (projectFilter === "none") return "none";
  return String(projectFilter);
}

export function workloadProjectFilterQuery(projectFilter: WorkloadProjectFilterValue): {
  project_id?: number;
  no_project?: boolean;
} {
  if (projectFilter === "none") return { no_project: true };
  if (typeof projectFilter === "number") return { project_id: projectFilter };
  return {};
}

export const WORKLOAD_DRAG_TASK_MIME = "application/x-workload-task-id";
