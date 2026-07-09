import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { BREAK_TYPE_DELETE_BLOCKED_MESSAGE } from "@page-modules/workforce/company-config/breakTypesDomain";
import { workforceKeys } from "@query/keys";
import { deleteAttendanceBreakType } from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

export function useDeleteBreakTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: number; tenantId: string }) =>
      deleteAttendanceBreakType(input.id, input.tenantId),
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.attendancePolicies.breakTypes(variables.tenantId),
        })
        .catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }).catch(() => undefined);
      toast.success("Break type deleted.");
    },
    onError: (error: unknown) => {
      const detail = getHttpApiErrorDetail(error, "Failed to delete break type.");
      toast.error(
        detail.toLowerCase().includes("existing records")
          ? BREAK_TYPE_DELETE_BLOCKED_MESSAGE
          : detail,
      );
    },
  });
}
