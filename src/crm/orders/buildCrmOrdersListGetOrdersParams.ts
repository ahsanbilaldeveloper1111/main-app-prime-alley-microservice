/**
 * Shared query params for `getOrders` — CRM orders list + billing order-invoicing.
 */
import { normalizeSearchQuery } from "@utils/Helper";

type AnyRecord = Record<string, any>;

export type CrmOrdersListOwnerParamStyle =
  | "user_extension_filter"
  | "user_extensions"
  | "assigned_to";

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
  crmCompanyId?: string | number | null;
}>;

function addIfDefined(params: AnyRecord, key: string, value: unknown) {
  if (value !== undefined) {
    params[key] = value;
  }
}

function addIfTruthy(params: AnyRecord, key: string, value: unknown) {
  if (value) {
    params[key] = value;
  }
}

function addNumberIfPresent(params: AnyRecord, key: string, value: unknown) {
  if (value != null && value !== "") {
    params[key] = Number(value);
  }
}

function addValueIfPresent(params: AnyRecord, key: string, value: unknown) {
  if (value != null && value !== "") {
    params[key] = value;
  }
}

function getSearchParamValue(filters: AnyRecord, normalizeSearch: boolean): unknown {
  if (!normalizeSearch) {
    return filters.search;
  }
  return normalizeSearchQuery(filters.search);
}

function applyOwnerFilter(
  params: AnyRecord,
  filters: AnyRecord,
  ownerParamStyle: CrmOrdersListOwnerParamStyle,
) {
  if (ownerParamStyle === "user_extension_filter") {
    if (filters.user_extension_filter?.length) {
      params.user_extension_filter = Array.isArray(filters.user_extension_filter)
        ? filters.user_extension_filter
        : [filters.user_extension_filter];
      return;
    }
    if (filters.assigned_to) {
      params.user_extension_filter = [filters.assigned_to];
    }
    return;
  }

  if (ownerParamStyle === "user_extensions") {
    if (filters.user_extensions?.length) {
      params.user_extensions = filters.user_extensions;
      return;
    }
    if (filters.assigned_to) {
      params.user_extensions = [filters.assigned_to];
    }
    return;
  }

  if (filters.assigned_to) {
    params.assigned_to = filters.assigned_to;
  }
}

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

  const searchParamValue = getSearchParamValue(filters, normalizeSearch);
  addIfTruthy(params, "search", searchParamValue);

  addIfDefined(params, "include_lost", filters.include_lost);
  addIfDefined(params, "include_archived", filters.include_archived);

  applyOwnerFilter(params, filters, ownerParamStyle);

  addIfDefined(params, "is_lost", filters.is_lost);
  addIfTruthy(params, "industry", filters.industry);
  addNumberIfPresent(params, "order_value_min", filters.order_value_min);
  addNumberIfPresent(params, "order_value_max", filters.order_value_max);
  addIfTruthy(params, "order_stage_id", filters.order_stage_id);
  addIfTruthy(params, "stage_id", filters.stage_id);
  addIfTruthy(params, "order_approval_status", filters.order_approval_status);
  addIfTruthy(params, "fulfillment_status", filters.fulfillment_status);
  addIfTruthy(params, "payment_status", filters.payment_status);
  addIfTruthy(params, "status", filters.status);
  addValueIfPresent(params, "ticket_id", filters.ticket_id);
  addValueIfPresent(params, "deal_id", filters.deal_id);
  addIfTruthy(params, "date_from", filters.date_from);
  addIfTruthy(params, "date_to", filters.date_to);
  addIfTruthy(params, "created_at_from", filters.created_at_from);
  addIfTruthy(params, "created_at_to", filters.created_at_to);
  addIfTruthy(params, "created_at_month", filters.created_at_month);
  addIfTruthy(params, "sort_by", filters.sort_by);
  addIfTruthy(params, "sort_order", filters.sort_order);

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
  crmCompanyId?: string | number | null,
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
