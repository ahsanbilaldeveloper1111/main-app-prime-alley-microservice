import axiosInstance from "./axios";
import {
  TASK_REPORTS_EXPORT_PENDING_LIMIT,
  TASK_REPORTS_OVERVIEW_LIMITS,
} from "./reportsApiConstants";

const prefix = "work-planner";
const reportsPath = `${prefix}/tasks/reports`;

export type TaskReportsOverviewLimits = typeof TASK_REPORTS_OVERVIEW_LIMITS;

export interface TaskReportsQuery {
  tenant_id: string;
  start_date?: string;
  end_date?: string;
  extension_number?: string;
  extension_numbers?: string[];
  project_id?: number;
  in_progress_stale_days?: number;
  pending_limit?: number;
  top_assignees_limit?: number;
  recent_activity_limit?: number;
  member_report_limit?: number;
  member_trends_members_limit?: number;
  member_trends_periods_limit?: number;
  completion_trends_days_limit?: number;
  trends_days_limit?: number;
  project_breakdown_limit?: number;
}

export type TaskReportsListLimitFlag = Readonly<{
  truncated?: boolean;
  limit?: number;
  total?: number;
  returned?: number;
  total_in_scope?: number;
}>;

export type TaskReportsListLimits = Readonly<{
  pending_tasks?: TaskReportsListLimitFlag;
  top_assignees?: TaskReportsListLimitFlag;
  member_report?: TaskReportsListLimitFlag;
  member_trends?: TaskReportsListLimitFlag;
  completion_trends?: TaskReportsListLimitFlag;
  trends?: TaskReportsListLimitFlag;
  project_breakdown?: TaskReportsListLimitFlag;
  recent_activity?: TaskReportsListLimitFlag;
  stale_in_progress_tasks?: TaskReportsListLimitFlag;
  transfer_tasks?: TaskReportsListLimitFlag;
}>;

export type BuildTaskReportsQueryInput = Readonly<{
  tenant_id: string;
  start_date?: string;
  end_date?: string;
  project_id?: number;
  extension_number?: string;
  extension_numbers?: string[];
  in_progress_stale_days?: number;
  limits?: Partial<TaskReportsOverviewLimits>;
  forExport?: boolean;
}>;

export interface TaskReportsPeriodDelta {
  value?: number;
  percent?: number;
  direction?: "up" | "down" | "flat";
  label?: string;
}

export interface TaskReportsSummary {
  total_tasks?: number;
  completed_tasks?: number;
  completed_in_period?: number;
  overdue_tasks?: number;
  pending_tasks?: number;
  in_progress_tasks?: number;
  in_review_tasks?: number;
  todo_tasks?: number;
  stale_in_progress_tasks?: number;
  total_hours?: number;
  completion_rate?: number;
  vs_previous_period?: Record<string, TaskReportsPeriodDelta>;
}

export interface TaskReportsStatusRow {
  status_id?: number;
  status_name: string;
  status_color?: string | null;
  count: number;
  percent?: number;
}

export interface TaskReportsAssigneeRow {
  extension_number?: string;
  name?: string | null;
  display_name?: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  task_count?: number;
  todo_count?: number;
  pending_count?: number;
  in_progress_count?: number;
  done_count?: number;
  completed_count?: number;
  overdue_count?: number;
  completion_percent?: number;
  project_name?: string | null;
  primary_project_name?: string | null;
}

export interface TaskReportsTaskRow {
  id: number;
  title: string;
  priority?: string | null;
  status_name?: string | null;
  status_color?: string | null;
  due_date?: string | null;
  project_name?: string | null;
  phase?: string | null;
  is_overdue?: boolean;
  is_completed?: boolean;
  days_in_progress?: number | null;
  last_updated_at?: string | null;
  transferred_at?: string | null;
  from_extension?: string | null;
  to_extension?: string | null;
  assignee_name?: string | null;
  assignee_extension?: string | null;
}

