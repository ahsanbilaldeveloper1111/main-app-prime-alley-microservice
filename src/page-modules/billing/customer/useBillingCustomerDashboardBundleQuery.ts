import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { billingCustomerKeys } from "@query/keys";
import { fetchBillingCustomerDashboardBundle } from "./billingCustomerDashboardModel";

export function useBillingCustomerDashboardBundleQuery(
  selectedCompanyId: string | number | null | undefined,
  selectedPeriod: string,
  customerEnsureRefreshKey: number,
) {
  const crmKey =
    selectedCompanyId !== "" &&
    selectedCompanyId !== null &&
    selectedCompanyId !== undefined
      ? String(selectedCompanyId)
      : "none";

  return useQuery({
    queryKey: billingCustomerKeys.dashboard.bundle(
      crmKey,
      selectedPeriod,
      customerEnsureRefreshKey,
    ),
    queryFn: () =>
      fetchBillingCustomerDashboardBundle({
        selectedCompanyId,
        selectedPeriod,
      }),
    placeholderData: keepPreviousData,
  });
}
