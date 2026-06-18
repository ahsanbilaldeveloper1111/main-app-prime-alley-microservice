import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  buildWorkHoursPolicyPayload,
  type WorkHoursPolicyFormState,
} from "@page-modules/workforce/company-config/companyConfigDomain";
import { workforceKeys } from "@query/keys";
import { createAttendanceWorkHoursPolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useCreateWorkHoursPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tenantId: string; form: WorkHoursPolicyFormState }) =>
      createAttendanceWorkHoursPolicy(buildWorkHoursPolicyPayload(input.tenantId, input.form)),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.attendancePolicies.all() })
        .catch(() => undefined);
      toast.success("Work hours policy created.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to create work hours policy."));
    },
  });
}
