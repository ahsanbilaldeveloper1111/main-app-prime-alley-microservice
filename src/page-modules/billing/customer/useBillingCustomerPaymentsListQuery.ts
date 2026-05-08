import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { billingCustomerKeys } from "../../../query/keys";
import { GetPayments } from "@utils/accounting";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type BillingPaymentsListParsed = Readonly<{
  list: unknown[];
  total: number;
}>;

export function parseBillingPaymentsListResponse(
  response: unknown,
): BillingPaymentsListParsed {
  const r = response as Record<string, unknown> | null | undefined;
  const list = r?.dataList ?? r?.data;
  const rawTotal =
    r?.meta != null && typeof r.meta === "object"
      ? (r.meta as { total?: unknown }).total
      : undefined;

  let totalNum: number;
  if (typeof rawTotal === "number") {
    totalNum = rawTotal;
  } else if (typeof rawTotal === "string") {
    totalNum = Number(rawTotal);
  } else {
    totalNum = Number.NaN;
  }

  const arr = Array.isArray(list) ? list : [];
  const total = Number.isFinite(totalNum)
    ? totalNum
    : (r?.recordsTotal as number | undefined) ??
      (r?.recordsFiltered as number | undefined) ??
      arr.length;
  return { list: arr, total };
}

export type UseBillingCustomerPaymentsListQueryArgs = Readonly<{
  crmKey: string;
  page: number;
  perPage: number;
  /** Serialized filters for stable cache identity */
  filtersKey: string;
  refreshKey: number;
  search: string;
  status?: string;
}>;

export function useBillingCustomerPaymentsListQuery(
  args: UseBillingCustomerPaymentsListQueryArgs,
) {
  const {
    crmKey,
    page,
    perPage,
    filtersKey,
    refreshKey,
    search,
    status,
  } = args;

  return useQuery({
    queryKey: billingCustomerKeys.payments.list({
      crmKey,
      page,
      perPage,
      filtersKey,
      refreshKey,
    }),
    queryFn: async () => {
      try {
        const params = {
          page,
          per_page: perPage,
          search,
          status,
        };
        if (crmKey !== "" && crmKey !== "all") {
          Object.assign(params, { crm_company_id: crmKey });
        }
        const response = await GetPayments(params);
        return parseBillingPaymentsListResponse(response);
      } catch (error) {
        toast.error(`Failed to load payments: ${getErrorMessage(error)}`, {
          toastId: "billing_payments_list_failed",
        });
        return { list: [], total: 0 };
      }
    },
    placeholderData: keepPreviousData,
  });
}
