import { useMemo, useState } from "react";
import {
  useCrmListFiltersMetricsHistoryState,
  type UseCrmListFiltersMetricsHistoryStateParams,
} from "@crm/shared/useCrmListFiltersMetricsHistoryState";
import { useCrmListSidebarActivityModals } from "@crm/shared/useCrmListSidebarActivityModals";
import {
  CRM_QUOTES_LIST_VISIBLE_COLUMNS_LEGACY_KEYS,
  CRM_QUOTES_LIST_VISIBLE_COLUMNS_STORAGE_KEY,
  crmQuotesListDefaultTableColumnIds,
  crmQuotesListValidTabFilterIds,
  selectCrmQuotesSidebarRecordEmail,
  selectCrmQuotesSidebarRecordId,
  selectCrmQuotesSidebarRecordName,
  selectCrmQuotesSidebarRecordPhone,
} from "./crmQuotesListPageShared";

const QUOTES_INITIAL_METRICS: Record<string, number> = {
  assigned_records: 0,
  unassigned_records: 0,
  pending_count: 0,
  expiring_soon_count: 0,
  pending_approval_count: 0,
  total_value: 0,
  signed_count: 0,
  scheduled_records: 0,
};

type SharedFilterParams = Omit<
  UseCrmListFiltersMetricsHistoryStateParams<any>,
  | "validFilters"
  | "defaultColumnIds"
  | "initialMetrics"
  | "sourceField"
  | "loadFailedMessage"
  | "selectedColumnsStorageKey"
  | "selectedColumnsLegacyStorageKeys"
>;

export type UseCrmQuotesListFiltersMetricsHistorySidebarStateParams =
  SharedFilterParams & {
    currentFilters: Record<string, any>;
    selectedProspect: any;
  };

/**
 * Quotes-specific layer on top of the shared filter/metrics/history hook.
 * Adds sidebar activity modals and quotes-specific config.
 */
export function useCrmQuotesListFiltersMetricsHistorySidebarState(
  params: UseCrmQuotesListFiltersMetricsHistorySidebarStateParams,
) {
  const {
    currentFilters,
    selectedProspect,
    ...sharedParams
  } = params;

  const base = useCrmListFiltersMetricsHistoryState({
    ...sharedParams,
    validFilters: [...crmQuotesListValidTabFilterIds],
    defaultColumnIds: [...crmQuotesListDefaultTableColumnIds],
    selectedColumnsStorageKey: CRM_QUOTES_LIST_VISIBLE_COLUMNS_STORAGE_KEY,
    selectedColumnsLegacyStorageKeys: [
      ...CRM_QUOTES_LIST_VISIBLE_COLUMNS_LEGACY_KEYS,
    ],
    initialMetrics: QUOTES_INITIAL_METRICS,
    sourceField: "source_file",
    loadFailedMessage: "Failed to load prospect",
  });

  const [showAllProspectStats, setShowAllProspectStats] = useState(false);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const {
    activitiesPanelRef: sidebarActivitiesPanelRef,
    recordId: sidebarRecordId,
    recordName: sidebarRecordName,
    recordPhone: sidebarRecordPhone,
    recordEmail: sidebarRecordEmail,
    activityModals: sidebarActivityModals,
  } = useCrmListSidebarActivityModals(selectedProspect, "prospect", {
    selectId: selectCrmQuotesSidebarRecordId,
    selectName: selectCrmQuotesSidebarRecordName,
    selectPhone: selectCrmQuotesSidebarRecordPhone,
    selectEmail: selectCrmQuotesSidebarRecordEmail,
  });

  return {
    ...base,
    prospectsSearch: base.search,
    setProspectsSearch: base.setSearch,
    prospectsFilters: base.pageFilters,
    setProspectsFilters: base.setPageFilters,
    prospectsViewMode: base.viewMode,
    setProspectsViewMode: base.setViewMode,
    totalAllQuotes: base.totalAll,
    setTotalAllQuotes: base.setTotalAll,
    showAllProspectStats,
    setShowAllProspectStats,
    memoizedFilters,
    sidebarActivitiesPanelRef,
    sidebarRecordId,
    sidebarRecordName,
    sidebarRecordPhone,
    sidebarRecordEmail,
    sidebarActivityModals,
  };
}
