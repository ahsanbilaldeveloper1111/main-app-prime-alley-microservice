import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getAttendanceBreakTypes } from "@utils/staffManagement";

export type BreakTypesQueryArgs = Readonly<{
  tenantId: string | null;
  enabled?: boolean;
}>;

export function useBreakTypesQuery(args: BreakTypesQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendancePolicies.breakTypes(tenantKey),
    queryFn: async () => {
      if (!tenantKey) {
        return { data: [], pagination: undefined };
      }
      return getAttendanceBreakTypes(tenantKey);
    },
    enabled: queryEnabled && Boolean(tenantKey),
  });
}
