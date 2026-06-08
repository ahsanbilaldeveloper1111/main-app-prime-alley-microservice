import moment from "moment";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import { WORKFORCE_DEPARTMENT_CHART_COLORS } from "@page-modules/workforce/shared/workforceChartColors";
import type { UserProfile } from "@utils/staffManagement";

/** Dashboard counters on employees page (includes optional fields returned by API). */
export interface EmployeesDashboardOverviewCounters {
  employees?: { total?: number; active?: number; inactive?: number };
  approvals?: {
    pending?: number;
    aging?: { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number };
    avg_aging?: number;
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

export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
export const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];
export const EMPLOYEE_STATUS_OPTIONS = ["Active", "Inactive"];

export const EMPLOYEES_ITEMS_PER_PAGE = 15;

/** Max `user_ids` length when sending a scoped directory list to GET /user-profiles */
export const EMPLOYEES_LIST_MAX_USER_IDS_IN_QUERY = 120;

export type EmployeesListQueryScope = {
  canViewAllCompanyEmployees: boolean;
  mainAppUserPhones: readonly string[];
  mainAppUsers: readonly { id: number | string; phone?: string | null }[];
  loadingUsers: boolean;
};

export function serializeEmployeesListScopeKey(scope: EmployeesListQueryScope): string {
  const phones = [...scope.mainAppUserPhones]
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0)
    .sort((a, b) => a.localeCompare(b));
  return JSON.stringify({
    viewAll: scope.canViewAllCompanyEmployees,
    loading: scope.loadingUsers,
    phones,
  });
}

export const DEPARTMENT_HEADCOUNT_CHART_COLORS = WORKFORCE_DEPARTMENT_CHART_COLORS;

/** Value sent as `user_ids` in getUserProfiles — matches profile `user_id` (phone / extension). */
export function userIdForProfilePayload(u: { phone?: string | null }): string {
  const raw = u.phone;
  if (raw == null) return "";
  return String(raw).trim();
}

/** Normalize hierarchy list item to string for display (handles both string and { name?, id? } shapes) */
export function hierarchyLabel(item: unknown): string {
  if (item == null) return "—";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const o = item as { name?: string; id?: string | number; [key: string]: unknown };
    return String(o.name ?? o.id ?? "—");
  }
  if (typeof item === "number" || typeof item === "boolean" || typeof item === "bigint") return String(item);
  if (typeof item === "symbol") return item.description ?? "—";
  if (typeof item === "function") return item.name || "—";
  return "—";
}

export interface DepartmentHeadcountRawRow {
  departmentId: number | null;
  count: number;
  legacyName: string | null;
}

export interface DepartmentHeadcountChartRow {
  name: string;
  count: number;
  color: string;
  rowKey: string;
}

export function parseDepartmentIdFromApi(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function legacyDisplayNameFromApi(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

export function parseEmployeesPageDepartmentHeadcount(raw: unknown): DepartmentHeadcountRawRow[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown[] }).data)) {
    list = (raw as { data: unknown[] }).data;
  }
  return (list as Record<string, unknown>[]).map((item) => {
    const departmentId = parseDepartmentIdFromApi(item.department_id);
    const count = Number(item.count ?? 0);
    const legacyName = legacyDisplayNameFromApi(item.name);
    return { departmentId, count, legacyName };
  });
}

/** Label for department headcount chart: resolve id via main-app departments, else legacy name or placeholder */
export function departmentHeadcountDisplayName(
  departmentId: number | null,
  departments: MainAppDepartmentLookup[],
  legacyName?: string | null,
): string {
  if (departmentId != null) {
    const match = departments.find((d) => Number(d.id) === Number(departmentId));
    if (match?.name != null && String(match.name).trim() !== "") {
      return String(match.name).trim();
    }
    return `Department ${departmentId}`;
  }
  if (legacyName != null && legacyName.trim() !== "") {
    return legacyName.trim();
  }
  return "—";
}

export function buildDepartmentHeadcountChartRows(
  rawRows: DepartmentHeadcountRawRow[],
  departments: MainAppDepartmentLookup[],
): DepartmentHeadcountChartRow[] {
  return rawRows.map((row, i) => {
    const name = departmentHeadcountDisplayName(row.departmentId, departments, row.legacyName);
    const color = DEPARTMENT_HEADCOUNT_CHART_COLORS[i % DEPARTMENT_HEADCOUNT_CHART_COLORS.length];
    const rowKey =
      row.departmentId == null ? `row-${i}-${row.legacyName ?? "x"}` : `dept-${row.departmentId}`;
    return { name, count: row.count, color, rowKey };
  });
}

export interface EmployeesListAppliedFilters {
  appliedSearch: string;
  appliedDepartment: string;
  appliedLocationId: number | null;
  appliedStatus: string;
  appliedEmploymentType: string;
  appliedContract: string;
  appliedManagerIds: string[];
}

export function serializeEmployeesListFiltersKey(filters: EmployeesListAppliedFilters): string {
  return JSON.stringify({
    search: filters.appliedSearch,
    department: filters.appliedDepartment,
    locationId: filters.appliedLocationId,
    status: filters.appliedStatus,
    employmentType: filters.appliedEmploymentType,
    contract: filters.appliedContract,
    managerIds: [...filters.appliedManagerIds].sort((a, b) => a.localeCompare(b)),
  });
}

export function buildUserProfilesRequestParams(
  page: number,
  limit: number,
  filters: EmployeesListAppliedFilters,
): {
  page: number;
  limit: number;
  employment_type?: string;
  contract_type?: string;
  status?: string;
  location_id?: number;
  department_id?: number;
  search?: string;
  user_ids?: string[];
} {
  const params: {
    page: number;
    limit: number;
    employment_type?: string;
    contract_type?: string;
    status?: string;
    location_id?: number;
    department_id?: number;
    search?: string;
    user_ids?: string[];
  } = { page, limit };
  if (filters.appliedEmploymentType?.trim()) params.employment_type = filters.appliedEmploymentType.trim();
  if (filters.appliedContract?.trim()) params.contract_type = filters.appliedContract.trim();
  if (filters.appliedStatus?.trim()) params.status = filters.appliedStatus.trim().toLowerCase();
  if (filters.appliedLocationId != null) params.location_id = filters.appliedLocationId;
  if (filters.appliedDepartment?.trim()) params.department_id = Number(filters.appliedDepartment.trim());
  if (filters.appliedSearch?.trim()) params.search = filters.appliedSearch.trim();
  if (filters.appliedManagerIds.length > 0) params.user_ids = filters.appliedManagerIds;
  return params;
}

/** Local calendar date as YYYY-MM-DD for `<input type="date" min>` and comparisons */
export function localDateIsoToday(): string {
  return moment().format("YYYY-MM-DD");
}

/**
 * Earliest allowed journey start: not before the employee record's `created_at` (local calendar day)
 * and not before today.
 */
export function journeyStartDateMinIso(profile: UserProfile | null | undefined): string {
  const today = localDateIsoToday();
  if (profile == null) return today;
  const raw = profile["created_at"];
  if (typeof raw !== "string" || raw.trim() === "") return today;
  const createdDay = moment(raw);
  if (!createdDay.isValid()) return today;
  const createdIso = createdDay.format("YYYY-MM-DD");
  const todayM = moment(today, "YYYY-MM-DD");
  const createdM = moment(createdIso, "YYYY-MM-DD");
  return moment.max(todayM, createdM).format("YYYY-MM-DD");
}
