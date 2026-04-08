import { ModuleSlug } from "@utils/Helper";

/** Shared pagination slice for CRM list tables (contacts, prospects, etc.). */
export type CrmListPaginationSlice = {
  currentPage: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

function copyTruthyFilterToParam(
  target: Record<string, any>,
  filters: Record<string, any>,
  filterKey: string,
  paramKey: string,
): void {
  const value = filters[filterKey];
  if (value) target[paramKey] = value;
}

function copyNonEmptyArrayFilterToParam(
  target: Record<string, any>,
  filters: Record<string, any>,
  filterKey: string,
  paramKey: string,
): void {
  const value = filters[filterKey];
  if (value?.length) target[paramKey] = value;
}

function mergeUserExtensionsParam(
  target: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (!filters.user_extension?.length) return;
  target.user_extensions = Array.isArray(filters.user_extension)
    ? filters.user_extension
    : [filters.user_extension];
}

function mergeIsViewedParam(
  target: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (filters.is_viewed === undefined || filters.is_viewed === "") return;
  target.is_viewed = filters.is_viewed;
}

function copyDefinedFilterToSameParamKey(
  target: Record<string, any>,
  filters: Record<string, any>,
  key: string,
): void {
  if (filters[key] === undefined) return;
  target[key] = filters[key];
}

/** Maps shared CRM list filter fields onto getCrmData-style param objects. */
function applySharedCrmListGetCrmDataFilters(
  params: Record<string, any>,
  filters: Record<string, any>,
): void {
  copyTruthyFilterToParam(params, filters, "search", "search");
  copyNonEmptyArrayFilterToParam(params, filters, "campaign_id", "campaign_ids");
  copyNonEmptyArrayFilterToParam(params, filters, "tags", "tags");
  copyTruthyFilterToParam(
    params,
    filters,
    "assignment_status",
    "assignment_status",
  );
  mergeUserExtensionsParam(params, filters);
  mergeIsViewedParam(params, filters);
  copyTruthyFilterToParam(params, filters, "created_at_from", "date_from");
  copyTruthyFilterToParam(params, filters, "created_at_to", "date_to");
  copyTruthyFilterToParam(
    params,
    filters,
    "last_called_at_from",
    "last_called_at_from",
  );
  copyTruthyFilterToParam(
    params,
    filters,
    "last_called_at_to",
    "last_called_at_to",
  );
  copyDefinedFilterToSameParamKey(params, filters, "has_scheduled_calls");
  copyDefinedFilterToSameParamKey(params, filters, "has_tickets");
  copyTruthyFilterToParam(
    params,
    filters,
    "scheduled_call_status",
    "scheduled_call_status",
  );
  copyTruthyFilterToParam(
    params,
    filters,
    "scheduled_call_from",
    "scheduled_call_from",
  );
  copyTruthyFilterToParam(
    params,
    filters,
    "scheduled_call_to",
    "scheduled_call_to",
  );
  copyTruthyFilterToParam(params, filters, "source_file", "source_file");
  copyNonEmptyArrayFilterToParam(params, filters, "tag_ids", "tag_ids");
  copyTruthyFilterToParam(params, filters, "disposition", "disposition");
}

/** Maps table filters + pagination to `getCrmData` params for CRM list pages. */
export function buildCrmListTableCrmDataParams(
  memoizedFilters: Record<string, any>,
  pagination: CrmListPaginationSlice,
  overrides: { page?: number; per_page?: number } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    page: pagination.currentPage,
    per_page: pagination.rowsPerPage,
    ...overrides,
  };
  applySharedCrmListGetCrmDataFilters(params, memoizedFilters);
  if (pagination.sortBy) {
    params.sort_by = pagination.sortBy;
    params.sort_order = pagination.sortOrder;
  }
  params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
  return params;
}

/** Maps arbitrary filters to `getCrmData` params for CRM list CSV export paging. */
export function buildCrmListExportCrmDataParams(
  filters: Record<string, any>,
  overrides: { page?: number; per_page?: number } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    page: overrides.page ?? 1,
    per_page: overrides.per_page ?? 100,
    ...overrides,
  };
  applySharedCrmListGetCrmDataFilters(params, filters);
  params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
  return params;
}

/** True when campaign, tag, source, or next-call filters are active on the table. */
export function computeCrmListAdvancedFiltersApplied(
  currentFilters: Record<string, any>,
): boolean {
  const campaign = currentFilters.campaign_id;
  const hasCampaign = Array.isArray(campaign)
    ? campaign.length > 0
    : !!campaign;

  const tags = currentFilters.tags;
  const hasTags = Array.isArray(tags) ? tags.length > 0 : !!tags;

  const hasSource = !!currentFilters.source_file;
  const hasNextCall =
    !!currentFilters.scheduled_call_from ||
    !!currentFilters.scheduled_call_to;

  return hasCampaign || hasTags || hasSource || hasNextCall;
}

/**
 * Copy a fixed set of keys from a filter object onto API params when values are truthy.
 * Use for leads/deals/orders/tasks-style lists to avoid repeating `if (filters.x) params.x = …`.
 */
export function copyTruthyKeysToParams(
  target: Record<string, any>,
  source: Record<string, any>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const v = source[key];
    if (v) {
      target[key] = v;
    }
  }
}

/**
 * Copy keys when `source[key] !== undefined` (preserves explicit `null` if needed by API).
 */
export function copyDefinedKeysToParams(
  target: Record<string, any>,
  source: Record<string, any>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
}
