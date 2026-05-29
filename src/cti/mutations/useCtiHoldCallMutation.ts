import { useMutation } from "@tanstack/react-query";

import { holdCall } from "@utils/dialer";
import type { CtiCommandResponse, CtiHoldCallParams } from "../types";

/** Mutation hook for placing a call on hold. */
export function useCtiHoldCallMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiHoldCallParams) =>
      holdCall(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
