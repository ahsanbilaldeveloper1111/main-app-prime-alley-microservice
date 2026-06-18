import { useQuery } from "@tanstack/react-query";
import { getMyAttendance, type MyAttendanceData } from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";

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
  });
}
