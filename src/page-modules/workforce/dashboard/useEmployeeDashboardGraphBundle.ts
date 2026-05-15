import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import type { EmployeeDashboardParams } from "@utils/staffManagement";
import {
  getEmployeeDashboardGraphApprovalsAging,
  getEmployeeDashboardGraphDepartmentHeadcount,
  getEmployeeDashboardLeaveCalendar,
} from "@utils/staffManagement";
import {
  parseApprovalsAgingApi,
  parseDepartmentHeadcountApiRows,
  parseLeaveCalendarApi,
  serializeEmployeeDashboardParamsKey,
  type ApprovalsAgingBuckets,
  type DepartmentHeadcountRow,
  type LeaveCalendarDay,
} from "./dashboardDomain";

export interface EmployeeDashboardGraphBundle {
  departmentHeadcountRows: DepartmentHeadcountRow[];
  approvalsAgingData: ApprovalsAgingBuckets;
  leaveCalendarData: LeaveCalendarDay[];
}

async function fetchGraphBundle(params: EmployeeDashboardParams): Promise<EmployeeDashboardGraphBundle> {
  try {
    const [departmentHeadcount, approvalsAging, leaveCalendar] = await Promise.all([
      getEmployeeDashboardGraphDepartmentHeadcount(params),
      getEmployeeDashboardGraphApprovalsAging(params),
      getEmployeeDashboardLeaveCalendar(),
    ]);
    return {
      departmentHeadcountRows: parseDepartmentHeadcountApiRows(departmentHeadcount),
      approvalsAgingData: parseApprovalsAgingApi(approvalsAging),
      leaveCalendarData: parseLeaveCalendarApi(leaveCalendar),
    };
  } catch (e) {
    console.error("[EmployeesDashboard] fetchDashboardData error", e);
    return {
      departmentHeadcountRows: [],
      approvalsAgingData: {},
      leaveCalendarData: [],
    };
  }
}

export function useEmployeeDashboardGraphBundle(params: EmployeeDashboardParams) {
  const paramsKey = serializeEmployeeDashboardParamsKey(params);

  return useQuery({
    queryKey: workforceKeys.dashboard.graphBundle(paramsKey),
    queryFn: () => fetchGraphBundle(params),
  });
}
