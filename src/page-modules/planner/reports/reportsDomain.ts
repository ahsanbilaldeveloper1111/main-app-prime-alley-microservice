import type { Session } from "next-auth";
import type {
  TaskReportsAssigneeRow,
  TaskReportsOverview,
  TaskReportsPeriodDelta,
  TaskReportsStatusRow,
  TaskReportsSummary,
  TaskReportsTaskRow,
  TaskReportsTrendPoint,
} from "@utils/taskReports";
import { formatWorkloadIsoDate } from "@page-modules/planner/workload/workloadDomain";

export type ReportsDatePreset = "last_7" | "last_30" | "this_month" | "custom";

export type ReportsProjectFilter = "all" | number;

function readTenantIdFromUser(user: unknown): string {
  if (user == null || typeof user !== "object") return "";
  const record = user as Record<string, unknown>;
  const raw = record.tenant_id ?? record.tenant;
  return typeof raw === "string" ? raw.trim() : "";
}

export function getPlannerTenantId(session: Session | null | undefined): string {
  return readTenantIdFromUser(session?.user);
}

export function getReportsDateRangeForPreset(
  preset: ReportsDatePreset,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  const today = new Date();
  const end = formatWorkloadIsoDate(today);
  if (preset === "custom" && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: formatWorkloadIsoDate(start), end };
  }
  const days = preset === "last_7" ? 6 : 29;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return { start: formatWorkloadIsoDate(start), end };
}

export function formatReportsDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatReportsPeriodLabel(start: string, end: string): string {
  return `${formatReportsDateLabel(start)} – ${formatReportsDateLabel(end)}`;
}

function readNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

function parsePeriodDeltaDirection(
  value: unknown,
): TaskReportsPeriodDelta["direction"] {
  const raw = readString(value);
  if (raw === "up" || raw === "down" || raw === "flat") return raw;
  return undefined;
}

function normalizePeriodDelta(raw: unknown): TaskReportsPeriodDelta | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  return {
    value: readNumber(row.value),
    percent: readNumber(row.percent),
    direction: parsePeriodDeltaDirection(row.direction),
    label: readString(row.label),
  };
}

export function normalizeReportsSummary(raw: unknown): TaskReportsSummary {
  if (raw == null || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const vsRaw = row.vs_previous_period;
  let vs_previous_period: Record<string, TaskReportsPeriodDelta> | undefined;
  if (vsRaw != null && typeof vsRaw === "object") {
    vs_previous_period = {};
    for (const [key, val] of Object.entries(vsRaw as Record<string, unknown>)) {
      const delta = normalizePeriodDelta(val);
      if (delta) vs_previous_period[key] = delta;
    }
  }
  return {
    total_tasks: readNumber(row.total_tasks),
    completed_tasks: readNumber(row.completed_tasks),
    overdue_tasks: readNumber(row.overdue_tasks),
    pending_tasks: readNumber(row.pending_tasks),
    stale_in_progress_tasks: readNumber(row.stale_in_progress_tasks),
    total_hours: readNumber(row.total_hours),
    completion_rate: readNumber(row.completion_rate),
    vs_previous_period,
  };
}

function normalizeStatusRow(raw: unknown): TaskReportsStatusRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = readString(row.status_name) ?? readString(row.name) ?? "Unknown";
  const count = readNumber(row.count) ?? readNumber(row.task_count) ?? 0;
  return {
    status_id: readNumber(row.status_id),
    status_name: name,
    status_color: readString(row.status_color) ?? readString(row.color) ?? null,
    count,
    percent: readNumber(row.percent) ?? readNumber(row.percentage),
  };
}

function normalizeAssigneeRow(raw: unknown): TaskReportsAssigneeRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const ext = readString(row.extension_number) ?? readString(row.extension);
  return {
    extension_number: ext,
    name: readString(row.name),
    display_name: readString(row.display_name),
    total_tasks: readNumber(row.total_tasks) ?? readNumber(row.task_count),
    completed_tasks: readNumber(row.completed_tasks) ?? readNumber(row.done_count),
    task_count: readNumber(row.task_count),
    todo_count: readNumber(row.todo_count),
    in_progress_count: readNumber(row.in_progress_count),
    done_count: readNumber(row.done_count),
    overdue_count: readNumber(row.overdue_count),
  };
}

function normalizeTaskRow(raw: unknown): TaskReportsTaskRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = readNumber(row.id);
  const title = readString(row.title);
  if (id == null || !title) return null;
  return {
    id,
    title,
    priority: readString(row.priority),
    status_name: readString(row.status_name),
    status_color: readString(row.status_color),
    due_date: readString(row.due_date),
    project_name: readString(row.project_name),
    days_in_progress: readNumber(row.days_in_progress),
    last_updated_at: readString(row.last_updated_at) ?? readString(row.updated_at),
    transferred_at: readString(row.transferred_at),
    from_extension: readString(row.from_extension),
    to_extension: readString(row.to_extension),
    assignee_name: readString(row.assignee_name),
  };
}

function normalizeTrendPoint(raw: unknown): TaskReportsTrendPoint | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const date = readString(row.date) ?? readString(row.day);
  if (!date) return null;
  const count =
    readNumber(row.count) ??
    readNumber(row.total_tasks) ??
    readNumber(row.tasks) ??
    0;
  return { date, count, total_tasks: count, tasks: count };
}

function normalizeList<T>(
  raw: unknown,
  mapRow: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapRow).filter((row): row is T => row != null);
}

export function normalizeReportsOverview(raw: TaskReportsOverview): TaskReportsOverview {
  return {
    filters: raw.filters,
    summary: normalizeReportsSummary(raw.summary),
    status_breakdown: normalizeList(raw.status_breakdown, normalizeStatusRow),
    top_assignees: normalizeList(raw.top_assignees, normalizeAssigneeRow),
    pending_tasks: normalizeList(raw.pending_tasks, normalizeTaskRow),
    transfer_tasks: normalizeList(raw.transfer_tasks, normalizeTaskRow),
    stale_in_progress_tasks: normalizeList(
      raw.stale_in_progress_tasks,
      normalizeTaskRow,
    ),
    trends: normalizeList(raw.trends, normalizeTrendPoint),
  };
}

export function resolveSummaryMetric(
  summary: TaskReportsSummary,
  key: keyof TaskReportsSummary,
  fallback = 0,
): number {
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatReportsDeltaDirection(direction: TaskReportsPeriodDelta["direction"]): string {
  if (direction === "down") return "↓";
  if (direction === "up") return "↑";
  return "•";
}

export function formatReportsDelta(delta: TaskReportsPeriodDelta | undefined): string | null {
  if (!delta) return null;
  if (delta.label?.trim()) return delta.label.trim();
  const pct = delta.percent;
  if (pct == null || !Number.isFinite(pct)) return null;
  const dir = formatReportsDeltaDirection(delta.direction);
  return `${dir} ${Math.abs(pct).toFixed(0)}% vs last period`;
}

export function statusRowPercent(row: TaskReportsStatusRow, total: number): number {
  if (row.percent != null && Number.isFinite(row.percent)) return row.percent;
  if (total <= 0) return 0;
  return (row.count / total) * 100;
}

export function priorityBadgeClass(priority: string | null | undefined): string {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("urgent") || p.includes("critical") || p.includes("high")) {
    return "reports-priority--high";
  }
  if (p.includes("medium") || p.includes("normal")) return "reports-priority--medium";
  if (p.includes("low")) return "reports-priority--low";
  return "reports-priority--default";
}

export function formatReportsHours(hours: number | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
