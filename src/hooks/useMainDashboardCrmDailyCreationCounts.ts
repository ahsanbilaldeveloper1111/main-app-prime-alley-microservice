import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { mainDashboardKeys } from "../query/keys";
import { getCrmDailyCreationCounts } from "@utils/mainDashboard";
import {
  getDefaultCrmActivityDateRange,
  type MainDashboardDateRange,
} from "@utils/mainDashboardDateRanges";

/** Fetches `/crm/daily-creation-counts` for the daily creation line chart. */
export function useMainDashboardCrmDailyCreationCounts(range: MainDashboardDateRange) {
  const { status } = useSession();
  const enabled =
    status === "authenticated" && Boolean(range.start_date) && Boolean(range.end_date);

  return useQuery({
    queryKey: mainDashboardKeys.crmDailyCreationCounts(range.start_date, range.end_date),
    queryFn: () => getCrmDailyCreationCounts(range),
    enabled,
  });
}

/** Last-30-days window aligned with Top activities by count. */
export function useMainDashboardCrmDailyCreationCountsDefault() {
  const range = useMemo(() => getDefaultCrmActivityDateRange(), []);
  return useMainDashboardCrmDailyCreationCounts(range);
}
