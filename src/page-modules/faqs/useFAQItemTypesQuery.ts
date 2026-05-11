import { useQuery } from "@tanstack/react-query";
import { getFAQTypes } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";

export function useFAQItemTypesQuery(topicId: number | null) {
  return useQuery({
    queryKey: faqsKeys.itemTypes.byTopic(topicId),
    queryFn: async () => {
      const res = await getFAQTypes(topicId ?? undefined);
      return Array.isArray(res) ? res : [];
    },
  });
}
