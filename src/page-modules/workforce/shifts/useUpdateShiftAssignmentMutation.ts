import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildShiftAssignmentPayload,
  type ShiftAssignmentFormState,
} from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import { workforceKeys } from "@query/keys";
import { updateStaffShiftAssignment } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateShiftAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      assignmentId: number;
      tenantId: string;
      form: ShiftAssignmentFormState;
    }) =>
      updateStaffShiftAssignment(
        input.assignmentId,
        buildShiftAssignmentPayload(input.tenantId, input.form),
      ),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: [...workforceKeys.shifts.all(), "assignments", variables.tenantId],
        })
        .catch(() => undefined);
      toast.success("Shift assignment updated.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to update shift assignment."));
    },
  });
}
