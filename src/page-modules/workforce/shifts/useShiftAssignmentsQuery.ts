import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getStaffShiftAssignments } from "@utils/staffManagement";

export type ShiftAssignmentsQueryArgs = Readonly<{
  tenantId: string | null;
  page: number;
  limit: number;
  enabled?: boolean;
}>;

export function useShiftAssignmentsQuery(args: ShiftAssignmentsQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.shifts.assignments({
      tenantId: tenantKey,
      page: args.page,
      limit: args.limit,
    }),
    queryFn: async () => {
      if (!tenantKey) {
        return { data: [], pagination: undefined };
      }
      return getStaffShiftAssignments({
        tenant_id: tenantKey,
        page: args.page,
        limit: args.limit,
      });
    },
    enabled: queryEnabled && Boolean(tenantKey),
    placeholderData: keepPreviousData,
  });
}
