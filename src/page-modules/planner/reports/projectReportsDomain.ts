import type {
  TaskReportsOverview,
  TaskReportsProjectBreakdownRow,
  TaskReportsTaskRow,
} from "@utils/taskReports";

export type ReportsMainView = "team" | "project" | "historical" | "my_day_monthly";

export type ReportsTeamSubView = "live" | "board";

export type ProjectReportHealth = "on_track" | "at_risk";

export type ProjectReportRow = Readonly<{
  id: number;
  name: string;
  color: string;
  progressPercent: number;
  delayPercent: number;
  health: ProjectReportHealth;
  healthLabel: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueCount: number;
}>;

export type ProjectTaskCountSegment = Readonly<{
  name: string;
  value: number;
  color: string;
}>;

export type OverdueByProjectEntry = Readonly<{
  projectName: string;
  count: number;
  tone: "danger" | "warning" | "muted";
}>;

/** Projects with this many or more overdue tasks count as at risk (mockup: 2+). */
export const PROJECT_AT_RISK_OVERDUE_MIN = 2;

export type ProjectReportSummary = Readonly<{
  active: number;
  completed: number;
  withIssues: number;
  total: number;
  onTrack: number;
  atRisk: number;
  totalOverdue: number;
}>;

export type ProjectViewKpiSubtexts = Readonly<{
  totalProjects: string;
  onTrack: string;
  atRisk: string;
  totalOverdue: string;
}>;

export type OverdueByProjectRow = Readonly<{
  projectName: string;
  taskId: number;
  taskTitle: string;
  dueDate: string | null;
}>;

export type PlannerProjectListItem = Readonly<{
  id: number;
  name: string;
  color: string;
  status: string;
}>;

type ProjectTaskStats = {
  total: number;
  done: number;
  overdue: number;
};

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function isTaskDone(statusName: string | null | undefined): boolean {
  const status = (statusName ?? "").toLowerCase();
  return status.includes("done") || status.includes("complete");
}

function isTaskOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

function isProjectAtRiskByOverdue(overdueCount: number): boolean {
  return overdueCount >= PROJECT_AT_RISK_OVERDUE_MIN;
}

function parseProjectHealth(
  healthRaw: string | null | undefined,
  overdueCount: number,
): { health: ProjectReportHealth; healthLabel: string } {
  const health = (healthRaw ?? "").toLowerCase();
  if (isProjectAtRiskByOverdue(overdueCount)) {
    return { health: "at_risk", healthLabel: "At Risk" };
  }
  if (health.includes("risk") || health.includes("at_risk")) {
    return { health: "at_risk", healthLabel: "At Risk" };
  }
  if (health.includes("track") || health.includes("on_track")) {
    return { health: "on_track", healthLabel: "On Track" };
  }
  if (overdueCount > 0) {
    return { health: "at_risk", healthLabel: "At Risk" };
  }
  return { health: "on_track", healthLabel: "On Track" };
}

function bumpProjectStats(
  map: Map<string, ProjectTaskStats>,
  projectName: string,
  task: TaskReportsTaskRow,
): void {
  const key = projectName.trim() || "No project";
  const current = map.get(key) ?? { total: 0, done: 0, overdue: 0 };
  const done = isTaskDone(task.status_name);
  const overdue = !done && isTaskOverdue(task.due_date);
  map.set(key, {
    total: current.total + 1,
    done: current.done + (done ? 1 : 0),
    overdue: current.overdue + (overdue ? 1 : 0),
  });
}

export function aggregateOverviewTasksByProject(
  overview: TaskReportsOverview,
): Map<string, ProjectTaskStats> {
  const map = new Map<string, ProjectTaskStats>();
  const lists = [
    overview.pending_tasks,
    overview.stale_in_progress_tasks,
    overview.transfer_tasks,
  ];
  for (const list of lists) {
    for (const task of list) {
      bumpProjectStats(map, task.project_name ?? "No project", task);
    }
  }
  return map;
}

