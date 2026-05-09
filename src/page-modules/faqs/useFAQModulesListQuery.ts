import { ListFAQModules } from "@utils/faqs";
import { faqsKeys } from "../../query/keys";
import {
  makePaginatedListFetcher,
  usePaginatedListQuery,
  type ListPayload,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type FAQModulesListPayload = ListPayload;

const fetchFAQModulesPage = makePaginatedListFetcher(ListFAQModules);

export function useFAQModulesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery<unknown>({
    args,
    queryKey: faqsKeys.modules.list(args),
    fetchPage: fetchFAQModulesPage,
    errorLabel: "FAQ modules",
    toastId: "faq_modules_list_failed",
  });
}
