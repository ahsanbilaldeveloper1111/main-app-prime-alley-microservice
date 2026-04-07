/**
 * Shared query params for `getOrders` — CRM orders list + billing order-invoicing.
 */
import { normalizeSearchQuery } from "@utils/Helper";

type AnyRecord = Record<string, any>;

export type CrmOrdersListOwnerParamStyle = "user_extensions" | "assigned_to";

export type BuildCrmOrdersListGetOrdersParamsInput = Readonly<{
  filters: AnyRecord;
  page: number;
  perPage: number;
  /** Server-side sort; when `sortBy` is set it overrides filter sort fields. */
  tableSort?: { sortBy: string; sortOrder: string } | null;
  /** CRM list normalizes search; billing passes raw `search`. */
  normalizeSearch: boolean;
  /** CRM maps `assigned_to` / `user_extensions` like the main orders page. */
  ownerParamStyle: CrmOrdersListOwnerParamStyle;
  /** Billing order-invoicing: restrict by CRM company. */
  crmCompanyId?: string | number | "" | null;
}>;

export function buildCrmOrdersListGetOrdersParams(
  input: BuildCrmOrdersListGetOrdersParamsInput,
): AnyRecord {
  const {
    filters,
    page,
    perPage,
    tableSort,
    ownerParamStyle,
    normalizeSearch,
    crmCompanyId,
  } = input;

  const params: AnyRecord = {
    page,
    per_page: perPage,
  };

  if (normalizeSearch) {
    const q = normalizeSearchQuery(filters.search);
    if (q) params.search = q;
  } else if (filters.search) {
    params.search = filters.search;
  }

  if (filters.include_lost !== undefined) {
    params.include_lost = filters.include_lost;
  }
  if (filters.include_archived !== undefined) {
    params.include_archived = filters.include_archived;
  }

  if (ownerParamStyle === "user_extensions") {
    if (filters.user_extensions?.length) {
      params.user_extensions = filters.user_extensions;
    } else if (filters.assigned_to) {
      params.user_extensions = [filters.assigned_to];
    }
  } else if (filters.assigned_to) {
    params.assigned_to = filters.assigned_to;
  }

  if (filters.is_lost !== undefined) {
    params.is_lost = filters.is_lost;
  }

  if (filters.industry) params.industry = filters.industry;
  if (filters.order_value_min != null && filters.order_value_min !== "") {
    params.order_value_min = Number(filters.order_value_min);
  }
  if (filters.order_value_max != null && filters.order_value_max !== "") {
    params.order_value_max = Number(filters.order_value_max);
  }
  if (filters.order_stage_id) params.order_stage_id = filters.order_stage_id;
  if (filters.stage_id) params.stage_id = filters.stage_id;
  if (filters.order_approval_status) {
    params.order_approval_status = filters.order_approval_status;
  }
  if (filters.fulfillment_status) {
    params.fulfillment_status = filters.fulfillment_status;
  }
  if (filters.payment_status) params.payment_status = filters.payment_status;
  if (filters.status) params.status = filters.status;
  if (filters.ticket_id != null && filters.ticket_id !== "") {
    params.ticket_id = filters.ticket_id;
  }
  if (filters.deal_id != null && filters.deal_id !== "") {
    params.deal_id = filters.deal_id;
  }
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.created_at_from) params.created_at_from = filters.created_at_from;
  if (filters.created_at_to) params.created_at_to = filters.created_at_to;
  if (filters.created_at_month) params.created_at_month = filters.created_at_month;

  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;

  if (tableSort?.sortBy) {
    params.sort_by = tableSort.sortBy;
    params.sort_order = tableSort.sortOrder;
  }

  if (crmCompanyId !== undefined && crmCompanyId !== null && crmCompanyId !== "") {
    params.crm_company_id = crmCompanyId;
  }

  return params;
}

/** Paged export fetch: same mapping as list, no table sort override; search not normalized by default. */
export function buildCrmOrdersListExportParams(
  filters: AnyRecord,
  pagination: { page: number; per_page: number } | undefined,
  ownerParamStyle: CrmOrdersListOwnerParamStyle,
  crmCompanyId?: string | number | "" | null,
): AnyRecord {
  return buildCrmOrdersListGetOrdersParams({
    filters,
    page: pagination?.page ?? 1,
    perPage: pagination?.per_page ?? 100,
    tableSort: null,
    normalizeSearch: false,
    ownerParamStyle,
    crmCompanyId,
  });
}
