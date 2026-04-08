/**
 * Central builders for GET /crm/deals (`getDeals`) — shared by deals list and approvals pages.
 */

type AnyRecord = Record<string, any>;

const addIfTruthyParam = (
  params: AnyRecord,
  key: string,
  value: unknown,
): void => {
  if (value) {
    params[key] = value;
  }
};

const addIfDefinedParam = (
  params: AnyRecord,
  key: string,
  value: unknown,
): void => {
  if (value !== undefined) {
    params[key] = value;
  }
};

const addIfNumberLikeParam = (
  params: AnyRecord,
  key: string,
  value: unknown,
): void => {
  if (value != null && value !== "") {
    params[key] = Number(value);
  }
};

const addIfNotNullOrEmptyParam = (
  params: AnyRecord,
  key: string,
  value: unknown,
): void => {
  if (value != null && value !== "") {
    params[key] = value;
  }
};

const resolveUserExtensions = (filters: AnyRecord): unknown[] | undefined => {
  if (filters.user_extensions?.length) {
    return filters.user_extensions;
  }
  if (filters.assigned_to) {
    return [filters.assigned_to];
  }
  return undefined;
};

/** Maps deals list / approvals filter objects to `getDeals` query fields. */
export function applyDealsListApiFilters(
  params: AnyRecord,
  filters: AnyRecord,
): void {
  addIfTruthyParam(params, "search", filters.search);

  addIfDefinedParam(params, "include_converted", filters.include_converted);
  addIfDefinedParam(params, "include_lost", filters.include_lost);
  addIfDefinedParam(params, "include_archived", filters.include_archived);

  addIfTruthyParam(
    params,
    "user_extensions",
    resolveUserExtensions(filters),
  );
  addIfTruthyParam(params, "stage_id", filters.stage_id);

  addIfNumberLikeParam(params, "probability_min", filters.probability_min);
  addIfNumberLikeParam(params, "probability_max", filters.probability_max);

  addIfTruthyParam(params, "business_type_id", filters.business_type_id);

  addIfTruthyParam(
    params,
    "expected_close_date_from",
    filters.expected_close_date_from,
  );
  addIfTruthyParam(
    params,
    "expected_close_date_to",
    filters.expected_close_date_to,
  );

  addIfTruthyParam(params, "follow_up_date_from", filters.follow_up_date_from);
  addIfTruthyParam(params, "follow_up_date_to", filters.follow_up_date_to);

  addIfTruthyParam(params, "created_at_from", filters.created_at_from);
  addIfTruthyParam(params, "created_at_to", filters.created_at_to);
  addIfTruthyParam(params, "created_at_month", filters.created_at_month);

  addIfNotNullOrEmptyParam(params, "ticket_id", filters.ticket_id);

  addIfDefinedParam(params, "has_meetings", filters.has_meetings);

  addIfDefinedParam(params, "is_lost", filters.is_lost);

  addIfTruthyParam(params, "approval_status", filters.approval_status);

  addIfTruthyParam(params, "deal_type", filters.deal_type);
  addIfTruthyParam(params, "industry", filters.industry);

  addIfTruthyParam(params, "sort_by", filters.sort_by);
  addIfTruthyParam(params, "sort_order", filters.sort_order);
}

export function applyDealsListTableSortingToParams(
  params: AnyRecord,
  includeTableSorting: boolean,
  sortBy: unknown,
  sortOrder: unknown,
): void {
  if (includeTableSorting && sortBy) {
    params.sort_by = sortBy;
    params.sort_order = sortOrder;
  }
}

export function dealsListApplyPaginationToParams(
  params: AnyRecord,
  pagination?: { page: number; per_page: number },
): void {
  if (!pagination) return;
  params.page = pagination.page;
  params.per_page = pagination.per_page;
}

export type DealsListTableSort = {
  sortBy: string;
  sortOrder: string;
};

export type BuildDealsListGetDealsParamsOptions = {
  page?: number;
  perPage?: number;
  includeTableSorting?: boolean;
  /** When set, overrides `filters.sort_by` / `filters.sort_order` for the request. */
  tableSort?: DealsListTableSort | null;
};

/**
 * Full query object for paged deal fetches (table + board).
 */
export function buildDealsListGetDealsParams(
  filters: AnyRecord,
  options: BuildDealsListGetDealsParamsOptions = {},
): AnyRecord {
  const {
    page = 1,
    perPage = 15,
    includeTableSorting = true,
    tableSort = null,
  } = options;
  const params: AnyRecord = { page, per_page: perPage };
  applyDealsListApiFilters(params, filters);
  applyDealsListTableSortingToParams(
    params,
    includeTableSorting,
    tableSort?.sortBy,
    tableSort?.sortOrder,
  );
  return params;
}

/**
 * Export / bulk fetch: same filter mapping, optional paging slice.
 */
export function buildDealsListGetDealsExportParams(
  filters: AnyRecord,
  pagination?: { page: number; per_page: number },
): AnyRecord {
  const params: AnyRecord = {};
  applyDealsListApiFilters(params, filters);
  dealsListApplyPaginationToParams(params, pagination);
  return params;
}
