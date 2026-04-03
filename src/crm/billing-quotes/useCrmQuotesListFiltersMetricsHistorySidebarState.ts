import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import type { TabConfig } from "@components/GenericTable";
import type { CrmActivitiesPanelRef } from "@components/CrmActivitiesPanel";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import { useCrmListPageTabCreateContactAndFilter } from "@hooks/useCrmListPageTabCreateContactAndFilter";
import {
  getCrmDataHistory,
  type CrmDataItem,
} from "@utils/crm";
import type { CrmListContactFormState } from "@utils/crmContactFormFromCrmItem";
import {
  collectUniqueCampaignIdsFromHistoryActivities,
  crmQuotesListDefaultTableColumnIds,
  crmQuotesListValidTabFilterIds,
  fetchCrmCampaignIdToNameMap,
  selectCrmQuotesSidebarRecordEmail,
  selectCrmQuotesSidebarRecordId,
  selectCrmQuotesSidebarRecordName,
  selectCrmQuotesSidebarRecordPhone,
} from "./crmQuotesListPageShared";

type QuotesListPagination = {
  currentPage: number;
  rowsPerPage: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
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
 * Tab filters, table pagination, metrics, history + campaign name hydration, and
 * sidebar activity modals — shared between CRM and billing quotes list pages.
 */
export function useCrmQuotesListFiltersMetricsHistorySidebarState(
  params: UseCrmQuotesListFiltersMetricsHistorySidebarStateParams,
) {
  const {
    router,
    currentFilters,
    selectedProspect,
    setCampaignsById,
    showAddContactsDropdown,
    setShowAddContactsDropdown,
    addContactsRef,
    showCreateContactSidebar,
    setShowCreateContactSidebar,
    editingContactId,
    setEditingContactId,
    setContactForm,
    setContactFormLoadError,
    setContactFormLoading,
  } = params;

  const validFilters = [...crmQuotesListValidTabFilterIds];

  const [showAllProspectStats, setShowAllProspectStats] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [prospectsSearch, setProspectsSearch] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [prospectsFilters, setProspectsFilters] = useState({
    assignedTo: null as string | null,
    campaigns: null as string[] | null,
    nextCallDateFrom: null as string | null,
    nextCallDateTo: null as string | null,
    sourceFile: null as string | null,
    tags: null as string[] | null,
  });
  const [prospectsViewMode, setProspectsViewMode] = useState<
    "table" | "board"
  >("table");

  const defaultSelectedColumns = [...crmQuotesListDefaultTableColumnIds];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    () => defaultSelectedColumns,
  );

  const [pagination, setPagination] = useState<QuotesListPagination>({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAllQuotes, setTotalAllQuotes] = useState(0);
  const [loading, setLoading] = useState(false);

  const { handleFilterChange } = useCrmListPageTabCreateContactAndFilter({
    router,
    validFilters,
    setActiveFilter,
    setPagination,
    setLoading,
    showAddContactsDropdown,
    setShowAddContactsDropdown,
    addContactsRef,
    showCreateContactSidebar,
    setShowCreateContactSidebar,
    editingContactId,
    setEditingContactId,
    setContactForm,
    setContactFormLoadError,
    setContactFormLoading,
    sourceField: "source_file",
    loadFailedMessage: "Failed to load prospect",
  });

  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    assigned_records: 0,
    unassigned_records: 0,
    pending_count: 0,
    expiring_soon_count: 0,
    pending_approval_count: 0,
    total_value: 0,
    signed_count: 0,
  });

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });

  const fetchCampaignsByIds = useCallback(async (campaignIds: number[]) => {
    const campaignsMap = await fetchCrmCampaignIdToNameMap(campaignIds);
    setCampaignsById((prev) => ({ ...prev, ...campaignsMap }));
    return campaignsMap;
  }, [setCampaignsById]);

  const fetchHistoryData = useCallback(
    async (page: number = 1) => {
      try {
        setHistoryLoading(true);
        const response = await getCrmDataHistory(page, 15);
        console.log("ZE HISTORY DATA", response);
        setHistoryData(response.data);
        setHistoryPagination(response.pagination);

        const uniqueCampaignIds = collectUniqueCampaignIdsFromHistoryActivities(
          response.data,
        );
        if (uniqueCampaignIds.length > 0) {
          await fetchCampaignsByIds(uniqueCampaignIds);
        }
      } catch (error) {
        console.error("Failed to fetch history data:", error);
        setHistoryData([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [fetchCampaignsByIds],
  );

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
    validFilters,
    showAllProspectStats,
    setShowAllProspectStats,
    activeFilter,
    setActiveFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    prospectsSearch,
    setProspectsSearch,
    showColumnEditor,
    setShowColumnEditor,
    showExportModal,
    setShowExportModal,
    exporting,
    setExporting,
    exportFilters,
    setExportFilters,
    exportFileName,
    setExportFileName,
    showTabModal,
    setShowTabModal,
    customTabs,
    setCustomTabs,
    prospectsFilters,
    setProspectsFilters,
    prospectsViewMode,
    setProspectsViewMode,
    defaultSelectedColumns,
    selectedColumns,
    setSelectedColumns,
    pagination,
    setPagination,
    dataList,
    setDataList,
    totalRecords,
    setTotalRecords,
    totalAllQuotes,
    setTotalAllQuotes,
    loading,
    setLoading,
    handleFilterChange,
    clearSelectedRows,
    setClearSelectedRows,
    metrics,
    setMetrics,
    historyData,
    setHistoryData,
    historyLoading,
    setHistoryLoading,
    historyPagination,
    setHistoryPagination,
    fetchCampaignsByIds,
    fetchHistoryData,
    memoizedFilters,
    sidebarActivitiesPanelRef,
    sidebarRecordId,
    sidebarRecordName,
    sidebarRecordPhone,
    sidebarRecordEmail,
    sidebarActivityModals,
  };
}
