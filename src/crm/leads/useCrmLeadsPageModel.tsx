import { useRouter } from "next/router";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import type {
  TableColumn,
  TableAction,
  TabConfig,
} from "@components/GenericTable";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useCrmLogActivityModals } from "@hooks/useCrmLogActivityModals";
import {
  buildShallowTabFilterPushArgs,
  resolveTabFilterFromUrlQuery,
} from "@hooks/crmListPageTabCreateContactAndFilterHelpers";
import { parseStoredVisibleColumnKeysLoose } from "@utils/crmListVisibleColumnsStorage";
import {
  getMinIsoDateForDateInput,
  toIsoDateInputValueFromDbField,
} from "@utils/crmDateInputMinToday";
import {
  getLeads,
  getLead,
  deleteLead,
  convertLead,
  markLeadLost,
  getStages,
  createLeadFollowUp,
  updateLeadFollowUp,
  deleteLeadFollowUp,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  restoreLead,
  updateLead,
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCampaigns,
  getCampaignById,
  getBusinessTypes,
  getLeadFollowUps,
  getMeetings,
} from "./leadsPageCrmBundle";
import type {
  StageData,
  CampaignData,
  CrmDataItem,
  BusinessTypeData,
} from "./leadsPageCrmBundle";
import { GetHierarchyData } from "@utils/users";
import { Badge } from "react-bootstrap";
import {
  ModuleSlug,
  formatDateForTable,
  checkRequiredFields,
  GlobalDateFormat,
  convertLocalMeetingToUtc,
  convertUtcMeetingToLocal,
} from "@utils/Helper";
import {
  Target,
  CheckCircle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Handshake,
  X,
  Users,
  Clock,
  Calendar,
  GitBranch,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useCti } from "../../contexts/CtiContext";
import type { StatsCardData } from "@components/GenericStatsCards";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { useCrmListPreviewPersistence } from "@crm/shared/useCrmListPreviewPersistence";
import { applyCrmFilterRules } from "@crm/shared/crmListFilterHelpers";
import {
  LeadData,
  DEFAULT_FOLLOWUP_FORM,
  DEFAULT_MEETING_FORM,
  LEADS_FILTER_RULES,
  LEADS_EXPORT_TRUTHY_KEYS,
  LEADS_EXPORT_DEFINED_KEYS,
  LEADS_EXPORT_PRESENT_KEYS,
  addTruthyExportFilters,
  addDefinedExportFilters,
  addPresentExportFilters,
  buildLeadsListExportCsvText,
  getContactPersonsValidationError,
} from "./leadsPageShared";

const { PERMISSIONS } = HEADER_CONSTANTS;

function parseLeadsListApiEnvelope(response: unknown): {
  leadsArray: unknown[];
  pagination: Record<string, any>;
  summary: any;
  metrics: any;
} {
  const empty: unknown[] = [];
  const emptyPagination: Record<string, any> = {};
  if (response == null || typeof response !== "object") {
    return {
      leadsArray: empty,
      pagination: emptyPagination,
      summary: null,
      metrics: null,
    };
  }
  const root = response as Record<string, unknown>;
  if (Array.isArray(root.data)) {
    const pagination: Record<string, any> = {
      total: root.total,
      current_page: root.current_page,
      per_page: root.per_page,
      last_page: root.last_page,
    };
    return {
      leadsArray: root.data,
      pagination,
      summary: root.summary_tiles ?? null,
      metrics: root.metrics ?? null,
    };
  }
  const responseData = root.data;
  if (responseData == null || typeof responseData !== "object") {
    return {
      leadsArray: empty,
      pagination: emptyPagination,
      summary: null,
      metrics: null,
    };
  }
  const rd = responseData as Record<string, unknown>;
  const leadsRaw = rd.data;
  const leadsArray = Array.isArray(leadsRaw) ? leadsRaw : empty;
  const paginationRaw = rd.pagination;
  const pagination =
    paginationRaw != null && typeof paginationRaw === "object"
      ? (paginationRaw as Record<string, any>)
      : emptyPagination;
  return {
    leadsArray,
    pagination,
    summary: rd.summary_tiles ?? null,
    metrics: rd.metrics ?? null,
  };
}

function extractLeadsExportChunkAndPagination(response: unknown): {
  chunk: unknown[];
  lastPage: number;
} {
  const chunk = (() => {
    if (response == null || typeof response !== "object") return [];
    const r = response as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as unknown[];
    const inner = r.data;
    if (inner != null && typeof inner === "object") {
      const rec = inner as Record<string, unknown>;
      if (Array.isArray(rec.data)) return rec.data;
      if (Array.isArray(inner)) return inner as unknown[];
    }
    return [];
  })();
  const pagination = (() => {
    if (response == null || typeof response !== "object") return {};
    const r = response as Record<string, unknown>;
    if (Array.isArray(r.data) && r.last_page != null) {
      return {
        last_page: r.last_page,
        total: r.total,
        current_page: r.current_page,
        per_page: r.per_page,
      } as Record<string, any>;
    }
    const inner = r.data;
    if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
      const rec = inner as Record<string, unknown>;
      if (rec.pagination != null && typeof rec.pagination === "object") {
        return rec.pagination as Record<string, any>;
      }
    }
    if (r.pagination != null && typeof r.pagination === "object") {
      return r.pagination as Record<string, any>;
    }
    return {} as Record<string, any>;
  })();
  const lastPage =
    typeof pagination.last_page === "number" ? pagination.last_page : 1;
  return { chunk, lastPage };
}

function leadRowPhoneFieldAsString(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return "";
}

function buildLeadRowPhoneDisplay(
  contactPerson: { phone?: string; phone_country_code?: string },
  lead: Record<string, unknown>,
): string {
  if (contactPerson.phone) {
    return `${contactPerson.phone_country_code || ""} ${contactPerson.phone}`.trim();
  }
  if (lead.contact_phone) {
    const code = leadRowPhoneFieldAsString(lead.contact_phone_country_code);
    const num = leadRowPhoneFieldAsString(lead.contact_phone);
    return `${code} ${num}`.trim();
  }
  return "";
}

function resolveLeadRowStageAndColor(lead: {
  is_lost?: boolean;
  stage?: { name?: string; color?: string };
  stage_id?: unknown;
}): { stage: string; stageColor: string } {
  if (lead.is_lost) {
    return { stage: "Lost", stageColor: "grey" };
  }
  return {
    stage: lead.stage?.name || (lead.stage_id ? "Unknown" : "New"),
    stageColor: lead.stage?.color || "grey",
  };
}

function leadPotentialToTableBadgeVariant(
  leadPotential: string | undefined,
): "danger" | "warning" | "secondary" {
  if (leadPotential === "Hot") return "danger";
  if (leadPotential === "Warm") return "warning";
  return "secondary";
}

/** Spacing between CRM bootstrap requests to reduce API burst / 429 rate-limit errors. */
const CRM_LEADS_BOOTSTRAP_STAGGER_MS = 100;

async function runQuietFetch<T>(
  label: string,
  load: () => Promise<T>,
  onSuccess: (data: T) => void,
): Promise<void> {
  try {
    const data = await load();
    onSuccess(data);
  } catch (error) {
    console.error(`Failed to fetch ${label}:`, error);
  }
}

function mapMeetingExtensionStringsToAttendeeOptions(
  meetingExtensionStrings: string[],
  extensions: readonly any[],
): { value: string | number; label: string }[] {
  if (meetingExtensionStrings.length === 0) return [];
  return extensions
    .filter((ext: any) => {
      const extExtension = String(ext.extension || "");
      const extId = String(ext.id || "");
      return meetingExtensionStrings.some(
        (meetingExt) => meetingExt === extExtension || meetingExt === extId,
      );
    })
    .map((ext: any) => ({
      value: ext.id || ext.extension,
      label: ext.display_name || ext.name || ext.id || ext.extension,
    }));
}

