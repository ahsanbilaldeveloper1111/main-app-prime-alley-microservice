import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import { deleteStaffShift } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useDeleteStaffShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { shiftId: number; tenantId: string }) =>
      deleteStaffShift(input.shiftId, input.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workforceKeys.shifts.all() }).catch(() => undefined);
      toast.success("Shift deleted.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to delete shift."));
    },
  });
}
