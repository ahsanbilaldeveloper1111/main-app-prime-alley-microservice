import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildCreateBreakTypePayload,
  type CreateBreakTypeFormState,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceBreakType } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateBreakTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: CreateBreakTypeFormState }) =>
      createAttendanceBreakType(buildCreateBreakTypePayload(input.tenantId, input.form)),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.attendancePolicies.breakTypes(variables.tenantId),
        })
        .catch(() => undefined);
      toast.success("Break type created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create break type."));
    },
  });
}
