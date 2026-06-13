import { aiAnalyticsKeys } from "@query/keys";
import {
  getAnalysisCompanyConfig,
  type AnalysisCompanyConfigRecord,
} from "@utils/aiAnalytics";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { mapCompanyConfigToFormValues } from "./mapCompanyConfig";

export function useAnalysisCompanyConfigQuery(
  appliedCompanyId: string,
  fallbackAuthor = "",
  enabled = true,
) {
  const { status: sessionStatus } = useSession();
  const companyId = appliedCompanyId.trim();
  const authorFallback = fallbackAuthor.trim();

  const query = useQuery<AnalysisCompanyConfigRecord | null>({
    queryKey: aiAnalyticsKeys.companyConfig.detail(companyId),
    queryFn: () => getAnalysisCompanyConfig(companyId),
    enabled:
      enabled && sessionStatus === "authenticated" && Boolean(companyId),
    staleTime: 60_000,
  });

  const formValues = useMemo(
    () => mapCompanyConfigToFormValues(query.data, authorFallback),
    [query.data, query.dataUpdatedAt, authorFallback],
  );

  return {
    ...query,
    companyId,
    formValues,
    updatedAt: query.data?.updated_at ?? null,
    hasApiData: query.data != null,
  };
}
