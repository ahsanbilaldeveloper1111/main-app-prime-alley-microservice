import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateBreakTypePayload,
  type BreakTypeFormState,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import { workforceKeys } from "@query/keys";
import { updateAttendanceBreakType } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateBreakTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: number; tenantId: string; form: BreakTypeFormState }) => {
      const { tenant_id, ...payload } = buildCreateBreakTypePayload(input.tenantId, input.form);
      return updateAttendanceBreakType(input.id, { tenant_id, ...payload });
    },
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.attendancePolicies.breakTypes(variables.tenantId),
        })
        .catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }).catch(() => undefined);
      toast.success("Break type updated.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to update break type."));
    },
  });
}
