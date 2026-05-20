import moment from "moment";
import type {
  MyDayRolloverPayload,
  MyDaySuggestionCategory,
  MyDayTasksMeta,
} from "@utils/tasks";

export const ROLLOVER_IGNORE_FLAG_THRESHOLD = 3;

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

export function resolveEstimateMinutesFromRow(row: Record<string, unknown>): number {
  const candidates = [
    row.my_day_estimated_minutes,
    row.estimated_minutes,
    row.estimated_duration_minutes,
    row.plan_estimated_minutes,
    row.estimate_minutes,
    row.duration_minutes,
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
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

export function formatRolloverPromptCopy(previousDate: string | null | undefined): string {
  const dateLabel = previousDate
    ? moment(previousDate).format("D MMMM, YYYY")
    : "yesterday";
  return `These tasks were missed on ${dateLabel}. Would you like to add them to today's tasks or handle them later?`;
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
  const manager = managerExtension.trim();
  return parseHierarchyExtensionNumbers(hierarchyExtensions).filter(
    (ext) => ext !== manager,
  );
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
