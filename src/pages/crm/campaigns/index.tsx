import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn, ToolbarConfig } from "@components/GenericTable";
import {
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCampaigns,
  deleteCampaign,
  createCampaign,
  updateCampaign,
  getCampaign,
  CampaignMetrics,
  uploadCrmDataCsv,
  getCrmDataTags,
  getCrmDataCounts,
  downloadExampleCsv,
  getIndustries,
  getDealTemplates,
  IndustryData,
  DealTemplateData,
} from "@utils/crm";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Alert,
} from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import {
  X,
  FileText,
  Megaphone,
  Users,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Target,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  Trash2,
  Calendar,
  Download,
  AlertCircle as AlertCircleIcon,
  Hash,
  Briefcase,
  UserPlus,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { GetHierarchyData } from "@utils/users";
import axiosInstance from "@utils/axios";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { ModuleSlug, checkRequiredFields, formatDateForTable } from "@utils/Helper";
import { useSession } from "next-auth/react";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import moment from "moment";

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "CrmCampaigns" });
}

/** Strict-safe match when API returns string | number for extension ids */
function sameExtensionId(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a !== "string" && typeof a !== "number") return false;
  if (typeof b !== "string" && typeof b !== "number") return false;
  return String(a) === String(b);
}

function getErrorMessageFromUnknown(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const ax = error as { response?: { data?: { message?: string } }; message?: string };
    const msg = ax.response?.data?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (typeof ax.message === "string" && ax.message.length > 0) return ax.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function sumCrmCustomDistributionCounts(dist: Record<string, number>): number {
  return Object.values(dist).reduce((sum, count) => sum + count, 0);
}

function crmCustomAllocationMismatchMessage(
  recordsToAssign: number,
  customDistribution: Record<string, number>,
): string | null {
  const total = sumCrmCustomDistributionCounts(customDistribution);
  if (total === recordsToAssign) {
    return null;
  }
  return `Custom allocation must equal total records to assign (${recordsToAssign}). Current total: ${total}`;
}

type CrmDataAssignmentSubmitValidationInput = {
  assignmentTargetType: string;
  recordsToAssign: number;
  maxRecords: number;
  distributionMode: string;
  assignToCampaigns: string[];
  selectedUserExtensions: readonly unknown[];
  customDistribution: Record<string, number>;
};

function getCrmDataAssignmentSubmitValidationError(
  input: CrmDataAssignmentSubmitValidationInput,
): string | null {
  const {
    assignmentTargetType,
    recordsToAssign,
    maxRecords,
    distributionMode,
    assignToCampaigns,
    selectedUserExtensions,
    customDistribution,
  } = input;

  if (!assignmentTargetType) {
    return "Please select assignment target (Campaigns or Users)";
  }
  if (recordsToAssign === 0 || recordsToAssign > maxRecords) {
    return `Please enter a valid number of records (max: ${maxRecords})`;
  }

  if (assignmentTargetType === "campaigns") {
    if (!distributionMode || assignToCampaigns.length === 0) {
      return "Please select distribution mode and target campaigns";
    }
    return distributionMode === "custom"
      ? crmCustomAllocationMismatchMessage(recordsToAssign, customDistribution)
      : null;
  }

  if (assignmentTargetType === "users") {
    if (!distributionMode || selectedUserExtensions.length === 0) {
      return "Please select distribution mode and at least one user";
    }
    return distributionMode === "custom"
      ? crmCustomAllocationMismatchMessage(recordsToAssign, customDistribution)
      : null;
  }

  return null;
}

function laterCalendarIsoDate(isoDayA: string, isoDayB: string): string {
  const msA = new Date(`${isoDayA}T12:00:00`).getTime();
  const msB = new Date(`${isoDayB}T12:00:00`).getTime();
  return new Date(Math.max(msA, msB)).toISOString().split("T")[0];
}

function toastCrmCsvUploadOutcome(processedCount: number, validationFailureCount: number): void {
  const recordLabel = processedCount === 1 ? "record" : "records";
  const failureLabel = validationFailureCount === 1 ? "failure" : "failures";

  if (processedCount > 0) {
    let msg = `Successfully processed ${processedCount} ${recordLabel}`;
    if (validationFailureCount > 0) {
      msg += ` with ${validationFailureCount} validation ${failureLabel}`;
    }
    if (validationFailureCount > 0) {
      toast.warn(msg);
    } else {
      toast.success(msg);
    }
    return;
  }

  if (validationFailureCount > 0) {
    const allLabel = validationFailureCount === 1 ? "record" : "records";
    toast.error(`Upload failed: All ${validationFailureCount} ${allLabel} failed validation`);
    return;
  }

  toast.error("Upload completed but no records were processed");
}

type AssignmentTagOption = { value: string; label: string; id: number };

type AssignmentBuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string };

function buildCrmDataAssignmentPayload(args: {
  assignmentTargetType: "campaigns" | "users";
  recordsToAssign: number;
  includeAssignedRecords: boolean;
  assignmentFilterCampaigns: string[];
  assignmentFilterTags: readonly any[];
  availableTags: AssignmentTagOption[];
  assignToCampaigns: string[];
  availableCampaignsForUpload: Array<{ value: string; label: string; id: number }>;
  distributionMode: string;
  customDistribution: Record<string, number>;
  selectedUserExtensions: readonly any[];
}): AssignmentBuildResult {
  const {
    assignmentTargetType,
    recordsToAssign,
    includeAssignedRecords,
    assignmentFilterCampaigns,
    assignmentFilterTags,
    availableTags,
    assignToCampaigns,
    availableCampaignsForUpload,
    distributionMode,
    customDistribution,
    selectedUserExtensions,
  } = args;

  const campaignFilterIds = assignmentFilterCampaigns
    .map((c) => Number.parseInt(c, 10))
    .filter((id) => !Number.isNaN(id) && id > 0);

  const tagIds = assignmentFilterTags
    .map((tag) => {
      const t = availableTags.find((at) => at.value === (tag.value || tag));
      return t ? t.id : 0;
    })
    .filter((id) => id > 0);

  const payload: Record<string, unknown> = {
    count: recordsToAssign,
    include_assigned: includeAssignedRecords,
  };

  if (campaignFilterIds.length > 0) payload.campaign_filter_ids = campaignFilterIds;
  if (tagIds.length > 0) payload.tag_ids = tagIds;

  if (assignmentTargetType === "campaigns") {
    const targetCampaignIds = assignToCampaigns
      .map((c) => {
        const camp = availableCampaignsForUpload.find((ac) => ac.label === c);
        return camp ? Number.parseInt(camp.value, 10) : 0;
      })
      .filter((id) => id > 0);

    if (targetCampaignIds.length === 0) {
      return { ok: false, message: "Please select valid campaigns" };
    }

    payload.campaign_ids = targetCampaignIds;
    payload.distribution_mode = distributionMode === "custom" ? "custom" : distributionMode;

    if (distributionMode === "custom") {
      const dist: Record<number, number> = {};
      Object.entries(customDistribution).forEach(([v, count]) => {
        const id = Number.parseInt(v, 10);
        if (id > 0 && count > 0) dist[id] = count;
      });
      payload.campaign_distribution = dist;
    }

    return { ok: true, payload };
  }

  const extensionArray = selectedUserExtensions
    .map(
      (ext) =>
        ext.value ||
        ext.extension?.id?.toString() ||
        ext.extension?.extension?.toString() ||
        "",
    )
    .filter((e) => e.length > 0);

  if (extensionArray.length === 0) {
    return { ok: false, message: "Please select valid users" };
  }

  payload.custom_extensions = extensionArray;
  payload.user_distribution_mode = distributionMode === "custom" ? "custom" : "equal";

  if (distributionMode === "custom") {
    const allowed = new Set(extensionArray.map(String));
    const dist: Record<string, number> = {};
    Object.entries(customDistribution).forEach(([key, count]) => {
      const k = String(key);
      if (!allowed.has(k)) return;
      if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return;
      dist[k] = count;
    });
    payload.extension_distribution = dist;
  }

  return { ok: true, payload };
}

function campaignFieldRowKey(
  field: { id?: unknown; field_name?: string; field_type?: string; sort_order?: number },
  index: number,
): string {
  if (field.id != null && field.id !== "") {
    const idStr =
      typeof field.id === "object"
        ? JSON.stringify(field.id)
        : String(field.id as string | number | boolean | bigint);
    return `campaign-field-${idStr}`;
  }
  // IMPORTANT: do not derive React keys from editable text; it causes remounts and input focus loss while typing.
  return `campaign-field-idx-${index}`;
}

function campaignFieldOptionKey(fieldKey: string, optionIndex: number): string {
  // IMPORTANT: do not derive React keys from editable text; it causes remounts and input focus loss while typing.
  return `opt-${fieldKey}-${optionIndex}`;
}

function viewModalDateRangeText(selected: { start_date?: string; end_date?: string }): string {
  if (selected.start_date && selected.end_date) {
    return `${formatDateForTable(selected.start_date)} - ${formatDateForTable(selected.end_date)}`;
  }
  if (selected.start_date) {
    return `Starts: ${formatDateForTable(selected.start_date)}`;
  }
  return "Not set";
}

function campaignFormSubmitButtonLabel(loading: boolean, isEdit: boolean): string {
  if (loading) return "Saving...";
  if (isEdit) return "Update Campaign";
  return "Create Campaign";
}