function resolveProjectProgressPercent(
  project: PlannerProjectListItem,
  stats: ProjectTaskStats | undefined,
): number {
  if (project.status === "completed") return 100;
  if (stats && stats.total > 0) {
    return Math.min(100, Math.max(0, Math.round((stats.done / stats.total) * 100)));
  }
  if (project.status === "archived") return 100;
  return 0;
}

function resolveProjectHealth(
  project: PlannerProjectListItem,
  stats: ProjectTaskStats | undefined,
): { health: ProjectReportHealth; healthLabel: string } {
  const overdue = stats?.overdue ?? 0;
  if (project.status === "completed") {
    return { health: "on_track", healthLabel: "On Track" };
  }
  if (overdue > 0) {
    return { health: "at_risk", healthLabel: "At Risk" };
  }
  return { health: "on_track", healthLabel: "On Track" };
}

function resolveBreakdownProgressPercent(row: TaskReportsProjectBreakdownRow): number {
  if (row.progress_percent != null && Number.isFinite(row.progress_percent)) {
    return Math.min(100, Math.max(0, Math.round(row.progress_percent)));
  }
  const totalTasks = row.total_tasks;
  const completedTasks = row.completed_tasks;
  if (totalTasks != null && totalTasks > 0 && completedTasks != null) {
    return Math.min(100, Math.max(0, Math.round((completedTasks / totalTasks) * 100)));
  }
  return 0;
}

function resolveBreakdownDelayPercent(
  row: TaskReportsProjectBreakdownRow,
  progress: number,
): number {
  if (row.delay_percent != null && Number.isFinite(row.delay_percent)) {
    return Math.min(100, Math.max(0, Math.round(row.delay_percent)));
  }
  return 0;
}

function mapBreakdownToProjectRow(
  row: TaskReportsProjectBreakdownRow,
  project?: PlannerProjectListItem,
): ProjectReportRow {
  const progress = resolveBreakdownProgressPercent(row);
  const delay = resolveBreakdownDelayPercent(row, progress);
  const totalTasks = row.total_tasks ?? 0;
  const completedTasks = row.completed_tasks ?? 0;
  const pendingTasks = row.pending_tasks ?? Math.max(0, totalTasks - completedTasks);
  const overdue = row.overdue_tasks ?? 0;
  const { health, healthLabel } = parseProjectHealth(row.health, overdue);
  return {
    id:
      row.project_id != null && Number.isFinite(Number(row.project_id))
        ? Math.floor(Number(row.project_id))
        : REPORTS_ORGANIZATIONAL_PROJECT_ID,
    name: row.project_name,
    color: row.color?.trim() || project?.color || "#3b82f6",
    progressPercent: progress,
    delayPercent: delay,
    health,
    healthLabel: row.health_label?.trim() || healthLabel,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueCount: overdue,
  };
}

export function formatProjectHealthStatsLine(row: ProjectReportRow): string {
  const overduePart =
    row.overdueCount > 0 ? ` - ${row.overdueCount} overdue` : "";
  if (row.totalTasks > 0) {
    return `${row.completedTasks}/${row.totalTasks} tasks${overduePart}`;
  }
  if (row.overdueCount > 0) {
    return `${row.overdueCount} overdue`;
  }
  return "No tasks in period";
}

export function buildTasksByProjectSegments(
  rows: ProjectReportRow[],
): ProjectTaskCountSegment[] {
  return rows
    .filter((row) => row.totalTasks > 0)
    .map((row) => ({
      name: row.name,
      value: row.totalTasks,
      color: row.color,
    }))
    .sort((a, b) => b.value - a.value);
}

function resolveOverdueEntryTone(count: number): OverdueByProjectEntry["tone"] {
  if (count <= 0) return "muted";
  if (count >= PROJECT_AT_RISK_OVERDUE_MIN) return "danger";
  return "warning";
}

