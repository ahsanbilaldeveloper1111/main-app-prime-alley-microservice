import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { mainDashboardKeys } from "../query/keys";
import { fetchCrmCreatedCountsBundle } from "@utils/mainDashboard";
import { getDefaultCrmActivityDateRange } from "@utils/mainDashboardDateRanges";

/** Last-30-days CRM created-counts for Top activities by count. */
export function useMainDashboardCrmCreatedCounts() {
  const { status } = useSession();
  const range = useMemo(() => getDefaultCrmActivityDateRange(), []);

  const enabled =
    status === "authenticated" && Boolean(range.start_date) && Boolean(range.end_date);

  return useQuery({
    queryKey: mainDashboardKeys.crmCreatedCounts(range.start_date, range.end_date),
    queryFn: () => fetchCrmCreatedCountsBundle(range),
    enabled,
  });
}
