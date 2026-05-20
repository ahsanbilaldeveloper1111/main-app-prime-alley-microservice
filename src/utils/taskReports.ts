import axiosInstance from "./axios";

const prefix = "work-planner";
const reportsPath = `${prefix}/tasks/reports`;

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
}

export interface TaskReportsPeriodDelta {
  value?: number;
  percent?: number;
  direction?: "up" | "down" | "flat" | string;
  label?: string;
}

export interface TaskReportsSummary {
  total_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
  pending_tasks?: number;
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
  in_progress_count?: number;
  done_count?: number;
  overdue_count?: number;
}

export interface TaskReportsTaskRow {
  id: number;
  title: string;
  priority?: string | null;
  status_name?: string | null;
  status_color?: string | null;
  due_date?: string | null;
  project_name?: string | null;
  days_in_progress?: number | null;
  last_updated_at?: string | null;
  transferred_at?: string | null;
  from_extension?: string | null;
  to_extension?: string | null;
  assignee_name?: string | null;
}

export interface TaskReportsTrendPoint {
  date: string;
  count?: number;
  total_tasks?: number;
  tasks?: number;
}

export interface TaskReportsOverview {
  filters?: Record<string, unknown>;
  summary: TaskReportsSummary;
  status_breakdown: TaskReportsStatusRow[];
  top_assignees: TaskReportsAssigneeRow[];
  pending_tasks: TaskReportsTaskRow[];
  transfer_tasks: TaskReportsTaskRow[];
  stale_in_progress_tasks: TaskReportsTaskRow[];
  trends: TaskReportsTrendPoint[];
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

function appendReportsQueryParams(params: URLSearchParams, q: TaskReportsQuery): void {
  params.set("tenant_id", q.tenant_id);
  if (q.start_date) params.set("start_date", q.start_date);
  if (q.end_date) params.set("end_date", q.end_date);
  if (q.extension_number) params.set("extension_number", q.extension_number);
  if (q.project_id != null) params.set("project_id", String(q.project_id));
  if (q.in_progress_stale_days != null) {
    params.set("in_progress_stale_days", String(q.in_progress_stale_days));
  }
  if (q.pending_limit != null) params.set("pending_limit", String(q.pending_limit));
  if (q.top_assignees_limit != null) {
    params.set("top_assignees_limit", String(q.top_assignees_limit));
  }
  if (Array.isArray(q.extension_numbers)) {
    for (const ext of q.extension_numbers) {
      if (ext) params.append("extension_numbers[]", ext);
    }
  }
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
  appendReportsQueryParams(params, { ...query, pending_limit: query.pending_limit ?? 100 });
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
