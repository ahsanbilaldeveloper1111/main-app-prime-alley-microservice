import moment from "moment";
import type {
  MyDayRolloverPayload,
  MyDaySuggestionCategory,
  MyDaySuggestionsPayload,
  MyDayTasksMeta,
} from "@utils/tasks";

export const ROLLOVER_IGNORE_FLAG_THRESHOLD = 3;

/** Postman: flexible tasks appear in suggestions within this many days before due (no search). */
export const FLEXIBLE_SUGGESTION_LOOKAHEAD_DAYS = 2;

const FLEXIBLE_SOURCE_CATEGORIES: MyDaySuggestionCategory[] = [
  "overdue",
  "due_today",
  "high_priority",
  "assigned_to_me",
  "organizational_tasks",
  "personal_tasks",
];

function readSuggestionTaskId(row: unknown): number | null {
  if (row == null || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const parsed = Number(record.id ?? record.task_id);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function readSuggestionDueDate(row: unknown): string | null {
  if (row == null || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (typeof record.due_date === "string") return record.due_date;
  if (typeof record.end_date === "string") return record.end_date;
  return null;
}

/** Req 4: today, tomorrow, or within N days before due; with search, all flexible matches stay visible. */
export function isFlexibleTaskDueInSuggestionWindow(
  row: unknown,
  todayStart: moment.Moment,
  hasSearch: boolean,
): boolean {
  if (hasSearch) return true;
  const dueRaw = readSuggestionDueDate(row);
  if (!dueRaw) return false;
  const due = moment(dueRaw).startOf("day");
  if (!due.isValid()) return false;
  const today = todayStart.clone().startOf("day");
  const lastEligible = today.clone().add(FLEXIBLE_SUGGESTION_LOOKAHEAD_DAYS, "days");
  return due.isSameOrAfter(today, "day") && due.isSameOrBefore(lastEligible, "day");
}

/** Postman: `flexible_tasks` is an alias for `flexible_upcoming` (same array). */
export function mergeFlexibleTasksSuggestionAlias(
  payload: MyDaySuggestionsPayload & { flexible_tasks?: unknown[] },
): MyDaySuggestionsPayload {
  const result: MyDaySuggestionsPayload = { ...payload };
  const flexibleRows: unknown[] = Array.isArray(payload.flexible_upcoming)
    ? [...payload.flexible_upcoming]
    : [];
  const seenIds = new Set<number>();
  for (const row of flexibleRows) {
    const id = readSuggestionTaskId(row);
    if (id != null) seenIds.add(id);
  }
  const aliasRows = payload.flexible_tasks;
  if (Array.isArray(aliasRows)) {
    for (const row of aliasRows) {
      const id = readSuggestionTaskId(row);
      if (id != null && !seenIds.has(id)) {
        seenIds.add(id);
        flexibleRows.push(row);
      }
    }
  }
  if (flexibleRows.length > 0) {
    result.flexible_upcoming = flexibleRows;
  }
  return result;
}

function seedFlexibleSuggestionSeenIds(flexibleRows: unknown[]): Set<number> {
  const seenIds = new Set<number>();
  for (const row of flexibleRows) {
    const id = readSuggestionTaskId(row);
    if (id != null) seenIds.add(id);
  }
  return seenIds;
}

function partitionFlexibleSuggestionCategory(
  rows: unknown[],
  category: MyDaySuggestionCategory,
  options: { todayStart: moment.Moment; hasSearch: boolean },
  seenIds: Set<number>,
  flexibleRows: unknown[],
): unknown[] {
  const kept: unknown[] = [];
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    if (!isFlexibleTaskRow(record, category)) {
      kept.push(row);
      continue;
    }
    if (!isFlexibleTaskDueInSuggestionWindow(row, options.todayStart, options.hasSearch)) {
      continue;
    }
    const id = readSuggestionTaskId(row);
    if (id != null && seenIds.has(id)) {
      continue;
    }
    if (id != null) {
      seenIds.add(id);
      flexibleRows.push(row);
    }
  }
  return kept;
}

/**
 * Ensures flexible tasks appear under `flexible_upcoming` with correct window/search behavior
 * when the API places them in other buckets.
 */
export function normalizeMyDaySuggestionsPayload(
  payload: MyDaySuggestionsPayload & { flexible_tasks?: unknown[] },
  options: { todayStart: moment.Moment; hasSearch: boolean },
): MyDaySuggestionsPayload {
  const merged = mergeFlexibleTasksSuggestionAlias(payload);
  const result: MyDaySuggestionsPayload = { ...merged };
  const flexibleRows: unknown[] = Array.isArray(merged.flexible_upcoming)
    ? [...merged.flexible_upcoming]
    : [];
  const seenIds = seedFlexibleSuggestionSeenIds(flexibleRows);

  for (const category of FLEXIBLE_SOURCE_CATEGORIES) {
    const rows = merged[category];
    if (!Array.isArray(rows)) continue;
    result[category] = partitionFlexibleSuggestionCategory(
      rows,
      category,
      options,
      seenIds,
      flexibleRows,
    );
  }

  result.flexible_upcoming = flexibleRows;
  return result;
}

export type MyDayProjectMeta = {
  label: string;
  isPersonal: boolean;
  isOrganizational: boolean;
};

export function toMinutesDisplay(totalMinutes: number): string {
  const m = Math.max(0, totalMinutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0 && rem > 0) return `${h}h ${rem}m`;
  if (h > 0) return `${h}h`;
  return `${rem}m`;
}

export function formatMyDayHeaderMetaLine(taskCount: number, usedMinutes: number): string {
  const taskPart = taskCount === 1 ? "1 task planned" : `${taskCount} tasks planned`;
  return `${taskPart} · ${toMinutesDisplay(usedMinutes)} capacity used`;
}

export function resolveMyDayTaskCount(tasksLength: number, meta: MyDayTasksMeta): number {
  if (meta.tasks_planned != null && Number.isFinite(meta.tasks_planned)) {
    return Math.max(0, Math.floor(meta.tasks_planned));
  }
  if (meta.active_count != null && meta.completed_count != null) {
    return meta.active_count + meta.completed_count;
  }
  return tasksLength;
}

export function resolveMyDayUnestimatedCount(
  activeTasks: ReadonlyArray<{ isCompleted: boolean; estimateMinutes: number }>,
  meta: MyDayTasksMeta,
): number {
  if (meta.unestimated_task_count != null && Number.isFinite(meta.unestimated_task_count)) {
    return Math.max(0, Math.floor(meta.unestimated_task_count));
  }
  return activeTasks.filter((task) => !task.isCompleted && task.estimateMinutes <= 0).length;
}

function parsePositiveMinutes(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

/** Resolve estimate minutes from My Day / planner API rows (field names and types vary). */
export function readTaskPriorityLabel(priority: unknown): string {
  if (typeof priority === "string" && priority.trim()) return priority.trim();
  if (priority != null && typeof priority === "object") {
    const record = priority as Record<string, unknown>;
    if (typeof record.name === "string" && record.name.trim()) return record.name.trim();
    if (typeof record.label === "string" && record.label.trim()) return record.label.trim();
  }
  return "normal";
}

/** Postman: `has_estimate` is true when minutes > 0 — prefer this over parsing alone. */
export function readHasEstimateFromRow(row: Record<string, unknown>): boolean {
  if (row.has_estimate === true) return true;
  return resolveEstimateMinutesFromRow(row) > 0;
}

export function resolveEstimateMinutesFromRow(row: Record<string, unknown>): number {
  const nestedTask = row.task;
  if (nestedTask != null && typeof nestedTask === "object") {
    const fromNested = resolveEstimateMinutesFromRow(nestedTask as Record<string, unknown>);
    if (fromNested > 0) return fromNested;
  }

  const candidates = [
    row.my_day_estimated_minutes,
    row.estimated_minutes,
    row.estimated_duration_minutes,
    row.estimated_duration,
    row.plan_estimated_minutes,
    row.estimate_minutes,
    row.duration_minutes,
    row.estimate,
    row.time_estimate_minutes,
    row.estimated_time_minutes,
  ];
  for (const value of candidates) {
    const minutes = parsePositiveMinutes(value);
    if (minutes != null) return minutes;
  }

  const hours = Number(row.estimated_hours);
  if (Number.isFinite(hours) && hours > 0) return Math.round(hours * 60);
  return 0;
}

function readPersonalTaskFlag(row: Record<string, unknown>): boolean {
  return (
    row.is_personal === true ||
    row.personal_task === true ||
    row.is_personal_task === true ||
    row.task_type === "personal"
  );
}

function hasAssignedProject(row: Record<string, unknown>): boolean {
  const projectId = row.project_id;
  if (projectId == null || projectId === "") return false;
  const numeric = Number(projectId);
  return Number.isFinite(numeric) && numeric > 0;
}

export function resolveProjectFromRow(row: Record<string, unknown>): MyDayProjectMeta {
  if (row.is_org_task === true) {
    return { label: "Organizational Task", isPersonal: false, isOrganizational: true };
  }

  if (readPersonalTaskFlag(row)) {
    return { label: "Personal Task", isPersonal: true, isOrganizational: false };
  }

  const project = row.project;
  if (project != null && typeof project === "object") {
    const name = (project as { name?: string | null }).name?.trim();
    if (name) return { label: name, isPersonal: false, isOrganizational: false };
  }

  const projectName = typeof row.project_name === "string" ? row.project_name.trim() : "";
  if (projectName) return { label: projectName, isPersonal: false, isOrganizational: false };

  if (!hasAssignedProject(row)) {
    return { label: "Organizational Task", isPersonal: false, isOrganizational: true };
  }

  return { label: "Personal Task", isPersonal: true, isOrganizational: false };
}

export function isFlexibleTaskRow(
  row: Record<string, unknown>,
  category?: MyDaySuggestionCategory,
): boolean {
  if (category === "flexible_upcoming") return true;
  if (row.scheduling_type === "flexible") return true;
  return row.is_flexible === true || row.flexible === true || row.is_flexible_task === true;
}

export function readRolloverIgnoreCount(row: Record<string, unknown>): number {
  const candidates = [row.rollover_ignore_count, row.ignore_count, row.ignored_count];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return 0;
}

export function shouldShowIgnoredFlag(row: Record<string, unknown>): boolean {
  if (row.ignored_three_times === true) return true;
  return readRolloverIgnoreCount(row) >= ROLLOVER_IGNORE_FLAG_THRESHOLD;
}

export function formatSuggestionDueDate(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  const parsed = moment(dueDate);
  if (!parsed.isValid()) return null;
  return parsed.format("D MMM, YYYY");
}

export function formatCapacityOverageMessage(plannedMinutes: number, capacityMinutes: number): string {
  const over = Math.max(0, plannedMinutes - capacityMinutes);
  if (over <= 0) return "";
  return `You are ${toMinutesDisplay(over)} over your daily capacity (${toMinutesDisplay(plannedMinutes)} planned vs ${toMinutesDisplay(capacityMinutes)}).`;
}

export type MyDayCapacityStats = Readonly<{
  capacityUsedPercent: number | null;
  isOverCapacity: boolean;
  minutesOverCapacity: number;
}>;

function resolveCapacityUsedPercent(
  apiPct: number | undefined,
  plannedMinutes: number,
  effectiveCapacityMinutes: number,
): number | null {
  if (typeof apiPct === "number" && Number.isFinite(apiPct)) {
    return Math.round(apiPct * 10) / 10;
  }
  if (effectiveCapacityMinutes <= 0) {
    return null;
  }
  return Math.round((plannedMinutes / effectiveCapacityMinutes) * 1000) / 10;
}

export function resolveCapacityStatsFromPayload(
  payload: {
    capacity_used_percent?: number;
    is_over_capacity?: boolean;
    minutes_over_capacity?: number;
  },
  plannedMinutes: number,
  effectiveCapacityMinutes: number,
): MyDayCapacityStats {
  const capacityUsedPercent = resolveCapacityUsedPercent(
    payload.capacity_used_percent,
    plannedMinutes,
    effectiveCapacityMinutes,
  );
  const minutesOverCapacity =
    typeof payload.minutes_over_capacity === "number" &&
    Number.isFinite(payload.minutes_over_capacity)
      ? Math.max(0, Math.floor(payload.minutes_over_capacity))
      : Math.max(0, plannedMinutes - effectiveCapacityMinutes);
  const isOverCapacity =
    payload.is_over_capacity === true ||
    (capacityUsedPercent != null && capacityUsedPercent > 100) ||
    minutesOverCapacity > 0;
  return { capacityUsedPercent, isOverCapacity, minutesOverCapacity };
}

export function formatCapacityOverageMessageFromStats(
  stats: MyDayCapacityStats,
  plannedMinutes: number,
  effectiveCapacityMinutes: number,
): string {
  if (!stats.isOverCapacity) return "";
  const over = stats.minutesOverCapacity > 0
    ? stats.minutesOverCapacity
    : Math.max(0, plannedMinutes - effectiveCapacityMinutes);
  if (over <= 0) return "";
  return formatCapacityOverageMessage(plannedMinutes, effectiveCapacityMinutes);
}

export type CapacityFillTone = "low" | "medium" | "high";

export function getCapacityFillTone(usagePct: number): CapacityFillTone {
  if (usagePct >= 100) return "high";
  if (usagePct >= 75) return "medium";
  return "low";
}

/** Trust server `show_rollover_prompt` (yesterday only, days_since_last_seen === 1). */
export function resolveShowRolloverPrompt(
  payload: MyDayRolloverPayload,
  options: {
    todayTaskCount: number;
    hasIncompleteTodayTasks: boolean;
  },
): boolean {
  if (payload.show_rollover_prompt !== true) return false;
  if (payload.prompt_acknowledged_today === true) return false;
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  if (tasks.length === 0) return false;
  if (options.todayTaskCount > 0 && !options.hasIncompleteTodayTasks) return false;
  return true;
}

export function formatRolloverPromptCopy(_previousDate?: string | null): string {
  return "These tasks were missed yesterday. Would you like to add them to today's tasks or handle them later?";
}

export function resolveMyDayTeamReporteeExtensions(
  hierarchyExtensions: unknown[] | null | undefined,
  managerExtension: string,
): string[] {
  const manager = managerExtension.trim();
  const direct = parseHierarchyExtensionNumbers(hierarchyExtensions).filter(
    (ext) => ext !== manager,
  );
  return direct;
}

export function shouldShowMyDayTeamSection(
  hierarchyExtensions: unknown[] | null | undefined,
  managerExtension: string,
): boolean {
  const all = parseHierarchyExtensionNumbers(hierarchyExtensions);
  if (all.length <= 1) return false;
  return resolveMyDayTeamReporteeExtensions(hierarchyExtensions, managerExtension).length > 0;
}

export function parseHierarchyExtensionNumbers(
  extensions: unknown[] | null | undefined,
): string[] {
  if (!Array.isArray(extensions)) return [];
  const numbers: string[] = [];
  for (const row of extensions) {
    if (typeof row === "string") {
      const trimmed = row.trim();
      if (trimmed) numbers.push(trimmed);
      continue;
    }
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const raw = record.extension_number ?? record.extension ?? record.value;
    const ext =
      typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
    if (ext) numbers.push(ext);
  }
  return [...new Set(numbers)];
}

export function resolveMyDayReporteeExtensions(
  hierarchyExtensions: unknown[] | null | undefined,
  managerExtension: string,
): string[] {
  return resolveMyDayTeamReporteeExtensions(hierarchyExtensions, managerExtension);
}

export const MY_DAY_SUGGESTION_CATEGORY_ORDER: MyDaySuggestionCategory[] = [
  "overdue",
  "due_today",
  "high_priority",
  "assigned_to_me",
  "organizational_tasks",
  "personal_tasks",
  "flexible_upcoming",
  "backlog",
  "repeatedly_ignored",
];

export const MY_DAY_CATEGORY_LABELS: Record<MyDaySuggestionCategory, string> = {
  overdue: "Overdue",
  due_today: "Due Today",
  high_priority: "High Priority",
  assigned_to_me: "Assigned to Me",
  organizational_tasks: "Organizational Tasks",
  personal_tasks: "Personal Tasks",
  flexible_upcoming: "Flexible Tasks",
  backlog: "Backlog",
  repeatedly_ignored: "Repeatedly Ignored",
};
