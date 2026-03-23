import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import { getCalls, getCallsStats, getBots, getCall, getCompanies } from "@utils/voicebot/inbound";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import { Row, Col, Button, Form, Modal, Nav } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Filter, Eye } from "lucide-react";
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
  }, [filters, isAdmin, session?.user]);

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

  const applyFilters = () => {
    setShowFilters(false);
  };

  const hasActiveFilters = !!(
    filters.company_id ||
    filters.bot_id ||
    filters.status ||
    filters.start_date ||
    filters.end_date
  );

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

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Conversations" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Conversations</h2>
            </div>
            <Button variant="outline-secondary" onClick={() => setShowFilters(!showFilters)}>
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
              <div className="h4 mb-0">{stats.avg_duration_seconds == null ? "—" : formatDuration(stats.avg_duration_seconds)}</div>
            </div>
          </Col>
          <Col>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Total cost</div>
              <div className="h4 mb-0">{stats.total_cost == null ? "—" : `$${Number(stats.total_cost).toFixed(4)}`}</div>
            </div>
          </Col>
        </Row>
      )}

      {showFilters && (
        <Row className="mb-3 p-3 border rounded bg-light">
          <Col md={12}>
            <h6 className="mb-2">Filters</h6>
            <Row>
              {isAdmin && (
                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Company</Form.Label>
                    <Form.Select
                      value={filters.company_id}
                      onChange={(e) => setFilters((f) => ({ ...f, company_id: e.target.value }))}
                    >
                      <option value="">All</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                    onChange={(e) => setFilters((f) => ({ ...f, bot_id: e.target.value }))}
                  >
                    <option value="">All</option>
                    {bots.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="initiated">Initiated</option>
                    <option value="answered">Answered</option>
                    <option value="completed">Completed</option>
                    <option value="transferred">Transferred</option>
                    <option value="failed">Failed</option>
                    <option value="timeout">Timeout</option>
                    <option value="dropped">Dropped</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Start date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={filters.start_date ? moment.utc(filters.start_date).local().format("YYYY-MM-DDTHH:mm") : ""}
                    onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value ? moment(e.target.value).utc().format("YYYY-MM-DDTHH:mm:ss") + "Z" : "" }))}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label className="small">End date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={filters.end_date ? moment.utc(filters.end_date).local().format("YYYY-MM-DDTHH:mm") : ""}
                    onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value ? moment(e.target.value).utc().endOf("day").format("YYYY-MM-DDTHH:mm:ss") + "Z" : "" }))}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end gap-2">
                <Button variant="primary" onClick={applyFilters}>Apply</Button>
                {hasActiveFilters && (
                  <Button variant="outline-secondary" onClick={resetFilters}>Reset</Button>
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
        emptyMessage="No calls found."
        loadingMessage="Loading calls..."
        pagination={{
          currentPage: 1,
          rowsPerPage: filters.limit,
          totalRows: data.length,
          pageSizeOptions: [25, 50, 100],
        }}
        uniqueKey="id"
        hover
        striped={false}
      />

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
                    {(viewCallData.messages ?? []).length === 0 ? (
                      <p className="text-muted mb-0">No messages.</p>
                    ) : (
                      (viewCallData.messages ?? []).map((msg, i) => (
                        <div key={msg.id ?? `msg-${i}`} className={`mb-3 ${msg.role === "user" ? "text-end" : ""}`}>
                          <span className="small text-muted d-block mb-1">
                            {msg.role === "assistant" ? "Bot" : "User"}
                            {msg.timestamp ? ` · ${moment(msg.timestamp).format("YYYY-MM-DD HH:mm:ss")}` : ""}
                          </span>
                          <div className={`d-inline-block p-2 rounded text-start ${msg.role === "user" ? "bg-primary text-white" : "bg-white border"}`} style={{ maxWidth: "85%" }}>
                            {(msg.content ?? "").split("\n").map((line, j) => {
                              const msgKey = msg.id ?? "msg-" + i;
                              const lineKey = msgKey + "-" + String(line).slice(0, 40) + "-" + j;
                              return <span key={lineKey}>{line}{j < (msg.content ?? "").split("\n").length - 1 ? <br /> : null}</span>;
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
