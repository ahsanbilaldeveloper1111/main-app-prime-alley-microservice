import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getAttendanceBreakPolicies } from "@utils/staffManagement";

export type BreaksPoliciesQueryArgs = Readonly<{
  tenantId: string | null;
  page: number;
  limit: number;
  enabled?: boolean;
}>;

export function useBreaksPoliciesQuery(args: BreaksPoliciesQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendancePolicies.breaks({
      tenantId: tenantKey,
      page: args.page,
      limit: args.limit,
    }),
    queryFn: async () => {
      if (!tenantKey) {
        return { data: [], pagination: undefined };
      }
      return getAttendanceBreakPolicies({
        tenant_id: tenantKey,
        page: args.page,
        limit: args.limit,
      });
    },
    enabled: queryEnabled && Boolean(tenantKey),
    placeholderData: keepPreviousData,
  });
}
