import { useQuery } from "@tanstack/react-query";
import { getMyAttendance, type MyAttendanceData } from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";
import { shouldPollMyAttendance } from "@page-modules/workforce/check-in-out/checkInOutDomain";

const MY_ATTENDANCE_POLL_INTERVAL_MS = 60_000;

async function fetchMyAttendanceSafe(): Promise<MyAttendanceData | null> {
  try {
    return await getMyAttendance();
  } catch (err) {
    console.error("[CheckInOut] Failed to load my attendance", err);
    return null;
  }
}

export function useMyAttendanceQuery() {
  return useQuery({
    queryKey: workforceKeys.attendance.my(),
    queryFn: fetchMyAttendanceSafe,
    refetchInterval: (query) =>
      shouldPollMyAttendance(query.state.data ?? null) ? MY_ATTENDANCE_POLL_INTERVAL_MS : false,
  });
}
