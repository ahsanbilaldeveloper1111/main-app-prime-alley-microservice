import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ListFAQTopics } from "@utils/faqs";
import { getErrorMessage } from "@utils/errors";
import { faqsKeys } from "../../query/keys";

export type FAQTopicsListPayload = { data: unknown[]; total: number };

export function useFAQTopicsListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    queryKey: faqsKeys.topics.list(args),
    queryFn: async (): Promise<FAQTopicsListPayload> => {
      try {
        const response = await ListFAQTopics({
          page: args.page,
          perPage: args.perPage,
          search: args.search,
          filters: {},
        });
        if (!response) return { data: [], total: 0 };
        return {
          data: (response as { data?: unknown[] }).data ?? [],
          total: (response as { total?: number }).total ?? 0,
        };
      } catch (error) {
        toast.error(`Failed to load FAQ topics: ${getErrorMessage(error)}`, {
          toastId: "faq_topics_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
