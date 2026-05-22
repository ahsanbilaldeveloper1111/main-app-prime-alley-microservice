import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  Button,
  Card,
  Row,
  Col,
  Form,
  Alert,
  Spinner,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  Table,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import type { GroupBase, StylesConfig } from "react-select";
import { toast } from "react-toastify";
import moment from "moment";
import {
  FiDatabase,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiEdit,
  FiPhone,
  FiMessageCircle,
  FiX,
  FiAlertCircle,
  FiCalendar,
  FiTarget,
  FiMoreVertical,
} from "react-icons/fi";
import {
  Users,
  Calendar,
  XCircle,
  Clock as ClockIcon,
  ChevronDown,
  X,
  AlertCircle as AlertCircleIcon,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Phone,
  Mail,
  User,
  History,
  FileText,
  Target,
  Layers,
  Link as LinkIcon,
  Linkedin,
  ExternalLink,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import ConvertToLeadModal from "@components/ConvertToLeadModal";
import { Column } from "@components/CustomDataTable";
import GenericTable, {
  TableColumn,
  TableAction,
  PaginationConfig,
  ToolbarConfig,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import { useCompanyFilterPills } from "@hooks/useCompanyFilterPills";
import { CRM_LIST_PAGE_CALL_END_REASONS } from "@utils/crmListPageStaticData";

import GenericSidebar, {
  QuickAction,
  SidebarField,
} from "@components/GenericSidebarNew";
import GenericFilterSidebar, {
  FilterField,
} from "@components/GenericFilterSidebar";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import { crmAppKeys } from "@query/keys";
import {
  getCrmData,
  getCrmDataById,
  createCrmData,
  updateCrmData,
  uploadCrmDataCsv,
  deleteCrmData,
  assignCrmDataAdvanced,
  getCrmDataCounts,
  bulkDeleteCrmData,
  markCrmDataAsViewed,
  getCampaigns,
  scheduleCall,
  unscheduleCall,
  getCrmDataHistory,
  CrmDataItem,
  CrmDataMetrics,
  downloadExampleCsv,
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  type CompanyData,
  type EnrichmentData,
} from "@utils/crm";
import { CompanyViewModal } from "@page-modules/crm/companies/CompanyViewModal";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import FormModal from "@components/page-partials/FormModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import {
  ModuleSlug,
  formatDuration,
  formatDateTimeToLocal,
  GlobalDateFormat,
  GlobalTimeFormat,
  GlobalDateTimeFormat,
  formatCrmPreviewDate,
  RECORD_TYPES,
} from "@utils/Helper";
import PageSummaryGrid from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";
import { useCrmListPageCoreState } from "@crm/shared/useCrmListPageCoreState";
import { useCrmListAssignmentContactSidebarState } from "@crm/shared/useCrmListAssignmentContactSidebarState";
import { CrmListUnscheduleModal } from "@crm/shared/CrmListScheduleCallModals";
import { CrmListDataAssignmentFormContent } from "@crm/shared/CrmListDataAssignmentFormContent";
import { CrmListHistoryFormContent } from "@crm/shared/CrmListHistoryFormContent";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { getCrmListExtensionDisplayName } from "@crm/shared/crmListExtensionDisplayName";
import { useCrmListActiveTabFiltersEffect } from "@crm/shared/crmListActiveTabFiltersEffect";
import {
  useCrmListCampaignsOnRefreshEffect,
  useCrmListExtensionsLoadEffect,
  useCrmListHistoryModalOpenEffect,
  useCrmListTagsOnRefreshEffect,
} from "@crm/shared/crmListResourceLoadEffects";
import { downloadCallRecordingWithProgress } from "@crm/shared/crmListDownloadRecordingUtils";
import { handleCrmListUploadResponse } from "@crm/shared/crmListUploadResponseUtils";
import { ListCallLogs } from "@utils/calls";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import CircularProgressCircle from "@components/CircularProgressCircle";

import renderCreateCompany, {
  type CompanyFormPayload,
} from "@components/renderCreateCompany";
import {
  CrmPhoneContainer as PhoneContainer,
  CrmKPICard as KPICard,
  CrmFilterBar as FilterBar,
} from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import { getDatetimeLocalMinNow } from "@utils/datetimeLocalInput";
import { useCrmListPreviewPersistence } from "@crm/shared/useCrmListPreviewPersistence";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  useCompaniesActiveFilterFromUrl,
  useCompaniesAddContactsClickOutside,
  useCompaniesContactFormLoadFlagsEffect,
  useCompaniesContactFormPrefillFromCompanyEffect,
  useCompaniesEditCompanySidebarDataEffect,
  useCompaniesEditCompanySidebarErrorEffect,
} from "@hooks/useCompaniesPageBootstrapEffects";

const { PERMISSIONS } = HEADER_CONSTANTS;

type CompanyAssignedToSelectOption = {
  value: string | number;
  label: string | number;
};

type CompanySourceFileSelectOption = { value: string; label: string };

