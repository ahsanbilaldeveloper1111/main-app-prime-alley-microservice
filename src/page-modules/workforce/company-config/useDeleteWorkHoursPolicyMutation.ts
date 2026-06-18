import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import { deleteAttendanceWorkHoursPolicy } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useDeleteWorkHoursPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { policyId: number; tenantId: string }) =>
      deleteAttendanceWorkHoursPolicy(input.policyId, input.tenantId),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.attendancePolicies.all() })
        .catch(() => undefined);
      toast.success("Work hours policy deleted.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to delete work hours policy."));
    },
  });
}