function deriveEditorStateFromCampaignApi(
  campaignData: any,
  extensions: any[],
  industries: IndustryData[],
  dealTemplates: DealTemplateData[],
): {
  formData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    options: Record<string, any>;
  };
  campaignFields: any[];
  campaignUsers: readonly any[];
  selectedIndustries: readonly any[];
  selectedDealTemplate: any;
} {
  const formData = {
    name: campaignData.name || "",
    description: campaignData.description || "",
    start_date: campaignData.start_date ? campaignData.start_date.split("T")[0] : "",
    end_date: campaignData.end_date ? campaignData.end_date.split("T")[0] : "",
    status: campaignData.status || "active",
    options: campaignData.options || {},
  };
  const campaignFields = campaignData.fields || [];

  const campaignUsers: readonly any[] = campaignData.user_extensions?.length
    ? campaignData.user_extensions.map((ue: { user_extension: unknown }) => {
        const extension = extensions.find((ext) => sameExtensionId(ext.id, ue.user_extension));
        return {
          value: ue.user_extension,
          label: extension?.display_name || extension?.name || String(ue.user_extension),
        };
      })
    : [];

  const industriesData = campaignData.industries;
  const industryIds = campaignData.industry_ids;
  let selectedIndustries: readonly any[] = [];
  if (industriesData?.length) {
    selectedIndustries = industriesData.map((ind: any) => ({
      value: ind.id.toString(),
      label: ind.name || `Industry ${ind.id}`,
      id: ind.id,
    }));
  } else if (industryIds?.length) {
    selectedIndustries = industryIds.map((id: number) => {
      const industry = industries.find((ind) => ind.id === id);
      return { value: id.toString(), label: industry?.name || `Industry ${id}`, id };
    });
  }

  const dealTemplateData = campaignData.deal_template;
  const dealTemplateId = campaignData.deal_template_id;
  let selectedDealTemplate: any = null;
  if (dealTemplateData?.id) {
    selectedDealTemplate = {
      value: dealTemplateData.id.toString(),
      label: dealTemplateData.name || `Deal Template ${dealTemplateData.id}`,
      id: dealTemplateData.id,
    };
  } else if (dealTemplateId) {
    const dt = dealTemplates.find((d) => d.id === Number.parseInt(dealTemplateId.toString(), 10));
    selectedDealTemplate = {
      value: dealTemplateId.toString(),
      label: dt?.name || `Deal Template ${dealTemplateId}`,
      id: Number.parseInt(dealTemplateId.toString(), 10),
    };
  }

  return {
    formData,
    campaignFields,
    campaignUsers,
    selectedIndustries,
    selectedDealTemplate,
  };
}

function buildCrmCampaignListFilters(
  activeFilter: string,
  campaignFilters: {
    status: string[];
    dateFrom: string | null;
    dateTo: string | null;
    userExtensions: string[] | null;
    hasUnassignedProspects: boolean | null;
    tags: string[] | null;
  },
  memoizedFilters: Record<string, any>,
): Record<string, any> {
  let statusFilter: string[] = [];
  if (activeFilter === "active") statusFilter = ["active"];
  else if (activeFilter === "inactive") statusFilter = ["inactive"];
  const combinedStatus = campaignFilters.status.length > 0 ? campaignFilters.status : statusFilter;
  const filters: Record<string, any> = { ...memoizedFilters };
  if (combinedStatus.length > 0) filters.status = combinedStatus.length === 1 ? combinedStatus[0] : combinedStatus;
  if (campaignFilters.dateFrom) filters.date_from = campaignFilters.dateFrom;
  if (campaignFilters.dateTo) filters.date_to = campaignFilters.dateTo;
  if (campaignFilters.userExtensions?.length) filters.user_extensions = campaignFilters.userExtensions;
  if (campaignFilters.hasUnassignedProspects !== null) {
    filters.has_unassigned_prospects = campaignFilters.hasUnassignedProspects;
  }
  if (campaignFilters.tags?.length) filters.tags = campaignFilters.tags;
  return filters;
}

function sumCustomDistributionValues(dist: Record<string, number>): number {
  return Object.values(dist).reduce((s, c) => s + (typeof c === "number" && Number.isFinite(c) ? c : 0), 0);
}

/** Max allowed for one target key: remaining records plus what this key already holds. */
function maxCustomDistributionForKey(
  dist: Record<string, number>,
  valueKey: string,
  recordsToAssign: number,
): number {
  const current = dist[valueKey] ?? 0;
  const totalOthers = sumCustomDistributionValues(dist) - current;
  return Math.max(0, recordsToAssign - totalOthers);
}

function createCustomDistributionAmountChangeHandler(
  valueKey: string,
  recordsToAssign: number,
  setCustomDistribution: React.Dispatch<React.SetStateAction<Record<string, number>>>,
): (value: string) => void {
  return (value: string) => {
    setCustomDistribution((prev) => {
      const maxForKey = maxCustomDistributionForKey(prev, valueKey, recordsToAssign);
      const cleaned = value.replaceAll(/\D/g, "");
      if (cleaned === "") {
        return { ...prev, [valueKey]: 0 };
      }
      const numValue = Number.parseInt(cleaned, 10);
      const clamped = Math.min(Math.max(0, numValue), maxForKey);
      return { ...prev, [valueKey]: clamped };
    });
  };
}

function validateCampaignFormBeforeSave(
  formData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    options: Record<string, any>;
  },
  showEditModal: boolean,
  getTodayDate: () => string,
): boolean {
  const requiredFields: Array<{ field: keyof typeof formData; name: string; required: boolean }> = [
    { field: "name", name: "Campaign Name", required: true },
    { field: "start_date", name: "Start Date", required: true },
    { field: "end_date", name: "End Date", required: true },
  ];
  if (!checkRequiredFields(formData, requiredFields)) return false;
  const today = getTodayDate();
  if (!showEditModal) {
    if (formData.start_date && formData.start_date < today) {
      toast.error("Start date must be today or a future date");
      return false;
    }
    if (formData.end_date && formData.end_date < today) {
      toast.error("End date must be today or a future date");
      return false;
    }
  }
  if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
    toast.error("End date must be after start date");
    return false;
  }
  if (formData.status === "active") {
    const todayIso = getTodayDate();
    if (!formData.end_date || formData.end_date <= todayIso) {
      toast.error("To activate a campaign, set the end date to a future date (after today).");
      return false;
    }
  }
  return true;
}

function buildCampaignSavePayload(
  formData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    options: Record<string, any>;
  },
  campaignFields: any[],
  campaignUsers: readonly any[],
  selectedIndustries: readonly any[],
  selectedDealTemplate: any,
): Record<string, unknown> {
  const cleanedFields = campaignFields.map((field) => {
    if (field.field_type === "dropdown" && field.field_options) {
      return { ...field, field_options: field.field_options.filter((opt: string) => opt.trim() !== "") };
    }
    return field;
  });
  return {
    ...formData,
    name: formData.name.trim(),
    description: formData.description.trim() || null,
    start_date: formData.start_date || undefined,
    end_date: formData.end_date || undefined,
    status: formData.status as "active" | "inactive",
    fields: cleanedFields,
    campaign_users: campaignUsers.map((user) => user.value),
    industry_ids: selectedIndustries.map((ind: any) => Number.parseInt(String(ind.value || ind.id), 10)),
    deal_template_id: selectedDealTemplate
      ? Number.parseInt(String(selectedDealTemplate.value || selectedDealTemplate.id), 10)
      : undefined,
  };
}

function getFieldTypeText(fieldType: string): string {
  switch (fieldType.toLowerCase()) {
    case "string":
      return "Text";
    case "integer":
      return "Number";
    case "date":
      return "Date";
    case "email":
      return "Email";
    case "dropdown":
      return "Dropdown";
    default:
      return fieldType;
  }
}

const CRM_CAMPAIGNS_SELECT_STYLES = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: "38px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    "&:hover": { borderColor: "#86b7fe" },
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "#0d6efd",
    color: "white",
    fontSize: "0.813rem",
  }),
  multiValueLabel: (provided: any) => ({ ...provided, color: "white", padding: "2px 6px" }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "white",
    "&:hover": { backgroundColor: "#0b5ed7", color: "white" },
  }),
  menu: (provided: any) => ({ ...provided, fontSize: "0.875rem" }),
};

type ToolbarFactoryArgs = {
  campaignsSearch: string;
  onCampaignsSearchChange: (v: string) => void;
  submitCampaignsSearch: () => void;
  handleFiltersChange: (filters: Record<string, any>) => void;
  setCampaignsPagination: React.Dispatch<React.SetStateAction<{ currentPage: number; rowsPerPage: number; sortBy: string; sortOrder: "asc" | "desc" }>>;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  filterCounts: { all: number; active: number; inactive: number };
  activeFilter: string;
  setActiveFilter: (v: string) => void;
  setCampaignFilters: React.Dispatch<React.SetStateAction<{
    status: string[];
    dateFrom: string | null;
    dateTo: string | null;
    userExtensions: string[] | null;
    hasUnassignedProspects: boolean | null;
    tags: string[] | null;
  }>>;
  campaignFilters: {
    status: string[];
    dateFrom: string | null;
    dateTo: string | null;
    userExtensions: string[] | null;
    hasUnassignedProspects: boolean | null;
    tags: string[] | null;
  };
  extensions: any[];
  showCampaignsAnalytics: boolean;
  setShowCampaignsAnalytics: React.Dispatch<React.SetStateAction<boolean>>;
  session: { user?: { permissions?: string[] } } | null;
  handleDataAssignment: () => Promise<void>;
  handleCreateCampaign: () => void;
  onOpenUploadModal: () => void;
};

