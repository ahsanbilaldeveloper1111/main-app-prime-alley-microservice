import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { FilterPill, TableColumn, ToolbarConfig } from "@components/GenericTable";
import { StatsCardData } from "@components/GenericStatsCards";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import { postReportsCalls, getCampaigns, getReportsCallsBySession } from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { Row, Col, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { formatDuration, GlobalDateTimeFormat } from "@utils/Helper";
import "@assets/scss/common.scss";
import moment from "moment";
import { formatFixed, formatPercent } from "@utils/voicebot/outbound/formatters";
import { Activity, DollarSign, MessageSquareText, PieChart, PhoneCall } from "lucide-react";

function formatCost(value: number): string {
  return formatFixed(value, 4, "0.0000");
}

function displayText(value: unknown, fallback = "—"): string {
  if (typeof value === "string") {
    const s = value.trim();
    return s || fallback;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "bigint") return String(value);
  return fallback;
}

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

interface CampaignOption {
  id: number | string;
  campaign_id?: number | string;
  name: string;
}

interface CallReportRow {
  id?: number | string;
  session_id?: string;
  company_id?: string;
  voicebot_id?: number;
  voicebot_name?: string;
  name?: string;
  status?: string;
  total_numbers?: number;
  completed_count?: number;
  failed_count?: number;
  in_progress_count?: number;
  progress_percentage?: number;
  created_at?: string;
  [key: string]: unknown;
}

type CallSessionConversationItem = {
  role?: string;
  content?: string;
  timestamp?: string;
};

type CallSessionUsage = Record<string, number | string | null | undefined>;

type CallSessionCostBreakdown = {
  llm_cost?: number | string | null;
  tts_cost?: number | string | null;
  stt_cost?: number | string | null;
  total_cost?: number | string | null;
};

type CallSessionDetails = {
  session_id?: string;
  campaign_name?: string;
  company_id?: string;
  campaign_id?: number | string;
  voicebot_id?: number | string;
  phone_number?: string;
  trunk_id?: string;
  caller_id?: string;
  call_duration_seconds?: number | string;
  call_status?: string;
  session_start_time?: string;
  session_end_time?: string;
  disconnect_reason?: string;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  transfer_to?: string;
  idle_timeout_triggered?: boolean;
  max_duration_triggered?: boolean;
  total_user_messages?: number;
  total_assistant_messages?: number;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;

  conversation?: CallSessionConversationItem[];
  usage?: CallSessionUsage;
  cost_breakdown?: CallSessionCostBreakdown;
};

type CallSessionApiResponse = {
  status?: boolean;
  data?: CallSessionDetails;
  detail?: string;
  message?: string;
};

function toSessionId(row: CallReportRow): string | null {
  const raw = row.session_id ?? row.id;
  const id = raw == null ? "" : String(raw).trim();
  return id || null;
}

function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    const m = value < 1e12 ? moment.unix(value) : moment(value);
    return m.isValid() ? m.format(GlobalDateTimeFormat) : "—";
  }
  if (typeof value === "string") {
    const m = moment(value);
    return m.isValid() ? m.format(GlobalDateTimeFormat) : "—";
  }
  if (value instanceof Date) {
    const m = moment(value);
    return m.isValid() ? m.format(GlobalDateTimeFormat) : "—";
  }
  return "—";
}

/** e.g. "participant_disconnected" → "participant disconnected"; plain text without underscores is unchanged. */
function humanizeSnakeCase(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value !== "string") return fallback;
  const s = value.trim();
  if (!s) return fallback;
  if (!s.includes("_")) return s;
  return s
    .replaceAll("_", " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function formatBool(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

type ReportsSummary = {
  total_calls?: number;
  success_rate?: number;
  avg_duration?: number; // seconds
  total_cost?: number | string;
};

function formatPercent1(value: unknown): string {
  return formatPercent(value, 1);
}

function formatUsd4(value: unknown): string {
  return `$${formatCost(Number(value ?? 0))}`;
}

const defaultFilters = {
  company_id: "",
  campaign_id: "",
  call_status: "",
  date_from: "",
  date_to: "",
  duration_min: 0,
  duration_max: 3600,
  page: 1,
  page_size: 50,
};

const CALL_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "timeout", label: "Timeout" },
  // { value: "in_progress", label: "In Progress" },
  // { value: "no_answer", label: "No Answer" },
];

const OutboundReportsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier ?? "";

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState<CallReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [summary, setSummary] = useState<ReportsSummary | null>(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CallReportRow | null>(null);
  const [sidebarData, setSidebarData] = useState<CallSessionDetails | null>(null);

  const effectiveCompanyId = isAdmin ? filters.company_id : companyIdentifier;

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      const list = Array.isArray(res)
        ? res
        : (res as { results?: { company_id?: string; id?: string; identifier?: string; name?: string }[] })?.results ??
          (res as { data?: { company_id?: string; id?: string; identifier?: string; name?: string }[] })?.data ??
          [];
      const opts = (Array.isArray(list) ? list : []).map((c) => {
        const item = c as { company_id?: string; id?: string; identifier?: string; name?: string };
        return { id: item.company_id ?? item.identifier ?? item.id ?? "", company_id: item.company_id ?? item.identifier ?? item.id, name: item.name ?? "" };
      });
      setCompanies(opts);
    } catch (err) {
      console.error("GetCompanies error:", err);
      setCompanies([]);
    }
  }, []);

  const fetchCampaigns = useCallback(async (companyId: string) => {
    if (!companyId) {
      setCampaigns([]);
      return;
    }
    try {
      const res = await getCampaigns({ company_id: companyId, page: 1, page_size: 500 });
      const list = Array.isArray(res) ? res : (res as { results?: { campaign_id?: number; id?: number; name?: string }[] })?.results ?? (res as { data?: { campaign_id?: number; id?: number; name?: string }[] })?.data ?? [];
      const raw = Array.isArray(list) ? list : [];
      setCampaigns(
        raw.map((c) => ({
          id: (c as { campaign_id?: number; id?: number }).campaign_id ?? (c as { id?: number }).id ?? 0,
          campaign_id: (c as { campaign_id?: number }).campaign_id ?? (c as { id?: number }).id,
          name: (c as { name?: string }).name ?? "",
        }))
      );
    } catch {
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (effectiveCompanyId) fetchCampaigns(effectiveCompanyId);
    else setCampaigns([]);
  }, [effectiveCompanyId, fetchCampaigns]);

  useEffect(() => {
    if (companyIdentifier) {
      setFilters((f) => ({ ...f, company_id: companyIdentifier }));
    }
  }, [companyIdentifier]);

  useEffect(() => {
    if (isAdmin && companies.length > 0 && !companyIdentifier) {
      setFilters((f) => (f.company_id ? f : { ...f, company_id: companies[0].id }));
    }
  }, [isAdmin, companyIdentifier, companies]);

  useEffect(() => {
    if (hasSearched) handleSearch();
  }, [filters.page, filters.page_size]);

  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarLoading(false);
    setSelectedRow(null);
    setSidebarData(null);
  };

  const handlePreviewClick = useCallback(async (row: CallReportRow) => {
    const sessionId = toSessionId(row);
    const companyId = row.company_id ?? effectiveCompanyId;
    if (!sessionId || !companyId) {
      toast.error("Missing session id or company id for this row");
      return;
    }
    setSelectedRow(row);
    setShowSidebar(true);
    setSidebarLoading(true);
    setSidebarData(null);

    try {
      const res = (await getReportsCallsBySession(sessionId, companyId)) as CallSessionApiResponse;
      if (res?.status === false) {
        toast.error(res?.detail ?? res?.message ?? "Failed to load call session");
        setSidebarData(null);
        return;
      }
      setSidebarData(res?.data ?? null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? String(e?.message ?? "Failed to load call session"));
      setSidebarData(null);
    } finally {
      setSidebarLoading(false);
    }
  }, [effectiveCompanyId]);

  const conversationContent = useMemo(() => {
    if (sidebarLoading) {
      return (
        <div className="text-muted d-flex align-items-center gap-2" style={{ padding: "8px 0" }}>
          <Spinner animation="border" size="sm" /> Loading...
        </div>
      );
    }

    if (!Array.isArray(sidebarData?.conversation) || sidebarData.conversation.length === 0) {
      return <div className="text-muted">No conversation messages.</div>;
    }

    return (
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {sidebarData.conversation.map((message, index) => {
          const role = String(message.role ?? "message");
          const isAssistant = role === "assistant";

          return (
            <div
              key={`${message.timestamp ?? "t"}-${index}`}
              style={{
                marginBottom: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "10px",
                backgroundColor: isAssistant ? "#ffffff" : "#f8fbfd",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <span style={{ fontWeight: 600, textTransform: "capitalize", color: "#141414" }}>{role}</span>
                <span>{formatDateTime(message.timestamp)}</span>
              </div>
              <div style={{ fontSize: "14px", color: "#141414", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                {String(message.content ?? "")}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [sidebarData, sidebarLoading]);

  const usageFields = useMemo(() => {
    if (!sidebarData?.usage || Object.keys(sidebarData.usage).length === 0) {
      return [{ label: "Usage", value: "No usage data." }];
    }

    return Object.entries(sidebarData.usage).map(([key, value]) => ({
      label: humanizeSnakeCase(key),
      value: displayText(value),
    }));
  }, [sidebarData]);

  const costBreakdownFields = useMemo(() => {
    if (!sidebarData?.cost_breakdown) {
      return [{ label: "Cost", value: "No cost breakdown." }];
    }

    return [
      { label: humanizeSnakeCase("llm_cost"), value: `$${formatCost(Number(sidebarData.cost_breakdown.llm_cost ?? 0))}` },
      { label: humanizeSnakeCase("tts_cost"), value: `$${formatCost(Number(sidebarData.cost_breakdown.tts_cost ?? 0))}` },
      { label: humanizeSnakeCase("stt_cost"), value: `$${formatCost(Number(sidebarData.cost_breakdown.stt_cost ?? 0))}` },
      { label: humanizeSnakeCase("total_cost"), value: `$${formatCost(Number(sidebarData.cost_breakdown.total_cost ?? 0))}` },
    ];
  }, [sidebarData]);

  const sidebarSections = useMemo<SidebarSection[]>(() => {
    const dataForView = sidebarData;

    return [
      {
        id: "session-overview",
        title: "Session Overview",
        icon: PhoneCall,
        collapsible: true,
        defaultExpanded: true,
        isLoading: sidebarLoading,
        fields: [
          { label: "Campaign", value: dataForView?.campaign_name ?? selectedRow?.campaign_name ?? "—" },
          { label: "Phone", value: dataForView?.phone_number ?? selectedRow?.phone_number ?? "—", type: "phone" },
          { label: "Status", value: dataForView?.call_status ?? selectedRow?.call_status ?? "—", type: "badge" },
          {
            label: "Duration",
            value: formatDuration(Number(dataForView?.call_duration_seconds ?? selectedRow?.call_duration_seconds ?? 0)),
          },
          { label: "Total Cost", value: `$${formatCost(Number(selectedRow?.total_cost ?? dataForView?.cost_breakdown?.total_cost ?? 0))}` },
        ],
      },
      {
        id: "timing-outcome",
        title: "Timing & Outcome",
        icon: Activity,
        collapsible: true,
        defaultExpanded: true,
        isLoading: sidebarLoading,
        fields: [
          { label: "Start", value: formatDateTime(dataForView?.session_start_time) },
          { label: "End", value: formatDateTime(dataForView?.session_end_time) },
          { label: "Disconnect", value: humanizeSnakeCase(dataForView?.disconnect_reason) },
          { label: "Transfer attempted", value: formatBool(dataForView?.transfer_attempted) },
          { label: "Transfer successful", value: formatBool(dataForView?.transfer_successful) },
          { label: "Transfer to", value: dataForView?.transfer_to ?? "—" },
          { label: "Idle timeout triggered", value: formatBool(dataForView?.idle_timeout_triggered) },
          { label: "Max duration triggered", value: formatBool(dataForView?.max_duration_triggered) },
          { label: "Error", value: dataForView?.error_message || "—" },
        ],
      },
      {
        id: "conversation",
        title: "Conversation",
        icon: MessageSquareText,
        collapsible: true,
        defaultExpanded: true,
        customContent: conversationContent,
      },
      {
        id: "usage",
        title: "Usage",
        icon: PieChart,
        collapsible: true,
        defaultExpanded: false,
        isLoading: sidebarLoading,
        fields: usageFields,
      },
      {
        id: "cost-breakdown",
        title: "Cost Breakdown",
        icon: DollarSign,
        collapsible: true,
        defaultExpanded: false,
        isLoading: sidebarLoading,
        fields: costBreakdownFields,
      },
    ];
  }, [sidebarData, sidebarLoading, selectedRow, conversationContent, usageFields, costBreakdownFields]);

  const handleSearch = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const activeSearch = (searchTerm ?? searchValue).trim();
      const payload: Record<string, unknown> = {
        page_size: filters.page_size,
        page: filters.page,
      };
      payload.company_id = effectiveCompanyId;
      if (activeSearch) payload.search = activeSearch;
      if (filters.campaign_id) {
        payload.campaign_id = filters.campaign_id;
      }
      if (filters.call_status) payload.call_status = filters.call_status;
      if (filters.date_from) payload.date_from = filters.date_from;
      if (filters.date_to) payload.date_to = filters.date_to;
      if (filters.duration_min != null) payload.duration_min = filters.duration_min;
      if (filters.duration_max != null) payload.duration_max = filters.duration_max;

      const res = await postReportsCalls(payload) as {
        status?: boolean;
        count?: number;
        next?: string | null;
        previous?: string | null;
        results?: CallReportRow[];
        summary?: ReportsSummary;
      };
      const list = Array.isArray(res?.results) ? res.results : [];
      const rows = list.map((r, i) => ({ ...r, id: r.id ?? `row-${i}` }));
      setData(rows);
      setTotalRows(res?.count ?? rows.length);
      setSummary(res?.summary ?? null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? String(e?.message ?? "Failed to load reports"));
      setData([]);
      setTotalRows(0);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [filters, effectiveCompanyId, searchValue]);

  useEffect(() => {
    if (hasSearched) return;
    // Auto-load results without requiring filter selection.
    // For admins, wait until companies are loaded (so default company can be applied) OR fall back.
    if (isAdmin && !effectiveCompanyId && companies.length === 0) return;
    handleSearch();
  }, [hasSearched, isAdmin, effectiveCompanyId, companies.length, handleSearch]);

  const columns: TableColumn<CallReportRow>[] = [
    {
      key: "campaign_name",
      label: "Campaign",
      render: (r) => (
        <span
          style={{
            display: "inline-block",
            maxWidth: "100%",
            paddingRight: "92px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={displayText(r.campaign_name)}
        >
          {displayText(r.campaign_name)}
        </span>
      ),
    },
    { key: "phone_number", label: "Phone Number", render: (r) => displayText(r.phone_number) },
    {
      key: "call_status",
      label: "Status",
      render: (r) => {
        const s = displayText(r.call_status);
        return <span className=" text-capitalize">{s}</span>;
      },
    },
    { key: "call_duration_seconds", label: "Duration", render: (r) => formatDuration(Number(r.call_duration_seconds ?? 0)) },
    { key: "total_cost", label: "Cost", render: (r) => formatCost(Number(r.total_cost ?? 0)) },
    { key: "session_start_time", label: "Date Time", render: (r) => formatDateTime(r.session_start_time) },
  ];

  const statsCardsData: StatsCardData[] = [
    {
      title: "Total Calls",
      value: Number(summary?.total_calls ?? 0) || 0,
      subtitle: "Total outbound call sessions",
    },
    {
      title: "Success Rate",
      value: formatPercent1(summary?.success_rate),
      subtitle: "Completed calls percentage",
    },
    {
      title: "Avg Duration",
      value: formatDuration(Number(summary?.avg_duration ?? 0)),
      subtitle: "Average call duration",
    },
    {
      title: "Total Cost",
      value: formatUsd4(summary?.total_cost),
      subtitle: "Accumulated session cost",
    },
  ];

  const tableStatsCards = hasSearched ? statsCardsData : [];

  const companyActiveLabel = (() => {
    if (!filters.company_id) return undefined;
    const selectedCompany = companies.find((company) => company.id === filters.company_id);
    return selectedCompany?.name ?? filters.company_id;
  })();

  const campaignActiveLabel = (() => {
    if (!filters.campaign_id) return undefined;
    const selectedCampaign = campaigns.find((campaign) => String(campaign.id) === String(filters.campaign_id));
    return selectedCampaign?.name ?? String(filters.campaign_id);
  })();

  const callStatusActiveLabel = (() => {
    if (!filters.call_status) return undefined;
    return CALL_STATUS_OPTIONS.find((option) => option.value === filters.call_status)?.label ?? filters.call_status;
  })();

  const dateRangeActiveLabel = filters.date_from || filters.date_to
    ? `${filters.date_from || "Any"} - ${filters.date_to || "Any"}`
    : undefined;

  const durationActiveLabel =
    filters.duration_min !== defaultFilters.duration_min || filters.duration_max !== defaultFilters.duration_max
      ? `${filters.duration_min}s - ${filters.duration_max}s`
      : undefined;

  const filterPills: FilterPill[] = [
    ...(isAdmin
      ? [
          {
            id: "company_id",
            label: "Company",
            showDropdown: true,
            searchable: true,
            active: Boolean(filters.company_id),
            activeLabel: companyActiveLabel,
            onClear: () => setFilters((prev) => ({ ...prev, company_id: "", campaign_id: "", page: 1 })),
            dropdownOptions: [
              {
                label: "All companies",
                value: "",
                onClick: () => setFilters((prev) => ({ ...prev, company_id: "", campaign_id: "", page: 1 })),
              },
              ...companies.map((company) => ({
                label: company.name,
                value: company.id,
                onClick: () => setFilters((prev) => ({ ...prev, company_id: company.id, campaign_id: "", page: 1 })),
              })),
            ],
          } satisfies FilterPill,
        ]
      : []),
    {
      id: "campaign_id",
      label: "Campaign",
      showDropdown: true,
      searchable: true,
      active: Boolean(filters.campaign_id),
      activeLabel: campaignActiveLabel,
      onClear: () => setFilters((prev) => ({ ...prev, campaign_id: "", page: 1 })),
      dropdownOptions: [
        {
          label: "All campaigns",
          value: "",
          onClick: () => setFilters((prev) => ({ ...prev, campaign_id: "", page: 1 })),
        },
        ...campaigns.map((campaign) => ({
          label: campaign.name,
          value: String(campaign.id),
          onClick: () => setFilters((prev) => ({ ...prev, campaign_id: String(campaign.id), page: 1 })),
        })),
      ],
    },
    {
      id: "call_status",
      label: "Call Status",
      showDropdown: true,
      active: Boolean(filters.call_status),
      activeLabel: callStatusActiveLabel,
      onClear: () => setFilters((prev) => ({ ...prev, call_status: "", page: 1 })),
      dropdownOptions: CALL_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
        onClick: () => setFilters((prev) => ({ ...prev, call_status: option.value, page: 1 })),
      })),
    },
    {
      id: "date_range",
      label: "Date Range",
      showDropdown: true,
      active: Boolean(dateRangeActiveLabel),
      activeLabel: dateRangeActiveLabel,
      onClear: () => setFilters((prev) => ({ ...prev, date_from: "", date_to: "", page: 1 })),
      dropdownContent: (
        <div className="d-flex flex-column gap-2" style={{ minWidth: "240px" }}>
          <div>
            <Form.Label className="small mb-1">Date From</Form.Label>
            <Form.Control
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <Form.Label className="small mb-1">Date To</Form.Label>
            <Form.Control
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value, page: 1 }))}
            />
          </div>
        </div>
      ),
    },
    {
      id: "duration_range",
      label: "Duration",
      showDropdown: true,
      active: Boolean(durationActiveLabel),
      activeLabel: durationActiveLabel,
      onClear: () =>
        setFilters((prev) => ({
          ...prev,
          duration_min: defaultFilters.duration_min,
          duration_max: defaultFilters.duration_max,
          page: 1,
        })),
      dropdownContent: (
        <div className="d-flex flex-column gap-2" style={{ minWidth: "240px" }}>
          <div>
            <Form.Label className="small mb-1">Duration Min (s)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={filters.duration_min}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, duration_min: Number(e.target.value) || 0, page: 1 }))
              }
            />
          </div>
          <div>
            <Form.Label className="small mb-1">Duration Max (s)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={filters.duration_max}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, duration_max: Number(e.target.value) || 3600, page: 1 }))
              }
            />
          </div>
        </div>
      ),
    },
  ];

  const tableToolbar: ToolbarConfig = {
    showSearch: true,
    searchValue,
    searchPlaceholder: "Search by campaign, phone, status...",
    onSearchChange: (value: string) => setSearchValue(value),
    onSearch: () => {
      setFilters((prev) => ({ ...prev, page: 1 }));
      handleSearch(searchValue);
    },
    showFiltersButton: true,
    showFilterPills: true,
    showMoreFiltersButton: false,
    filterPills,
    rightActions: (
      <Button variant="primary" size="sm" onClick={() => { handleSearch(); }} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
        Search
      </Button>
    ),
  };

  return (
    <React.Fragment>
      <style jsx global>{`
        .generic-sidebar-new-container {
          margin-top: 0px !important;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Reports" />
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", backgroundColor: "#ffffff", marginRight: "6px" }}>
          <Row className="mb-3">
            <Col>
              <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap ps-3">
              <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px"}}>
            Call Reports
          </h1>
              </div>
            </Col>
          </Row>

          {hasSearched && (
            <GenericTable<CallReportRow>
              data={data}
              columns={columns}
              loading={loading}
              emptyMessage="No call reports found. Adjust filters and try again."
              loadingMessage="Loading reports..."
              pagination={{
                currentPage: filters.page,
                rowsPerPage: filters.page_size,
                totalRows,
                pageSizeOptions: [10, 25, 50, 100],
              }}
              onPaginationChange={(newPage, newRowsPerPage) => {
                setFilters((f) => ({ ...f, page: newPage, page_size: newRowsPerPage }));
              }}
              showToolbar={true}
              toolbar={tableToolbar}
              showToolbarActions={false}
              uniqueKey="id"
              hover
              striped={false}
              statsCards={tableStatsCards}
              metricsGridMinWidth="0px"
              onPreviewClick={(row) => {
                handlePreviewClick(row);
              }}
            />
          )}

          {!hasSearched && (
            <GenericTable<CallReportRow>
              data={[]}
              columns={columns}
              loading={loading}
              emptyMessage="Use the filter pills and click Search to load call reports."
              loadingMessage="Loading reports..."
              showToolbar={true}
              toolbar={tableToolbar}
              showToolbarActions={false}
              uniqueKey="id"
              hover
              striped={false}
              statsCards={tableStatsCards}
              metricsGridMinWidth="0px"
              onPreviewClick={(row) => {
                handlePreviewClick(row);
              }}
            />
          )}
        </div>

        {showSidebar && (
          <GenericSidebar
            isOpen={showSidebar}
            onClose={closeSidebar}
            title={displayText(sidebarData?.campaign_name ?? selectedRow?.campaign_name, "Call Session")}
            subtitle={displayText(sidebarData?.session_id ?? selectedRow?.session_id, "Session")}
            phone={displayText(sidebarData?.phone_number ?? selectedRow?.phone_number, "")}
            company={displayText(selectedRow?.company_id ?? sidebarData?.company_id, "")}
            avatar={{
              initials: "CS",
              name: "Call Session",
              gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            }}
            sections={sidebarSections}
          />
        )}
      </div>
    </React.Fragment>
  );
};

OutboundReportsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default OutboundReportsPage;
