import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildAttendanceSettingsPayload,
  type AttendanceSettingsFormState,
} from "@page-modules/workforce/company-config/attendanceSettingsDomain";
import { workforceKeys } from "@query/keys";
import { updateAttendanceSettings } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateAttendanceSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: AttendanceSettingsFormState }) =>
      updateAttendanceSettings(buildAttendanceSettingsPayload(input.tenantId, input.form)),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workforceKeys.attendance.settings(variables.tenantId),
        }),
        queryClient.invalidateQueries({
          queryKey: workforceKeys.attendancePolicies.breakTypes(variables.tenantId),
        }),
        queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }),
      ]);
      toast.success("Attendance settings saved.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to save attendance settings."));
    },
  });
}
