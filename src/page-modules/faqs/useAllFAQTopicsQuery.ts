import { useQuery } from "@tanstack/react-query";
import { getAllFAQTopics } from "@utils/faqs";
import { faqsKeys } from "@query/keys";

export function useAllFAQTopicsQuery(enabled = true) {
  return useQuery({
    queryKey: faqsKeys.topics.allTopics(),
    queryFn: () => getAllFAQTopics(),
    enabled,
    staleTime: 60_000,
  });
}
