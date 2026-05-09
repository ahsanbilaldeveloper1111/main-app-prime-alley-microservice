import { ListFAQItems } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  normalizeListResponse,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQItemsListPayload = ListPayload;

export function useFAQItemsListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.items.list(args),
    fetchPage: async ({ page, perPage, search }) =>
      normalizeListResponse(
        await ListFAQItems({ page, perPage, search, filters: {} }),
        { fallbackToRoot: true },
      ),
    errorLabel: "FAQs",
    toastId: "faq_items_list_failed",
  });
}
