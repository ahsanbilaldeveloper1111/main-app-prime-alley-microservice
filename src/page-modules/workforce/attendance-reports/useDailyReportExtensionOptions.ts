import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import {
  buildDailyReportUserOptions,
  normalizeDailyReportUsers,
} from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import { getMainAppUsers } from "@utils/staffManagement";

export type DailyReportExtensionOptionsArgs = Readonly<{
  companyIdentifier: string | null;
  departmentId: number | null;
  fallbackUsers: ReadonlyArray<{ name: string; phone: string; department_id?: number | null }>;
  enabled?: boolean;
}>;

export function useDailyReportExtensionOptions(args: DailyReportExtensionOptionsArgs) {
  const companyKey = args.companyIdentifier?.trim() ?? "";
  const departmentKey =
    args.departmentId != null && Number.isFinite(args.departmentId)
      ? String(args.departmentId)
      : "all";
  const queryEnabled = args.enabled ?? true;

  const departmentScopedQuery = useQuery({
    queryKey: workforceKeys.attendance.dailyReportExtensions({
      companyIdentifier: companyKey,
      departmentId: departmentKey,
    }),
    queryFn: async () => {
      const usersRaw = await getMainAppUsers(companyKey, {
        department_id: args.departmentId ?? undefined,
      });
      return normalizeDailyReportUsers(usersRaw);
    },
    enabled:
      queryEnabled &&
      Boolean(companyKey) &&
      args.departmentId != null &&
      Number.isFinite(args.departmentId),
  });

  const users =
    args.departmentId != null && Number.isFinite(args.departmentId)
      ? (departmentScopedQuery.data ?? [])
      : [...args.fallbackUsers];

  const options = buildDailyReportUserOptions(users, args.departmentId);
  const loading =
    args.departmentId != null &&
    Number.isFinite(args.departmentId) &&
    departmentScopedQuery.isFetching;

  return {
    extensionOptions: options,
    extensionsLoading: loading,
  };
}
