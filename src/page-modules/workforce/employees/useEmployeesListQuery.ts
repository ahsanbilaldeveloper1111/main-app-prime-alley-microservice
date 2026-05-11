import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "../../../query/keys";
import { getUserProfiles } from "@utils/staffManagement";
import type { ApiPagination, UserProfile } from "@utils/staffManagement";
import {
  applyEmployeeProfilesListFilters,
  applyEmployeeProfilesListScopeToParams,
  resolveEmployeeProfilesListScope,
  type EmployeeProfilesListFilterFields,
} from "@utils/workforce/employeeProfilesListScope";
import { resolveUserProfileIdsForPhoneLikeSearch } from "@utils/workforce/employeeProfilesPhoneSearch";
import {
  EMPLOYEES_LIST_MAX_USER_IDS_IN_QUERY,
  serializeEmployeesListFiltersKey,
  serializeEmployeesListScopeKey,
  type EmployeesListAppliedFilters,
  type EmployeesListQueryScope,
} from "./employeesDomain";

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

function emptyListPagination(limit: number): ApiPagination {
  return { total: 0, limit, page: 1, last_page: 1, from: 0, to: 0 };
}

function filtersAsProfileFields(filters: EmployeesListAppliedFilters): EmployeeProfilesListFilterFields {
  return {
    appliedEmploymentType: filters.appliedEmploymentType,
    appliedContract: filters.appliedContract,
    appliedStatus: filters.appliedStatus,
    appliedLocationId: filters.appliedLocationId,
    appliedDepartment: filters.appliedDepartment,
    appliedSearch: filters.appliedSearch,
  };
}

async function fetchEmployeesListPayload(args: {
  page: number;
  limit: number;
  filters: EmployeesListAppliedFilters;
  scope: EmployeesListQueryScope;
}): Promise<{ data: UserProfile[]; pagination?: ApiPagination }> {
  const { page, limit, filters, scope } = args;

  if (!scope.canViewAllCompanyEmployees && scope.loadingUsers) {
    return { data: [], pagination: emptyListPagination(limit) };
  }

  const params: MutableProfileListParams = { page, limit };
  applyEmployeeProfilesListFilters(params, filtersAsProfileFields(filters));

  const resolvedScope = resolveEmployeeProfilesListScope({
    canViewAllCompanyEmployees: scope.canViewAllCompanyEmployees,
    mainAppUserPhones: scope.mainAppUserPhones,
    appliedManagerIds: filters.appliedManagerIds,
    maxUserIdsInQuery: EMPLOYEES_LIST_MAX_USER_IDS_IN_QUERY,
  });

  if (resolvedScope.kind === "empty") {
    return { data: [], pagination: emptyListPagination(limit) };
  }

  applyEmployeeProfilesListScopeToParams(params, resolvedScope);

  const phoneIds = resolveUserProfileIdsForPhoneLikeSearch({
    appliedSearch: filters.appliedSearch,
    mainAppUsers: scope.mainAppUsers,
    scope: resolvedScope,
    mainAppUserPhones: scope.mainAppUserPhones,
    maxIds: EMPLOYEES_LIST_MAX_USER_IDS_IN_QUERY,
  });
  if (phoneIds != null && phoneIds.length > 0) {
    params.user_ids = phoneIds;
    delete params.search;
  }

  try {
    return await getUserProfiles(params);
  } catch (e) {
    console.error("[Employees] getUserProfiles error", e);
    return { data: [], pagination: emptyListPagination(limit) };
  }
}

export function useEmployeesListQuery(args: {
  page: number;
  limit: number;
  filters: EmployeesListAppliedFilters;
  scope: EmployeesListQueryScope;
}) {
  const filtersKey = serializeEmployeesListFiltersKey(args.filters);
  const scopeKey = serializeEmployeesListScopeKey(args.scope);
  const listEnabled = args.scope.canViewAllCompanyEmployees || !args.scope.loadingUsers;

  return useQuery({
    queryKey: workforceKeys.employees.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
      scopeKey,
    }),
    queryFn: () =>
      fetchEmployeesListPayload({
        page: args.page,
        limit: args.limit,
        filters: args.filters,
        scope: args.scope,
      }),
    enabled: listEnabled,
  });
}
