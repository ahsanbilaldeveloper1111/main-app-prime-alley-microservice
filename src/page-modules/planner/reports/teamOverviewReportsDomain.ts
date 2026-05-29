import type {
  TaskReportsActiveIssueRow,
  TaskReportsActivityRow,
  TaskReportsOverview,
  TaskReportsSummary,
  TaskReportsTaskRow,
} from "@utils/taskReports";
import { formatReportsDelta, resolveSummaryMetric } from "@page-modules/planner/reports/reportsDomain";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";

export type HighLevelKpiCard = Readonly<{
  label: string;
  value: string | number;
  sub: string;
  accent: "total" | "completed" | "overdue" | "pending";
}>;

export type HighLevelListItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: "critical" | "warning" | "success" | "info" | "default";
  initials: string;
  avatarColor: string;
}>;

function isUrgentPriority(priority: string | null | undefined): boolean {
  const value = (priority ?? "").toLowerCase();
  return value.includes("urgent") || value.includes("critical") || value.includes("high");
}

function resolveCompletionRate(summary: TaskReportsSummary): number {
  if (summary.completion_rate != null && Number.isFinite(summary.completion_rate)) {
    return Math.round(summary.completion_rate);
  }
  const total = resolveSummaryMetric(summary, "total_tasks");
  const done = resolveSummaryMetric(summary, "completed_tasks");
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function taskInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase() || "R";
}

