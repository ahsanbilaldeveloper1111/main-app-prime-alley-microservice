import { useQuery } from "@tanstack/react-query";

import { accountBillingKeys } from "../../../query/keys";
import { GetCompanyDetails } from "@utils/accounting";

export function useAccountBillingCompanyDetailsQuery(
  variant: "tenant" | "session",
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: accountBillingKeys.companyDetails(variant),
    queryFn: async () =>
      variant === "tenant"
        ? GetCompanyDetails({ crm_company_id: "" })
        : GetCompanyDetails(),
    enabled: options?.enabled ?? true,
  });
}
