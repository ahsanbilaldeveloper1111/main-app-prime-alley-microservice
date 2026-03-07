import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCalls,
  getCallsStats,
  getCompanies,
  getBots,
} from "@utils/voicebot/inbound";
import { Row, Col, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Filter } from "lucide-react";
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

const CallsPage = () => {
  const router = useRouter();
  const [data, setData] = useState<CallRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
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

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: true });
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      setCompanies((Array.isArray(list) ? list : []).map((c: any) => ({ id: c.company_id ?? c.id ?? "", name: c.name ?? "" })));
    } catch (_) {
      setCompanies([]);
    }
  }, []);

  const fetchBots = useCallback(async () => {
    try {
      const res = await getBots({ limit: 200 });
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      setBots((Array.isArray(list) ? list : []).map((b: any) => ({ id: b.id ?? "", name: b.name ?? "" })));
    } catch (_) {
      setBots([]);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: filters.limit };
      if (filters.company_id) params.company_id = filters.company_id;
      if (filters.bot_id) params.bot_id = filters.bot_id;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await getCalls(params);
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to load calls");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const params: Record<string, string | undefined> = {};
      if (filters.company_id) params.company_id = filters.company_id;
      if (filters.bot_id) params.bot_id = filters.bot_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await getCallsStats(params);
      setStats(res as any);
    } catch (_) {
      setStats(null);
    }
  }, [filters.company_id, filters.bot_id, filters.start_date, filters.end_date]);

  useEffect(() => {
    fetchCompanies();
    fetchBots();
  }, [fetchCompanies, fetchBots]);

  useEffect(() => {
    fetchCalls();
    fetchStats();
  }, [fetchCalls, fetchStats]);

  const formatDate = (iso?: string) => (iso ? moment(iso).format("YYYY-MM-DD HH:mm") : "—");
  const formatDuration = (sec?: number) => (sec != null ? `${Math.floor(sec / 60)}m ${sec % 60}s` : "—");

  const columns: TableColumn<CallRow>[] = [
    { key: "session_id", label: "Session ID", render: (r) => (r.session_id as string)?.slice(0, 20) + (r.session_id && String(r.session_id).length > 20 ? "…" : "") || "—" },
    { key: "caller_phone", label: "Caller", sortable: true, render: (r) => r.caller_phone || r.caller_id || "—" },
    { key: "company", label: "Company", render: (r) => (r.company as string) || "—" },
    { key: "bot", label: "Bot", render: (r) => (r.bot as string) || "—" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const s = (r.status as string) || "";
        if (s === "completed") return <span className="status-badge success">Completed</span>;
        if (s === "failed" || s === "timeout") return <span className="status-badge danger">{s}</span>;
        if (s === "transferred") return <span className="status-badge info">Transferred</span>;
        return <span className="status-badge secondary">{s || "—"}</span>;
      },
    },
    { key: "session_start_time", label: "Start", render: (r) => formatDate(r.session_start_time as string) },
    { key: "call_duration_seconds", label: "Duration", render: (r) => formatDuration(r.call_duration_seconds as number) },
    { key: "disconnect_reason", label: "Disconnect", render: (r) => (r.disconnect_reason as string) || "—" },
  ];

  const applyFilters = () => {
    setShowFilters(false);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Calls" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0" onClick={() => router.push("/voicebot/inbound")}>
                ← Back
              </Button>
              <h2 className="mb-0">Calls</h2>
            </div>
            <Button variant="outline-secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} className="me-2" /> Filters
            </Button>
          </div>
        </Col>
      </Row>

      {stats && (
        <Row className="mb-3">
          <Col md={3}>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Total calls</div>
              <div className="h4 mb-0">{stats.total_calls ?? 0}</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Completed</div>
              <div className="h4 mb-0">{stats.completed ?? 0}</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Avg duration</div>
              <div className="h4 mb-0">{stats.avg_duration_seconds != null ? formatDuration(stats.avg_duration_seconds) : "—"}</div>
            </div>
          </Col>
          <Col md={3}>
            <div className="p-3 rounded border bg-light">
              <div className="small text-muted">Total cost</div>
              <div className="h4 mb-0">{stats.total_cost != null ? `$${Number(stats.total_cost).toFixed(4)}` : "—"}</div>
            </div>
          </Col>
        </Row>
      )}

      {showFilters && (
        <Row className="mb-3 p-3 border rounded bg-light">
          <Col md={12}>
            <h6 className="mb-2">Filters</h6>
            <Row>
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
              <Col md={2} className="d-flex align-items-end">
                <Button variant="primary" onClick={applyFilters}>Apply</Button>
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
    </React.Fragment>
  );
};

CallsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CallsPage;
