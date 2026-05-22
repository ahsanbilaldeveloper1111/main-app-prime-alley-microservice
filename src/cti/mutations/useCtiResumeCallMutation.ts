import { useMutation } from "@tanstack/react-query";

import { resumeCall } from "@utils/dialer";
import type { CtiCommandResponse, CtiResumeCallParams } from "../types";

/** Mutation hook for resuming a held call. */
export function useCtiResumeCallMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiResumeCallParams) =>
      resumeCall(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
