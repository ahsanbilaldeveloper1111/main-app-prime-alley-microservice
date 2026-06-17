import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildWorkHoursPolicyPayload,
  type WorkHoursPolicyFormState,
} from "@page-modules/workforce/company-config/companyConfigDomain";
import { workforceKeys } from "@query/keys";
import { updateAttendanceWorkHoursPolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useUpdateWorkHoursPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      policyId: number;
      tenantId: string;
      form: WorkHoursPolicyFormState;
    }) =>
      updateAttendanceWorkHoursPolicy(
        input.policyId,
        buildWorkHoursPolicyPayload(input.tenantId, input.form),
      ),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.attendancePolicies.all() })
        .catch(() => undefined);
      toast.success("Work hours policy updated.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to update work hours policy."));
    },
  });
}
