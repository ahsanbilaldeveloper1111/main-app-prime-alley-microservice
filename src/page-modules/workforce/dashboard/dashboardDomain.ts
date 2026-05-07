import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import type { EmployeeDashboardParams } from "@utils/staffManagement";

export interface LeaveCalendarEmployee {
  user_id: string;
  employee_name: string;
  leave_type: string;
  request_id: number;
}

export interface LeaveCalendarDay {
  date: string;
  on_leave_count: number;
  employees: LeaveCalendarEmployee[];
}

export interface EmployeeDashboardCounters {
  employees?: { total?: number; active?: number; inactive?: number };
  approvals?: {
    pending?: number;
    aging?: { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number };
    pending_leave?: number;
    pending_other?: number;
  };
  leave?: { on_leave_today?: number; upcoming_7_days?: number };
  journey?: { total?: number; in_progress?: number; on_track?: number; overdue?: number; completed?: number };
  attendance?: {
    today?: { with_record?: number; checked_in?: number; checked_out?: number; no_record_estimate?: number };
  };
  compliance_alerts?: { high?: number; medium?: number; low?: number; total?: number };
}

export type ApprovalsAgingBuckets = {
  "0_3_days"?: number;
  "4_7_days"?: number;
  "8_plus_days"?: number;
};

export type DepartmentHeadcountRow = { department_id: number; count: number };

export const DEPARTMENT_CHART_COLORS = [
  "#6366F1",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

export function serializeEmployeeDashboardParamsKey(params?: EmployeeDashboardParams): string {
  if (!params) return "{}";
  return JSON.stringify({
    days: params.days ?? null,
    period_type: params.period_type ?? null,
    date: params.date ?? null,
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
  });
}

export function parseDepartmentHeadcountApiRows(raw: unknown): DepartmentHeadcountRow[] {
  if (!Array.isArray(raw)) return [];
  const out: DepartmentHeadcountRow[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const idRaw = o.department_id;
    const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
    if (!Number.isFinite(id)) continue;
    const c = o.count;
    const count = typeof c === "number" && Number.isFinite(c) ? c : Number(c);
    out.push({
      department_id: id,
      count: Number.isFinite(count) ? count : 0,
    });
  }
  return out;
}

export function departmentNameFromLookup(
  departmentId: number,
  departments: MainAppDepartmentLookup[],
): string {
  const match = departments.find((d) => d.id === departmentId);
  const n = match?.name;
  if (n != null && String(n).trim() !== "") {
    return String(n).trim();
  }
  return `Department #${departmentId}`;
}

export function parseApprovalsAgingApi(raw: unknown): ApprovalsAgingBuckets {
  if (!raw || typeof raw !== "object") return {};
  return raw as ApprovalsAgingBuckets;
}

export function parseLeaveCalendarApi(raw: unknown): LeaveCalendarDay[] {
  return Array.isArray(raw) ? (raw as LeaveCalendarDay[]) : [];
}
