import { isValidMonthlyReportMonth } from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import { workforceKeys } from "@query/keys";
import { getEmployeeAttendanceReport } from "@utils/staffManagement";
import { useQuery } from "@tanstack/react-query";

export type UseEmployeeAttendanceReportQueryArgs = Readonly<{
  tenantId: string | null;
  userId: string | null;
  month: string;
  enabled?: boolean;
}>;

export function useEmployeeAttendanceReportQuery({
  tenantId,
  userId,
  month,
  enabled = true,
}: UseEmployeeAttendanceReportQueryArgs) {
  const resolvedTenantId = tenantId?.trim() ?? "";
  const resolvedUserId = userId?.trim() ?? "";
  const resolvedMonth = month.trim();
  const queryEnabled =
    enabled &&
    Boolean(resolvedTenantId) &&
    Boolean(resolvedUserId) &&
    isValidMonthlyReportMonth(resolvedMonth);

  return useQuery({
    queryKey: workforceKeys.attendance.employeeReport({
      tenantId: resolvedTenantId,
      userId: resolvedUserId,
      month: resolvedMonth,
    }),
    queryFn: () =>
      getEmployeeAttendanceReport({
        tenant_id: resolvedTenantId,
        user_id: resolvedUserId,
        month: resolvedMonth,
      }),
    enabled: queryEnabled,
  });
}
