import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import { getCalls, getCallsStats, getBots, getCall, getCompanies } from "@utils/voicebot/inbound";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import { Button, Form, Modal, Nav } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Activity, Bot, Clock3, DollarSign, Eye, PhoneCall } from "lucide-react";
import "@assets/scss/common.scss";
import moment from "moment";

interface CallRow {
  id?: string;
  session_id?: string;
  company?: string;
  bot?: string;
  caller_phone?: string;
  caller_id?: string;
  status?: string;
  session_start_time?: string;
  session_end_time?: string;
  call_duration_seconds?: number;
  disconnect_reason?: string;
  [key: string]: unknown;
}

interface CallMessage {
  id?: string;
  role?: string;
  content?: string;
  timestamp?: string;
  token_count?: number;
  processing_time_ms?: number;
}

interface UsageMetrics {
  stt_tokens?: number;
  llm_input_tokens?: number;
  llm_output_tokens?: number;
  tts_tokens?: number;
  total_tokens?: number;
  stt_cost?: string;
  llm_cost?: string;
  tts_cost?: string;
  total_cost?: string;
  model_used?: string;
  voice_used?: string;
  stt_model?: string;
  interruption_count?: number;
  [key: string]: unknown;
}

interface CallDetail {
  id?: string;
  session_id?: string;
  company_name?: string;
  bot_name?: string;
  caller_phone?: string;
  status?: string;
  call_duration_seconds?: number;
  messages?: CallMessage[];
  usage_metrics?: UsageMetrics;
  [key: string]: unknown;
}

const CALL_STATUS_OPTIONS = [
  { label: "Initiated", value: "initiated" },
  { label: "Answered", value: "answered" },
  { label: "Completed", value: "completed" },
  { label: "Transferred", value: "transferred" },
  { label: "Failed", value: "failed" },
  { label: "Timeout", value: "timeout" },
  { label: "Dropped", value: "dropped" },
];

interface ConversationDateFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  closeMenu: () => void;
  endOfDay?: boolean;
}

function toUtcDateTimeValue(localDateTime: string, endOfDay = false) {
  if (!localDateTime) return "";
  const utcMoment = moment(localDateTime).utc();
  if (endOfDay) {
    return `${utcMoment.endOf("day").format("YYYY-MM-DDTHH:mm:ss")}Z`;
  }
  return `${utcMoment.format("YYYY-MM-DDTHH:mm:ss")}Z`;
}

function ConversationDateFilterDropdown({
  value,
  onChange,
  onClear,
  closeMenu,
  endOfDay = false,
}: Readonly<ConversationDateFilterDropdownProps>) {
  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
      <Form.Control
        size="sm"
        type="datetime-local"
        value={value ? moment.utc(value).local().format("YYYY-MM-DDTHH:mm") : ""}
        onChange={(e) => {
          const localValue = e.target.value;
          const nextValue = toUtcDateTimeValue(localValue, endOfDay);
          onChange(nextValue);
        }}
      />
      <div className="d-flex justify-content-between gap-2">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            onClear();
            closeMenu();
          }}
        >
          Clear
        </Button>
        <Button size="sm" variant="primary" onClick={closeMenu}>
          Done
        </Button>
      </div>
    </div>
  );
}

function createConversationDateDropdown(
  value: string,
  onChange: (value: string) => void,
  onClear: () => void,
  endOfDay = false,
) {
  return function ConversationDateDropdownRender({ closeMenu }: { closeMenu: () => void }) {
    return (
      <ConversationDateFilterDropdown
        value={value}
        onChange={onChange}
        onClear={onClear}
        closeMenu={closeMenu}
        endOfDay={endOfDay}
      />
    );
  };
}

const CallsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<CallRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [botCounts, setBotCounts] = useState<{ published: number; active: number }>({ published: 0, active: 0 });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total_calls?: number; completed?: number; avg_duration_seconds?: number; total_cost?: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    company_id: "",
    bot_id: "",
    status: "",
    start_date: "",
    end_date: "",
    limit: 50,
  });
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCallId, setViewCallId] = useState<string | null>(null);
  const [viewCallData, setViewCallData] = useState<CallDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewActiveTab, setViewActiveTab] = useState<"transcript" | "usage">("transcript");

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies();
      setCompanies(normalizeCompaniesResponse(res, { prefer: "company_id" }));
    } catch {
      toast.error("Failed to load companies");
      setCompanies([]);
    }
  }, []);

  useEffect(() => {
    const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
    if (!isAdmin && companyIdentifier) {
      setFilters((f) => ({ ...f, company_id: companyIdentifier }));
    }
  }, [isAdmin, session?.user]);

  const fetchBots = useCallback(async (companyId?: string) => {
    try {
      const params: { limit: number; company_id?: string } = { limit: 200 };
      if (companyId?.trim()) params.company_id = companyId.trim();
      const res = await getBots(params);
      const list = Array.isArray(res) ? res : (res as { results?: { status?: string; is_active?: boolean }[] })?.results ?? (res as { data?: unknown[] })?.data ?? [];
      const rawList = Array.isArray(list) ? list : [];
      setBots(rawList.map((b: { id?: string; name?: string }) => ({ id: b.id ?? "", name: b.name ?? "" })));
      setBotCounts({
        published: rawList.filter((b: { status?: string }) => b.status === "published").length,
        active: rawList.filter((b: { is_active?: boolean }) => b.is_active === true).length,
      });
    } catch {
      toast.error("Failed to load bots");
      setBots([]);
      setBotCounts({ published: 0, active: 0 });
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: filters.limit };
      const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
      if (!isAdmin && companyIdentifier) {
        params.company_id = companyIdentifier;
      } else if (filters.company_id) {
        params.company_id = filters.company_id;
      }
      if (filters.bot_id) params.bot_id = filters.bot_id;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (appliedSearch.trim()) params.search = appliedSearch.trim();
      const res = await getCalls(params);
      const list = Array.isArray(res) ? res : (res as { results?: unknown[]; data?: unknown[] })?.results ?? (res as { results?: unknown[]; data?: unknown[] })?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (err as { message?: string })?.message ?? "Failed to load calls";
      toast.error(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, session?.user, appliedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const params: Record<string, string | undefined> = {};
      const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
      if (!isAdmin && companyIdentifier) {
        params.company_id = companyIdentifier;
      } else if (filters.company_id) {
        params.company_id = filters.company_id;
      }
      if (filters.bot_id) params.bot_id = filters.bot_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await getCallsStats(params);
      setStats(res as { total_calls?: number; completed?: number; avg_duration_seconds?: number; total_cost?: number } | null);
    } catch {
      toast.error("Failed to load stats");
      setStats(null);
    }
  }, [filters.company_id, filters.bot_id, filters.start_date, filters.end_date, isAdmin, session?.user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const effectiveCompanyId = isAdmin
      ? (filters.company_id || "")
      : ((session?.user as { company_identifier?: string })?.company_identifier ?? "");
    fetchBots(effectiveCompanyId || undefined);
  }, [isAdmin, session?.user, filters.company_id, fetchBots]);

  useEffect(() => {
    fetchCalls();
    fetchStats();
  }, [fetchCalls, fetchStats]);

  useEffect(() => {
    if (!showViewModal || !viewCallId) return;
    setViewLoading(true);
    setViewCallData(null);
    getCall(viewCallId)
      .then((res: unknown) => {
        const data = (res as { data?: CallDetail })?.data ?? (res as CallDetail);
        setViewCallData(typeof data === "object" && data ? data : null);
      })
      .catch((err: { response?: { data?: { detail?: string } }; message?: string }) => {
        toast.error(err?.response?.data?.detail || err?.message || "Failed to load call details");
      })
      .finally(() => setViewLoading(false));
  }, [showViewModal, viewCallId]);

  const formatDate = (iso?: string) => (iso ? moment(iso).format("YYYY-MM-DD HH:mm") : "—");
  const formatDuration = (sec?: number) => (sec == null ? "—" : `${Math.floor(sec / 60)}m ${sec % 60}s`);
  const selectedCompany = companies.find((company) => company.id === filters.company_id);
  const selectedBot = bots.find((bot) => bot.id === filters.bot_id);
  const selectedStatus = CALL_STATUS_OPTIONS.find((option) => option.value === filters.status);

  const clearCompanyAndBotFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, company_id: "", bot_id: "" }));
  }, []);

  const applyCompanyFilter = useCallback((companyId: string) => {
    setFilters((prev) => ({ ...prev, company_id: companyId, bot_id: "" }));
  }, []);

  const clearBotFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, bot_id: "" }));
  }, []);

  const applyBotFilter = useCallback((botId: string) => {
    setFilters((prev) => ({ ...prev, bot_id: botId }));
  }, []);

  const clearStatusFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, status: "" }));
  }, []);

  const applyStatusFilter = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const companyDropdownOptions = useMemo(
    () => [
      {
        label: "All",
        value: "",
        onClick: clearCompanyAndBotFilter,
      },
      ...companies.map((company) => ({
        label: company.name,
        value: company.id,
        onClick: () => applyCompanyFilter(company.id),
      })),
    ],
    [companies, clearCompanyAndBotFilter, applyCompanyFilter],
  );

  const botDropdownOptions = useMemo(
    () => [
      {
        label: "All",
        value: "",
        onClick: clearBotFilter,
      },
      ...bots.map((bot) => ({
        label: bot.name,
        value: bot.id,
        onClick: () => applyBotFilter(bot.id),
      })),
    ],
    [bots, clearBotFilter, applyBotFilter],
  );

  const statusDropdownOptions = useMemo(
    () => [
      {
        label: "All",
        value: "",
        onClick: clearStatusFilter,
      },
      ...CALL_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
        onClick: () => applyStatusFilter(option.value),
      })),
    ],
    [clearStatusFilter, applyStatusFilter],
  );

  const searchableData = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    if (!query) return data;

    return data.filter((row) => {
      const fields = [
        row.caller_phone,
        row.caller_id,
        row.company_name,
        row.bot_name,
        row.status,
        row.room_name,
        row.session_id,
      ];
      return fields.some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [data, appliedSearch]);

  const columns: TableColumn<CallRow>[] = [
    { key: "caller_phone", label: "Caller", sortable: true, render: (r) => r.caller_phone || r.caller_id || "—" },
    ...(isAdmin
      ? [{ key: "company_name", label: "Company", render: (r: CallRow) => safeDisplayString(r.company_name) }]
      : []),
    { key: "bot_name", label: "Bot", render: (r) => safeDisplayString(r.bot_name) },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const s = String(r.status ?? "");
        if (s === "completed") return <span className="status-badge success">Completed</span>;
        if (s === "failed" || s === "timeout") return <span className="status-badge danger">{s}</span>;
        if (s === "transferred") return <span className="status-badge info">Transferred</span>;
        return <span className="status-badge secondary">{s || "—"}</span>;
      },
    },
    { key: "session_start_time", label: "Start", render: (r) => formatDate(r.session_start_time) },
    { key: "session_end_time", label: "End", render: (r) => formatDate(r.session_end_time) },
    { key: "call_duration_seconds", label: "Duration", render: (r) => formatDuration(r.call_duration_seconds) },
    { key: "room_name", label: "Room", render: (r) => safeDisplayString(r.room_name) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => {
            const id = String(row.id ?? row.session_id ?? "");
            if (id !== "") {
              setViewCallId(id);
              setViewActiveTab("transcript");
              setShowViewModal(true);
            }
          }}
        >
          <Eye size={14} />
        </Button>
      ),
    },
  ];

  const hasActiveFilters = !!(
    filters.company_id ||
    filters.bot_id ||
    filters.status ||
    filters.start_date ||
    filters.end_date
  );

  const renderMessageContent = (msg: CallMessage, messageIndex: number) => {
    const lines = (msg.content ?? "").split("\n");
    const messageKey = msg.id ?? `msg-${messageIndex}`;
    return lines.map((line, lineIndex) => {
      const lineKey = `${messageKey}-${String(line).slice(0, 40)}-${lineIndex}`;
      const isLastLine = lineIndex === lines.length - 1;
      return (
        <span key={lineKey}>
          {line}
          {isLastLine ? null : <br />}
        </span>
      );
    });
  };

  const renderTranscriptContent = (messages: CallMessage[]) => {
    if (messages.length === 0) {
      return <p className="text-muted mb-0">No messages.</p>;
    }

    return messages.map((msg, index) => (
      <div key={msg.id ?? `msg-${index}`} className={`mb-3 ${msg.role === "user" ? "text-end" : ""}`}>
        <span className="small text-muted d-block mb-1">
          {msg.role === "assistant" ? "Bot" : "User"}
          {msg.timestamp ? ` · ${moment(msg.timestamp).format("YYYY-MM-DD HH:mm:ss")}` : ""}
        </span>
        <div
          className={`d-inline-block p-2 rounded text-start ${msg.role === "user" ? "bg-primary text-white" : "bg-white border"}`}
          style={{ maxWidth: "85%" }}
        >
          {renderMessageContent(msg, index)}
        </div>
      </div>
    ));
  };

  const resetFilters = () => {
    setFilters({
      company_id: "",
      bot_id: "",
      status: "",
      start_date: "",
      end_date: "",
      limit: 50,
    });
    setShowFilters(false);
  };

  const statsCards = useMemo(
    () => [
      {
        title: "Total Calls",
        value: stats?.total_calls ?? 0,
        icon: PhoneCall,
        iconColor: "#1D4ED8",
        iconBgColor: "#DBEAFE",
        subtitle: "Conversations captured",
      },
      {
        title: "Published Bots",
        value: botCounts.published,
        icon: Bot,
        iconColor: "#0F766E",
        iconBgColor: "#CCFBF1",
        subtitle: "Bots ready for production",
      },
      {
        title: "Active Bots",
        value: botCounts.active,
        icon: Activity,
        iconColor: "#7C3AED",
        iconBgColor: "#EDE9FE",
        subtitle: "Bots currently active",
      },
      {
        title: "Avg Duration",
        value: stats?.avg_duration_seconds == null ? "—" : formatDuration(stats.avg_duration_seconds),
        icon: Clock3,
        iconColor: "#B45309",
        iconBgColor: "#FEF3C7",
        subtitle: "Average conversation length",
      },
      {
        title: "Total Cost",
        value: stats?.total_cost == null ? "—" : `$${Number(stats.total_cost).toFixed(4)}`,
        icon: DollarSign,
        iconColor: "#047857",
        iconBgColor: "#D1FAE5",
        subtitle: "Aggregate call spend",
      },
    ],
    [botCounts.active, botCounts.published, stats],
  );

  const tableToolbar = useMemo(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "conversations",
          label: "Conversations",
          count: stats?.total_calls ?? data.length,
          removable: false,
        },
      ],
      activeTab: "conversations",
      onTabChange: () => undefined,
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Search by caller, bot, status, room...",
      onSearchChange: (value: string) => {
        setSearchInput(value);
        setAppliedSearch(value.trim());
      },
      onSearch: () => setAppliedSearch(searchInput.trim()),
      showFiltersButton: false,
      showFilterPills: showFilters,
      showMoreFiltersButton: false,
      customActions: (
        <>
          <Button
            variant="outline-secondary"
            size="sm"
            className="gt-toolbar-btn"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            Filters
          </Button>
          {hasActiveFilters ? (
            <Button
              variant="outline-secondary"
              size="sm"
              className="gt-toolbar-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          ) : null}
          <Button
            variant="outline-secondary"
            size="sm"
            className="gt-toolbar-btn"
            onClick={() => setAppliedSearch(searchInput.trim())}
          >
            Search
          </Button>
        </>
      ),
      filterPills: [
        ...(isAdmin
          ? [
              {
                id: "company_id",
                label: "Company",
                showDropdown: true,
                searchable: true,
                active: Boolean(filters.company_id),
                activeLabel: selectedCompany?.name || undefined,
                onClear: () => setFilters((prev) => ({ ...prev, company_id: "", bot_id: "" })),
                dropdownOptions: companyDropdownOptions,
              },
            ]
          : []),
        {
          id: "bot_id",
          label: "Bot",
          showDropdown: true,
          searchable: true,
          active: Boolean(filters.bot_id),
          activeLabel: selectedBot?.name || undefined,
          onClear: () => setFilters((prev) => ({ ...prev, bot_id: "" })),
          dropdownOptions: botDropdownOptions,
        },
        {
          id: "status",
          label: "Status",
          showDropdown: true,
          active: Boolean(filters.status),
          activeLabel: selectedStatus?.label || undefined,
          onClear: () => setFilters((prev) => ({ ...prev, status: "" })),
          dropdownOptions: statusDropdownOptions,
        },
        {
          id: "start_date",
          label: "Start Date",
          showDropdown: true,
          active: Boolean(filters.start_date),
          activeLabel: filters.start_date ? moment(filters.start_date).format("MMM DD, YYYY HH:mm") : undefined,
          activeLabelOnly: true,
          onClear: () => setFilters((prev) => ({ ...prev, start_date: "" })),
          dropdownContent: createConversationDateDropdown(
            filters.start_date,
            (value) => setFilters((prev) => ({ ...prev, start_date: value })),
            () => setFilters((prev) => ({ ...prev, start_date: "" })),
          ),
        },
        {
          id: "end_date",
          label: "End Date",
          showDropdown: true,
          active: Boolean(filters.end_date),
          activeLabel: filters.end_date ? moment(filters.end_date).format("MMM DD, YYYY HH:mm") : undefined,
          activeLabelOnly: true,
          onClear: () => setFilters((prev) => ({ ...prev, end_date: "" })),
          dropdownContent: createConversationDateDropdown(
            filters.end_date,
            (value) => setFilters((prev) => ({ ...prev, end_date: value })),
            () => setFilters((prev) => ({ ...prev, end_date: "" })),
            true,
          ),
        },
      ],
    }),
    [
      companies,
      data.length,
      filters.bot_id,
      filters.company_id,
      filters.end_date,
      filters.start_date,
      filters.status,
      hasActiveFilters,
      isAdmin,
      bots,
      selectedBot,
      selectedCompany,
      selectedStatus,
      companyDropdownOptions,
      botDropdownOptions,
      statusDropdownOptions,
      showFilters,
      searchInput,
      stats?.total_calls,
    ],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Conversations" />
      <div className="conversations-page">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .conversations-page .gt-toolbar-tabs-section .d-flex.align-items-center.gap-3 {
                gap: 0 !important;
                align-items: stretch !important;
              }
              .conversations-page .gt-toolbar-tabs-section .d-flex.align-items-center.gap-2 {
                gap: 0 !important;
              }
              
              .conversations-page .gt-tab-button {
                border-radius: 0;
                margin-right: -1px;
                position: relative;
              }
              .conversations-page .gt-tab-button:first-child {
                border-top-left-radius: 10px;
              }
              .conversations-page .gt-tab-button.active {
                z-index: 2;
              }
            `,
          }}
        />

        <GenericTable<CallRow>
          data={searchableData}
          columns={columns}
          loading={loading}
          emptyMessage="No calls found."
          loadingMessage="Loading calls..."
          pagination={{
            currentPage: 1,
            rowsPerPage: filters.limit,
            totalRows: searchableData.length,
            pageSizeOptions: [25, 50, 100],
          }}
          toolbar={tableToolbar}
          showToolbar
          showToolbarActions={false}
          statsCards={statsCards}
          metricsGridMinWidth="180px"
          uniqueKey="id"
          hover
          striped={false}
        />
      </div>

      <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setViewCallId(null); setViewCallData(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Call details {viewCallData?.bot_name ? `— ${viewCallData.bot_name}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (viewLoading) return <div className="text-center py-4">Loading...</div>;
            if (!viewCallData) return <p className="text-muted mb-0">No data.</p>;
            return (
            <>
              <Nav variant="tabs" activeKey={viewActiveTab} onSelect={(k) => setViewActiveTab((k as "transcript" | "usage") ?? "transcript")}>
                <Nav.Item>
                  <Nav.Link eventKey="transcript">Transcript</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="usage">Usage</Nav.Link>
                </Nav.Item>
              </Nav>
              <div className="mt-3">
                {viewActiveTab === "transcript" && (
                  <div className="border rounded p-3 bg-light" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {renderTranscriptContent(viewCallData.messages ?? [])}
                  </div>
                )}
                {viewActiveTab === "usage" && (
                  <div className="border rounded p-3">
                    {viewCallData.usage_metrics ? (
                      <table className="table table-sm table-bordered mb-0">
                        <tbody>
                          {[
                            ["STT tokens", viewCallData.usage_metrics.stt_tokens],
                            ["LLM input tokens", viewCallData.usage_metrics.llm_input_tokens],
                            ["LLM output tokens", viewCallData.usage_metrics.llm_output_tokens],
                            ["TTS tokens", viewCallData.usage_metrics.tts_tokens],
                            ["Total tokens", viewCallData.usage_metrics.total_tokens],
                            ["STT cost", viewCallData.usage_metrics.stt_cost == null ? "—" : `$${viewCallData.usage_metrics.stt_cost}`],
                            ["LLM cost", viewCallData.usage_metrics.llm_cost == null ? "—" : `$${viewCallData.usage_metrics.llm_cost}`],
                            ["TTS cost", viewCallData.usage_metrics.tts_cost == null ? "—" : `$${viewCallData.usage_metrics.tts_cost}`],
                            ["Total cost", viewCallData.usage_metrics.total_cost == null ? "—" : `$${viewCallData.usage_metrics.total_cost}`],
                            ["Model used", viewCallData.usage_metrics.model_used],
                            ["Voice used", viewCallData.usage_metrics.voice_used],
                            ["STT model", viewCallData.usage_metrics.stt_model],
                            ["Interruption count", viewCallData.usage_metrics.interruption_count],
                          ].map(([label, value]) => (
                            <tr key={String(label)}>
                              <td className="text-muted" style={{ width: "40%" }}>{label}</td>
                              <td>{value ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-muted mb-0">No usage data.</p>
                    )}
                  </div>
                )}
              </div>
            </>
            );
          })()}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

CallsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CallsPage;
