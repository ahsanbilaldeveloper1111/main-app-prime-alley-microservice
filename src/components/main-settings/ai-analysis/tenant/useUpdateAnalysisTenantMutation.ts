import { aiAnalyticsKeys } from "@query/keys";
import { updateAnalysisTenant } from "@utils/aiAnalytics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { mapFormValuesToAnalysisTenantUpdate } from "./mapAnalysisTenant";
import type { AnalysisTenantFormValues } from "./types";

export function useUpdateAnalysisTenantMutation(appliedTenantId: string) {
  const queryClient = useQueryClient();
  const tenantId = appliedTenantId.trim();

  return useMutation({
    mutationFn: async (values: AnalysisTenantFormValues) => {
      if (!tenantId) {
        throw new Error("Please select a tenant first");
      }
      const original =
        queryClient.getQueryData(
          aiAnalyticsKeys.tenants.detail(tenantId),
        ) ?? null;
      const payload = mapFormValuesToAnalysisTenantUpdate(values, original);
      if (Object.keys(payload).length === 0) {
        throw new Error("No changes to save.");
      }
      return updateAnalysisTenant(tenantId, payload);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(aiAnalyticsKeys.tenants.detail(tenantId), data);
      queryClient
        .invalidateQueries({ queryKey: aiAnalyticsKeys.tenants.all() })
        .catch(() => undefined);
      toast.success("Analysis tenant settings saved.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save analysis tenant settings.";
      toast.error(message);
    },
  });
}