export function buildOverdueByProjectEntries(
  rows: ProjectReportRow[],
): OverdueByProjectEntry[] {
  return rows
    .filter((row) => row.overdueCount > 0)
    .map((row) => ({
      projectName: row.name,
      count: row.overdueCount,
      tone: resolveOverdueEntryTone(row.overdueCount),
    }))
    .sort((a, b) => b.count - a.count);
}

function resolveBreakdownProject(
  row: TaskReportsProjectBreakdownRow,
  byId: Map<number, PlannerProjectListItem>,
  byName: Map<string, PlannerProjectListItem>,
): PlannerProjectListItem | undefined {
  if (row.project_id == null) {
    return byName.get(row.project_name);
  }
  return byId.get(Math.floor(row.project_id)) ?? byName.get(row.project_name);
}

export function buildProjectReportRowsFromBreakdown(
  breakdown: TaskReportsProjectBreakdownRow[],
  projects: PlannerProjectListItem[],
): ProjectReportRow[] {
  if (breakdown.length === 0) return [];
  const byId = new Map(projects.map((p) => [p.id, p]));
  const byName = new Map(projects.map((p) => [p.name, p]));
  return breakdown.map((row) => {
    const project = resolveBreakdownProject(row, byId, byName);
    return mapBreakdownToProjectRow(row, project);
  });
}

export function buildProjectReportRows(
  projects: PlannerProjectListItem[],
  overview: TaskReportsOverview | undefined,
): ProjectReportRow[] {
  const breakdown = overview?.project_breakdown ?? [];
  if (breakdown.length > 0) {
    const fromApi = buildProjectReportRowsFromBreakdown(breakdown, projects);
    if (fromApi.length > 0) return fromApi;
  }

  const byProject = overview ? aggregateOverviewTasksByProject(overview) : new Map();
  return projects.map((project) => {
    const stats = byProject.get(project.name);
    const { health, healthLabel } = resolveProjectHealth(project, stats);
    const progressPercent = resolveProjectProgressPercent(project, stats);
    const totalTasks = stats?.total ?? 0;
    const completedTasks = stats?.done ?? 0;
    return {
      id: project.id,
      name: project.name,
      color: project.color,
      progressPercent,
      delayPercent: Math.max(0, 100 - progressPercent),
      health,
      healthLabel,
      totalTasks,
      completedTasks,
      pendingTasks: Math.max(0, totalTasks - completedTasks),
      overdueCount: stats?.overdue ?? 0,
    };
  });
}

function sumBreakdownOverdue(breakdown: TaskReportsProjectBreakdownRow[]): number {
  return breakdown.reduce((sum, row) => sum + (row.overdue_tasks ?? 0), 0);
}

function resolveReportTotalOverdue(
  overviewOverdueTotal: number | undefined,
  breakdown: TaskReportsProjectBreakdownRow[] | undefined,
  rowOverdueSum: number,
): number {
  if (overviewOverdueTotal != null && Number.isFinite(overviewOverdueTotal)) {
    return Math.max(0, Math.floor(overviewOverdueTotal));
  }
  if (breakdown?.length) {
    return sumBreakdownOverdue(breakdown);
  }
  return rowOverdueSum;
}

function resolveSummaryTotalOverdue(
  overviewOverdueTotal: number | undefined,
  fallback: number,
): number {
  if (overviewOverdueTotal == null || !Number.isFinite(overviewOverdueTotal)) {
    return fallback;
  }
  return Math.max(0, Math.floor(overviewOverdueTotal));
}

function countProjectsByOverdueThreshold(
  rows: ReadonlyArray<{ overdueCount: number }>,
): { onTrack: number; atRisk: number } {
  let onTrack = 0;
  let atRisk = 0;
  for (const row of rows) {
    if (isProjectAtRiskByOverdue(row.overdueCount)) {
      atRisk += 1;
    } else {
      onTrack += 1;
    }
  }
  return { onTrack, atRisk };
}

