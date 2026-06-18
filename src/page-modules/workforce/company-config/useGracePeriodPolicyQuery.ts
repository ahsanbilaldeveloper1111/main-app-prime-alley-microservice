import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getAttendanceGracePeriodPolicy } from "@utils/staffManagement";

export type GracePeriodPolicyQueryArgs = Readonly<{
  tenantId: string | null;
  enabled?: boolean;
}>;

export function useGracePeriodPolicyQuery(args: GracePeriodPolicyQueryArgs) {
  const tenantKey = args.tenantId?.trim() ?? "";
  const queryEnabled = args.enabled ?? true;

  return useQuery({
    queryKey: workforceKeys.attendancePolicies.gracePeriod(tenantKey),
    queryFn: async () => {
      if (!tenantKey) {
        return null;
      }
      return getAttendanceGracePeriodPolicy(tenantKey);
    },
    enabled: queryEnabled && Boolean(tenantKey),
  });
}
