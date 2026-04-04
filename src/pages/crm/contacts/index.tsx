import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Row,
  Col,
  Form,
  Alert,
  Spinner,
  Modal,
  Badge,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import moment from "moment";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import ContactEditSidebar from "@components/ProspectEditSidebar";
import {
  FiUpload,
  FiDatabase,
  FiFilter,
  FiEdit,
  FiUser,
  FiUsers,
  FiPlay,
  FiClock,
  FiX,
  FiCalendar,
  FiTarget,
} from "react-icons/fi";
import {
  Users,
  Calendar,
  XCircle,
  Clock as ClockIcon,
  ChevronDown,
  X,
  AlertCircle as AlertCircleIcon,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Mail,
  User,
  History,
  FileText,
  Target,
  MessageCircle,
} from "lucide-react";
import CreateLeadModal from "@components/CreateLeadModal";
import GenericTable, {
  TableColumn,
  TableAction,
} from "@components/GenericTable";

import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { StatsCardData } from "@components/GenericStatsCards";
import {
  updateCrmData,
  getCrmDataCounts,
  CrmDataItem,
  CrmDataMetrics,
  downloadExampleCsv,
} from "@utils/crm";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import {
  formatDuration,
  formatDateTimeToLocal,
  GlobalDateFormat,
  GlobalTimeFormat,
  formatCrmPreviewDate,
  formatCrmPreviewDateTime,
  RECORD_TYPES,
} from "@utils/Helper";
import PageSummaryGrid from "@components/PageSummaryGrid";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import CircularProgressCircle from "@components/CircularProgressCircle";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
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
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import {
  CRM_LIST_PAGE_CALL_END_REASONS,
} from "@utils/crmListPageStaticData";
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
import { CrmListDataAssignmentFormContent } from "@crm/shared/CrmListDataAssignmentFormContent";
import { CrmListAfterCallFormContent } from "@crm/shared/CrmListAfterCallFormContent";
import {
  CrmListScheduleCallFormContent,
  CrmListUnscheduleModal,
} from "@crm/shared/CrmListScheduleCallModals";
import { CrmListHistoryFormContent } from "@crm/shared/CrmListHistoryFormContent";
import { CrmListViewDataModal } from "@crm/shared/CrmListViewDataModal";
import {
  applyCrmListExportDateRangePreset,
  crmListExportDateRangePresetValue,
  CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS,
} from "@crm/shared/crmListExportModalDateRangePresets";
import {
  buildContactsExportCrmDataParams,
  buildContactsListCrmDataParams,
  computeContactsAdvancedFiltersApplied,
} from "@crm/contacts/crmContactsCrmQueryParams";
import {
  buildContactsCsvContent,
  buildContactsExportHeaders,
  buildContactsSourceFileSelectOptions,
} from "@crm/contacts/crmContactsPageExportCsv";
import { validateContactsUploadCsvFile } from "@crm/contacts/crmContactsCsvValidation";
import {
  selectCrmContactsSidebarRecordEmail,
  selectCrmContactsSidebarRecordId,
  selectCrmContactsSidebarRecordName,
  selectCrmContactsSidebarRecordPhone,
} from "@crm/contacts/crmContactsSidebarRecordSelectors";
import { CrmListDeleteModalAdditionalInfo } from "@crm/shared/CrmListDeleteModalAdditionalInfo";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useCrmListAdvancedFilterPills } from "@crm/shared/useCrmListAdvancedFilterPills";

