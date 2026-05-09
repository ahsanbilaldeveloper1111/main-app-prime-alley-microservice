import { ListFAQItems } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  makePaginatedListFetcher,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQItemsListPayload = ListPayload;

const fetchFAQItemsPage = makePaginatedListFetcher(ListFAQItems, {
  fallbackToRoot: true,
});

export function useFAQItemsListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.items.list(args),
    fetchPage: fetchFAQItemsPage,
    errorLabel: "FAQs",
    toastId: "faq_items_list_failed",
  });
}
