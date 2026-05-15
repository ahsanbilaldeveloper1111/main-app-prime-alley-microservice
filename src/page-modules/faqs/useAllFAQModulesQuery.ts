import { useQuery } from "@tanstack/react-query";
import { getAllFAQModules } from "@utils/faqs";
import { faqsKeys } from "@query/keys";

export function useAllFAQModulesQuery(enabled: boolean) {
  return useQuery({
    queryKey: faqsKeys.modules.picker(),
    queryFn: () => getAllFAQModules(),
    enabled,
    staleTime: 60_000,
  });
}
