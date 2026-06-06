import type {
  TaskReportsActivityRow,
  TaskReportsAssigneeRow,
  TaskReportsOverview,
  TaskReportsStatusRow,
  TaskReportsSummary,
  TaskReportsTaskRow,
  TaskReportsTrendPoint,
} from "@utils/taskReports";
import {
  formatReportsDelta,
  formatReportsMemberLabel,
  lookupHierarchyMemberDisplayName,
  resolveInProgressCount,
  resolveSummaryMetric,
} from "@page-modules/planner/reports/reportsDomain";
import {
  formatWorkloadMemberLabel,
  workloadMemberAvatarColor,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";

export type LiveDashboardKpi = Readonly<{
  label: string;
  value: string | number;
  sub: string;
  delta?: string | null;
  accent: "default" | "completed" | "overdue" | "pending" | "in_progress";
  sparkline: number[];
}>;

export type LiveMemberRow = Readonly<{
  key: string;
  memberLabel: string;
  initials: string;
  avatarColor: string;
  totalTasks: number;
  completedTasks: number;
  statsLine: string;
  inProgressTasks: number;
  overdueTasks: number;
  projectLabel: string;
}>;

export type LiveTaskDetailRow = Readonly<{
  id: number;
  title: string;
  assigneeLabel: string;
  assigneeInitials: string;
  assigneeAvatarColor: string;
  badge: string;
  badgeTone: "primary" | "danger" | "success";
  timeLabel: string;
  projectLabel: string;
}>;

export type LiveTopAssigneeRow = Readonly<{
  key: string;
  name: string;
  extensionLabel: string;
  initials: string;
  avatarColor: string;
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}>;

export type LiveStaleTaskRow = Readonly<{
  id: number;
  title: string;
  initials: string;
  avatarColor: string;
  timeLabel: string;
  priorityDot: string;
}>;

export type LiveRecentActivityRow = Readonly<{
  id: string;
  title: string;
  initials: string;
  avatarColor: string;
  timeLabel: string;
}>;

function memberInitialsFromText(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return text.slice(0, 2).toUpperCase() || "?";
}

function resolveAssigneeDisplayName(
  row: TaskReportsAssigneeRow,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): string {
  return formatReportsMemberLabel(row, hierarchyExtensions, hierarchyUsers);
}

function resolveAssigneePending(row: TaskReportsAssigneeRow): number {
  if (row.pending_count != null && Number.isFinite(row.pending_count)) {
    return Math.max(0, Math.floor(row.pending_count));
  }
  if (row.todo_count != null && Number.isFinite(row.todo_count)) {
    return Math.max(0, Math.floor(row.todo_count));
  }
  return 0;
}

function resolveAssigneeOverdue(row: TaskReportsAssigneeRow): number {
  if (row.overdue_count != null && Number.isFinite(row.overdue_count)) {
    return Math.max(0, Math.floor(row.overdue_count));
  }
  return 0;
}

function resolveAssigneeTotal(row: TaskReportsAssigneeRow): number {
  if (row.total_tasks != null && Number.isFinite(row.total_tasks)) {
    return Math.max(0, Math.floor(row.total_tasks));
  }
  if (row.task_count != null && Number.isFinite(row.task_count)) {
    return Math.max(0, Math.floor(row.task_count));
  }
  const pending = resolveAssigneePending(row);
  const inProgress = row.in_progress_count ?? 0;
  const done = row.done_count ?? row.completed_tasks ?? 0;
  const overdue = resolveAssigneeOverdue(row);
  return pending + inProgress + done + overdue;
}

function collectLiveOverviewTasks(overview: TaskReportsOverview): TaskReportsTaskRow[] {
  return [
    ...overview.pending_tasks,
    ...overview.stale_in_progress_tasks,
    ...overview.transfer_tasks,
  ];
}

function buildMemberPrimaryProjectMap(tasks: TaskReportsTaskRow[]): Map<string, string> {
  const countsByExtension = new Map<string, Map<string, number>>();

  for (const task of tasks) {
    const ext = task.assignee_extension?.trim();
    if (!ext) continue;

    const projectName = task.project_name?.trim() || "Org Task";
    const projectCounts = countsByExtension.get(ext) ?? new Map<string, number>();
    projectCounts.set(projectName, (projectCounts.get(projectName) ?? 0) + 1);
    countsByExtension.set(ext, projectCounts);
  }

  const primaryProjectByExtension = new Map<string, string>();
  for (const [ext, projectCounts] of countsByExtension) {
    let bestProject = "Org Task";
    let bestCount = 0;
    for (const [projectName, count] of projectCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestProject = projectName;
      }
    }
    primaryProjectByExtension.set(ext, bestProject);
  }

  return primaryProjectByExtension;
}