export function buildProjectReportSummaryFromBreakdown(
  breakdown: TaskReportsProjectBreakdownRow[],
): ProjectReportSummary | undefined {
  if (breakdown.length === 0) return undefined;
  const rows = breakdown.map((row) => ({
    overdueCount: row.overdue_tasks ?? 0,
  }));
  const { onTrack, atRisk } = countProjectsByOverdueThreshold(rows);
  return {
    total: breakdown.length,
    active: onTrack,
    completed: 0,
    withIssues: atRisk,
    onTrack,
    atRisk,
    totalOverdue: sumBreakdownOverdue(breakdown),
  };
}

const PROJECT_VIEW_PERIOD_SUBTEXTS: Record<
  "last_7" | "last_30" | "this_month" | "custom",
  string
> = {
  last_7: "Active this week",
  last_30: "In selected period",
  this_month: "Active this month",
  custom: "In selected period",
};

export function resolveProjectViewKpiSubtexts(
  datePreset: "last_7" | "last_30" | "this_month" | "custom",
): ProjectViewKpiSubtexts {
  const totalProjects = PROJECT_VIEW_PERIOD_SUBTEXTS[datePreset];
  return {
    totalProjects,
    onTrack: "Projects with <2 overdue",
    atRisk: "Projects with 2+ overdue",
    totalOverdue: "Across all projects",
  };
}

/** Sentinel id for tasks with no project (`project_breakdown.project_id` null). */
export const REPORTS_ORGANIZATIONAL_PROJECT_ID = 0;

export function normalizePlannerProjectListItem(raw: unknown): PlannerProjectListItem | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const idRaw = row.id ?? row.project_id;
  const id =
    idRaw == null || idRaw === ""
      ? REPORTS_ORGANIZATIONAL_PROJECT_ID
      : Number(idRaw);
  const name =
    readString(row.name) ??
    readString(row.project_name) ??
    readString(row.title);
  if (!Number.isFinite(id) || !name) return null;
  const status = readString(row.status) ?? "active";
  const color = readString(row.color) ?? "#3b82f6";
  return { id: Math.floor(id), name, color, status };
}

function projectFilterOptionKey(project: PlannerProjectListItem): string {
  return `${project.id}:${project.name.toLowerCase()}`;
}

export function mergeReportsProjectFilterOptions(
  fromList: PlannerProjectListItem[],
  breakdown?: TaskReportsProjectBreakdownRow[],
): PlannerProjectListItem[] {
  const merged = new Map<string, PlannerProjectListItem>();
  for (const project of fromList) {
    merged.set(projectFilterOptionKey(project), project);
  }
  for (const row of breakdown ?? []) {
    const name = row.project_name?.trim();
    if (!name) continue;
    const id =
      row.project_id != null && Number.isFinite(Number(row.project_id))
        ? Math.floor(Number(row.project_id))
        : REPORTS_ORGANIZATIONAL_PROJECT_ID;
    const candidate: PlannerProjectListItem = {
      id,
      name,
      color: row.color?.trim() || "#3b82f6",
      status: "active",
    };
    const key = projectFilterOptionKey(candidate);
    if (!merged.has(key)) {
      merged.set(key, candidate);
    }
  }
  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function readProjectsListRows(response: Record<string, unknown>): unknown[] {
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.projects)) return nested.projects;
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

