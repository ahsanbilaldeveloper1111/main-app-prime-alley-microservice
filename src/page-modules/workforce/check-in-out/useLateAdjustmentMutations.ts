/** Late adjustment feature disabled — uncomment the block below to re-enable. */

/*
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";
import {
  approveLateAdjustmentRequest,
  rejectLateAdjustmentRequest,
  submitLateAdjustmentRequest,
  type LateAdjustmentDecisionPayload,
  type SubmitLateAdjustmentPayload,
} from "@utils/staffManagement";
import { getHttpApiErrorDetail } from "@utils/errors";

function invalidateLateAdjustmentReads(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }),
    queryClient.invalidateQueries({
      queryKey: workforceKeys.attendance.lateAdjustment({
        tenantId,
        status: "pending",
        userId: "",
      }),
      exact: false,
    }),
  ]);
}

export function useSubmitLateAdjustmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitLateAdjustmentPayload) => submitLateAdjustmentRequest(payload),
    onSuccess: async (_data, variables) => {
      await invalidateLateAdjustmentReads(queryClient, variables.tenant_id);
      toast.success("Late adjustment request submitted.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to submit late adjustment request."));
    },
  });
}

export function useApproveLateAdjustmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: LateAdjustmentDecisionPayload }) =>
      approveLateAdjustmentRequest(input.id, input.payload),
    onSuccess: async (_data, variables) => {
      await invalidateLateAdjustmentReads(queryClient, variables.payload.tenant_id);
      toast.success("Late adjustment request approved.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to approve late adjustment request."));
    },
  });
}

export function useRejectLateAdjustmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: LateAdjustmentDecisionPayload }) =>
      rejectLateAdjustmentRequest(input.id, input.payload),
    onSuccess: async (_data, variables) => {
      await invalidateLateAdjustmentReads(queryClient, variables.payload.tenant_id);
      toast.info("Late adjustment request rejected.");
    },
    onError: (error: unknown) => {
      toast.error(getHttpApiErrorDetail(error, "Failed to reject late adjustment request."));
    },
  });
}
*/