function resolveMemberProjectLabel(
  row: TaskReportsAssigneeRow,
  projectByExtension: Map<string, string>,
): string {
  const fromApi =
    row.project_name?.trim() ||
    row.primary_project_name?.trim();
  if (fromApi) return fromApi;

  const ext = row.extension_number?.trim() ?? "";
  if (ext && projectByExtension.has(ext)) {
    return projectByExtension.get(ext)!;
  }

  return "—";
}

export function buildLiveMemberRows(
  rows: TaskReportsAssigneeRow[],
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
  overview?: TaskReportsOverview | null,
): LiveMemberRow[] {
  const projectByExtension = overview
    ? buildMemberPrimaryProjectMap(collectLiveOverviewTasks(overview))
    : new Map<string, string>();

  return rows
    .filter((row) => resolveAssigneeTotal(row) > 0)
    .map((row) => {
      const ext = row.extension_number?.trim() ?? "";
      const memberLabel = formatReportsMemberLabel(
        row,
        hierarchyExtensions,
        hierarchyUsers,
      );
      const totalTasks = resolveAssigneeTotal(row);
      const completedTasks =
        row.completed_count ?? row.done_count ?? row.completed_tasks ?? 0;
      return {
        key: ext || memberLabel,
        memberLabel,
        initials: workloadMemberInitials(ext, hierarchyExtensions, row),
        avatarColor: workloadMemberAvatarColor(ext),
        totalTasks,
        completedTasks,
        statsLine: `Tasks: ${totalTasks} | Completed: ${completedTasks}`,
        inProgressTasks: row.in_progress_count ?? 0,
        overdueTasks: resolveAssigneeOverdue(row),
        projectLabel: resolveMemberProjectLabel(row, projectByExtension),
      };
    });
}

export function buildLiveTopAssigneeRows(
  rows: TaskReportsAssigneeRow[],
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): LiveTopAssigneeRow[] {
  return rows.map((row) => {
    const ext = row.extension_number?.trim() ?? "";
    const name = resolveAssigneeDisplayName(row, hierarchyExtensions, hierarchyUsers);
    return {
      key: ext || name,
      name,
      extensionLabel: ext ? `(${ext})` : "",
      initials: workloadMemberInitials(ext, hierarchyExtensions, row),
      avatarColor: workloadMemberAvatarColor(ext),
      totalTasks: resolveAssigneeTotal(row),
      inProgressTasks: row.in_progress_count ?? 0,
      pendingTasks: resolveAssigneePending(row),
      overdueTasks: resolveAssigneeOverdue(row),
    };
  });
}

function daysSinceIso(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

function resolveStaleDayCount(task: TaskReportsTaskRow): number {
  if (task.days_in_progress != null && Number.isFinite(task.days_in_progress)) {
    return Math.max(0, Math.floor(task.days_in_progress));
  }
  const fromUpdate = daysSinceIso(task.last_updated_at);
  return fromUpdate ?? 0;
}

export function formatLiveRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/** Matches UI copy: "1 days ago (Stale)" */
export function formatLiveTimeSuffix(
  iso: string | null | undefined,
  suffix: string,
): string {
  const days = daysSinceIso(iso);
  if (days == null) return `Recently (${suffix})`;
  if (days === 0) return `Today (${suffix})`;
  const dayWord = days === 1 ? "day" : "days";
  return `${days} ${dayWord} ago (${suffix})`;
}

function isStaleForThreshold(task: TaskReportsTaskRow, staleDays: number): boolean {
  const dayCount = resolveStaleDayCount(task);
  return dayCount >= staleDays;
}

function resolveStalePriorityDot(priority: string | null | undefined): string {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("critical")) return "#ef4444";
  if (p.includes("high")) return "#f97316";
  if (p.includes("medium")) return "#f59e0b";
  return "#22c55e";
}

export function buildLiveStaleTaskRows(
  tasks: TaskReportsTaskRow[],
  staleDays: number,
): LiveStaleTaskRow[] {
  return tasks
    .filter((task) => isStaleForThreshold(task, staleDays))
    .map((task) => ({
      id: task.id,
      title: task.title,
      initials: memberInitialsFromText(task.title),
      avatarColor: workloadMemberAvatarColor(String(task.id)),
      timeLabel: formatLiveTimeSuffix(task.last_updated_at, "Stale"),
      priorityDot: resolveStalePriorityDot(task.priority),
    }));
}

