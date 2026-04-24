import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCalls,
  getCallsStats,
  getBots,
  getCall,
  getCallTranscript,
} from "@utils/voicebot/inbound";
import { GetCompanies } from "@utils/users";
import {
  normalizeCompaniesResponse,
  type CompanyOption,
} from "@utils/companyOptions";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import { humanizeSnakeCase } from "@utils/Helper";
import { Button, Col, Form, Modal, Nav, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Activity, Bot, Clock3, DollarSign, Eye, Filter, PhoneCall } from "lucide-react";
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

/** Value for voicebot `company_id` query params: API expects `company_id` when present, not only TMS `company_identifier`. */
function getUserCompanyIdForVoicebot(
  user:
    | { company_id?: string | null; company_identifier?: string | null }
    | undefined,
): string {
  const fromId = String(user?.company_id ?? "").trim();
  if (fromId) return fromId;
  return String(user?.company_identifier ?? "").trim();
}

function parseTranscriptPayload(res: unknown): CallMessage[] {
  if (Array.isArray(res)) return res as CallMessage[];
  if (!res || typeof res !== "object") return [];
  const o = res as {
    data?: unknown;
    messages?: unknown;
    results?: unknown;
  };
  const raw = o.data ?? o.messages ?? o.results;
  return Array.isArray(raw) ? (raw as CallMessage[]) : [];
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
  { label: "Transfer Failed", value: "transfer_failed" },
  { label: "Failed", value: "failed" },
  { label: "Timeout", value: "timeout" },
  { label: "Dropped", value: "dropped" },
];

interface ConversationListFilters {
  company_id: string;
  bot_id: string;
  status: string;
  date_from: string;
  date_to: string;
  limit: number;
}

type FiltersSetter = React.Dispatch<React.SetStateAction<ConversationListFilters>>;

const DEFAULT_CONVERSATION_FILTERS: ConversationListFilters = {
  company_id: "",
  bot_id: "",
  status: "",
  date_from: "",
  date_to: "",
  limit: 100,
};

/**
 * Today’s range using the same UTC mapping as the datetime-local `onChange` handlers
 * (start: local start of day; end: that instant in UTC, then `endOf("day")` like the end field).
 */
function getTodayDateRangeForFilters(): Pick<ConversationListFilters, "date_from" | "date_to"> {
  const startLocal = moment().startOf("day");
  const date_from = `${startLocal.clone().utc().format("YYYY-MM-DDTHH:mm:ss")}Z`;
  const date_to = `${moment(startLocal.format("YYYY-MM-DDTHH:mm"))
    .utc()
    .endOf("day")
    .format("YYYY-MM-DDTHH:mm:ss")}Z`;
  return { date_from, date_to };
}

function getDefaultConversationFiltersWithToday(): ConversationListFilters {
  return {
    ...DEFAULT_CONVERSATION_FILTERS,
    ...getTodayDateRangeForFilters(),
  };
}

function applyCompanyFilterIds(setFilters: FiltersSetter, companyId: string) {
  setFilters((prev) => ({ ...prev, company_id: companyId, bot_id: "" }));
}

function companyToCompanyDropdownOption(c: CompanyOption, setFilters: FiltersSetter) {
  return {
    label: c.name,
    value: c.id,
    onClick: () => applyCompanyFilterIds(setFilters, c.id),
  };
}

function buildCompanyDropdownOptions(
  companies: CompanyOption[],
  setFilters: FiltersSetter,
) {
  return [
    {
      label: "All",
      value: "",
      onClick: () => applyCompanyFilterIds(setFilters, ""),
    },
    ...companies.map((company) => companyToCompanyDropdownOption(company, setFilters)),
  ];
}

function applyBotFilterId(setFilters: FiltersSetter, botId: string) {
  setFilters((prev) => ({ ...prev, bot_id: botId }));
}

