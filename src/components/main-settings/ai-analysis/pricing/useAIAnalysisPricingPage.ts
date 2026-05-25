import { useAnalysisPricingQuery } from "./useAnalysisPricingQuery";
import { useUpdateAnalysisPricingMutation } from "./useUpdateAnalysisPricingMutation";

export function useAIAnalysisPricingPage() {
  const pricingQuery = useAnalysisPricingQuery();
  const saveMutation = useUpdateAnalysisPricingMutation();

  return {
    pricingQuery,
    saveMutation,
  };
}
