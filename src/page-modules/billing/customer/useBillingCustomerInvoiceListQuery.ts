import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { billingCustomerKeys } from "../../../query/keys";
import { getInvoices, type InvoiceData } from "@utils/accounts";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type BillingInvoiceSummarySlice = Readonly<{
  paid_count?: number;
  pending_count?: number;
  overdue_count?: number;
}>;

export type BillingInvoiceListParsed = Readonly<{
  list: InvoiceData[];
  total: number;
  summary?: BillingInvoiceSummarySlice;
}>;

export function parseBillingInvoiceListResponse(
  response: unknown,
): BillingInvoiceListParsed {
  const r = response as {
    data?: InvoiceData[];
    pagination?: { total?: unknown };
    summary?: BillingInvoiceSummarySlice;
  };
  const data = Array.isArray(r?.data) ? r.data : [];
  const rawTotal = r?.pagination?.total;
  const totalNum =
    typeof rawTotal === "number"
      ? rawTotal
      : typeof rawTotal === "string"
        ? Number(rawTotal)
        : NaN;
  const total = Number.isFinite(totalNum) ? totalNum : 0;
  return {
    list: data,
    total,
    summary: r?.summary,
  };
}

export type BillingInvoiceFiltersInput = Readonly<{
  search?: string;
  status?: string;
  invoice_date_from?: string;
  date_from?: string;
  date_to?: string;
}>;

export type UseBillingCustomerInvoiceListQueryArgs = Readonly<{
  crmKey: string;
  page: number;
  perPage: number;
  filtersKey: string;
  refreshKey: number;
  filters: BillingInvoiceFiltersInput;
}>;

export function useBillingCustomerInvoiceListQuery(
  args: UseBillingCustomerInvoiceListQueryArgs,
) {
  const { crmKey, page, perPage, filtersKey, refreshKey, filters } = args;

  return useQuery({
    queryKey: billingCustomerKeys.invoices.list({
      crmKey,
      page,
      perPage,
      filtersKey,
      refreshKey,
    }),
    queryFn: async () => {
      try {
        const response = await getInvoices({
          page,
          per_page: perPage,
          search: filters.search || "",
          crm_company_not_null: true,
          ...filters,
          ...(crmKey !== "" && crmKey !== "all"
            ? { crm_company_id: crmKey }
            : {}),
        });
        return parseBillingInvoiceListResponse(response);
      } catch (error) {
        toast.error(`Failed to load invoices: ${getErrorMessage(error)}`, {
          toastId: "billing_invoices_load_failed",
        });
        return { list: [], total: 0 };
      }
    },
    placeholderData: keepPreviousData,
  });
}
