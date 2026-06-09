import { aiAnalyticsKeys } from "@query/keys";
import {
  AnalysisCompanyConfigValidationError,
  updateAnalysisCompanyConfig,
  type AnalysisCompanyConfigSaveResult,
} from "@utils/aiAnalytics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { mapFormValuesToCompanyConfigUpdate } from "./mapCompanyConfig";
import type { ConfigAuthoringFormValues } from "./types";

export function useUpdateAnalysisCompanyConfigMutation(appliedCompanyId: string) {
  const queryClient = useQueryClient();
  const companyId = appliedCompanyId.trim();

  return useMutation({
    mutationFn: async (values: ConfigAuthoringFormValues) => {
      if (!companyId) {
        throw new Error("Please select a company first");
      }
      const payload = mapFormValuesToCompanyConfigUpdate(values);
      return updateAnalysisCompanyConfig(companyId, payload);
    },
    onSuccess: (data: AnalysisCompanyConfigSaveResult) => {
      queryClient.setQueryData(
        aiAnalyticsKeys.companyConfig.detail(companyId),
        data.config,
      );
      queryClient
        .invalidateQueries({ queryKey: aiAnalyticsKeys.companyConfig.all() })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: aiAnalyticsKeys.tenants.detail(companyId) })
        .catch(() => undefined);

      if (data.warnings.length > 0) {
        toast.warn(
          `Config saved with ${data.warnings.length} warning(s). Review the issues list below.`,
        );
      } else {
        toast.success("Company config saved.");
      }
    },
    onError: (error: unknown) => {
      if (error instanceof AnalysisCompanyConfigValidationError) {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Failed to save company config.";
      toast.error(message);
    },
  });
}
