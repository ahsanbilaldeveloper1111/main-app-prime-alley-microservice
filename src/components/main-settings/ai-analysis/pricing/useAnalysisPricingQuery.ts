import { aiAnalyticsKeys } from "@query/keys";
import { getAnalysisCostPricing } from "@utils/aiAnalytics";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { mapAnalysisPricingToFormValues } from "./mapAnalysisPricing";

export function useAnalysisPricingQuery(appliedTenantId: string) {
  const { status: sessionStatus } = useSession();
  const tenantId = appliedTenantId.trim();

  const query = useQuery({
    queryKey: aiAnalyticsKeys.costPricing.detail(tenantId),
    queryFn: () => getAnalysisCostPricing(tenantId),
    enabled: sessionStatus === "authenticated" && Boolean(tenantId),
    staleTime: 60_000,
  });

  const formValues = useMemo(
    () => mapAnalysisPricingToFormValues(query.data),
    [query.data, query.dataUpdatedAt],
  );

  return {
    ...query,
    tenantId,
    formValues,
    updatedAt: query.data?.updated_at ?? null,
    hasApiData: query.data != null,
  };
}