function botToBotDropdownOption(
  b: { id: string; name: string },
  setFilters: FiltersSetter,
) {
  return {
    label: b.name,
    value: b.id,
    onClick: () => applyBotFilterId(setFilters, b.id),
  };
}

function buildBotDropdownOptions(
  bots: { id: string; name: string }[],
  setFilters: FiltersSetter,
) {
  return [
    {
      label: "All",
      value: "",
      onClick: () => applyBotFilterId(setFilters, ""),
    },
    ...bots.map((bot) => botToBotDropdownOption(bot, setFilters)),
  ];
}

function applyStatusValue(setFilters: FiltersSetter, status: string) {
  setFilters((prev) => ({ ...prev, status }));
}

function callStatusToDropdownOption(
  o: { label: string; value: string },
  setFilters: FiltersSetter,
) {
  return {
    label: o.label,
    value: o.value,
    onClick: () => applyStatusValue(setFilters, o.value),
  };
}

function buildStatusDropdownOptions(setFilters: FiltersSetter) {
  return [
    {
      label: "All",
      value: "",
      onClick: () => applyStatusValue(setFilters, ""),
    },
    ...CALL_STATUS_OPTIONS.map((opt) => callStatusToDropdownOption(opt, setFilters)),
  ];
}

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
  const [botCounts, setBotCounts] = useState<{
    published: number;
    active: number;
  }>({ published: 0, active: 0 });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    total_calls?: number;
    completed?: number;
    avg_duration_seconds?: number;
    total_cost?: number;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ConversationListFilters>(() =>
    getDefaultConversationFiltersWithToday(),
  );
  /** Values last committed via Apply, Search (phone), or explicit pill clear; drives API. */
  const [appliedFilters, setAppliedFilters] = useState<ConversationListFilters>(() =>
    getDefaultConversationFiltersWithToday(),
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCallId, setViewCallId] = useState<string | null>(null);
  const [viewCallData, setViewCallData] = useState<CallDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewActiveTab, setViewActiveTab] = useState<"transcript" | "usage">(
    "transcript",
  );

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      toast.error("Failed to load companies");
      setCompanies([]);
    }
  }, []);

  useEffect(() => {}, [isAdmin, session?.user]);

  const fetchBots = useCallback(async (companyId?: string) => {
    try {
      const params: { limit: number; company_id?: string } = { limit: 100 };
      if (companyId?.trim()) params.company_id = companyId.trim();
      const res = await getBots(params);
      const list = Array.isArray(res)
        ? res
        : ((res as { results?: { status?: string; is_active?: boolean }[] })
            ?.results ??
          (res as { data?: unknown[] })?.data ??
          []);
      const rawList = Array.isArray(list) ? list : [];
      setBots(
        rawList.map((b: { id?: string; name?: string }) => ({
          id: b.id ?? "",
          name: b.name ?? "",
        })),
      );
      setBotCounts({
        published: rawList.filter(
          (b: { status?: string }) => b.status === "published",
        ).length,
        active: rawList.filter(
          (b: { is_active?: boolean }) => b.is_active === true,
        ).length,
      });
    } catch {
      toast.error("Failed to load bots");
      setBots([]);
      setBotCounts({ published: 0, active: 0 });
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    const from = String(appliedFilters.date_from ?? "").trim();
    const to = String(appliedFilters.date_to ?? "").trim();
    if (!from || !to) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        limit: appliedFilters.limit,
        date_from: from,
        date_to: to,
      };
      const companyId = appliedFilters.company_id?.trim();
      if (companyId) params.company_id = companyId;
      if (appliedFilters.bot_id) params.bot_id = appliedFilters.bot_id;
      if (appliedFilters.status) params.status = appliedFilters.status;
      if (appliedSearch.trim()) params.caller_phone = appliedSearch.trim();
      const res = await getCalls(params);
      const list = Array.isArray(res)
        ? res
        : ((res as { results?: unknown[]; data?: unknown[] })?.results ??
          (res as { results?: unknown[]; data?: unknown[] })?.data ??
          []);
      setData(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Failed to load calls";
      toast.error(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, appliedSearch]);

  const fetchStats = useCallback(async () => {
    const from = String(appliedFilters.date_from ?? "").trim();
    const to = String(appliedFilters.date_to ?? "").trim();
    if (!from || !to) {
      setStats(null);
      return;
    }
    try {
      const params: Record<string, string | undefined> = {
        start_date: from,
        end_date: to,
      };
      const companyId = appliedFilters.company_id?.trim();
      if (companyId) params.company_id = companyId;
      if (appliedFilters.bot_id) params.bot_id = appliedFilters.bot_id;
      const res = await getCallsStats(params);
      setStats(
        res as {
          total_calls?: number;
          completed?: number;
          avg_duration_seconds?: number;
          total_cost?: number;
        } | null,
      );
    } catch {
      toast.error("Failed to load stats");
      setStats(null);
    }
  }, [
    appliedFilters.company_id,
    appliedFilters.bot_id,
    appliedFilters.date_from,
    appliedFilters.date_to,
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const cid = filters.company_id?.trim();
    fetchBots(cid || undefined);
  }, [filters.company_id, fetchBots]);

  useEffect(() => {
    fetchCalls();
    fetchStats();
  }, [fetchCalls, fetchStats]);

  useEffect(() => {
    if (!showViewModal || !viewCallId) return;
    setViewLoading(true);
    setViewCallData(null);

    const id = viewCallId;
    void (async () => {
      try {
        const [detailRes, transcriptRes] = await Promise.allSettled([
          getCall(id),
          getCallTranscript(id),
        ]);

        if (detailRes.status === "rejected") {
          const err = detailRes.reason as {
            response?: { data?: { detail?: string } };
            message?: string;
          };
          toast.error(
            err?.response?.data?.detail ||
              err?.message ||
              "Failed to load call details",
          );
          setViewCallData(null);
          return;
        }

        const rawDetail = detailRes.value as unknown;
        const detail =
          (rawDetail as { data?: CallDetail })?.data ??
          (rawDetail as CallDetail);
        const base =
          typeof detail === "object" && detail ? { ...detail } : null;

        let messages: CallMessage[] = [];
        if (transcriptRes.status === "fulfilled") {
          messages = parseTranscriptPayload(transcriptRes.value);
        } else {
          const err = transcriptRes.reason as {
            response?: { data?: { detail?: string } };
            message?: string;
          };
          toast.error(
            err?.response?.data?.detail ||
              err?.message ||
              "Failed to load transcript",
          );
        }

        if (
          messages.length === 0 &&
          base &&
          Array.isArray(base.messages) &&
          base.messages.length > 0
        ) {
          messages = base.messages;
        }

        if (base) {
          base.messages = messages;
          setViewCallData(base);
        } else {
          setViewCallData(null);
        }
      } catch {
        toast.error("Failed to load call details");
        setViewCallData(null);
      } finally {
        setViewLoading(false);
      }
    })();
  }, [showViewModal, viewCallId]);

  const formatDate = (iso?: string) =>
    iso ? moment(iso).format("YYYY-MM-DD HH:mm") : "—";
  const formatDuration = (sec?: number) =>
    sec == null ? "—" : `${Math.floor(sec / 60)}m ${sec % 60}s`;

  /** Fast bot id -> name map so each row render is O(1). Keys include raw and lowercased id. */
  const botNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of bots) {
      const id = String(b.id ?? "").trim();
      const name = String(b.name ?? "").trim();
      if (!id || !name) continue;
      map[id] = name;
      map[id.toLowerCase()] = name;
    }
    return map;
  }, [bots]);

  /**
   * API returns bot info under several shapes (`bot_name`, `bot` string or object,
   * `bot_id`, `bot_uuid`, etc.). Resolve to a display name using the fetched bot
   * list, falling back to whatever id-like value we have so the cell is never empty.
   */
  const resolveBotName = useCallback(
    (row: CallRow): string => {
      const r = row as Record<string, unknown>;
      const pickString = (v: unknown): string => {
        if (typeof v !== "string") return "";
        const s = v.trim();
        return s && s !== "[object Object]" ? s : "";
      };

      const directName = pickString(r.bot_name);
      if (directName) return directName;

      const bot = r.bot;
      if (bot && typeof bot === "object") {
        const o = bot as Record<string, unknown>;
        const nested = pickString(o.name) || pickString(o.title);
        if (nested) return nested;
        const nestedId =
          pickString(o.id) ||
          pickString(o.bot_id) ||
          pickString(o.uuid) ||
          pickString(o.voicebot_id);
        if (nestedId) {
          return botNameById[nestedId] ?? botNameById[nestedId.toLowerCase()] ?? nestedId;
        }
      }

      const idCandidate =
        pickString(r.bot_id) ||
        pickString(r.bot_uuid) ||
        pickString(r.botId) ||
        pickString(r.voicebot_id) ||
        pickString(bot);
      if (idCandidate) {
        return botNameById[idCandidate] ?? botNameById[idCandidate.toLowerCase()] ?? idCandidate;
      }

      return "";
    },
    [botNameById],
  );

  const columns: TableColumn<CallRow>[] = [
    {
      key: "caller_phone",
      label: "Caller",
      sortable: true,
      render: (r) => r.caller_phone || r.caller_id || "—",
    },
    ...(isAdmin
      ? [
          {
            key: "company_name",
            label: "Company",
            render: (r: CallRow) => safeDisplayString(r.company_name),
          },
        ]
      : []),
    {
      key: "bot_name",
      label: "Bot",
      render: (r) => safeDisplayString(resolveBotName(r)),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const s = String(r.status ?? "");
        const label = humanizeSnakeCase(s, "—");
        if (s === "completed")
          return <span className="status-badge success text-capitalize">{label}</span>;
        if (s === "failed" || s === "timeout" || s === "transfer_failed")
          return <span className="status-badge danger text-capitalize">{label}</span>;
        if (s === "transferred")
          return <span className="status-badge info text-capitalize">{label}</span>;
        return <span className="status-badge secondary text-capitalize">{label}</span>;
      },
    },
    {
      key: "session_start_time",
      label: "Start",
      render: (r) => formatDate(r.session_start_time),
    },
    {
      key: "session_end_time",
      label: "End",
      render: (r) => formatDate(r.session_end_time),
    },

    {
      key: "call_duration_seconds",
      label: "Duration",
      render: (r) => formatDuration(r.call_duration_seconds),
    },
    {
      key: "room_name",
      label: "Room",
      render: (r) => safeDisplayString(r.room_name),
    },
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
    appliedFilters.company_id ||
    appliedFilters.bot_id ||
    appliedFilters.status ||
    appliedFilters.date_from ||
    appliedFilters.date_to
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
    const next = getDefaultConversationFiltersWithToday();
    setFilters({ ...next });
    setAppliedFilters({ ...next });
    setSearchInput("");
    setAppliedSearch("");
  };

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (c) =>
          c.id === appliedFilters.company_id ||
          c.company_id === appliedFilters.company_id ||
          c.identifier === appliedFilters.company_id,
      ),
    [companies, appliedFilters.company_id],
  );

  const selectedBot = useMemo(
    () => bots.find((b) => b.id === appliedFilters.bot_id),
    [bots, appliedFilters.bot_id],
  );

  const selectedStatus = useMemo(
    () => CALL_STATUS_OPTIONS.find((o) => o.value === appliedFilters.status),
    [appliedFilters.status],
  );

  const companyDropdownOptions = useMemo(
    () => buildCompanyDropdownOptions(companies, setFilters),
    [companies, setFilters],
  );

  const botDropdownOptions = useMemo(
    () => buildBotDropdownOptions(bots, setFilters),
    [bots, setFilters],
  );

  const statusDropdownOptions = useMemo(
    () => buildStatusDropdownOptions(setFilters),
    [setFilters],
  );

  const applyFilters = useCallback(() => {
    const from = String(filters.date_from ?? "").trim();
    const to = String(filters.date_to ?? "").trim();
    if (!from || !to) {
      toast.error("Please select both a start date and an end date.");
      return;
    }
    setAppliedFilters({ ...filters });
    setAppliedSearch(searchInput.trim());
  }, [filters, searchInput]);

  const hasAppliedDateRange =
    String(appliedFilters.date_from ?? "").trim() !== "" &&
    String(appliedFilters.date_to ?? "").trim() !== "";

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
      searchPlaceholder: "Search by caller phone...",
      onSearchChange: (value: string) => {
        setSearchInput(value);
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
                active: Boolean(appliedFilters.company_id),
                activeLabel: selectedCompany?.name || undefined,
                onClear: () => {
                  setFilters((prev) => ({ ...prev, company_id: "", bot_id: "" }));
                  setAppliedFilters((prev) => ({ ...prev, company_id: "", bot_id: "" }));
                },
                dropdownOptions: companyDropdownOptions,
              },
            ]
          : []),
        {
          id: "bot_id",
          label: "Bot",
          showDropdown: true,
          searchable: true,
          active: Boolean(appliedFilters.bot_id),
          activeLabel: selectedBot?.name || undefined,
          onClear: () => {
            setFilters((prev) => ({ ...prev, bot_id: "" }));
            setAppliedFilters((prev) => ({ ...prev, bot_id: "" }));
          },
          dropdownOptions: botDropdownOptions,
        },
        {
          id: "status",
          label: "Status",
          showDropdown: true,
          active: Boolean(appliedFilters.status),
          activeLabel: selectedStatus?.label || undefined,
          onClear: () => {
            setFilters((prev) => ({ ...prev, status: "" }));
            setAppliedFilters((prev) => ({ ...prev, status: "" }));
          },
          dropdownOptions: statusDropdownOptions,
        },
        {
          id: "date_from",
          label: "Start Date",
          showDropdown: true,
          active: Boolean(appliedFilters.date_from),
          activeLabel: appliedFilters.date_from
            ? moment(appliedFilters.date_from).format("MMM DD, YYYY HH:mm")
            : undefined,
          activeLabelOnly: true,
          onClear: () => {
            setFilters((prev) => ({ ...prev, date_from: "" }));
            setAppliedFilters((prev) => ({ ...prev, date_from: "" }));
          },
          dropdownContent: createConversationDateDropdown(
            filters.date_from,
            (value) => setFilters((prev) => ({ ...prev, date_from: value })),
            () => setFilters((prev) => ({ ...prev, date_from: "" })),
          ),
        },
        {
          id: "date_to",
          label: "End Date",
          showDropdown: true,
          active: Boolean(appliedFilters.date_to),
          activeLabel: appliedFilters.date_to
            ? moment(appliedFilters.date_to).format("MMM DD, YYYY HH:mm")
            : undefined,
          activeLabelOnly: true,
          onClear: () => {
            setFilters((prev) => ({ ...prev, date_to: "" }));
            setAppliedFilters((prev) => ({ ...prev, date_to: "" }));
          },
          dropdownContent: createConversationDateDropdown(
            filters.date_to,
            (value) => setFilters((prev) => ({ ...prev, date_to: value })),
            () => setFilters((prev) => ({ ...prev, date_to: "" })),
            true,
          ),
        },
      ],
    }),
    [
      companies,
      data.length,
      appliedFilters,
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
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - Conversations"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Conversations</h2>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="me-2" /> Filters
            </Button>
          </div>
        </Col>
      </Row>

      {stats && (
        <Row className="mb-3">
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Total calls</div>
              <div className="h4 mb-0">{stats.total_calls ?? 0}</div>
            </div>
          </Col>
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Published Bots</div>
              <div className="h4 mb-0">{botCounts.published}</div>
            </div>
          </Col>
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Active Bots</div>
              <div className="h4 mb-0">{botCounts.active}</div>
            </div>
          </Col>
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Avg duration</div>
              <div className="h4 mb-0">
                {stats.avg_duration_seconds == null
                  ? "—"
                  : formatDuration(stats.avg_duration_seconds)}
              </div>
            </div>
          </Col>
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Total cost</div>
              <div className="h4 mb-0">
                {stats.total_cost == null
                  ? "—"
                  : `$${Number(stats.total_cost).toFixed(4)}`}
              </div>
            </div>
          </Col>
        </Row>
      )}

      {showFilters && (
        <Row className="mb-3 p-3 border rounded bg-light">
          <Col md={12}>
            <h6 className="mb-1">Filters</h6>
            <p className="small text-muted mb-2">
              Default range is today. Both start and end dates are required—change them if needed, then
              click Apply.
            </p>
            <Row>
              {isAdmin && (
                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Company</Form.Label>
                    <Form.Select
                      value={filters.company_id}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          company_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">All</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Bot</Form.Label>
                  <Form.Select
                    value={filters.bot_id}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, bot_id: e.target.value }))
                    }
                  >
                    <option value="">All</option>
                    {bots.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    <option value="">All</option>
                    <option value="initiated">Initiated</option>
                    <option value="answered">Answered</option>
                    <option value="completed">Completed</option>
                    <option value="transferred">Transferred</option>
                    <option value="transfer_failed">Transfer Failed</option>
                    <option value="failed">Failed</option>
                    <option value="timeout">Timeout</option>
                    <option value="dropped">Dropped</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">
                    Start date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={
                      filters.date_from
                        ? moment
                            .utc(filters.date_from)
                            .local()
                            .format("YYYY-MM-DDTHH:mm")
                        : ""
                    }
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        date_from: e.target.value
                          ? moment(e.target.value)
                              .utc()
                              .format("YYYY-MM-DDTHH:mm:ss") + "Z"
                          : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">
                    End date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={
                      filters.date_to
                        ? moment
                            .utc(filters.date_to)
                            .local()
                            .format("YYYY-MM-DDTHH:mm")
                        : ""
                    }
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        date_to: e.target.value
                          ? moment(e.target.value)
                              .utc()
                              .endOf("day")
                              .format("YYYY-MM-DDTHH:mm:ss") + "Z"
                          : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end gap-2">
                <Button
                  variant="primary"
                  onClick={applyFilters}
                  disabled={
                    !String(filters.date_from ?? "").trim() ||
                    !String(filters.date_to ?? "").trim()
                  }
                >
                  Apply
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline-secondary" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      )}

      <GenericTable<CallRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage={
          hasAppliedDateRange
            ? "No calls found for this range."
            : "Select a start date and an end date in filters, then click Apply."
        }
        loadingMessage="Loading calls..."
        pagination={{
          currentPage: 1,
          rowsPerPage: appliedFilters.limit,
          totalRows: data.length,
          pageSizeOptions: [25, 50, 100],
        }}
        onPaginationChange={(_newPage, newRowsPerPage) => {
          setFilters((f) => ({ ...f, limit: newRowsPerPage }));
          setAppliedFilters((f) => ({ ...f, limit: newRowsPerPage }));
        }}
        uniqueKey="id"
        hover
        striped={false}
      />

      <Modal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setViewCallId(null);
          setViewCallData(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Call details{" "}
            {viewCallData?.bot_name ? `— ${viewCallData.bot_name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (viewLoading)
              return <div className="text-center py-4">Loading...</div>;
            if (!viewCallData)
              return <p className="text-muted mb-0">No data.</p>;
            return (
              <>
                <Nav
                  variant="tabs"
                  activeKey={viewActiveTab}
                  onSelect={(k) =>
                    setViewActiveTab(
                      (k as "transcript" | "usage") ?? "transcript",
                    )
                  }
                >
                  <Nav.Item>
                    <Nav.Link eventKey="transcript">Transcript</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="usage">Usage</Nav.Link>
                  </Nav.Item>
                </Nav>
                <div className="mt-3">
                  {viewActiveTab === "transcript" && (
                    <div
                      className="border rounded p-3 bg-light"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {(viewCallData.messages ?? []).length === 0 ? (
                        <p className="text-muted mb-0">No messages.</p>
                      ) : (
                        (viewCallData.messages ?? []).map((msg, i) => (
                          <div
                            key={msg.id ?? `msg-${i}`}
                            className={`mb-3 ${msg.role === "user" ? "text-end" : ""}`}
                          >
                            <span className="small text-muted d-block mb-1">
                              {msg.role === "assistant" ? "Bot" : "User"}
                              {msg.timestamp
                                ? ` · ${moment(msg.timestamp).format("YYYY-MM-DD HH:mm:ss")}`
                                : ""}
                            </span>
                            <div
                              className={`d-inline-block p-2 rounded text-start ${msg.role === "user" ? "bg-primary text-white" : "bg-white border"}`}
                              style={{ maxWidth: "85%" }}
                            >
                              {(msg.content ?? "")
                                .split("\n")
                                .map((line, j) => {
                                  const msgKey = msg.id ?? "msg-" + i;
                                  const lineKey =
                                    msgKey +
                                    "-" +
                                    String(line).slice(0, 40) +
                                    "-" +
                                    j;
                                  return (
                                    <span key={lineKey}>
                                      {line}
                                      {j <
                                      (msg.content ?? "").split("\n").length -
                                        1 ? (
                                        <br />
                                      ) : null}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {viewActiveTab === "usage" && (
                    <div className="border rounded p-3">
                      {viewCallData.usage_metrics ? (
                        <table className="table table-sm table-bordered mb-0">
                          <tbody>
                            {[
                              [
                                "STT tokens",
                                viewCallData.usage_metrics.stt_tokens,
                              ],
                              [
                                "LLM input tokens",
                                viewCallData.usage_metrics.llm_input_tokens,
                              ],
                              [
                                "LLM output tokens",
                                viewCallData.usage_metrics.llm_output_tokens,
                              ],
                              [
                                "TTS tokens",
                                viewCallData.usage_metrics.tts_tokens,
                              ],
                              [
                                "Total tokens",
                                viewCallData.usage_metrics.total_tokens,
                              ],
                              [
                                "STT cost",
                                viewCallData.usage_metrics.stt_cost == null
                                  ? "—"
                                  : `$${viewCallData.usage_metrics.stt_cost}`,
                              ],
                              [
                                "LLM cost",
                                viewCallData.usage_metrics.llm_cost == null
                                  ? "—"
                                  : `$${viewCallData.usage_metrics.llm_cost}`,
                              ],
                              [
                                "TTS cost",
                                viewCallData.usage_metrics.tts_cost == null
                                  ? "—"
                                  : `$${viewCallData.usage_metrics.tts_cost}`,
                              ],
                              [
                                "Total cost",
                                viewCallData.usage_metrics.total_cost == null
                                  ? "—"
                                  : `$${viewCallData.usage_metrics.total_cost}`,
                              ],
                              [
                                "Model used",
                                viewCallData.usage_metrics.model_used,
                              ],
                              [
                                "Voice used",
                                viewCallData.usage_metrics.voice_used,
                              ],
                              [
                                "STT model",
                                viewCallData.usage_metrics.stt_model,
                              ],
                              [
                                "Interruption count",
                                viewCallData.usage_metrics.interruption_count,
                              ],
                            ].map(([label, value]) => (
                              <tr key={String(label)}>
                                <td
                                  className="text-muted"
                                  style={{ width: "40%" }}
                                >
                                  {label}
                                </td>
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
