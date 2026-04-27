export const OPTIONAL_STRING_FILTER_KEYS = [
  "stage_id",
  "assigned_to",
  "search",
  "industry",
  "order_value_min",
  "order_value_max",
  "order_stage_id",
  "order_approval_status",
  "fulfillment_status",
  "payment_status",
  "date_from",
  "date_to",
] as const;

export const OPTIONAL_TRUE_FILTER_KEYS = ["include_lost", "include_archived"] as const;

export type OrdersUiFilters = {
  assignedTo: string | null;
  stage: string | null;
  industry: string | null;
  orderValueMin: string | null;
  orderValueMax: string | null;
  orderApprovalStatus: string | null;
  fulfillmentStatus: string | null;
  paymentStatus: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export const DEFAULT_ORDERS_UI_FILTERS: OrdersUiFilters = {
  assignedTo: null,
  stage: null,
  industry: null,
  orderValueMin: null,
  orderValueMax: null,
  orderApprovalStatus: null,
  fulfillmentStatus: null,
  paymentStatus: null,
  dateFrom: null,
  dateTo: null,
};

export type OrdersDeliverySelectOption = { value: string | number; label: string };

export const plannerOrdersToOptionalSelectString = (
  value: string | number | null | undefined,
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

export type OrdersFilterSelectOption = { value: string; label: string };
