import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { isValidMonthlyReportMonth } from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import { getMonthlyAttendanceReport, type MonthlyAttendanceReportResult } from "@utils/staffManagement";

const EMPTY_MONTHLY_REPORT: MonthlyAttendanceReportResult = {
  month: null,
  summary: {},
  employees: [],
  trend: [],
};

export type MonthlyAttendanceReportQueryArgs = Readonly<{
  tenantId: string | null;
  month: string;
  departmentId: number | null;
  enabled?: boolean;
}>;

export function useMonthlyAttendanceReportQuery(args: MonthlyAttendanceReportQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const monthKey = args.month.trim();
  const departmentKey =
    args.departmentId != null && Number.isFinite(args.departmentId)
      ? String(args.departmentId)
      : "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendance.monthlyReport({
      tenantId: tenantKey,
      month: monthKey,
      departmentId: departmentKey,
    }),
    queryFn: async () => {
      if (!tenantKey || !monthKey || !isValidMonthlyReportMonth(monthKey)) {
        return EMPTY_MONTHLY_REPORT;
      }
      return getMonthlyAttendanceReport({
        tenant_id: tenantKey,
        month: monthKey,
        ...(args.departmentId != null && Number.isFinite(args.departmentId)
          ? { department_id: args.departmentId }
          : {}),
      });
    },
    enabled: queryEnabled && Boolean(tenantKey) && isValidMonthlyReportMonth(monthKey),
  });
}
