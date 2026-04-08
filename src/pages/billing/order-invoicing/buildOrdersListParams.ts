/** Builds the GET /orders query object from list filters (CRM orders list). */
export function buildOrdersListParams(
  page: number,
  perPage: number,
  currentFilters: Record<string, unknown>,
  selectedCompanyId: string | number,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page,
    per_page: perPage,
  };
  const f = currentFilters;

  const stringFields: Array<[string, string]> = [
    ["search", "search"],
    ["stage_id", "stage_id"],
    ["assigned_to", "assigned_to"],
    ["industry", "industry"],
    ["order_value_min", "order_value_min"],
    ["order_value_max", "order_value_max"],
    ["order_stage_id", "order_stage_id"],
    ["order_approval_status", "order_approval_status"],
    ["fulfillment_status", "fulfillment_status"],
    ["payment_status", "payment_status"],
    ["date_from", "date_from"],
    ["date_to", "date_to"],
  ];

  for (const [paramKey, filterKey] of stringFields) {
    const v = f[filterKey];
    if (v !== undefined && v !== null && v !== "") {
      params[paramKey] = v;
    }
  }

  if (f.is_lost !== undefined) {
    params.is_lost = f.is_lost;
  }
  if (f.include_lost !== undefined) {
    params.include_lost = f.include_lost;
  }
  if (f.include_archived !== undefined) {
    params.include_archived = f.include_archived;
  }

  if (selectedCompanyId !== undefined && selectedCompanyId !== "") {
    params.crm_company_id = selectedCompanyId;
  }

  return params;
}
