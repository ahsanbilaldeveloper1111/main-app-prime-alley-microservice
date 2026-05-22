import { useMutation } from "@tanstack/react-query";

import { attendCall } from "@utils/dialer";
import type { CtiAttendCallParams, CtiCommandResponse } from "../types";

/** Mutation hook for answering an incoming (ringing) call. */
export function useCtiAttendCallMutation(
  options?: {
    onSuccess?: (data: CtiCommandResponse) => void;
    onError?: (error: unknown) => void;
  },
) {
  return useMutation({
    mutationFn: (params: CtiAttendCallParams) =>
      attendCall(params) as Promise<CtiCommandResponse>,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
