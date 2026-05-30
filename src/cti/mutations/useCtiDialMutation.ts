import { useMutation } from "@tanstack/react-query";

import { makeCall } from "@utils/dialer";
import type { CtiDialParams, CtiCommandResponse } from "../types";

/**
 * Mutation hook for outbound dial.
 *
 * Fires POST /cti/dialCall and returns the server response.
 * Live call state is confirmed by the SSE stream — do not update callStateMap
 * here; wait for the RINGING / CONNECTED events.
 */
export function useCtiDialMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiDialParams) =>
      makeCall(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
