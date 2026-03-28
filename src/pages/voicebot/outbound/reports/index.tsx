import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { FilterPill, TableColumn, ToolbarConfig } from "@components/GenericTable";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import { postReportsCalls, getCampaigns, getReportsCallsBySession } from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { Row, Col, Button, Form, Spinner, Modal, Tabs, Tab } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { formatDuration, GlobalDateTimeFormat } from "@utils/Helper";
import "@assets/scss/common.scss";
import moment from "moment";
import { formatFixed, formatPercent } from "@utils/voicebot/outbound/formatters";

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
  const s = typeof value === "string" ? value : "";
  if (!s) return "—";
  const m = moment(s);
  return m.isValid() ? m.format(GlobalDateTimeFormat) : "—";
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

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTab, setViewTab] = useState<string>("overview");
  const [viewData, setViewData] = useState<CallSessionDetails | null>(null);

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

  const closeView = () => {
    setViewOpen(false);
    setViewLoading(false);
    setViewData(null);
    setViewTab("overview");
  };

  const handleView = useCallback(async (row: CallReportRow) => {
    const sessionId = toSessionId(row);
    const companyId = row.company_id;
    if (!sessionId || !companyId) {
      toast.error("Missing session id or company id for this row");
      return;
    }
    console.log("sessionId", sessionId);
    console.log("companyId", companyId);
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    setViewTab("overview");

    try {
      const res = (await getReportsCallsBySession(sessionId, companyId)) as CallSessionApiResponse;
      if (res?.status === false) {
        toast.error(res?.detail ?? res?.message ?? "Failed to load call session");
        setViewData(null);
        return;
      }
      setViewData(res?.data ?? null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? String(e?.message ?? "Failed to load call session"));
      setViewData(null);
    } finally {
      setViewLoading(false);
    }
  }, []);

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
    { key: "campaign_name", label: "Campaign", render: (r) => displayText(r.campaign_name) },
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
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => handleView(r)}
          disabled={!toSessionId(r)}
        >
          View
        </Button>
      ),
    },
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
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Reports" />
      <Row className="mb-3">
        <Col>
            <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h2 className="mb-0">Call Reports</h2>
            </div>
        </Col>
      </Row>

      {hasSearched && (
        <div className="mb-4">
          <StatsCards data={statsCardsData} gridMinWidth="180px" />
        </div>
      )}

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
        />
      )}

      <Modal show={viewOpen} onHide={closeView} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Call Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading && (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" /> Loading…
            </div>
          )}

          {!viewLoading && !viewData && (
            <div className="text-muted">No session data available.</div>
          )}

          {!viewLoading && viewData && (
            <Tabs activeKey={viewTab} onSelect={(k) => setViewTab(String(k))} className="mb-3">
              <Tab eventKey="overview" title="Overview">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border rounded p-3 bg-light">
                      <div className="fw-bold mb-2">Session</div>
                      <div><b>Session ID:</b> {viewData.session_id || "—"}</div>
                      <div><b>Campaign:</b> {viewData.campaign_name || "—"}</div>
                      <div><b>Phone:</b> {viewData.phone_number || "—"}</div>
                      <div><b>Status:</b> {viewData.call_status || "—"}</div>
                      <div><b>Duration:</b> {formatDuration(Number(viewData.call_duration_seconds ?? 0))}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded p-3 bg-light">
                      <div className="fw-bold mb-2">Timing & Outcome</div>
                      <div><b>Start:</b> {formatDateTime(viewData.session_start_time)}</div>
                      <div><b>End:</b> {formatDateTime(viewData.session_end_time)}</div>
                      <div><b>Disconnect:</b> {viewData.disconnect_reason || "—"}</div>
                      <div><b>Transfer attempted:</b> {formatBool(viewData.transfer_attempted)}</div>
                      <div><b>Transfer successful:</b> {formatBool(viewData.transfer_successful)}</div>
                      <div><b>Transfer to:</b> {viewData.transfer_to || "—"}</div>
                    </div>
                  </div>
                </div>
                {viewData.error_message && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <b>Error:</b> {viewData.error_message}
                  </div>
                )}
              </Tab>

              <Tab eventKey="conversation" title="Conversation">
                {Array.isArray(viewData.conversation) && viewData.conversation.length > 0 ? (
                  <div
                    style={{
                      maxHeight: 520,
                      overflowY: "auto",
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      background:
                        "linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(255,255,255,1) 100%)",
                    }}
                  >
                    {viewData.conversation.map((m, i) => (
                      <div
                        key={`${m.timestamp ?? "t"}-${i}`}
                        style={{
                          display: "flex",
                          justifyContent: m.role === "assistant" ? "flex-start" : "flex-end",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "78%",
                            padding: "10px 12px",
                            borderRadius: 14,
                            backgroundColor: m.role === "assistant" ? "#ffffff" : "rgb(0, 97, 98)",
                            color: m.role === "assistant" ? "#141414" : "#ffffff",
                            border: m.role === "assistant" ? "1px solid #e5e7eb" : "1px solid rgb(0, 97, 98)",
                            boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              marginBottom: 6,
                              opacity: 0.9,
                              fontSize: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700, textTransform: "capitalize" }}>
                              {String(m.role ?? "message")}
                            </div>
                            <div style={{ whiteSpace: "nowrap", opacity: 0.85 }}>
                              {formatDateTime(m.timestamp)}
                            </div>
                          </div>
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                            {String(m.content ?? "")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">No conversation messages.</div>
                )}
              </Tab>

              <Tab eventKey="usage" title="Usage">
                {viewData.usage ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th scope="col">Metric</th>
                          <th scope="col">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(viewData.usage).map(([k, v]) => (
                          <tr key={k}>
                            <th scope="row" className="fw-bold">{k}</th>
                            <td>{displayText(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted">No usage data.</div>
                )}
              </Tab>

              <Tab eventKey="cost_breakdown" title="Cost breakdown">
                {viewData.cost_breakdown ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th scope="col">Cost</th>
                          <th scope="col">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row" className="fw-bold">llm_cost</th>
                          <td>{formatCost(Number(viewData.cost_breakdown.llm_cost ?? 0))}</td>
                        </tr>
                        <tr>
                          <th scope="row" className="fw-bold">tts_cost</th>
                          <td>{formatCost(Number(viewData.cost_breakdown.tts_cost ?? 0))}</td>
                        </tr>
                        <tr>
                          <th scope="row" className="fw-bold">stt_cost</th>
                          <td>{formatCost(Number(viewData.cost_breakdown.stt_cost ?? 0))}</td>
                        </tr>
                        <tr>
                          <th scope="row" className="fw-bold">total_cost</th>
                          <td>{formatCost(Number(viewData.cost_breakdown.total_cost ?? 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted">No cost breakdown.</div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeView}>Close</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

OutboundReportsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default OutboundReportsPage;
