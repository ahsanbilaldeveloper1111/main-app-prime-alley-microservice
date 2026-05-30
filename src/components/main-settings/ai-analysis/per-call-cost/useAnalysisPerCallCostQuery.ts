import { aiAnalyticsKeys } from "@query/keys";
import {
  listAnalysisPerCallCosts,
  type AnalysisPerCallCostFilters,
} from "@utils/aiAnalytics";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAnalysisPerCallCostQuery(
  appliedFilters: AnalysisPerCallCostFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: aiAnalyticsKeys.costCalls.list(appliedFilters),
    queryFn: () => listAnalysisPerCallCosts(appliedFilters),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
