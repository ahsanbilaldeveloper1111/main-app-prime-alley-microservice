import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateStaffShiftPayload,
  type CreateStaffShiftFormState,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import { workforceKeys } from "@query/keys";
import { updateStaffShift } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateStaffShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      shiftId: number;
      tenantId: string;
      form: CreateStaffShiftFormState;
    }) => {
      const payload = buildCreateStaffShiftPayload(input.tenantId, input.form);
      return updateStaffShift(input.shiftId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workforceKeys.shifts.all() }).catch(() => undefined);
      toast.success("Shift updated.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to update shift."));
    },
  });
}
