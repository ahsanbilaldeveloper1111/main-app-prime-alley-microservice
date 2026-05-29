import { aiAnalyticsKeys } from "@query/keys";
import { updateAnalysisCostPricing } from "@utils/aiAnalytics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { mapFormValuesToAnalysisPricingUpdate } from "./mapAnalysisPricing";
import type { AnalysisPricingFormValues } from "./types";

export function useUpdateAnalysisPricingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AnalysisPricingFormValues) => {
      const payload = mapFormValuesToAnalysisPricingUpdate(values);
      return updateAnalysisCostPricing(payload);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(aiAnalyticsKeys.costPricing.detail(), data);
      queryClient
        .invalidateQueries({ queryKey: aiAnalyticsKeys.costPricing.all() })
        .catch(() => undefined);
      toast.success("Analysis pricing saved.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save analysis pricing.";
      toast.error(message);
    },
  });
}
