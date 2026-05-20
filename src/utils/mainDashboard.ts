import axiosInstance from "./axios";
import type { MainDashboardDateRange } from "./mainDashboardDateRanges";

export interface CrmListCounts {
  leads: number;
  deals: number;
  orders: number;
  companies: number;
  meetings: number;
}

export interface AttendanceApprovalCounts {
  attendance_count: number;
  approval_request_count: number;
  filters?: {
    extensions?: string[];
    start_date?: string | null;
    end_date?: string | null;
    tenant_id?: string;
  };
}

export interface MainDashboardDateFilters extends MainDashboardDateRange {
  [key: string]: string | undefined;
}

interface StaffApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapStaffEnvelope<T>(body: unknown): T | null {
  if (body == null || typeof body !== "object") return null;
  const envelope = body as StaffApiEnvelope<T>;
  if (envelope.success === false) return null;
  if (envelope.data !== undefined) return envelope.data;
  return body as T;
}

/** CRM list-counts: `{ code, data: { success, data: { leads, ... } } }`. */
export function parseCrmListCountsResponse(body: unknown): CrmListCounts | null {
  if (body == null || typeof body !== "object") return null;

  let node: unknown = body;
  const outer = body as { data?: unknown };
  if (outer.data != null && typeof outer.data === "object") {
    node = outer.data;
  }

  if (node != null && typeof node === "object" && "data" in node) {
    const inner = node as StaffApiEnvelope<CrmListCounts>;
    if (inner.success === false) return null;
    node = inner.data;
  }

  if (node == null || typeof node !== "object") return null;

  const row = node as Record<string, unknown>;
  return {
    leads: Number(row.leads) || 0,
    deals: Number(row.deals) || 0,
    orders: Number(row.orders) || 0,
    companies: Number(row.companies) || 0,
    meetings: Number(row.meetings) || 0,
  };
}

export function parseAttendanceApprovalCountsResponse(
  body: unknown,
): AttendanceApprovalCounts | null {
  const data = unwrapStaffEnvelope<AttendanceApprovalCounts>(body);
  if (data == null || typeof data !== "object") return null;

  return {
    attendance_count: Number(data.attendance_count) || 0,
    approval_request_count: Number(data.approval_request_count) || 0,
    filters: data.filters,
  };
}

export function parsePendingTasksCount(body: unknown): number {
  if (body == null) return 0;
  if (typeof body === "number") return body;

  const unwrapped = unwrapStaffEnvelope<unknown>(body) ?? body;
  if (Array.isArray(unwrapped)) return unwrapped.length;

  if (typeof unwrapped !== "object") return 0;

  const row = unwrapped as Record<string, unknown>;
  for (const key of ["pending_count", "count", "total", "tasks_count"] as const) {
    if (typeof row[key] === "number") return row[key];
  }

  if (Array.isArray(row.data)) return row.data.length;
  if (Array.isArray(row.tasks)) return row.tasks.length;

  return 0;
}

function buildDateParams(range: MainDashboardDateRange): MainDashboardDateFilters {
  return {
    start_date: range.start_date,
    end_date: range.end_date,
  };
}

/** GET /staff-management/analytics/attendance-approval-counts */
export async function getAttendanceApprovalCounts(
  range: MainDashboardDateRange,
): Promise<AttendanceApprovalCounts | null> {
  try {
    const response = await axiosInstance.get(
      "/staff-management/analytics/attendance-approval-counts",
      { params: buildDateParams(range) },
    );
    return parseAttendanceApprovalCountsResponse(response.data);
  } catch (error: unknown) {
    console.error("[mainDashboard] attendance-approval-counts failed", error);
    return null;
  }
}

/** GET /work-planner/tasks/pending */
export async function getPendingWorkPlannerTasks(
  range: MainDashboardDateRange,
): Promise<number> {
  try {
    const response = await axiosInstance.get("/work-planner/tasks/pending", {
      params: buildDateParams(range),
    });
    return parsePendingTasksCount(response.data);
  } catch (error: unknown) {
    console.error("[mainDashboard] tasks/pending failed", error);
    return 0;
  }
}

/** GET /crm/list-counts */
export async function getCrmListCounts(
  range: MainDashboardDateRange,
): Promise<CrmListCounts | null> {
  try {
    const response = await axiosInstance.get("/crm/list-counts", {
      params: buildDateParams(range),
    });
    return parseCrmListCountsResponse(response.data);
  } catch (error: unknown) {
    console.error("[mainDashboard] crm/list-counts failed", error);
    return null;
  }
}

export interface MainDashboardAttendanceActivityBundle {
  attendance: AttendanceApprovalCounts | null;
  pendingTasksCount: number;
}

export async function fetchMainDashboardAttendanceActivity(
  range: MainDashboardDateRange,
): Promise<MainDashboardAttendanceActivityBundle> {
  const [attendance, pendingTasksCount] = await Promise.all([
    getAttendanceApprovalCounts(range),
    getPendingWorkPlannerTasks(range),
  ]);
  return { attendance, pendingTasksCount };
}

export type CrmCreatedCountsEntity = "prospects" | "leads" | "deals";

export interface CrmCreatedCountRow {
  user_extension: string;
  count: number;
}

export interface CrmCreatedCountsBundle {
  prospects: CrmCreatedCountRow[];
  leads: CrmCreatedCountRow[];
  deals: CrmCreatedCountRow[];
}

function toStableStringKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "bigint") return String(value);
  return null;
}

