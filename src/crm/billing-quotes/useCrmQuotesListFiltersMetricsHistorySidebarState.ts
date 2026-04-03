import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import type { CrmActivitiesPanelRef } from "@components/CrmActivitiesPanel";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import type { CrmListContactFormState } from "@utils/crmContactFormFromCrmItem";
import { useCrmListFiltersMetricsHistoryState } from "@crm/shared/useCrmListFiltersMetricsHistoryState";
import {
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

export type UseCrmQuotesListFiltersMetricsHistorySidebarStateParams = {
  router: NextRouter;
  currentFilters: Record<string, any>;
  selectedProspect: any;
  setCampaignsById: Dispatch<SetStateAction<Record<number, string>>>;
  showAddContactsDropdown: boolean;
  setShowAddContactsDropdown: Dispatch<SetStateAction<boolean>>;
  addContactsRef: RefObject<HTMLDivElement | null>;
  showCreateContactSidebar: boolean;
  setShowCreateContactSidebar: Dispatch<SetStateAction<boolean>>;
  editingContactId: number | null;
  setEditingContactId: Dispatch<SetStateAction<number | null>>;
  setContactForm: Dispatch<SetStateAction<CrmListContactFormState>>;
  setContactFormLoadError: Dispatch<SetStateAction<string | null>>;
  setContactFormLoading: Dispatch<SetStateAction<boolean>>;
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
    initialMetrics: QUOTES_INITIAL_METRICS,
    sourceField: "source_file",
    loadFailedMessage: "Failed to load prospect",
  });

  const [showAllProspectStats, setShowAllProspectStats] = useState(false);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const sidebarActivitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);
  const sidebarRecordId = selectCrmQuotesSidebarRecordId(selectedProspect);
  const sidebarRecordName = selectCrmQuotesSidebarRecordName(selectedProspect);
  const sidebarRecordPhone = selectCrmQuotesSidebarRecordPhone(selectedProspect);
  const sidebarRecordEmail =
    selectCrmQuotesSidebarRecordEmail(selectedProspect);

  const sidebarActivityModals = useCrmActivityModals({
    recordType: "prospect",
    recordId: sidebarRecordId,
    recordName: sidebarRecordName,
    recordEmail: sidebarRecordEmail,
    recordPhone: sidebarRecordPhone,
    onTaskCreated: () => sidebarActivitiesPanelRef.current?.refetchTasks?.(),
    onNoteCreated: () => sidebarActivitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => sidebarActivitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () =>
      sidebarActivitiesPanelRef.current?.refetchMeetings?.(),
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