interface CompaniesPaginationState {
  currentPage: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/** Build the params object for the GET /companies list API from page state. */
function buildCompaniesListParams(
  filters: Record<string, any>,
  pagination: CompaniesPaginationState,
  overrides: { page?: number; per_page?: number } = {},
): Record<string, any> {
  const params: Record<string, any> = {
    page: pagination.currentPage,
    per_page: pagination.rowsPerPage,
    ...overrides,
  };

  const assignWhenTruthy = (sourceKey: string, targetKey = sourceKey) => {
    const value = filters[sourceKey];
    if (value) params[targetKey] = value;
  };

  const assignArrayWhenNotEmpty = (
    sourceKey: string,
    targetKey = sourceKey,
  ) => {
    const value = filters[sourceKey];
    if (Array.isArray(value) && value.length > 0) {
      params[targetKey] = value;
    }
  };

  assignWhenTruthy("search");
  assignArrayWhenNotEmpty("campaign_id", "campaign_ids");
  assignArrayWhenNotEmpty("tags");
  assignWhenTruthy("assignment_status");

  applyOwnerFilter(params, filters);
  applyIsViewedFilter(params, filters);

  assignWhenTruthy("created_at_from", "date_from");
  assignWhenTruthy("created_at_to", "date_to");
  assignWhenTruthy("last_called_at_from");
  assignWhenTruthy("last_called_at_to");
  applyHasScheduledCallsFilter(params, filters);
  applyHasTicketsFilter(params, filters);
  assignWhenTruthy("scheduled_call_status");
  assignWhenTruthy("scheduled_call_from");
  assignWhenTruthy("scheduled_call_to");
  assignWhenTruthy("source_file");
  assignArrayWhenNotEmpty("tag_ids");
  assignWhenTruthy("disposition");

  if (pagination.sortBy) {
    params.sort_by = pagination.sortBy;
    params.sort_order = pagination.sortOrder;
  }
  params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
  return params;
}

function applyOwnerFilter(
  params: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (!filters.user_extension?.length) return;
  const ownerValues = Array.isArray(filters.user_extension)
    ? filters.user_extension
    : [filters.user_extension];
  params.user_extensions = ownerValues;
  if (ownerValues[0]) {
    params.assigned_to = ownerValues[0];
  }
}

function applyIsViewedFilter(
  params: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (filters.is_viewed === undefined || filters.is_viewed === "") return;
  params.is_viewed = filters.is_viewed;
}

function applyHasScheduledCallsFilter(
  params: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (filters.has_scheduled_calls === undefined) return;
  params.has_scheduled_calls = filters.has_scheduled_calls;
}

function applyHasTicketsFilter(
  params: Record<string, any>,
  filters: Record<string, any>,
): void {
  if (filters.has_tickets === undefined) return;
  params.has_tickets = filters.has_tickets;
}

/** Resolve the website URL for a company from enrichment + bare domain. */
function buildCompanyWebsiteUrl(
  enrichment: EnrichmentData | undefined,
  domain: string | undefined,
): string | null {
  if (enrichment?.discovered_website) return enrichment.discovered_website;
  if (!domain) return null;
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

interface CompanyAboutSource {
  name?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  data?: {
    email?: string | null;
    city?: string | null;
    country?: string | null;
    industry?: string | null;
    domain?: string | null;
  };
}

/** Build the "About this company" fields list, skipping empty values. */
function buildCompanyAboutFields(
  selectedCompany: CompanyAboutSource | null | undefined,
  websiteUrl: string | null,
  formatDate: (date: string) => string,
): SidebarField[] {
  const fields: SidebarField[] = [];
  if (!selectedCompany) return fields;
  const c = selectedCompany;
  if (c.name) {
    fields.push({ label: "Name", value: c.name, copyable: true });
  }
  if (c.phone) {
    fields.push({
      label: "Phone",
      value: c.phone,
      type: "phone",
      copyable: true,
      externalLink: `tel:${c.phone}`,
    });
  }
  if (c.data?.email) {
    fields.push({
      label: "Email",
      value: c.data.email,
      type: "email",
      copyable: true,
      externalLink: `mailto:${c.data.email}`,
    });
  }
  if (c.data?.city) fields.push({ label: "City", value: c.data.city });
  if (c.data?.country) {
    fields.push({ label: "Country", value: c.data.country });
  }
  if (c.data?.industry) {
    fields.push({ label: "Industry", value: c.data.industry });
  }
  if (c.data?.domain) fields.push({ label: "Domain", value: c.data.domain });
  if (websiteUrl) {
    fields.push({
      label: "Website",
      value: websiteUrl,
      type: "link",
      externalLink: websiteUrl,
    });
  }
  if (c.created_at) {
    fields.push({
      label: "Created",
      value: formatDate(c.created_at),
      type: "date",
    });
  }
  if (c.updated_at) {
    fields.push({
      label: "Updated",
      value: formatDate(c.updated_at),
      type: "date",
    });
  }
  return fields;
}

interface CsvFileValidationResult {
  isValid: boolean;
  errors: string[];
}

const CSV_MAX_SIZE_BYTES = 2 * 1024 * 1024;

/** Validate the user-selected CSV file for the upload modal. */
function validateCsvFile(file: File): CsvFileValidationResult {
  const errors: string[] = [];
  const isCsv =
    file.type.includes("csv") || file.name.toLowerCase().endsWith(".csv");
  if (!isCsv) errors.push("File must be a CSV file");
  if (file.size > CSV_MAX_SIZE_BYTES) {
    errors.push("File size must be less than 2MB");
  }
  if (file.size === 0) errors.push("File cannot be empty");
  return { isValid: errors.length === 0, errors };
}

/** Translate a `dragenter`/`dragleave`/`dragover` event to drag-active state. */
function getScheduleModalTitle(isEditingSchedule: boolean): string {
  return isEditingSchedule ? "Edit Scheduled Call" : "Schedule Call";
}

function getScheduleModalDescription(isEditingSchedule: boolean): string {
  return isEditingSchedule
    ? "Please update the details below to modify the scheduled call."
    : "Please fill the details below to schedule a call.";
}

function resolveDragActiveState(eventType: string): boolean | null {
  if (eventType === "dragenter" || eventType === "dragover") return true;
  if (eventType === "dragleave") return false;
  return null;
}

const CrmCompanyManagement = () => {
  const {
    session,
    router,
    dialNumber,
    isInitialized,
    refreshKey,
    setRefreshKey,
    currentFilters,
    setCurrentFilters,
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

  const {
    assignmentFilters, setAssignmentFilters,
    assignmentCampaign, setAssignmentCampaign,
    assignmentDistribution, setAssignmentDistribution,
    totalEntriesToAssign, setTotalEntriesToAssign,
    customDistribution, setCustomDistribution,
    assignmentCounts, setAssignmentCounts,
    availableTags, setAvailableTags,
    availableCampaigns, setAvailableCampaigns,
    campaignsById, setCampaignsById,
    selectedItems, setSelectedItems,
    afterCallData, setAfterCallData,
    showScheduleModal, setShowScheduleModal,
    selectedEntryForSchedule, setSelectedEntryForSchedule,
    isEditingSchedule, setIsEditingSchedule,
    scheduleData, setScheduleData,
    showUnscheduleModal, setShowUnscheduleModal,
    entryToUnschedule, setEntryToUnschedule,
    showHistoryModal, setShowHistoryModal,
    showProspectSidebar: showCompanySidebar,
    setShowProspectSidebar: setShowCompanySidebar,
    showFiltersSidebar, setShowFiltersSidebar,
    selectedProspect: selectedCompany,
    setSelectedProspect: setSelectedCompany,
    showFilterBar,
    showAddContactsDropdown, setShowAddContactsDropdown,
    showCreateContactSidebar, setShowCreateContactSidebar,
    addContactsRef,
    createContactLoading, setCreateContactLoading,
    editingContactId, setEditingContactId,
    contactFormLoadError, setContactFormLoadError,
    contactFormLoading, setContactFormLoading,
  } = useCrmListAssignmentContactSidebarState();

  const contactCompanyForFormQuery = useQuery({
    queryKey:
      editingContactId === null
        ? ([...crmAppKeys.companies.all(), "byId", "none"] as const)
        : crmAppKeys.companies.byId(editingContactId),
    queryFn: () => {
      if (editingContactId === null) {
        return Promise.reject(new Error("Contact id not available"));
      }
      return getCompany(editingContactId);
    },
    enabled: showCreateContactSidebar && editingContactId !== null,
  });

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    campaign_id: null as number | null,
    contact_owner: null as string | null,
    lifecycle_stage: "Lead",
    disposition: "",
    legal_basis: [] as string[],
    last_called: "",
    last_call_status: "",
    next_call: "",
    scheduled_call_at: "",
    tags: [] as Array<{ value: string; label: string; id?: number }>,
    note: "",
    is_viewed: false,
  });

  // First phone: company + enrichment (structured_data.phones, raw_data.phones) for modals and Call button
  const companySidebarPhone =
    selectedCompany?.phone ??
    selectedCompany?.data?.enrichment_data?.structured_data?.phones?.[0]?.number ??
    selectedCompany?.data?.enrichment_data?.raw_data?.phones?.[0] ??
    "";

  // Activity modals for company sidebar (Call, Task, Meeting, Note, Email with record_type company)
  const companyActivityModals = useCrmActivityModals({
    recordType: "company",
    recordId: selectedCompany?.id ?? selectedCompany?.rawData?.id ?? 0,
    recordName: selectedCompany?.name ?? "",
    recordEmail:
      selectedCompany?.data?.email ??
      selectedCompany?.email ??
      selectedCompany?.data?.enrichment_data?.raw_data?.emails?.[0] ??
      selectedCompany?.data?.enrichment_data?.structured_data?.emails?.[0]?.email ??
      "",
    recordPhone: companySidebarPhone,
  });

  const [showCreateCompanySidebar, setShowCreateCompanySidebar] =
    useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingCompanyData, setEditingCompanyData] =
    useState<CompanyFormPayload | null>(null);

  const companyFormEditQuery = useQuery({
    queryKey:
      editingCompanyId === null
        ? ([...crmAppKeys.companies.all(), "byId", "none"] as const)
        : crmAppKeys.companies.byId(editingCompanyId),
    queryFn: () => {
      if (editingCompanyId === null) {
        return Promise.reject(new Error("Company id not available"));
      }
      return getCompany(editingCompanyId);
    },
    enabled: showCreateCompanySidebar && editingCompanyId !== null,
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

  const [showCompanyAnalytics, setShowCompanyAnalytics] = useState(false);
  const [showAllCompanyStats, setShowAllCompanyStats] = useState(false);

  // Valid filter IDs
  const validFilters = ["all", "scheduled", "has_leads"];

  // Initialize activeFilter state
  const [activeFilter, setActiveFilter] = useState("all");

  useCompaniesActiveFilterFromUrl(router, validFilters, setActiveFilter);
  useCompaniesAddContactsClickOutside(
    showAddContactsDropdown,
    addContactsRef,
    setShowAddContactsDropdown,
  );
  useCompaniesContactFormLoadFlagsEffect(
    showCreateContactSidebar,
    editingContactId,
    contactCompanyForFormQuery,
    setContactFormLoadError,
    setContactFormLoading,
  );
  useCompaniesContactFormPrefillFromCompanyEffect(
    showCreateContactSidebar,
    editingContactId,
    contactCompanyForFormQuery,
    setContactForm,
  );
  useCompaniesEditCompanySidebarDataEffect(
    showCreateCompanySidebar,
    editingCompanyId,
    companyFormEditQuery,
    setEditingCompanyData,
  );
  useCompaniesEditCompanySidebarErrorEffect(
    showCreateCompanySidebar,
    editingCompanyId,
    companyFormEditQuery,
    setEditingCompanyData,
  );

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));

