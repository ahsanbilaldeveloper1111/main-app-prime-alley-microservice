import { useMutation } from "@tanstack/react-query";

import { mergeCalls } from "@utils/dialer";
import type { CtiCommandResponse, CtiMergeCallsParams } from "../types";

/** Mutation hook for merging two call legs into a conference. */
export function useCtiMergeCallsMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiMergeCallsParams) =>
      mergeCalls(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
