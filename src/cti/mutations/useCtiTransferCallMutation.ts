import { useMutation } from "@tanstack/react-query";

import { transferCalls } from "@utils/dialer";
import type { CtiCommandResponse, CtiTransferCallParams } from "../types";

/** Mutation hook for transferring a call (blind or attended). */
export function useCtiTransferCallMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiTransferCallParams) =>
      transferCalls(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