export function normalizePlannerProjectList(
  response: unknown,
): { projects: PlannerProjectListItem[]; summary?: ProjectReportSummary } {
  if (response == null || typeof response !== "object") {
    return { projects: [] };
  }
  const body = response as Record<string, unknown>;
  if (body.success === false) {
    return { projects: [] };
  }
  const rows = readProjectsListRows(body);
  const projects = rows
    .map(normalizePlannerProjectListItem)
    .filter((p): p is PlannerProjectListItem => p != null);

  const summaryRaw = body.summary;
  if (summaryRaw == null || typeof summaryRaw !== "object") {
    return { projects };
  }
  const summaryRow = summaryRaw as Record<string, unknown>;
  const active = Number(summaryRow.active);
  const total = Number(summaryRow.total);
  const overdueTasks = Number(summaryRow.overdue_tasks);
  const completed = projects.filter((p) => p.status === "completed").length;
  const withIssuesCount = Number.isFinite(overdueTasks)
    ? Math.max(0, Math.floor(overdueTasks))
    : 0;
  const projectTotal = Number.isFinite(total) ? Math.floor(total) : projects.length;
  const onTrack = Math.max(0, projectTotal - withIssuesCount);
  return {
    projects,
    summary: {
      active: Number.isFinite(active) ? Math.floor(active) : projects.filter((p) => p.status === "active").length,
      completed,
      withIssues: withIssuesCount,
      total: projectTotal,
      onTrack,
      atRisk: withIssuesCount,
      totalOverdue: withIssuesCount,
    },
  };
}

export function buildProjectReportSummary(
  projects: PlannerProjectListItem[],
  rows: ProjectReportRow[],
  apiSummary?: ProjectReportSummary,
  breakdown?: TaskReportsProjectBreakdownRow[],
  overviewOverdueTotal?: number,
): ProjectReportSummary {
  const { onTrack, atRisk } = countProjectsByOverdueThreshold(rows);
  const rowOverdueSum = rows.reduce((sum, row) => sum + row.overdueCount, 0);
  const totalOverdue = resolveReportTotalOverdue(
    overviewOverdueTotal,
    breakdown,
    rowOverdueSum,
  );

  if (rows.length > 0) {
    return {
      total: rows.length,
      active: onTrack,
      completed: apiSummary?.completed ?? projects.filter((p) => p.status === "completed").length,
      withIssues: atRisk,
      onTrack,
      atRisk,
      totalOverdue,
    };
  }

  const fromBreakdown = breakdown?.length
    ? buildProjectReportSummaryFromBreakdown(breakdown)
    : undefined;
  if (fromBreakdown) {
    return {
      ...fromBreakdown,
      completed: apiSummary?.completed ?? fromBreakdown.completed,
      totalOverdue: resolveSummaryTotalOverdue(
        overviewOverdueTotal,
        fromBreakdown.totalOverdue,
      ),
    };
  }
  if (apiSummary) {
    const legacyOnTrack = Math.max(0, apiSummary.total - apiSummary.withIssues);
    return {
      ...apiSummary,
      onTrack: apiSummary.onTrack ?? legacyOnTrack,
      atRisk: apiSummary.atRisk ?? apiSummary.withIssues,
      totalOverdue: apiSummary.totalOverdue ?? totalOverdue,
    };
  }
  const legacyAtRisk = rows.filter(
    (r) => isProjectAtRiskByOverdue(r.overdueCount) || r.health === "at_risk",
  ).length;
  return {
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    withIssues: legacyAtRisk,
    total: projects.length,
    onTrack: Math.max(0, projects.length - legacyAtRisk),
    atRisk: legacyAtRisk,
    totalOverdue,
  };
}

export function buildOverdueByProjectRows(
  overview: TaskReportsOverview | undefined,
): OverdueByProjectRow[] {
  if (!overview) return [];
  const rows: OverdueByProjectRow[] = [];
  for (const task of overview.pending_tasks) {
    if (isTaskOverdue(task.due_date) && !isTaskDone(task.status_name)) {
      rows.push({
        projectName: task.project_name?.trim() || "No project",
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date ?? null,
      });
    }
  }
  return rows;
}

export function buildOverdueCountByProjectFromBreakdown(
  breakdown: TaskReportsProjectBreakdownRow[],
): ReadonlyArray<{ projectName: string; count: number }> {
  return breakdown
    .filter((row) => (row.overdue_tasks ?? 0) > 0)
    .map((row) => ({
      projectName: row.project_name,
      count: row.overdue_tasks ?? 0,
    }));
}
