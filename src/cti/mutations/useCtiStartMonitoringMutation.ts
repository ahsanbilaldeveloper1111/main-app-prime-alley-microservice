import { useMutation } from "@tanstack/react-query";

import { startMonitoring } from "@utils/dialer";
import type { CtiCommandResponse, CtiMonitoringParams } from "../types";

/** Mutation hook for starting silent / whisper monitoring (supervisor → agent). */
export function useCtiStartMonitoringMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiMonitoringParams) =>
      startMonitoring(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