export interface TaskReportsTrendPoint {
  date: string;
  count?: number;
  total_tasks?: number;
  tasks?: number;
  created?: number;
  pending?: number;
  completed?: number;
  completion_rate?: number;
  completed_count?: number;
  executed_count?: number;
}

/** Weekly buckets from `weekly_completion_trends` / `overdue_trends`. */
export type TaskReportsWeeklyTrendPoint = Readonly<{
  week_index?: number;
  week_label: string;
  date?: string;
  period_start?: string;
  period_end?: string;
  value: number;
  completion_rate_percent?: number;
  overdue_count?: number;
}>;

export type TaskReportsMemberTrendPeriod = Readonly<{
  date?: string;
  label?: string;
  week_label?: string;
  week_index?: number;
  value?: number;
  percent?: number;
  delta_label?: string | null;
  completed?: number;
  created?: number;
}>;

export type TaskReportsMemberTrendDelta = Readonly<{
  delta_percent?: number;
  label?: string;
  direction?: "up" | "down" | "flat";
}>;

export type TaskReportsMemberTrendRow = Readonly<{
  extension_number?: string;
  name?: string | null;
  display_name?: string | null;
  periods?: TaskReportsMemberTrendPeriod[];
  weeks?: Record<string, number>;
  trend?: TaskReportsMemberTrendDelta;
}>;

export type TaskReportsProjectBreakdownRow = Readonly<{
  project_id?: number;
  project_name: string;
  color?: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  progress_percent?: number;
  delay_percent?: number;
  health?: string | null;
  health_label?: string | null;
}>;

export type TaskReportsActivityRow = Readonly<{
  id?: string | number;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  actor_name?: string | null;
  actor_extension?: string | null;
  project_name?: string | null;
  occurred_at?: string | null;
  badge?: string | null;
  badge_tone?: string | null;
}>;

export type TaskReportsActiveIssueRow = Readonly<{
  id?: string | number;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  severity?: string | null;
  priority?: string | null;
  project_name?: string | null;
}>;

export interface TaskReportsOverview {
  filters?: Record<string, unknown>;
  list_limits?: TaskReportsListLimits;
  summary: TaskReportsSummary;
  status_breakdown: TaskReportsStatusRow[];
  top_assignees: TaskReportsAssigneeRow[];
  member_report: TaskReportsAssigneeRow[];
  pending_tasks: TaskReportsTaskRow[];
  transfer_tasks: TaskReportsTaskRow[];
  stale_in_progress_tasks: TaskReportsTaskRow[];
  trends: TaskReportsTrendPoint[];
  completion_trends?: TaskReportsTrendPoint[];
  weekly_completion_trends?: TaskReportsWeeklyTrendPoint[];
  overdue_trends?: TaskReportsWeeklyTrendPoint[];
  member_trends?: TaskReportsMemberTrendRow[];
  project_breakdown: TaskReportsProjectBreakdownRow[];
  recent_activity: TaskReportsActivityRow[];
  active_issues: TaskReportsActiveIssueRow[];
}

function parsePlannerWrappedData<T>(response: { data?: unknown }): T {
  const body = response?.data;
  if (body == null || typeof body !== "object") {
    throw new Error("Invalid reports response");
  }
  const wrapped = body as {
    success?: boolean;
    message?: string;
    data?: T;
  };
  if (wrapped.success === false) {
    throw new Error(wrapped.message || "Reports request failed");
  }
  if (wrapped.data !== undefined && wrapped.data !== null) {
    return wrapped.data;
  }
  return body as T;
}

function appendOptionalIntParam(
  params: URLSearchParams,
  key: string,
  value: number | undefined,
): void {
  if (value != null) params.set(key, String(value));
}

function appendExtensionFilters(params: URLSearchParams, q: TaskReportsQuery): void {
  if (q.extension_number) {
    params.set("extension_number", q.extension_number);
    return;
  }
  const extensions = q.extension_numbers;
  if (!Array.isArray(extensions)) return;
  for (const ext of extensions) {
    if (ext) params.append("extension_numbers[]", ext);
  }
}

