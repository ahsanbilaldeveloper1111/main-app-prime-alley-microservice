import "@assets/scss/datatable-style.scss";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Row,
  Col,
  Form,
  Modal,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import { FiCalendar, FiTarget } from "react-icons/fi";
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
  downloadExampleCsv,
  updateCrmData,
} from "@utils/crm";
import { buildCrmPersonListRowDispositionUpdatePayload } from "@utils/crmPersonDispositionQuickUpdate";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  RECORD_TYPES,
  formatCrmPreviewDate,
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
import { CrmListViewDataModal } from "@crm/shared/CrmListViewDataModal";
import {
  applyCrmListExportDateRangePreset,
  crmListExportDateRangePresetValue,
  CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS,
} from "@crm/shared/crmListExportModalDateRangePresets";
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
  mergeCrmProspectsToolbarFilterPills,
  persistCrmProspectsContactsSelectedColumns,
  resetActiveFilterIfRemovedTabMatches,
} from "@crm/shared/crmProspectsContactsListPageHelpers";
import { renderCrmProspectsKanbanTableCustomBody } from "@crm/shared/crmProspectsContactsListPageKanbanCustomBody";
import { prospectsTableRowDoubleClick } from "@crm/shared/crmProspectsContactsListPageTableRowHandlers";

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
    requestIdRef,
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

  // Call recordings state (used when view modal passes recording props)
  const [callRecordings] = useState<any[]>([]);
  const [callRecordingsLoading] = useState(false);
  const [callRecordingsTotal] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [showRecordingPlayerModal, setShowRecordingPlayerModal] =
    useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  const {
    activeFilter,
    setActiveFilter,
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
      "last_called_at", "last_call_end_reason", "disposition",
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
    handleScheduleModalClose, handleScheduleSubmit,
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

  const buildCrmDataParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) =>
      config.buildListCrmDataParams(memoizedFilters, pagination, overrides),
    [
      config,
      memoizedFilters,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortColumn,
      pagination.sortDirection,
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

  const {
    fetchCrmData,
    handleExport: handleProspectsExport,
    handleFileInputChange,
    handleUpload,
    confirmDelete,
  } = useCrmListDataOperations({
    entityName: config.operationsEntityName,
    requestIdRef,
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
        await updateCrmData(
          id,
          payload as unknown as Parameters<typeof updateCrmData>[1],
        );
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
    handleCloseSidebar: handleCloseProspectSidebar,
    handleOpenFiltersSidebar,
    handleCloseFiltersSidebar,
    handlePreviewClick,
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

  // Stats cards data for metrics
  const prospectsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: config.stats.allCardTitle,
        value: metrics.total_all_records ?? 0,
        icon: Users,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
        subtitle: config.stats.subtitleAssignedUnassigned(metrics),
      },
      {
        title: "Upcoming",
        value: metrics.scheduled_records ?? 0,
        icon: Calendar,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        metric: {
          text: `${metrics.scheduled_next_hour_records ?? 0} in next hour`,
          dotColor: "#F59E0B",
        },
      },
      {
        title: "Overdue",
        value: metrics.overdue_scheduled_records ?? 0,
        icon: ClockIcon,
        iconColor: "#F97316",
        iconBgColor: "#FFEDD5",
        metric: {
          text: "Client-defined",
          dotColor: "#F97316",
        },
      },
      {
        title: config.stats.convertedCardTitle,
        value: metrics.converted_prospects_records ?? 0,
        icon: Target,
        iconColor: "#8B5CF6",
        iconBgColor: "#EDE9FE",
        metric: {
          text: "Has associated leads",
          dotColor: "#8B5CF6",
        },
      },
      {
        title: "Recently Contacted",
        value: metrics.recently_contacted_last_24h_records ?? 0,
        icon: MessageCircle,
        iconColor: "#0EA5E9",
        iconBgColor: "#E0F2FE",
        metric: {
          text: "In last 24 hrs",
          dotColor: "#0EA5E9",
        },
      },
      {
        title: "Not Contacted",
        value: metrics.not_contacted_records ?? 0,
        icon: XCircle,
        iconColor: "#64748B",
        iconBgColor: "#F1F5F9",
        metric: {
          text: "No call attempt has occurred yet.",
          dotColor: "#94A3B8",
        },
      },
    ],
    [config.stats, metrics],
  );

  const prospectsColumns = useMemo(
    () => buildCrmProspectsContactsTableColumns(config, extensions),
    [config, extensions],
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
        count: totalAllProspects,
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
    ...(config.enableBoardView
      ? {
          currentTableView: prospectsViewMode,
          onTableViewChange: setProspectsViewMode,
        }
      : {}),
    extensions,
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: (
      <CrmProspectsContactsAddContactsButton
        addContactsRef={addContactsRef}
        session={session}
        extensions={extensions}
        config={config}
        selectedItems={selectedItems}
        showAddContactsDropdown={showAddContactsDropdown}
        setShowAddContactsDropdown={setShowAddContactsDropdown}
        setEditingContactId={setEditingContactId}
        setContactForm={
          setContactForm as Dispatch<SetStateAction<CrmListContactFormState>>
        }
        setShowCreateContactSidebar={setShowCreateContactSidebar}
        setShowUploadModal={setShowUploadModal}
        setDeleteModalMode={setDeleteModalMode}
        setShowDeleteModal={setShowDeleteModal}
      />
    ),
    prospectsTabCountOverrides: {
      loading,
      totalRecords,
      activeFilter,
    },
  });

  if (!session?.user?.permissions?.includes("list-crm-data-management")) {
    return null;
  }

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={config.scopedLayout} />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle={config.breadcrumbSubTitle}
      />
      {/* Main flex container for content and sidebar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div className="prospects-scrollable-content" style={{ flex: 1 }}>
          

          <div className="container-fluid">
            <div
              className="prospects-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={dataList}
                columns={prospectsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={prospectsActions}
                showActions={false}
                // Selection
                selectable={session?.user?.permissions?.includes(
                  "delete-crm-data-management",
                )}
                selectedRows={dataList.filter((item) =>
                  selectedItems.includes(item.id),
                )}
                onSelectionChange={(selected) => {
                  setSelectedItems(selected.map((item) => item.id));
                  setClearSelectedRows(false);
                }}
                // Column customization
                // customizableColumns={true}
                // defaultSelectedColumns={defaultSelectedColumns}
                // columnStorageKey="crmDataSelectedColumns"

                // Pagination
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: totalRecords,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setPagination({
                    ...pagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                // Sorting
                sortable={true}
                defaultSortColumn={pagination.sortColumn}
                defaultSortDirection={pagination.sortDirection}
                onSort={(column, direction) => {
                  setPagination((prev) => ({
                    ...prev,
                    sortColumn: column,
                    sortDirection: direction,
                    currentPage: 1,
                  }));
                }}
                // Row interactions
                onPreviewClick={(row) => handlePreviewClick(row)}
                onFirstColumnClick={(row) => handleFirstColumnClick(row)}
                onRowDoubleClick={(row) =>
                  prospectsTableRowDoubleClick(session, handleViewData, row)
                }
                // Loading & styling
                loading={loading}
                emptyMessage={config.tableCopy.emptyMessage}
                loadingMessage={config.tableCopy.loadingMessage}
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                // Toolbar
                showToolbar={true}
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
          {session?.user?.permissions?.includes("add-crm-data-management") && (
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
            onConfirm={
              deleteModalMode === "bulk" ? handleBulkDelete : confirmDelete
            }
            itemName={deleteModalItemName}
            itemType={
              deleteModalMode === "bulk"
                ? config.deleteModalCopy.itemTypeBulk
                : config.deleteModalCopy.itemTypeSingle
            }
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
            assignment={{
              show: showDataAssignmentModal,
              onHide: handleDataAssignmentModalClose,
              title: config.assignmentModal.title,
              desc: config.assignmentModal.desc,
              onSubmit: handleDataAssignmentSubmit,
              onCancel: handleDataAssignmentModalClose,
            }}
            assignmentForm={{
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
            }}
            afterCall={{
              show: showAfterCallModal,
              onHide: () => setShowAfterCallModal(false),
              onSubmit: handleAfterCallSubmit,
              afterCallData,
              setAfterCallData,
            }}
            schedule={{
              show: showScheduleModal,
              onHide: () => setShowScheduleModal(false),
              isEditingSchedule,
              selectedEntryForSchedule,
              scheduleData,
              setScheduleData,
              onSubmit: handleScheduleSubmit,
              onCancel: handleScheduleModalClose,
            }}
            unschedule={{
              show: showUnscheduleModal,
              onHide: () => {
                setShowUnscheduleModal(false);
                setEntryToUnschedule(null);
              },
              entryToUnschedule,
              onConfirm: confirmUnscheduleCall,
            }}
            history={{
              show: showHistoryModal,
              onHide: () => setShowHistoryModal(false),
              onClose: () => setShowHistoryModal(false),
              historyData,
              historyLoading,
              historyPagination,
              fetchHistoryData,
              campaignsById,
              getNameByExtension,
            }}
            success={{
              show: showSuccessfulModal,
              onHide: () => setShowSuccessfulModal(false),
              title: successModalTitle,
              description: successModalDescription,
            }}
            recording={{
              show: showRecordingPlayerModal,
              onHide: () => {
                setShowRecordingPlayerModal(false);
                setSelectedRecording(null);
              },
              recording: selectedRecording,
            }}
          />
        </div>{" "}
        {/* End main content area */}
        {/* Prospect Detail Sidebar */}
        {showProspectSidebar && (
          <GenericSidebar
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
            recordId={
              selectedProspect?.id ?? selectedProspect?.data?.id ?? undefined
            }
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            crmSummary={
              selectedProspect?.crm_summary ??
              selectedProspect?.data?.crm_summary ??
              (selectedProspect as any)?.data?.data?.crm_summary ??
              undefined
            }
            recordLink={{
              label: "View record",
              onClick: () => {
                const prospectId = Number(
                  selectedProspect?.id ??
                    selectedProspect?.data?.id ??
                    (selectedProspect as any)?.data?.data?.id ??
                    Number.NaN,
                );
                if (!Number.isFinite(prospectId) || prospectId <= 0) return;
                handleCloseProspectSidebar();
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
                  onClick: () => handleDeleteData(selectedProspect),
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
                      const id = selectedProspect?.id ?? selectedProspect?.data?.id ?? "";
                      if (id) {
                        router.push(config.sidebar.buildLogActivityUrl(id));
                        handleCloseProspectSidebar();
                      }
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
                setActiveFilter("all");
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
                setActiveFilter("all");
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
                setActiveFilter("all");
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
                setActiveFilter("all");
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
            setActiveFilter("all");
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
        <hr />
        <h6 className="mb-3">Export filters</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Associate with</Form.Label>
                <Form.Select
                  value={
                    exportFilters.user_extension
                      ? String(exportFilters.user_extension)
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.user_extension = v;
                      else delete next.user_extension;
                      return next;
                    });
                  }}
                >
                  <option value="">All owners</option>
                  {extensions.map((ext) => (
                    <option
                      key={String(ext.id || ext.extension)}
                      value={String(ext.id || ext.extension)}
                    >
                      {ext.display_name ||
                        ext.name ||
                        ext.id ||
                        ext.extension ||
                        ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lead status</Form.Label>
                <Form.Select
                  value={exportFilters.disposition || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.disposition = v;
                      else delete next.disposition;
                      return next;
                    });
                  }}
                >
                  <option value="">All status</option>
                  <option value="hot_lead">Hot Lead</option>
                  <option value="warm_lead">Warm Lead</option>
                  <option value="cold_lead">Cold Lead</option>
                  <option value="interested">Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up">Follow Up</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            {CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS.map(
              ({ label, keys }) => (
                <Col md={6} key={keys.from}>
                  <Form.Group className="mb-3">
                    <Form.Label>{label}</Form.Label>
                    <Form.Select
                      value={crmListExportDateRangePresetValue(
                        exportFilters,
                        keys,
                      )}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExportFilters((prev) =>
                          applyCrmListExportDateRangePreset(prev, v, keys),
                        );
                      }}
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              ),
            )}
          </Row>
          <Form.Group className="mb-0">
            <Form.Label>Search (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Filter by name, phone, etc."
              value={exportFilters.search || ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setExportFilters((prev) => {
                  const next = { ...prev };
                  if (v) next.search = v;
                  else delete next.search;
                  return next;
                });
              }}
            />
          </Form.Group>
      </CrmExportModal>
      {/* Add Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a filter to add as a new tab</p>
          <div className="d-grid gap-2">
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.some((t) => t.id === "scheduled")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "scheduled",
                      label: "Scheduled",
                      count: metrics.scheduled_records,
                      removable: true,
                    },
                  ]);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "scheduled")}
            >
              <FiCalendar size={16} className="me-2" />
              Scheduled
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.some((t) => t.id === "has_leads")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "has_leads",
                      label: "Converted Leads",
                      removable: true,
                    },
                  ]);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "has_leads")}
            >
              <FiTarget size={16} className="me-2" />
              Converted Leads
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTabModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
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