function normalizeUserExtension(value: unknown): string | null {
  const primitive = toStableStringKey(value);
  if (primitive) return primitive;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      toStableStringKey(record.user_extension) ??
      toStableStringKey(record.extension) ??
      toStableStringKey(record.id) ??
      toStableStringKey(record.value)
    );
  }
  return null;
}

/** CRM created-counts: `{ code, data: { success, data: [{ user_extension, count }] } }`. */
export function parseCrmCreatedCountsResponse(body: unknown): CrmCreatedCountRow[] {
  if (body == null || typeof body !== "object") return [];

  let node: unknown = body;
  const outer = body as { data?: unknown };
  if (outer.data != null && typeof outer.data === "object") {
    node = outer.data;
  }

  if (node != null && typeof node === "object" && "data" in node) {
    const inner = node as StaffApiEnvelope<CrmCreatedCountRow[]>;
    if (inner.success === false) return [];
    node = inner.data;
  }

  if (!Array.isArray(node)) return [];

  return node
    .map((row) => {
      if (row == null || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const userExtension = normalizeUserExtension(record.user_extension);
      if (userExtension == null) return null;
      return {
        user_extension: userExtension,
        count: Number(record.count) || 0,
      };
    })
    .filter((row): row is CrmCreatedCountRow => row != null);
}

/** GET /crm/created-counts/{entity} */
export async function getCrmCreatedCounts(
  entity: CrmCreatedCountsEntity,
  range: MainDashboardDateRange,
): Promise<CrmCreatedCountRow[]> {
  try {
    const response = await axiosInstance.get(`/crm/created-counts/${entity}`, {
      params: buildDateParams(range),
    });
    return parseCrmCreatedCountsResponse(response.data);
  } catch (error: unknown) {
    console.error(`[mainDashboard] crm/created-counts/${entity} failed`, error);
    return [];
  }
}

/** GET /crm/created-counts/{entity}/mine — current user only, same row shape as created-counts. */
export async function getCrmCreatedCountsMine(
  entity: CrmCreatedCountsEntity,
  range: MainDashboardDateRange,
): Promise<CrmCreatedCountRow[]> {
  try {
    const response = await axiosInstance.get(`/crm/created-counts/${entity}/mine`, {
      params: buildDateParams(range),
    });
    return parseCrmCreatedCountsResponse(response.data);
  } catch (error: unknown) {
    console.error(`[mainDashboard] crm/created-counts/${entity}/mine failed`, error);
    return [];
  }
}

export async function fetchCrmCreatedCountsBundle(
  range: MainDashboardDateRange,
): Promise<CrmCreatedCountsBundle> {
  const [prospects, leads, deals] = await Promise.all([
    getCrmCreatedCounts("prospects", range),
    getCrmCreatedCounts("leads", range),
    getCrmCreatedCounts("deals", range),
  ]);
  return { prospects, leads, deals };
}

export async function fetchCrmCreatedCountsMineBundle(
  range: MainDashboardDateRange,
): Promise<CrmCreatedCountsBundle> {
  const [prospects, leads, deals] = await Promise.all([
    getCrmCreatedCountsMine("prospects", range),
    getCrmCreatedCountsMine("leads", range),
    getCrmCreatedCountsMine("deals", range),
  ]);
  return { prospects, leads, deals };
}

export interface CrmDailyCreationDay {
  date: string;
  leads: number;
  deals: number;
  orders: number;
}

export interface CrmDailyCreationCounts {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  days: CrmDailyCreationDay[];
}

/** CRM daily-creation-counts: `{ code, data: { success, data: { period, days } } }`. */
export function parseCrmDailyCreationCountsResponse(
  body: unknown,
): CrmDailyCreationCounts | null {
  if (body == null || typeof body !== "object") return null;

  let node: unknown = body;
  const outer = body as { data?: unknown };
  if (outer.data != null && typeof outer.data === "object") {
    node = outer.data;
  }

  if (node != null && typeof node === "object" && "data" in node) {
    const inner = node as StaffApiEnvelope<CrmDailyCreationCounts>;
    if (inner.success === false) return null;
    node = inner.data;
  }

  if (node == null || typeof node !== "object") return null;

  const payload = node as Record<string, unknown>;
  const periodRaw = payload.period;
  const daysRaw = payload.days;
  if (periodRaw == null || typeof periodRaw !== "object" || !Array.isArray(daysRaw)) {
    return null;
  }

  const periodRecord = periodRaw as Record<string, unknown>;
  const days = daysRaw
    .map((row) => {
      if (row == null || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const date = typeof record.date === "string" ? record.date : null;
      if (!date) return null;
      return {
        date,
        leads: Number(record.leads) || 0,
        deals: Number(record.deals) || 0,
        orders: Number(record.orders) || 0,
      };
    })
    .filter((row): row is CrmDailyCreationDay => row != null);

  return {
    period: {
      start_date: String(periodRecord.start_date ?? ""),
      end_date: String(periodRecord.end_date ?? ""),
      days: Number(periodRecord.days) || days.length,
    },
    days,
  };
}

/** GET /crm/daily-creation-counts */
export async function getCrmDailyCreationCounts(
  range: MainDashboardDateRange,
): Promise<CrmDailyCreationCounts | null> {
  try {
    const response = await axiosInstance.get("/crm/daily-creation-counts", {
      params: buildDateParams(range),
    });
    return parseCrmDailyCreationCountsResponse(response.data);
  } catch (error: unknown) {
    console.error("[mainDashboard] crm/daily-creation-counts failed", error);
    return null;
  }
}
