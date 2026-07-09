/** Late adjustment feature disabled — uncomment the block below to re-enable. */

/*
import { useQuery } from "@tanstack/react-query";
import { getLateAdjustmentRequests } from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";

export type UseLateAdjustmentRequestsQueryArgs = Readonly<{
  tenantId: string | null;
  userId?: string | null;
  status?: string;
  enabled?: boolean;
}>;

export function useLateAdjustmentRequestsQuery(args: UseLateAdjustmentRequestsQueryArgs) {
  const tenantId = args.tenantId?.trim() ?? "";
  const userId = args.userId?.trim() ?? "";
  const status = args.status?.trim() || "pending";

  return useQuery({
    queryKey: workforceKeys.attendance.lateAdjustment({
      tenantId,
      status,
      userId,
    }),
    queryFn: () =>
      getLateAdjustmentRequests({
        tenant_id: tenantId,
        status,
        ...(userId ? { user_id: userId } : {}),
      }),
    enabled: Boolean(args.enabled !== false && tenantId),
  });
}
*/
