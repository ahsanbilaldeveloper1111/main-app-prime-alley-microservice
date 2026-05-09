import { useQuery } from "@tanstack/react-query";
import { GetCompanies } from "@utils/users";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";
import { chatKeys } from "../../query/keys";

export interface ChatCompanyOption {
  identifier: string;
  name?: string;
  [key: string]: unknown;
}

export function useChatCompaniesQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.companies.all(),
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<ChatCompanyOption[]> => {
      try {
        const data = await GetCompanies();
        return Array.isArray(data) ? (data as ChatCompanyOption[]) : [];
      } catch (e) {
        toast.error(`Failed to load companies: ${getErrorMessage(e)}`, {
          toastId: "chat_companies_failed",
        });
        return [];
      }
    },
  });
}
