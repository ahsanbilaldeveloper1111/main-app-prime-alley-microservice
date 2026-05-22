import { useMutation } from "@tanstack/react-query";

import { stopMonitoring } from "@utils/dialer";
import type { CtiCommandResponse, CtiStopMonitoringParams } from "../types";

/** Mutation hook for stopping an active monitoring session. */
export function useCtiStopMonitoringMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiStopMonitoringParams) =>
      stopMonitoring(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
