import { useMutation } from "@tanstack/react-query";

import { endCall } from "@utils/dialer";
import type { CtiCommandResponse, CtiEndCallParams } from "../types";

/**
 * Mutation hook for ending a call.
 *
 * SSE `DROPPED` / `DISCONNECTED` events will remove the call from
 * callStateMap; this hook only fires the command.
 */
export function useCtiEndCallMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiEndCallParams) =>
      endCall(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