function appendReportsQueryParams(params: URLSearchParams, q: TaskReportsQuery): void {
  params.set("tenant_id", q.tenant_id);
  if (q.start_date) params.set("start_date", q.start_date);
  if (q.end_date) params.set("end_date", q.end_date);
  appendExtensionFilters(params, q);
  if (q.project_id != null) params.set("project_id", String(q.project_id));
  appendOptionalIntParam(params, "in_progress_stale_days", q.in_progress_stale_days);
  appendOptionalIntParam(params, "pending_limit", q.pending_limit);
  appendOptionalIntParam(params, "top_assignees_limit", q.top_assignees_limit);
  appendOptionalIntParam(params, "recent_activity_limit", q.recent_activity_limit);
  appendOptionalIntParam(params, "member_report_limit", q.member_report_limit);
  appendOptionalIntParam(
    params,
    "member_trends_members_limit",
    q.member_trends_members_limit,
  );
  appendOptionalIntParam(
    params,
    "member_trends_periods_limit",
    q.member_trends_periods_limit,
  );
  appendOptionalIntParam(
    params,
    "completion_trends_days_limit",
    q.completion_trends_days_limit,
  );
  appendOptionalIntParam(params, "trends_days_limit", q.trends_days_limit);
  appendOptionalIntParam(params, "project_breakdown_limit", q.project_breakdown_limit);
}

export function buildTaskReportsQuery(input: BuildTaskReportsQueryInput): TaskReportsQuery {
  const overviewLimits = { ...TASK_REPORTS_OVERVIEW_LIMITS, ...input.limits };
  const pendingLimit = input.forExport
    ? TASK_REPORTS_EXPORT_PENDING_LIMIT
    : overviewLimits.pending_limit;

  const query: TaskReportsQuery = {
    tenant_id: input.tenant_id,
    start_date: input.start_date,
    end_date: input.end_date,
    project_id: input.project_id,
    in_progress_stale_days: input.in_progress_stale_days,
    pending_limit: pendingLimit,
    top_assignees_limit: overviewLimits.top_assignees_limit,
    recent_activity_limit: overviewLimits.recent_activity_limit,
    member_report_limit: overviewLimits.member_report_limit,
    member_trends_members_limit: overviewLimits.member_trends_members_limit,
    member_trends_periods_limit: overviewLimits.member_trends_periods_limit,
    completion_trends_days_limit: overviewLimits.completion_trends_days_limit,
    trends_days_limit: overviewLimits.trends_days_limit,
    project_breakdown_limit: overviewLimits.project_breakdown_limit,
  };

  if (input.extension_number) {
    query.extension_number = input.extension_number;
  } else if (input.extension_numbers?.length) {
    query.extension_numbers = input.extension_numbers;
  }

  return query;
}

export async function getTaskReportsOverview(
  query: TaskReportsQuery,
): Promise<TaskReportsOverview> {
  const params = new URLSearchParams();
  appendReportsQueryParams(params, query);
  const response = await axiosInstance.get(
    `${reportsPath}/overview?${params.toString()}`,
  );
  return parsePlannerWrappedData<TaskReportsOverview>(response);
}

function parseFilenameFromDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  return match?.[1]?.trim() ?? null;
}

export async function downloadTaskReportsExport(
  query: TaskReportsQuery,
  format: "csv" | "xlsx",
): Promise<void> {
  const params = new URLSearchParams();
  appendReportsQueryParams(params, query);
  params.set("format", format);
  const response = await axiosInstance.get(`${reportsPath}/export?${params.toString()}`, {
    responseType: "blob",
  });
  const blob = response.data as Blob;
  const fallbackName = `task-report_${query.start_date ?? "all"}_${query.end_date ?? "all"}.${format}`;
  const filename =
    parseFilenameFromDisposition(
      response.headers["content-disposition"] as string | undefined,
    ) ?? fallbackName;
  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  globalThis.URL.revokeObjectURL(url);
}
