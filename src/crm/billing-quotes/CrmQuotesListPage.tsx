import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import "react-phone-number-input/style.css";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Row,
  Col,
  Form,
  Modal,
} from "react-bootstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { CreateQuoteSidebar } from "@components/renderCreateQuoteForm";
import {
  FiCalendar,
  FiTarget,
} from "react-icons/fi";
import { ChevronDown, Trash2 } from "lucide-react";
import CreateLeadModal from "@components/CreateLeadModal";
import GenericTable from "@components/GenericTable";

import { StatsCardData } from "@components/GenericStatsCards";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import ColumnEditorModal from "@components/ColumnEditorModal";
import CrmExportModal from "@components/CrmExportModal";
import { CrmFilterBar as FilterBar } from "@components/crm/CrmListPageUi";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import {
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import { useCrmListAssignmentContactSidebarState } from "@crm/shared/useCrmListAssignmentContactSidebarState";
import { useCrmListPageCoreState } from "@crm/shared/useCrmListPageCoreState";
import { useCrmListContactFormHandlers } from "@crm/shared/useCrmListContactFormHandlers";
import { useCrmListSharedCallbacks } from "@crm/shared/useCrmListSharedCallbacks";
import { CrmListCreateContactSidebar } from "@crm/shared/CrmListCreateContactSidebar";
import { useCrmQuotesListFiltersMetricsHistorySidebarState } from "@crm/billing-quotes/useCrmQuotesListFiltersMetricsHistorySidebarState";
import { CrmListViewDataModal } from "@crm/shared/CrmListViewDataModal";
import { CrmListUploadModal } from "@crm/shared/CrmListUploadModal";
import { CrmListPipelineModals } from "@crm/shared/CrmListPipelineModals";
import { buildCrmQuotesListStatsCards } from "@crm/billing-quotes/crmQuotesListStatsAndTable";
import { CrmQuotesListProspectKpiAnalyticsSection } from "@crm/billing-quotes/CrmQuotesListProspectKpiAnalyticsSection";
import {
  mergeCrmQuotesListProspectsToolbarConfig,
  renderCrmQuotesListProspectsBoardCustomBody,
} from "@crm/billing-quotes/crmQuotesListProspectsTableToolbarAndBoard";
import {
  buildCrmQuotesListQuoteToolbarFilterPills,
  getCrmQuotesListProspectQuickFilters,
} from "@crm/billing-quotes/crmQuotesListToolbarFilters";
import { useCrmQuotesListQuotesTableModel } from "@crm/billing-quotes/useCrmQuotesListQuotesTableModel";
import { useCrmQuotesListSharedQuoteListCallbacks } from "@crm/billing-quotes/useCrmQuotesListSharedQuoteListCallbacks";
import { computeCrmListAdvancedFiltersApplied } from "@crm/shared/crmListCrmQueryParams";
import {
  applyCrmListExportDateRangePreset,
  crmListExportDateRangePresetValue,
  CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS,
} from "@crm/shared/crmListExportModalDateRangePresets";
import { pruneEmptyCrmListFilterEntries } from "@crm/billing-quotes/crmQuotesListPagePruneFilters";
import { useCrmListFilterActions } from "@crm/shared/useCrmListFilterActions";
import { useCrmListNavigationHandlers } from "@crm/shared/useCrmListNavigationHandlers";
import {
  CRM_LIST_DELETE_BUTTON_STYLE,
  CRM_LIST_PRIMARY_BUTTON_STYLE,
  CRM_LIST_DROPDOWN_STYLE,
  CRM_LIST_DROPDOWN_ITEM_STYLE,
  DELETE_BUTTON_HOVER,
  PRIMARY_BUTTON_HOVER,
  DROPDOWN_ITEM_HOVER,
} from "@crm/shared/crmListActionButtonStyles";
import { useCrmQuotesListActiveFilterSync } from "@crm/billing-quotes/useCrmQuotesListActiveFilterSync";
import { useCrmQuotesListFetchDummyCrmData } from "@crm/billing-quotes/useCrmQuotesListFetchDummyCrmData";
import { useCrmQuotesListExportHandlers } from "@crm/billing-quotes/useCrmQuotesListExportHandlers";
import {
  useCrmQuotesListCampaignsEffect,
  useCrmQuotesListExtensionsEffect,
  useCrmQuotesListHistoryModalEffect,
  useCrmQuotesListTagsEffect,
} from "@crm/billing-quotes/useCrmQuotesListResourceLoadEffects";
import { getCrmListExtensionDisplayName } from "@crm/shared/crmListExtensionDisplayName";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useCrmListClearSelectedRowsEffect } from "@crm/shared/crmListClearSelectedRowsEffect";
import { useCrmQuotesListPageUploadHandlers } from "@crm/billing-quotes/useCrmQuotesListPageUploadHandlers";
import { CrmQuotesListPageDeleteConfirmationBlock } from "@crm/billing-quotes/CrmQuotesListPageDeleteConfirmationBlock";
import { CrmQuotesListPageProspectSidebar } from "@crm/billing-quotes/CrmQuotesListPageProspectSidebar";
import { CrmQuotesListPageQuotesFilterSidebar } from "@crm/billing-quotes/CrmQuotesListPageQuotesFilterSidebar";

