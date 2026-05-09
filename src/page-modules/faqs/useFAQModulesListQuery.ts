import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ListFAQModules } from "@utils/faqs";
import { getErrorMessage } from "@utils/errors";
import { faqsKeys } from "../../query/keys";

export type FAQModulesListPayload = { data: unknown[]; total: number };

export function useFAQModulesListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    queryKey: faqsKeys.modules.list(args),
    queryFn: async (): Promise<FAQModulesListPayload> => {
      try {
        const response = await ListFAQModules({
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
        toast.error(`Failed to load FAQ modules: ${getErrorMessage(error)}`, {
          toastId: "faq_modules_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
