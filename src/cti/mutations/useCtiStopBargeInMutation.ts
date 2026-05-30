import { useMutation } from "@tanstack/react-query";

import { stopBargeInMonitoring } from "@utils/dialer";
import type { CtiCommandResponse, CtiStopBargeInParams } from "../types";

/** Mutation hook for stopping a barge-in session. */
export function useCtiStopBargeInMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiStopBargeInParams) =>
      stopBargeInMonitoring(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
