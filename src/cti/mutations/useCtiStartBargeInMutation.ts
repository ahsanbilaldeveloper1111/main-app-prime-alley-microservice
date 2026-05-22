import { useMutation } from "@tanstack/react-query";

import { startBargeInMonitoring } from "@utils/dialer";
import type { CtiBargeInParams, CtiCommandResponse } from "../types";

/** Mutation hook for escalating a monitoring session to barge-in. */
export function useCtiStartBargeInMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiBargeInParams) =>
      startBargeInMonitoring(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