function avatarColorFromId(id: number): string {
  const palette = ["#3b82f6", "#8b5cf6", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"];
  return palette[Math.abs(id) % palette.length];
}

function resolveStatusBadgeTone(
  statusName: string | null | undefined,
): HighLevelListItem["badgeTone"] {
  const status = (statusName ?? "").toLowerCase();
  if (status.includes("done") || status.includes("complete")) return "success";
  if (status.includes("progress")) return "info";
  if (status.includes("overdue")) return "critical";
  return "warning";
}

function formatTaskSubtitle(task: TaskReportsTaskRow): string {
  const parts = [task.project_name, task.due_date?.slice(0, 10)].filter(Boolean);
  return parts.join(" · ") || "No project";
}

function resolveTaskAssigneeLabel(
  task: TaskReportsTaskRow,
  hierarchyExtensions?: unknown[] | null,
): string {
  const ext = task.assignee_extension?.trim();
  if (ext) {
    return formatWorkloadMemberLabel(ext, hierarchyExtensions, {
      name: task.assignee_name,
      display_name: task.assignee_name,
    });
  }
  return task.assignee_name?.trim() || "Unassigned";
}

export function buildHighLevelKpiCards(
  summary: TaskReportsSummary,
  urgentCount: number,
): HighLevelKpiCard[] {
  const vs = summary.vs_previous_period ?? {};
  const total = resolveSummaryMetric(summary, "total_tasks");
  const rate = resolveCompletionRate(summary);
  const overdue = resolveSummaryMetric(summary, "overdue_tasks");
  const stale = resolveSummaryMetric(summary, "stale_in_progress_tasks");
  const activeIssues = overdue + stale;

  return [
    {
      label: "Total Reports",
      value: total,
      sub: formatReportsDelta(vs.total_tasks) ?? "Tasks in the selected period",
      accent: "total",
    },
    {
      label: "Completion Rate",
      value: `${rate}%`,
      sub: formatReportsDelta(vs.completed_tasks) ?? `${rate}% completion in range`,
      accent: "completed",
    },
    {
      label: "Active Issues",
      value: activeIssues,
      sub: formatReportsDelta(vs.overdue_tasks) ?? "Overdue and stale in progress",
      accent: "overdue",
    },
    {
      label: "Urgent Tasks",
      value: urgentCount,
      sub: "Critical and high-priority pending",
      accent: "pending",
    },
  ];
}

function mapTaskToListItem(
  task: TaskReportsTaskRow,
  hierarchyExtensions?: unknown[] | null,
): HighLevelListItem {
  const assignee = resolveTaskAssigneeLabel(task, hierarchyExtensions);
  return {
    id: String(task.id),
    title: task.title,
    subtitle: `${assignee} · ${formatTaskSubtitle(task)}`,
    badge: task.status_name?.trim() || task.priority?.trim() || "Open",
    badgeTone: resolveStatusBadgeTone(task.status_name),
    initials: taskInitials(task.title),
    avatarColor: avatarColorFromId(task.id),
  };
}

export function buildRecentReportsItems(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  limit = 6,
): HighLevelListItem[] {
  return overview.pending_tasks
    .slice(0, limit)
    .map((task) => mapTaskToListItem(task, hierarchyExtensions));
}

export function buildActiveIssuesItems(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
): HighLevelListItem[] {
  const overduePending = overview.pending_tasks.filter(
    (task) => task.due_date && new Date(`${task.due_date.slice(0, 10)}T23:59:59`) < new Date(),
  );
  const rows = [...overduePending, ...overview.stale_in_progress_tasks];
  return rows.map((task) => {
    const item = mapTaskToListItem(task, hierarchyExtensions);
    return {
      ...item,
      badge: task.days_in_progress == null ? "Overdue" : `${task.days_in_progress}d stale`,
      badgeTone: "critical" as const,
    };
  });
}

function formatActivityTimestamp(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveSeverityTone(severity: string | null | undefined): HighLevelListItem["badgeTone"] {
  const value = (severity ?? "").toLowerCase();
  if (value.includes("critical") || value.includes("high")) return "critical";
  if (value.includes("medium")) return "warning";
  if (value.includes("low")) return "info";
  return "default";
}

function mapActivityRowToListItem(
  row: TaskReportsActivityRow,
  hierarchyExtensions?: unknown[] | null,
): HighLevelListItem {
  const ext = row.actor_extension?.trim();
  const actorLabel = ext
    ? formatWorkloadMemberLabel(ext, hierarchyExtensions, {
        name: row.actor_name,
        display_name: row.actor_name,
      })
    : row.actor_name?.trim() || "System";
  const time = formatActivityTimestamp(row.occurred_at);
  const subtitleParts = [actorLabel, row.project_name, time].filter(Boolean);
  return {
    id: String(row.id ?? row.title),
    title: row.title,
    subtitle: row.subtitle?.trim() || subtitleParts.join(" · "),
    badge: row.badge?.trim() || "Activity",
    badgeTone: resolveSeverityTone(row.badge_tone),
    initials: taskInitials(actorLabel),
    avatarColor: avatarColorFromId(String(row.id ?? row.title).length),
  };
}

function mapActiveIssueRowToListItem(row: TaskReportsActiveIssueRow): HighLevelListItem {
  const severity = row.severity ?? row.priority ?? "Open";
  const subtitle = [row.project_name, row.subtitle, row.description].filter(Boolean).join(" · ");
  return {
    id: String(row.id ?? row.title),
    title: row.title,
    subtitle: subtitle || "Project issue",
    badge: severity,
    badgeTone: resolveSeverityTone(severity),
    initials: taskInitials(row.title),
    avatarColor: avatarColorFromId(String(row.id ?? row.title).length),
  };
}

function buildRecentActivityItemsFromTasks(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  limit = 8,
): HighLevelListItem[] {
  const rows: TaskReportsTaskRow[] = [
    ...overview.transfer_tasks,
    ...overview.stale_in_progress_tasks,
    ...overview.pending_tasks,
  ];
  return rows.slice(0, limit).map((task) => {
    const item = mapTaskToListItem(task, hierarchyExtensions);
    const time = formatActivityTimestamp(task.last_updated_at ?? task.transferred_at);
    return {
      ...item,
      subtitle: `${item.subtitle} · ${time}`,
      badge: task.transferred_at ? "Transferred" : "Updated",
      badgeTone: task.transferred_at ? ("info" as const) : ("default" as const),
    };
  });
}

export function resolveRecentActivityItems(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  limit = 8,
): HighLevelListItem[] {
  if (overview.recent_activity.length > 0) {
    return overview.recent_activity
      .slice(0, limit)
      .map((row) => mapActivityRowToListItem(row, hierarchyExtensions));
  }
  return buildRecentActivityItemsFromTasks(overview, hierarchyExtensions, limit);
}

export function resolveActiveIssuesItems(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
): HighLevelListItem[] {
  if (overview.active_issues.length > 0) {
    return overview.active_issues.map((row) => mapActiveIssueRowToListItem(row));
  }
  return buildActiveIssuesItems(overview, hierarchyExtensions);
}

/** @deprecated Use resolveRecentActivityItems */
export function buildRecentActivityItems(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  limit = 8,
): HighLevelListItem[] {
  return resolveRecentActivityItems(overview, hierarchyExtensions, limit);
}

export function countUrgentTasks(overview: TaskReportsOverview): number {
  return overview.pending_tasks.filter((task) => isUrgentPriority(task.priority)).length;
}
