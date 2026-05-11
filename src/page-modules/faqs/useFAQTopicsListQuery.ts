import { ListFAQTopics } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  makePaginatedListFetcher,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQTopicsListPayload = ListPayload;

const fetchFAQTopicsPage = makePaginatedListFetcher(ListFAQTopics);

export function useFAQTopicsListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.topics.list(args),
    fetchPage: fetchFAQTopicsPage,
    errorLabel: "FAQ topics",
    toastId: "faq_topics_list_failed",
  });
}