export function useCrmLeadsPageModel() {
  const { data: session } = useSession();
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterBusinessTypes, setFilterBusinessTypes] = useState<
    BusinessTypeData[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  const [leadMetrics, setLeadMetrics] = useState<Record<string, number> | null>(
    null,
  );
  const [tabTotals, setTabTotals] = useState<Record<string, number>>({
    all: 0,
    lost: 0,
    deleted: 0,
  });

  // UI State
  const [showLeadsAnalytics, setShowLeadsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [showLeadViewModal, setShowLeadViewModal] = useState(false);
  const [viewingLead, setViewingLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("general-info");
  const [loadingLead, setLoadingLead] = useState(false);
  const [showLeadHistoryModal, setShowLeadHistoryModal] = useState(false);

  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [editLeadIdForSidebar, setEditLeadIdForSidebar] = useState<
    number | null
  >(null);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [leadsViewMode, setLeadsViewMode] = useState<"table" | "board">("table");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  // Sidebar states
  const [showLeadSidebar, setShowLeadSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const [showConvertToDealModal, setShowConvertToDealModal] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<number | null>(null);
  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editFormStep, setEditFormStep] = useState(0);
  const [editFormData, setEditFormData] = useState({
    name: "",
    user_extension: null as number | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    source: "",
    company_name: "",
    industry_ids: [] as number[],
    business_type: "",
    company_country: "",
    company_province: "",
    company_city: "",
    company_location_other: "",
    company_size: "",
    stage_id: undefined as number | undefined,
    campaign_id: undefined as number | undefined,
    crm_data_id: undefined as number | undefined,
    lead_potential: "",
    campaign_field_values: {} as Record<string, any>,
    contact_persons: [
      {
        title: "",
        name: "",
        phone_country_code: "",
        phone: "",
        email: "",
      },
    ] as Array<{
      title: string;
      name: string;
      phone_country_code: string;
      phone: string;
      email: string;
    }>,
  });
  const [editStages, setEditStages] = useState<StageData[]>([]);
  const [editExtensions, setEditExtensions] = useState<any[]>([]);
  const [editCampaigns, setEditCampaigns] = useState<CampaignData[]>([]);
  const [editCrmData, setEditCrmData] = useState<CrmDataItem[]>([]);
  const [editSelectedCampaign, setEditSelectedCampaign] =
    useState<CampaignData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [editBusinessTypes, setEditBusinessTypes] = useState<
    BusinessTypeData[]
  >([]);
  const [editBusinessTypeId, setEditBusinessTypeId] = useState<number | null>(
    null,
  );
  const [editBusinessTypeOther, setEditBusinessTypeOther] =
    useState<string>("");
  const [editShowOtherBusinessType, setEditShowOtherBusinessType] =
    useState(false);
  const [editSelectedCountry, setEditSelectedCountry] = useState<{
    value: string;
    label: string;
    isoCode: string;
  } | null>(null);
  const [editSelectedState, setEditSelectedState] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [editSelectedCity, setEditSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const isEditInitialLoad = useRef(true);

  // Follow-up Modal
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followUpIdToEdit, setFollowUpIdToEdit] = useState<number | null>(null);
  const [followupData, setFollowupData] = useState({ ...DEFAULT_FOLLOWUP_FORM });
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  // Meeting Modal
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingIdToEdit, setMeetingIdToEdit] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState({ ...DEFAULT_MEETING_FORM });
  const [meetingAttendees, setMeetingAttendees] = useState<readonly any[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  // Change Stage Modal
  const [showChangeStageModal, setShowChangeStageModal] = useState(false);
  const [leadToChangeStage, setLeadToChangeStage] = useState<any>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [loadingChangeStage, setLoadingChangeStage] = useState(false);
  const [leadStages, setLeadStages] = useState<any[]>([]);

  const [selectedLeadsColumns, setSelectedLeadsColumns] = useState<string[]>(
    () => {
      const defaults = [
        "name",
        "company",
        "email",
        "phone",
        "stage",
        "leadPotential",
        "followUps",
        "assignedUser",
        "created",
      ];
      if (globalThis.window === undefined) {
        return defaults;
      }
      const stored = parseStoredVisibleColumnKeysLoose(
        globalThis.localStorage.getItem("leadsSelectedColumns"),
      );
      return stored ?? defaults;
    },
  );
  const [leadsPagination, setLeadsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [leadsFilters, setLeadsFilters] = useState({
    assignedTo: null as string | null,
    stage: null as string | null,
    businessType: null as string | null,
    source: null as string | null,
    leadPotential: null as string | null,
    campaign: null as string | null,
    lostReason: null as string | null,
    leadScoreMin: null as string | null,
    leadScoreMax: null as string | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
  });

  const { contactEmail, contactPhone } = useMemo(() => {
    if (!selectedLead) return { contactEmail: "", contactPhone: "" };
    const raw = selectedLead?.contact_persons;
    let contactPersons: any[] = [];
    if (Array.isArray(raw)) {
      contactPersons = raw;
    } else if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        contactPersons = Array.isArray(parsed) ? parsed : [];
      } catch {
        contactPersons = [];
      }
    }
    const contactEmail = contactPersons
      .map((person: any) => person.email?.trim())
      .filter(Boolean)
      .join(", ");
    const contactPhone = contactPersons
      .map((person: any) => {
        const code = person.phone_country_code?.trim() || "";
        const num = person.phone?.trim() || "";
        return code && num ? `${code} ${num}`.trim() : num || "";
      })
      .filter(Boolean)
      .join(", ");
    return {
      contactEmail,
      contactPhone,
    };
  }, [selectedLead]);

  const fetchFilterBusinessTypes = async () => {
    try {
      const res = await getBusinessTypes({ per_page: 1000 });
      setFilterBusinessTypes(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch business types:", error);
    }
  };

  const buildLeadsParams = useCallback(
    (
      filters: Record<string, any>,
      page = 1,
      perPage = 15,
      search = "",
      includeSort = true,
    ) => {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (filters.search) {
        params.search = filters.search;
      } else if (search) {
        params.search = search;
      }

      const truthyFilterKeys = [
        "stage_id",
        "user_extension_filter",
        "business_type_id",
        "source",
        "lead_potential",
        "campaign_id",
        "lost_reason_id",
        "lead_score_min",
        "lead_score_max",
        "date_from",
        "date_to",
      ] as const;
      truthyFilterKeys.forEach((key) => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const definedFilterKeys = ["is_lost", "include_lost", "include_archived"] as const;
      definedFilterKeys.forEach((key) => {
        if (filters[key] !== undefined) {
          params[key] = filters[key];
        }
      });

      if (includeSort && leadsPagination.sortBy) {
        params.sort_by = leadsPagination.sortBy;
        params.sort_order = leadsPagination.sortOrder;
      }

      return params;
    },
    [leadsPagination.sortBy, leadsPagination.sortOrder],
  );

  const getLeadsTotalFromResponse = useCallback((response: any): number => {
    return Number(response?.data?.pagination?.total) || 0;
  }, []);

  // Fetch leads when filters or search change
  const fetchLeads = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      setLoading(true);
      try {
        const params = buildLeadsParams(currentFilters, page, perPage, search, true);

        const response = await getLeads(params);
        console.log("Raw response from getLeads:", response);

        const {
          leadsArray: leadsArrayRaw,
          pagination,
          summary,
          metrics: metricsFromApi,
        } = parseLeadsListApiEnvelope(response);
        const leadsArray = leadsArrayRaw;

        // Set leads data, total, and summary tiles
        setLeadsData(Array.isArray(leadsArray) ? leadsArray : []);
        setTotalLeads(
          pagination?.total ||
            (Array.isArray(leadsArray) ? leadsArray.length : 0) ||
            0,
        );
        setSummaryTiles(summary);
        setLeadMetrics(metricsFromApi);

        // Transform to GenericListPage expected format
        const transformedData = {
          dataList: Array.isArray(leadsArray) ? leadsArray : [],
          meta: {
            total:
              pagination?.total ||
              (Array.isArray(leadsArray) ? leadsArray.length : 0) ||
              0,
            current_page: pagination?.current_page || page,
            per_page: pagination?.per_page || perPage,
            last_page: pagination?.last_page || 1,
          },
        };
        console.log("Transformed data:", transformedData);
        return transformedData;
      } finally {
        setLoading(false);
      }
    },
    [
      buildLeadsParams,
      currentFilters,
    ],
  );

  // Handle activeFilter changes to update currentFilters and stage dropdown
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        delete newFilters.include_lost;
        return newFilters;
      });
      // Clear stage dropdown
      setLeadsFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter === "lost") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        newFilters.include_lost = true;
        return newFilters;
      });
      // Clear stage dropdown
      setLeadsFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter === "deleted") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_lost;
        newFilters.include_archived = true;
        return newFilters;
      });
      // Clear stage dropdown
      setLeadsFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter && stages.length > 0) {
      // Find stage by id (activeFilter should be stage id as string)
      const selectedStage = stages.find(
        (s: any) => s.id.toString() === activeFilter,
      );
      if (selectedStage) {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.include_archived;
          delete newFilters.include_lost;
          newFilters.stage_id = selectedStage.id.toString();
          return newFilters;
        });
        // Auto-fill stage dropdown
        setLeadsFilters((prev) => ({
          ...prev,
          stage: selectedStage.id.toString(),
        }));
      }
    }
  }, [activeFilter, stages]);

  const leadsTabValidFilters = useMemo(
    () => ["all", "lost", "deleted", ...stages.map((s: any) => String(s.id))],
    [stages],
  );

  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (!router.isReady) return;
    const tab = resolveTabFilterFromUrlQuery(
      router.query.tab,
      leadsTabValidFilters,
    );
    if (tab != null) {
      setActiveFilter((prev) => (prev === tab ? prev : tab));
    }
  }, [router.isReady, router.query.tab, leadsTabValidFilters]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      // Update active tab immediately to avoid visual lag
      setActiveFilter(filterId);
      setLeadsPagination((prev) => ({ ...prev, currentPage: 1 }));
      router.push(
        buildShallowTabFilterPushArgs(router.pathname, router.query, filterId),
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const tabTotalsBaseFilters = useMemo(() => {
    const baseFilters = { ...currentFilters };
    delete baseFilters.stage_id;
    delete baseFilters.include_lost;
    delete baseFilters.include_archived;
    return baseFilters;
  }, [currentFilters]);

  const tabTotalsRequestKey = useMemo(
    () =>
      JSON.stringify({
        filters: tabTotalsBaseFilters,
        stageIds: stages.map((stage: any) => stage.id),
      }),
    [stages, tabTotalsBaseFilters],
  );
  const lastTabTotalsRequestKeyRef = useRef<string>("");

  const fetchTabTotals = useCallback(
    async (baseFilters: Record<string, any>) => {
      try {
        const [allResp, lostResp, deletedResp, ...stageResponses] = await Promise.all([
          getLeads(buildLeadsParams(baseFilters, 1, 1, "", false)),
          getLeads(buildLeadsParams({ ...baseFilters, include_lost: true }, 1, 1, "", false)),
          getLeads(buildLeadsParams({ ...baseFilters, include_archived: true }, 1, 1, "", false)),
          ...stages.map((stage: any) =>
            getLeads(buildLeadsParams({ ...baseFilters, stage_id: stage.id }, 1, 1, "", false)),
          ),
        ]);

        const nextTotals: Record<string, number> = {
          all: getLeadsTotalFromResponse(allResp),
          lost: getLeadsTotalFromResponse(lostResp),
          deleted: getLeadsTotalFromResponse(deletedResp),
        };

        stages.forEach((stage: any, index) => {
          nextTotals[stage.id] = getLeadsTotalFromResponse(stageResponses[index]);
        });

        setTabTotals(nextTotals);
      } catch (error) {
        console.error("Failed to fetch lead tab totals:", error);
      }
    },
    [buildLeadsParams, getLeadsTotalFromResponse, stages],
  );

  useEffect(() => {
    fetchLeads(
      leadsPagination.currentPage,
      leadsPagination.rowsPerPage,
      leadsSearch,
    );
  }, [
    refreshKey,
    currentFilters,
    leadsPagination.currentPage,
    leadsPagination.rowsPerPage,
    fetchLeads,
  ]);

  useEffect(() => {
    if (lastTabTotalsRequestKeyRef.current === tabTotalsRequestKey) {
      return;
    }
    lastTabTotalsRequestKeyRef.current = tabTotalsRequestKey;
    fetchTabTotals(tabTotalsBaseFilters).catch((error) => {
      console.error("Failed to fetch tab totals:", error);
    });
  }, [fetchTabTotals, tabTotalsBaseFilters, tabTotalsRequestKey]);

  // Initialize export filters when export modal opens
  useEffect(() => {
    if (showExportModal) {
      setExportFilters({ ...currentFilters });
      setExportFileName(`leads_${moment().format("YYYY-MM-DD")}`);
    }
  }, [showExportModal, currentFilters]);

  // Sync leadsFilters from currentFilters when filter sidebar opens (show selected state)
  useEffect(() => {
    if (showFiltersSidebar) {
      setLeadsFilters((prev) => ({
        ...prev,
        assignedTo:
          currentFilters.user_extension_filter ?? currentFilters.assigned_to ?? null,
        stage: currentFilters.stage_id ?? null,
        businessType: currentFilters.business_type_id ?? null,
        source: currentFilters.source ?? null,
        leadPotential: currentFilters.lead_potential ?? null,
        campaign: currentFilters.campaign_id ?? null,
        lostReason: currentFilters.lost_reason_id ?? null,
        leadScoreMin: currentFilters.lead_score_min ?? null,
        leadScoreMax: currentFilters.lead_score_max ?? null,
        dateFrom: currentFilters.date_from ?? null,
        dateTo: currentFilters.date_to ?? null,
      }));
      setLeadsSearch(currentFilters.search ?? "");
    }
  }, [showFiltersSidebar]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => applyCrmFilterRules(prev, filters, LEADS_FILTER_RULES));
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Build API params from filters for export (Leads list API accepted params)
  const buildLeadsExportParams = useCallback(
    (filters: Record<string, any>, pagination?: { page: number; per_page: number }) => {
      const params: Record<string, any> = {};

      const ownerFilter = filters.user_extension_filter ?? filters.assigned_to;
      if (ownerFilter) {
        params.user_extension_filter = Array.isArray(ownerFilter)
          ? ownerFilter
          : [ownerFilter];
      }

      addTruthyExportFilters(params, filters, LEADS_EXPORT_TRUTHY_KEYS);
      addDefinedExportFilters(params, filters, LEADS_EXPORT_DEFINED_KEYS);
      addPresentExportFilters(params, filters, LEADS_EXPORT_PRESENT_KEYS);

      if (pagination) {
        params.page = pagination.page;
        params.per_page = pagination.per_page;
      }
      return params;
    },
    [],
  );

  const fetchLeadsForExport = useCallback(
    async (filters: Record<string, any>) => {
      const PER_PAGE = 100;
      let page = 1;
      const allData: any[] = [];
      for (;;) {
        const response = await getLeads(
          buildLeadsExportParams(filters, { page, per_page: PER_PAGE }),
        );
        const { chunk, lastPage } = extractLeadsExportChunkAndPagination(response);
        allData.push(...chunk);
        if (page >= lastPage || chunk.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [buildLeadsExportParams],
  );

  const handleLeadsExport = useCallback(async () => {
    const name =
      exportFileName.trim() || `leads_${moment().format("YYYY-MM-DD")}`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const allData = await fetchLeadsForExport(exportFilters);
      if (allData.length === 0) {
        toast.info("No leads match the selected filters.");
        return;
      }
      const csvText = buildLeadsListExportCsvText(allData);
      const blob = new Blob([csvText], {
        type: "text/csv;charset=utf-8;",
      });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      globalThis.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} leads successfully!`);
    } catch (err) {
      console.error("Leads export failed:", err);
      toast.error("Failed to export leads");
    } finally {
      setExporting(false);
    }
  }, [exportFileName, exportFilters, fetchLeadsForExport]);

  const [leadFollowUps, setLeadFollowUps] = useState<any[]>([]);
  const [loadingLeadFollowUps, setLoadingLeadFollowUps] = useState(false);
  const fetchLeadFollowUps = useCallback(async (leadId: number) => {
    try {
      setLoadingLeadFollowUps(true);
      const leadFollowUps = await getLeadFollowUps(leadId);
      setLeadFollowUps(leadFollowUps || ([] as any));
      console.log("leadFollowUps", leadFollowUps);
    } catch (error) {
      console.error("Failed to fetch lead follow-ups:", error);
    } finally {
      setLoadingLeadFollowUps(false);
    }
  }, []);

  const [leadMeetings, setLeadMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const fetchMeetings = useCallback(async (leadId: number) => {
    try {
      setLoadingMeetings(true);
      const meetings = await getMeetings({ lead_id: leadId });
      console.log("meetings", meetings);
      setLeadMeetings(meetings?.data || []);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  const handleRowClicked = useCallback(
    async (leadId: number) => {
      try {
        const leadData: any = await getLead(leadId);
        await fetchLeadFollowUps(leadId);
        await fetchMeetings(leadId);
        setSelectedLead(leadData);
        setShowLeadSidebar(true);
      } catch (error) {
        console.error("Failed to fetch lead:", error);
        toast.error("Failed to load lead details");
      }
    },
    [fetchLeadFollowUps, fetchMeetings],
  );

  // Handle preview button click - shows sidebar (persistence wrapper below)
  const handlePreviewClickBase = useCallback(
    async (lead: LeadData) => {
      const leadId = lead.rawData?.id || lead.id;
      // Set the lead immediately to show sidebar
      setSelectedLead(lead.rawData || lead);
      setShowLeadSidebar(true);

      // Fetch additional data (follow-ups, meetings) in the background
      if (leadId) {
        try {
          await fetchLeadFollowUps(leadId);
          await fetchMeetings(leadId);
          // Optionally refresh the lead data to get latest info
          const leadData: any = await getLead(leadId);
          setSelectedLead(leadData);
        } catch (error) {
          console.error("Failed to fetch lead details:", error);
          // Don't show error toast as sidebar is already open with basic data
        }
      }
    },
    [fetchLeadFollowUps, fetchMeetings],
  );

  const openLeadPreviewById = useCallback(
    (id: number) => {
      handlePreviewClickBase({
        id,
        name: "",
        email: "",
        phone: "",
        company: "",
        industry: "",
        stage: "",
        stageColor: "",
        leadPotential: "",
        lead_score: 0,
        assignedUser: "",
        created: "",
        lastActivity: "",
        followUps: [],
        meetings: [],
        source: "",
        campaign: "",
        isLost: false,
        rawData: { id },
      } as LeadData).catch((error: unknown) => {
        console.error("openLeadPreviewById:", error);
      });
    },
    [handlePreviewClickBase],
  );

  const { writePreviewIdToStorage, clearPreviewIdFromStorage } =
    useCrmListPreviewPersistence({
      localStorageKey: "crm-leads-list-preview-record-id",
      listLoading: !isInitialized || loading,
      openPreviewByNumericId: openLeadPreviewById,
      enableRestore: false,
    });

  const handlePreviewClick = useCallback(
    async (lead: LeadData) => {
      const leadId = lead.rawData?.id || lead.id;
      if (leadId) writePreviewIdToStorage(Number(leadId));
      await handlePreviewClickBase(lead);
    },
    [handlePreviewClickBase, writePreviewIdToStorage],
  );

  // Handle first column click - navigates to detail page with lead ID in URL (same as prospect)
  const handleFirstColumnClick = useCallback(
    (lead: LeadData) => {
      const leadId = lead?.rawData?.id ?? lead?.id ?? "";
      router.push(`/crm/detailspage?type=lead&id=${leadId}`);
    },
    [router],
  );

  const fetchStages = async () => {
    await runQuietFetch("stages", () => getStages("lead"), (stagesData) =>
      setStages(stagesData || []),
    );
  };

  const fetchLostReasons = async () => {
    await runQuietFetch(
      "lost reasons",
      () => (getStages as (slug: string) => Promise<any[]>)("lost_reason"),
      (lostReasonsData) => setLostReasons(lostReasonsData || []),
    );
  };

  const fetchExtensions = async (moduleSlug: string = ModuleSlug.CRM_LEADS) => {
    await runQuietFetch(
      "extensions",
      () => GetHierarchyData(moduleSlug),
      (hierarchyData) => {
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      },
    );
  };

  const fetchCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns({
        per_page: 1000,
        module_slug: ModuleSlug.CRM_CAMPAIGNS,
        filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
      });
      setCampaigns(campaignsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  // Reference data: run sequentially with small gaps to avoid bursting the API (5 parallel calls → 429).
  useEffect(() => {
    let cancelled = false;
    const stagger = () =>
      new Promise<void>((resolve) =>
        setTimeout(resolve, CRM_LEADS_BOOTSTRAP_STAGGER_MS),
      );

    void (async () => {
      await fetchStages();
      if (cancelled) return;
      await stagger();
      await fetchLostReasons();
      if (cancelled) return;
      await stagger();
      await fetchExtensions(ModuleSlug.CRM_LEADS);
      if (cancelled) return;
      await stagger();
      await fetchCampaigns();
      if (cancelled) return;
      await stagger();
      await fetchFilterBusinessTypes();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Transform API lead data to UI format
  const transformLeadData = (lead: any): LeadData => {
    // Parse contact_persons - it can be a JSON string or an array
    let contactPersonsArray: any[] = [];
    if (lead.contact_persons) {
      if (typeof lead.contact_persons === "string") {
        try {
          contactPersonsArray = JSON.parse(lead.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          contactPersonsArray = [];
        }
      } else if (Array.isArray(lead.contact_persons)) {
        contactPersonsArray = lead.contact_persons;
      }
    }

    // Get first available contact person
    const contactPerson =
      contactPersonsArray.find((cp) => cp.email || cp.phone) ||
      contactPersonsArray[0] ||
      {};

    // Use contact person data if available, otherwise fall back to top-level fields
    const email = contactPerson.email || "";
    const phone = buildLeadRowPhoneDisplay(contactPerson, lead);

    const { stage: stageLabel, stageColor } = resolveLeadRowStageAndColor(lead);

    return {
      id: lead.id,
      name: lead.name || "",
      email: email,
      phone: phone,
      company: lead.company_name || "",
      industry: lead.industry || "",
      stage: stageLabel,
      stageColor,
      leadPotential: lead?.lead_potential || "Not Set",
      lead_score: lead?.stage?.score || 0,
      assignedUser:
        extensions.find(
          (ext: any) =>
            ext?.id == lead?.user_extension ||
            ext?.extension == lead?.user_extension,
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == lead?.user_extension ||
            ext?.extension == lead?.user_extension,
        )?.name ||
        lead.user_extension ||
        "",
      created: formatDateForTable(lead.created_at),
      lastActivity: formatDateForTable(lead.last_activity_at),
      followUps: lead.follow_ups || [],
      followUpDate: lead.follow_up_date || null,
      meetings: lead.meetings || [],
      source: lead.source || "",
      campaign: lead.campaign?.name || "",
      isLost: lead.is_lost || false,
      lostReasonName: lead.is_lost ? lead.stage?.name || "" : "",
      rawData: lead, // Keep original data for actions
    };
  };

  // Delete Lead Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  // Delete Follow-up Modal
  const [showDeleteFollowUpModal, setShowDeleteFollowUpModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<{
    leadId: number;
    followUpId: number;
    leadName?: string;
  } | null>(null);

  // Delete Meeting Modal
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{
    meetingId: number;
    meetingName?: string;
    leadId?: number;
  } | null>(null);

  // Handle call button click
  const handleCallClick = useCallback(
    async (lead: any) => {
      const phone = lead?.contact_persons?.[0]?.phone || lead?.crm_data?.phone;
      if (!phone) {
        toast.error("No phone number available for this entry");
        return;
      }

      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }

      try {
        await dialNumber(phone);
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  /** Sidebar Call button: when completePhone is passed, dial via CTI (same as dialer API) */
  const handleSidebarCall = useCallback(
    async (phone?: string) => {
      if (!phone?.trim()) {
        toast.error("No phone number available to call");
        return;
      }
      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }
      try {
        const result = await dialNumber(phone.trim());
        if (!result.success) {
          toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  // Helper function to get name by extension
  function getNameByExtension(extension: string) {
    const extensionData = extensions.find(
      (ext) => ext.id === extension || ext.extension === extension,
    );
    return extensionData?.display_name || extensionData?.name || extension;
  }

  const sidebarLeadRecordId = useMemo(() => {
    const rawId = selectedLead?.id ?? selectedLead?.rawData?.id;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : 0;
  }, [selectedLead]);
  const sidebarLeadRecordName = selectedLead?.name ?? "";
  const sidebarLeadRecordPhone =
    selectedLead?.phone ?? selectedLead?.rawData?.phone ?? "";
  const sidebarLeadRecordEmail =
    selectedLead?.email ?? selectedLead?.rawData?.email ?? "";

  const sidebarLogActivityModals = useCrmLogActivityModals({
    recordType: "lead",
    recordId: sidebarLeadRecordId,
    recordName: sidebarLeadRecordName,
    recordPhone: sidebarLeadRecordPhone,
    recordEmail: sidebarLeadRecordEmail,
  });

  // Handle note creation
  const handleNoteCreate = useCallback(
    (note: string, createTask: boolean, taskDueDate?: string) => {
      console.log("Note created:", {
        leadId: selectedLead?.id || selectedLead?.rawData?.id,
        note,
        createTask,
        taskDueDate,
      });

      toast.success(
        `Note saved successfully!${createTask ? " Task created." : ""}`,
      );
    },
    [selectedLead],
  );

  // Handle close lead sidebar (X): clear persisted preview id
  const handleCloseLeadSidebar = useCallback(() => {
    setShowLeadSidebar(false);
    setSelectedLead(null);
    clearPreviewIdFromStorage();
  }, [clearPreviewIdFromStorage]);

  /** Hide sidebar when navigating to detail so browser back can restore preview. */
  const handleHideLeadSidebarKeepPersistence = useCallback(() => {
    setShowLeadSidebar(false);
    setSelectedLead(null);
  }, []);

  const handleDeleteLead = useCallback((leadId: number, leadName?: string) => {
    setLeadToDelete({ id: leadId, name: leadName });
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteLead = useCallback(async () => {
    if (!leadToDelete) return;

    try {
      await deleteLead(leadToDelete.id);
      setShowDeleteModal(false);
      setLeadToDelete(null);
      // Refresh the list
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Deleted");
      setSuccessModalDescription("Lead has been deleted successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  }, [leadToDelete]);

  // Restore Lead Handler
  const handleRestoreLead = useCallback(async (leadId: number) => {
    if (!globalThis.confirm("Are you sure you want to restore this lead?")) return;

    try {
      await restoreLead(leadId);
      toast.success("Lead restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Restored");
      setSuccessModalDescription("Lead has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to restore lead:", error);
      toast.error("Failed to restore lead");
    }
  }, []);

  // Convert Lead Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any>(null);
  const [convertFormData, setConvertFormData] = useState({
    opportunity_name: "",
    value: "",
    probability: "",
    expected_close_date: "",
    description: "",
  });
  const handleConvertLead = useCallback((lead: any) => {
    router.push(`/crm/deals/create?lead_id=${lead.id}`);
  }, [router]);

  const handleConvertSubmit = useCallback(async () => {
    if (!leadToConvert) return;

    try {
      await convertLead(leadToConvert.id);
      setShowConvertModal(false);
      setLeadToConvert(null);
      setConvertFormData({
        opportunity_name: "",
        value: "",
        probability: "",
        expected_close_date: "",
        description: "",
      });
      toast.success("Lead converted successfully!");
      globalThis.location.reload();
    } catch (error) {
      console.error("Failed to convert lead:", error);
    }
  }, [leadToConvert, convertFormData]);

  // Mark Lead Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [leadToMarkLost, setLeadToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  const handleMarkLost = useCallback((lead: any) => {
    setLeadToMarkLost(lead);
    setShowMarkLostModal(true);
  }, []);

  // Handle change stage
  const handleChangeStage = useCallback(async (lead: any) => {
    setLeadToChangeStage(lead);
    setSelectedStageId(lead.stage_id || null);
    try {
      // Fetch only lead stages
      const stagesData = await getStages("lead");
      setLeadStages(stagesData || []);
      setShowChangeStageModal(true);
    } catch (error) {
      console.error("Failed to fetch lead stages:", error);
      toast.error("Failed to load lead stages");
    }
  }, []);

  const handleChangeStageSubmit = useCallback(async () => {
    if (!leadToChangeStage || !selectedStageId) return;

    try {
      setLoadingChangeStage(true);
      await updateLead(leadToChangeStage.id, {
        stage_id: selectedStageId,
      });
      setShowChangeStageModal(false);
      setLeadToChangeStage(null);
      setSelectedStageId(null);
      toast.success("Lead stage updated successfully!");
      // Refresh the list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to update lead stage:", error);
      toast.error("Failed to update lead stage");
    } finally {
      setLoadingChangeStage(false);
    }
  }, [leadToChangeStage, selectedStageId]);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Call recording playback (matches prospects sidebar behaviour)
  const [showRecordingPlayerModal, setShowRecordingPlayerModal] =
    useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const handlePlayCallRecording = useCallback((recording: any) => {
    setSelectedRecording(recording);
    setShowRecordingPlayerModal(true);
  }, []);
  const handleCloseRecordingPlayerModal = useCallback(() => {
    setShowRecordingPlayerModal(false);
    setSelectedRecording(null);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!leadToMarkLost || !lostReasonId || !lostFeedback.trim()) return;

    try {
      await markLeadLost(leadToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setLeadToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Lead marked as lost!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Marked as Lost");
      setSuccessModalDescription("Lead has been marked as lost successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark lead as lost:", error);
    }
  }, [leadToMarkLost, lostReasonId, lostFeedback]);

  // Handle view lead - open GenericSidebar only (no modal)
  const handleViewLead = useCallback(async (leadId: number) => {
    setLoadingLead(true);
    try {
      const leadData: any = await getLead(leadId);

      // Parse contact_persons if it's a string
      if (
        leadData.contact_persons &&
        typeof leadData.contact_persons === "string"
      ) {
        try {
          leadData.contact_persons = JSON.parse(leadData.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          leadData.contact_persons = [];
        }
      }

      const leadWithStage = {
        ...leadData,
        stage: leadData.is_lost
          ? { ...leadData.stage, name: "Lost" }
          : leadData.stage,
      };
      setViewingLead(leadWithStage);
      setSelectedLead(leadWithStage);
      setShowLeadSidebar(true);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      toast.error("Failed to load lead details");
    } finally {
      setLoadingLead(false);
    }
  }, []);

  // Handle edit lead - open same sidebar as Create Lead with prefilled data
  const handleEditLead = useCallback((leadId: number) => {
    setEditLeadIdForSidebar(leadId);
    setShowCreateLeadModal(true);
  }, []);

  // Edit Modal Helper Functions
  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCampaignChange = async (campaignId: number | undefined) => {
    handleEditInputChange("campaign_id", campaignId);

    if (!campaignId) {
      setEditSelectedCampaign(null);
      handleEditInputChange("campaign_field_values", {});
      return;
    }

    try {
      const campaign = await getCampaignById(campaignId);
      setEditSelectedCampaign(campaign);

      // Pre-fill fields from campaign
      if (!isEditInitialLoad.current) {
        if ((campaign as any).company_name) {
          handleEditInputChange("company_name", (campaign as any).company_name);
        }
        if ((campaign as any).source) {
          handleEditInputChange("source", (campaign as any).source);
        }
        if ((campaign as any).stage_id) {
          handleEditInputChange("stage_id", Number((campaign as any).stage_id));
        }
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    }
  };

  const handleEditCampaignFieldChange = (fieldKey: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      campaign_field_values: {
        ...prev.campaign_field_values,
        [fieldKey]: value,
      },
    }));
  };

  const addEditContactPerson = () => {
    setEditFormData((prev) => ({
      ...prev,
      contact_persons: [
        ...prev.contact_persons,
        {
          title: "",
          name: "",
          phone_country_code: "",
          phone: "",
          email: "",
        },
      ],
    }));
  };

  const removeEditContactPerson = (index: number) => {
    if (editFormData.contact_persons.length <= 1) {
      toast.error("At least one contact person is required");
      return;
    }
    setEditFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index),
    }));
  };

  const updateEditContactPerson = (
    index: number,
    field: string,
    value: any,
  ) => {
    setEditFormData((prev) => {
      const updated = [...prev.contact_persons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contact_persons: updated };
    });
  };

  const handleEditCountryChange = (selected: any) => {
    setEditSelectedCountry(selected);
    setEditSelectedState(null);
    setEditSelectedCity(null);
    handleEditInputChange("company_country", selected?.label || "");
    handleEditInputChange("company_province", "");
    handleEditInputChange("company_city", "");
  };

  const handleEditStateChange = (selected: any) => {
    setEditSelectedState(selected);
    setEditSelectedCity(null);
    handleEditInputChange("company_province", selected?.label || "");
    handleEditInputChange("company_city", "");
  };

  const handleEditCityChange = (selected: any) => {
    setEditSelectedCity(selected);
    handleEditInputChange("company_city", selected?.label || "");
  };

  const validateEditStep0 = (): boolean => {
    if (!editFormData.name?.trim()) {
      toast.error("Lead name is required");
      return false;
    }
    if (editFormData.user_extension == null || !editFormData.user_extension) {
      toast.error("Assigned To is required");
      return false;
    }
    if (!editFormData.stage_id) {
      toast.error("Stage is required");
      return false;
    }
    return true;
  };

  const validateEditStep1 = (): boolean => {
    if (!editFormData.company_name?.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (editShowOtherBusinessType && !editBusinessTypeOther?.trim()) {
      toast.error("Please specify the business type");
      return false;
    }
    if (!editShowOtherBusinessType && !editBusinessTypeId) {
      toast.error("Business type is required");
      return false;
    }
    return true;
  };

  const validateEditStep2 = (): boolean => {
    const err = getContactPersonsValidationError(editFormData.contact_persons);
    if (err) {
      toast.error(err);
      return false;
    }
    return true;
  };

  const validateEditStep3 = (): boolean => {
    if ((editSelectedCampaign as any)?.custom_fields) {
      for (const field of (editSelectedCampaign as any).custom_fields) {
        if (
          field.required &&
          !editFormData.campaign_field_values?.[field.field_key]
        ) {
          toast.error(`${field.field_name} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleEditNextStep = () => {
    let isValid = false;
    switch (editFormStep) {
      case 0:
        isValid = validateEditStep0();
        break;
      case 1:
        isValid = validateEditStep1();
        break;
      case 2:
        isValid = validateEditStep2();
        break;
      case 3:
        isValid = validateEditStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid && editFormStep < 3) {
      setEditFormStep((prev) => prev + 1);
    }
  };

  const handleEditSubmit = async () => {
    // Validate all steps
    if (
      !validateEditStep0() ||
      !validateEditStep1() ||
      !validateEditStep2() ||
      !validateEditStep3()
    ) {
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = {
        name: editFormData.name,
        user_extension:
          String(editFormData.user_extension) ||
          String((session?.user as any)?.extension) ||
          "admin",
        type: editFormData.type,
        description: editFormData.description,
        source: editFormData.source,
        company_name: editFormData.company_name,
        industry_ids: editFormData.industry_ids,
        company_country: editFormData.company_country,
        company_province: editFormData.company_province,
        company_city: editFormData.company_city,
        company_location_other: editFormData.company_location_other,
        company_size: editFormData.company_size,
        stage_id: editFormData.stage_id,
        campaign_id: editFormData.campaign_id,
        crm_data_id: editFormData.crm_data_id,
        lead_potential: editFormData.lead_potential,
        campaign_field_values: editFormData.campaign_field_values,
        contact_persons: editFormData.contact_persons,
      };

      // Handle business type
      if (editShowOtherBusinessType) {
        payload.business_type_id = null;
        payload.business_type_other = editBusinessTypeOther;
      } else {
        payload.business_type_id = editBusinessTypeId;
        payload.business_type_other = null;
      }

      if (editingLead?.id) {
        await updateLead(editingLead.id, payload);
        toast.success("Lead updated successfully");
        setShowEditModal(false);
        fetchLeads(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Failed to update lead:", error);
      toast.error(error.message || "Failed to update lead");
    } finally {
      setEditLoading(false);
    }
  };

  const resetFollowupForm = useCallback(() => {
    setShowAddFollowupModal(false);
    setFollowUpIdToEdit(null);
    setFollowupData({ ...DEFAULT_FOLLOWUP_FORM });
  }, []);

  const validateFollowUpForm = useCallback(() => {
    const isValid = checkRequiredFields(followupData, [
      { field: "leadId", name: "Lead" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);
    if (
      followupData.communicationChannel === "Other" &&
      !followupData.communicationChannelOther?.trim()
    ) {
      toast.error("Please specify the communication channel");
      return false;
    }
    return isValid;
  }, [followupData]);

  const buildFollowUpPayload = useCallback(() => {
    const payload: any = {
      follow_up_date: followupData.followUpDate,
      follow_up_status: followupData.followUpStatus,
      communication_channel: followupData.communicationChannel,
      notes: followupData.notes,
      user_extension:
        followupData.userExtension || (session?.user as any)?.extension || "admin",
    };
    if (
      followupData.communicationChannel === "Other" &&
      followupData.communicationChannelOther
    ) {
      payload.communication_channel_other = followupData.communicationChannelOther;
    }
    return payload;
  }, [followupData, session]);

  const submitFollowUp = useCallback(
    async (mode: "create" | "update") => {
      if (!validateFollowUpForm()) return;
      const followUpId = followUpIdToEdit;
      if (mode === "update" && !followUpId) return;
      if (!followupData.leadId) return;

      setLoadingFollowUp(true);
      try {
        const payload = buildFollowUpPayload();
        if (mode === "create") {
          await createLeadFollowUp(followupData.leadId, payload);
        } else {
          if (!followUpId) return;
          await updateLeadFollowUp(followupData.leadId, followUpId, payload);
        }
        await handleRowClicked(followupData.leadId);
        resetFollowupForm();
      } catch (error) {
        console.error(`Failed to ${mode} follow-up:`, error);
      } finally {
        setLoadingFollowUp(false);
      }
    },
    [
      validateFollowUpForm,
      followUpIdToEdit,
      followupData.leadId,
      buildFollowUpPayload,
      handleRowClicked,
      resetFollowupForm,
    ],
  );

  const submitFollowUpFromModal = useCallback(async () => {
    await submitFollowUp(followUpIdToEdit ? "update" : "create");
  }, [submitFollowUp, followUpIdToEdit]);

  // Handle edit follow-up click
  const handleEditFollowUp = useCallback(
    (followUp: any) => {
      const followUpDate = toIsoDateInputValueFromDbField(
        followUp.follow_up_date,
      );

      setFollowUpIdToEdit(followUp.id);
      setFollowupData({
        leadId: viewingLead?.id || null,
        leadName: viewingLead?.name || "",
        followUpDate: followUpDate,
        followUpStatus: followUp.follow_up_status || "Pending",
        communicationChannel: followUp.communication_channel || "Phone Call",
        communicationChannelOther: followUp.communication_channel_other || "",
        notes: followUp.notes || "",
        userExtension:
          followUp.user_extension ||
          (session?.user as any)?.extension ||
          "admin",
      });
      setShowAddFollowupModal(true);
    },
    [viewingLead, session],
  );

  // Handle follow-up deletion
  const handleDeleteFollowUp = useCallback(
    (leadId: number, followUpId: number, leadName?: string) => {
      setFollowUpToDelete({ leadId, followUpId, leadName });
      setShowDeleteFollowUpModal(true);
    },
    [],
  );

  const confirmDeleteFollowUp = useCallback(async () => {
    if (!followUpToDelete) return;

    try {
      await deleteLeadFollowUp(
        followUpToDelete.leadId,
        followUpToDelete.followUpId,
      );

      // Refresh lead data
      if (viewingLead?.id === followUpToDelete.leadId) {
        await handleViewLead(followUpToDelete.leadId);
      }

      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);

      setShowDeleteFollowUpModal(false);
      setFollowUpToDelete(null);
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
      toast.error("Failed to delete follow-up");
    }
  }, [followUpToDelete, viewingLead, handleViewLead]);

  const resetMeetingForm = useCallback(() => {
    setShowAddMeetingModal(false);
    setMeetingIdToEdit(null);
    setMeetingData({ ...DEFAULT_MEETING_FORM });
    setMeetingAttendees([]);
  }, []);

  const buildMeetingPayload = useCallback(
    (mode: "create" | "update") => {
      const extensions =
        meetingAttendees.length > 0
          ? meetingAttendees.map((user: any) => user.value)
          : [];

      if (extensions.length === 0 && mode === "create") {
        extensions.push((session?.user as any)?.extension || "admin");
      }

      const utcMeeting = convertLocalMeetingToUtc(
        String(meetingData.meetingDate || "").slice(0, 10),
        String(meetingData.meetingTime || "").slice(0, 5),
      );
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: utcMeeting.utcDate || meetingData.meetingDate,
        meeting_time: utcMeeting.utcTime || meetingData.meetingTime,
        ...(utcMeeting.utcIso && { start_date_time: utcMeeting.utcIso }),
        extensions,
      };

      if (mode === "create") {
        payload.lead_id = String(meetingData.leadId);
        payload.meeting_outcome = "Scheduled";
      } else if (meetingData.meetingOutcome) {
        payload.meeting_outcome = meetingData.meetingOutcome;
      }

      return payload;
    },
    [meetingData, meetingAttendees, session],
  );

  const submitMeeting = useCallback(
    async (mode: "create" | "update") => {
      const hasRequiredData =
        mode === "create"
          ? Boolean(
              meetingData.leadId &&
                meetingData.meetingName &&
                meetingData.meetingDate &&
                meetingData.meetingTime,
            )
          : Boolean(
              meetingIdToEdit &&
                meetingData.meetingName &&
                meetingData.meetingDate &&
                meetingData.meetingTime,
            );
      if (!hasRequiredData) return;

      setLoadingMeeting(true);
      try {
        const payload = buildMeetingPayload(mode);
        if (mode === "create") {
          await createMeeting(payload);
        } else {
          const meetingId = meetingIdToEdit;
          if (meetingId == null) return;
          await updateMeeting(meetingId, payload);
        }

        if (meetingData.leadId) {
          await handleRowClicked(meetingData.leadId);
        }
        resetMeetingForm();
      } catch (error) {
        console.error(`Failed to ${mode} meeting:`, error);
      } finally {
        setLoadingMeeting(false);
      }
    },
    [
      meetingIdToEdit,
      meetingData,
      buildMeetingPayload,
      handleRowClicked,
      resetMeetingForm,
    ],
  );

  const submitMeetingFromModal = useCallback(async () => {
    await submitMeeting(meetingIdToEdit ? "update" : "create");
  }, [submitMeeting, meetingIdToEdit]);

  // Handle edit meeting click
  const handleEditMeeting = useCallback(
    (meeting: any) => {
      const utcDateRaw = toIsoDateInputValueFromDbField(meeting.meeting_date);
      const utcTimeRaw = meeting.meeting_time || "";
      const localized = convertUtcMeetingToLocal(
        String(utcDateRaw || "").slice(0, 10),
        String(utcTimeRaw || "").slice(0, 5),
      );
      const meetingDate = localized.localDate || utcDateRaw;
      const meetingTime = localized.localTime || utcTimeRaw;

      const meetingExtensionStrings =
        meeting.extensions && Array.isArray(meeting.extensions)
          ? meeting.extensions.map(
              (extObj: any) => extObj.extension || String(extObj.id),
            )
          : [];

      const attendees = mapMeetingExtensionStringsToAttendeeOptions(
        meetingExtensionStrings,
        extensions,
      );

      setMeetingIdToEdit(meeting.id);
      setMeetingData({
        leadId: viewingLead?.id || null,
        leadName: viewingLead?.name || "",
        meetingName: meeting.name || "",
        meetingType: meeting.meeting_type || "Online",
        meetingDate: meetingDate,
        meetingTime: meetingTime,
        meetingOutcome: meeting.meeting_outcome || "",
        extensions: meetingExtensionStrings, // Store extension strings, not objects
      });
      setMeetingAttendees(attendees);
      setShowAddMeetingModal(true);
    },
    [viewingLead, extensions],
  );

  // Handle meeting deletion
  const handleDeleteMeeting = useCallback(
    (meetingId: number, meetingName?: string, leadId?: number) => {
      setMeetingToDelete({ meetingId, meetingName, leadId });
      setShowDeleteMeetingModal(true);
    },
    [],
  );

  const confirmDeleteMeeting = useCallback(async () => {
    if (!meetingToDelete) return;

    try {
      await deleteMeeting(meetingToDelete.meetingId);

      // Refresh lead data (sidebar or view modal)
      const leadIdToRefresh = meetingToDelete.leadId ?? viewingLead?.id;
      if (leadIdToRefresh) {
        await handleRowClicked(leadIdToRefresh);
      }

      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  }, [meetingToDelete, viewingLead, handleRowClicked]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedLeads = leadsData.map(transformLeadData);

    // Use summary_tiles if available, otherwise calculate from data
    const total = summaryTiles ? totalLeads : transformedLeads.length;
    const hot =
      summaryTiles?.hot_leads ||
      transformedLeads.filter((l) => l.leadPotential === "Hot").length;
    // Removed lead score calculation
    const qualified = transformedLeads.filter(
      (l) =>
        l.stage === "Qualified" || l.stage?.toLowerCase().includes("qualified"),
    ).length;

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedLeads.forEach((l) => {
      const stage = l.stage || "New";
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    // Potential distribution
    const potentialCounts: Record<string, number> = {};
    transformedLeads.forEach((l) => {
      const potential = l.leadPotential || "Warm";
      potentialCounts[potential] = (potentialCounts[potential] || 0) + 1;
    });

    return { total, qualified, hot, stageCounts, potentialCounts };
  }, [leadsData, extensions, summaryTiles, totalLeads]);

  // Stats cards data for metrics
  const leadsStatsCards: StatsCardData[] = useMemo(
    () => {
      const m = leadMetrics || {};
      const todaysMeetings = m.todays_meetings ?? 0;
      const overdueMeetings = m.overdue_meetings ?? 0;
      const overdueMeetingsPlural = overdueMeetings === 1 ? "" : "s";
      return [
        {
          title: "All Leads",
          value: m.total_leads ?? 0,
          icon: Users,
          iconColor: "#6366F1",
          iconBgColor: "#EEF2FF",
          metric: {
            text: `${m.total_leads_last_7_days ?? 0} in last 7 days`,
            dotColor: "#6366F1",
          },
        },
        {
          title: "Today's Follow-ups",
          value: m.todays_follow_ups ?? 0,
          icon: Calendar,
          iconColor: "#10B981",
          iconBgColor: "#D1FAE5",
          metric: {
            text: `${m.follow_ups_next_hour ?? 0} in next hour`,
            dotColor: "#F59E0B",
          },
        },
        {
          title: "Today's Meetings",
          value: todaysMeetings,
          icon: Target,
          iconColor: "#8B5CF6",
          iconBgColor: "#EDE9FE",
          metric: {
            text: `${m.meetings_next_hour ?? 0} in next hour`,
            dotColor: "#F59E0B",
          },
        },
        {
          title: "Overdue",
          value: m.overdue_total ?? 0,
          icon: Clock,
          iconColor: "#F97316",
          iconBgColor: "#FFEDD5",
          metric: {
            text: `${m.overdue_follow_ups ?? 0} Follow-ups / ${overdueMeetings} Meeting${overdueMeetingsPlural}`,
            dotColor: "#F97316",
          },
        },
        {
          title: "High-Priority Leads",
          value: m.high_priority_leads ?? 0,
          icon: TrendingUp,
          iconColor: "#10B981",
          iconBgColor: "#D1FAE5",
          additionalText: "Leads with hot potential & high probability",
        },
        {
          title: "Converted Leads",
          value: m.converted_leads ?? 0,
          icon: CheckCircle,
          iconColor: "#8B5CF6",
          iconBgColor: "#EDE9FE",
          metric: {
            text: `${m.converted_leads_last_7_days ?? 0} in last 7 days`,
            dotColor: "#8B5CF6",
          },
        },
      ];
    },
    [leadMetrics],
  );

  // Transform leads data (no client-side filtering - API handles it)
  const filteredLeads = useMemo(() => {
    return leadsData.map(transformLeadData);
  }, [leadsData, extensions]);

  // Extract unique source values from leads data for creatable select
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    leadsData.forEach((lead: any) => {
      const s = lead.source?.trim();
      if (s) {
        sources.add(s);
      }
    });
    return Array.from(sources)
      .sort((a, b) => a.localeCompare(b))
      .map((source) => ({
        value: source,
        label: source,
      }));
  }, [leadsData]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = leadsData.map(transformLeadData);
    const counts: Record<string, number> = {
      all: tabTotals.all ?? summaryTiles?.total_leads ?? totalLeads ?? transformed.length,
      lost:
        tabTotals.lost ??
        summaryTiles?.lost_leads ??
        transformed.filter((l) => l.isLost).length,
      deleted: tabTotals.deleted ?? summaryTiles?.deleted_leads ?? 0,
    };

    // Add counts for all stages (not just first 5, for custom tabs)
    stages.forEach((stage: any) => {
      counts[stage.id] = tabTotals[stage.id] ?? 0;
    });

    return counts;
  }, [leadsData, extensions, stages, summaryTiles, tabTotals, totalLeads]);

  // Update custom tabs counts when filterCounts change
  useEffect(() => {
    setCustomTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const count = filterCounts[tab.id] || 0;
        return { ...tab, count };
      }),
    );
  }, [filterCounts]);

  // Define table columns - Clean data definitions only
  const leadsColumns: TableColumn<LeadData>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (lead) => getInitials(lead.name),
          getColor: (lead) => getRandomColor(lead.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "company",
        label: "Individual/Company",
        sortable: true,
        type: "multi-field",
        fields: {
          primary: "company",
          secondary: "industry",
          secondaryClass: "gt-company-industry",
        },
        emptyValue: "No Company",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        type: "text",
      },
      {
        key: "phone",
        label: "Phone",
        sortable: true,
        align: "left",
        type: "custom",
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        type: "custom",
        render: (lead: LeadData) => {
          const badge = (
            <Badge
              bg=""
              style={{ backgroundColor: lead.stageColor || "#6c757d" }}
            >
              {lead.stage || "-"}
            </Badge>
          );
          return badge;
        },
      },
      {
        key: "stage.name",
        label: "Lost Reason",
        sortable: true,
        type: "text",
        accessor: (lead: LeadData) =>
          lead.lostReasonName || lead.rawData?.stage?.name || null,
      },
      {
        key: "leadPotential",
        label: "Lead Potential",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: (lead) =>
            leadPotentialToTableBadgeVariant(lead.leadPotential),
        },
      },
      {
        key: "followUps",
        label: "Follow-up Date",
        sortable: false,
        align: "center",
        type: "text",
        accessor: (lead: LeadData) => {
          const followUps = lead.followUps || [];
          if (followUps.length > 0) {
            const sortedFollowUps = [...followUps].sort((a, b) => {
              const dateA = a.follow_up_date
                ? new Date(a.follow_up_date).getTime()
                : Infinity;
              const dateB = b.follow_up_date
                ? new Date(b.follow_up_date).getTime()
                : Infinity;
              return dateA - dateB;
            });
            const earliestFollowUp = sortedFollowUps[0];
            if (earliestFollowUp?.follow_up_date) {
              return moment(earliestFollowUp.follow_up_date).format(GlobalDateFormat);
            }
          }

          const leadFollowUpDate =
            lead.followUpDate || lead.rawData?.follow_up_date || null;
          return leadFollowUpDate
            ? moment(leadFollowUpDate).format(GlobalDateFormat)
            : null;
        },
      },
      {
        key: "assignedUser",
        label: "Owner",
        sortable: true,
        type: "text",
      },
      {
        key: "created",
        label: "Created",
        sortable: true,
        type: "text",
      },
    ],
    [],
  );

  // Define table actions

  const leadsActions: TableAction<LeadData>[] = useMemo(() => {
    if (activeFilter === "deleted") {
      return [
        {
          label: "View",
          icon: <Eye size={16} />,
          onClick: (lead: LeadData) =>
            handleViewLead(lead.rawData?.id || lead.id),
        },
        {
          label: "Restore",
          icon: <RotateCcw size={16} />,
          onClick: (lead: LeadData) =>
            handleRestoreLead(lead.rawData?.id || lead.id),
        },
      ];
    }

    const actions: TableAction<LeadData>[] = [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (lead: LeadData) =>
          handleViewLead(lead.rawData?.id || lead.id),
      },
    ];

    if (session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_LEADS)) {
      actions.push({
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: (lead: LeadData) =>
          handleEditLead(lead.rawData?.id || lead.id),
        show: () => activeFilter !== "lost",
      });
    }

    if (session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_DEALS)) {
      actions.push({
        label: "Convert to Deal",
        icon: <Handshake size={16} />,
        onClick: (lead: LeadData) => {
          setConvertingLeadId(lead.rawData?.id || lead.id);
          setShowConvertToDealModal(true);
        },
        className: "text-success",
        disabled: () => activeFilter === "lost",
      });
    }

    if (session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_LEADS)) {
      actions.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (lead: LeadData) =>
          handleDeleteLead(lead.rawData?.id || lead.id, lead.name),
        className: "text-danger",
      });
    }

    // Add Change Stage and Lost actions (only when not viewing lost leads)
    if (activeFilter !== "lost") {
      if (session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_LEADS)) {
        actions.push({
          label: "Change Stage",
          icon: <GitBranch size={16} />,
          onClick: (lead: LeadData) => handleChangeStage(lead.rawData || lead),
        });
      }

      if (
        session?.user?.permissions?.includes(PERMISSIONS.MARK_AS_LOST_CRM_LEADS)
      ) {
        actions.push({
          label: "Lost",
          icon: <X size={16} />,
          onClick: (lead: LeadData) => handleMarkLost(lead.rawData || lead),
          className: "text-danger",
        });
      }
    }

    return actions;
  }, [
    session,
    activeFilter,
    handleViewLead,
    handleConvertLead,
    handleDeleteLead,
    handleRestoreLead,
    handleChangeStage,
    handleMarkLost,
  ]);

  // Handler to open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const leadsToolbarConfig = useCrmToolbarConfig({
    entity: "leads",
    searchValue: leadsSearch,
    searchPlaceholder: "Search leads by name, company, email...",
    onSearchChange: setLeadsSearch,
    onSearch: () => {},
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      { id: "all", label: "All leads", count: filterCounts.all, removable: false },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Leads",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    currentTableView: leadsViewMode,
    onTableViewChange: setLeadsViewMode,
    extensions,
    onPaginationReset: () =>
      setLeadsPagination((prev) => ({ ...prev, currentPage: 1 })),
    stages,
    rightActions:
      session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_LEADS) ? (
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "18px",
            width: "auto",
          }}
        >
          <button
            onClick={() => setShowCreateLeadModal(true)}
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
            Add Lead
          </button>
        </div>
      ) : undefined,
  });

  const handleAddCustomTab = useCallback(
    (tabId: string, label: string, count: number) => {
      if (customTabs.some((tab) => tab.id === tabId)) {
        return;
      }
      setCustomTabs((prevTabs) => [
        ...prevTabs,
        {
          id: tabId,
          label,
          count,
          removable: true,
        },
      ]);
      setShowTabModal(false);
      toast.success("Tab added successfully!");
    },
    [customTabs],
  );

  return {
    session,
    router,
    dialNumber,
    isInitialized,
    stages,
    setStages,
    lostReasons,
    setLostReasons,
    extensions,
    setExtensions,
    campaigns,
    setCampaigns,
    filterBusinessTypes,
    setFilterBusinessTypes,
    refreshKey,
    setRefreshKey,
    currentFilters,
    setCurrentFilters,
    leadsData,
    setLeadsData,
    loading,
    setLoading,
    totalLeads,
    setTotalLeads,
    summaryTiles,
    setSummaryTiles,
    leadMetrics,
    setLeadMetrics,
    tabTotals,
    setTabTotals,
    showLeadsAnalytics,
    setShowLeadsAnalytics,
    showAdvancedFilters,
    setShowAdvancedFilters,
    showFilterBar,
    setShowFilterBar,
    activeFilter,
    setActiveFilter,
    leadsSearch,
    setLeadsSearch,
    showLeadViewModal,
    setShowLeadViewModal,
    viewingLead,
    setViewingLead,
    activeTab,
    setActiveTab,
    loadingLead,
    setLoadingLead,
    showLeadHistoryModal,
    setShowLeadHistoryModal,
    showCreateLeadModal,
    setShowCreateLeadModal,
    editLeadIdForSidebar,
    setEditLeadIdForSidebar,
    showTabModal,
    setShowTabModal,
    customTabs,
    setCustomTabs,
    leadsViewMode,
    setLeadsViewMode,
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
    showLeadSidebar,
    setShowLeadSidebar,
    showFiltersSidebar,
    setShowFiltersSidebar,
    selectedLead,
    setSelectedLead,
    showConvertToDealModal,
    setShowConvertToDealModal,
    convertingLeadId,
    setConvertingLeadId,
    showEditModal,
    setShowEditModal,
    editingLead,
    setEditingLead,
    editFormStep,
    setEditFormStep,
    editFormData,
    setEditFormData,
    editStages,
    setEditStages,
    editExtensions,
    setEditExtensions,
    editCampaigns,
    setEditCampaigns,
    editCrmData,
    setEditCrmData,
    editSelectedCampaign,
    setEditSelectedCampaign,
    editLoading,
    setEditLoading,
    editFetching,
    setEditFetching,
    editBusinessTypes,
    setEditBusinessTypes,
    editBusinessTypeId,
    setEditBusinessTypeId,
    editBusinessTypeOther,
    setEditBusinessTypeOther,
    editShowOtherBusinessType,
    setEditShowOtherBusinessType,
    editSelectedCountry,
    setEditSelectedCountry,
    editSelectedState,
    setEditSelectedState,
    editSelectedCity,
    setEditSelectedCity,
    isEditInitialLoad,
    showAddFollowupModal,
    setShowAddFollowupModal,
    followUpIdToEdit,
    setFollowUpIdToEdit,
    followupData,
    setFollowupData,
    loadingFollowUp,
    setLoadingFollowUp,
    showAddMeetingModal,
    setShowAddMeetingModal,
    meetingIdToEdit,
    setMeetingIdToEdit,
    meetingData,
    setMeetingData,
    meetingAttendees,
    setMeetingAttendees,
    loadingMeeting,
    setLoadingMeeting,
    showChangeStageModal,
    setShowChangeStageModal,
    leadToChangeStage,
    setLeadToChangeStage,
    selectedStageId,
    setSelectedStageId,
    loadingChangeStage,
    setLoadingChangeStage,
    leadStages,
    setLeadStages,
    selectedLeadsColumns,
    setSelectedLeadsColumns,
    leadsPagination,
    setLeadsPagination,
    leadsFilters,
    setLeadsFilters,
    contactEmail,
    contactPhone,
    fetchFilterBusinessTypes,
    buildLeadsParams,
    getLeadsTotalFromResponse,
    fetchLeads,
    handleFilterChange,
    tabTotalsBaseFilters,
    tabTotalsRequestKey,
    lastTabTotalsRequestKeyRef,
    fetchTabTotals,
    handleFiltersChange,
    buildLeadsExportParams,
    fetchLeadsForExport,
    handleLeadsExport,
    leadFollowUps,
    setLeadFollowUps,
    loadingLeadFollowUps,
    setLoadingLeadFollowUps,
    fetchLeadFollowUps,
    leadMeetings,
    setLeadMeetings,
    loadingMeetings,
    setLoadingMeetings,
    fetchMeetings,
    handleRowClicked,
    handlePreviewClickBase,
    openLeadPreviewById,
    writePreviewIdToStorage,
    clearPreviewIdFromStorage,
    handlePreviewClick,
    handleFirstColumnClick,
    fetchStages,
    fetchLostReasons,
    fetchExtensions,
    fetchCampaigns,
    transformLeadData,
    showDeleteModal,
    setShowDeleteModal,
    leadToDelete,
    setLeadToDelete,
    showDeleteFollowUpModal,
    setShowDeleteFollowUpModal,
    followUpToDelete,
    setFollowUpToDelete,
    showDeleteMeetingModal,
    setShowDeleteMeetingModal,
    meetingToDelete,
    setMeetingToDelete,
    handleCallClick,
    handleSidebarCall,
    getNameByExtension,
    sidebarLogActivityModals,
    handleNoteCreate,
    handlePlayCallRecording,
    showRecordingPlayerModal,
    selectedRecording,
    handleCloseRecordingPlayerModal,
    handleCloseLeadSidebar,
    handleHideLeadSidebarKeepPersistence,
    handleDeleteLead,
    confirmDeleteLead,
    handleRestoreLead,
    showConvertModal,
    setShowConvertModal,
    leadToConvert,
    setLeadToConvert,
    convertFormData,
    setConvertFormData,
    handleConvertLead,
    handleConvertSubmit,
    showMarkLostModal,
    setShowMarkLostModal,
    leadToMarkLost,
    setLeadToMarkLost,
    lostReasonId,
    setLostReasonId,
    lostFeedback,
    setLostFeedback,
    handleMarkLost,
    handleChangeStage,
    handleChangeStageSubmit,
    showSuccessfulModal,
    setShowSuccessfulModal,
    successModalTitle,
    setSuccessModalTitle,
    successModalDescription,
    setSuccessModalDescription,
    handleMarkLostSubmit,
    handleViewLead,
    handleEditLead,
    handleEditInputChange,
    handleEditCampaignChange,
    handleEditCampaignFieldChange,
    addEditContactPerson,
    removeEditContactPerson,
    updateEditContactPerson,
    handleEditCountryChange,
    handleEditStateChange,
    handleEditCityChange,
    validateEditStep0,
    validateEditStep1,
    validateEditStep2,
    validateEditStep3,
    handleEditNextStep,
    handleEditSubmit,
    resetFollowupForm,
    validateFollowUpForm,
    buildFollowUpPayload,
    submitFollowUp,
    submitFollowUpFromModal,
    getTodayDate: getMinIsoDateForDateInput,
    handleEditFollowUp,
    handleDeleteFollowUp,
    confirmDeleteFollowUp,
    resetMeetingForm,
    buildMeetingPayload,
    submitMeeting,
    submitMeetingFromModal,
    handleEditMeeting,
    handleDeleteMeeting,
    confirmDeleteMeeting,
    analyticsData,
    filteredLeads,
    uniqueSources,
    filterCounts,
    handleOpenFiltersSidebar,
    leadsToolbarConfig,
    leadsActions,
    leadsColumns,
    leadsStatsCards,
    handleAddCustomTab
  };
}

export type CrmLeadsPageModel = ReturnType<typeof useCrmLeadsPageModel>;
