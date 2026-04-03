import { ModuleSlug } from "@utils/Helper";

export type ProspectsListPaginationSlice = {
  currentPage: number;
  rowsPerPage: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
};

/** Maps table filters + pagination to `getCrmData` params for the prospects list. */
export function buildProspectsListCrmDataParams(
  memoizedFilters: Record<string, any>,
  pagination: ProspectsListPaginationSlice,
  overrides: { page?: number; per_page?: number } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    page: pagination.currentPage,
    per_page: pagination.rowsPerPage,
    ...overrides,
  };
  if (memoizedFilters.search) params.search = memoizedFilters.search;
  if (memoizedFilters.campaign_id?.length)
    params.campaign_ids = memoizedFilters.campaign_id;
  if (memoizedFilters.tags?.length) params.tags = memoizedFilters.tags;
  if (memoizedFilters.assignment_status)
    params.assignment_status = memoizedFilters.assignment_status;
  if (memoizedFilters.user_extension?.length) {
    params.user_extensions = Array.isArray(memoizedFilters.user_extension)
      ? memoizedFilters.user_extension
      : [memoizedFilters.user_extension];
  }
  if (
    memoizedFilters.is_viewed !== undefined &&
    memoizedFilters.is_viewed !== ""
  )
    params.is_viewed = memoizedFilters.is_viewed;
  if (memoizedFilters.created_at_from)
    params.date_from = memoizedFilters.created_at_from;
  if (memoizedFilters.created_at_to)
    params.date_to = memoizedFilters.created_at_to;
  if (memoizedFilters.last_called_at_from)
    params.last_called_at_from = memoizedFilters.last_called_at_from;
  if (memoizedFilters.last_called_at_to)
    params.last_called_at_to = memoizedFilters.last_called_at_to;
  if (memoizedFilters.has_scheduled_calls !== undefined)
    params.has_scheduled_calls = memoizedFilters.has_scheduled_calls;
  if (memoizedFilters.has_tickets !== undefined)
    params.has_tickets = memoizedFilters.has_tickets;
  if (memoizedFilters.scheduled_call_status)
    params.scheduled_call_status = memoizedFilters.scheduled_call_status;
  if (memoizedFilters.scheduled_call_from)
    params.scheduled_call_from = memoizedFilters.scheduled_call_from;
  if (memoizedFilters.scheduled_call_to)
    params.scheduled_call_to = memoizedFilters.scheduled_call_to;
  if (memoizedFilters.source_file)
    params.source_file = memoizedFilters.source_file;
  if (memoizedFilters.tag_ids?.length)
    params.tag_ids = memoizedFilters.tag_ids;
  if (memoizedFilters.last_called_at_from)
    params.last_called_at_from = memoizedFilters.last_called_at_from;
  if (memoizedFilters.last_called_at_to)
    params.last_called_at_to = memoizedFilters.last_called_at_to;
  if (memoizedFilters.disposition)
    params.disposition = memoizedFilters.disposition;
  if (pagination.sortColumn) {
    params.sort_column = pagination.sortColumn;
    params.sort_direction = pagination.sortDirection;
  }
  params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
  return params;
}

/** Maps arbitrary filters to `getCrmData` params for prospects CSV export paging. */
export function buildProspectsExportCrmDataParams(
  filters: Record<string, any>,
  overrides: { page?: number; per_page?: number } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    page: overrides.page ?? 1,
    per_page: overrides.per_page ?? 100,
    ...overrides,
  };
  if (filters.search) params.search = filters.search;
  if (filters.campaign_id?.length)
    params.campaign_ids = filters.campaign_id;
  if (filters.tags?.length) params.tags = filters.tags;
  if (filters.assignment_status)
    params.assignment_status = filters.assignment_status;
  if (filters.user_extension?.length)
    params.user_extensions = Array.isArray(filters.user_extension)
      ? filters.user_extension
      : [filters.user_extension];
  if (filters.is_viewed !== undefined && filters.is_viewed !== "")
    params.is_viewed = filters.is_viewed;
  if (filters.created_at_from) params.date_from = filters.created_at_from;
  if (filters.created_at_to) params.date_to = filters.created_at_to;
  if (filters.last_called_at_from)
    params.last_called_at_from = filters.last_called_at_from;
  if (filters.last_called_at_to)
    params.last_called_at_to = filters.last_called_at_to;
  if (filters.has_scheduled_calls !== undefined)
    params.has_scheduled_calls = filters.has_scheduled_calls;
  if (filters.has_tickets !== undefined)
    params.has_tickets = filters.has_tickets;
  if (filters.scheduled_call_status)
    params.scheduled_call_status = filters.scheduled_call_status;
  if (filters.scheduled_call_from)
    params.scheduled_call_from = filters.scheduled_call_from;
  if (filters.scheduled_call_to)
    params.scheduled_call_to = filters.scheduled_call_to;
  if (filters.source_file) params.source_file = filters.source_file;
  if (filters.tag_ids?.length) params.tag_ids = filters.tag_ids;
  if (filters.disposition) params.disposition = filters.disposition;
  params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
  return params;
}

/** True when campaign, tag, source, or next-call filters are active on the table. */
export function computeProspectsAdvancedFiltersApplied(
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
