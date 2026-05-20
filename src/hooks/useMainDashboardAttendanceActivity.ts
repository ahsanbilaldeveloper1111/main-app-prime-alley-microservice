import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { mainDashboardKeys } from "../query/keys";
import { fetchMainDashboardAttendanceActivity } from "@utils/mainDashboard";
import type { MainDashboardDateRange } from "@utils/mainDashboardDateRanges";

export function useMainDashboardAttendanceActivity(range: MainDashboardDateRange) {
  const { status } = useSession();
  const enabled =
    status === "authenticated" && Boolean(range.start_date) && Boolean(range.end_date);

  return useQuery({
    queryKey: mainDashboardKeys.attendanceActivity(range.start_date, range.end_date),
    queryFn: () => fetchMainDashboardAttendanceActivity(range),
    enabled,
  });
}