function createCrmCampaignsToolbarConfig(a: ToolbarFactoryArgs): ToolbarConfig {
  return {
    showSearch: true,
    searchValue: a.campaignsSearch,
    searchPlaceholder: "Search campaigns by name, description...",
    onSearchChange: a.onCampaignsSearchChange,
    onSearch: () => {
      a.submitCampaignsSearch();
      a.setCampaignsPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    showTabs: true,
    tabs: [
      { id: "all", label: "All Campaigns", count: a.filterCounts.all, removable: false },
      { id: "active", label: "Active", count: a.filterCounts.active, removable: false },
      { id: "inactive", label: "Inactive", count: a.filterCounts.inactive, removable: false },
      { id: "assigned", label: "With Assigned Records", removable: false },
      { id: "unassigned", label: "With Unassigned Records", removable: false },
    ],
    activeTab: a.activeFilter,
    onTabChange: (tabId) => {
      a.setActiveFilter(tabId);
      if (tabId === "assigned") {
        a.setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: false }));
      } else if (tabId === "unassigned") {
        a.setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: true }));
      } else {
        a.setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: null }));
      }
      a.setCampaignsPagination((prev) => ({ ...prev, currentPage: 1 }));
      a.setRefreshKey((prev) => prev + 1);
    },
    showFiltersButton: true,
    showFilterPills: false,
    filterPills: [
      {
        id: "status",
        label: "Status",
        showDropdown: true,
        active: a.campaignFilters.status.length > 0,
        activeLabel: a.campaignFilters.status.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", "),
        onClear: () => {
          a.setCampaignFilters((prev) => ({ ...prev, status: [] }));
          a.setActiveFilter("all");
          a.setRefreshKey((prev) => prev + 1);
        },
        dropdownOptions: [
          {
            label: "Active",
            value: "active",
            onClick: () => {
              a.setCampaignFilters((prev) => ({ ...prev, status: ["active"] }));
              a.setActiveFilter("all");
              a.setRefreshKey((prev) => prev + 1);
            },
          },
          {
            label: "Inactive",
            value: "inactive",
            onClick: () => {
              a.setCampaignFilters((prev) => ({ ...prev, status: ["inactive"] }));
              a.setActiveFilter("all");
              a.setRefreshKey((prev) => prev + 1);
            },
          },
          {
            label: "All",
            value: "",
            onClick: () => {
              a.setCampaignFilters((prev) => ({ ...prev, status: [] }));
              a.setActiveFilter("all");
              a.setRefreshKey((prev) => prev + 1);
            },
          },
        ],
      },
      {
        id: "dateFrom",
        label: "Date From",
        showDropdown: true,
        active: !!a.campaignFilters.dateFrom,
        activeLabel: a.campaignFilters.dateFrom
          ? new Date(a.campaignFilters.dateFrom).toLocaleDateString()
          : undefined,
        onClear: () => {
          a.setCampaignFilters((prev) => ({ ...prev, dateFrom: null }));
          a.handleFiltersChange({ date_from: null });
        },
        dropdownContent: (
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="small fw-bold">Date From</Form.Label>
            <Form.Control
              type="date"
              value={a.campaignFilters.dateFrom || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                a.setCampaignFilters((prev) => ({ ...prev, dateFrom: v }));
                a.handleFiltersChange({ date_from: v || null });
              }}
            />
          </Form.Group>
        ),
      },
      {
        id: "dateTo",
        label: "Date To",
        showDropdown: true,
        active: !!a.campaignFilters.dateTo,
        activeLabel: a.campaignFilters.dateTo
          ? new Date(a.campaignFilters.dateTo).toLocaleDateString()
          : undefined,
        onClear: () => {
          a.setCampaignFilters((prev) => ({ ...prev, dateTo: null }));
          a.handleFiltersChange({ date_to: null });
        },
        dropdownContent: (
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="small fw-bold">Date To</Form.Label>
            <Form.Control
              type="date"
              value={a.campaignFilters.dateTo || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                a.setCampaignFilters((prev) => ({ ...prev, dateTo: v }));
                a.handleFiltersChange({ date_to: v || null });
              }}
            />
          </Form.Group>
        ),
      },
      {
        id: "users",
        label: "Campaign Users",
        showDropdown: true,
        active: !!a.campaignFilters.userExtensions?.length,
        activeLabel: a.campaignFilters.userExtensions?.length
          ? `${a.campaignFilters.userExtensions.length} selected`
          : undefined,
        onClear: () => {
          a.setCampaignFilters((prev) => ({ ...prev, userExtensions: null }));
          a.handleFiltersChange({ user_extensions: null });
        },
        dropdownContent: (
          <div style={{ minWidth: "260px" }}>
            <Form.Label className="small fw-bold mb-2">Campaign Users</Form.Label>
            <Select
              isMulti
              options={a.extensions.map((ext: any) => ({
                value: ext.id,
                label: ext.display_name || ext.name || ext.id,
              }))}
              value={
                a.campaignFilters.userExtensions?.map((extId: string) => {
                  const ext = a.extensions.find((e: { id?: unknown }) => sameExtensionId(e.id, extId));
                  return { value: extId, label: ext?.display_name || ext?.name || `Extension ${extId}` };
                }) || []
              }
              onChange={(selected) => {
                const vals = selected ? selected.map((s) => s.value) : null;
                a.setCampaignFilters((prev) => ({ ...prev, userExtensions: vals }));
                a.handleFiltersChange({ user_extensions: vals || null });
              }}
              placeholder="Select users..."
              styles={CRM_CAMPAIGNS_SELECT_STYLES}
            />
          </div>
        ),
      },
    ],
    showMoreFiltersButton: false,
    rightActions: (
      <div className="d-flex gap-2">
        <Button
          variant={a.showCampaignsAnalytics ? "primary" : "light"}
          onClick={() => a.setShowCampaignsAnalytics((open) => !open)}
          style={{
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            color: a.showCampaignsAnalytics ? undefined : "#212529",
            height: "33px",
            fontSize: "0.875rem",
            padding: "0 12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <BarChart3 size={15} />
          Analytics
        </Button>
        {a.session?.user?.permissions?.includes("add-crm-data-management") &&
          a.session?.user?.permissions?.includes("data-assignment-crm-data-management") && (
            <Button
              variant="light"
              onClick={a.onOpenUploadModal}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                color: "#212529",
                height: "33px",
                fontSize: "0.875rem",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Download size={15} />
              Import
            </Button>
          )}
        {a.session?.user?.permissions?.includes("data-assignment-crm-data-management") && (
          <Button
            variant="light"
            onClick={a.handleDataAssignment}
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              color: "#212529",
              height: "33px",
              fontSize: "0.875rem",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Target size={15} />
            Data Assignment
          </Button>
        )}
        {a.session?.user?.permissions?.includes("add-crm-campaigns") && (
          <Button
            onClick={a.handleCreateCampaign}
            style={{
              backgroundColor: "#4f46e5",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              height: "33px",
              fontSize: "0.875rem",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={15} />
            New Campaign
          </Button>
        )}
      </div>
    ),
  };
}

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<Readonly<KPICardData>> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
  onClick,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Card
      className={onClick ? "h-100" : ""}
      style={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        border: "1px solid #e9ecef",
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge
              bg={isPositive ? "success" : "danger"}
              className="bg-opacity-10"
            >
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

function CrmProportionalDistributionRows(
  props: Readonly<{
    items: Array<{ valueKey: string; label: string }>;
    recordsToAssign: number;
    customDistribution: Record<string, number>;
    handleNumberKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    setCustomDistribution: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  }>,
) {
  return (
    <>
      {props.items.map(({ valueKey, label }) => {
        const maxForRow = maxCustomDistributionForKey(
          props.customDistribution,
          valueKey,
          props.recordsToAssign,
        );
        return (
          <CustomDistributionAmountRow
            key={valueKey}
            label={label}
            maxAllowed={maxForRow}
            amount={props.customDistribution[valueKey] || 0}
            onKeyDown={props.handleNumberKeyDown}
            onAmountChange={createCustomDistributionAmountChangeHandler(
              valueKey,
              props.recordsToAssign,
              props.setCustomDistribution,
            )}
          />
        );
      })}
    </>
  );
}

function CustomDistributionAmountRow({
  label,
  maxAllowed,
  amount,
  onKeyDown,
  onAmountChange,
}: Readonly<{
  label: string;
  maxAllowed: number;
  amount: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAmountChange: (value: string) => void;
}>) {
  return (
    <div className="mb-2">
      <Row>
        <Col md={6}>
          <Form.Label className="small mb-0">{label}</Form.Label>
        </Col>
        <Col md={6}>
          <Form.Control
            type="number"
            min={0}
            max={maxAllowed}
            value={amount}
            onKeyDown={onKeyDown}
            onChange={(e) => onAmountChange(e.target.value)}
            size="sm"
          />
        </Col>
      </Row>
    </div>
  );
}

function CrmAssignmentStatsRow({
  assignmentCounts,
}: Readonly<{
  assignmentCounts: { total: number; assigned: number; unassigned: number };
}>) {
  const items = [
    { label: "Total Records", value: assignmentCounts.total, icon: <Users size={28} className="text-success" />, bg: "success" },
    { label: "Assigned", value: assignmentCounts.assigned, icon: <UserPlus size={28} className="text-primary" />, bg: "primary" },
    { label: "Unassigned", value: assignmentCounts.unassigned, icon: <AlertCircle size={28} className="text-warning" />, bg: "warning" },
  ];
  return (
    <Row className="g-3 align-items-center">
      {items.map((item) => (
        <Col key={item.label} md={4}>
          <div className="d-flex align-items-center gap-3">
            <div className={`p-3 bg-${item.bg} bg-opacity-10 rounded-3`}>{item.icon}</div>
            <div>
              <small className="text-muted d-block mb-1">{item.label}</small>
              <strong className="fs-3 text-dark">{item.value.toLocaleString()}</strong>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}

function useCrmCampaignBootstrapData(
  refreshKey: number,
  setExtensions: React.Dispatch<React.SetStateAction<any[]>>,
  setDataManagementExtensions: React.Dispatch<React.SetStateAction<any[]>>,
  setAvailableTags: React.Dispatch<
    React.SetStateAction<Array<{ value: string; label: string; id: number }>>
  >,
  setAvailableCampaignsForUpload: React.Dispatch<
    React.SetStateAction<Array<{ value: string; label: string; id: number }>>
  >,
  setIndustries: React.Dispatch<React.SetStateAction<IndustryData[]>>,
  setDealTemplates: React.Dispatch<React.SetStateAction<DealTemplateData[]>>,
) {
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_CAMPAIGNS);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error: unknown) {
        consumeHandledApiError(error, "CrmCampaigns.fetchCrmExtensions");
      }
    };
    void fetchExtensions();
  }, [setExtensions]);

  useEffect(() => {
    const fetchDataManagementExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DATA_MANAGEMENT);
        setDataManagementExtensions(hierarchyData?.extensions || []);
      } catch (error: unknown) {
        consumeHandledApiError(error, "CrmCampaigns.fetchDataManagementExtensions");
      }
    };
    void fetchDataManagementExtensions();
  }, [setDataManagementExtensions]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        setAvailableTags(tags.map((tag) => ({ value: tag.name, label: tag.name, id: tag.id })));
      } catch {
        setAvailableTags([]);
      }
    };
    void loadTags();
  }, [refreshKey, setAvailableTags]);

  useEffect(() => {
    const loadCampaignOptions = async () => {
      try {
        const campaignsResponse = await getCampaigns({
          per_page: 1000,
          filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
        });
        setAvailableCampaignsForUpload(
          campaignsResponse.data.map((campaign) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          })),
        );
      } catch {
        setAvailableCampaignsForUpload([]);
      }
    };
    void loadCampaignOptions();
  }, [refreshKey, setAvailableCampaignsForUpload]);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await getIndustries({ per_page: 1000 });
        setIndustries(response.data || []);
      } catch {
        setIndustries([]);
      }
    };
    void loadIndustries();
  }, [setIndustries]);

  useEffect(() => {
    const loadDealTemplates = async () => {
      try {
        const response = await getDealTemplates({ per_page: 1000 });
        setDealTemplates(response.data || []);
      } catch {
        setDealTemplates([]);
      }
    };
    void loadDealTemplates();
  }, [setDealTemplates]);
}

