import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { billingCustomerKeys } from "@query/keys";
import { getCustomerProductPricingList } from "@utils/accounts";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type BillingSubscriptionsPricingParsed = Readonly<{
  list: unknown[];
  total: number;
}>;

function parsePricingListResponse(
  response: unknown,
): BillingSubscriptionsPricingParsed {
  const list = Array.isArray(response)
    ? response
    : (response as { dataList?: unknown[]; data?: unknown[] })?.dataList ??
      (response as { data?: unknown[] })?.data ??
      [];
  const r = response as Record<string, unknown> | undefined;
  const total =
    (r?.meta as { total?: number } | undefined)?.total ??
    (r?.recordsTotal as number | undefined) ??
    (r?.recordsFiltered as number | undefined) ??
    (Array.isArray(list) ? list.length : 0);
  return { list: Array.isArray(list) ? list : [], total };
}

export type UseBillingCustomerSubscriptionsPricingQueryArgs = Readonly<{
  crmId: string;
  page: number;
  perPage: number;
  filtersKey: string;
  refreshKey: number;
  search: string;
  status?: string;
  billing_cycle?: string;
  renewal_start_date?: string;
  renewal_end_date?: string;
}>;

export function useBillingCustomerSubscriptionsPricingQuery(
  args: UseBillingCustomerSubscriptionsPricingQueryArgs,
) {
  const {
    crmId,
    page,
    perPage,
    filtersKey,
    refreshKey,
    search,
    status,
    billing_cycle,
    renewal_start_date,
    renewal_end_date,
  } = args;

  return useQuery({
    queryKey: billingCustomerKeys.subscriptions.pricingList({
      crmId,
      page,
      perPage,
      filtersKey,
      refreshKey,
    }),
    queryFn: async () => {
      if (!crmId) {
        return { list: [], total: 0 };
      }
      try {
        const response = await getCustomerProductPricingList(crmId, {
          page,
          per_page: perPage,
          search: search || "",
          status: status || undefined,
          sort_order: "desc",
          billing_cycle: billing_cycle || undefined,
          renewal_start_date: renewal_start_date || undefined,
          renewal_end_date: renewal_end_date || undefined,
        });
        return parsePricingListResponse(response);
      } catch (error) {
        toast.error(`Failed to load subscriptions: ${getErrorMessage(error)}`, {
          toastId: "billing_subscriptions_fetch_failed",
        });
        return { list: [], total: 0 };
      }
    },
    enabled: Boolean(crmId),
    placeholderData: keepPreviousData,
  });
}
