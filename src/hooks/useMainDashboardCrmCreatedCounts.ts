import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { mainDashboardKeys } from "../query/keys";
import { fetchCrmCreatedCountsMineBundle } from "@utils/mainDashboard";
import { getDefaultCrmActivityDateRange } from "@utils/mainDashboardDateRanges";

/** Last-30-days CRM created-counts (/mine) for Top activities by count. */
export function useMainDashboardCrmCreatedCounts() {
  const { status } = useSession();
  const range = useMemo(() => getDefaultCrmActivityDateRange(), []);

  const enabled =
    status === "authenticated" && Boolean(range.start_date) && Boolean(range.end_date);

  return useQuery({
    queryKey: mainDashboardKeys.crmCreatedCountsMine(range.start_date, range.end_date),
    queryFn: () => fetchCrmCreatedCountsMineBundle(range),
    enabled,
  });
}