type CrmCampaignListQueryParams = {
  refreshKey: number;
  campaignsPagination: { currentPage: number; rowsPerPage: number; sortBy: string; sortOrder: "asc" | "desc" };
  memoizedFilters: Record<string, any>;
  campaignFilters: {
    status: string[];
    dateFrom: string | null;
    dateTo: string | null;
    userExtensions: string[] | null;
    hasUnassignedProspects: boolean | null;
    tags: string[] | null;
  };
  activeFilter: string;
  campaignsSearchQuery: string;
};

type CrmCampaignListSetters = {
  setListLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCampaignsData: React.Dispatch<React.SetStateAction<any[]>>;
  setMetrics: React.Dispatch<React.SetStateAction<CampaignMetrics>>;
  setTotalCampaigns: React.Dispatch<React.SetStateAction<number>>;
};

function useCrmCampaignListQueryEffect(
  listPermission: boolean,
  query: CrmCampaignListQueryParams,
  setters: CrmCampaignListSetters,
) {
  const { refreshKey, campaignsPagination, memoizedFilters, campaignFilters, activeFilter, campaignsSearchQuery } = query;
  const { setListLoading, setCampaignsData, setMetrics, setTotalCampaigns } = setters;
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setListLoading(true);
        const filters = buildCrmCampaignListFilters(activeFilter, campaignFilters, memoizedFilters);
        const response = await getCampaigns({
          page: campaignsPagination.currentPage,
          per_page: campaignsPagination.rowsPerPage,
          search: campaignsSearchQuery || undefined,
          filters,
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        if (response?.data) {
          setCampaignsData(response.data);
          setMetrics(response.metrics);
          setTotalCampaigns(response.total || response.data.length);
        }
      } catch (error: unknown) {
        consumeHandledApiError(error, "CrmCampaigns.loadCampaigns");
        toast.error("Failed to load campaigns");
      } finally {
        setListLoading(false);
      }
    };

    if (listPermission) {
      void loadCampaigns();
    }
  }, [
    listPermission,
    refreshKey,
    campaignsPagination,
    memoizedFilters,
    campaignFilters,
    activeFilter,
    campaignsSearchQuery,
  ]);
}

function useCrmAssignmentCountsRefetch(
  showDataAssignmentModal: boolean,
  assignmentFilterCampaigns: string[],
  assignmentFilterTags: readonly any[],
  calculateEntryCounts: () => Promise<{ total: number; assigned: number; unassigned: number }>,
  setAssignmentCounts: React.Dispatch<
    React.SetStateAction<{ total: number; assigned: number; unassigned: number }>
  >,
  setRecordsToAssign: React.Dispatch<React.SetStateAction<number>>,
) {
  useEffect(() => {
    const refetchCounts = async () => {
      if (!showDataAssignmentModal) return;
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setRecordsToAssign((prev) => (prev === 0 || prev > counts.unassigned ? counts.unassigned : prev));
    };
    void refetchCounts();
  }, [assignmentFilterCampaigns, assignmentFilterTags, calculateEntryCounts, showDataAssignmentModal, setAssignmentCounts, setRecordsToAssign]);
}

const CAMPAIGN_TABLE_COLUMN_STORAGE_KEY = "campaignsSelectedColumns";

const CAMPAIGN_SELECTABLE_COLUMN_KEYS = [
  "name",
  "description",
  "status",
  "start_date",
  "user_extensions",
  "created_by",
  "created_at",
  "actions",
] as const;

const DEFAULT_CAMPAIGN_SELECTED_COLUMNS: string[] = [
  "name",
  "description",
  "status",
  "start_date",
  "user_extensions",
  "created_by",
  "created_at",
  "actions",
];

