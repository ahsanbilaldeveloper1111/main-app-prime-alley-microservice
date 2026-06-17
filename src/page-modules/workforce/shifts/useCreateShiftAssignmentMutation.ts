import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildShiftAssignmentPayload,
  type ShiftAssignmentFormState,
} from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import { workforceKeys } from "@query/keys";
import { createStaffShiftAssignment } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

function invalidateShiftAssignments(queryClient: ReturnType<typeof useQueryClient>, tenantId: string) {
  return queryClient
    .invalidateQueries({
      queryKey: [...workforceKeys.shifts.all(), "assignments", tenantId],
    })
    .catch(() => undefined);
}

export function useCreateShiftAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: ShiftAssignmentFormState }) =>
      createStaffShiftAssignment(buildShiftAssignmentPayload(input.tenantId, input.form)),
    onSuccess: (_data, variables) => {
      void invalidateShiftAssignments(queryClient, variables.tenantId);
      toast.success("Shift assignment created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create shift assignment."));
    },
  });
}