function sortTasksByRecent(tasks: TaskReportsTaskRow[]): TaskReportsTaskRow[] {
  return [...tasks].sort((a, b) => {
    const timeA = new Date(a.last_updated_at ?? a.transferred_at ?? 0).getTime();
    const timeB = new Date(b.last_updated_at ?? b.transferred_at ?? 0).getTime();
    return timeB - timeA;
  });
}

function resolveActivitySuffix(
  row: TaskReportsActivityRow | null,
  task: TaskReportsTaskRow | null,
): string {
  const badge = (row?.badge ?? task?.status_name ?? "").toLowerCase();
  if (badge.includes("transfer")) return "Transferred";
  if (badge.includes("complete") || badge.includes("done")) return "Completed";
  if (badge.includes("comment")) return "Comment";
  if (badge.includes("start")) return "Started";
  return "Updated";
}

export function buildLiveRecentActivityRows(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  limit = 10,
): LiveRecentActivityRow[] {
  if (overview.recent_activity.length > 0) {
    return overview.recent_activity.slice(0, limit).map((row) => {
      const title =
        row.description?.trim() ||
        row.subtitle?.trim() ||
        row.title?.trim() ||
        "Activity";
      const ext = row.actor_extension?.trim() ?? "";
      const initials = ext
        ? workloadMemberInitials(ext, hierarchyExtensions, {
            name: row.actor_name,
            display_name: row.actor_name,
          })
        : memberInitialsFromText(title);
      return {
        id: String(row.id ?? title),
        title,
        initials,
        avatarColor: workloadMemberAvatarColor(ext || title),
        timeLabel: formatLiveTimeSuffix(
          row.occurred_at,
          resolveActivitySuffix(row, null),
        ),
      };
    });
  }

  const taskRows = sortTasksByRecent([
    ...overview.transfer_tasks,
    ...overview.stale_in_progress_tasks,
    ...overview.pending_tasks,
  ]);
  return taskRows.slice(0, limit).map((task) => ({
    id: String(task.id),
    title: task.title,
    initials: memberInitialsFromText(task.title),
    avatarColor: workloadMemberAvatarColor(String(task.id)),
    timeLabel: formatLiveTimeSuffix(
      task.last_updated_at ?? task.transferred_at,
      resolveActivitySuffix(null, task),
    ),
  }));
}