const CrmCampaigns = () => { // NOSONAR
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    active_campaigns: 0,
    inactive_campaigns: 0,
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  // UI State
  const [showCampaignsAnalytics, setShowCampaignsAnalytics] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const {
    inputValue: campaignsSearch,
    queryValue: campaignsSearchQuery,
    handleInputChange: handleCampaignsSearchChange,
    submitQuery: submitCampaignsSearch,
  } = useDebouncedSearchInput();
  const {
    pagination: campaignsPagination,
    setPagination: setCampaignsPagination,
    selectedColumns: selectedCampaignTableColumns,
    setSelectedColumns: setSelectedCampaignTableColumns,
    handlePaginationChange: handleCampaignsPaginationChange,
    handleSort: handleCampaignsSort,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_CAMPAIGN_SELECTED_COLUMNS,
    selectableColumnKeys: CAMPAIGN_SELECTABLE_COLUMN_KEYS,
    columnStorageKey: CAMPAIGN_TABLE_COLUMN_STORAGE_KEY,
    initialPagination: { rowsPerPage: 10 },
  });
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
    dateFrom: null as string | null,
    dateTo: null as string | null,
    userExtensions: null as string[] | null,
    hasUnassignedProspects: null as boolean | null,
    tags: null as string[] | null,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [listLoading, setListLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
    options: {} as Record<string, any>,
  });

  // Campaign fields management
  const [campaignFields, setCampaignFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "string",
    field_options: [] as string[],
    sort_order: 0,
    is_required: false,
  });

  // Extensions and campaign users
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  // Industries and Deal Templates
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [dealTemplates, setDealTemplates] = useState<DealTemplateData[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<readonly any[]>([]);
  const [selectedDealTemplate, setSelectedDealTemplate] = useState<any>(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [uploadSelectedCampaigns, setUploadSelectedCampaigns] = useState<readonly any[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [availableCampaignsForUpload, setAvailableCampaignsForUpload] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [autoDistributeToUsers, setAutoDistributeToUsers] = useState(false);

  // Data assignment modal states
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [assignmentFilterCampaigns, setAssignmentFilterCampaigns] = useState<string[]>([]);
  const [assignmentFilterTags, setAssignmentFilterTags] = useState<readonly any[]>([]);
  const [assignmentTargetType, setAssignmentTargetType] = useState<"campaigns" | "users">("campaigns");
  const [distributionMode, setDistributionMode] = useState<string>("equal");
  const [selectedUserExtensions, setSelectedUserExtensions] = useState<readonly any[]>([]);
  const [assignToCampaigns, setAssignToCampaigns] = useState<string[]>([]);
  const [recordsToAssign, setRecordsToAssign] = useState<number>(0);
  const [includeAssignedRecords, setIncludeAssignedRecords] = useState<boolean>(false);
  const [dataManagementExtensions, setDataManagementExtensions] = useState<any[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState({ total: 0, assigned: 0, unassigned: 0 });
  const [customDistribution, setCustomDistribution] = useState<Record<string, number>>({});
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [assigningData, setAssigningData] = useState(false);

  useCrmCampaignBootstrapData(
    refreshKey,
    setExtensions,
    setDataManagementExtensions,
    setAvailableTags,
    setAvailableCampaignsForUpload,
    setIndustries,
    setDealTemplates,
  );

  const getUserNames = useCallback((userExtensions: { user_extension: unknown }[]) => {
    if (!userExtensions || userExtensions.length === 0) return "No users assigned";
    const maxDisplay = 2;
    const userNames = userExtensions
      .map((ue) => {
        const extension = extensions.find((ext) => sameExtensionId(ext.id, ue.user_extension));
        return extension?.display_name || extension?.name || `Extension ${ue.user_extension}`;
      })
      .filter(Boolean);
    if (userNames.length <= maxDisplay) return userNames.join(", ");
    return `${userNames.slice(0, maxDisplay).join(", ")} +${userNames.length - maxDisplay} more`;
  }, [extensions]);

  const getCreatedByName = useCallback((campaign: any) => {
    const createdBy = campaign?.created_by;
    const matchedExtension = extensions.find(
      (ext) => sameExtensionId(ext.id, createdBy) || sameExtensionId(ext.extension, createdBy),
    );
    return (
      matchedExtension?.display_name ||
      matchedExtension?.name ||
      campaign?.created_by_name ||
      campaign?.creator_name ||
      createdBy ||
      "Unknown"
    );
  }, [extensions]);

  const getMaxRecords = () => includeAssignedRecords ? assignmentCounts.total : assignmentCounts.unassigned;

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  };

  const handleNumberChange = (value: string, max: number, setter: (val: number) => void) => {
    const cleaned = value.replaceAll(/\D/g, "");
    if (cleaned === "") { setter(0); return; }
    const numValue = Number.parseInt(cleaned, 10);
    setter(Math.min(Math.max(0, numValue), max));
  };

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => {
      const merged = { ...prev, ...filters };
      for (const key in merged) {
        if (merged[key] === null || merged[key] === undefined || (Array.isArray(merged[key]) && merged[key].length === 0)) {
          delete merged[key];
        }
      }
      return merged;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const listCampaignsPermission = Boolean(session?.user?.permissions?.includes("list-crm-campaigns"));

  useEffect(() => {
    setCampaignsPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [campaignsSearchQuery, setCampaignsPagination]);

  useCrmCampaignListQueryEffect(
    listCampaignsPermission,
    { refreshKey, campaignsPagination, memoizedFilters, campaignFilters, activeFilter, campaignsSearchQuery },
    { setListLoading, setCampaignsData, setMetrics, setTotalCampaigns },
  );

  // Modal handlers
  const handleCreateCampaign = useCallback(() => {
    setFormData({ name: "", description: "", start_date: "", end_date: "", status: "active", options: {} });
    setCampaignFields([]);
    setCampaignUsers([]);
    setSelectedIndustries([]);
    setSelectedDealTemplate(null);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
    setShowCreateModal(true);
  }, []);

  const handleEditCampaign = useCallback(async (campaign: any) => {
    try {
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      const draft = deriveEditorStateFromCampaignApi(campaignData, extensions, industries, dealTemplates);
      setFormData(draft.formData);
      setCampaignFields(draft.campaignFields);
      setCampaignUsers(draft.campaignUsers);
      setSelectedIndustries(draft.selectedIndustries);
      setSelectedDealTemplate(draft.selectedDealTemplate);
      setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
      setShowEditModal(true);
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.handleEditCampaign");
      toast.error("Failed to fetch campaign details");
    }
  }, [extensions, industries, dealTemplates]);

  const handleViewCampaign = useCallback(async (campaign: any) => {
    try {
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setShowViewModal(true);
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.handleViewCampaign");
      toast.error("Failed to fetch campaign details");
    }
  }, []);

  const handleDeleteCampaign = useCallback((campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    try {
      setLoading(true);
      await deleteCampaign(selectedCampaign.id);
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      toast.success("Campaign deleted successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.confirmDeleteCampaign");
      toast.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  const getTodayDate = useCallback((startDateParam: string = "") => {
    let today = new Date();
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (moment(startDate).isBefore(today)) today = startDate;
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const getMinEndDate = useCallback(() => {
    const today = getTodayDate();
    if (!formData.start_date) {
      return today;
    }
    const startDate = new Date(formData.start_date);
    startDate.setDate(startDate.getDate() + 1);
    const nextDay = startDate.toISOString().split("T")[0];
    return laterCalendarIsoDate(nextDay, today);
  }, [formData.start_date, getTodayDate]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const today = getTodayDate();
    if (!showEditModal && newStartDate && newStartDate < today) {
      toast.error("Start date must be today or a future date");
      return;
    }
    setFormData((prev) => {
      if (prev.end_date && newStartDate && newStartDate >= prev.end_date) return { ...prev, start_date: newStartDate, end_date: "" };
      return { ...prev, start_date: newStartDate };
    });
  }, [getTodayDate, showEditModal]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const minEndDate = getMinEndDate();
    if (!showEditModal && newEndDate && newEndDate < minEndDate) {
      toast.error(`End date must be after ${new Date(formData.start_date || minEndDate).toLocaleDateString()}`);
      return;
    }
    if (formData.start_date && newEndDate && newEndDate <= formData.start_date) {
      toast.error("End date must be after start date");
      return;
    }
    setFormData((prev) => ({ ...prev, end_date: newEndDate }));
  }, [formData.start_date, getMinEndDate, showEditModal]);

  const handleFormSubmit = useCallback(async () => {
    if (!validateCampaignFormBeforeSave(formData, showEditModal, getTodayDate)) return;

    try {
      setLoading(true);
      const campaignData = buildCampaignSavePayload(
        formData,
        campaignFields,
        campaignUsers,
        selectedIndustries,
        selectedDealTemplate,
      );

      if (showEditModal && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, campaignData);
        toast.success("Campaign updated successfully!");
        setShowEditModal(false);
      } else {
        await createCampaign(campaignData);
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
      }
      setSelectedCampaign(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      toast.error(getErrorMessageFromUnknown(error, "Failed to save campaign"));
    } finally {
      setLoading(false);
    }
  }, [formData, campaignFields, campaignUsers, selectedIndustries, selectedDealTemplate, showEditModal, selectedCampaign, getTodayDate]);

  // Field management
  const handleAddField = useCallback(() => {
    if (!newField.field_name.trim()) { toast.error("Field name is required"); return; }
    setCampaignFields([...campaignFields, { ...newField, field_name: newField.field_name.trim(), sort_order: campaignFields.length }]);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback((index: number) => setCampaignFields(campaignFields.filter((_, i) => i !== index)), [campaignFields]);

  const handleFieldTypeChange = useCallback((index: number, fieldType: string) => {
    const updated = [...campaignFields];
    updated[index].field_type = fieldType;
    if (fieldType !== "dropdown") updated[index].field_options = [];
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleFieldOptionChange = useCallback((index: number, optionIndex: number, value: string) => {
    const updated = [...campaignFields];
    if (!updated[index].field_options) updated[index].field_options = [];
    updated[index].field_options[optionIndex] = value;
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleAddFieldOption = useCallback((index: number) => {
    const updated = [...campaignFields];
    if (!updated[index].field_options) updated[index].field_options = [];
    const options = updated[index].field_options;
    if (options.length > 0 && options[options.length - 1].trim() === "") {
      toast.error("Please fill in the current option before adding a new one"); return;
    }
    updated[index].field_options.push("");
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleRemoveFieldOption = useCallback((index: number, optionIndex: number) => {
    const updated = [...campaignFields];
    updated[index].field_options.splice(optionIndex, 1);
    setCampaignFields(updated);
  }, [campaignFields]);

  const validateCsvFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!file.type.includes("csv") && !file.name.toLowerCase().endsWith(".csv")) errors.push("File must be a CSV file");
    if (file.size > 2 * 1024 * 1024) errors.push("File size must be less than 2MB");
    if (file.size === 0) errors.push("File cannot be empty");
    return { isValid: errors.length === 0, errors };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);
    if (validation.isValid) setSelectedFile(file);
    else validation.errors.forEach((error) => toast.error(error));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data"); return;
    }
    if (!selectedFile) { toast.error("Please select a file to upload"); return; }

    setUploading(true);
    try {
      const response = await uploadCrmDataCsv(
        selectedFile,
        Array.from(uploadSelectedCampaigns).map((c) => c.value),
        Array.from(fieldTags).map((tag) => tag.value),
        autoDistributeToUsers,
      );

      const processedCount = response.processed_count ?? 0;
      const validationFailureCount =
        (typeof response.validation_failures === "number" ? response.validation_failures : null) ??
        (Array.isArray(response.errors) ? response.errors.length : 0);
      toastCrmCsvUploadOutcome(processedCount, validationFailureCount);

      setSelectedFile(null);
      setFieldTags([]);
      setUploadSelectedCampaigns([]);
      setAutoDistributeToUsers(false);
      setShowUploadModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.handleUpload");
      toast.error(getErrorMessageFromUnknown(error, "Failed to upload file. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = assignmentFilterCampaigns
        .map((c) => Number.parseInt(c, 10))
        .filter((id) => !Number.isNaN(id) && id > 0);
      const tags = assignmentFilterTags.map((tag: any) => tag.value || tag);
      const counts = await getCrmDataCounts(campaignIds, tags);
      return { total: counts.summary.total_records, assigned: counts.summary.assigned_records, unassigned: counts.summary.unassigned_records };
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.calculateEntryCounts");
      return { total: 0, assigned: 0, unassigned: 0 };
    }
  }, [assignmentFilterCampaigns, assignmentFilterTags]);

  useCrmAssignmentCountsRefetch(
    showDataAssignmentModal,
    assignmentFilterCampaigns,
    assignmentFilterTags,
    calculateEntryCounts,
    setAssignmentCounts,
    setRecordsToAssign,
  );

  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setRecordsToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.handleDataAssignment");
      setAssignmentCounts({ total: 0, assigned: 0, unassigned: 0 });
      setRecordsToAssign(0);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  const resetAssignmentState = () => {
    setAssignmentFilterCampaigns([]);
    setAssignmentFilterTags([]);
    setAssignmentTargetType("campaigns");
    setDistributionMode("equal");
    setAssignToCampaigns([]);
    setSelectedUserExtensions([]);
    setRecordsToAssign(0);
    setIncludeAssignedRecords(false);
    setCustomDistribution({});
  };

  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    resetAssignmentState();
  }, []);

  const handleDataAssignmentSubmit = useCallback(async () => {
    const maxRecords = getMaxRecords();
    const validationError = getCrmDataAssignmentSubmitValidationError({
      assignmentTargetType,
      recordsToAssign,
      maxRecords,
      distributionMode,
      assignToCampaigns,
      selectedUserExtensions,
      customDistribution,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setAssigningData(true);
    try {
      const built = buildCrmDataAssignmentPayload({
        assignmentTargetType,
        recordsToAssign,
        includeAssignedRecords,
        assignmentFilterCampaigns,
        assignmentFilterTags,
        availableTags,
        assignToCampaigns,
        availableCampaignsForUpload,
        distributionMode,
        customDistribution,
        selectedUserExtensions,
      });

      if (!built.ok) {
        toast.error(built.message);
        return;
      }

      const response = await axiosInstance.post("/crm/crm_data/assign", built.payload);
      if (response?.data?.data?.success) {
        toast.success(`Successfully assigned ${recordsToAssign} records!`);
        setShowDataAssignmentModal(false);
        resetAssignmentState();
        setShowSuccessfulModal(true);
        setSuccessModalTitle("Data Assignment Successful!");
        setSuccessModalDescription(`Successfully assigned ${recordsToAssign} records!`);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to assign data");
      }
    } catch (error: unknown) {
      consumeHandledApiError(error, "CrmCampaigns.handleDataAssignmentSubmit");
      toast.error(getErrorMessageFromUnknown(error, "Failed to assign data"));
    } finally {
      setAssigningData(false);
    }
  }, [assignmentTargetType, recordsToAssign, distributionMode, assignToCampaigns, selectedUserExtensions, assignmentFilterCampaigns, assignmentFilterTags, availableTags, availableCampaignsForUpload, includeAssignedRecords, customDistribution]);

  const handleAutoFillEqualDistribution = useCallback(() => {
    if (assignmentTargetType === "campaigns") {
      if (assignToCampaigns.length === 0) return;
      const eq = Math.floor(recordsToAssign / assignToCampaigns.length);
      const rem = recordsToAssign % assignToCampaigns.length;
      const dist: Record<string, number> = {};
      assignToCampaigns.forEach((c, i) => {
        const opt = availableCampaignsForUpload.find((ac) => ac.label === c);
        if (opt) dist[opt.value] = eq + (i < rem ? 1 : 0);
      });
      setCustomDistribution(dist);
      return;
    }
    if (assignmentTargetType === "users" && selectedUserExtensions.length > 0) {
      const n = selectedUserExtensions.length;
      const eq = Math.floor(recordsToAssign / n);
      const rem = recordsToAssign % n;
      const dist: Record<string, number> = {};
      selectedUserExtensions.forEach((opt: { value?: string }, i: number) => {
        const key = opt.value?.toString() ?? "";
        if (key) dist[key] = eq + (i < rem ? 1 : 0);
      });
      setCustomDistribution(dist);
    }
  }, [
    assignmentTargetType,
    recordsToAssign,
    assignToCampaigns,
    availableCampaignsForUpload,
    selectedUserExtensions,
  ]);

  // --- GenericTable columns ---
  const campaignsTableColumns = useMemo<TableColumn<any>[]>(() => [
    {
      key: "name",
      label: "Campaign Name",
      sortable: true,
      type: "custom",
      width: "min(240px, 28vw)",
      render: (campaign: any) => (
        <div className="fw-semibold">{campaign.name || "Unnamed Campaign"}</div>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      type: "custom",
      width: "min(280px, 32vw)",
      render: (campaign: any) => (
        <CrmTruncatedDescriptionCell
          text={campaign.description}
          emptyDisplay="No Description"
          className="small text-muted"
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <Badge bg={campaign.status === "active" ? "success" : "secondary"} className="bg-opacity-10 text-dark">
          {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || "Inactive"}
        </Badge>
      ),
    },
    {
      key: "start_date",
      label: "Date Range",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <div>
          <div className="fw-semibold small">
            {campaign.start_date ? formatDateForTable(campaign.start_date) : "No start date"}
          </div>
          <small className="text-muted">
            to {campaign.end_date ? formatDateForTable(campaign.end_date) : "No end date"}
          </small>
        </div>
      ),
    },
    {
      key: "user_extensions",
      label: "Campaign Users",
      sortable: false,
      type: "custom",
      render: (campaign: any) => (
        <span className="text-muted small">{getUserNames(campaign.user_extensions || [])}</span>
      ),
    },
    {
      key: "created_by",
      label: "Created By",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <small className="text-muted">{getCreatedByName(campaign)}</small>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <small className="text-muted">
          {campaign.created_at ? formatDateForTable(campaign.created_at) : "Unknown"}
        </small>
      ),
    },
  ], [getCreatedByName, getUserNames]);

  const campaignsTableActions = useMemo(() => {
    const actions: any[] = [];

    if (session?.user?.permissions?.includes("view-crm-campaigns")) {
      actions.push({
        label: "View",
        icon: <Eye size={16} />,
        onClick: (campaign: any) => handleViewCampaign(campaign),
        variant: "link",
        className: "p-1 text-primary",
      });
    }
    if (session?.user?.permissions?.includes("edit-crm-campaigns")) {
      actions.push({
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: (campaign: any) => handleEditCampaign(campaign),
        variant: "link",
        className: "p-1 text-primary",
      });
    }
    if (session?.user?.permissions?.includes("delete-crm-campaigns")) {
      actions.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (campaign: any) => handleDeleteCampaign(campaign),
        variant: "link",
        className: "p-1 text-danger",
      });
    }

    return actions;
  }, [session?.user?.permissions, handleViewCampaign, handleEditCampaign, handleDeleteCampaign]);

  // Filter counts for tabs
  const filterCounts = useMemo(() => ({
    all: totalCampaigns,
    active: metrics.active_campaigns,
    inactive: metrics.inactive_campaigns,
  }), [totalCampaigns, metrics]);

  const toolbarConfig = useMemo<ToolbarConfig>(
    () =>
      createCrmCampaignsToolbarConfig({
        campaignsSearch,
        onCampaignsSearchChange: handleCampaignsSearchChange,
        submitCampaignsSearch,
        handleFiltersChange,
        setCampaignsPagination,
        setRefreshKey,
        filterCounts,
        activeFilter,
        setActiveFilter,
        setCampaignFilters,
        campaignFilters,
        extensions,
        showCampaignsAnalytics,
        setShowCampaignsAnalytics,
        session,
        handleDataAssignment,
        handleCreateCampaign,
        onOpenUploadModal: () => setShowUploadModal(true),
      }),
    [
      campaignsSearch,
      handleCampaignsSearchChange,
      activeFilter,
      filterCounts,
      showCampaignsAnalytics,
      campaignFilters,
      session?.user?.permissions,
      extensions,
      handleDataAssignment,
      handleCreateCampaign,
      handleFiltersChange,
      submitCampaignsSearch,
    ],
  );

  const closeCreateEditModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCampaign(null);
    setCampaignUsers([]);
    setSelectedIndustries([]);
    setSelectedDealTemplate(null);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Campaigns" />

      {/* Analytics Section - Collapsible */}
      {showCampaignsAnalytics && session?.user?.permissions?.includes("list-crm-campaigns") && (
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Total Campaigns" value={totalCampaigns.toString()} icon={<Megaphone size={24} />} color="primary" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Active Campaigns" value={metrics.active_campaigns.toString()} icon={<TrendingUp size={24} />} color="success" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Inactive Campaigns" value={metrics.inactive_campaigns.toString()} icon={<AlertCircle size={24} />} color="warning" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Total Users" value={extensions.length.toString()} icon={<Users size={24} />} color="info" />
          </Col>
        </Row>
      )}

      {/* Campaigns Table via GenericTable */}
      {session?.user?.permissions?.includes("list-crm-campaigns") && (
        <GenericTable<any>
          data={campaignsData}
          columns={campaignsTableColumns}
          actions={campaignsTableActions}
          showActions={campaignsTableActions.length > 0}
          actionsLabel="Actions"
          sortable
          defaultSortBy={campaignsPagination.sortBy}
          defaultSortOrder={campaignsPagination.sortOrder}
          onSort={handleCampaignsSort}
          loading={listLoading}
          emptyMessage="No campaigns found matching your criteria"
          pagination={{
            currentPage: campaignsPagination.currentPage,
            rowsPerPage: campaignsPagination.rowsPerPage,
            totalRows: totalCampaigns,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={handleCampaignsPaginationChange}
          customizableColumns
          selectedColumns={selectedCampaignTableColumns}
          defaultSelectedColumns={DEFAULT_CAMPAIGN_SELECTED_COLUMNS}
          onColumnChange={setSelectedCampaignTableColumns}
          columnStorageKey={CAMPAIGN_TABLE_COLUMN_STORAGE_KEY}
          showToolbar
          toolbar={toolbarConfig}
          showToolbarActions={false}
          uniqueKey="id"
        />
      )}

      {/* Create/Edit Campaign Modal */}
      <Modal
        show={showCreateModal || showEditModal}
        onHide={() => {
          if (loading) return;
          closeCreateEditModal();
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton={!loading}>
          <Modal.Title>
            {showEditModal ? `Edit Campaign: ${selectedCampaign?.name}` : "Add New Campaign"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Campaign Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter campaign name" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Start Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control type="date" value={formData.start_date} onChange={handleStartDateChange} min={showEditModal ? getTodayDate(formData.start_date || "") : getTodayDate()} />
                  <Form.Text className="text-muted">{showEditModal ? "Campaign start date" : "Must be today or a future date"}</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    End Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control type="date" value={formData.end_date} onChange={handleEndDateChange} min={showEditModal ? undefined : getMinEndDate()} />
                  <Form.Text className="text-muted">Must be after start date</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter campaign description (optional)" />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Product Groups</Form.Label>
                  <Select
                    isMulti
                    value={selectedIndustries}
                    onChange={(selected) => setSelectedIndustries(selected || [])}
                    options={industries.map((industry) => ({ value: industry.id.toString(), label: industry.name, id: industry.id }))}
                    placeholder="Select product groups..."
                    styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Deal Template</Form.Label>
                  <Select
                    value={selectedDealTemplate}
                    onChange={(selected) => setSelectedDealTemplate(selected)}
                    options={dealTemplates.map((template) => ({ value: template.id.toString(), label: template.name, id: template.id }))}
                    placeholder="Select deal template..."
                    isClearable
                    styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>Campaign Users</Form.Label>
              <Select
                isMulti
                value={campaignUsers}
                onChange={(selected) => setCampaignUsers(selected || [])}
                options={extensions.map((ext: any) => ({ value: ext.id, label: ext.display_name || ext.name || ext.id }))}
                placeholder="Select users for this campaign..."
                styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
              />
            </Form.Group>

            {/* Campaign Fields */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Campaign Fields</h5>
              </div>
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Control type="text" placeholder="Field name" value={newField.field_name} onChange={(e) => setNewField({ ...newField, field_name: e.target.value })} />
                    </Col>
                    <Col md={3}>
                      <Form.Select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}>
                        <option value="string">Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Check type="checkbox" label="Required" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} />
                    </Col>
                    <Col md={3}>
                      <Button variant="success" className="app-button" onClick={handleAddField}>Add Field</Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              {campaignFields.map((field, index) => {
                const fieldKey = campaignFieldRowKey(field, index);
                return (
                  <Card key={fieldKey} className="mb-2">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            value={field.field_name}
                            onChange={(e) => {
                              const u = [...campaignFields];
                              u[index].field_name = e.target.value;
                              setCampaignFields(u);
                            }}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Select value={field.field_type} onChange={(e) => handleFieldTypeChange(index, e.target.value)}>
                            <option value="string">Text</option>
                            <option value="integer">Number</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="dropdown">Dropdown</option>
                          </Form.Select>
                        </Col>
                        <Col md={2}>
                          <Form.Check
                            type="checkbox"
                            label="Required"
                            checked={field.is_required || false}
                            onChange={(e) => {
                              const u = [...campaignFields];
                              u[index].is_required = e.target.checked;
                              setCampaignFields(u);
                            }}
                          />
                        </Col>
                        <Col md={3}>
                          <Button variant="danger" className="app-button" onClick={() => handleRemoveField(index)}>
                            <FiTrash2 /> Delete
                          </Button>
                        </Col>
                        {field.field_type === "dropdown" && (
                          <Col md={12} className="mt-3">
                            {field.field_options?.map((option: string, optionIndex: number) => (
                              <div
                                key={campaignFieldOptionKey(fieldKey, optionIndex)}
                                className="d-flex mb-3 row align-items-center justify-content-left"
                              >
                                <Col md={5}>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={option}
                                    onChange={(e) => handleFieldOptionChange(index, optionIndex, e.target.value)}
                                    placeholder="Option value"
                                  />
                                </Col>
                                <Col md={5}>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="app-button"
                                    onClick={() => handleRemoveFieldOption(index, optionIndex)}
                                  >
                                    Remove Option
                                  </Button>
                                </Col>
                              </div>
                            ))}
                            <Button variant="primary" className="app-button" size="sm" onClick={() => handleAddFieldOption(index)}>
                              Add Option
                            </Button>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                );
              })}
              {campaignFields.length === 0 && (
                <Alert variant="info">No fields added yet. Click "Add Field" to create custom fields for this campaign.</Alert>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-2">
          <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
            <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0">
              <AlertCircle size={14} />
              <span style={{ fontSize: "0.813rem" }}>
                Fields marked with <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <div style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}>
              <Button
                variant="primary"
                onClick={handleFormSubmit}
                disabled={loading}
                style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
              >
                {loading ? (
                  campaignFormSubmitButtonLabel(true, showEditModal)
                ) : (
                  <>
                    <Check size={16} aria-hidden />
                    {campaignFormSubmitButtonLabel(false, showEditModal)}
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={closeCreateEditModal}
                disabled={loading}
                style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl" centered>
        {selectedCampaign && (
          <>
            <div style={{ color: "black", padding: "30px", position: "relative", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", borderBottom: "1px solid #e5e7eb" }}>
              <button
                type="button"
                aria-label="Close campaign details"
                onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }}
                style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.2)", border: "none", color: "black", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "rotate(90deg)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "rotate(0deg)"; }}
                onFocus={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "rotate(90deg)"; }}
                onBlur={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "rotate(0deg)"; }}
              >
                <X size={20} aria-hidden />
              </button>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>{selectedCampaign.name}</h3>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>Campaign Details</p>
            </div>
            <Modal.Body style={{ padding: "30px" }}>
              {loading ? (
                <output className="text-center py-4 d-block" aria-live="polite">
                  <span className="spinner-border d-inline-block" aria-hidden />
                  <span className="visually-hidden">Loading...</span>
                </output>
              ) : (
                <>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Megaphone size={18} style={{ color: "#4680ff" }} /> Campaign Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                    {[
                      { label: "Campaign Name", value: selectedCampaign.name },
                      { label: "Status", value: <Badge bg={selectedCampaign.status === "active" ? "success" : "secondary"} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>{selectedCampaign.status?.charAt(0).toUpperCase() + selectedCampaign.status?.slice(1) || "Inactive"}</Badge> },
                    ].map((item) => (
                      <div key={item.label} style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                        <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Description</div>
                  <CrmDescriptionDetailsBlock
                    text={selectedCampaign.description}
                    emptyDisplay="No description"
                  />

                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Calendar size={18} style={{ color: "#4680ff" }} /> Date Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                    <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Date Range</div>
                      <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                        {viewModalDateRangeText(selectedCampaign)}
                      </div>
                    </div>
                    <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Created Date</div>
                      <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>{selectedCampaign.created_at ? formatDateForTable(selectedCampaign.created_at) : "N/A"}</div>
                    </div>
                  </div>

                  {selectedCampaign.user_extensions?.length > 0 && (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Users size={18} style={{ color: "#4680ff" }} /> Campaign Users ({selectedCampaign.user_extensions.length})
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "30px" }}>
                        {selectedCampaign.user_extensions.map((ue: { user_extension: unknown }) => {
                          const ext = extensions.find((e) => sameExtensionId(e.id, ue.user_extension));
                          return (
                            <div key={`ue-${String(ue.user_extension)}`} style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 500 }}>
                              {ext?.display_name || ext?.name || `Extension ${ue.user_extension}`}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={18} style={{ color: "#4680ff" }} /> Campaign Fields ({selectedCampaign.fields?.length || 0})
                  </div>
                  {selectedCampaign.fields?.length > 0 ? (
                    <div className="table-responsive mb-4">
                      <table className="table table-bordered">
                        <thead>
                          <tr><th>Field Name</th><th>Type</th><th>Required</th><th>Options</th></tr>
                        </thead>
                        <tbody>
                          {selectedCampaign.fields.map((field: any, index: number) => {
                            const fieldKey = campaignFieldRowKey(field, index);
                            return (
                            <tr key={fieldKey}>
                              <td>{field.field_name}</td>
                              <td><Badge bg="primary" className="text-capitalize">{getFieldTypeText(field.field_type)}</Badge></td>
                              <td>{field.is_required ? <Badge bg="danger">Required</Badge> : <Badge bg="secondary">Optional</Badge>}</td>
                              <td>
                                {field.field_type === "dropdown" && field.field_options
                                  ? field.field_options.map((opt: string, i: number) => (
                                    <Badge key={campaignFieldOptionKey(fieldKey, i)} bg="info" className="me-1">{opt}</Badge>
                                  ))
                                  : <span className="text-muted">N/A</span>}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert variant="info" className="mb-4">No custom fields defined for this campaign.</Alert>
                  )}

                  <div
                    style={{
                      ...CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
                      justifyContent: "flex-end",
                      paddingTop: "20px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    {session?.user?.permissions?.includes("edit-crm-campaigns") && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditCampaign(selectedCampaign);
                        }}
                        style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                      >
                        <Edit size={16} aria-hidden />
                        Edit Campaign
                      </Button>
                    )}
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedCampaign(null);
                      }}
                      style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedCampaign(null); }}
        onConfirm={confirmDeleteCampaign}
        itemName={selectedCampaign?.name}
        itemType="campaign"
        loading={loading}
        additionalInfo={<p className="text-muted small mb-0">This action will also delete all associated campaign fields.</p>}
      />

      {/* Upload Modal */}
      {session?.user?.permissions?.includes("add-crm-data-management") && (
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-bottom bg-light">
            <Modal.Title>Upload CSV - Import Prospects</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="alert alert-info mb-4">
              <AlertCircleIcon size={18} className="me-2" />
              <strong>📋 Import Guidelines:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>Headers:</strong> First row must contain column headers</li>
                <li><strong>Name Column:</strong> Include a "name" column (case insensitive) for first name and last name</li>
                <li><strong>Phone Column:</strong> Include a "phone" column (case insensitive) for contact information</li>
                <li><strong>File Size:</strong> Maximum 2MB per file</li>
                <li><strong>Phone Format:</strong> Phone numbers must be in E.164 format (e.g., +1234567890)</li>
                <li><strong>Formats:</strong> CSV files supported</li>
              </ul>
            </div>
            <Form>
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="fw-semibold mb-0">Select CSV File <span className="text-danger">*</span></Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={downloadExampleCsv} className="d-flex align-items-center gap-1"><Download size={14} /> Download Example CSV</Button>
                </div>
                <Form.Control type="file" accept=".csv" onChange={handleFileInputChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Campaigns (Optional)</Form.Label>
                <Select isMulti value={uploadSelectedCampaigns} onChange={(s) => setUploadSelectedCampaigns(s || [])} options={availableCampaignsForUpload} placeholder="Select campaigns..." styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Tags (Optional)</Form.Label>
                <CreatableSelect isMulti value={fieldTags} onChange={(s) => setFieldTags(s || [])} options={availableTags} placeholder="Add tags..." styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Data Distribution</Form.Label>
                <div>
                  <Form.Check type="radio" id="auto-distribute-yes" name="autoDistribute" label="Automatically distribute data between campaign users" checked={autoDistributeToUsers === true} onChange={() => setAutoDistributeToUsers(true)} className="mb-2" />
                  <Form.Check type="radio" id="auto-distribute-no" name="autoDistribute" label="Do not automatically distribute" checked={autoDistributeToUsers === false} onChange={() => setAutoDistributeToUsers(false)} />
                </div>
              </Form.Group>
              <div className="alert alert-warning"><small><strong>Note:</strong> The data will be uploaded even if some fields remain empty.</small></div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 me-auto">
              <AlertCircle size={14} />
              <span style={{ fontSize: "0.813rem" }}>
                Fields marked with <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <Button variant="secondary" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setFieldTags([]); setUploadSelectedCampaigns([]); setAutoDistributeToUsers(false); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? (
                <output className="d-inline-flex align-items-center gap-2 mb-0" aria-live="polite">
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  <span>Uploading...</span>
                </output>
              ) : (
                <span className="d-inline-flex align-items-center gap-1">
                  <Download size={16} aria-hidden />
                  <span>Upload & Import</span>
                </span>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Data Assignment Modal */}
      <Modal show={showDataAssignmentModal} onHide={handleDataAssignmentModalClose} size="lg" centered backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }} className="pb-2">
          <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3"><Target size={20} className="text-primary" /></div>
            Data Assignment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="alert alert-primary border-0 d-flex align-items-start mb-4 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)", borderLeft: "4px solid #4f46e5" }}>
            <AlertCircle size={20} className="text-primary mt-1 me-2 flex-shrink-0" />
            <div><strong className="d-block mb-1 text-dark">Smart Data Assignment</strong><span className="text-muted small">Configure filters and assignment criteria to distribute prospects efficiently.</span></div>
          </div>
          <Form>
            <div className="mb-4 p-4 rounded-4 border" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)" }}>
              <div className="d-flex align-items-center gap-2 mb-4"><Filter size={18} className="text-primary" /><h6 className="mb-0 fw-bold text-dark">Filter Records</h6></div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2"><span className="d-flex align-items-center gap-1"><Megaphone size={14} /> Campaign Filter</span></Form.Label>
                    <Select isMulti options={availableCampaignsForUpload.map((c) => ({ value: c.value, label: c.label }))} value={assignmentFilterCampaigns.map((c) => { const opt = availableCampaignsForUpload.find((ac) => ac.value === c); return opt ? { value: opt.value, label: opt.label } : { value: c, label: c }; })} onChange={(s) => setAssignmentFilterCampaigns(s ? s.map((o) => o.value) : [])} placeholder="Select campaigns..." styles={CRM_CAMPAIGNS_SELECT_STYLES} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2"><span className="d-flex align-items-center gap-1"><Hash size={14} /> Tag Filter</span></Form.Label>
                    <CreatableSelect isMulti options={availableTags} value={assignmentFilterTags} onChange={(s) => setAssignmentFilterTags(s || [])} placeholder="Select or create tags..." styles={CRM_CAMPAIGNS_SELECT_STYLES} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-4 p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                <CrmAssignmentStatsRow assignmentCounts={assignmentCounts} />
              </div>
            </div>

            <div className="mb-4 p-4 rounded-4 border" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)" }}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-muted mb-2">Assign To <span className="text-danger">*</span></Form.Label>
                <div>
                  <Form.Check type="radio" id="assign-campaigns" name="assignTarget" label="Campaigns" value="campaigns" checked={assignmentTargetType === "campaigns"} onChange={() => { setAssignmentTargetType("campaigns"); setDistributionMode("equal"); setAssignToCampaigns([]); setSelectedUserExtensions([]); setCustomDistribution({}); }} className="mb-2" />
                  <Form.Check type="radio" id="assign-users" name="assignTarget" label="Users" value="users" checked={assignmentTargetType === "users"} onChange={() => { setAssignmentTargetType("users"); setDistributionMode("equal"); setAssignToCampaigns([]); setSelectedUserExtensions([]); setCustomDistribution({}); }} />
                </div>
              </Form.Group>

              {assignmentTargetType === "campaigns" && (
                <div className="p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)" }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Distribution Mode <span className="text-danger">*</span></Form.Label>
                        <Select options={[{ value: "equal", label: "Equal Distribution" }, { value: "custom", label: "Proportional Distribution" }]} value={{ value: distributionMode, label: distributionMode === "equal" ? "Equal Distribution" : "Proportional Distribution" }} onChange={(s) => setDistributionMode(s?.value || "equal")} placeholder="Select distribution mode..." styles={CRM_CAMPAIGNS_SELECT_STYLES} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Target Campaigns <span className="text-danger">*</span></Form.Label>
                        <Select isMulti options={availableCampaignsForUpload.map((c) => ({ value: c.label, label: c.label }))} value={assignToCampaigns.map((c) => ({ value: c, label: c }))} onChange={(s) => setAssignToCampaigns(s ? s.map((o) => o.value) : [])} placeholder="Select campaigns..." styles={CRM_CAMPAIGNS_SELECT_STYLES} />
                      </Form.Group>
                    </Col>
                  </Row>
                  {distributionMode === "custom" && assignToCampaigns.length > 0 && (
                    <Row className="mt-3">
                      <Col md={12}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0 fw-semibold small text-muted">Proportional Distribution</Form.Label>
                            <Button variant="outline-secondary" size="sm" onClick={handleAutoFillEqualDistribution}>
                              Auto-fill Equal
                            </Button>
                          </div>
                          <div className="border rounded p-3 bg-light">
                            <p className="small text-muted mb-3">Total: <strong>{recordsToAssign}</strong> | Allocated: <strong>{Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong> | Remaining: <strong>{recordsToAssign - Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong></p>
                            <CrmProportionalDistributionRows
                              items={assignToCampaigns.flatMap((c) => {
                                const opt = availableCampaignsForUpload.find((ac) => ac.label === c);
                                return opt ? [{ valueKey: opt.value, label: c }] : [];
                              })}
                              recordsToAssign={recordsToAssign}
                              customDistribution={customDistribution}
                              handleNumberKeyDown={handleNumberKeyDown}
                              setCustomDistribution={setCustomDistribution}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </div>
              )}

              {assignmentTargetType === "users" && (
                <div className="p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)" }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Distribution Mode <span className="text-danger">*</span></Form.Label>
                        <Select options={[{ value: "equal", label: "Equal Distribution" }, { value: "custom", label: "Proportional Distribution" }]} value={{ value: distributionMode, label: distributionMode === "equal" ? "Equal Distribution" : "Proportional Distribution" }} onChange={(s) => setDistributionMode(s?.value || "equal")} placeholder="Select distribution mode..." styles={CRM_CAMPAIGNS_SELECT_STYLES} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Select Users <span className="text-danger">*</span></Form.Label>
                        <Select
                          isMulti
                          options={dataManagementExtensions.map((ext: any) => ({
                            value: ext.id?.toString() || ext.extension?.toString() || "",
                            label: ext.display_name || ext.name || `Extension ${ext.id || ext.extension}`,
                            extension: ext,
                          }))}
                          value={selectedUserExtensions}
                          onChange={(s) => {
                            const next = s || [];
                            const allowed = new Set(next.map((o: { value?: string }) => String(o.value ?? "")));
                            setSelectedUserExtensions(next);
                            setCustomDistribution((prev) => {
                              const pruned: Record<string, number> = {};
                              for (const [k, v] of Object.entries(prev)) {
                                if (allowed.has(k)) pruned[k] = v;
                              }
                              return pruned;
                            });
                          }}
                          placeholder="Select users..."
                          styles={CRM_CAMPAIGNS_SELECT_STYLES}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  {distributionMode === "custom" && selectedUserExtensions.length > 0 && (
                    <Row className="mt-3">
                      <Col md={12}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0 fw-semibold small text-muted">Proportional Distribution</Form.Label>
                            <Button variant="outline-secondary" size="sm" onClick={handleAutoFillEqualDistribution}>
                              Auto-fill Equal
                            </Button>
                          </div>
                          <div className="border rounded p-3 bg-light">
                            <p className="small text-muted mb-3">
                              Total: <strong>{recordsToAssign}</strong> | Allocated:{" "}
                              <strong>{Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong> | Remaining:{" "}
                              <strong>{recordsToAssign - Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong>
                            </p>
                            <CrmProportionalDistributionRows
                              items={selectedUserExtensions
                                .map((opt: { value?: string; label?: string }) => ({
                                  valueKey: String(opt.value ?? ""),
                                  label: String(opt.label ?? opt.value ?? "User"),
                                }))
                                .filter((row: { valueKey: string }) => row.valueKey.length > 0)}
                              recordsToAssign={recordsToAssign}
                              customDistribution={customDistribution}
                              handleNumberKeyDown={handleNumberKeyDown}
                              setCustomDistribution={setCustomDistribution}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </div>
              )}
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-2">Number of Records to Assign <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                  <Form.Control type="number" min="1" max={getMaxRecords()} value={recordsToAssign || ""} onKeyDown={handleNumberKeyDown} onChange={(e) => handleNumberChange(e.target.value, getMaxRecords(), setRecordsToAssign)} placeholder={`Enter number (max: ${getMaxRecords().toLocaleString()})`} className="border-2 py-2" style={{ paddingRight: "100px" }} />
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3"><small className="text-muted">of {getMaxRecords().toLocaleString()}</small></div>
                </div>
                <div className="mt-2 d-flex align-items-center gap-2">
                  <div className="flex-grow-1 bg-light rounded-pill overflow-hidden" style={{ height: "6px" }}>
                    <div className="bg-primary h-100 rounded-pill" style={{ width: `${recordsToAssign > 0 && getMaxRecords() > 0 ? (recordsToAssign / getMaxRecords()) * 100 : 0}%`, transition: "width 0.3s ease" }} />
                  </div>
                  <small className="text-muted fw-medium">{recordsToAssign > 0 && getMaxRecords() > 0 ? ((recordsToAssign / getMaxRecords()) * 100).toFixed(1) : "0"}%</small>
                </div>
              </Form.Group>
            </div>

            <div className="mb-4 p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
              <h6 className="fw-bold mb-3 text-primary d-flex align-items-center"><Briefcase size={18} className="me-2" />Assignment Settings</h6>
              <div className="p-3 bg-white rounded-3">
                <Form.Label className="fw-semibold text-dark mb-2">Include already assigned records (allow reassignment)</Form.Label>
                <div>
                  <Form.Check type="radio" id="include-yes" name="includeAssigned" label="Yes, include already assigned records" checked={includeAssignedRecords === true} onChange={() => { setIncludeAssignedRecords(true); if (recordsToAssign > assignmentCounts.total) setRecordsToAssign(assignmentCounts.total); }} className="mb-2" />
                  <Form.Check type="radio" id="include-no" name="includeAssigned" label="No, only assign unassigned records" checked={includeAssignedRecords === false} onChange={() => { setIncludeAssignedRecords(false); if (recordsToAssign > assignmentCounts.unassigned) setRecordsToAssign(assignmentCounts.unassigned); }} />
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 me-auto">
            <AlertCircle size={14} />
            <span style={{ fontSize: "0.813rem" }}>
              Fields marked with <span className="text-danger fw-bold">*</span> are required
            </span>
          </Form.Text>
          <Button variant="light" onClick={handleDataAssignmentModalClose} disabled={assigningData} className="px-4 fw-semibold">Cancel</Button>
          <Button variant="primary" disabled={assigningData || !assignmentTargetType || recordsToAssign === 0 || recordsToAssign > getMaxRecords() || (assignmentTargetType === "campaigns" && (!distributionMode || assignToCampaigns.length === 0)) || (assignmentTargetType === "users" && (!distributionMode || selectedUserExtensions.length === 0))} onClick={handleDataAssignmentSubmit} className="px-4 fw-semibold d-flex align-items-center gap-2">
            {assigningData ? (
              <output className="d-inline-flex align-items-center gap-2 mb-0" aria-live="polite">
                <span className="spinner-border spinner-border-sm" aria-hidden />
                <span>Assigning...</span>
              </output>
            ) : (
              <span className="d-inline-flex align-items-center gap-1">
                <UserPlus size={18} aria-hidden />
                <span>
                  Assign
                  {recordsToAssign > 0 ? ` ${recordsToAssign.toLocaleString()} Records` : " Records"}
                </span>
              </span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <SuccessfulModal show={showSuccessfulModal} onHide={() => setShowSuccessfulModal(false)} title={successModalTitle} description={successModalDescription} />
    </React.Fragment>
  );
};

CrmCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCampaigns;
