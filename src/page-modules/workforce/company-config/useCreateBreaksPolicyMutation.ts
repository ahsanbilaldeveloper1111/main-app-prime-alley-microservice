import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildBreaksPolicyPayload,
  type BreaksPolicyFormState,
} from "@page-modules/workforce/company-config/breaksDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceBreakPolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateBreaksPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: BreaksPolicyFormState }) =>
      createAttendanceBreakPolicy(buildBreaksPolicyPayload(input.tenantId, input.form)),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: [
            ...workforceKeys.attendancePolicies.all(),
            "breaks",
            variables.tenantId,
          ],
        })
        .catch(() => undefined);
      toast.success("Break policy created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create break policy."));
    },
  });
}
