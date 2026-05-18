import { lookupHierarchyExtensionDisplayName } from "@components/planner/plannerTasksListing/plannerTasksListingDomain";

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
    hash = Math.trunc(hash * 31 + ext.charCodeAt(i));
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

export function isWorkloadTaskUnestimated(task: {
  estimated_duration_minutes?: number | null;
}): boolean {
  const est = task.estimated_duration_minutes;
  return est == null || !Number.isFinite(est) || est <= 0;
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
  available: "Available",
  incomplete_data: "Incomplete data",
  comfortable: "Comfortable",
  near_full: "Near full",
  overloaded: "Overloaded",
};

export function workloadLoadBandLabel(band: string): string {
  return LOAD_BAND_LABELS[band] ?? band.replaceAll("_", " ");
}

/** BEM-style modifier for cell backgrounds (see `workload-view.scss`). */
export function workloadCellBandClass(band: string): string {
  const safe = band.replace(/[^a-z0-9_-]/gi, "");
  return `workload-cell--${safe || "unknown"}`;
}

export function workloadCellKey(extensionNumber: string, isoDate: string): string {
  return `${extensionNumber}|${isoDate}`;
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
  if (fromApi) return fromApi;
  const fromHierarchy = lookupHierarchyExtensionDisplayName(ext, hierarchyExtensions);
  if (fromHierarchy && fromHierarchy !== ext) return fromHierarchy;
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

export type WorkloadMemberFilterValue = "all" | string;

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
