import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateStaffShiftPayload,
  type CreateStaffShiftFormState,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import { workforceKeys } from "@query/keys";
import { createStaffShift } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateStaffShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      tenantIds: readonly string[];
      form: CreateStaffShiftFormState;
    }) => {
      const results = [];
      for (const tenantId of input.tenantIds) {
        const payload = buildCreateStaffShiftPayload(tenantId, input.form);
        results.push(await createStaffShift(payload));
      }
      return results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workforceKeys.shifts.all() }).catch(() => undefined);
      const count = variables.tenantIds.length;
      toast.success(count === 1 ? "Shift created." : `${count} shifts created.`);
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create shift."));
    },
  });
}
