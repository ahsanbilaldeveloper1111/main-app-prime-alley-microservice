import "@assets/scss/datatable-style.scss";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import {
  Users,
  Calendar,
  XCircle,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  Download,
  Phone as PhoneIcon,
  History,
  FileText,
  Target,
  MessageCircle,
} from "lucide-react";
import CreateLeadModal from "@components/CreateLeadModal";
import GenericTable from "@components/GenericTable";

import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { StatsCardData } from "@components/GenericStatsCards";
import {
  CrmDataItem,
  CrmDataMetrics,
  CrmDataResponse,
  downloadExampleCsv,
  updateCrmData,
} from "@utils/crm";
import { buildCrmPersonListRowDispositionUpdatePayload } from "@utils/crmPersonDispositionQuickUpdate";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import {
  RECORD_TYPES,
  formatCrmPreviewDate,
  normalizeSearchQuery,
} from "@utils/Helper";
import {
  useCrmToolbarConfig,
  type CrmEntityType,
} from "@hooks/useCrmToolbarConfig";
import ColumnEditorModal from "@components/ColumnEditorModal";
import CrmExportModal from "@components/CrmExportModal";
import {
  type CrmActivitiesPanelRef,
} from "@components/CrmActivitiesPanel";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import { useCrmLogActivityModals } from "@hooks/useCrmLogActivityModals";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import {
  createEmptyCrmListContactFormState,
  resolveDefaultContactOwnerExtension,
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import { useCrmListAssignmentContactSidebarState } from "@crm/shared/useCrmListAssignmentContactSidebarState";
import { useCrmListPageCoreState } from "@crm/shared/useCrmListPageCoreState";
import { useCrmListFiltersMetricsHistoryState } from "@crm/shared/useCrmListFiltersMetricsHistoryState";
import { useCrmListContactFormHandlers } from "@crm/shared/useCrmListContactFormHandlers";
import { useCrmListSharedCallbacks } from "@crm/shared/useCrmListSharedCallbacks";
import { useCrmListSideEffects } from "@crm/shared/useCrmListSideEffects";
import { useCrmListFilterActions } from "@crm/shared/useCrmListFilterActions";
import { useCrmListDataOperations } from "@crm/shared/useCrmListDataOperations";
import { useCrmListNavigationHandlers } from "@crm/shared/useCrmListNavigationHandlers";
import { CrmListCreateContactSidebar } from "@crm/shared/CrmListCreateContactSidebar";
import { CrmListPipelineModals } from "@crm/shared/CrmListPipelineModals";
import { useCrmListCallRecordingViewModalState } from "@crm/shared/useCrmListCallRecordingViewModalState";
import { CrmProspectsListExportModalFiltersBody } from "@crm/shared/CrmProspectsListExportModalFiltersBody";
import { CrmProspectsListAddTabModal } from "@crm/shared/CrmProspectsListAddTabModal";
import { buildCrmProspectsListPipelineModalsProps } from "@crm/shared/buildCrmProspectsListPipelineModalsProps";
import { getCrmProspectsDataListGenericTableSharedProps } from "@crm/shared/getCrmProspectsDataListGenericTableSharedProps";
import { CrmListViewDataModal } from "@crm/shared/CrmListViewDataModal";
import type { CrmProspectsContactsListPageConfig } from "@crm/shared/crmProspectsContactsListPageConfig";
import { CrmListDeleteModalAdditionalInfo } from "@crm/shared/CrmListDeleteModalAdditionalInfo";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useCrmListAdvancedFilterPills } from "@crm/shared/useCrmListAdvancedFilterPills";
import { buildCrmProspectsContactsTableColumns } from "@crm/shared/crmProspectsContactsListPageTableColumns";
import { buildCrmProspectsContactsTableActions } from "@crm/shared/crmProspectsContactsListPageTableActions";
import { CrmProspectsContactsAddContactsButton } from "@crm/shared/CrmProspectsContactsAddContactsButton";
import {
  buildProspectsContactsAppliedFiltersPayload,
  fetchCrmProspectsEntryCountsForFilters,
  getProspectsContactsDeleteModalItemName,
  isProspectsUnfilteredBaselineListContext,
  mergeCrmProspectsToolbarFilterPills,
  persistCrmProspectsContactsSelectedColumns,
  resetActiveFilterIfRemovedTabMatches,
} from "@crm/shared/crmProspectsContactsListPageHelpers";
import { renderCrmProspectsKanbanTableCustomBody } from "@crm/shared/crmProspectsContactsListPageKanbanCustomBody";
import { prospectsTableRowDoubleClick } from "@crm/shared/crmProspectsContactsListPageTableRowHandlers";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

function resolveDeleteModalProps(
  mode: "single" | "bulk" | null,
  handlers: { bulk: () => void; single: () => void },
  copy: { itemTypeBulk: string; itemTypeSingle: string },
) {
  return {
    onConfirm: mode === "bulk" ? handlers.bulk : handlers.single,
    itemType: mode === "bulk" ? copy.itemTypeBulk : copy.itemTypeSingle,
  };
}

function resolveNumericProspectId(prospect: any): number {
  const raw = prospect?.id ?? prospect?.data?.id ?? prospect?.data?.data?.id ?? Number.NaN;
  return Number(raw);
}

