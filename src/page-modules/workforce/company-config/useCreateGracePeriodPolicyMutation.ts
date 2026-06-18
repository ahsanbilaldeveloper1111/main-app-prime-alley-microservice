import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildGracePeriodPolicyPayload,
  type GracePeriodPolicyFormState,
} from "@page-modules/workforce/company-config/gracePeriodDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceGracePeriodPolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateGracePeriodPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: GracePeriodPolicyFormState }) =>
      createAttendanceGracePeriodPolicy(buildGracePeriodPolicyPayload(input.tenantId, input.form)),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.attendancePolicies.gracePeriod(variables.tenantId),
        })
        .catch(() => undefined);
      toast.success("Grace period policy saved.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to save grace period policy."));
    },
  });
}
