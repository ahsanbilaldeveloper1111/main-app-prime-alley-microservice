import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import {
  getEmployeeDashboardCounters,
  getEmployeeDashboardGraphDepartmentHeadcount,
} from "@utils/staffManagement";
import { serializeEmployeeDashboardParamsKey } from "../dashboard/dashboardDomain";
import {
  parseEmployeesPageDepartmentHeadcount,
  type EmployeesDashboardOverviewCounters,
} from "./employeesDomain";

/** Matches employees page widgets: unscoped dashboard APIs (no period filters). */
const EMPLOYEES_WIDGETS_PARAMS_KEY = serializeEmployeeDashboardParamsKey();

async function fetchDepartmentHeadcountForEmployeesPage() {
  try {
    const data = await getEmployeeDashboardGraphDepartmentHeadcount();
    return parseEmployeesPageDepartmentHeadcount(data);
  } catch (e) {
    console.error("[Employees] getEmployeeDashboardGraphDepartmentHeadcount error", e);
    return [];
  }
}

async function fetchDashboardCountersForEmployeesPage(): Promise<EmployeesDashboardOverviewCounters | null> {
  try {
    const data = await getEmployeeDashboardCounters();
    return (data as EmployeesDashboardOverviewCounters) ?? null;
  } catch (e) {
    console.error("[Employees] getEmployeeDashboardCounters error", e);
    return null;
  }
}

export function useEmployeesDepartmentHeadcountQuery() {
  return useQuery({
    queryKey: workforceKeys.dashboard.departmentHeadcount(EMPLOYEES_WIDGETS_PARAMS_KEY),
    queryFn: fetchDepartmentHeadcountForEmployeesPage,
  });
}

export function useEmployeesDashboardCountersQuery() {
  return useQuery({
    queryKey: workforceKeys.dashboard.counters(EMPLOYEES_WIDGETS_PARAMS_KEY),
    queryFn: fetchDashboardCountersForEmployeesPage,
  });
}
