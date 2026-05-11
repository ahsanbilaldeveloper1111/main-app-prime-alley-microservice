import { GetCompanies } from "@utils/users";
import { chatKeys } from "../../query/keys";
import { useArrayListQuery } from "../_shared/listQuery";

export interface ChatCompanyOption {
  identifier: string;
  name?: string;
  [key: string]: unknown;
}

export function useChatCompaniesQuery(enabled = true) {
  return useArrayListQuery<ChatCompanyOption>({
    queryKey: chatKeys.companies.all(),
    fetch: GetCompanies,
    enabled,
    staleTime: 60_000,
    errorLabel: "companies",
    toastId: "chat_companies_failed",
  });
}
