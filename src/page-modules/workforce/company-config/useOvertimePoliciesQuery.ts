import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getAttendanceOvertimePolicies } from "@utils/staffManagement";

export type OvertimePoliciesQueryArgs = Readonly<{
  tenantId: string | null;
  page: number;
  limit: number;
  enabled?: boolean;
}>;

export function useOvertimePoliciesQuery(args: OvertimePoliciesQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendancePolicies.overtime({
      tenantId: tenantKey,
      page: args.page,
      limit: args.limit,
    }),
    queryFn: async () => {
      if (!tenantKey) {
        return { data: [], pagination: undefined };
      }
      return getAttendanceOvertimePolicies({
        tenant_id: tenantKey,
        page: args.page,
        limit: args.limit,
      });
    },
    enabled: queryEnabled && Boolean(tenantKey),
    placeholderData: keepPreviousData,
  });
}