      // Update URL with tab query parameter
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );
  const [companySearch, setCompanySearch] = useState("");
  const [companiesViewMode, setCompaniesViewMode] = useState<"table" | "board">(
    "table",
  );
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [companyFilters, setCompanyFilters] = useState({
    assignedTo: null as string | null,
    campaigns: null as string[] | null,
    nextCallScheduled: null as string | null,
    nextCallDateFrom: null as string | null,
    nextCallDateTo: null as string | null,
    sourceFile: null as string | null,
    tags: null as string[] | null,
  });

  // Column customization and pagination states
  const defaultSelectedColumns = [
    "name",
    "created_at",
    "phone",
    "last_called_at",
    "city",
    "country",
    "industry",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    () => defaultSelectedColumns,
  );
  const [draftSelectedColumns, setDraftSelectedColumns] = useState<string[]>(
    [],
  );

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  /** Total count of all companies (unchanged when switching to Scheduled / Convert to Leads tab) */
  const [totalAllCompanies, setTotalAllCompanies] = useState(0);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [metrics, setMetrics] = useState<CrmDataMetrics>({
    assigned_records: 0,
    unassigned_records: 0,
    scheduled_records: 0,
    not_scheduled_records: 0,
    scheduled_next_hour_records: 0,
    scheduled_next_24_hours_records: 0,
  });

  // History data state
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

  // Function to fetch campaigns by IDs
  const fetchCampaignsByIds = useCallback(async (campaignIds: number[]) => {
    try {
      const campaignsMap: Record<number, string> = {};

      // Fetch campaigns in batches to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < campaignIds.length; i += batchSize) {
        const batch = campaignIds.slice(i, i + batchSize);
        const campaignsResponse = await getCampaigns({
          per_page: 1000,
          filters: { ids: batch },
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        campaignsResponse.data.forEach((campaign: any) => {
          campaignsMap[campaign.id] = campaign.name;
        });
      }

      setCampaignsById((prev) => ({ ...prev, ...campaignsMap }));
      return campaignsMap;
    } catch (error) {
      console.error("Failed to fetch campaigns by IDs:", error);
      return {};
    }
  }, []);

  // Fetch history data
  const fetchHistoryData = useCallback(
    async (page: number = 1) => {
      try {
        setHistoryLoading(true);
        const response = await getCrmDataHistory(page, 15);
        setHistoryData(response.data);
        setHistoryPagination(response.pagination);

        // Extract campaign IDs from history data and fetch campaign names
        const campaignIds: number[] = [];
        response.data.forEach((activity: any) => {
          if (activity.details?.campaign_ids) {
            campaignIds.push(...activity.details.campaign_ids);
          }
        });

        if (campaignIds.length > 0) {
          const uniqueCampaignIds = Array.from(new Set(campaignIds));
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

  const buildCrmDataParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) =>
      buildCompaniesListParams(memoizedFilters, pagination, overrides),
    [
      memoizedFilters,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortBy,
      pagination.sortOrder,
    ],
  );

  const queryClient = useQueryClient();
  const companiesListFiltersKey = useMemo(
    () => JSON.stringify(memoizedFilters),
    [memoizedFilters],
  );

  const companiesListQuery = useQuery({
    queryKey: crmAppKeys.companiesPage.list({
      filtersKey: companiesListFiltersKey,
      activeTab: activeFilter,
      page: pagination.currentPage,
      perPage: pagination.rowsPerPage,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    }),
    queryFn: () => getCompanies(buildCrmDataParams()),
    placeholderData: (previousData) => previousData,
  });

  const companiesListLoading =
    companiesListQuery.isPending || companiesListQuery.isFetching;

  const refreshCompaniesListAndPicklists = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: crmAppKeys.companiesPage.all() })
      .catch(() => undefined);
    setRefreshKey((prev) => prev + 1);
  }, [queryClient, setRefreshKey]);

  // Extract unique source_file values from dataList for creatable select
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    dataList.forEach((item: any) => {
      if (item.source_file && item.source_file.trim()) {
        sources.add(item.source_file.trim());
      }
    });
    return Array.from(sources)
      .sort()
      .map((source) => ({
        value: source,
        label: source,
      }));
  }, [dataList]);

  // Set draft selected columns when column editor is shown
  useEffect(() => {
    if (showColumnEditor) setDraftSelectedColumns([...selectedColumns]);
  }, [showColumnEditor]);

  useCrmListExtensionsLoadEffect(setExtensions);
  useCrmListHistoryModalOpenEffect(showHistoryModal, fetchHistoryData);
  useCrmListTagsOnRefreshEffect(refreshKey, setAvailableTags, {
    mapMode: "includeAll",
  });
  useCrmListCampaignsOnRefreshEffect(
    refreshKey,
    setAvailableCampaigns,
    setCampaignsById,
    "replace",
  );

  const getNameByExtension = useCallback(
    (extension: string) =>
      getCrmListExtensionDisplayName(extensions, extension),
    [extensions],
  );

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
  }, []);
  const companyFilterPills = useCompanyFilterPills({
    currentFilters,
    handleFiltersChange,
    refresh: () => refreshCompaniesListAndPicklists(),
    extensions,
  });

  useCrmListActiveTabFiltersEffect(activeFilter, setCurrentFilters);

  // Map CompanyData to table shape (CrmDataItem-like)
  const mapCompanyToRow = useCallback((c: CompanyData): CrmDataItem => {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone ?? "",
      created_at: c.created_at ?? "",
      updated_at: c.updated_at ?? "",
      last_called_at: null,
      user_extension: null,
      campaign_id: null,
      campaign: null,
      is_viewed: false,
      scheduled_call_at: null,
      status: "active",
      source_file: null,
      tags: null,
      note: null,
      data: {
        email: c.email ?? "",
        city: c.city ?? "",
        country: c.country ?? "",
        industry: c.industry ?? "",
        domain: c.domain ?? "",
        enrichment_status: c.enrichment_status ?? null,
        enrichment_data: c.enrichment_data ?? null,
      },
    } as CrmDataItem;
  }, []);

  useEffect(() => {
    if (companiesListQuery.isError) {
      setDataList([]);
      setTotalRecords(0);
      setTotalAllCompanies(0);
      return;
    }
    if (!companiesListQuery.data || companiesListQuery.isPlaceholderData) return;
    const response = companiesListQuery.data;
    const rows = (response.data || []).map(mapCompanyToRow);
    setDataList(rows);
    setTotalRecords(response.total ?? 0);
    setTotalAllCompanies(response.total ?? 0);
    setMetrics((prev) => ({
      ...prev,
      assigned_records: response.total ?? 0,
      unassigned_records: 0,
    }));
  }, [
    companiesListQuery.data,
    companiesListQuery.isError,
    companiesListQuery.isPlaceholderData,
    mapCompanyToRow,
  ]);

  // Clear selection after bulk delete or when clearSelectedRows changes
  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);
    if (validation.isValid) {
      setSelectedFile(file);
      return;
    }
    validation.errors.forEach((error) => toast.error(error));
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextActive = resolveDragActiveState(e.type);
    if (nextActive !== null) setDragActive(nextActive);
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
    if (
      !session?.user?.permissions?.includes(
        PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT,
      )
    ) {
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

      handleCrmListUploadResponse(response, "companies", {
        setSuccessModalTitle,
        setSuccessModalDescription,
        setShowSuccessfulModal,
      });

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      refreshCompaniesListAndPicklists();
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

  // Handle view data item
  const handleViewData = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setSelectedCompany(item);
    setShowCompanySidebar(true);
    setShowViewModal(false);
  }, []);

  // Fetch call recordings (not call logs) for the selected company
  // Filters by current user's extension and company's phone number
  const fetchCallRecordings = useCallback(
    async (phoneNumber: string, userExtension?: string) => {
      if (!phoneNumber) {
        setCallRecordings([]);
        return;
      }

      if (!userExtension) {
        setCallRecordings([]);
        return;
      }

      setCallRecordingsLoading(true);
      try {
        const filters = {
          remote_party_number: [phoneNumber],
          extension: [userExtension],
        };

        // Use ListCallLogs with reportType 'recordings' to fetch call recordings
        const response = await ListCallLogs(
          {
            page: 1,
            perPage: 5,
            search: "",
            filters,
            reportType: "recordings", // This ensures we get recordings, not logs
            moduleSlug: ModuleSlug.CALL_RECORDINGS,
          },
          "call-logs/recordings", // Endpoint for call recordings
        );

        if (response?.dataList) {
          setCallRecordings(response.dataList);
        } else {
          setCallRecordings([]);
        }

        // Store total count from pagination
        if (response?.total !== undefined) {
          setCallRecordingsTotal(response.total);
        } else {
          setCallRecordingsTotal(0);
        }
      } catch (error) {
        console.error("Failed to fetch call recordings:", error);
        setCallRecordings([]);
        setCallRecordingsTotal(0);
      } finally {
        setCallRecordingsLoading(false);
      }
    },
    [session],
  );

  // Call recordings are not shown in company view modal; no fetch on view open

  // Call recordings not shown in company sidebar; no fetch on sidebar open

  // Handle play call recording
  const handlePlayCallRecording = useCallback((recording: any) => {
    setSelectedRecording(recording);
    setShowRecordingPlayerModal(true);
  }, []);

  const handleDownloadCallRecording = useCallback(async (recording: any) => {
    await downloadCallRecordingWithProgress(recording, {
      setDownloadingRecordings,
      setDownloadProgress,
    });
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete (Companies API)
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCompany(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      refreshCompaniesListAndPicklists();
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

  // Calculate filtered entry counts using API
  const calculateEntryCounts = useCallback(async () => {
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
      // Fallback to static data
      return {
        total: 5000,
        assigned: 2000,
        unassigned: 3000,
      };
    }
  }, [assignmentFilters]);

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

      refreshCompaniesListAndPicklists();
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
      refreshCompaniesListAndPicklists();
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
      companyId: selectedCompany.id,
      note,
      createTask,
      taskDueDate,
    });

    // Here you would typically:
    // 1. Save the note to your backend/database
    // 2. If createTask is true, create a task with the due date
    // 3. Update the UI to show the new note
    // 4. Maybe refresh the notes section

    alert(
      `Note saved successfully!\n\nNote: ${note}\nCreate Task: ${createTask}\nDue Date: ${taskDueDate || "N/A"}`,
    );
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

    // If lead generation is selected, redirect to create lead page with company data
    if (afterCallData.generateLead === "yes" && selectedDataItem) {
      // Show success message and navigate to create lead page
      toast.success(
        "Redirecting to create lead page with pre-filled company data...",
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
      refreshCompaniesListAndPicklists();
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
      refreshCompaniesListAndPicklists();
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
      setShowBulkDeleteModal(false);
      refreshCompaniesListAndPicklists();
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

  // Handle company row click
  const handleCompanyClick = useCallback(
    (company: any) => {
      const id = company?.id ?? company?.rawData?.id;
      if (id != null) {
        router.push(
          `/crm/detailspage?type=companies&id=${encodeURIComponent(String(id))}`
        );
      } else {
        setSelectedCompany(company);
        setShowCompanySidebar(true);
      }
    },
    [router],
  );

  // Handle open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  // Handle close filters sidebar
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const handlePreviewClickBase = useCallback((company: any) => {
    setSelectedCompany(company);
    setShowCompanySidebar(true);
  }, []);

  const openCompanyPreviewById = useCallback(
    (id: number) => {
      handlePreviewClickBase({ id, rawData: { id } });
    },
    [handlePreviewClickBase],
  );

  const { writePreviewIdToStorage, clearPreviewIdFromStorage } =
    useCrmListPreviewPersistence({
      localStorageKey: "crm-companies-list-preview-record-id",
      listLoading: companiesListLoading,
      openPreviewByNumericId: openCompanyPreviewById,
    });

  const handlePreviewClick = useCallback(
    (company: any) => {
      const cid = company?.id ?? company?.rawData?.id;
      if (cid != null) writePreviewIdToStorage(Number(cid));
      handlePreviewClickBase(company);
    },
    [handlePreviewClickBase, writePreviewIdToStorage],
  );

  // Handle close company sidebar (X): clear persisted preview id
  const handleCloseCompanySidebar = useCallback(() => {
    setShowCompanySidebar(false);
    setSelectedCompany(null);
    clearPreviewIdFromStorage();
  }, [clearPreviewIdFromStorage]);

  /** Hide sidebar when navigating to detail so browser back can restore preview. */
  const handleHideCompanySidebarKeepPersistence = useCallback(() => {
    setShowCompanySidebar(false);
    setSelectedCompany(null);
  }, []);

  // Stats cards data for metrics
  const companyStatsCards: StatsCardData[] = useMemo(
    () => {
      const missingOwnerCount = dataList.filter(
        (p: any) => !p.user_extension || p.user_extension === "",
      ).length;
      const missingLeadStatusCount = dataList.filter(
        (p: any) => !p.disposition || p.disposition === "",
      ).length;
      const neverCalledCount = dataList.filter((p: any) => !p.last_called_at)
        .length;
      const noRecentActivityCount = dataList.filter((p: any) => {
        if (!p.last_called_at) return true;
        const daysSinceActivity = moment().diff(
          moment(p.last_called_at),
          "days",
        );
        return daysSinceActivity > 30;
      }).length;

      return [
        {
          title: "Companies missing Owner",
          value: missingOwnerCount,
          icon: User,
          iconColor: "#1D4ED8",
          iconBgColor: "#DBEAFE",
          subtitle: "No company owner is assigned",
        },
        {
          title: "Companies missing Lead Status",
          value: missingLeadStatusCount,
          icon: ClipboardList,
          iconColor: "#7C3AED",
          iconBgColor: "#EDE9FE",
          subtitle: "Disposition/status is empty",
        },
        {
          title: "Companies never called",
          value: neverCalledCount,
          icon: PhoneIcon,
          iconColor: "#D97706",
          iconBgColor: "#FEF3C7",
          metric: {
            text: "No call activity recorded yet",
            dotColor: "#D97706",
          },
        },
        {
          title: "Companies with no recent activity",
          value: noRecentActivityCount,
          icon: ClockIcon,
          iconColor: "#BE123C",
          iconBgColor: "#FFE4E6",
          metric: {
            text: "Last activity over 30 days",
            dotColor: "#BE123C",
          },
        },
      ];
    },
    [dataList],
  );

  // Define columns for GenericTable - Clean declarative definitions
  const companyColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Company Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getRandomColor(row.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "created_at",
        label: "Create Date",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row.created_at ? moment(row.created_at).format("MMM DD, YYYY") : "-",
      },
      {
        key: "phone",
        label: "Phone Number",
        sortable: true,
        type: "custom",
        align: "left",
        render: (row) => (
          <PhoneContainer
            phone={row?.phone}
            onClick={() => handleCallClick(row)}
          />
        ),
      },
      {
        key: "last_called_at",
        label: "Last Activity Date",
        sortable: false,
        type: "text",
        accessor: (row) =>
          row.last_called_at
            ? moment(row.last_called_at).format("MMM DD, YYYY")
            : "-",
      },
      {
        key: "city",
        label: "City",
        sortable: true,
        type: "text",
        accessor: (row) => row.data?.city || row.city || "N/A",
        emptyValue: "N/A",
      },
      {
        key: "country",
        label: "Country/Region",
        sortable: true,
        type: "text",
        accessor: (row) => row.data?.country || row.country || "N/A",
        emptyValue: "N/A",
      },
      {
        key: "industry",
        label: "Industry",
        sortable: true,
        type: "badge",
        accessor: (row) => row.data?.industry || row.industry || "N/A",
        badge: {
          getVariant: () => "primary",
        },
        emptyValue: "N/A",
      },
      {
        key: "enrichment_status",
        label: "Enrichment",
        sortable: true,
        type: "badge",
        accessor: (row) => row.data?.enrichment_status ?? "—",
        badge: {
          getVariant: (row) => {
            const s = row.data?.enrichment_status;
            if (s === "success") return "success";
            if (s === "failed") return "danger";
            return "secondary";
          },
        },
        emptyValue: "—",
      },
    ],
    [extensions, CRM_LIST_PAGE_CALL_END_REASONS, handleCallClick],
  );

  // Define table actions
  const companyActions: TableAction<any>[] = useMemo(
    () => [
      ...(session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
        ? [
            {
              label: "View",
              icon: <Eye size={16} />,
              onClick: (row: any) => handleViewData(row),
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_DATA_MANAGEMENT)
        ? [
            {
              label: "Edit",
              icon: <FiEdit size={16} />,
              onClick: (row: any) => {
                setEditingCompanyId(row.id);
                setShowCreateCompanySidebar(true);
              },
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes(
        PERMISSIONS.CALL_SERVICE_CRM_DATA_MANAGEMENT,
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
                    PERMISSIONS.CALL_SERVICE_CRM_DATA_MANAGEMENT,
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
                    show: () => false,
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

  // Define old columns for GenericListPage (keep for backward compatibility if needed)
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.name ? (
              <span className="text-muted">{props.name}</span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.phone ? (
              <span className="status-badge info">{props.phone}</span>
            ) : (
              <span className="status-badge info">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "source",
        name: "Source",
        selector: (row: any) => row.source_file,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.source_file ? (
              <span className="status-badge secondary">
                {props.source_file}
              </span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "user_extension",
        name: "Assigned To",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.user_extension ? (
              <span className="status-badge success">
                {extensions.find(
                  (extension: any) =>
                    extension.id.toString() ===
                    props.user_extension?.toString(),
                )?.display_name || props.user_extension}
              </span>
            ) : (
              <span className="status-badge default">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        key: "campaign",
        name: "Campaign",
        selector: (row: any) => row.campaign_id,
        sortable: true,
        cell: (props: any) => {
          return (
            <div>
              {props?.campaign ? (
                <span className="status-badge primary">
                  {props.campaign?.name}
                </span>
              ) : (
                <span className="status-badge info">No Campaign</span>
              )}
            </div>
          );
        },
      },
      {
        key: "last_called_at",
        name: "Last Called",
        selector: (row: any) => row.last_called_at,
        sortable: false,
        cell: (props: any) => {
          // Generate random date within last week
          const now = moment();
          const oneWeekAgo = moment().subtract(7, "days");
          const randomDays = Math.floor(Math.random() * 7);
          const randomHours = Math.floor(Math.random() * 24);
          const randomMinutes = Math.floor(Math.random() * 60);

          const lastCalled = oneWeekAgo
            .add(randomDays, "days")
            .add(randomHours, "hours")
            .add(randomMinutes, "minutes")
            .toISOString();

          return (
            <div className="d-flex align-items-center">
              <span className="text-uppercase">
                {lastCalled
                  ? moment(lastCalled).format(GlobalDateTimeFormat)
                  : "-"}
              </span>
            </div>
          );
        },
      },
      {
        key: "last_call_end_reason",
        name: "Last Call Status",
        selector: (row: any) => row.last_call_end_reason,
        sortable: true,
        cell: (props: any) => {
          // Static data for now
          const endReason =
            CRM_LIST_PAGE_CALL_END_REASONS.find((r) => r.value === "answered") ||
            CRM_LIST_PAGE_CALL_END_REASONS[0];
          return (
            <span className={`status-badge ${endReason.color as any}`}>
              {endReason.label}
            </span>
          );
        },
      },
      {
        key: "disposition",
        name: "Disposition",
        selector: (row: any) => row.disposition,
        sortable: true,
        cell: (props: any) => {
          // Static disposition data for now
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

          // Randomly select a disposition for demo purposes
          const randomDisposition =
            dispositions[Math.floor(Math.random() * dispositions.length)];

          return (
            <span className={`status-badge ${randomDisposition.color as any}`}>
              {randomDisposition.label}
            </span>
          );
        },
      },
      {
        key: "scheduled_call_at",
        name: "Next Call",
        selector: (row: any) => row.scheduled_call_at,
        sortable: true,
        cell: (props: any) => {
          if (!props.scheduled_call_at) {
            return <span className="status-badge info">Not scheduled</span>;
          }

          const isOverdue = moment(props.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(props.scheduled_call_at).isBefore(
            moment().add(1, "hour"),
          );

          return (
            <div className="d-flex align-items-center">
              <span
                className={`status-badge text-uppercase ${
                  isOverdue ? "danger" : isNextHour ? "warning" : ""
                }`}
              >
                {props.scheduled_call_at
                  ? moment(props.scheduled_call_at).format(GlobalDateTimeFormat)
                  : "-"}
                {isOverdue && <span className="ms-1 fw-bold">(Overdue)</span>}
                {isNextHour && !isOverdue && (
                  <span className="ms-1 fw-bold">(Soon)</span>
                )}
              </span>
            </div>
          );
        },
      },

      ...(session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
        ? [
            {
              key: "view_action",
              name: "View",
              selector: (row: any) => row.id,
              sortable: false,
              cell: (props: any) => (
                <Button
                  variant="primary"
                  className="app-button"
                  size="sm"
                  onClick={() => handleViewData(props)}
                  title="View Details"
                >
                  <FiEye size={14} />
                </Button>
              ),
            },
          ]
        : []),

      {
        key: "call_action",
        name: "Call",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            {session?.user?.permissions?.includes(
              PERMISSIONS.CALL_SERVICE_CRM_DATA_MANAGEMENT,
            ) && (
              <Button
                variant="success"
                className="app-button"
                size="sm"
                onClick={() => handleCallClick(props)}
                title="Call Now"
              >
                <FiPhone size={14} />
              </Button>
            )}
          </div>
        ),
      },

      {
        key: "tags",
        name: "Tags",
        selector: (row: any) => row.tags,
        sortable: false,
        cell: (props: any) => {
          // Show hardcoded tags for now
          const tags = props.tags;
          return (
            <div className="d-flex flex-wrap gap-1">
              {tags?.map((tag: any, index: any) => (
                <span key={index} className="status-badge info">
                  {tag.name}
                </span>
              ))}
            </div>
          );
        },
      },
      // {
      //   key: "delete_action",
      //   name: "Delete",
      //   selector: (row: any) => row.id,
      //   sortable: false,
      //   cell: (props: any) => (
      //     <Button
      //       variant="danger"
      //       className="app-button"
      //       size="sm"
      //       onClick={() => handleDeleteData(props)}
      //       title="Delete Entry"
      //     >
      //       <FiTrash2 size={14} />
      //     </Button>
      //   ),
      // },
    ],
    [
      handleViewData,
      handleMarkAsViewed,
      handleDeleteData,
      handleCallAction,
      handleCallClick,
      handlePlayRecording,
      extensions,
      availableCampaigns,
      CRM_LIST_PAGE_CALL_END_REASONS,
      handleScheduleCall,
      handleUnscheduleCallClick,
    ],
  );

  const renderCompaniesCustomBody = () => {
    if (companiesViewMode !== "board") return undefined;
    return (
      <KanbanBoard
        columns={prospectsToKanbanColumns(
          dataList,
          getInitials,
          getRandomColor,
        )}
        onCardClick={(card) => handleViewData(card.raw)}
        onCardMove={(cardId, _fromCol, toCol) => {
          const company = dataList.find((entry) => entry.id === cardId);
          if (!company) return;
          updateCrmData(Number(cardId), {
            name: company.name || "",
            phone: company.phone || "",
            campaign_id: company.campaign_id,
            data: { ...company.data, lifecycle_stage: toCol },
            scheduled_call_at: company.scheduled_call_at || undefined,
            company_domain: company.data?.company_domain || undefined,
            company_name: company.data?.company_name || undefined,
            source:
              company.data?.source_file ||
              company.data?.source ||
              undefined,
          });
        }}
        searchValue={companySearch}
      />
    );
  };

  const renderConvertToLeadModalContent = () => {
    if (!convertingToLeadCrmRecordId) return null;
    return (
      <ConvertToLeadModal
        show={showConvertToLeadModal}
        onHide={() => {
          setShowConvertToLeadModal(false);
          setConvertingToLeadCrmRecordId(null);
        }}
        prospectId={convertingToLeadCrmRecordId}
        onSuccess={() => {
          refreshCompaniesListAndPicklists();
          toast.success("Company converted to lead successfully!");
        }}
      />
    );
  };

  // Render Add Companies Button with bulk delete action
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
      {session?.user?.permissions?.includes(
        PERMISSIONS.DELETE_CRM_DATA_MANAGEMENT,
      ) &&
        selectedItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowBulkDeleteModal(true)}
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
          setShowCreateCompanySidebar(false);
          setEditingCompanyId(null);
          setShowCreateCompanySidebar(true);
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
          e.currentTarget.style.backgroundColor = "#0052A3";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#0066CC";
        }}
      >
        Add companies
      </button>
      </div>
    </div>
  );

  // Create company (contact) API submit - POST crm/crm-data { name, phone, data }
  const handleCreateContactSubmit = useCallback(
    async (addAnother: boolean) => {
      const name = [contactForm.firstName, contactForm.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!name?.trim()) {
        toast.error("Company name is required");
        return;
      }

      setCreateContactLoading(true);
      try {
        await createCompany({
          name: name.trim(),
          phone: contactForm.phoneNumber?.trim() || undefined,
          email: contactForm.email?.trim() || undefined,
          city: (contactForm as any).city ?? undefined,
          country: (contactForm as any).country ?? undefined,
          industry: (contactForm as any).industry ?? undefined,
          domain: (contactForm as any).domain ?? undefined,
        });
        refreshCompaniesListAndPicklists();
        setContactForm({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          campaign_id: null,
          contact_owner: null,
          lifecycle_stage: "Lead",
          disposition: "",
          legal_basis: [],
          last_called: "",
          last_call_status: "",
          next_call: "",
          scheduled_call_at: "",
          tags: [],
          note: "",
          is_viewed: false,
        });
        if (!addAnother) {
          setShowCreateContactSidebar(false);
        }
      } catch {
        // Error already shown by createCompany
      } finally {
        setCreateContactLoading(false);
      }
    },
    [contactForm, refreshCompaniesListAndPicklists],
  );

  const handleUpdateContactSubmit = useCallback(async () => {
    if (editingContactId == null) return;
    const name = [contactForm.firstName, contactForm.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!name?.trim()) {
      toast.error("Company name is required");
      return;
    }
    setCreateContactLoading(true);
    try {
      await updateCompany(editingContactId, {
        name: name.trim(),
        phone: contactForm.phoneNumber?.trim() || undefined,
        email: contactForm.email?.trim() || undefined,
        city: (contactForm as any).city ?? undefined,
        country: (contactForm as any).country ?? undefined,
        industry: (contactForm as any).industry ?? undefined,
        domain: (contactForm as any).domain ?? undefined,
      });
      refreshCompaniesListAndPicklists();
      setShowCreateContactSidebar(false);
      setEditingContactId(null);
    } catch {
      // Error already shown by updateCompany
    } finally {
      setCreateContactLoading(false);
    }
  }, [editingContactId, contactForm, refreshCompaniesListAndPicklists]);

  // Render Create Contact Sidebar
  const renderCreateContactSidebar = () => {
    if (!showCreateContactSidebar) return null;

    const isFormValid =
      contactForm.firstName?.trim() || contactForm.lastName?.trim();

    const scheduledFloor = getDatetimeLocalMinNow();
    const isEditingContact = editingContactId != null;
    const allowLegacyPastScheduled =
      isEditingContact &&
      contactForm.scheduled_call_at !== "" &&
      contactForm.scheduled_call_at < scheduledFloor;
    const scheduledInputMin = allowLegacyPastScheduled
      ? undefined
      : scheduledFloor;

    return (
      <>
        <div
          className="contact-sidebar-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: "transparent",
          }}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          className="contact-sidebar-container"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "600px",
            height: "100vh",
            backgroundColor: "#ffffff",
            boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",

          }}
        >
          {/* Header */}
          <div
            className="contact-sidebar-header"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #eaf0f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              className="contact-sidebar-title"
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
              }}
            >
              {editingContactId ? "Edit Contact" : "Create Contact"}
            </h2>
            <button
              className="contact-sidebar-close-btn"
              onClick={() => {
                setShowCreateContactSidebar(false);
                setEditingContactId(null);
                setContactFormLoadError(null);
                setContactFormLoading(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: "#718096",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !isFormValid ||
                createContactLoading ||
                (editingContactId != null && contactFormLoading)
              )
                return;
              if (editingContactId) handleUpdateContactSubmit();
              else handleCreateContactSubmit(false);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {contactFormLoadError && (
              <div
                style={{
                  padding: "12px 24px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                {contactFormLoadError}
              </div>
            )}
            {/* Form Content */}
            <div
              className="contact-sidebar-content"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "40px",
              }}
            >
              {editingContactId && contactFormLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    gap: "16px",
                  }}
                >
                  <Spinner
                    animation="border"
                    role="status"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      color: "#0091ae",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Loading company...
                  </span>
                </div>
              ) : (
                <>
                  {/* Required: Name, Email, Phone */}
                  <div className="contact-form-section">
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        First name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="firstname-input"
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            firstName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Last name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="lastname-input"
                        value={contactForm.lastName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            lastName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Email <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="email"
                        data-test-id="email-input"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Phone <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        data-test-id="phone-input"
                        value={contactForm.phoneNumber}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            phoneNumber: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                  </div>

                  {/* Optional: Campaign, Associate with, Lifecycle stage, Disposition, Legal basis */}
                  <div
                    className="contact-form-section"
                    style={{ marginTop: "24px" }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Campaign
                      </label>
                      <Select
                        value={
                          contactForm.campaign_id != null
                            ? (() => {
                                const c = availableCampaigns.find(
                                  (x) => x.id === contactForm.campaign_id,
                                );
                                return c
                                  ? { value: String(c.id), label: c.label }
                                  : null;
                              })()
                            : null
                        }
                        onChange={(opt: any) =>
                          setContactForm({
                            ...contactForm,
                            campaign_id: opt?.value ? Number(opt.value) : null,
                          })
                        }
                        options={availableCampaigns.map((c) => ({
                          value: String(c.id),
                          label: c.label,
                        }))}
                        placeholder="Select campaign"
                        isClearable
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Associate with
                      </label>
                      <Select
                        value={(() => {
                          const opts = extensions.map((ext: any) => ({
                            value: String(ext.extension ?? ext.id ?? ""),
                            label:
                              ext.display_name ||
                              ext.name ||
                              ext.extension ||
                              String(ext.id || ""),
                          }));
                          return contactForm.contact_owner != null
                            ? opts.find(
                                (o) => o.value === contactForm.contact_owner,
                              ) || null
                            : null;
                        })()}
                        onChange={(opt: any) =>
                          setContactForm({
                            ...contactForm,
                            contact_owner: opt?.value ?? null,
                          })
                        }
                        options={extensions.map((ext: any) => ({
                          value: String(ext.extension ?? ext.id ?? ""),
                          label:
                            ext.display_name ||
                            ext.name ||
                            ext.extension ||
                            String(ext.id || ""),
                        }))}
                        placeholder="Select associate with"
                        isClearable
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Lifecycle stage
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                          }}
                        >
                          {contactForm.lifecycle_stage || "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {["Lead", "Prospect", "Customer", "Evangelist"].map(
                            (stage) => (
                              <Dropdown.Item
                                key={stage}
                                onClick={() =>
                                  setContactForm({
                                    ...contactForm,
                                    lifecycle_stage: stage,
                                  })
                                }
                              >
                                {stage}
                              </Dropdown.Item>
                            ),
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Disposition
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.disposition
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.disposition || "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {[
                            "interested",
                            "not_interested",
                            "callback_requested",
                            "no_answer",
                            "busy",
                            "do_not_call",
                            "wrong_number",
                            "follow_up",
                          ].map((d) => (
                            <Dropdown.Item
                              key={d}
                              onClick={() =>
                                setContactForm({
                                  ...contactForm,
                                  disposition: d,
                                })
                              }
                            >
                              {d.replace(/_/g, " ")}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Legal basis for processing contact&apos;s data
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.legal_basis?.length
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.legal_basis?.length
                            ? contactForm.legal_basis.join(", ")
                            : "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{ width: "100%", padding: "8px" }}
                        >
                          {[
                            "Legitimate interest",
                            "Consent",
                            "Contract",
                            "Legal obligation",
                            "Vital interests",
                            "Public task",
                          ].map((option) => (
                            <Dropdown.Item
                              key={option}
                              as="div"
                              style={{ padding: "4px 8px" }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const isSelected =
                                  contactForm.legal_basis.includes(option);
                                setContactForm({
                                  ...contactForm,
                                  legal_basis: isSelected
                                    ? contactForm.legal_basis.filter(
                                        (b) => b !== option,
                                      )
                                    : [...contactForm.legal_basis, option],
                                });
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                label={option}
                                checked={contactForm.legal_basis.includes(
                                  option,
                                )}
                                onChange={() => {}}
                              />
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>

                  {/* Optional: Datetime and text fields */}
                  <div
                    className="contact-form-section"
                    style={{
                      marginTop: "24px",
                      paddingTop: "24px",
                      borderTop: "1px solid #eaf0f6",
                    }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Last called
                      </label>
                      <input
                        type="datetime-local"
                        value={contactForm.last_called}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            last_called: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Last call status
                      </label>
                      <input
                        type="text"
                        value={contactForm.last_call_status}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            last_call_status: e.target.value,
                          })
                        }
                        placeholder="e.g. Answered, No answer"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Next call
                      </label>
                      <input
                        type="datetime-local"
                        value={contactForm.next_call}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            next_call: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Scheduled call at
                      </label>
                      <input
                        type="datetime-local"
                        min={scheduledInputMin}
                        value={contactForm.scheduled_call_at}
                        onFocus={(e) => {
                          const floor = getDatetimeLocalMinNow();
                          const cur = contactForm.scheduled_call_at;
                          if (isEditingContact && cur !== "" && cur < floor) {
                            e.currentTarget.removeAttribute("min");
                          } else {
                            e.currentTarget.min = floor;
                          }
                        }}
                        onChange={(e) => {
                          const v = e.target.value;
                          const minVal = getDatetimeLocalMinNow();
                          if (v !== "" && v < minVal) {
                            return;
                          }
                          setContactForm({
                            ...contactForm,
                            scheduled_call_at: v,
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Tags
                      </label>
                      <CreatableSelect
                        isMulti
                        value={contactForm.tags}
                        onChange={(selected) =>
                          setContactForm({
                            ...contactForm,
                            tags: selected ? [...selected] : [],
                          })
                        }
                        options={availableTags.map((t: any) => ({
                          value: t.value,
                          label: t.label,
                          id: t.id,
                        }))}
                        placeholder="Select or create tags"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Note
                      </label>
                      <textarea
                        rows={3}
                        value={contactForm.note}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            note: e.target.value,
                          })
                        }
                        placeholder="Notes about this contact"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div className="contact-form-field">
                      <Form.Check
                        type="checkbox"
                        checked={contactForm.is_viewed}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            is_viewed: e.target.checked,
                          })
                        }
                        label={
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#141414",
                              fontWeight: 500,
                            }}
                          >
                            Is viewed
                          </span>
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div
              className="contact-sidebar-footer"
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #eaf0f6",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-start",
              }}
            >
              <button
                type="submit"
                className="contact-form-btn-create"
                disabled={
                  !isFormValid ||
                  createContactLoading ||
                  (!!editingContactId && contactFormLoading)
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    isFormValid && !createContactLoading
                      ? "#0091ae"
                      : "#cbd5e0",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isFormValid && !createContactLoading
                      ? "pointer"
                      : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (isFormValid && !createContactLoading)
                    e.currentTarget.style.backgroundColor = "#007a94";
                }}
                onMouseLeave={(e) => {
                  if (isFormValid && !createContactLoading)
                    e.currentTarget.style.backgroundColor = "#0091ae";
                }}
              >
                {createContactLoading
                  ? editingContactId
                    ? "Updating..."
                    : "Creating..."
                  : editingContactId
                    ? "Update"
                    : "Create"}
              </button>
              {!editingContactId && (
                <button
                  type="button"
                  className="contact-form-btn-create-another"
                  disabled={!isFormValid || createContactLoading}
                  onClick={() => handleCreateContactSubmit(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    color:
                      isFormValid && !createContactLoading
                        ? "#141414"
                        : "#a0aec0",
                    border: "1px solid #8a8a8a",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor:
                      isFormValid && !createContactLoading
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isFormValid && !createContactLoading)
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid && !createContactLoading)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Create and add another
                </button>
              )}
              <button
                type="button"
                className="contact-form-btn-cancel"
                disabled={createContactLoading}
                onClick={() => {
                  setShowCreateContactSidebar(false);
                  setEditingContactId(null);
                  setContactFormLoadError(null);
                  setContactFormLoading(false);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#141414",
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f7fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </>
    );
  };

  if (
    !session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
  ) {
    return null;
  }

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles
        config={{
          tableWrapperClass: "companies-table-wrapper",
          scrollableContentClass: "prospects-scrollable-content",
          pageContainerClass: "prospects-page-container",
          contentAreaClass: "prospects-content-area",
          includePhoneInputStyles: false,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Companies"
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
         

{session?.user?.permissions?.includes(
        PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT,
      ) && (
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
            title: 'All Companies',
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
            title: 'All Companies',
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
            {/* Summary stats removed – company list only */}

            {/* Filter Bar */}
            {showFilterBar &&
              session?.user?.permissions?.includes(
                PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
              ) && (
                <FilterBar
                  quickFilters={[
                    {
                      id: "all",
                      label: "All Companies",
                      color: "#0d6efd",
                      icon: <Users size={16} />,
                    },
                    {
                      id: "scheduled",
                      label: "Scheduled",
                      color: "#20c997",
                      icon: <FiCalendar size={16} />,
                    },
                    {
                      id: "has_leads",
                      label: "Converted to Leads",
                      color: "#0dcaf0",
                      icon: <FiTarget size={16} />,
                    },
                  ]}
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
                  //   (companyFilters.assignedTo !== null ? 1 : 0) +
                  //   (companyFilters.campaigns !== null &&
                  //   companyFilters.campaigns.length > 0
                  //     ? 1
                  //     : 0) +
                  //   (companyFilters.nextCallScheduled !== null ? 1 : 0) +
                  //   (companyFilters.sourceFile !== null ? 1 : 0) +
                  //   (companyFilters.tags !== null &&
                  //   companyFilters.tags.length > 0
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
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="d-flex align-items-center text-danger"
                  >
                    <Trash2 size={14} className="me-2" />
                    Delete Selected ({selectedItems.length})
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )} */}

            {/* Companies Table */}
            <div
              className="companies-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={dataList}
                columns={companyColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={companyActions}
                showActions={false}
                // Selection
                selectable={session?.user?.permissions?.includes(
                  PERMISSIONS.DELETE_CRM_DATA_MANAGEMENT,
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
                defaultSortBy={pagination.sortBy}
                defaultSortOrder={pagination.sortOrder}
                onSort={(column, direction) => {
                  setPagination({
                    ...pagination,
                    sortBy: column,
                    sortOrder: direction,
                  });
                }}
                // Row interactions
                onPreviewClick={(row) => handlePreviewClick(row)}
                onFirstColumnClick={(row) => handleCompanyClick(row)}
                onRowDoubleClick={(row) => {
                  if (
                    session?.user?.permissions?.includes(
                      PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
                    )
                  ) {
                    handleViewData(row);
                  }
                }}
                // Loading & styling
                loading={companiesListLoading}
                emptyMessage="No companies found matching your criteria"
                loadingMessage="Loading companies..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                // Toolbar
                showToolbar={true}
                toolbar={{
                  // Tabs
                  showTabs: true,
                  tabsDropdownLabel: "Companies",
                  tabs: [
                    {
                      id: "all",
                      label: "All companies",
                      count: totalAllCompanies,
                      removable: false,
                    },
                    ...customTabs.map((tab) =>
                      tab.id === "has_leads"
                        ? {
                            ...tab,
                            count:
                              activeFilter === "has_leads" && !companiesListLoading
                                ? totalRecords
                                : undefined,
                          }
                        : tab,
                    ),
                  ],
                  activeTab: activeFilter,
                  onTabChange: handleFilterChange,
                  onTabAdd: () => undefined,
                  onTabRemove: (tabId) => {
                    setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
                    if (activeFilter === tabId) {
                      handleFilterChange("all");
                    }
                  },

                  // Search
                  showSearch: true,
                  searchValue: companySearch,
                  searchPlaceholder: "Search companies...",
                  onSearchChange: (value) => {
                    setCompanySearch(value);
                    // Clear search on empty value
                    if (!value) {
                      const newFilters = { ...currentFilters };
                      delete newFilters.search;
                      handleFiltersChange(newFilters);
                      refreshCompaniesListAndPicklists();
                    }
                  },
                  onSearch: () => {
                    if (companySearch) {
                      handleFiltersChange({
                        ...currentFilters,
                        search: companySearch,
                      });
                      refreshCompaniesListAndPicklists();
                    }
                  },

                  // Actions
                  showTableViewDropdown: true,
                  currentTableView: companiesViewMode,
                  onTableViewChange: setCompaniesViewMode,
                  showViewSwitcher: true,
                  showEditColumns: true,
                  onEditColumnsClick: () => setShowColumnEditor(true),
                  showPipelineDropdown: false,
                  pipelineLabel: "All Pipelines",
                  showFiltersButton: true,
                  onFiltersClick: handleOpenFiltersSidebar,
                  showSortButton: true,
                  showExportButton: true,
                  onExportClick: () => setShowExportModal(true),
                  showSaveButton: true,
                  onSaveClick: () => console.log("Save view"),

                  // Filter Pills
                  filterPills: companyFilterPills,
                  showAdvancedFilters: true,
                  onAdvancedFiltersClick: handleOpenFiltersSidebar,

                  // Right-aligned custom actions
                  rightActions: renderAddContactsButton(),
                }}
                // Stats cards for metrics
                statsCards={companyStatsCards}
                customBody={renderCompaniesCustomBody()}
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
                <Modal.Title>Import Companies</Modal.Title>
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

          {/* View Data Modal - Redesigned */}
          <CompanyViewModal
            show={showViewModal}
            selectedDataItem={selectedDataItem}
            onClose={() => setShowViewModal(false)}
            formatCrmPreviewDate={formatCrmPreviewDate}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            show={showDeleteModal}
            onHide={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            onConfirm={confirmDelete}
            itemName={
              itemToDelete ? `company entry #${itemToDelete.id}` : undefined
            }
            itemType="company entry"
            additionalInfo={
              itemToDelete ? (
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
              ) : undefined
            }
          />

          {/* Data Assignment Success Modal */}
          <FormModal
            show={showDataAssignmentModal}
            onHide={handleDataAssignmentModalClose}
            title="Smart Company Distribution"
            desc="Please fill the details below to smart company distribution."
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
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Disposition *</Form.Label>
                      <Form.Select
                        value={afterCallData.disposition}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            disposition: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Disposition</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="callback_requested">
                          Call Back Requested
                        </option>
                        <option value="follow_up">Follow Up</option>
                        <option value="do_not_call">Do Not Call</option>
                        <option value="wrong_number">Wrong Number</option>
                        <option value="spam">Spam</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Call Status *</Form.Label>
                      <Form.Select
                        value={afterCallData.callStatus}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            callStatus: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Call Status</option>
                        <option value="answered">Answered</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Busy</option>
                        <option value="voicemail">Voicemail</option>
                        <option value="disconnected">Disconnected</option>
                        <option value="network_error">Network Error</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Call Comment *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={afterCallData.comment}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Enter call details, client response, and any important notes..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Generate Lead *</Form.Label>
                  <div className="d-flex gap-4">
                    <Form.Check
                      type="radio"
                      id="generate-lead-yes"
                      name="generateLead"
                      value="yes"
                      checked={afterCallData.generateLead === "yes"}
                      onChange={(e) =>
                        setAfterCallData({
                          ...afterCallData,
                          generateLead: e.target.value,
                        })
                      }
                      label="Yes, generate lead"
                    />
                    <Form.Check
                      type="radio"
                      id="generate-lead-no"
                      name="generateLead"
                      value="no"
                      checked={afterCallData.generateLead === "no"}
                      onChange={(e) =>
                        setAfterCallData({
                          ...afterCallData,
                          generateLead: e.target.value,
                        })
                      }
                      label="No, do not generate lead"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Select "Yes" if this call resulted in a qualified lead that
                    should be created in the CRM system.
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Schedule Next Call (Optional)</Form.Label>
                      <Form.Control
                        type="date"
                        value={afterCallData.nextCallDate}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            nextCallDate: e.target.value,
                          })
                        }
                        min={moment().format("YYYY-MM-DD")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time (Optional)</Form.Label>
                      <Form.Control
                        type="time"
                        value={afterCallData.nextCallTime}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            nextCallTime: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info">
                  <strong>Note:</strong> This dialog will be used to record call
                  outcomes and schedule follow-up actions. All fields marked
                  with * are required.
                </Alert>
              </>
            }
            submitButtonText="Save Call Data"
            cancelButtonText="Cancel"
            onSubmit={() => handleAfterCallSubmit()}
            onCancel={() => setShowAfterCallModal(false)}
          />

          <FormModal
            show={showScheduleModal}
            onHide={() => setShowScheduleModal(false)}
            title={getScheduleModalTitle(isEditingSchedule)}
            desc={getScheduleModalDescription(isEditingSchedule)}
            size="lg"
            formHtml={
              <>
                {selectedEntryForSchedule && (
                  <div className="mb-3">
                    <h6>Schedule Call For:</h6>
                    <div className="bg-light p-3 rounded">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedEntryForSchedule.name || "N/A"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {selectedEntryForSchedule.phone || "N/A"}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {selectedEntryForSchedule?.data?.email || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={scheduleData.date}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            date: e.target.value,
                          })
                        }
                        min={moment().format("YYYY-MM-DD")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={scheduleData.time}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            time: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={scheduleData.notes}
                    onChange={(e) =>
                      setScheduleData({
                        ...scheduleData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add any notes or reminders for this call..."
                  />
                </Form.Group>

                <Alert variant="info">
                  <strong>Note:</strong> The call will be scheduled and you'll
                  receive a reminder at the selected time.
                </Alert>
              </>
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

          {/* Bulk Delete Modal */}
          <Modal
            show={showBulkDeleteModal}
            onHide={() => setShowBulkDeleteModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title className="d-flex align-items-center">
                <FiTrash2 className="me-2" />
                Bulk Delete Prospects
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                Are you sure you want to delete {selectedItems.length} selected
                prospects?
              </p>
              <div className="alert alert-warning">
                <strong>Warning:</strong> This action cannot be undone. All
                selected entries will be permanently deleted.
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBulkDelete}>
                Delete {selectedItems.length} Entries
              </Button>
            </Modal.Footer>
          </Modal>
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
          {companyActivityModals.modals}
        </div>{" "}
        {/* End main content area */}
        {/* Company Detail Sidebar – same design as prospects: Call, Task, Meeting, Note, Email with record_type company */}
        {showCompanySidebar &&
          (() => {
            const enrichment = selectedCompany?.data?.enrichment_data as
              | EnrichmentData
              | undefined;
            const domain = selectedCompany?.data?.domain as string | undefined;
            const websiteUrl = buildCompanyWebsiteUrl(enrichment, domain);
            const aboutFields = buildCompanyAboutFields(
              selectedCompany,
              websiteUrl,
              formatCrmPreviewDate,
            );

            const sections = [
              {
                id: "about-company",
                title: "About this company",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                fields:
                  aboutFields.length > 0
                    ? aboutFields
                    : [
                        {
                          label: "Name",
                          value: selectedCompany?.name || "—",
                          copyable: true,
                        },
                      ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: Array.isArray(selectedCompany?.audit_trail)
                  ? selectedCompany.audit_trail.length
                  : 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this order.",
                  action: {
                    label: "Log activity",
                    onClick: () => console.log("Log activity"),
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () => {
                      const phone =
                        selectedCompany?.phone ||
                        selectedCompany?.rawData?.phone
                      if (phone) {
                        handleCallClick(selectedCompany);
                      }
                    },
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
              },
            ];

            return (
              <GenericSidebar
                isOpen={showCompanySidebar}
                onClose={handleCloseCompanySidebar}
                title={selectedCompany?.name || "Company Details"}
                subtitle={selectedCompany?.phone || ""}
                email={selectedCompany?.data?.email}
                phone={selectedCompany?.phone}
                avatar={{
                  initials: getInitials(selectedCompany?.name || "NA"),
                  name: selectedCompany?.name || "NA",
                  gradient: getRandomColor(selectedCompany?.name || ""),
                }}
                record={{
                  id: selectedCompany?.id || selectedCompany?.rawData?.id,
                  type: RECORD_TYPES.COMPANY,
                }}
                recordType="company"
                recordId={selectedCompany?.id || selectedCompany?.rawData?.id}
                onPlayCallRecording={handlePlayCallRecording}
                recordLink={{
                  label: "View record",
                  onClick: () => {
                    if (selectedCompany?.id != null) {
                      handleHideCompanySidebarKeepPersistence();
                      router.push(
                        `/crm/detailspage?type=companies&id=${encodeURIComponent(
                          String(selectedCompany.id)
                        )}`
                      );
                    }
                  },
                }}
                onNoteCreate={handleNoteCreate}
                actionsDropdown={{
                  label: "Actions",
                  items: [
                    {
                      label: "Convert to Lead",
                      onClick: () => {
                        setConvertingToLeadCrmRecordId(selectedCompany?.id ?? null);
                        setShowConvertToLeadModal(true);
                      },
                    },
                    {
                      label: "Delete",
                      onClick: () => handleDeleteData(selectedCompany),
                    },
                  ],
                }}
                sections={sections}
              />
            );
          })()}
        {/* Filters Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          title="Filters"
          subtitle="Filter companies by various criteria"
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: companySearch,
              onChange: (value) => setCompanySearch(value),
              placeholder: "Search by name or phone...",
            },
            {
              id: "assignedTo",
              label: "Assigned To",
              type: "select",
              value: companyFilters.assignedTo
                ? (() => {
                    const assignedToId = companyFilters.assignedTo;
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
                setCompanyFilters((prev) => ({
                  ...prev,
                  assignedTo: assignedToValue,
                }));
                setActiveFilter("all");
              },
              options: extensions.map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              })),
              placeholder: "Select user...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "campaigns",
              label: "Campaigns",
              type: "multi-select",
              value: companyFilters.campaigns
                ? companyFilters.campaigns.map((campaignId: string) => {
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
                setCompanyFilters((prev) => ({
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
              id: "nextCallScheduled",
              label: "Next Call Scheduled",
              type: "dropdown",
              value: companyFilters.nextCallScheduled || "",
              onChange: (value) => {
                const selectedValue = value || null;
                setCompanyFilters((prev) => ({
                  ...prev,
                  nextCallScheduled: selectedValue,
                  nextCallDateFrom: null,
                  nextCallDateTo: null,
                }));
                setActiveFilter("all");
              },
              options: [
                { value: "", label: "Select option..." },
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
                { value: "this_week", label: "This Week" },
                { value: "next_week", label: "Next Week" },
                { value: "overdue", label: "Overdue Calls" },
                { value: "custom", label: "Custom Date Range" },
              ],
            },
            {
              id: "nextCallDateFrom",
              label: "Next Call Date (From)",
              type: "date",
              value: companyFilters.nextCallDateFrom || "",
              onChange: (value) => {
                const dateValue = value || null;
                setCompanyFilters((prev) => ({
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
              value: companyFilters.nextCallDateTo || "",
              onChange: (value) => {
                const dateValue = value || null;
                setCompanyFilters((prev) => ({
                  ...prev,
                  nextCallDateTo: dateValue,
                }));
              },
              placeholder: "To date",
            },
          ]}
          onApply={() => {
            const filtersToApply: Record<string, any> = {};

            if (companySearch) {
              filtersToApply.search = companySearch;
            }
            if (companyFilters.assignedTo) {
              filtersToApply.user_extension = [companyFilters.assignedTo];
            }
            if (
              companyFilters.campaigns &&
              companyFilters.campaigns.length > 0
            ) {
              filtersToApply.campaign_id = companyFilters.campaigns;
            }
            if (companyFilters.sourceFile) {
              filtersToApply.source_file = companyFilters.sourceFile;
            }
            if (companyFilters.tags && companyFilters.tags.length > 0) {
              filtersToApply.tags = companyFilters.tags;
            }

            // Handle next call scheduled filters
            const now = moment();
            if (companyFilters.nextCallScheduled === "today") {
              const today = now.format("YYYY-MM-DD");
              filtersToApply.scheduled_call_from = today;
              filtersToApply.scheduled_call_to = today;
            } else if (companyFilters.nextCallScheduled === "tomorrow") {
              const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
              filtersToApply.scheduled_call_from = tomorrow;
              filtersToApply.scheduled_call_to = tomorrow;
            } else if (companyFilters.nextCallScheduled === "this_week") {
              const startOfWeek = moment().startOf("week").format("YYYY-MM-DD");
              const endOfWeek = moment().endOf("week").format("YYYY-MM-DD");
              filtersToApply.scheduled_call_from = startOfWeek;
              filtersToApply.scheduled_call_to = endOfWeek;
            } else if (companyFilters.nextCallScheduled === "next_week") {
              const nextWeekStart = moment()
                .add(1, "week")
                .startOf("week")
                .format("YYYY-MM-DD");
              const nextWeekEnd = moment()
                .add(1, "week")
                .endOf("week")
                .format("YYYY-MM-DD");
              filtersToApply.scheduled_call_from = nextWeekStart;
              filtersToApply.scheduled_call_to = nextWeekEnd;
            } else if (companyFilters.nextCallScheduled === "overdue") {
              filtersToApply.scheduled_call_status = "overdue";
            } else if (companyFilters.nextCallScheduled === "custom") {
              if (companyFilters.nextCallDateFrom) {
                filtersToApply.scheduled_call_from =
                  companyFilters.nextCallDateFrom;
              }
              if (companyFilters.nextCallDateTo) {
                filtersToApply.scheduled_call_to =
                  companyFilters.nextCallDateTo;
              }
            }

            handleFiltersChange(filtersToApply);
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            refreshCompaniesListAndPicklists();
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setCompanySearch("");
            setCompanyFilters({
              assignedTo: null,
              campaigns: null,
              nextCallScheduled: null,
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
            refreshCompaniesListAndPicklists();
          }}
        />
      </div>{" "}
      {/* End flex container */}
      {/* Convert to Lead Modal */}
      {renderConvertToLeadModalContent()}
      {/* Column Editor Modal */}
      <Modal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Customize Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Select which columns to display in the table
          </p>
          <Row>
            {companyColumns.map((col) => {
              const isChecked = draftSelectedColumns.includes(col.key);
              const isOnlySelected =
                isChecked && draftSelectedColumns.length === 1;
              return (
                <Col key={col.key} md={6} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    id={`column-check-${col.key}`}
                    label={col.label}
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setDraftSelectedColumns((prev) =>
                          prev.includes(col.key) ? prev : [...prev, col.key],
                        );
                      } else if (!isOnlySelected) {
                        setDraftSelectedColumns((prev) =>
                          prev.filter((k) => k !== col.key),
                        );
                      }
                    }}
                  />
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowColumnEditor(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedColumns(draftSelectedColumns);
              setShowColumnEditor(false);
            }}
          >
            Apply Changes
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Prospects</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Export {totalRecords} prospects to CSV file?</p>
          <Form.Group className="mb-3">
            <Form.Label>File Name</Form.Label>
            <Form.Control
              type="text"
              defaultValue={`prospects_${moment().format("YYYY-MM-DD")}`}
              placeholder="Enter file name"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={exporting || totalRecords === 0}
            onClick={async () => {
              if (totalRecords === 0) {
                toast.info("No prospects to export");
                return;
              }
              setExporting(true);
              try {
                const PER_PAGE = 100;
                const allData: CrmDataItem[] = [];
                let page = 1;
                for (;;) {
                  const response = await getCompanies(
                    buildCrmDataParams({ page, per_page: PER_PAGE }),
                  );
                  const chunk = (response?.data || []).map(mapCompanyToRow);
                  allData.push(...chunk);
                  if (
                    chunk.length < PER_PAGE ||
                    allData.length >= (response?.total ?? 0)
                  )
                    break;
                  page += 1;
                }
                const exportColumns = companyColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                );
                const getCellValue = (row: any, col: TableColumn<any>) => {
                  const raw = (col as any).accessor
                    ? (col as any).accessor(row)
                    : row[col.key as keyof CrmDataItem];
                  if (raw == null) return "";
                  return typeof raw === "object"
                    ? JSON.stringify(raw)
                    : String(raw);
                };
                const escapeCsv = (val: string) => {
                  const s = String(val);
                  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                  return s;
                };
                const csvContent = [
                  exportColumns.map((col) => escapeCsv(col.label)).join(","),
                  ...allData.map((row) =>
                    exportColumns
                      .map((col) => escapeCsv(getCellValue(row, col)))
                      .join(","),
                  ),
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `prospects_${moment().format("YYYY-MM-DD")}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                setShowExportModal(false);
                toast.success(
                  `Exported ${allData.length} prospects successfully!`,
                );
              } catch (err) {
                toast.error("Failed to export prospects");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="me-2" />
                Export
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
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
      {/* Create Company Sidebar (create + edit) */}
      {renderCreateCompany(
        showCreateCompanySidebar,
        setShowCreateCompanySidebar,
        {
          initialData: editingCompanyData,
          editingId: editingCompanyId,
          onSave: async (data: CompanyFormPayload, id?: number) => {
            if (id != null) {
              await updateCompany(id, data);
            } else {
              await createCompany(data);
            }
            refreshCompaniesListAndPicklists();
            setShowCreateCompanySidebar(false);
            setEditingCompanyId(null);
            setEditingCompanyData(null);
          },
        },
      )}
    </React.Fragment>
  );
};

CrmCompanyManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCompanyManagement;
