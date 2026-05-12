import type {
  FetchCrmHistoryListParams,
  CrmHistoryListPagination,
} from "../../../query/fetchCrmHistoryList";
import type {
  HistoryActivityFiltersState,
  HistoryPaginationState,
} from "./activityHistoryPageTypes";

const ACTIVITY_TYPE_TAB_TO_API: Record<string, string> = {
  leads: "lead",
  deals: "deal",
  orders: "order",
  prospects: "prospect",
};

/** Build the params object for the activity history list API from page state. */
export function buildHistoryListParams(args: {
  pagination: HistoryPaginationState;
  activitySearch: string;
  activityFilters: HistoryActivityFiltersState;
  activityTypeFilter: string;
}): FetchCrmHistoryListParams {
  const { pagination, activitySearch, activityFilters, activityTypeFilter } =
    args;
  const params: FetchCrmHistoryListParams = {
    page: pagination.current_page,
    per_page: pagination.per_page,
  };
  if (pagination.sort_by) {
    params.sort_by = pagination.sort_by;
    params.sort_order = pagination.sort_order;
  }
  if (activitySearch) params.search = activitySearch;
  if (activityFilters.agents.length > 0) {
    params.user_extension = activityFilters.agents;
  }
  if (activityFilters.dateRange.start) {
    params.from = activityFilters.dateRange.start;
  }
  if (activityFilters.dateRange.end) params.to = activityFilters.dateRange.end;
  const apiType = ACTIVITY_TYPE_TAB_TO_API[activityTypeFilter];
  if (apiType) params.type = apiType;
  return params;
}

/** Return a new pagination state from an API pagination, reusing prev if equal. */
export function mergeHistoryPagination(
  prev: HistoryPaginationState,
  p: CrmHistoryListPagination,
): HistoryPaginationState {
  const sameValues =
    prev.current_page === p.current_page &&
    prev.last_page === p.last_page &&
    prev.per_page === p.per_page &&
    prev.total === p.total;
  if (sameValues) return prev;
  return {
    ...prev,
    current_page: p.current_page,
    last_page: p.last_page,
    per_page: p.per_page,
    total: p.total,
  };
}

function tabQueryValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (typeof first === "number" || typeof first === "bigint") {
      return first.toString();
    }
    return "";
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  return "";
}

/** Compute the next activity tab to apply when the URL's `tab` query changes. */
export function resolveActivityTabFromRouter(
  isReady: boolean,
  tabQuery: unknown,
  currentTab: string,
  validTabs: readonly string[],
): string | null {
  if (!isReady || tabQuery == null) return null;
  const tabFromUrl = tabQueryValueToString(tabQuery);
  if (!tabFromUrl) return null;
  const isValidNewTab =
    validTabs.includes(tabFromUrl) && tabFromUrl !== currentTab;
  return isValidNewTab ? tabFromUrl : null;
}
