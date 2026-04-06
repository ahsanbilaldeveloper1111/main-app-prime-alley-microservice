import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import type { TabConfig } from "@components/GenericTable";
import { loadVisibleColumnKeys } from "@utils/crmListVisibleColumnsStorage";
import {
  useCrmListPageTabCreateContactAndFilter,
  type CrmListContactSidebarParams,
} from "@hooks/useCrmListPageTabCreateContactAndFilter";
import { getCrmDataHistory, type CrmDataItem } from "@utils/crm";
import type { CrmListContactFormState } from "@utils/crmContactFormFromCrmItem";
import {
  collectUniqueCampaignIdsFromHistoryActivities,
  fetchCrmCampaignIdToNameMap,
} from "@crm/billing-quotes/crmQuotesListPageShared";

type CrmListPagination = {
  currentPage: number;
  rowsPerPage: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
};

const DEFAULT_PAGE_FILTERS = {
  assignedTo: null as string | null,
  campaigns: null as string[] | null,
  nextCallDateFrom: null as string | null,
  nextCallDateTo: null as string | null,
  sourceFile: null as string | null,
  tags: null as string[] | null,
};

const DEFAULT_HISTORY_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: 0,
  to: 0,
};

export type UseCrmListFiltersMetricsHistoryStateParams<M> = {
  router: NextRouter;
  validFilters: string[];
  defaultColumnIds: string[];
  /** When set, initial column selection is restored from localStorage. */
  selectedColumnsStorageKey?: string;
  selectedColumnsLegacyStorageKeys?: readonly string[];
  initialMetrics: M;
  setCampaignsById: Dispatch<SetStateAction<Record<number, string>>>;
} & CrmListContactSidebarParams<CrmListContactFormState>;

/**
 * Shared filter / pagination / metrics / history state for CRM list pages
 * (contacts, prospects, billing-quotes). Eliminates ~100 lines of duplication per page.
 */
export function useCrmListFiltersMetricsHistoryState<M>(
  params: UseCrmListFiltersMetricsHistoryStateParams<M>,
) {
  const {
    router,
    validFilters,
    defaultColumnIds,
    selectedColumnsStorageKey,
    selectedColumnsLegacyStorageKeys,
    initialMetrics,
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
    sourceField,
    loadFailedMessage,
    seedNewContactForm,
  } = params;

  const [activeFilter, setActiveFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [pageFilters, setPageFilters] = useState({ ...DEFAULT_PAGE_FILTERS });
  const [viewMode, setViewMode] = useState<"table" | "board">("table");

  const defaultSelectedColumns = [...defaultColumnIds];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (!selectedColumnsStorageKey) {
      return defaultSelectedColumns;
    }
    return loadVisibleColumnKeys(
      selectedColumnsStorageKey,
      defaultColumnIds,
      defaultColumnIds,
      selectedColumnsLegacyStorageKeys,
    );
  });

  const [pagination, setPagination] = useState<CrmListPagination>({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
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
    sourceField,
    loadFailedMessage,
    seedNewContactForm,
  });

  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [metrics, setMetrics] = useState<M>(initialMetrics);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState(
    DEFAULT_HISTORY_PAGINATION,
  );

  const fetchCampaignsByIds = useCallback(
    async (campaignIds: number[]) => {
      const campaignsMap = await fetchCrmCampaignIdToNameMap(campaignIds);
      setCampaignsById((prev) => ({ ...prev, ...campaignsMap }));
      return campaignsMap;
    },
    [setCampaignsById],
  );

  const fetchHistoryData = useCallback(
    async (page: number = 1) => {
      try {
        setHistoryLoading(true);
        const response = await getCrmDataHistory(page, 15);
        setHistoryData(response.data);
        setHistoryPagination(response.pagination);

        const uniqueCampaignIds =
          collectUniqueCampaignIdsFromHistoryActivities(response.data);
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

  return {
    validFilters,
    activeFilter,
    setActiveFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    search,
    setSearch,
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
    pageFilters,
    setPageFilters,
    viewMode,
    setViewMode,
    defaultSelectedColumns,
    selectedColumns,
    setSelectedColumns,
    pagination,
    setPagination,
    dataList,
    setDataList,
    totalRecords,
    setTotalRecords,
    totalAll,
    setTotalAll,
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
  };
}
