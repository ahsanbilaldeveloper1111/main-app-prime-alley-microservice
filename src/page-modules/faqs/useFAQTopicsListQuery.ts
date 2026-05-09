import { ListFAQTopics } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  normalizeListResponse,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQTopicsListPayload = ListPayload;

export function useFAQTopicsListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.topics.list(args),
    fetchPage: async ({ page, perPage, search }) =>
      normalizeListResponse(
        await ListFAQTopics({ page, perPage, search, filters: {} }),
      ),
    errorLabel: "FAQ topics",
    toastId: "faq_topics_list_failed",
  });
}