/** Prefer full team breakdown over capped top-N list. */
export function resolveLiveTopAssigneeSource(overview: TaskReportsOverview): TaskReportsAssigneeRow[] {
  if (overview.member_report.length > 0) return overview.member_report;
  return overview.top_assignees;
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

function countActiveMembers(members: TaskReportsAssigneeRow[]): number {
  return members.filter((member) => resolveAssigneeTotal(member) > 0).length;
}

export type LiveTopPerformerRow = Readonly<{
  key: string;
  memberLabel: string;
  initials: string;
  avatarColor: string;
  completedTasks: number;
  barPercent: number;
}>;

export function buildLiveTopPerformerRows(
  rows: TaskReportsAssigneeRow[],
  hierarchyExtensions?: unknown[] | null,
  limit = 10,
): LiveTopPerformerRow[] {
  const sorted = [...rows].sort((a, b) => {
    const doneA = a.done_count ?? a.completed_tasks ?? 0;
    const doneB = b.done_count ?? b.completed_tasks ?? 0;
    return doneB - doneA;
  });
  const maxDone = Math.max(
    ...sorted.map((row) => row.done_count ?? row.completed_tasks ?? 0),
    1,
  );
  return sorted.slice(0, limit).map((row) => {
    const ext = row.extension_number?.trim() ?? "";
    const completedTasks = row.done_count ?? row.completed_tasks ?? 0;
    return {
      key: ext || formatReportsMemberLabel(row, hierarchyExtensions),
      memberLabel: formatReportsMemberLabel(row, hierarchyExtensions),
      initials: workloadMemberInitials(ext, hierarchyExtensions, row),
      avatarColor: workloadMemberAvatarColor(ext),
      completedTasks,
      barPercent: Math.round((completedTasks / maxDone) * 100),
    };
  });
}

function buildKpiSparkline(
  trends: TaskReportsTrendPoint[],
  pickValue: (point: TaskReportsTrendPoint) => number,
  fallback: number,
): number[] {
  if (trends.length === 0) {
    return [fallback, fallback, fallback, fallback, fallback];
  }
  const values = trends.map((point) => Math.max(0, pickValue(point)));
  if (values.every((value) => value === 0)) {
    return [fallback, fallback, fallback, fallback, fallback];
  }
  return values.length > 7 ? values.slice(-7) : values;
}

export function buildLiveDashboardKpis(
  summary: TaskReportsSummary,
  statusRows: TaskReportsStatusRow[],
  trends: TaskReportsTrendPoint[],
): LiveDashboardKpi[] {
  const vs = summary.vs_previous_period ?? {};
  const total = resolveSummaryMetric(summary, "total_tasks");
  const completed =
    resolveSummaryMetric(summary, "completed_in_period", -1) >= 0
      ? resolveSummaryMetric(summary, "completed_in_period")
      : resolveSummaryMetric(summary, "completed_tasks");
  const inProgress = resolveInProgressCount(summary, statusRows);
  const overdue = resolveSummaryMetric(summary, "overdue_tasks");
  const completionRate = resolveSummaryMetric(summary, "completion_rate", -1);

  const pickCreated = (point: TaskReportsTrendPoint) => point.created ?? point.count ?? 0;
  const pickCompleted = (point: TaskReportsTrendPoint) =>
    point.completed_count ?? point.completed ?? 0;
  const pickPending = (point: TaskReportsTrendPoint) => point.pending ?? 0;

  return [
    {
      label: "Total Active Tasks",
      value: total,
      sub: "Incomplete tasks in system",
      delta: formatReportsDelta(vs.total_tasks),
      accent: "default",
      sparkline: buildKpiSparkline(trends, pickCreated, total),
    },
    {
      label: "Stuck Tasks",
      value: inProgress,
      sub: "In progress beyond threshold",
      delta: formatReportsDelta(vs.in_progress_tasks),
      accent: "pending",
      sparkline: buildKpiSparkline(trends, pickPending, inProgress),
    },
    {
      label: "Overdue Tasks",
      value: overdue,
      sub: "Past due and not completed",
      delta: formatReportsDelta(vs.overdue_tasks),
      accent: "overdue",
      sparkline: buildKpiSparkline(trends, pickPending, overdue),
    },
    {
      label: "Completion Rate",
      value: completionRate >= 0 ? `${completionRate}%` : "—",
      sub:
        completionRate >= 0
          ? "Tasks completed on time"
          : "No completion data",
      delta:
        formatReportsDelta(vs.completed_tasks) ??
        formatReportsDelta(vs.completion_rate),
      accent: "completed",
      sparkline: buildKpiSparkline(trends, pickCompleted, completed),
    },
  ];
}

function resolveTaskAssigneeLabel(
  task: TaskReportsTaskRow,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): string {
  const ext = task.assignee_extension?.trim() ?? "";
  if (!ext) {
    return task.assignee_name?.trim() || "Unassigned";
  }
  const hierarchyName = lookupHierarchyMemberDisplayName(
    ext,
    hierarchyExtensions,
    hierarchyUsers,
  );
  const name = task.assignee_name?.trim() || hierarchyName;
  return formatWorkloadMemberLabel(ext, hierarchyExtensions, {
    name: name || hierarchyName,
    display_name: name || hierarchyName,
  });
}

function resolveTaskAssigneeVisuals(
  task: TaskReportsTaskRow,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): Pick<LiveTaskDetailRow, "assigneeLabel" | "assigneeInitials" | "assigneeAvatarColor"> {
  const ext = task.assignee_extension?.trim() ?? "";
  const hierarchyName = ext
    ? lookupHierarchyMemberDisplayName(ext, hierarchyExtensions, hierarchyUsers)
    : "";
  const assigneeLabel = resolveTaskAssigneeLabel(
    task,
    hierarchyExtensions,
    hierarchyUsers,
  );
  return {
    assigneeLabel,
    assigneeInitials: ext
      ? workloadMemberInitials(ext, hierarchyExtensions, {
          name: task.assignee_name ?? hierarchyName,
          display_name: task.assignee_name ?? hierarchyName,
        })
      : memberInitialsFromText(assigneeLabel),
    assigneeAvatarColor: workloadMemberAvatarColor(ext || assigneeLabel),
  };
}

function formatOverdueTimeLabel(task: TaskReportsTaskRow): string {
  const days = daysOverdue(task);
  if (days <= 0) return "Overdue";
  const dayWord = days === 1 ? "day" : "days";
  return `${days} ${dayWord} ago`;
}

function formatInProgressTimeLabel(task: TaskReportsTaskRow): string {
  if (task.days_in_progress != null && task.days_in_progress > 0) {
    const days = Math.floor(task.days_in_progress);
    const dayWord = days === 1 ? "day" : "days";
    return `Active ${days} ${dayWord} ago`;
  }
  return formatLiveRelativeTime(task.last_updated_at);
}

function mapTaskToDetailRow(
  task: TaskReportsTaskRow,
  mode: "in_progress" | "overdue",
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): LiveTaskDetailRow {
  const assignee = resolveTaskAssigneeVisuals(
    task,
    hierarchyExtensions,
    hierarchyUsers,
  );
  if (mode === "overdue") {
    return {
      id: task.id,
      title: task.title,
      ...assignee,
      badge: "Overdue",
      badgeTone: "danger",
      timeLabel: formatOverdueTimeLabel(task),
      projectLabel: task.project_name?.trim() || "Org Task",
    };
  }
  return {
    id: task.id,
    title: task.title,
    ...assignee,
    badge: task.status_name?.trim() || "In Progress",
    badgeTone: "primary",
    timeLabel: formatInProgressTimeLabel(task),
    projectLabel: task.project_name?.trim() || "Org Task",
  };
}

function isTaskDone(statusName: string | null | undefined): boolean {
  const status = (statusName ?? "").toLowerCase();
  return status.includes("done") || status.includes("complete");
}

function isTaskInProgress(task: TaskReportsTaskRow): boolean {
  const phase = (task.phase ?? "").toLowerCase();
  if (phase === "in_progress") return true;
  const status = (task.status_name ?? "").toLowerCase();
  return status.includes("progress");
}

function isTaskOverdue(task: TaskReportsTaskRow): boolean {
  if (task.is_completed === true) return false;
  if (task.is_overdue === true) return true;
  if (!task.due_date || isTaskDone(task.status_name)) return false;
  const due = new Date(`${task.due_date.slice(0, 10)}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function daysOverdue(task: TaskReportsTaskRow): number {
  if (!task.due_date) return 0;
  const due = new Date(`${task.due_date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86_400_000));
}

function resolvePriorityLabel(priority: string | null | undefined): string {
  const raw = (priority ?? "").trim();
  if (!raw) return "Normal";
  if (/high|critical|urgent/i.test(raw)) return "High";
  if (/low/i.test(raw)) return "Low";
  if (/medium/i.test(raw)) return "Medium";
  return raw;
}

export function buildLiveInProgressTaskRows(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
  limit = 25,
): LiveTaskDetailRow[] {
  const byId = new Map<number, TaskReportsTaskRow>();
  for (const task of overview.stale_in_progress_tasks) {
    if (!task.is_completed) byId.set(task.id, task);
  }
  for (const task of overview.pending_tasks) {
    if (isTaskInProgress(task) && !task.is_completed && !isTaskDone(task.status_name)) {
      byId.set(task.id, task);
    }
  }
  return Array.from(byId.values())
    .slice(0, limit)
    .map((task) =>
      mapTaskToDetailRow(task, "in_progress", hierarchyExtensions, hierarchyUsers),
    );
}

export function buildLiveOverdueTaskRows(
  overview: TaskReportsOverview,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
  limit = 25,
): LiveTaskDetailRow[] {
  const byId = new Map<number, TaskReportsTaskRow>();
  for (const task of overview.pending_tasks) {
    if (isTaskOverdue(task)) {
      byId.set(task.id, task);
    }
  }
  for (const task of overview.stale_in_progress_tasks) {
    if (isTaskOverdue(task)) {
      byId.set(task.id, task);
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => daysOverdue(b) - daysOverdue(a))
    .slice(0, limit)
    .map((task) => mapTaskToDetailRow(task, "overdue", hierarchyExtensions, hierarchyUsers));
}

export function countLiveInProgressTasks(overview: TaskReportsOverview): number {
  const ids = new Set<number>();
  for (const task of overview.stale_in_progress_tasks) {
    ids.add(task.id);
  }
  for (const task of overview.pending_tasks) {
    if (isTaskInProgress(task) && !isTaskDone(task.status_name)) {
      ids.add(task.id);
    }
  }
  return ids.size;
}
