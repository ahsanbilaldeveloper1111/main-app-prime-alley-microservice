import { consumeHandledAttendanceError } from "@page-modules/workforce/attendance/attendanceDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceCorrection, type AttendanceCorrectionPayload } from "@utils/staffManagement";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAttendanceCorrectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceCorrectionPayload) => createAttendanceCorrection(payload),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.attendance.all() })
        .catch((error: unknown) => {
          consumeHandledAttendanceError(error, "AttendanceCorrection.invalidateReads");
        });
    },
  });
}
