import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { serializeDailyReportExtensionsKey } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import { getDailyAttendanceReport } from "@utils/staffManagement";

export type DailyAttendanceReportQueryArgs = Readonly<{
  tenantId: string | null;
  date: string;
  departmentId: number | null;
  extensions: readonly string[];
  enabled?: boolean;
}>;

export function useDailyAttendanceReportQuery(args: DailyAttendanceReportQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const dateKey = args.date.trim();
  const departmentKey =
    args.departmentId != null && Number.isFinite(args.departmentId)
      ? String(args.departmentId)
      : "";
  const extensionsKey = serializeDailyReportExtensionsKey(args.extensions);
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendance.dailyReport({
      tenantId: tenantKey,
      date: dateKey,
      departmentId: departmentKey,
      extensionsKey,
    }),
    queryFn: async () => {
      if (!tenantKey || !dateKey) {
        return { data: [], pagination: undefined };
      }
      return getDailyAttendanceReport({
        tenant_id: tenantKey,
        date: dateKey,
        ...(args.departmentId != null && Number.isFinite(args.departmentId)
          ? { department_id: args.departmentId }
          : {}),
        ...(args.extensions.length > 0 ? { extensions: args.extensions } : {}),
      });
    },
    enabled: queryEnabled && Boolean(tenantKey) && Boolean(dateKey),
  });
}
