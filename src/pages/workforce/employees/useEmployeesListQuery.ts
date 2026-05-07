import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "../../../query/keys";
import { getUserProfiles } from "@utils/staffManagement";
import type { UserProfile } from "@utils/staffManagement";
import {
  buildUserProfilesRequestParams,
  serializeEmployeesListFiltersKey,
  type EmployeesListAppliedFilters,
} from "./employeesDomain";

async function fetchEmployeesListPayload(args: {
  page: number;
  limit: number;
  filters: EmployeesListAppliedFilters;
}) {
  try {
    const params = buildUserProfilesRequestParams(args.page, args.limit, args.filters);
    return await getUserProfiles(params);
  } catch (e) {
    console.error("[Employees] getUserProfiles error", e);
    return { data: [] as UserProfile[], pagination: undefined };
  }
}

export function useEmployeesListQuery(args: {
  page: number;
  limit: number;
  filters: EmployeesListAppliedFilters;
}) {
  const filtersKey = serializeEmployeesListFiltersKey(args.filters);
  return useQuery({
    queryKey: workforceKeys.employees.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
    }),
    queryFn: () => fetchEmployeesListPayload({ page: args.page, limit: args.limit, filters: args.filters }),
  });
}
