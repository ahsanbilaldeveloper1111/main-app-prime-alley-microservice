import { useQuery } from "@tanstack/react-query";
import { getAttendanceSettings } from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";

export function useAttendanceSettingsQuery(tenantId: string | null, enabled = true) {
  const tenantKey = tenantId?.trim() ?? "";
  return useQuery({
    queryKey: workforceKeys.attendance.settings(tenantKey),
    queryFn: () => getAttendanceSettings(tenantKey),
    enabled: enabled && Boolean(tenantKey),
  });
}