const CrmContactsManagement = () => {
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
    showProspectSidebar: showContactSidebar,
    setShowProspectSidebar: setShowContactSidebar,
    showFiltersSidebar,
    setShowFiltersSidebar,
    selectedProspect: selectedContact,
    setSelectedProspect: setSelectedContact,
    sidebarProspectFetchTokenRef: sidebarContactFetchTokenRef,
    showFilterBar: _showFilterBar,
    setShowFilterBar: _setShowFilterBar,
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

  // Call recordings state
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
    validFilters,
    activeFilter,
    setActiveFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    search: contactsSearch,
    setSearch: setContactsSearch,
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
    pageFilters: contactsFilters,
    setPageFilters: setContactsFilters,
    viewMode: contactsViewMode,
    setViewMode: setContactsViewMode,
    defaultSelectedColumns,
    selectedColumns,
    setSelectedColumns,
    pagination,
    setPagination,
    dataList,
    setDataList,
    totalRecords,
    setTotalRecords,
    totalAll: totalAllContacts,
    setTotalAll: setTotalAllContacts,
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
    fetchHistoryData,
  } = useCrmListFiltersMetricsHistoryState<CrmDataMetrics>({
    router,
    validFilters: ["all", "scheduled", "has_leads"],
    defaultColumnIds: [
      "name", "phone", "source_file", "user_extension", "campaign",
      "last_called_at", "last_call_end_reason", "disposition",
      "scheduled_call_at", "tags",
    ],
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
    loadFailedMessage: "Failed to load contact",
  });

  const contactsCalculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = Array.from(assignmentFilters.selectedCampaigns).map(
        (campaign) => parseInt(campaign.value),
      );
      const tags = Array.from(assignmentFilters.selectedTags).map(
        (tag) => tag.value,
      );
      const counts = await getCrmDataCounts(campaignIds, tags);
      return {
        total: counts.summary.total_records,
        assigned: counts.summary.assigned_records,
        unassigned: counts.summary.unassigned_records,
      };
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      return { total: 5000, assigned: 2000, unassigned: 3000 };
    }
  }, [assignmentFilters]);

  const {
    showSuccessfulModal, setShowSuccessfulModal,
    successModalTitle, setSuccessModalTitle,
    successModalDescription, setSuccessModalDescription,
    handleDataAssignment, handleDataAssignmentSubmit, handleDataAssignmentModalClose,
    handleAfterCallModalClose, handleAfterCallSubmit,
    handleScheduleCall, handleUnscheduleCallClick, confirmUnscheduleCall,
    handleScheduleModalClose, handleScheduleSubmit,
    handleCallClick, handleBulkDelete, handleDeleteData,
    openSidebar: openContactSidebar, handleViewData,
    handlePlayCallRecording, handleDownloadCallRecording, handleItemSelection,
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
    sidebarFetchTokenRef: sidebarContactFetchTokenRef,
    setSelectedRecord: setSelectedContact,
    setShowSidebar: setShowContactSidebar,
    setSelectedRecording, setShowRecordingPlayerModal, setDownloadingRecordings, setDownloadProgress,
    calculateEntryCounts: contactsCalculateEntryCounts,
  });

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const sidebarActivitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);
  const sidebarRecordId = selectCrmContactsSidebarRecordId(selectedContact);
  const sidebarRecordName =
    selectCrmContactsSidebarRecordName(selectedContact);
  const sidebarRecordPhone =
    selectCrmContactsSidebarRecordPhone(selectedContact);
  const sidebarRecordEmail =
    selectCrmContactsSidebarRecordEmail(selectedContact);

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
      buildContactsListCrmDataParams(memoizedFilters, pagination, overrides),
    [
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
    ) => buildContactsExportCrmDataParams(filters, overrides),
    [],
  );

  const uniqueSources = useMemo(
    () => buildContactsSourceFileSelectOptions(dataList),
    [dataList],
  );

  const { getNameByExtension } = useCrmListSideEffects({
    refreshKey,
    showHistoryModal,
    fetchHistoryData,
    activeFilter,
    clearSelectedRows,
    showExportModal,
    currentFilters,
    entityName: "contacts",
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
    computeAdvancedFiltersApplied: computeContactsAdvancedFiltersApplied,
  });

  const {
    fetchCrmData,
    handleExport: handleContactsExport,
    handleFileSelect,
    handleFileInputChange,
    handleUpload,
    confirmDelete,
  } = useCrmListDataOperations({
    entityName: "contacts",
    requestIdRef,
    memoizedFilters,
    buildCrmDataParams,
    buildExportParams,
    buildExportHeaders: buildContactsExportHeaders,
    buildCsvContent: buildContactsCsvContent,
    validateUploadCsvFile: validateContactsUploadCsvFile,
    setLoading,
    setDataList,
    setTotalRecords,
    setTotalAll: setTotalAllContacts,
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

  const {
    handleCloseSidebar: handleCloseContactSidebar,
    handleOpenFiltersSidebar,
    handleCloseFiltersSidebar,
    handlePreviewClick,
    handleFirstColumnClick,
  } = useCrmListNavigationHandlers({
    sidebarFetchTokenRef: sidebarContactFetchTokenRef,
    setShowSidebar: setShowContactSidebar,
    setSelectedRecord: setSelectedContact,
    setShowFiltersSidebar,
    openSidebar: openContactSidebar,
    router,
    buildDetailUrl: (contact: any) => `/crm/contacts/contacts-detailpage?id=${contact?.id ?? ""}`,
  });

  const showAdvancedFilterPills =
    showAdvancedFilters || hasAdvancedFiltersApplied;

  const advancedFilterPills = useCrmListAdvancedFilterPills({
    currentFilters,
    applyTableFiltersPatch,
    setPageFilters: setContactsFilters,
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
      contactId: selectedContact.id,
      note,
      createTask,
      taskDueDate,
    });
  };

  // Stats cards data for metrics
  const contactsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: "All Contacts",
        value: metrics.total_all_records ?? 0,
        icon: Users,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
        subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`,
      },
      {
        title: "Scheduled",
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
        title: "Converted Contacts",
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
    [metrics],
  );

  // Define columns for GenericTable - Clean declarative definitions
  const contactsColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getRandomColor(row.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "phone",
        label: "Phone",
        sortable: true,
        type: "custom",
        align: "left",
      },
      {
        key: "source_file",
        label: "Source",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: () => "secondary",
        },
        emptyValue: "N/A",
      },
      {
        key: "user_extension",
        label: "Owner",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          const extension = extensions.find(
            (ext: any) => ext.id.toString() === row.user_extension?.toString(),
          );
          return row.user_extension
            ? extension?.display_name || row.user_extension
            : "Unassigned";
        },
        badge: {
          getVariant: (row) => (row.user_extension ? "success" : "secondary"),
          showDot: () => true,
        },
      },
      {
        key: "campaign",
        label: "Campaign",
        sortable: true,
        type: "badge",
        accessor: (row) => row.campaign?.name || "No Campaign",
        badge: {
          getVariant: (row) => (row.campaign ? "primary" : "info"),
        },
      },
      {
        key: "last_called_at",
        label: "Last Called",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row.last_called_at
            ? moment(row.last_called_at).format("MMM DD, HH:mm")
            : "-",
      },
      {
        key: "last_call_end_reason",
        label: "Last Call Status",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.last_call_end_reason) return null;
          const endReason = CRM_LIST_PAGE_CALL_END_REASONS.find(
            (r) => r.value === row.last_call_end_reason,
          );
          return endReason?.label || row.last_call_end_reason;
        },
        badge: {
          getVariant: (row) => {
            if (!row.last_call_end_reason) return "secondary";
            const endReason = CRM_LIST_PAGE_CALL_END_REASONS.find(
              (r) => r.value === row.last_call_end_reason,
            );
            return (endReason?.color as any) || "secondary";
          },
        },
        emptyValue: "-",
      },
      {
        key: "disposition",
        label: "Disposition",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.disposition) return null;
          const dispositions = [
            { value: "interested", label: "Interested", color: "success" },
            {
              value: "not_interested",
              label: "Not Interested",
              color: "danger",
            },
            {
              value: "callback_requested",
              label: "Callback Requested",
              color: "warning",
            },
            { value: "no_answer", label: "No Answer", color: "warning" },
            { value: "busy", label: "Busy", color: "info" },
            { value: "do_not_call", label: "Do Not Call", color: "danger" },
            { value: "wrong_number", label: "Wrong Number", color: "info" },
            { value: "follow_up", label: "Follow Up", color: "primary" },
          ];
          const disposition = dispositions.find(
            (d) => d.value === row.disposition,
          );
          if (disposition) return disposition.label;
          // Fallback to random for demo
          const randomDisposition =
            dispositions[Math.floor(Math.random() * dispositions.length)];
          return randomDisposition.label;
        },
        badge: {
          getVariant: (row) => {
            if (!row.disposition) return "secondary";
            const dispositions = [
              { value: "interested", color: "success" },
              { value: "not_interested", color: "danger" },
              { value: "callback_requested", color: "warning" },
              { value: "no_answer", color: "warning" },
              { value: "busy", color: "info" },
              { value: "do_not_call", color: "danger" },
              { value: "wrong_number", color: "info" },
              { value: "follow_up", color: "primary" },
            ];
            const disposition = dispositions.find(
              (d) => d.value === row.disposition,
            );
            if (disposition) return disposition.color as any;
            // Fallback to random for demo
            const randomColors = [
              "success",
              "danger",
              "warning",
              "info",
              "primary",
            ];
            return randomColors[
              Math.floor(Math.random() * randomColors.length)
            ] as any;
          },
        },
        emptyValue: "-",
      },
      {
        key: "scheduled_call_at",
        label: "Next Call",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.scheduled_call_at) return "Not scheduled";
          const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(row.scheduled_call_at).isBefore(
            moment().add(1, "hour"),
          );
          const formatted = moment(row.scheduled_call_at).format(
            "MMM DD, HH:mm",
          );
          if (isOverdue) return `${formatted} (Overdue)`;
          if (isNextHour) return `${formatted} (Soon)`;
          return formatted;
        },
        badge: {
          getVariant: (row) => {
            if (!row.scheduled_call_at) return "info";
            const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
            const isNextHour = moment(row.scheduled_call_at).isBefore(
              moment().add(1, "hour"),
            );
            return isOverdue ? "danger" : isNextHour ? "warning" : "info";
          },
        },
      },
      {
        key: "tags",
        label: "Tags",
        sortable: false,
        type: "custom",
        render: (row) => (
          <div className="d-flex gap-1 flex-wrap">
            {(row.tags || []).map((tag: any, idx: number) => (
              <span key={idx} className="gt-badge gt-badge-secondary">
                {tag.name || tag}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [extensions, CRM_LIST_PAGE_CALL_END_REASONS, handleCallClick],
  );

  // Define table actions
  const contactsActions: TableAction<any>[] = useMemo(
    () => [
      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              label: "View",
              icon: <Eye size={16} />,
              onClick: (row: any) => handleViewData(row),
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              label: "Edit",
              icon: <FiEdit size={16} />,
              onClick: (row: any) => {
                setEditingContactId(row.id);
                setShowCreateContactSidebar(true);
              },
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes(
        "call-service-crm-data-management",
      )
        ? [
            {
              label: "Call",
              icon: <PhoneIcon size={16} />,
              onClick: (row: any) => handleCallClick(row),
              variant: "link" as const,
              className: "text-success",
            },
          ]
        : []),
      ...(activeFilter !== "has_leads"
        ? [
            {
              label: "More Actions",
              icon: <MoreVertical size={16} />,
              variant: "link" as const,
              dropdown: {
                align: "end" as const,
                options: [
                  ...(session?.user?.permissions?.includes(
                    "call-service-crm-data-management",
                  )
                    ? [
                        {
                          label: "Schedule Call",
                          icon: <FiCalendar size={14} />,
                          onClick: (row: any) => handleScheduleCall(row),
                          show: (row: any) => !row.scheduled_call_at,
                        },
                        {
                          label: "Edit Scheduled Call",
                          icon: <FiCalendar size={14} />,
                          onClick: (row: any) => handleScheduleCall(row),
                          show: (row: any) => !!row.scheduled_call_at,
                        },
                        {
                          label: "Unschedule Call",
                          icon: <FiX size={14} />,
                          onClick: (row: any) => handleUnscheduleCallClick(row),
                          className: "text-danger",
                          show: (row: any) => !!row.scheduled_call_at,
                          divider: true,
                        },
                      ]
                    : []),
                  {
                    label: "Convert to Lead",
                    icon: <FiTarget size={14} />,
                    onClick: (row: any) => {
                      setConvertingToLeadCrmRecordId(row.id);
                      setShowConvertToLeadModal(true);
                    },
                  },
                  {
                    label: "Send Email",
                    icon: <Mail size={14} />,
                    onClick: (row: any) => {
                      window.location.href = `mailto:${row.email}`;
                    },
                    show: (row: any) => !!row.email,
                  },
                ],
              },
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes("delete-crm-data-management")
        ? [
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              onClick: (row: any) => {
                setDeleteModalMode("single");
                setItemToDelete(row);
                setShowDeleteModal(true);
              },
              variant: "link" as const,
              className: "text-danger",
            },
          ]
        : []),
    ],
    [
      session,
      activeFilter,
      handleViewData,
      handleCallClick,
      handleScheduleCall,
      handleUnscheduleCallClick,
    ],
  );

  // Render Add Contacts Button with Dropdown (and Bulk Delete when rows selected)
  const renderAddContactsButton = () => (
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
            style={{
              padding: "9px 13px",
              backgroundColor: "#dc3545",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c82333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#dc3545";
            }}
          >
            <Trash2 size={16} />
            Delete ({selectedItems.length})
          </button>
        )}
      <div style={{ width: "146px" }}>
        <button
          onClick={() => setShowAddContactsDropdown(!showAddContactsDropdown)}
          style={{
            padding: "9px 13px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          Add contacts
          <ChevronDown size={16} />
        </button>

      {showAddContactsDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "160px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => {
              setShowAddContactsDropdown(false);
              setEditingContactId(null);
              setContactForm(createEmptyCrmListContactFormState("source_file"));
              setShowCreateContactSidebar(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "transparent",
              border: "none",
              textAlign: "left",
              fontSize: "14px",
              color: "#141414",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Create new
          </button>
          <button
            onClick={() => {
              setShowAddContactsDropdown(false);
              setShowUploadModal(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "transparent",
              border: "none",
              textAlign: "left",
              fontSize: "14px",
              color: "#d97706",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Import
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

  const contactsToolbarConfig = useCrmToolbarConfig({
    entity: "prospects",
    searchValue: contactsSearch,
    searchPlaceholder: "Search contacts...",
    onSearchChange: setContactsSearch,
    onSearch: () => {},
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      {
        id: "all",
        label: "All contacts",
        count: totalAllContacts,
        removable: false,
      },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Contacts",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: true,
    onImportClick: () => setShowUploadModal(true),
    currentTableView: contactsViewMode,
    onTableViewChange: setContactsViewMode,
    extensions,
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderAddContactsButton(),
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
          tableWrapperClass: "contacts-table-wrapper",
          scrollableContentClass: "contacts-scrollable-content",
          pageContainerClass: "contacts-page-container",
          contentAreaClass: "contacts-content-area",
          includePhoneInputStyles: true,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Contacts"
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
        <div className="contacts-scrollable-content" style={{ flex: 1 }}>
          <div className="container-fluid">
            {/* Contacts Table */}
            <div
              className="contacts-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={dataList}
                columns={contactsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={contactsActions}
                showActions={false}
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
                loading={loading}
                emptyMessage="No contacts found matching your criteria"
                loadingMessage="Loading contacts..."
                hover={true}
                uniqueKey="id"
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                showToolbar={true}
                toolbar={{
                  ...contactsToolbarConfig,
                  showMoreFiltersButton: false,
                  showAdvancedFilters: !showFiltersSidebar,
                  showFilterPills: true,
                  onAdvancedFiltersClick: () =>
                    setShowAdvancedFilters((prev) => !prev),
                  filterPills: [
                    ...(contactsToolbarConfig.filterPills ?? []),
                    ...(showAdvancedFilterPills ? advancedFilterPills : []),
                  ],
                }}
                statsCards={contactsStatsCards}
                customBody={
  contactsViewMode === "board" ? (
    <KanbanBoard
      columns={prospectsToKanbanColumns(
        dataList,
        getInitials,
        getRandomColor
      )}
      onCardClick={(card) => handleViewData(card.raw)}
      onCardMove={(cardId, fromCol, toCol) => {
        const contact = dataList.find(p => p.id === cardId);
        if (contact) {
          updateCrmData(Number(cardId), {
            name: contact.name || "",
            phone: contact.phone || "",
            campaign_id: contact.campaign_id,
            data: { ...contact.data, lifecycle_stage: toCol },
            scheduled_call_at: contact.scheduled_call_at || undefined,
            company_domain: contact.data?.company_domain || undefined,
            company_name: contact.data?.company_name || undefined,
            source: contact.data?.source || undefined,
          });
        }
      }}
      searchValue={contactsSearch}
    />
  ) : undefined
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
                <Modal.Title>Import Contacts - Contacts</Modal.Title>
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
            callRecordings={callRecordings}
            callRecordingsLoading={callRecordingsLoading}
            callRecordingsTotal={callRecordingsTotal}
            downloadingRecordings={downloadingRecordings}
            downloadProgress={downloadProgress}
            onPlayCallRecording={handlePlayCallRecording}
            onDownloadCallRecording={handleDownloadCallRecording}
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
            itemName={
              deleteModalMode === "single" && itemToDelete
                ? `contact entry #${itemToDelete.id}`
                : deleteModalMode === "bulk"
                  ? `${selectedItems.length} selected contacts`
                  : undefined
            }
            itemType={
              deleteModalMode === "bulk" ? "contact entries" : "contact entry"
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

          {/* Data Assignment Modal */}
          <FormModal
            show={showDataAssignmentModal}
            onHide={handleDataAssignmentModalClose}
            title="Smart Contact Distribution"
            desc="Please fill the details below to smart contact distribution."
            size="lg"
            formHtml={
              <CrmListDataAssignmentFormContent
                entityLabel="Contacts"
                assignmentFilters={assignmentFilters}
                setAssignmentFilters={setAssignmentFilters}
                availableTags={availableTags}
                availableCampaigns={availableCampaigns}
                assignmentCounts={assignmentCounts}
                assignmentCampaign={assignmentCampaign}
                setAssignmentCampaign={setAssignmentCampaign}
                totalEntriesToAssign={totalEntriesToAssign}
                setTotalEntriesToAssign={setTotalEntriesToAssign}
                assignmentDistribution={assignmentDistribution}
                setAssignmentDistribution={setAssignmentDistribution}
                customDistribution={customDistribution}
                setCustomDistribution={setCustomDistribution}
              />
            }
            submitButtonText="OK"
            cancelButtonText="Cancel"
            onSubmit={handleDataAssignmentSubmit}
            onCancel={handleDataAssignmentModalClose}
          />

          <FormModal
            show={showAfterCallModal}
            onHide={() => setShowAfterCallModal(false)}
            title="After Call Dialog"
            desc="Please fill the details below to record call outcomes and schedule follow-up actions."
            size="lg"
            formHtml={
              <CrmListAfterCallFormContent
                afterCallData={afterCallData}
                setAfterCallData={setAfterCallData}
              />
            }
            submitButtonText="Save Call Data"
            cancelButtonText="Cancel"
            onSubmit={() => handleAfterCallSubmit()}
            onCancel={() => setShowAfterCallModal(false)}
          />

          <FormModal
            show={showScheduleModal}
            onHide={() => setShowScheduleModal(false)}
            title={isEditingSchedule ? "Edit Scheduled Call" : "Schedule Call"}
            desc={
              isEditingSchedule
                ? "Please update the details below to modify the scheduled call."
                : "Please fill the details below to schedule a call."
            }
            size="lg"
            formHtml={
              <CrmListScheduleCallFormContent
                selectedEntry={selectedEntryForSchedule}
                isEditing={isEditingSchedule}
                scheduleData={scheduleData}
                setScheduleData={setScheduleData}
              />
            }
            submitButtonText={
              isEditingSchedule ? "Update Schedule" : "Schedule Call"
            }
            cancelButtonText="Cancel"
            onSubmit={() => handleScheduleSubmit()}
            onCancel={() => handleScheduleModalClose()}
          />

          {/* Unschedule Confirmation Modal */}
          <CrmListUnscheduleModal
            show={showUnscheduleModal}
            onHide={() => {
              setShowUnscheduleModal(false);
              setEntryToUnschedule(null);
            }}
            entryToUnschedule={entryToUnschedule}
            onConfirm={confirmUnscheduleCall}
          />

          <FormModal
            show={showHistoryModal}
            onHide={() => setShowHistoryModal(false)}
            title="Activity History"
            desc="Please fill the details below to view the activity history."
            size="lg"
            formHtml={
              <CrmListHistoryFormContent
                historyData={historyData}
                historyLoading={historyLoading}
                historyPagination={historyPagination}
                fetchHistoryData={fetchHistoryData}
                campaignsById={campaignsById}
                getNameByExtension={getNameByExtension}
              />
            }
            submitButtonText="Close"
            cancelButtonText="Cancel"
            onSubmit={() => setShowHistoryModal(false)}
            onCancel={() => setShowHistoryModal(false)}
          />

          <SuccessfulModal
            show={showSuccessfulModal}
            onHide={() => setShowSuccessfulModal(false)}
            title={successModalTitle}
            description={successModalDescription}
          />

          {/* Call Recording Player Modal */}
          <CallRecordingPlayerModal
            show={showRecordingPlayerModal}
            onHide={() => {
              setShowRecordingPlayerModal(false);
              setSelectedRecording(null);
            }}
            recording={selectedRecording}
          />
        </div>{" "}
        {/* End main content area */}
        {/* Contact Detail Sidebar */}
        {showContactSidebar && (
          <GenericSidebar
            isOpen={showContactSidebar}
            onClose={handleCloseContactSidebar}
            title={selectedContact?.name || "Contact Details"}
            subtitle={selectedContact?.phone || ""}
            email={selectedContact?.data?.email}
            phone={selectedContact?.phone}
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            record={{
              id: selectedContact?.id,
              type: RECORD_TYPES.PROSPECT,
            }}
            avatar={{
              initials: getInitials(selectedContact?.name || "NA"),
              name: selectedContact?.name || "NA",
              gradient: getRandomColor(selectedContact?.name || ""),
            }}
            recordType="prospect"
            recordId={
              selectedContact?.id ?? selectedContact?.data?.id ?? undefined
            }
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            crmSummary={
              selectedContact?.crm_summary ??
              selectedContact?.data?.crm_summary ??
              (selectedContact as any)?.data?.data?.crm_summary ??
              undefined
            }
            recordLink={{
              label: "View record",
              onClick: () => {
                const contactId = Number(
                  selectedContact?.id ??
                    selectedContact?.data?.id ??
                    (selectedContact as any)?.data?.data?.id ??
                    NaN,
                );
                if (!Number.isFinite(contactId) || contactId <= 0) return;
                handleCloseContactSidebar();
                router.push(
                  `/crm/contacts/contacts-detailpage?id=${contactId}`,
                );
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Contact",
                  onClick: () => {
                    const id = selectedContact?.id;
                    if (!id) return;
                    setShowContactSidebar(false);
                    setEditingContactId(id);
                    setShowCreateContactSidebar(true);
                  },
                },
                {
                  label: "Convert to Lead",
                  onClick: () => {
                    setShowContactSidebar(false);
                    setConvertingToLeadCrmRecordId(selectedContact?.id);
                    setShowConvertToLeadModal(true);
                  },
                },
                {
                  label: "Delete",
                  onClick: () => handleDeleteData(selectedContact),
                },
              ],
            }}
            sections={[
              {
                id: "about-contact",
                title: "About this contact",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => {
                      const id = selectedContact?.id;
                      if (!id) return;
                      setShowContactSidebar(false);
                      setEditingContactId(id);
                      setShowCreateContactSidebar(true);
                    },
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedContact?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value: selectedContact?.phone || "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink: selectedContact?.phone
                      ? `tel:${selectedContact.phone}`
                      : undefined,
                  },
                  {
                    label: "Email",
                    value: selectedContact?.data?.email || "N/A",
                    type: "email",
                    copyable: true,
                    externalLink: selectedContact?.data?.email
                      ? `mailto:${selectedContact.data.email}`
                      : undefined,
                    show: !!selectedContact?.data?.email,
                  },
                  {
                    label: "Owner",
                    value: selectedContact?.data?.contact_owner
                      ? getNameByExtension(selectedContact.data.contact_owner)
                      : "—",
                    hasDetails: true,
                    onDetailsClick: () => console.log("Show user details"),
                  },
                  {
                    label: "Campaign",
                    value: selectedContact?.campaign?.name || "No Campaign",
                    show: !!selectedContact?.campaign,
                    hasDetails: !!selectedContact?.campaign,
                    onDetailsClick: () => console.log("Show campaign details"),
                  },
                  {
                    label: "Created Date",
                    value: selectedContact?.created_at
                      ? formatCrmPreviewDate(selectedContact.created_at) ||
                        "N/A"
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: selectedContact?.updated_at
                      ? formatCrmPreviewDate(selectedContact.updated_at) ||
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
                count: 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this contact.",
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const id = selectedContact?.id ?? selectedContact?.data?.id ?? "";
                      if (id) {
                        router.push(`/crm/contacts/contacts-detailpage?id=${id}`);
                        handleCloseContactSidebar();
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
                      selectedContact?.phone &&
                      handleCallClick(selectedContact),
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
          subtitle="Filter contacts by various criteria"
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: contactsSearch,
              onChange: (value) => setContactsSearch(value),
              placeholder: "Search by name or phone...",
            },
            {
              id: "assignedTo",
              label: "Owner",
              type: "select",
              value: contactsFilters.assignedTo
                ? (() => {
                    const assignedToId = contactsFilters.assignedTo;
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
                setContactsFilters((prev) => ({
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
              value: contactsFilters.campaigns
                ? contactsFilters.campaigns.map((campaignId: string) => {
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
                setContactsFilters((prev) => ({
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
              value: contactsFilters.nextCallDateFrom || "",
              onChange: (value) => {
                const dateValue = value || null;
                setContactsFilters((prev) => ({
                  ...prev,
                  nextCallDateFrom: dateValue,
                }));
              },
              placeholder: "From date",
            },
            {
              id: "nextCallDateTo",
              label: "Next Call Date (To)",
              type: "date",
              value: contactsFilters.nextCallDateTo || "",
              onChange: (value) => {
                const dateValue = value || null;
                setContactsFilters((prev) => ({
                  ...prev,
                  nextCallDateTo: dateValue,
                }));
              },
              placeholder: "To date",
            },
            {
              id: "sourceFile",
              label: "Source Name",
              type: "select",
              value: contactsFilters.sourceFile
                ? {
                    value: contactsFilters.sourceFile,
                    label: contactsFilters.sourceFile,
                  }
                : null,
              onChange: (selected) => {
                const sourceValue = selected ? selected.value : null;
                setContactsFilters((prev) => ({
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
              value: contactsFilters.tags
                ? contactsFilters.tags.map((tagValue: string) => {
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
                setContactsFilters((prev) => ({
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
            const filtersToApply: Record<string, any> = {};

            if (contactsSearch) {
              filtersToApply.search = contactsSearch;
            }
            if (contactsFilters.assignedTo) {
              filtersToApply.user_extension = [contactsFilters.assignedTo];
            }
            if (
              contactsFilters.campaigns &&
              contactsFilters.campaigns.length > 0
            ) {
              filtersToApply.campaign_id = contactsFilters.campaigns;
            }
            if (contactsFilters.sourceFile) {
              filtersToApply.source_file = contactsFilters.sourceFile;
            }
            if (contactsFilters.tags && contactsFilters.tags.length > 0) {
              filtersToApply.tags = contactsFilters.tags;
            }

            // Next Call Date (From)/(To) -> scheduled_call_from / scheduled_call_to
            if (contactsFilters.nextCallDateFrom) {
              filtersToApply.scheduled_call_from =
                contactsFilters.nextCallDateFrom;
            }
            if (contactsFilters.nextCallDateTo) {
              filtersToApply.scheduled_call_to = contactsFilters.nextCallDateTo;
            }

            handleFiltersChange(filtersToApply);
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setContactsSearch("");
            setContactsFilters({
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
      {/* Convert to Lead – same sidebar as Create Lead on leads page, with contact pre-filled */}
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
          toast.success("Contact converted to lead successfully!");
        }}
        type="lead"
        crmDataId={convertingToLeadCrmRecordId ?? undefined}
      />
      {/* Column Editor Modal */}
      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={contactsColumns.map((c) => ({ key: c.key, label: c.label }))}
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
        title="Export Contacts"
        subtitle="Choose filters to define which contacts are exported. Defaults match your current table view."
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder="contacts_2025-02-24"
        onExportClick={handleContactsExport}
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
        entityLabel="Contact"
        onClose={closeCreateContactSidebar}
        onCreateSubmit={handleCreateContactSubmit}
        onUpdateSubmit={handleUpdateContactSubmit}
      />
    </React.Fragment>
  );
};

CrmContactsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmContactsManagement;
