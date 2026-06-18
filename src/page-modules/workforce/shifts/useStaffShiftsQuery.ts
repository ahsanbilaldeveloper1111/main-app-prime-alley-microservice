import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getStaffShifts } from "@utils/staffManagement";

const SHIFTS_QUERY_STALE_MS = 60_000;
const SHIFTS_QUERY_GC_MS = 30 * 60 * 1000;

export type StaffShiftsQueryArgs = Readonly<{
  tenantId: string | null;
  status: string;
  type?: string;
  page: number;
  limit: number;
  /** When false, defers the fetch until tenant context is ready (e.g. admin company list). */
  enabled?: boolean;
}>;

export function useStaffShiftsQuery(args: StaffShiftsQueryArgs) {
  const typeKey = (args.type ?? "").trim();
  const tenantReady = args.enabled ?? true;
  const tenantId = args.tenantId?.trim() ?? "";

  return useQuery({
    queryKey: workforceKeys.shifts.list({
      tenantId,
      status: args.status,
      type: typeKey,
      page: args.page,
      limit: args.limit,
    }),
    queryFn: async () => {
      if (!tenantId) {
        return { data: [], pagination: undefined };
      }
      return getStaffShifts({
        tenant_id: tenantId,
        status: args.status,
        ...(typeKey ? { type: typeKey } : {}),
        limit: args.limit,
        page: args.page,
      });
    },
    enabled: tenantReady && Boolean(tenantId),
    placeholderData: keepPreviousData,
    staleTime: SHIFTS_QUERY_STALE_MS,
    gcTime: SHIFTS_QUERY_GC_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
