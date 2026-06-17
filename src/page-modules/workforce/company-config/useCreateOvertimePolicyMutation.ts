import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildOvertimePolicyPayload,
  type OvertimePolicyFormState,
} from "@page-modules/workforce/company-config/overtimeDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceOvertimePolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateOvertimePolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: OvertimePolicyFormState }) =>
      createAttendanceOvertimePolicy(buildOvertimePolicyPayload(input.tenantId, input.form)),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: [
            ...workforceKeys.attendancePolicies.all(),
            "overtime",
            variables.tenantId,
          ],
        })
        .catch(() => undefined);
      toast.success("Overtime policy created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create overtime policy."));
    },
  });
}
