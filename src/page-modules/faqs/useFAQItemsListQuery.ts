import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ListFAQItems } from "@utils/faqs";
import { getErrorMessage } from "@utils/errors";
import { faqsKeys } from "../../query/keys";

export type FAQItemsListPayload = { data: unknown[]; total: number };

export function useFAQItemsListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    queryKey: faqsKeys.items.list(args),
    queryFn: async (): Promise<FAQItemsListPayload> => {
      try {
        const result = await ListFAQItems({
          page: args.page,
          perPage: args.perPage,
          search: args.search,
          filters: {},
        });
        if (!result) return { data: [], total: 0 };
        const data = (result as { data?: unknown[] }).data ?? result ?? [];
        const total =
          (result as { total?: number }).total ??
          (Array.isArray(data) ? data.length : 0);
        return { data: Array.isArray(data) ? data : [], total };
      } catch (error) {
        toast.error(`Failed to load FAQs: ${getErrorMessage(error)}`, {
          toastId: "faq_items_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
