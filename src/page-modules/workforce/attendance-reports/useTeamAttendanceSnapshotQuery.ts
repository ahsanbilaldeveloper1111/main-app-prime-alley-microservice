import { workforceKeys } from "@query/keys";
import { serializeDailyReportExtensionsKey } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import {
  getTeamAttendanceSnapshot,
  type TeamAttendanceSnapshotStatusFilter,
} from "@utils/staffManagement";
import { useQuery } from "@tanstack/react-query";

export type TeamAttendanceSnapshotQueryArgs = Readonly<{
  tenantId: string | null;
  date: string;
  departmentId?: number | null;
  extensions: readonly string[];
  status: TeamAttendanceSnapshotStatusFilter;
  search: string;
  managerId?: string | null;
  enabled?: boolean;
}>;

export function useTeamAttendanceSnapshotQuery(args: TeamAttendanceSnapshotQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const dateKey = args.date.trim();
  const departmentKey =
    args.departmentId != null && Number.isFinite(args.departmentId)
      ? String(args.departmentId)
      : "";
  const extensionsKey = serializeDailyReportExtensionsKey(args.extensions);
  const statusKey = args.status;
  const searchKey = args.search.trim();
  const managerKey = args.managerId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendance.teamSnapshot({
      tenantId: tenantKey,
      date: dateKey,
      departmentId: departmentKey,
      extensionsKey,
      status: statusKey,
      search: searchKey,
      managerId: managerKey,
    }),
    queryFn: async () => {
      if (!tenantKey || !dateKey) {
        return { date: null, summary: {}, employees: [] };
      }

      return getTeamAttendanceSnapshot({
        tenant_id: tenantKey,
        date: dateKey,
        status: statusKey,
        ...(searchKey ? { search: searchKey } : {}),
        ...(managerKey ? { manager_id: managerKey } : {}),
        ...(args.departmentId != null && Number.isFinite(args.departmentId)
          ? { department_id: args.departmentId }
          : {}),
        ...(args.extensions.length > 0 ? { extensions: args.extensions } : {}),
      });
    },
    enabled: queryEnabled && Boolean(tenantKey) && Boolean(dateKey),
  });
}
