import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import { deleteStaffShiftAssignment } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useDeleteShiftAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { assignmentId: number; tenantId: string }) =>
      deleteStaffShiftAssignment(input.assignmentId, input.tenantId),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: [...workforceKeys.shifts.all(), "assignments", variables.tenantId],
        })
        .catch(() => undefined);
      toast.success("Shift assignment deleted.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to delete shift assignment."));
    },
  });
}