export type CrmQuotesListPageProps = {
  variant: "billing" | "crm";
};

export function getCrmQuotesListPageLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
}

function CrmQuotesListPageContent({ variant }: CrmQuotesListPageProps) {
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
    setUploading,
    selectedFile,
    setSelectedFile,
    setDragActive,
    showUploadModal,
    setShowUploadModal,
    setUploadProgress,
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

  const [showCreateQuoteSidebar, setShowCreateQuoteSidebar] = useState(false);
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
    showFilterBar,
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

  const {
    confirmDelete,
    handleDuplicateQuote,
    handleSendToContact,
    calculateEntryCounts,
  } = useCrmQuotesListSharedQuoteListCallbacks({
    itemToDelete,
    setShowDeleteModal,
    setDeleteModalMode,
    setItemToDelete,
    setRefreshKey,
    router,
    assignmentFilters,
  });

  // Call recordings state (values passed to view modal; list is populated elsewhere when wired)
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

  const [showProspectsAnalytics] = useState(false);

  const {
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
    historyLoading,
    historyPagination,
    fetchHistoryData,
    memoizedFilters,
    sidebarActivityModals,
  } = useCrmQuotesListFiltersMetricsHistorySidebarState({
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
    setContactForm: setContactForm as Dispatch<
      SetStateAction<CrmListContactFormState>
    >,
    setContactFormLoadError,
    setContactFormLoading,
  });

  const { handleProspectsExport } = useCrmQuotesListExportHandlers({
    exportFileName,
    exportFilters,
    currentFilters,
    showExportModal,
    setExporting,
    setExportFilters,
    setExportFileName,
    setShowExportModal,
  });

  useCrmQuotesListExtensionsEffect(setExtensions);
  useCrmQuotesListHistoryModalEffect(showHistoryModal, fetchHistoryData);
  useCrmQuotesListTagsEffect(refreshKey, setAvailableTags);
  useCrmQuotesListCampaignsEffect(
    refreshKey,
    setAvailableCampaigns,
    setCampaignsById,
  );

  const {
    showSuccessfulModal, setShowSuccessfulModal,
    successModalTitle, setSuccessModalTitle,
    successModalDescription, setSuccessModalDescription,
    handleDataAssignmentSubmit, handleDataAssignmentModalClose,
    handleAfterCallSubmit,
    confirmUnscheduleCall,
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
    setSelectedRecording, setShowRecordingPlayerModal, setDownloadingRecordings, setDownloadProgress,
    calculateEntryCounts,
  });

  const getNameByExtension = useCallback(
    (extension: string) =>
      getCrmListExtensionDisplayName(extensions, extension),
    [extensions],
  );

  const { handleFiltersChange, applyTableFiltersPatch, hasAdvancedFiltersApplied } =
    useCrmListFilterActions({
      currentFilters,
      setCurrentFilters,
      setRefreshKey,
      setPagination,
      computeAdvancedFiltersApplied: computeCrmListAdvancedFiltersApplied,
      pruneFilters: pruneEmptyCrmListFilterEntries,
    });

  const showAdvancedFilterPills =
    showAdvancedFilters || hasAdvancedFiltersApplied;

  const prospectQuickFilters = useMemo(
    () => getCrmQuotesListProspectQuickFilters(),
    [],
  );

  const quotesFilterPills = useMemo(
    () =>
      buildCrmQuotesListQuoteToolbarFilterPills({
        currentFilters,
        applyTableFiltersPatch,
        customSelectStyles,
        extensions,
      }),
    [applyTableFiltersPatch, currentFilters, customSelectStyles, extensions],
  );

  useCrmQuotesListActiveFilterSync(activeFilter, setCurrentFilters);

  const fetchCrmData = useCrmQuotesListFetchDummyCrmData({
    requestIdRef,
    memoizedFilters,
    setLoading,
    setDataList,
    setTotalRecords,
    setTotalAllQuotes,
    setMetrics,
  });

  // Load data when filters or pagination changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  useCrmListClearSelectedRowsEffect(clearSelectedRows, setSelectedItems);

  const {
    handleFileInputChange,
    handleUpload,
  } = useCrmQuotesListPageUploadHandlers({
    session,
    selectedFile,
    setSelectedFile,
    setDragActive,
    fieldTags,
    setFieldTags,
    setUploading,
    setUploadProgress,
    setShowUploadModal,
    setRefreshKey,
    setSuccessModalTitle,
    setSuccessModalDescription,
    setShowSuccessfulModal,
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
    buildDetailUrl: (prospect: any) =>
      `/crm/detailspage?type=prospect&id=${prospect?.id ?? ""}`,
  });

  const prospectsStatsCards: StatsCardData[] = useMemo(
    () => buildCrmQuotesListStatsCards(metrics, totalRecords),
    [metrics, totalRecords],
  );

  const requestDeleteQuoteRow = useCallback((row: any) => {
    setDeleteModalMode("single");
    setItemToDelete(row);
    setShowDeleteModal(true);
  }, []);

  const { quotesColumns, quotesActions } = useCrmQuotesListQuotesTableModel({
    extensions,
    handleViewData,
    permissions: session?.user?.permissions,
    router,
    handleDuplicateQuote,
    handleSendToContact,
    onRequestDeleteSingleRow: requestDeleteQuoteRow,
  });

  // Render Add Contacts Button with Dropdown (and Bulk Delete when rows selected)
  const renderCreateQuoteButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      ref={addContactsRef}
    >
      {session?.user?.permissions?.includes("delete-crm-data-management") &&
        selectedItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDeleteModalMode("bulk");
              setShowDeleteModal(true);
            }}
            style={CRM_LIST_DELETE_BUTTON_STYLE}
            {...DELETE_BUTTON_HOVER}
          >
            <Trash2 size={16} />
            Delete ({selectedItems.length})
          </button>
        )}
      <div style={{ width: "146px" }}>
        <button
          onClick={() => {
            router.push('/billing/create-invoice');
          }}
          style={CRM_LIST_PRIMARY_BUTTON_STYLE}
          {...PRIMARY_BUTTON_HOVER}
        >
          Create quote
          <ChevronDown size={16} />
        </button>

      {showAddContactsDropdown && (
        <div style={CRM_LIST_DROPDOWN_STYLE}>
          <button
            onClick={() => {
              setShowAddContactsDropdown(false);
              router.push("/crm/quotes/create");
            }}
            style={CRM_LIST_DROPDOWN_ITEM_STYLE}
            {...DROPDOWN_ITEM_HOVER}
          >
            Create new
          </button>
        </div>
      )}
      </div>
    </div>
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
    });

  const closeCreateContactSidebar = useCallback(() => {
    setShowCreateContactSidebar(false);
    setEditingContactId(null);
    setContactFormLoadError(null);
    setContactFormLoading(false);
  }, []);

  const prospectsToolbarConfig = useCrmToolbarConfig({
    entity: "prospects",
    searchValue: prospectsSearch,
    searchPlaceholder: "Search quotes...",
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
        label: "All quotes",
        count: totalAllQuotes,
        removable: false,
      },
      {
        id: "expiring_soon",
        label: "Expiring Soon",
        count: metrics.expiring_soon_count ?? 0,
        removable: false,
      },
      {
        id: "pending_acceptance",
        label: "Pending Acceptance",
        count: metrics.pending_count ?? 0,
        removable: false,
      },
      {
        id: "pending_approval",
        label: "Quotes Pending Approval",
        count: metrics.pending_approval_count ?? 0,
        removable: false,
      },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Quotes",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: true,
    onImportClick: () => {},
    currentTableView: prospectsViewMode,
    onTableViewChange: setProspectsViewMode,
    extensions,
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderCreateQuoteButton(),
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
      <CrmListPageScopedLayoutStyles
        config={{
          tableWrapperClass: "prospects-table-wrapper",
          scrollableContentClass: "prospects-scrollable-content",
          pageContainerClass: "prospects-page-container",
          contentAreaClass: "prospects-content-area",
          includePhoneInputStyles: true,
        }}
      />
      <BreadcrumbItem
        mainTitle={variant === "billing" ? "Billing" : "CRM"}
        mainLink={
          variant === "billing" ? "/billing/dashboard" : "/crm/dashboard"
        }
        subTitle="Quotes"
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
          {/* <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-0">
        <div className="mb-3 mb-md-0">
  <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          CRM
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
        Prospects
      </li>
    </ol>
  </nav>
</div>
        <div className="d-flex flex-wrap gap-2">
         

{session?.user?.permissions?.includes("add-crm-data-management") && (
  <Button
    variant="outline-secondary"
    className=""
    onClick={() => setShowUploadModal(true)}
  >
    <span className="">
      <Download size={16} className="me-2" />
      Import Contacts
    </span>
  </Button>
)}

<Button
  variant="outline-secondary"
  className=""
  onClick={() => setShowFilterBar(!showFilterBar)}
>
  <span className="">
    <Layers size={16} className="me-2" />
    {showFilterBar ? "Hide Tabs" : "Show Tabs"}
  </span>
</Button>

<Button
  variant="outline-secondary"
  className=""
  onClick={handleOpenFiltersSidebar}
>
  <span className="">
    <FiFilter size={16} className="me-2" />
    Filters
  </span>
</Button>


        </div>
      </div> */}

          {/* Stats Cards */}
          {/* <StatsCards 
        data={[
          {
            title: 'All Prospects',
            value: totalRecords,
            icon: Users,
            iconColor: '#6366F1',
            iconBgColor: '#EEF2FF',
            subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`
          },
          {
            title: 'Scheduled',
            value: metrics.scheduled_records,
            icon: Calendar,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            metric: {
              text: `${metrics.scheduled_next_hour_records} in next hour`,
              dotColor: '#F59E0B'
            }
          },
          {
            title: 'Convert to Leads',
            value: totalRecords > 0 ? `${((metrics.assigned_records / totalRecords) * 100).toFixed(1)}%` : '0%',
            icon: Target,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            badge: {
              text: `${metrics.assigned_records} Ready`,
              bgColor: '#FEF3C7',
              textColor: '#92400E'
            }
          },
          {
            title: 'All Prospects',
            value: totalRecords,
            icon: Users,
            iconColor: '#6366F1',
            iconBgColor: '#EEF2FF',
            subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`
          },
          {
            title: 'Scheduled',
            value: metrics.scheduled_records,
            icon: Calendar,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            metric: {
              text: `${metrics.scheduled_next_hour_records} in next hour`,
              dotColor: '#F59E0B'
            }
          },
          {
            title: 'Convert to Leads',
            value: totalRecords > 0 ? `${((metrics.assigned_records / totalRecords) * 100).toFixed(1)}%` : '0%',
            icon: Target,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            badge: {
              text: `${metrics.assigned_records} Ready`,
              bgColor: '#FEF3C7',
              textColor: '#92400E'
            }
          }
        ]}
        gridMinWidth="180px"
      /> */}

          <div className="container-fluid">
            {/* Analytics Section - Collapsible */}
            <CrmQuotesListProspectKpiAnalyticsSection
              show={variant === "billing" && showProspectsAnalytics}
              totalRecords={totalRecords}
              metrics={metrics}
              showAllProspectStats={showAllProspectStats}
              onToggleShowAllProspectStats={() =>
                setShowAllProspectStats(!showAllProspectStats)
              }
            />

            {/* Filter Bar */}
            {showFilterBar &&
              session?.user?.permissions?.includes(
                "list-crm-data-management",
              ) && (
                <FilterBar
                  quickFilters={prospectQuickFilters}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  // searchValue={prospectsSearch}
                  // onSearchChange={(value) => {
                  //   setProspectsSearch(value);
                  // }}
                  // onSearch={() =>
                  //   handleFiltersChange({
                  //     ...currentFilters,
                  //     search: prospectsSearch,
                  //   })
                  // }
                  // searchPlaceholder="Search by name or phone..."
                  // showAdvancedFilters={showAdvancedFilters}
                  // onToggleAdvancedFilters={() =>
                  //   setShowAdvancedFilters(!showAdvancedFilters)
                  // }
                  // advancedFilterCount={
                  //   (prospectsFilters.assignedTo !== null ? 1 : 0) +
                  //   (prospectsFilters.campaigns !== null &&
                  //   prospectsFilters.campaigns.length > 0
                  //     ? 1
                  //     : 0) +
                  //   (prospectsFilters.sourceFile !== null ? 1 : 0) +
                  //   (prospectsFilters.tags !== null &&
                  //   prospectsFilters.tags.length > 0
                  //     ? 1
                  //     : 0)
                  // }
                />
              )}

            {/* Bulk Actions */}
            {/* {selectedItems.length > 0 &&
          session?.user?.permissions?.includes(
            "delete-crm-data-management"
          ) && (
            <div className="d-flex justify-content-end gap-2 mb-3">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <CheckSquare size={16} className="me-2" />
                  Bulk Actions ({selectedItems.length})
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item
                    onClick={() => {
                      setDeleteModalMode("bulk");
                      setShowDeleteModal(true);
                    }}
                    className="d-flex align-items-center text-danger"
                  >
                    <Trash2 size={14} className="me-2" />
                    Delete Selected ({selectedItems.length})
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )} */}

            {/* Prospects Table */}
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
                columns={quotesColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={quotesActions}
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
                onRowDoubleClick={(row) => {
                  if (
                    session?.user?.permissions?.includes(
                      "view-crm-data-management",
                    )
                  ) {
                    handleViewData(row);
                  }
                }}
                // Loading & styling
                loading={loading}
                emptyMessage="No prospects found matching your criteria"
                loadingMessage="Loading prospects..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                // Toolbar
                showToolbar={true}
                toolbar={mergeCrmQuotesListProspectsToolbarConfig(
                  prospectsToolbarConfig,
                  {
                    showFiltersSidebar,
                    setShowAdvancedFilters,
                    showAdvancedFilterPills,
                    quotesFilterPills,
                  },
                )}
                // Stats cards for metrics
                statsCards={prospectsStatsCards}
                customBody={renderCrmQuotesListProspectsBoardCustomBody({
                  prospectsViewMode,
                  dataList,
                  handleViewData,
                  prospectsSearch,
                })}
              />
            </div>
          </div>

          {/* Upload Modal */}
          {session?.user?.permissions?.includes("add-crm-data-management") && (
            <CrmListUploadModal
              show={showUploadModal}
              onHide={() => setShowUploadModal(false)}
              title="Import Contacts - Prospects"
              fieldTags={fieldTags}
              onFieldTagsChange={setFieldTags}
              availableTags={availableTags}
              onFileInputChange={handleFileInputChange}
              onUpload={handleUpload}
            />
          )}

          {/* View Data Modal */}
          <CrmListViewDataModal
            show={showViewModal && !!selectedDataItem}
            onHide={() => setShowViewModal(false)}
            selectedDataItem={selectedDataItem}
            extensions={extensions}
            availableCampaigns={availableCampaigns}
            callRecordings={callRecordings}
            callRecordingsLoading={callRecordingsLoading}
            callRecordingsTotal={callRecordingsTotal}
            downloadingRecordings={downloadingRecordings}
            downloadProgress={downloadProgress}
            onPlayCallRecording={handlePlayCallRecording}
            onDownloadCallRecording={handleDownloadCallRecording}
          />

          <CrmQuotesListPageDeleteConfirmationBlock
            show={showDeleteModal}
            onHide={() => {
              setShowDeleteModal(false);
              setDeleteModalMode(null);
              setItemToDelete(null);
            }}
            deleteModalMode={deleteModalMode}
            itemToDelete={itemToDelete}
            selectedItems={selectedItems}
            extensions={extensions}
            handleBulkDelete={handleBulkDelete}
            confirmDelete={confirmDelete}
          />

          <CrmListPipelineModals
            assignment={{
              show: showDataAssignmentModal,
              onHide: handleDataAssignmentModalClose,
              title: "Smart Prospect Distribution",
              desc: "Please fill the details below to smart prospect distribution.",
              onSubmit: handleDataAssignmentSubmit,
              onCancel: handleDataAssignmentModalClose,
            }}
            assignmentForm={{
              entityLabel: "Prospects",
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
        <CrmQuotesListPageProspectSidebar
          show={showProspectSidebar}
          onClose={handleCloseProspectSidebar}
          selectedProspect={selectedProspect}
          sessionUser={session?.user}
          getNameByExtension={getNameByExtension}
          onNoteCreate={handleNoteCreate}
          router={router}
          onDuplicateQuote={handleDuplicateQuote}
          onSendToContact={handleSendToContact}
          onDeleteData={handleDeleteData}
          onCallClick={handleCallClick}
        />
        {sidebarActivityModals.modals}
        <CrmQuotesListPageQuotesFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          prospectsSearch={prospectsSearch}
          setProspectsSearch={setProspectsSearch}
          prospectsFilters={prospectsFilters}
          setProspectsFilters={setProspectsFilters}
          extensions={extensions}
          setActiveFilter={setActiveFilter}
          handleFiltersChange={handleFiltersChange}
          setPagination={setPagination}
          setRefreshKey={setRefreshKey}
          setShowFiltersSidebar={setShowFiltersSidebar}
          setCurrentFilters={setCurrentFilters}
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
          toast.success("Prospect converted to lead successfully!");
        }}
        type="lead"
        crmDataId={convertingToLeadCrmRecordId ?? undefined}
      />
      {/* Column Editor Modal */}
      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={quotesColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedColumns}
        onApply={(keys) => {
          setSelectedColumns(keys);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "crmDataSelectedColumns",
              JSON.stringify(keys),
            );
          }
        }}
      />
      {/* Export Modal */}
      <CrmExportModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title="Export Prospects"
        subtitle="Choose filters to define which prospects are exported. Defaults match your current table view."
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder="prospects_2025-02-24"
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
                if (!customTabs.find((t) => t.id === "scheduled")) {
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
                if (!customTabs.find((t) => t.id === "has_leads")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "has_leads",
                      label: "Convert to Leads",
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
              Convert to Leads
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
        entityLabel="Prospect"
        onClose={closeCreateContactSidebar}
        onCreateSubmit={handleCreateContactSubmit}
        onUpdateSubmit={handleUpdateContactSubmit}
      />
      {/* Create Quote Sidebar */}
      {showCreateQuoteSidebar && (
    <CreateQuoteSidebar
      onClose={() => setShowCreateQuoteSidebar(false)}
      
    />
  )}
    </React.Fragment>
  );
}

export function CrmQuotesListPage(props: CrmQuotesListPageProps) {
  return <CrmQuotesListPageContent {...props} />;
}
