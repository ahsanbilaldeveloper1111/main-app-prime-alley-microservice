import { useQuery } from "@tanstack/react-query";

import type { AccountBillingInvoiceHistoryListParams } from "@query/keys";
import { accountBillingKeys } from "@query/keys";
import { getInvoices } from "@utils/accounts";

export function buildAccountBillingInvoiceHistoryRequest(
  p: AccountBillingInvoiceHistoryListParams,
) {
  const baseParams = {
    page: 1,
    per_page: 50,
    limit: 50,
    search: p.search || undefined,
    date_from: p.dateFrom || undefined,
    date_to: p.dateTo || undefined,
    status: p.statusFilter === "All Statuses" ? "" : p.statusFilter,
    payment_status:
      p.paymentStatusFilter === "All Payments" ? "" : p.paymentStatusFilter,
  };
  const companyIdTrimmed = String(p.selectedCompanyId).trim();
  if (p.customerCompanyPicker) {
    return {
      ...baseParams,
      crm_company_not_null: true,
      ...(companyIdTrimmed ? { crm_company_id: p.selectedCompanyId } : {}),
    };
  }
  return {
    ...baseParams,
    crm_company_id: "null",
  };
}

export function useAccountBillingInvoiceHistoryQuery(
  params: AccountBillingInvoiceHistoryListParams,
) {
  return useQuery({
    queryKey: accountBillingKeys.invoiceHistory.list(params),
    queryFn: async () => {
      const res = (await getInvoices(
        buildAccountBillingInvoiceHistoryRequest(params),
      )) as { data?: unknown[] };
      return res?.data ?? [];
    },
  });
}
