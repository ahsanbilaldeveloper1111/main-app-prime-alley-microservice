import { aiAnalyticsKeys } from "@query/keys";
import {
  listAnalysisMonthlyRollup,
  type AnalysisMonthlyRollupFilters,
} from "@utils/aiAnalytics";
import { useQuery } from "@tanstack/react-query";
export function useAnalysisMonthlyRollupQuery(
  appliedFilters: AnalysisMonthlyRollupFilters,
  enabled: boolean,
) {
  return useQuery({
    queryKey: aiAnalyticsKeys.costMonthly.list(appliedFilters),
    queryFn: () => listAnalysisMonthlyRollup(appliedFilters),
    enabled,
    staleTime: 60_000,
  });
}
