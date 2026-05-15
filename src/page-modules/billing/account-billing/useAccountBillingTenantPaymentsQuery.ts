import { useQuery } from "@tanstack/react-query";

import { accountBillingKeys } from "@query/keys";
import { GetPayments } from "@utils/accounting";

export function useAccountBillingTenantPaymentsQuery(
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: accountBillingKeys.tenantPayments(),
    queryFn: async () => {
      const response = await GetPayments({ page: 1, per_page: 500 });
      return (response as { dataList?: unknown[] })?.dataList ?? [];
    },
    enabled: options?.enabled ?? true,
  });
}
