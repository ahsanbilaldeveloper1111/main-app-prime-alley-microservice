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
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
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
import moment from "moment";
import ProspectEditSidebar from "@components/ProspectEditSidebar";
import { CreateQuoteSidebar } from "@components/renderCreateQuoteForm";
import {
  FiCalendar,
  FiTarget,
} from "react-icons/fi";
import {
  ChevronDown,
  Trash2,
  History,
  FileText,
  Target,
} from "lucide-react";
import CreateLeadModal from "@components/CreateLeadModal";
import GenericTable from "@components/GenericTable";

import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { StatsCardData } from "@components/GenericStatsCards";
import {
  getAllCrmDataById,
  createCrmData,
  updateCrmData,
  uploadCrmDataCsv,
  assignCrmDataAdvanced,
  bulkDeleteCrmData,
  markCrmDataAsViewed,
  scheduleCall,
  unscheduleCall,
  CrmDataItem,
} from "@utils/crm";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import {
  RECORD_TYPES,
} from "@utils/Helper";
import { DownloadCallRecording } from "@utils/calls";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import ColumnEditorModal from "@components/ColumnEditorModal";
import CrmExportModal from "@components/CrmExportModal";
import { CrmFilterBar as FilterBar } from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import {
  createEmptyCrmListContactFormState,
  type CrmListContactFormState,
} from "@utils/crmContactFormFromCrmItem";
import { useCrmListAssignmentContactSidebarState } from "@crm/shared/useCrmListAssignmentContactSidebarState";
import { useCrmListPageCoreState } from "@crm/shared/useCrmListPageCoreState";
import { useCrmQuotesListFiltersMetricsHistorySidebarState } from "@crm/billing-quotes/useCrmQuotesListFiltersMetricsHistorySidebarState";
import { CrmListViewDataModal } from "@crm/shared/CrmListViewDataModal";
import { CrmListUploadModal } from "@crm/shared/CrmListUploadModal";
import { CrmListDataAssignmentFormContent } from "@crm/shared/CrmListDataAssignmentFormContent";
import { CrmListAfterCallFormContent } from "@crm/shared/CrmListAfterCallFormContent";
import {
  CrmListScheduleCallFormContent,
  CrmListUnscheduleModal,
} from "@crm/shared/CrmListScheduleCallModals";
import { CrmListHistoryFormContent } from "@crm/shared/CrmListHistoryFormContent";
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
import { validateCrmListUploadCsvFile } from "@crm/shared/crmListUploadCsvValidation";
import {
  applyCrmListExportDateRangePreset,
  crmListExportDateRangePresetValue,
  CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS,
} from "@crm/shared/crmListExportModalDateRangePresets";
import { pruneEmptyCrmListFilterEntries } from "@crm/billing-quotes/crmQuotesListPagePruneFilters";
import { useCrmQuotesListActiveFilterSync } from "@crm/billing-quotes/useCrmQuotesListActiveFilterSync";
import { useCrmQuotesListFetchDummyCrmData } from "@crm/billing-quotes/useCrmQuotesListFetchDummyCrmData";
import { useCrmQuotesListSidebarQuickActions } from "@crm/billing-quotes/useCrmQuotesListSidebarQuickActions";
import { useCrmQuotesListExportHandlers } from "@crm/billing-quotes/useCrmQuotesListExportHandlers";
import {
  useCrmQuotesListCampaignsEffect,
  useCrmQuotesListExtensionsEffect,
  useCrmQuotesListHistoryModalEffect,
  useCrmQuotesListTagsEffect,
} from "@crm/billing-quotes/useCrmQuotesListResourceLoadEffects";
import { getCrmQuotesListExtensionDisplayName } from "@crm/billing-quotes/crmQuotesListGetExtensionDisplayName";

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
    uploading,
    setUploading,
    selectedFile,
    setSelectedFile,
    dragActive,
    setDragActive,
    showUploadModal,
    setShowUploadModal,
    uploadProgress,
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
    selectedCampaigns,
    setSelectedCampaigns,
    fieldTags,
    setFieldTags,
    assignToCampaignUsers,
    setAssignToCampaignUsers,
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
    setShowFilterBar,
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

  // Call recordings state
  const [callRecordings, setCallRecordings] = useState<any[]>([]);
  const [callRecordingsLoading, setCallRecordingsLoading] = useState(false);
  const [callRecordingsTotal, setCallRecordingsTotal] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [showRecordingPlayerModal, setShowRecordingPlayerModal] =
    useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  const [showProspectsAnalytics, setShowProspectsAnalytics] = useState(false);

  const {
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

  const sidebarQuickActions = useCrmQuotesListSidebarQuickActions({
    sidebarRecordPhone,
    sidebarRecordEmail,
    sidebarRecordName,
    sidebarRecordId,
    sidebarActivityModals,
    dialNumber,
    isInitialized,
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

  const getNameByExtension = useCallback(
    (extension: string) =>
      getCrmQuotesListExtensionDisplayName(extensions, extension),
    [extensions],
  );

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const applyTableFiltersPatch = useCallback(
    (patch: Record<string, any>) => {
      const next: Record<string, any> = { ...currentFilters, ...patch };
      pruneEmptyCrmListFilterEntries(next);
      handleFiltersChange(next);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [currentFilters, handleFiltersChange, setPagination],
  );

  const hasAdvancedFiltersApplied = useMemo(
    () => computeCrmListAdvancedFiltersApplied(currentFilters),
    [currentFilters],
  );

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

  // Clear selection after bulk delete or when clearSelectedRows changes
  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCrmListUploadCsvFile(file);

    if (validation.isValid) {
      setSelectedFile(file);
    } else {
      validation.errors.forEach((error) => toast.error(error));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Extract tag values from selected options
      const tagValues = Array.from(fieldTags).map((tag) => tag.value);

      const response: any = await uploadCrmDataCsv(
        selectedFile,
        [], // No campaigns selected
        tagValues,
        true, // No auto-assignment
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Parse response
      const responseData = response?.data || {};
      const processedCount = responseData.processed_count || 0;
      const validationFailures = responseData.validation_failures || 0;
      // const errors = responseData.errors || [];
      const message = responseData.message || "Upload completed";

      // Show error messages for validation failures
      // if (errors.length > 0) {
      //   errors.forEach((error: string) => {
      //     toast.warn(error);
      //   });
      // }

      // Show success message
      if (processedCount > 0) {
        let successMessage = `Successfully processed ${processedCount} record${
          processedCount !== 1 ? "s" : ""
        }`;

        if (validationFailures > 0) {
          successMessage += ` with ${validationFailures} validation failure${
            validationFailures !== 1 ? "s" : ""
          }`;
        }

        setSuccessModalTitle("Upload Successful");
        setSuccessModalDescription(successMessage);
        setShowSuccessfulModal(true);
      } else if (validationFailures > 0) {
        // All records failed validation
        toast.error(
          `Upload failed: All ${validationFailures} record${
            validationFailures !== 1 ? "s" : ""
          } failed validation`,
        );
      } else {
        toast.error("Upload completed but no prospects were processed");
      }

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const openProspectSidebar = useCallback((item: CrmDataItem | any) => {
    setSelectedDataItem(item);
    setSelectedProspect(item);
    setShowProspectSidebar(true);

    const id = Number(item?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    const token = ++sidebarProspectFetchTokenRef.current;
    getAllCrmDataById(id)
      .then((full: any) => {
        if (sidebarProspectFetchTokenRef.current !== token) return;
        const record = full?.data ?? null;
        if (!record) return;

        // Attach audit trail (top-level on the full response) onto the record so
        // CrmActivitiesPanel can pick it up consistently.
        const hydrated = {
          ...record,
          audit_trail: full?.audit_trail ?? full?.audit_trails ?? undefined,
          leads: full?.leads ?? undefined,
          deals: full?.deals ?? undefined,
        };

        setSelectedProspect((prev: any) => {
          const prevId = Number(prev?.id);
          if (!Number.isFinite(prevId) || prevId !== id) return prev;
          return { ...prev, ...hydrated };
        });
      })
      .catch(() => {
        // getAllCrmDataById already toasts on error; keep sidebar usable with base row data
      });
  }, []);

  // Backwards-compatible alias used throughout the file
  const handleViewData = useCallback(
    (item: CrmDataItem) => openProspectSidebar(item),
    [openProspectSidebar],
  );

  // Handle play call recording
  const handlePlayCallRecording = useCallback((recording: any) => {
    setSelectedRecording(recording);
    setShowRecordingPlayerModal(true);
  }, []);

  // Handle download call recording
  const handleDownloadCallRecording = useCallback(async (recording: any) => {
    const { Id, AgentExtension } = recording;

    // Add to downloading set and initialize progress
    setDownloadingRecordings((prev) => new Set(prev).add(Id));
    setDownloadProgress((prev) => ({ ...prev, [Id]: 0 }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const currentProgress = prev[Id] || 0;
          if (currentProgress < 90) {
            return { ...prev, [Id]: currentProgress + Math.random() * 15 };
          }
          return prev;
        });
      }, 200);

      await DownloadCallRecording(
        Id,
        AgentExtension,
        "call-logs/recordings/download",
        recording.imagicle,
      );

      // Complete the progress
      clearInterval(progressInterval);
      setDownloadProgress((prev) => ({ ...prev, [Id]: 100 }));

      // Show completion briefly before hiding
      setTimeout(() => {
        setDownloadingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Id);
          return newSet;
        });
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[Id];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");

      // Remove from downloading set on error
      setDownloadingRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(Id);
        return newSet;
      });
      setDownloadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[Id];
        return newProgress;
      });
    }
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Auto-refetch counts when filter dropdowns change
  useEffect(() => {
    const refetchCounts = async () => {
      if (
        assignmentFilters.selectedCampaigns.length > 0 ||
        assignmentFilters.selectedTags.length > 0
      ) {
        try {
          const counts = await calculateEntryCounts();
          setAssignmentCounts(counts);
          setTotalEntriesToAssign(counts.unassigned);
        } catch (error) {
          console.error("Failed to refetch counts:", error);
        }
      }
    };

    refetchCounts();
  }, [
    assignmentFilters.selectedCampaigns,
    assignmentFilters.selectedTags,
    calculateEntryCounts,
  ]);

  // Handle data assignment
  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setTotalEntriesToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setTotalEntriesToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Handle data assignment directly (no second dialog)
  const handleDataAssignmentSubmit = useCallback(async () => {
    if (assignmentCampaign.length === 0) {
      toast.error("Please select at least one campaign to assign entries to");
      return;
    }

    if (totalEntriesToAssign === 0) {
      toast.error("Please specify how many entries to assign");
      return;
    }

    // Validate custom distribution if in custom mode
    if (assignmentDistribution === "custom") {
      const totalCustomAllocation = Object.values(customDistribution).reduce(
        (sum, count) => sum + count,
        0,
      );
      if (totalCustomAllocation !== totalEntriesToAssign) {
        toast.error(
          `Custom allocation must equal total entries to assign (${totalEntriesToAssign}). Current total: ${totalCustomAllocation}`,
        );
        return;
      }
    }

    try {
      const campaignFilterIds = Array.from(
        assignmentFilters.selectedCampaigns,
      ).map((campaign) => parseInt(campaign.value));
      console.log(assignmentFilters.selectedTags, "ZEZA");
      const tagIds = Array.from(assignmentFilters.selectedTags).map((tag) =>
        parseInt(tag.id),
      );

      const campaignIds = Array.from(assignmentCampaign).map((campaign) =>
        parseInt(campaign.value),
      );

      let result;

      if (assignmentDistribution === "equal") {
        // Equal distribution - single API call
        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "equal",
        );
      } else {
        // Custom distribution - single API call with campaign distribution
        const campaignDistribution: Record<number, number> = {};
        Array.from(assignmentCampaign).forEach((campaign: any) => {
          const campaignId = parseInt(campaign.value);
          const countForThisCampaign = customDistribution[campaign.value] || 0;
          if (countForThisCampaign > 0) {
            campaignDistribution[campaignId] = countForThisCampaign;
          }
        });

        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "custom",
          campaignDistribution,
        );
      }

      console.log("Assignment result:", result);

      // Close modal and reset state
      setShowDataAssignmentModal(false);
      setAssignmentFilters({
        selectedTags: [],
        selectedCampaigns: [],
      });
      setAssignmentCampaign([]);
      setAssignmentDistribution("equal");
      setTotalEntriesToAssign(0);
      setCustomDistribution({});

      setShowSuccessfulModal(true);
      setSuccessModalTitle("Data Assignment Successful!");
      setSuccessModalDescription("The data has been successfully assigned.");

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [
    assignmentCampaign,
    totalEntriesToAssign,
    assignmentFilters,
    assignmentDistribution,
    customDistribution,
  ]);

  // Handle mark as viewed
  const handleMarkAsViewed = useCallback(async (item: CrmDataItem) => {
    try {
      await markCrmDataAsViewed(item.id);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mark as viewed error:", error);
    }
  }, []);

  // Handle call actions
  const handleCallAction = useCallback((action: string, item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this entry");
      return;
    }

    switch (action) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
        break;
      case "phone":
        window.open(`tel:${phone}`, "_self");
        break;
      case "sms":
        window.open(`sms:${phone}`, "_self");
        break;
      case "facebook":
        toast.info("Facebook calling feature coming soon");
        break;
      case "telegram":
        toast.info("Telegram calling feature coming soon");
        break;
      case "skype":
        toast.info("Skype calling feature coming soon");
        break;
      default:
        toast.error("Unknown action");
    }
  }, []);

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
  // Handle call button click
  const handleCallClick = useCallback(
    async (item: CrmDataItem) => {
      const phone = item.phone;
      if (!phone) {
        toast.error("No phone number available for this entry");
        return;
      }

      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }

      try {
        const result = await dialNumber(phone);

        if (result.success) {
          toast.success(`Calling ${item.name || phone}...`);
        } else {
          toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  // Handle recording playback
  const handlePlayRecording = useCallback((recordingUrl: string) => {
    // In a real app, this would open the recording player
    toast.info(`Playing recording: ${recordingUrl}`);
    console.log("Playing recording:", recordingUrl);
  }, []);

  // Handle data assignment modal close
  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    setAssignmentFilters({
      selectedTags: [],
      selectedCampaigns: [],
    });
    setAssignmentCampaign([]);
    setAssignmentDistribution("equal");
    setTotalEntriesToAssign(0);
    setCustomDistribution({});
  }, []);

  // After Call modal handlers
  const handleAfterCallModalClose = useCallback(() => {
    setShowAfterCallModal(false);
    setAfterCallData({
      disposition: "",
      callStatus: "",
      comment: "",
      nextCallDate: "",
      nextCallTime: "",
      generateLead: "no",
    });
  }, []);

  const handleAfterCallSubmit = useCallback(() => {
    if (!afterCallData.disposition) {
      toast.error("Please select a disposition");
      return;
    }
    if (!afterCallData.callStatus) {
      toast.error("Please select a call status");
      return;
    }
    if (!afterCallData.comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    if (!afterCallData.generateLead) {
      toast.error("Please select whether to generate a lead");
      return;
    }

    // Close the dialog
    handleAfterCallModalClose();

    // If lead generation is selected, redirect to create lead page with prospect data
    if (afterCallData.generateLead === "yes" && selectedDataItem) {
      // Show success message and navigate to create lead page
      toast.success(
        "Redirecting to create lead page with pre-filled prospect data...",
      );
      window.location.href = `/crm/leads/create?crm_data_id=${selectedDataItem.id}`;
    } else {
      toast.success("After call data saved successfully! No lead generated.");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("After Call Successful!");
      setSuccessModalDescription(
        "The after call data has been successfully saved.",
      );
    }
  }, [afterCallData, selectedDataItem, handleAfterCallModalClose]);

  // Schedule/Unschedule call handlers
  const handleScheduleCall = useCallback((entry: any) => {
    setSelectedEntryForSchedule(entry);

    // Check if entry has a scheduled call - if yes, we're editing
    if (entry.scheduled_call_at) {
      setIsEditingSchedule(true);
      const scheduledDate = moment(entry.scheduled_call_at);
      setScheduleData({
        date: scheduledDate.format("YYYY-MM-DD"),
        time: scheduledDate.format("HH:mm"),
        notes: entry.note || "",
      });
    } else {
      setIsEditingSchedule(false);
      setScheduleData({
        date: "",
        time: "",
        notes: "",
      });
    }
    setShowScheduleModal(true);
  }, []);

  const handleUnscheduleCallClick = useCallback((entry: any) => {
    setEntryToUnschedule(entry);
    setShowUnscheduleModal(true);
  }, []);

  const confirmUnscheduleCall = useCallback(async () => {
    if (!entryToUnschedule) return;

    try {
      const userExtension = (session?.user as any)?.extension || "default";
      await unscheduleCall(entryToUnschedule.id, userExtension);
      setRefreshKey((prev) => prev + 1);
      setShowUnscheduleModal(false);
      setEntryToUnschedule(null);
      toast.success("Call unscheduled successfully");
    } catch (error) {
      console.error("Failed to unschedule call:", error);
    }
  }, [entryToUnschedule, session]);

  // Schedule modal handlers
  const handleScheduleModalClose = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedEntryForSchedule(null);
    setIsEditingSchedule(false);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
  }, []);

  const handleScheduleSubmit = useCallback(async () => {
    if (!scheduleData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!scheduleData.time) {
      toast.error("Please select a time");
      return;
    }

    try {
      const userExtension = (session?.user as any)?.extension || "default";
      const scheduledDateTime = moment(
        `${scheduleData.date} ${scheduleData.time}`,
      ).toISOString();

      await scheduleCall(
        selectedEntryForSchedule.id,
        scheduledDateTime,
        userExtension,
        scheduleData.notes,
      );
      setRefreshKey((prev) => prev + 1);
      handleScheduleModalClose();
      setShowSuccessfulModal(true);
      setSuccessModalTitle(
        isEditingSchedule
          ? "Call Schedule Updated!"
          : "Schedule Call Successful!",
      );
      setSuccessModalDescription(
        isEditingSchedule
          ? "The call schedule has been successfully updated."
          : "The call has been successfully scheduled.",
      );
    } catch (error) {
      console.error(
        isEditingSchedule
          ? "Failed to update scheduled call:"
          : "Failed to schedule call:",
        error,
      );
    }
  }, [
    scheduleData,
    selectedEntryForSchedule,
    handleScheduleModalClose,
    session,
    isEditingSchedule,
  ]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to delete");
      return;
    }

    try {
      await bulkDeleteCrmData(selectedItems);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setRefreshKey((prev) => prev + 1);
      setSelectedItems([]);
      setClearSelectedRows(!clearSelectedRows);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
    }
  }, [selectedItems]);

  // Handle item selection
  const handleItemSelection = useCallback((selected: CrmDataItem[]) => {
    setSelectedItems(selected.map((item) => item.id));
  }, []);

  // Handle prospect row click
  const handleProspectClick = useCallback((prospect: any) => {
    openProspectSidebar(prospect);
  }, [openProspectSidebar]);

  // Handle close prospect sidebar
  const handleCloseProspectSidebar = useCallback(() => {
    sidebarProspectFetchTokenRef.current += 1;
    setShowProspectSidebar(false);
    setSelectedProspect(null);
  }, []);

  // Handle owner change from prospect sidebar (Update owner dropdown)
  const handleProspectOwnerSelect = useCallback(
    async (ownerValue: string) => {
      const prospect = selectedProspect;
      if (!prospect?.id) return;
      const name = prospect.name ?? "";
      const phone = prospect.phone ?? "";
      const campaignId =
        prospect.campaign_id ?? prospect.campaign?.id ?? null;
      const existingData = (prospect.data as Record<string, unknown>) ?? {};
      try {
        await updateCrmData(prospect.id, {
          name,
          phone,
          campaign_id: campaignId,
          data: { ...existingData, contact_owner: ownerValue || undefined },
        });
        fetchCrmData();
        setSelectedProspect((prev: CrmDataItem | null) =>
          prev
            ? {
                ...prev,
                data: {
                  ...(prev.data as Record<string, unknown>),
                  contact_owner: ownerValue || null,
                },
              }
            : null,
        );
      } catch {
        // Error already shown by updateCrmData
      }
    },
    [selectedProspect, fetchCrmData],
  );

  // Handle open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  // Handle close filters sidebar
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  // Handle preview button click - shows sidebar
  const handlePreviewClick = useCallback((prospect: any) => {
    openProspectSidebar(prospect);
  }, [openProspectSidebar]);

  // Handle first column click - navigates to detail page with prospect ID in URL
  const handleFirstColumnClick = useCallback(
    (prospect: any) => {
      router.push(
        `/crm/detailspage?type=prospect&id=${prospect?.id ?? ""}`,
      );
    },
    [router],
  );

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
          onClick={() => {
            //setShowAddContactsDropdown(!showAddContactsDropdown);
            // setShowCreateQuoteSidebar(true);
            router.push('/billing/create-invoice');
          }}
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
          Create quote
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
              router.push("/crm/quotes/create");
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
        </div>
      )}
      </div>
    </div>
  );

  // Create prospect (contact) API submit - POST crm/crm-data { name, phone, data }
  const handleCreateContactSubmit = useCallback(
    async (addAnother: boolean) => {
      const name = [contactForm.firstName, contactForm.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!name || !contactForm.email || !contactForm.phoneNumber?.trim()) {
        toast.error("Name, email and phone are required");
        return;
      }
      if (contactForm.campaign_id == null) {
        toast.error("Campaign is required");
        return;
      }
      const sessionUser = session?.user as any;
      const userExtension = String(sessionUser?.phone ?? "");
      const assignedTo = userExtension;
      const uploadedBy = userExtension;

      const phoneForPayload =
        contactForm.phone_country_code && contactForm.phoneNumber?.trim()
          ? `${contactForm.phone_country_code} ${contactForm.phoneNumber.trim()}`
          : contactForm.phoneNumber?.trim() ?? "";
      const customFieldsForPayload = (contactForm.custom_fields ?? [])
        .map((f) => ({
          field_name: String(f.field_name ?? "").trim(),
          field_value: String(f.field_value ?? "").trim(),
        }))
        .filter((f) => f.field_name || f.field_value);
      const dataPayload: Record<string, any> = {
        email: contactForm.email.trim(),
        assigned_to: assignedTo,
        uploaded_by: uploadedBy,
        disposition: contactForm.disposition || undefined,
        note: contactForm.note || undefined,
        contact_owner: contactForm.contact_owner ?? undefined,
        // lifecycle_stage: contactForm.lifecycle_stage || undefined,
        legal_basis: contactForm.legal_basis?.length
          ? contactForm.legal_basis
          : undefined,
      };
      customFieldsForPayload.forEach((f) => {
        dataPayload[f.field_name] = f.field_value;
      });
      setCreateContactLoading(true);
      try {
        await createCrmData({
          name,
          phone: phoneForPayload,
          user_extension: userExtension,
          campaign_id: contactForm.campaign_id ?? null,
          scheduled_call_at: contactForm.scheduled_call_at || undefined,
          company_domain: contactForm.company_domain?.trim() || undefined,
          source: contactForm.source_file?.trim() || undefined,
          tag_ids: contactForm.tags?.length
          ? contactForm.tags.map((t) => t.id)
          : [],
          data: dataPayload,
        });
        fetchCrmData();
        setContactForm(createEmptyCrmListContactFormState("source_file"));
        if (!addAnother) {
          setShowCreateContactSidebar(false);
        }
      } catch {
        // Error already shown by createCrmData
      } finally {
        setCreateContactLoading(false);
      }
    },
    [contactForm, fetchCrmData, session?.user],
  );

  const handleUpdateContactSubmit = useCallback(async () => {
    if (editingContactId == null) return;
    const name = [contactForm.firstName, contactForm.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (
      !name ||
      !contactForm.email?.trim() ||
      !contactForm.phoneNumber?.trim()
    ) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (contactForm.campaign_id == null) {
      toast.error("Campaign is required");
      return;
    }
    const phoneForPayload =
      contactForm.phone_country_code && contactForm.phoneNumber?.trim()
        ? `${contactForm.phone_country_code} ${contactForm.phoneNumber.trim()}`
        : contactForm.phoneNumber?.trim() ?? "";
    const customFieldsForPayload = (contactForm.custom_fields ?? [])
      .map((f) => ({
        field_name: String(f.field_name ?? "").trim(),
        field_value: String(f.field_value ?? "").trim(),
      }))
      .filter((f) => f.field_name || f.field_value);
    const dataPayload: Record<string, any> = {
      email: contactForm.email.trim(),
      disposition: contactForm.disposition || undefined,
      note: contactForm.note || undefined,
      contact_owner: contactForm.contact_owner ?? undefined,
      // lifecycle_stage: contactForm.lifecycle_stage || undefined,
      legal_basis: contactForm.legal_basis?.length
        ? contactForm.legal_basis
        : undefined,
    };
    customFieldsForPayload.forEach((f) => {
      dataPayload[f.field_name] = f.field_value;
    });
    setCreateContactLoading(true);
    try {
      await updateCrmData(editingContactId, {
        name,
        phone: phoneForPayload,
        campaign_id: contactForm.campaign_id ?? null,
        company_domain: contactForm.company_domain?.trim() || undefined,
        source: contactForm.source_file?.trim() || undefined,
        scheduled_call_at: contactForm.scheduled_call_at || undefined,
        data: dataPayload,
        tag_ids: contactForm.tags?.length
          ? contactForm.tags.map((t) => t.id)
          : [],
      });
      fetchCrmData();
      setShowCreateContactSidebar(false);
      setEditingContactId(null);
    } catch {
      // Error already shown by updateCrmData
    } finally {
      setCreateContactLoading(false);
    }
  }, [editingContactId, contactForm, fetchCrmData]);

  // Render Create Contact Sidebar
  const renderCreateContactSidebar = () => {
    if (!showCreateContactSidebar) return null;
  
    const isFormValid =
      contactForm.email?.trim() &&
      contactForm.phoneNumber?.trim() &&
      (contactForm.firstName?.trim() || contactForm.lastName?.trim()) &&
      contactForm.campaign_id != null;
  
    return (
      <ProspectEditSidebar
        isOpen={showCreateContactSidebar}
        title={editingContactId ? "Edit Prospect" : "Create Prospect"}
        isEditing={!!editingContactId}
        isFormValid={!!isFormValid}
        createContactLoading={createContactLoading}
        contactForm={contactForm}
        setContactForm={setContactForm}
        contactFormLoading={contactFormLoading}
        contactFormLoadError={contactFormLoadError}
        availableCampaigns={availableCampaigns}
        extensions={extensions}
        availableTags={availableTags}
        parsePhoneNumberInput={parsePhoneNumberInput}
        onClose={() => {
          setShowCreateContactSidebar(false);
          setEditingContactId(null);
          setContactFormLoadError(null);
          setContactFormLoading(false);
        }}
        onSubmitPrimary={() => {
          if (editingContactId) {
            handleUpdateContactSubmit();
          } else {
            handleCreateContactSubmit(false);
          }
        }}
        onCreateAndAddAnother={
          editingContactId
            ? undefined
            : () => {
                handleCreateContactSubmit(true);
              }
        }
      />
    );
  };

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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prospects-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .prospects-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .prospects-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .prospects-table-wrapper .table-responsive table th,
        .prospects-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .prospects-table-wrapper .table-responsive table td:last-child,
        .prospects-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .prospects-table-wrapper .table-responsive table td[style*="width"],
        .prospects-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .generic-table-row.clickable {
          cursor: pointer;
        }
        
        
        /* Page layout for full height */
        .prospects-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .prospects-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .prospects-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        /* Phone input: match other form fields - border like text inputs, no blue focus glow */
        .contact-form-phone-input-wrapper .PhoneInput {
          border: 1px solid #8a8a8a !important;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 14px;
          box-shadow: none !important;
        }
        .contact-form-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #0091ae !important;
          outline: none;
          box-shadow: none !important;
        }
      `,
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
                ? `prospect entry #${itemToDelete.id}`
                : deleteModalMode === "bulk"
                  ? `${selectedItems.length} selected prospects`
                  : undefined
            }
            itemType={
              deleteModalMode === "bulk" ? "prospect entries" : "prospect entry"
            }
            additionalInfo={
              deleteModalMode === "single" && itemToDelete ? (
                <div className="alert alert-warning mb-3">
                  <strong>Entry ID:</strong> #{itemToDelete.id}
                  <br />
                  <strong>Phone:</strong> {itemToDelete.phone || "N/A"}
                  <br />
                  <strong>Assigned To:</strong>{" "}
                  {itemToDelete.user_extension
                    ? extensions.find(
                        (extension: any) =>
                          extension.id.toString() ===
                          itemToDelete.user_extension?.toString(),
                      )?.display_name || itemToDelete.user_extension
                    : "Unassigned"}
                  <br />
                  <strong>Created:</strong>{" "}
                  {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
                </div>
              ) : deleteModalMode === "bulk" ? (
                <div className="alert alert-warning mb-3">
                  <strong>Warning:</strong> This action cannot be undone. All{" "}
                  {selectedItems.length} selected entries will be permanently
                  deleted.
                </div>
              ) : undefined
            }
          />

          {/* Data Assignment Modal */}
          <FormModal
            show={showDataAssignmentModal}
            onHide={handleDataAssignmentModalClose}
            title="Smart Prospect Distribution"
            desc="Please fill the details below to smart prospect distribution."
            size="lg"
            formHtml={
              <CrmListDataAssignmentFormContent
                entityLabel="Prospects"
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
        {/* Prospect Detail Sidebar */}
        {showProspectSidebar && (
          <GenericSidebar
            isOpen={showProspectSidebar}
            onClose={handleCloseProspectSidebar}
            title={selectedProspect?.title || `Quote #${selectedProspect?.id}` || "Quote Details"}
            subtitle={selectedProspect?.contact_name || selectedProspect?.contact_email || ""}
            email={selectedProspect?.contact_email || selectedProspect?.data?.email}
            phone={selectedProspect?.contact_phone || selectedProspect?.phone}
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            record={{
              id: selectedProspect?.id,
              type: RECORD_TYPES.PROSPECT,
            }}
            avatar={{
              initials: getInitials(selectedProspect?.title || selectedProspect?.contact_name || "Q"),
              name: selectedProspect?.title || selectedProspect?.contact_name || "Quote",
              gradient: getRandomColor(selectedProspect?.title || ""),
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
              label: "View quote details",
              onClick: () => {
                const quoteId = Number(
                  selectedProspect?.id ??
                    selectedProspect?.data?.id ??
                    (selectedProspect as any)?.data?.data?.id ??
                    NaN,
                );
                if (!Number.isFinite(quoteId) || quoteId <= 0) return;
                handleCloseProspectSidebar();
                router.push(
                  `/crm/quotes/${quoteId}`,
                );
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Quote",
                  onClick: () => {
                    const id = selectedProspect?.id;
                    if (!id) return;
                    setShowProspectSidebar(false);
                    router.push(`/crm/quotes/${id}/edit`);
                  },
                },
                {
                  label: "Duplicate Quote",
                  onClick: () => {
                    setShowProspectSidebar(false);
                    handleDuplicateQuote(selectedProspect);
                  },
                },
                {
                  label: "Send to Contact",
                  onClick: () => {
                    setShowProspectSidebar(false);
                    handleSendToContact(selectedProspect);
                  },
                },
                {
                  label: "Delete",
                  onClick: () => handleDeleteData(selectedProspect),
                },
              ],
            }}
            sections={[
              {
                id: "about-quote",
                title: "About this quote",
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
                      router.push(`/crm/quotes/${id}/edit`);
                    },
                  },
                ],
                fields: [
                  {
                    label: "Quote Title",
                    value: selectedProspect?.title || `Quote #${selectedProspect?.id}` || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Amount",
                    value: selectedProspect?.amount != null 
                      ? `US$${Number(selectedProspect.amount).toLocaleString()}` 
                      : "N/A",
                    copyable: true,
                  },
                  {
                    label: "Status",
                    value: selectedProspect?.status || "N/A",
                  },
                  {
                    label: "Signing Status",
                    value: selectedProspect?.signing_status || "N/A",
                  },
                  {
                    label: "View Count",
                    value: selectedProspect?.view_count != null 
                      ? String(selectedProspect.view_count) 
                      : "0",
                  },
                  {
                    label: "Contact Name",
                    value: selectedProspect?.contact_name || "N/A",
                    copyable: true,
                    show: !!selectedProspect?.contact_name,
                  },
                  {
                    label: "Contact Email",
                    value: selectedProspect?.contact_email || selectedProspect?.data?.email || "N/A",
                    type: "email",
                    copyable: true,
                    externalLink: (selectedProspect?.contact_email || selectedProspect?.data?.email)
                      ? `mailto:${selectedProspect?.contact_email || selectedProspect?.data?.email}`
                      : undefined,
                    show: !!(selectedProspect?.contact_email || selectedProspect?.data?.email),
                  },
                  {
                    label: "Contact Phone",
                    value: selectedProspect?.contact_phone || selectedProspect?.phone || "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink: (selectedProspect?.contact_phone || selectedProspect?.phone)
                      ? `tel:${selectedProspect?.contact_phone || selectedProspect?.phone}`
                      : undefined,
                    show: !!(selectedProspect?.contact_phone || selectedProspect?.phone),
                  },
                  {
                    label: "Quote Owner",
                    value: selectedProspect?.user_extension
                      ? getNameByExtension(selectedProspect.user_extension)
                      : "—",
                    hasDetails: true,
                    onDetailsClick: () => console.log("Show user details"),
                  },
                  {
                    label: "Description",
                    value: selectedProspect?.description || "N/A",
                    show: !!selectedProspect?.description,
                  },
                  {
                    label: "Created Date",
                    value: selectedProspect?.created_at
                      ? moment(selectedProspect.created_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: selectedProspect?.updated_at
                      ? moment(selectedProspect.updated_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Expiry Date",
                    value: selectedProspect?.expiry_date
                      ? moment(selectedProspect.expiry_date).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                    show: !!selectedProspect?.expiry_date,
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
                  message: "No recent activities for this quote.",
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const id = selectedProspect?.id ?? selectedProspect?.data?.id ?? "";
                      if (id) {
                        router.push(`/crm/quotes/${id}`);
                        handleCloseProspectSidebar();
                      }
                    },
                  },
                },
              },
              {
                id: "quote-history",
                title: "Quote History",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                emptyState: {
                  icon: FileText,
                  message: "No history available for this quote.",
                  action: {
                    label: "View details",
                    onClick: () =>
                      selectedProspect?.id &&
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
          subtitle="Filter quotes by various criteria"
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: prospectsSearch,
              onChange: (value) => setProspectsSearch(value),
              placeholder: "Search by quote title...",
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
              id: "quote_status",
              label: "Quote Status",
              type: "select",
              value: prospectsFilters.campaigns
                ? { value: prospectsFilters.campaigns, label: prospectsFilters.campaigns }
                : null,
              onChange: (selected) => {
                const statusValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  campaigns: statusValue,
                }));
                setActiveFilter("all");
              },
              options: [
                { value: "Draft", label: "Draft" },
                { value: "Published", label: "Published" },
                { value: "Signed", label: "Signed" },
              ],
              placeholder: "Select status...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "last_activity_date",
              label: "Last Activity Date",
              type: "date",
              value: prospectsFilters.nextCallDateFrom || "",
              onChange: (value) => {
                const dateValue = value || null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  nextCallDateFrom: dateValue,
                }));
              },
              placeholder: "Filter by last activity date",
            },
            {
              id: "quote_owner",
              label: "Quote Owner",
              type: "select",
              value: prospectsFilters.sourceFile
                ? (() => {
                    const ownerId = prospectsFilters.sourceFile;
                    const ext = extensions.find(
                      (e: any) => (e.id || e.extension) === ownerId,
                    );
                    return ext
                      ? {
                          value: ownerId,
                          label: ext.display_name || ext.name || ownerId,
                        }
                      : { value: ownerId, label: ownerId };
                  })()
                : null,
              onChange: (selected) => {
                const ownerValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  sourceFile: ownerValue,
                }));
                setActiveFilter("all");
              },
              options: extensions.map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              })),
              placeholder: "Select quote owner...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "signing_status",
              label: "Signing Status",
              type: "select",
              value: prospectsFilters.tags
                ? { value: prospectsFilters.tags, label: prospectsFilters.tags }
                : null,
              onChange: (selected) => {
                const signingValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  tags: signingValue,
                }));
                setActiveFilter("all");
              },
              options: [
                { value: "Pending", label: "Pending" },
                { value: "Viewed", label: "Viewed" },
                { value: "Signed", label: "Signed" },
              ],
              placeholder: "Select signing status...",
              isClearable: true,
              styles: customSelectStyles,
            },
          ]}
          onApply={() => {
            const filtersToApply: Record<string, any> = {};

            if (prospectsSearch) {
              filtersToApply.search = prospectsSearch;
            }
            if (prospectsFilters.assignedTo) {
              filtersToApply.user_extension = [prospectsFilters.assignedTo];
            }
            if (prospectsFilters.campaigns) {
              filtersToApply.status = prospectsFilters.campaigns;
            }
            if (prospectsFilters.nextCallDateFrom) {
              filtersToApply.last_activity_date = prospectsFilters.nextCallDateFrom;
            }
            if (prospectsFilters.sourceFile) {
              filtersToApply.quote_owner = prospectsFilters.sourceFile;
            }
            if (prospectsFilters.tags) {
              filtersToApply.signing_status = prospectsFilters.tags;
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
      {renderCreateContactSidebar()}
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