export function CrmProspectsContactsListPage({
  config,
}: Readonly<{
  config: CrmProspectsContactsListPageConfig;
}>) {
  const {
    session,
    router,
    dialNumber,
    isInitialized,
    refreshKey,
    setRefreshKey,
    currentFilters,
    setCurrentFilters,
    selectedFile,
    setSelectedFile,
    showUploadModal,
    setShowUploadModal,
    showViewModal,
    setShowViewModal,
    selectedDataItem,
    setSelectedDataItem,
    showDeleteModal,
    setShowDeleteModal,
    itemToDelete,
    setItemToDelete,
    showDataAssignmentModal,
    setShowDataAssignmentModal,
    showAfterCallModal,
    setShowAfterCallModal,
    extensions,
    setExtensions,
    fieldTags,
    setFieldTags,
    showConvertToLeadModal,
    setShowConvertToLeadModal,
    convertingToLeadCrmRecordId,
    setConvertingToLeadCrmRecordId,
  } = useCrmListPageCoreState();

  const [deleteModalMode, setDeleteModalMode] = useState<
    "single" | "bulk" | null
  >(null);

  /** Snapshotted “All prospects” total from an unfiltered baseline list load (see widget handlers). */
  const [baselineAllProspectsCount, setBaselineAllProspectsCount] = useState<
    number | null
  >(null);

  const [tableMaxHeight, setTableMaxHeight] = useState("calc(100vh - 405px)");
  const [sidebarMarginTop, setSidebarMarginTop] = useState<number>(0);

  const afterProspectsRemovedRef = useRef<(ids: readonly number[]) => void>(
    () => {},
  );

  const {
    assignmentFilters,
    setAssignmentFilters,
    assignmentCampaign,
    setAssignmentCampaign,
    assignmentDistribution,
    setAssignmentDistribution,
    totalEntriesToAssign,
    setTotalEntriesToAssign,
    customDistribution,
    setCustomDistribution,
    assignmentCounts,
    setAssignmentCounts,
    availableTags,
    setAvailableTags,
    availableCampaigns,
    setAvailableCampaigns,
    campaignsById,
    setCampaignsById,
    campaignStatusById,
    setCampaignStatusById,
    selectedItems,
    setSelectedItems,
    afterCallData,
    setAfterCallData,
    showScheduleModal,
    setShowScheduleModal,
    selectedEntryForSchedule,
    setSelectedEntryForSchedule,
    isEditingSchedule,
    setIsEditingSchedule,
    scheduleData,
    setScheduleData,
    showUnscheduleModal,
    setShowUnscheduleModal,
    entryToUnschedule,
    setEntryToUnschedule,
    showHistoryModal,
    setShowHistoryModal,
    showProspectSidebar,
    setShowProspectSidebar,
    showFiltersSidebar,
    setShowFiltersSidebar,
    selectedProspect,
    setSelectedProspect,
    sidebarProspectFetchTokenRef,
    showFilterBar: _prospectsListFilterBarVisible,
    setShowFilterBar: _setProspectsListFilterBarVisible,
    showAddContactsDropdown,
    setShowAddContactsDropdown,
    showCreateContactSidebar,
    setShowCreateContactSidebar,
    addContactsRef,
    contactForm,
    setContactForm,
    createContactLoading,
    setCreateContactLoading,
    editingContactId,
    setEditingContactId,
    contactFormLoadError,
    setContactFormLoadError,
    contactFormLoading,
    setContactFormLoading,
  } = useCrmListAssignmentContactSidebarState();

  const seedNewContactForm = useCallback(
    () =>
      createEmptyCrmListContactFormState("source_file", {
        defaultContactOwner: resolveDefaultContactOwnerExtension(
          session?.user,
          extensions,
        ),
      }),
    [session?.user, extensions],
  );

  const deleteModalItemName = useMemo(
    () =>
      getProspectsContactsDeleteModalItemName(
        deleteModalMode,
        itemToDelete,
        selectedItems.length,
        config.deleteModalCopy,
      ),
    [
      deleteModalMode,
      itemToDelete,
      selectedItems.length,
      config.deleteModalCopy,
    ],
  );

  const {
    callRecordings,
    callRecordingsLoading,
    callRecordingsTotal,
    selectedRecording,
    setSelectedRecording,
    showRecordingPlayerModal,
    setShowRecordingPlayerModal,
    downloadingRecordings,
    setDownloadingRecordings,
    downloadProgress,
    setDownloadProgress,
  } = useCrmListCallRecordingViewModalState();

  const {
    activeFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    search: prospectsSearch,
    setSearch: setProspectsSearch,
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
    pageFilters: prospectsFilters,
    setPageFilters: setProspectsFilters,
    viewMode: prospectsViewMode,
    setViewMode: setProspectsViewMode,
    selectedColumns,
    setSelectedColumns,
    pagination,
    setPagination,
    dataList,
    setDataList,
    totalRecords,
    setTotalRecords,
    totalAll: totalAllProspects,
    setTotalAll: setTotalAllProspects,
    loading,
    setLoading,
    handleFilterChange,
    clearSelectedRows,
    setClearSelectedRows,
    metrics,
    setMetrics,
    historyData,
    historyLoading,
    historyPagination,
    fetchHistoryData,
  } = useCrmListFiltersMetricsHistoryState<CrmDataMetrics>({
    router,
    validFilters: ["all", "scheduled", "has_leads"],
    defaultColumnIds: [
      "name", "phone", "source_file", "user_extension", "campaign",
      "disposition",
      "scheduled_call_at", "tags",
    ],
    selectedColumnsStorageKey: config.selectedColumnsStorageKey,
    selectedColumnsLegacyStorageKeys: config.selectedColumnsLegacyStorageKeys,
    initialMetrics: {
      assigned_records: 0,
      unassigned_records: 0,
      scheduled_records: 0,
      not_scheduled_records: 0,
      scheduled_next_hour_records: 0,
      scheduled_next_24_hours_records: 0,
    },
    setCampaignsById,
    showAddContactsDropdown,
    setShowAddContactsDropdown,
    addContactsRef,
    showCreateContactSidebar,
    setShowCreateContactSidebar,
    editingContactId,
    setEditingContactId,
    setContactForm: setContactForm as Dispatch<
      SetStateAction<CrmListContactFormState>
    >,
    setContactFormLoadError,
    setContactFormLoading,
    sourceField: "source_file",
    loadFailedMessage: config.listLoadFailedMessage,
    seedNewContactForm,
  });

  // When users drill into "Converted Prospects" via widget click, ensure the active
  // `has_leads` tab exists so the toolbar shows the correct label.
  useEffect(() => {
    if (activeFilter !== "has_leads") return;
    setCustomTabs((prev) => {
      if (prev.some((t) => t.id === "has_leads")) return prev;
      return [
        ...prev,
        {
          id: "has_leads",
          label: config.stats.convertedCardTitle,
          removable: true,
        },
      ];
    });
  }, [activeFilter, config.stats.convertedCardTitle, setCustomTabs]);

  useEffect(() => {
    const updateMaxHeight = () => {
      const toolbarEl = document.querySelector<HTMLElement>(
        ".gt-toolbar-container",
      );
      if (toolbarEl) {
        const toolbarHeight = toolbarEl.getBoundingClientRect().height;
        const headerHeight = 74;
        const paginationHeight = 130;
        const buffer = 0;
        setTableMaxHeight(
          `calc(100vh - ${headerHeight + toolbarHeight + paginationHeight + buffer}px)`,
        );
      }
    };
    const timer = setTimeout(updateMaxHeight, 100);
    const observer = new ResizeObserver(updateMaxHeight);
    const toolbarEl = document.querySelector<HTMLElement>(
      ".gt-toolbar-container",
    );
    if (toolbarEl) observer.observe(toolbarEl);
    window.addEventListener("resize", updateMaxHeight);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", updateMaxHeight);
    };
  }, []);

  useEffect(() => {
    const updateSidebarMarginTop = () => {
      const tabsEl = document.querySelector<HTMLElement>('.gt-toolbar-tabs-section');
      if (tabsEl) {
        setSidebarMarginTop(Math.round(tabsEl.getBoundingClientRect().height));
      }
    };
    const timer = setTimeout(updateSidebarMarginTop, 100);
    window.addEventListener('resize', updateSidebarMarginTop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSidebarMarginTop);
    };
  }, []);

  const prospectsCalculateEntryCounts = useCallback(async () => {
    return fetchCrmProspectsEntryCountsForFilters(assignmentFilters);
  }, [assignmentFilters]);

  const callRecordingDownloadProgressProps =
    config.callRecordingExtras.passDownloadProgressToSharedCallbacks
      ? { setDownloadingRecordings, setDownloadProgress }
      : {};

  const {
    showSuccessfulModal, setShowSuccessfulModal,
    successModalTitle, setSuccessModalTitle,
    successModalDescription, setSuccessModalDescription,
    handleDataAssignmentSubmit, handleDataAssignmentModalClose,
    handleAfterCallSubmit,
    handleScheduleCall, handleUnscheduleCallClick, confirmUnscheduleCall,
    handleScheduleModalClose, handleScheduleSubmit, handleScheduledCallStatusChange,
    handleCallClick, handleBulkDelete, handleDeleteData,
    openSidebar: openProspectSidebar, handleViewData,
    handlePlayCallRecording, handleDownloadCallRecording,
  } = useCrmListSharedCallbacks({
    session, setRefreshKey, selectedDataItem, setSelectedDataItem,
    setShowDataAssignmentModal, setShowAfterCallModal, setShowDeleteModal, setItemToDelete,
    dialNumber, isInitialized,
    assignmentFilters, setAssignmentFilters, assignmentCampaign, setAssignmentCampaign,
    assignmentDistribution, setAssignmentDistribution, totalEntriesToAssign, setTotalEntriesToAssign,
    customDistribution, setCustomDistribution, setAssignmentCounts,
    afterCallData, setAfterCallData,
    setShowScheduleModal, setSelectedEntryForSchedule, isEditingSchedule, setIsEditingSchedule,
    scheduleData, setScheduleData, selectedEntryForSchedule,
    setShowUnscheduleModal, entryToUnschedule, setEntryToUnschedule,
    selectedItems, setSelectedItems, clearSelectedRows, setClearSelectedRows, setDeleteModalMode,
    sidebarFetchTokenRef: sidebarProspectFetchTokenRef,
    setSelectedRecord: setSelectedProspect,
    setShowSidebar: setShowProspectSidebar,
    setSelectedRecording, setShowRecordingPlayerModal,
    ...callRecordingDownloadProgressProps,
    calculateEntryCounts: prospectsCalculateEntryCounts,
    onAfterBulkDelete: (ids) => afterProspectsRemovedRef.current(ids),
  });

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const sidebarActivitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);
  const sidebarRecordId = config.selectSidebarRecordId(selectedProspect);
  const sidebarRecordName = config.selectSidebarRecordName(selectedProspect);
  const sidebarRecordPhone = config.selectSidebarRecordPhone(selectedProspect);
  const sidebarRecordEmail =
    config.selectSidebarRecordEmail(selectedProspect);

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

  // "Log a Call / Email / SMS / WhatsApp / Meeting" — manual history entries
  // (no actual send). These are wired into the GenericSidebar "more actions"
  // overflow so each click opens a dedicated dialog where the user picks the
  // time and subject; on submit we POST to /crm/audit-logs.
  const sidebarLogActivityModals = useCrmLogActivityModals({
    recordType: "prospect",
    recordId: sidebarRecordId,
    recordName: sidebarRecordName,
    recordPhone: sidebarRecordPhone,
    recordEmail: sidebarRecordEmail,
    onLogged: () => {
      // The audit log feeds the record's history / activity audit trail —
      // refetch whatever the activities panel surfaces so the new entry
      // shows up immediately without needing a manual reload.
      sidebarActivitiesPanelRef.current?.refetchNotes?.();
    },
  });

  const buildCrmDataParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) =>
      config.buildListCrmDataParams(memoizedFilters, pagination, overrides),
    [
      config,
      memoizedFilters,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortBy,
      pagination.sortOrder,
    ],
  );

  const buildExportParams = useCallback(
    (
      filters: Record<string, any>,
      overrides: { page?: number; per_page?: number } = {},
    ) => config.buildExportCrmDataParams(filters, overrides),
    [config],
  );

  const uniqueSources = useMemo(
    () => config.buildSourceFileSelectOptions(dataList),
    [config, dataList],
  );

  const { getNameByExtension } = useCrmListSideEffects({
    refreshKey,
    showHistoryModal,
    fetchHistoryData,
    activeFilter,
    clearSelectedRows,
    showExportModal,
    currentFilters,
    entityName: config.operationsEntityName,
    extensions,
    setExtensions,
    setAvailableTags,
    setAvailableCampaigns,
    setCampaignsById,
    setCampaignStatusById,
    setSelectedItems,
    setCurrentFilters,
    setExportFilters,
    setExportFileName,
  });

  const { handleFiltersChange, applyTableFiltersPatch, hasAdvancedFiltersApplied } = useCrmListFilterActions({
    currentFilters,
    setCurrentFilters,
    setRefreshKey,
    setPagination,
    computeAdvancedFiltersApplied: config.computeAdvancedFiltersApplied,
  });

  const handleResetListScope = useCallback(() => {
    setProspectsSearch("");
    setProspectsFilters({
      assignedTo: null,
      campaigns: null,
      nextCallDateFrom: null,
      nextCallDateTo: null,
      sourceFile: null,
      tags: null,
    });
    handleFiltersChange({});
    handleFilterChange("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((prev) => prev + 1);
  }, [
    handleFiltersChange,
    handleFilterChange,
    setProspectsSearch,
    setProspectsFilters,
    setPagination,
    setRefreshKey,
  ]);

  const clearProspectsWidgetFiltersPatch = useMemo(
    () => ({
      scheduled_call_from: undefined,
      scheduled_call_to: undefined,
      scheduled_call_status: undefined,
      last_called_at_from: undefined,
      last_called_at_to: undefined,
      has_tickets: undefined,
    }),
    [],
  );

  /** Prospects: All prospects metric → All tab + clear widget filters. */
  const handleProspectAllMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") return;
    handleFilterChange("all");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      has_scheduled_calls: undefined,
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  /** Prospects only: Overdue → Scheduled tab + `scheduled_call_status=overdue` (same as companies CRM). */
  const handleProspectOverdueMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") {
      return;
    }
    handleFilterChange("scheduled");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      scheduled_call_status: "overdue",
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  /**
   * Prospects: Upcoming → Scheduled tab + `scheduled_call_from` = now (ISO).
   * If past calls still appear, the API may ignore this filter alongside `has_scheduled_calls` — verify BE.
   */
  const handleProspectUpcomingMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") {
      return;
    }
    handleFilterChange("scheduled");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      scheduled_call_from: new Date().toISOString(),
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  /** Prospects: Converted metric → Has leads tab. */
  const handleProspectConvertedMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") {
      return;
    }
    handleFilterChange("has_leads");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      has_scheduled_calls: undefined,
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  /** Prospects: Recently contacted metric → All tab + last activity filter (last 24h). */
  const handleProspectRecentlyContactedMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") return;
    const nowIso = new Date().toISOString();
    const fromIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    handleFilterChange("all");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      has_scheduled_calls: undefined,
      last_called_at_from: fromIso,
      last_called_at_to: nowIso,
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  /** Prospects: Not contacted metric → All tab + explicit has_scheduled_calls=false (supported by API). */
  const handleProspectNotContactedMetricClick = useCallback(() => {
    if (config.operationsEntityName !== "prospects") return;
    handleFilterChange("all");
    applyTableFiltersPatch({
      ...clearProspectsWidgetFiltersPatch,
      has_scheduled_calls: false,
    });
  }, [
    applyTableFiltersPatch,
    clearProspectsWidgetFiltersPatch,
    config.operationsEntityName,
    handleFilterChange,
  ]);

  const prospectsSkipTotalAllUpdate = useMemo(
    () =>
      config.operationsEntityName === "prospects" &&
      !isProspectsUnfilteredBaselineListContext({
        activeFilter,
        search: prospectsSearch,
        currentFilters: memoizedFilters,
        hasAdvancedFiltersApplied,
      }),
    [
      activeFilter,
      config.operationsEntityName,
      hasAdvancedFiltersApplied,
      memoizedFilters,
      prospectsSearch,
    ],
  );

  const prospectsAllCountDisplay = useMemo(() => {
    if (config.operationsEntityName !== "prospects") {
      return totalAllProspects;
    }
    return baselineAllProspectsCount ?? totalAllProspects;
  }, [baselineAllProspectsCount, config.operationsEntityName, totalAllProspects]);

  const handleProspectsBaselineListResponse = useCallback(
    (response: CrmDataResponse) => {
      if (config.operationsEntityName !== "prospects") {
        return;
      }
      if (
        !isProspectsUnfilteredBaselineListContext({
          activeFilter,
          search: prospectsSearch,
          currentFilters: memoizedFilters,
          hasAdvancedFiltersApplied,
        })
      ) {
        return;
      }
      const v = Number(response?.metrics?.total_all_records);
      if (Number.isFinite(v)) {
        setBaselineAllProspectsCount(v);
      }
    },
    [
      activeFilter,
      config.operationsEntityName,
      hasAdvancedFiltersApplied,
      memoizedFilters,
      prospectsSearch,
    ],
  );

  const {
    fetchCrmData,
    handleExport: handleProspectsExport,
    handleFileInputChange,
    handleUpload,
    confirmDelete,
  } = useCrmListDataOperations({
    entityName: config.operationsEntityName,
    memoizedFilters,
    buildCrmDataParams,
    buildExportParams,
    buildExportHeaders: config.buildExportHeaders,
    buildCsvContent: config.buildCsvContent,
    validateUploadCsvFile: config.validateUploadCsvFile,
    setLoading,
    setDataList,
    setTotalRecords,
    setTotalAll: setTotalAllProspects,
    setMetrics,
    setExporting,
    setShowExportModal,
    setSelectedFile,
    setFieldTags,
    setShowUploadModal,
    setRefreshKey,
    setShowDeleteModal,
    setDeleteModalMode,
    setItemToDelete,
    setSelectedItems,
    setSuccessModalTitle,
    setSuccessModalDescription,
    setShowSuccessfulModal,
    exportFileName,
    exportFilters,
    selectedFile,
    fieldTags,
    itemToDelete,
    session,
    refreshKey,
    activeFilter,
    pagination,
    onSingleRecordDeleted: (deletedId) =>
      afterProspectsRemovedRef.current([deletedId]),
    skipTotalAllUpdate: prospectsSkipTotalAllUpdate,
    onListResponse: handleProspectsBaselineListResponse,
  });

  const dispositionQuickUpdateInFlightRef = useRef<Set<number>>(new Set());

  const handleDispositionQuickUpdate = useCallback(
    async (row: any, dispositionValue: string) => {
      const id = row?.id;
      if (typeof id !== "number") {
        return;
      }
      if (dispositionQuickUpdateInFlightRef.current.has(id)) {
        return;
      }
      dispositionQuickUpdateInFlightRef.current.add(id);
      try {
        const payload = buildCrmPersonListRowDispositionUpdatePayload(
          row as CrmDataItem & Record<string, unknown>,
          dispositionValue,
        );
        await updateCrmData(id, payload);
        fetchCrmData();
      } catch {
        // Errors are surfaced by updateCrmData
      } finally {
        dispositionQuickUpdateInFlightRef.current.delete(id);
      }
    },
    [fetchCrmData],
  );

  const {
    handleCloseSidebar: handleCloseProspectSidebarCore,
    handleOpenFiltersSidebar,
    handleCloseFiltersSidebar,
    handlePreviewClick: handlePreviewClickCore,
    handleFirstColumnClick,
  } = useCrmListNavigationHandlers({
    sidebarFetchTokenRef: sidebarProspectFetchTokenRef,
    setShowSidebar: setShowProspectSidebar,
    setSelectedRecord: setSelectedProspect,
    setShowFiltersSidebar,
    openSidebar: openProspectSidebar,
    router,
    buildDetailUrl: (row: any) => config.navigationDetailPath(row),
  });

  const previewPersistenceKey = config.previewPersistenceLocalStorageKey;
  /** Ensures we only attempt storage-based restore once per mount (not on every refetch). */
  const didInitialPreviewRestoreRef = useRef(false);

  const writePreviewIdToStorage = useCallback(
    (row: { id?: unknown }) => {
      const id = Number(row?.id);
      if (!Number.isFinite(id) || id <= 0) return;
      if (globalThis.window === undefined) return;
      try {
        globalThis.localStorage.setItem(previewPersistenceKey, String(id));
      } catch {
        /* quota / private mode */
      }
    },
    [previewPersistenceKey],
  );

  const clearPreviewIdFromStorage = useCallback(() => {
    if (globalThis.window === undefined) return;
    try {
      globalThis.localStorage.removeItem(previewPersistenceKey);
    } catch {
      /* ignore */
    }
  }, [previewPersistenceKey]);

  /** User dismissed preview (X): close and forget persisted id. */
  const handleCloseProspectSidebar = useCallback(() => {
    handleCloseProspectSidebarCore();
    clearPreviewIdFromStorage();
  }, [handleCloseProspectSidebarCore, clearPreviewIdFromStorage]);

  useEffect(() => {
    afterProspectsRemovedRef.current = (ids: readonly number[]) => {
      const selId = selectedProspect?.id;
      if (selId != null && ids.includes(Number(selId))) {
        handleCloseProspectSidebar();
      }
      if (
        convertingToLeadCrmRecordId != null &&
        ids.includes(convertingToLeadCrmRecordId)
      ) {
        setShowConvertToLeadModal(false);
        setConvertingToLeadCrmRecordId(null);
      }
    };
  }, [
    selectedProspect?.id,
    convertingToLeadCrmRecordId,
    handleCloseProspectSidebar,
    setShowConvertToLeadModal,
    setConvertingToLeadCrmRecordId,
  ]);

  /** Navigate away (e.g. View record) while keeping id so back-navigation can reopen preview. */
  const handleHideProspectSidebarKeepPersistence = useCallback(() => {
    handleCloseProspectSidebarCore();
  }, [handleCloseProspectSidebarCore]);

  const handlePreviewClick = useCallback(
    (row: CrmDataItem) => {
      handlePreviewClickCore(row);
      writePreviewIdToStorage(row);
    },
    [handlePreviewClickCore, writePreviewIdToStorage],
  );

  // Auto-restore of the preview sidebar from localStorage is intentionally disabled.
  // We still persist the last preview id so future re-enablement is possible without data migration.
  useEffect(() => {
    if (didInitialPreviewRestoreRef.current) return;
    didInitialPreviewRestoreRef.current = true;
  }, []);

  useEffect(() => {
    const wrapper = document.querySelector(
      ".main-content-wrapper",
    ) as HTMLElement;
    if (wrapper) {
      const original = wrapper.style.overflow;
      wrapper.style.overflow = "hidden";
      return () => {
        wrapper.style.overflow = original;
      };
    }
  }, []);

  const showAdvancedFilterPills =
    showAdvancedFilters || hasAdvancedFiltersApplied;

  const advancedFilterPills = useCrmListAdvancedFilterPills({
    currentFilters,
    applyTableFiltersPatch,
    setPageFilters: setProspectsFilters,
    availableCampaigns,
    availableTags,
    uniqueSources,
    customSelectStyles,
  });

  const handleNoteCreate = (
    note: string,
    createTask: boolean,
    taskDueDate?: string,
  ) => {
    console.log("Note created:", {
      prospectId: selectedProspect.id,
      note,
      createTask,
      taskDueDate,
    });
  };

  // Stats cards: prospects wire Overdue / Upcoming / Converted to matching tabs + filters.
  const prospectsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: config.stats.allCardTitle,
        value: prospectsAllCountDisplay ?? 0,
        icon: Users,
        iconColor: "#0066CC",
        iconBgColor: "#EEF2FF",
        ...(config.operationsEntityName === "prospects"
          ? {
              metric: {
                text: "Currently in the system",
                dotColor: "#0066CC",
              },
            }
          : {
              subtitle: config.stats.subtitleAssignedUnassigned(metrics),
            }),
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectAllMetricClick }
          : {}),
      },
      {
        title: "Upcoming",
        value: metrics.scheduled_records ?? 0,
        icon: Calendar,
        iconColor: "#D97706",
        iconBgColor: "#D1FAE5",
        metric: {
          text: `${metrics.scheduled_next_hour_records ?? 0} in next hour`,
          dotColor: "#D97706",
        },
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectUpcomingMetricClick }
          : {}),
      },
      {
        title: "Overdue",
        value: metrics.overdue_scheduled_records ?? 0,
        icon: ClockIcon,
        iconColor: "#DC2626",
        iconBgColor: "#FFEDD5",
        metric: {
          text: "Client-defined",
          dotColor: "#DC2626",
        },
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectOverdueMetricClick }
          : {}),
      },
      {
        title: config.stats.convertedCardTitle,
        value: metrics.converted_prospects_records ?? 0,
        icon: Target,
        iconColor: "#059669",
        iconBgColor: "#EDE9FE",
        metric: {
          text: "Has associated leads",
          dotColor: "#059669",
        },
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectConvertedMetricClick }
          : {}),
      },
      {
        title: "Recently Contacted",
        value: metrics.recently_contacted_last_24h_records ?? 0,
        icon: MessageCircle,
        iconColor: "#0066CC",
        iconBgColor: "#E0F2FE",
        metric: {
          text: "In last 24 hrs",
          dotColor: "#0066CC",
        },
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectRecentlyContactedMetricClick }
          : {}),
      },
      {
        title: "Not Contacted",
        value: metrics.not_contacted_records ?? 0,
        icon: XCircle,
        iconColor: "#6B7280",
        iconBgColor: "#F1F5F9",
        metric: {
          text: "No attempts yet",
          dotColor: "#4B5563",
        },
        ...(config.operationsEntityName === "prospects"
          ? { onClick: handleProspectNotContactedMetricClick }
          : {}),
      },
    ],
    [
      config.operationsEntityName,
      config.stats,
      handleProspectAllMetricClick,
      handleProspectOverdueMetricClick,
      handleProspectUpcomingMetricClick,
      handleProspectConvertedMetricClick,
      handleProspectRecentlyContactedMetricClick,
      handleProspectNotContactedMetricClick,
      metrics,
      prospectsAllCountDisplay,
    ],
  );

  const prospectsColumns = useMemo(
    () =>
      buildCrmProspectsContactsTableColumns(
        config,
        extensions,
        campaignStatusById,
      ),
    [campaignStatusById, config, extensions],
  );

  const prospectsActions = useMemo(
    () =>
      buildCrmProspectsContactsTableActions({
        session,
        activeFilter,
        handleViewData,
        handleCallClick,
        handleScheduleCall,
        handleUnscheduleCallClick,
        setEditingContactId,
        setShowCreateContactSidebar,
        setConvertingToLeadCrmRecordId,
        setShowConvertToLeadModal,
        setDeleteModalMode,
        setItemToDelete,
        setShowDeleteModal,
        onDispositionChange: handleDispositionQuickUpdate,
        onScheduledCallStatusChange: handleScheduledCallStatusChange,
      }),
    [
      session,
      activeFilter,
      handleViewData,
      handleCallClick,
      handleScheduleCall,
      handleUnscheduleCallClick,
      setEditingContactId,
      setShowCreateContactSidebar,
      setConvertingToLeadCrmRecordId,
      setShowConvertToLeadModal,
      setDeleteModalMode,
      setItemToDelete,
      setShowDeleteModal,
      handleDispositionQuickUpdate,
      handleScheduledCallStatusChange,
    ],
  );

  const { handleCreateContactSubmit, handleUpdateContactSubmit } =
    useCrmListContactFormHandlers({
      session,
      contactForm,
      setContactForm,
      setCreateContactLoading,
      setShowCreateContactSidebar,
      editingContactId,
      setEditingContactId,
      fetchCrmData,
      sourceField: "source_file",
      extensions,
      showCreateContactSidebar,
    });

  const closeCreateContactSidebar = useCallback(() => {
    setShowCreateContactSidebar(false);
    setEditingContactId(null);
    setContactFormLoadError(null);
    setContactFormLoading(false);
  }, []);

  const prospectsToolbarConfig = useCrmToolbarConfig({
    entity: config.toolbar.entity as CrmEntityType,
    searchValue: prospectsSearch,
    searchPlaceholder: config.toolbar.searchPlaceholder,
    onSearchChange: setProspectsSearch,
    onSearch: () => {},
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      {
        id: "all",
        label: config.toolbar.allTabLabel,
        count: prospectsAllCountDisplay,
        removable: false,
      },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      resetActiveFilterIfRemovedTabMatches(tabId, activeFilter, handleFilterChange);
    },
    tabsDropdownLabel: config.toolbar.tabsDropdownLabel,
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: true,
    onImportClick: () => setShowUploadModal(true),
    showTableViewDropdown: config.enableBoardView,
    ...(config.enableBoardView
      ? {
          currentTableView: prospectsViewMode,
          onTableViewChange: setProspectsViewMode,
        }
      : {}),
    extensions,
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: null,
    prospectsTabCountOverrides: {
      loading,
      totalRecords,
      activeFilter,
    },
  });

  if (
    !session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
  ) {
    return null;
  }

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={config.scopedLayout} />
      {/* Add prospects button - fixed top right */}
      <div style={{ position: "fixed", top: "64px", right: "16px", zIndex: 100 }}>
        <CrmProspectsContactsAddContactsButton
          addContactsRef={addContactsRef}
          session={session}
          extensions={extensions}
          config={config}
          selectedItems={selectedItems}
          showAddContactsDropdown={showAddContactsDropdown}
          setShowAddContactsDropdown={setShowAddContactsDropdown}
          setEditingContactId={setEditingContactId}
          setContactForm={setContactForm as Dispatch<SetStateAction<CrmListContactFormState>>}
          setShowCreateContactSidebar={setShowCreateContactSidebar}
          setShowUploadModal={setShowUploadModal}
          setDeleteModalMode={setDeleteModalMode}
          setShowDeleteModal={setShowDeleteModal}
        />
      </div>
      {/* Main flex container for content and sidebar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh - 74px)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div
          className="prospects-scrollable-content"
          style={{ flex: 1, height: "100%", overflowY: "hidden" }}
        >
          <BreadcrumbItem
            mainTitle="CRM"
            mainLink="/crm/dashboard"
            subTitle={config.breadcrumbSubTitle}
          />

          <div className="container-fluid" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div
              className="prospects-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <GenericTable
                data={dataList}
                columns={prospectsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={prospectsActions}
                {...getCrmProspectsDataListGenericTableSharedProps({
                  session,
                  dataList,
                  selectedItems,
                  setSelectedItems,
                  setClearSelectedRows,
                  pagination,
                  setPagination,
                  loading,
                  totalRecords,
                  emptyMessage: config.tableCopy.emptyMessage,
                  loadingMessage: config.tableCopy.loadingMessage,
                  onPreviewClick: (row) => handlePreviewClick(row),
                  onFirstColumnClick: (row) => handleFirstColumnClick(row),
                  onRowDoubleClick: (row) =>
                    prospectsTableRowDoubleClick(session, handleViewData, row),
                })}
                maxHeight={tableMaxHeight}
                toolbar={{
                  ...prospectsToolbarConfig,
                  // Remove the "+ More" pill on this page
                  showMoreFiltersButton: false,
                  // Hide Advanced filters button while the filters sidebar is open
                  showAdvancedFilters: !showFiltersSidebar,
                  // Keep pills visible by default so advanced pills can appear inline
                  showFilterPills: true,
                  onAdvancedFiltersClick: () =>
                    setShowAdvancedFilters((prev) => !prev),
                  filterPills: mergeCrmProspectsToolbarFilterPills(
                    prospectsToolbarConfig.filterPills,
                    showAdvancedFilterPills,
                    advancedFilterPills,
                  ),
                }}
                // Stats cards for metrics
                statsCards={prospectsStatsCards}
                metricsGridMinWidth="120px"
                metricsColumns={6}
                customBody={
                  config.enableBoardView
                    ? renderCrmProspectsKanbanTableCustomBody({
                        prospectsViewMode,
                        dataList,
                        prospectsActions,
                        handleViewData,
                        prospectsSearch,
                      })
                    : undefined
                }
              />
            </div>
          </div>

          {/* Upload Modal */}
          {session?.user?.permissions?.includes(
            PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT,
          ) && (
            <Modal
              show={showUploadModal}
              onHide={() => setShowUploadModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton className="border-bottom bg-light">
                <Modal.Title>{config.uploadModalTitle}</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <div className="alert alert-info mb-4">
                  <AlertCircleIcon size={18} className="me-2" />
                  <strong>📋 Import Guidelines:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      <strong>Headers:</strong> First row must contain column
                      headers
                    </li>
                    <li>
                      <strong>Name Column:</strong> Include a "name" column
                      (case insensitive) for first name and last name, or use
                      separate "first name" and "last name" columns
                    </li>
                    <li>
                      <strong>Phone Column:</strong> Include a "phone" column
                      (case insensitive) for contact information. Phone must
                      follow the E.164 format. (e.g., +14155552671)
                    </li>
                    <li>
                      <strong>Email Column:</strong> Include a "email" column
                      for contact information. Email must be a valid email
                      address.
                    </li>
                    <li>
                      <strong>File Size:</strong> Maximum 2MB per file
                    </li>
                    <li>
                      <strong>Formats:</strong> CSV files supported
                    </li>
                    <li>
                      <strong>Data Quality:</strong> Clean, valid data imports
                      faster and works better
                    </li>
                  </ul>
                </div>
                <Form>
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="fw-semibold mb-0">
                        Select CSV File <span className="text-danger">*</span>
                      </Form.Label>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={downloadExampleCsv}
                        className="d-flex align-items-center gap-1"
                      >
                        <Download size={14} />
                        Download Example CSV
                      </Button>
                    </div>
                    <Form.Control
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: CSV
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Tags (Optional)
                    </Form.Label>
                    <CreatableSelect
                      isMulti
                      value={fieldTags}
                      onChange={(selected) => setFieldTags(selected || [])}
                      options={availableTags}
                      placeholder="Add tags to organize and filter this data..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          boxShadow: "none",
                          fontSize: "14px",
                        }),
                      }}
                    />
                    <Form.Text className="text-muted">
                      Add descriptive tags to help categorize and filter your
                      data later. You can create new tags by typing them.
                    </Form.Text>
                  </Form.Group>
                  <div className="alert alert-warning">
                    <small>
                      <strong>Note:</strong> The data will be uploaded even if
                      some fields remain empty.
                    </small>
                  </div>
                </Form>
              </Modal.Body>
              <Modal.Footer className="border-top">
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => handleUpload()}>
                  <Download size={16} className="me-2" />
                  Upload & Import
                </Button>
              </Modal.Footer>
            </Modal>
          )}

          <CrmListViewDataModal
            show={showViewModal}
            onHide={() => setShowViewModal(false)}
            selectedDataItem={selectedDataItem}
            extensions={extensions}
            availableCampaigns={availableCampaigns}
            {...(config.callRecordingExtras.passPropsToViewModal
              ? {
                  callRecordings,
                  callRecordingsLoading,
                  callRecordingsTotal,
                  downloadingRecordings,
                  downloadProgress,
                  onPlayCallRecording: handlePlayCallRecording,
                  onDownloadCallRecording: handleDownloadCallRecording,
                }
              : {})}
          />


          {/* Delete Confirmation Modal (single + bulk) */}
          <DeleteConfirmationModal
            show={showDeleteModal}
            onHide={() => {
              setShowDeleteModal(false);
              setDeleteModalMode(null);
              setItemToDelete(null);
            }}
            {...resolveDeleteModalProps(
              deleteModalMode,
              { bulk: handleBulkDelete, single: confirmDelete },
              config.deleteModalCopy,
            )}
            itemName={deleteModalItemName}
            additionalInfo={
              <CrmListDeleteModalAdditionalInfo
                mode={deleteModalMode}
                itemToDelete={itemToDelete}
                selectedCount={selectedItems.length}
                extensions={extensions}
              />
            }
          />

          <CrmListPipelineModals
            {...buildCrmProspectsListPipelineModalsProps({
              assignment: {
                show: showDataAssignmentModal,
                onHide: handleDataAssignmentModalClose,
                title: config.assignmentModal.title,
                desc: config.assignmentModal.desc,
                onSubmit: handleDataAssignmentSubmit,
                onCancel: handleDataAssignmentModalClose,
                entityLabel: config.assignmentModal.entityLabel,
                assignmentFilters,
                setAssignmentFilters,
                availableTags,
                availableCampaigns,
                assignmentCounts,
                assignmentCampaign,
                setAssignmentCampaign,
                totalEntriesToAssign,
                setTotalEntriesToAssign,
                assignmentDistribution,
                setAssignmentDistribution,
                customDistribution,
                setCustomDistribution,
              },
              afterCall: {
                show: showAfterCallModal,
                onHide: () => setShowAfterCallModal(false),
                onSubmit: handleAfterCallSubmit,
                afterCallData,
                setAfterCallData,
              },
              schedule: {
                show: showScheduleModal,
                onHide: () => setShowScheduleModal(false),
                isEditingSchedule,
                selectedEntryForSchedule,
                scheduleData,
                setScheduleData,
                onSubmit: handleScheduleSubmit,
                onCancel: handleScheduleModalClose,
              },
              unschedule: {
                show: showUnscheduleModal,
                onHide: () => {
                  setShowUnscheduleModal(false);
                  setEntryToUnschedule(null);
                },
                entryToUnschedule,
                onConfirm: confirmUnscheduleCall,
              },
              history: {
                show: showHistoryModal,
                onHide: () => setShowHistoryModal(false),
                onClose: () => setShowHistoryModal(false),
                historyData,
                historyLoading,
                historyPagination,
                fetchHistoryData,
                campaignsById,
                getNameByExtension,
              },
              success: {
                show: showSuccessfulModal,
                onHide: () => setShowSuccessfulModal(false),
                title: successModalTitle,
                description: successModalDescription,
              },
              recording: {
                show: showRecordingPlayerModal,
                onHide: () => {
                  setShowRecordingPlayerModal(false);
                  setSelectedRecording(null);
                },
                recording: selectedRecording,
              },
            })}
          />
        </div>{" "}
        {/* End main content area */}
        {/* Prospect Detail Sidebar */}
        {showProspectSidebar && (
          <GenericSidebar
            sidebarMarginTop={sidebarMarginTop}
            width={window.innerWidth < 1280 ? "360px" : "420px"}
            isOpen={showProspectSidebar}
            onClose={handleCloseProspectSidebar}
            title={selectedProspect?.name || config.sidebar.fallbackTitle}
            subtitle={selectedProspect?.phone || ""}
            email={selectedProspect?.data?.email}
            phone={selectedProspect?.phone}
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            record={{
              id: selectedProspect?.id,
              type: RECORD_TYPES.PROSPECT,
            }}
            avatar={{
              initials: getInitials(selectedProspect?.name || "NA"),
              name: selectedProspect?.name || "NA",
              gradient: getRandomColor(selectedProspect?.name || ""),
            }}
            recordType="prospect"
            recordId={resolveNumericProspectId(selectedProspect) || undefined}
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            onPlayCallRecording={handlePlayCallRecording}
            onLogCall={sidebarLogActivityModals.openLogCall}
            onLogEmail={sidebarLogActivityModals.openLogEmail}
            onLogSms={sidebarLogActivityModals.openLogSms}
            onLogWhatsApp={sidebarLogActivityModals.openLogWhatsApp}
            onLogMeeting={sidebarLogActivityModals.openLogMeeting}
            crmSummary={
              selectedProspect?.crm_summary ??
              selectedProspect?.data?.crm_summary ??
              (selectedProspect?.data as { data?: { crm_summary?: unknown } } | undefined)
                ?.data?.crm_summary ??
              undefined
            }
            recordLink={{
              label: "View record",
              onClick: () => {
                const prospectId = resolveNumericProspectId(selectedProspect);
                if (!Number.isFinite(prospectId) || prospectId <= 0) return;
                handleHideProspectSidebarKeepPersistence();
                router.push(config.sidebar.buildDetailUrlFromNumericId(prospectId));
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: config.sidebar.editActionLabel,
                  onClick: () => {
                    const id = selectedProspect?.id;
                    if (!id) return;
                    setShowProspectSidebar(false);
                    setEditingContactId(id);
                    setShowCreateContactSidebar(true);
                  },
                },
                {
                  label: "Convert to Lead",
                  onClick: () => {
                    setShowProspectSidebar(false);
                    setConvertingToLeadCrmRecordId(selectedProspect?.id);
                    setShowConvertToLeadModal(true);
                  },
                },
                // {
                //   label: "View History",
                //   onClick: () => {
                //     setShowProspectSidebar(false);
                //     setShowHistoryModal(true);
                //   },
                // },
                {
                  label: "Delete",
                  onClick: () => {
                    const prospectToDelete = selectedProspect;
                    setShowProspectSidebar(false);
                    handleDeleteData(prospectToDelete);
                  },
                },
              ],
            }}
            sections={[
              {
                id: config.sidebar.aboutSectionId,
                title: config.sidebar.aboutSectionTitle,
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => {
                      const id = selectedProspect?.id;
                      if (!id) return;
                      setShowProspectSidebar(false);
                      setEditingContactId(id);
                      setShowCreateContactSidebar(true);
                    },
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedProspect?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value: selectedProspect?.phone || "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink: selectedProspect?.phone
                      ? `tel:${selectedProspect.phone}`
                      : undefined,
                  },
                  {
                    label: "Email",
                    value: selectedProspect?.data?.email || "N/A",
                    type: "email",
                    copyable: true,
                    externalLink: selectedProspect?.data?.email
                      ? `mailto:${selectedProspect.data.email}`
                      : undefined,
                    show: !!selectedProspect?.data?.email,
                  },
                  {
                    label: "Owner",
                    value: selectedProspect?.data?.contact_owner
                      ? getNameByExtension(selectedProspect.data.contact_owner)
                      : "—",
                    hasDetails: config.sidebar.ownerField.hasDetails,
                    onDetailsClick: config.sidebar.ownerField.onDetailsClick,
                  },
                  {
                    label: "Campaign",
                    value: selectedProspect?.campaign?.name || "No Campaign",
                    show: !!selectedProspect?.campaign,
                    hasDetails: !!selectedProspect?.campaign,
                    onDetailsClick: () => console.log("Show campaign details"),
                  },
                  {
                    label: "Created Date",
                    value: selectedProspect?.created_at
                      ? formatCrmPreviewDate(selectedProspect.created_at) ||
                        "N/A"
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: selectedProspect?.updated_at
                      ? formatCrmPreviewDate(selectedProspect.updated_at) ||
                        "N/A"
                      : "N/A",
                    type: "date",
                  },
                ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: config.sidebar.activitiesCount(selectedProspect),
                emptyState: {
                  icon: History,
                  message: config.sidebar.activitiesEmptyMessage,
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const id = resolveNumericProspectId(selectedProspect);
                      if (!id) return;
                      router.push(config.sidebar.buildLogActivityUrl(id));
                      handleHideProspectSidebarKeepPersistence();
                    },
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () =>
                      selectedProspect?.phone &&
                      handleCallClick(selectedProspect),
                  },
                },
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: FileText,
                  message: "No notes added yet.",
                  action: {
                    label: "Add note",
                    onClick: () => console.log("Add note"),
                  },
                },
              }
            ]}
          />
        )}
        {sidebarActivityModals.modals}
        {sidebarLogActivityModals.modals}
        {/* Filters Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          title="Filters"
          subtitle={config.filterSidebar.subtitle}
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: prospectsSearch,
              onChange: (value) => setProspectsSearch(value),
              placeholder: config.filterSidebar.searchPlaceholder,
            },
            {
              id: "assignedTo",
              label: "Owner",
              type: "select",
              value: prospectsFilters.assignedTo
                ? (() => {
                    const assignedToId = prospectsFilters.assignedTo;
                    const ext = extensions.find(
                      (e: any) => (e.id || e.extension) === assignedToId,
                    );
                    return ext
                      ? {
                          value: assignedToId,
                          label: ext.display_name || ext.name || assignedToId,
                        }
                      : { value: assignedToId, label: assignedToId };
                  })()
                : null,
              onChange: (selected) => {
                const assignedToValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  assignedTo: assignedToValue,
                }));
                handleFilterChange("all");
              },
              options: extensions.map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              })),
              placeholder: "Search and select owner...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "campaigns",
              label: "Campaigns",
              type: "multi-select",
              value: prospectsFilters.campaigns
                ? prospectsFilters.campaigns.map((campaignId: string) => {
                    const campaign = availableCampaigns.find(
                      (c: any) => c.value === campaignId,
                    );
                    return campaign
                      ? { value: campaignId, label: campaign.label }
                      : { value: campaignId, label: campaignId };
                  })
                : [],
              onChange: (selected) => {
                const campaignValues = selected
                  ? selected.map((s: any) => s.value)
                  : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  campaigns: campaignValues,
                }));
                handleFilterChange("all");
              },
              options: availableCampaigns.map((c) => ({
                value: c.value,
                label: c.label,
              })),
              placeholder: "Select campaigns...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "nextCallDateFrom",
              label: "Next Call Date (From)",
              type: "date",
              value: prospectsFilters.nextCallDateFrom || "",
              onChange: (value = null) => {
                setProspectsFilters((prev) => ({
                  ...prev,
                  nextCallDateFrom: value ?? null,
                }));
              },
              placeholder: "From date",
            },
            {
              id: "nextCallDateTo",
              label: "Next Call Date (To)",
              type: "date",
              value: prospectsFilters.nextCallDateTo || "",
              onChange: (value = null) => {
                setProspectsFilters((prev) => ({
                  ...prev,
                  nextCallDateTo: value ?? null,
                }));
              },
              placeholder: "To date",
            },
            {
              id: "sourceFile",
              label: "Source Name",
              type: "select",
              value: prospectsFilters.sourceFile
                ? {
                    value: prospectsFilters.sourceFile,
                    label: prospectsFilters.sourceFile,
                  }
                : null,
              onChange: (selected) => {
                const sourceValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  sourceFile: sourceValue,
                }));
                handleFilterChange("all");
              },
              options: uniqueSources,
              placeholder: "Select source...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "tags",
              label: "Tags",
              type: "multi-select",
              value: prospectsFilters.tags
                ? prospectsFilters.tags.map((tagValue: string) => {
                    const tag = availableTags.find(
                      (t: any) => t.value === tagValue,
                    );
                    return tag
                      ? { value: tagValue, label: tag.label }
                      : { value: tagValue, label: tagValue };
                  })
                : [],
              onChange: (selected) => {
                const tagValues = selected
                  ? selected.map((s: any) => s.value)
                  : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  tags: tagValues,
                }));
                handleFilterChange("all");
              },
              options: availableTags.map((tag) => ({
                value: tag.value,
                label: tag.label,
              })),
              placeholder: "Select tags...",
              isClearable: true,
              styles: customSelectStyles,
            },
          ]}
          onApply={() => {
            const filtersToApply = buildProspectsContactsAppliedFiltersPayload(
              prospectsSearch,
              prospectsFilters,
            );
            handleFiltersChange(filtersToApply as Record<string, any>);
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setProspectsSearch("");
            setProspectsFilters({
              assignedTo: null,
              campaigns: null,
              nextCallDateFrom: null,
              nextCallDateTo: null,
              sourceFile: null,
              tags: null,
            });
            handleFiltersChange({});
            setCurrentFilters({});
            handleFilterChange("all");
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
          }}
        />
      </div>{" "}
      {/* End flex container */}
      {/* Convert to Lead – same sidebar as Create Lead on leads page, with prospect pre-filled */}
      <CreateLeadModal
        show={showConvertToLeadModal}
        onHide={() => {
          setShowConvertToLeadModal(false);
          setConvertingToLeadCrmRecordId(null);
        }}
        onSuccess={() => {
          setShowConvertToLeadModal(false);
          setConvertingToLeadCrmRecordId(null);
          setRefreshKey((prev) => prev + 1);
          toast.success(config.convertLeadToast);
        }}
        showSuccessToast={config.createLeadModal.showSuccessToast}
        type="lead"
        crmDataId={convertingToLeadCrmRecordId ?? undefined}
      />
      {/* Column Editor Modal */}
      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={prospectsColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedColumns}
        onApply={(keys) => {
          setSelectedColumns(keys);
          persistCrmProspectsContactsSelectedColumns(
            config.selectedColumnsStorageKey,
            keys,
          );
        }}
      />
      {/* Export Modal */}
      <CrmExportModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title={config.exportModal.title}
        subtitle={config.exportModal.subtitle}
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder={config.exportModal.fileNamePlaceholder}
        onExportClick={handleProspectsExport}
        exporting={exporting}
        exportButtonLabel="Export"
      >
        <CrmProspectsListExportModalFiltersBody
          extensions={extensions}
          exportFilters={exportFilters}
          setExportFilters={setExportFilters}
        />
      </CrmExportModal>
      <CrmProspectsListAddTabModal
        show={showTabModal}
        onHide={() => setShowTabModal(false)}
        customTabs={customTabs}
        setCustomTabs={setCustomTabs}
        scheduledRecordsCount={metrics.scheduled_records}
        hasLeadsTabLabel="Converted Prospects"
      />
      {/* Create Contact Sidebar */}
      <CrmListCreateContactSidebar
        show={showCreateContactSidebar}
        editingContactId={editingContactId}
        contactForm={contactForm}
        setContactForm={setContactForm}
        createContactLoading={createContactLoading}
        contactFormLoading={contactFormLoading}
        contactFormLoadError={contactFormLoadError}
        availableCampaigns={availableCampaigns}
        extensions={extensions}
        availableTags={availableTags}
        entityLabel={config.createContactSidebarEntityLabel}
        onClose={closeCreateContactSidebar}
        onCreateSubmit={handleCreateContactSubmit}
        onUpdateSubmit={handleUpdateContactSubmit}
      />
    </React.Fragment>
  );
}
