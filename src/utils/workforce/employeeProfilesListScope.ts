export type EmployeeProfilesListScopeInput = {
  canViewAllCompanyEmployees: boolean;
  mainAppUserPhones: readonly string[];
  appliedManagerIds: readonly string[];
  maxUserIdsInQuery: number;
};

export type EmployeeProfilesListScopeResult =
  | { kind: "full"; user_ids?: string[] }
  | { kind: "scoped"; user_ids: string[] }
  | { kind: "scoped_backend_only" }
  | { kind: "empty" };

/**
 * Resolves GET /user-profiles scope: "view all company" permission widens the list;
 * without it, results are limited to main-app directory phones (and optional manager filter).
 */
export function resolveEmployeeProfilesListScope(
  input: EmployeeProfilesListScopeInput,
): EmployeeProfilesListScopeResult {
  const {
    canViewAllCompanyEmployees,
    mainAppUserPhones,
    appliedManagerIds,
    maxUserIdsInQuery,
  } = input;

  if (canViewAllCompanyEmployees) {
    if (appliedManagerIds.length > 0) {
      return { kind: "full", user_ids: [...appliedManagerIds] };
    }
    return { kind: "full" };
  }

  if (mainAppUserPhones.length === 0) {
    return { kind: "empty" };
  }

  const allowed = new Set(mainAppUserPhones);
  const normalizedManagers = appliedManagerIds
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
  const scopedIds: string[] =
    normalizedManagers.length > 0
      ? normalizedManagers.filter((id) => allowed.has(id))
      : [...mainAppUserPhones];

  if (normalizedManagers.length > 0 && scopedIds.length === 0) {
    return { kind: "empty" };
  }

  if (scopedIds.length > 0 && scopedIds.length <= maxUserIdsInQuery) {
    return { kind: "scoped", user_ids: scopedIds };
  }

  return { kind: "scoped_backend_only" };
}

export type EmployeeProfilesListFilterFields = {
  appliedEmploymentType: string;
  appliedContract: string;
  appliedStatus: string;
  appliedLocationId: number | null;
  appliedDepartment: string;
  appliedSearch: string;
};

type MutableProfileListParams = {
  page: number;
  limit: number;
  employment_type?: string;
  contract_type?: string;
  status?: string;
  location_id?: number;
  department_id?: number;
  search?: string;
  user_ids?: string[];
  view_all_company_employees?: boolean;
};

export type EmployeeProfilesListScopeApplied =
  Exclude<EmployeeProfilesListScopeResult, { kind: "empty" }>;

export function applyEmployeeProfilesListScopeToParams(
  params: MutableProfileListParams,
  scope: EmployeeProfilesListScopeApplied,
): void {
  if (scope.kind === "full") {
    params.view_all_company_employees = true;
    if (scope.user_ids != null && scope.user_ids.length > 0) {
      params.user_ids = scope.user_ids;
    }
    return;
  }
  if (scope.kind === "scoped") {
    params.view_all_company_employees = false;
    params.user_ids = scope.user_ids;
    return;
  }
  params.view_all_company_employees = false;
}

export function applyEmployeeProfilesListFilters(
  params: MutableProfileListParams,
  filters: EmployeeProfilesListFilterFields,
): void {
  if (filters.appliedEmploymentType.trim() !== "") {
    params.employment_type = filters.appliedEmploymentType.trim();
  }
  if (filters.appliedContract.trim() !== "") {
    params.contract_type = filters.appliedContract.trim();
  }
  if (filters.appliedStatus.trim() !== "") {
    params.status = filters.appliedStatus.trim().toLowerCase();
  }
  if (filters.appliedLocationId != null) {
    params.location_id = filters.appliedLocationId;
  }
  if (filters.appliedDepartment.trim() !== "") {
    params.department_id = Number(filters.appliedDepartment.trim());
  }
  if (filters.appliedSearch.trim() !== "") {
    params.search = filters.appliedSearch.trim();
  }
}
