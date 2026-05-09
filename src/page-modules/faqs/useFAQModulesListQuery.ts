import { ListFAQModules } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  normalizeListResponse,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQModulesListPayload = ListPayload;

export function useFAQModulesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.modules.list(args),
    fetchPage: async ({ page, perPage, search }) =>
      normalizeListResponse(
        await ListFAQModules({ page, perPage, search, filters: {} }),
      ),
    errorLabel: "FAQ modules",
    toastId: "faq_modules_list_failed",
  });
}
