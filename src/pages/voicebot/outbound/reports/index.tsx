import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import { postReportsCalls, getCampaigns } from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { Row, Col, Button, Form, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { formatDateForTable } from "@utils/Helper";
import "@assets/scss/common.scss";

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
  { value: "failed", label: "Failed" },
  { value: "in_progress", label: "In Progress" },
  { value: "no_answer", label: "No Answer" },
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

  const effectiveCompanyId = isAdmin ? filters.company_id : companyIdentifier;

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
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
    } catch {
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

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const payload: Record<string, unknown> = {
        page_size: filters.page_size,
        page: filters.page,
      };
      if (effectiveCompanyId) payload.company_id = effectiveCompanyId;
      if (filters.campaign_id) payload.campaign_id = Number(filters.campaign_id) || filters.campaign_id;
      if (filters.call_status) payload.call_status = filters.call_status;
      if (filters.date_from) payload.date_from = filters.date_from;
      if (filters.date_to) payload.date_to = filters.date_to;
      if (filters.duration_min != null) payload.duration_min = filters.duration_min;
      if (filters.duration_max != null) payload.duration_max = filters.duration_max;

      const res = await postReportsCalls(payload) as { status?: boolean; count?: number; next?: string | null; previous?: string | null; results?: CallReportRow[] };
      const list = Array.isArray(res?.results) ? res.results : [];
      const rows = list.map((r, i) => ({ ...r, id: r.id ?? `row-${i}` }));
      setData(rows);
      setTotalRows(res?.count ?? rows.length);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail ?? String(e?.message ?? "Failed to load reports"));
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [filters, effectiveCompanyId]);

  const columns: TableColumn<CallReportRow>[] = [
    { key: "name", label: "Campaign", render: (r) => String(r.name ?? "—") },
    { key: "voicebot_name", label: "VoiceBot", render: (r) => String(r.voicebot_name ?? "—") },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const s = String(r.status ?? "—");
        let variant = "secondary";
        if (s === "completed") variant = "success";
        else if (s === "failed") variant = "danger";
        else if (s === "running" || s === "active") variant = "primary";
        return <Badge bg={variant as "success" | "danger" | "primary" | "secondary"} className="text-capitalize">{s}</Badge>;
      },
    },
    { key: "total_numbers", label: "Total Numbers", render: (r) => String(r.total_numbers ?? "—") },
    { key: "completed_count", label: "Completed", render: (r) => String(r.completed_count ?? 0) },
    { key: "failed_count", label: "Failed", render: (r) => String(r.failed_count ?? 0) },
    { key: "in_progress_count", label: "In Progress", render: (r) => String(r.in_progress_count ?? 0) },
    { key: "progress_percentage", label: "Progress %", render: (r) => (r.progress_percentage == null ? "—" : `${r.progress_percentage}%`) },
    { key: "created_at", label: "Created", render: (r) => formatDateForTable(r.created_at) ?? "—" },
  ];

  const inputStyle = { padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px" };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Reports" />
      <Row className="mb-3">
        <Col>
          <h2 className="mb-0">Call Reports</h2>
        </Col>
      </Row>

      <div className="card border rounded mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">Filters</h6>
          <Row className="g-3">
            {isAdmin && (
              <Col md={6} lg={3}>
                <Form.Label className="small">Company</Form.Label>
                <Form.Select
                  value={filters.company_id}
                  onChange={(e) => setFilters((f) => ({ ...f, company_id: e.target.value, campaign_id: "" }))}
                  style={inputStyle}
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
            )}
            <Col md={6} lg={3}>
              <Form.Label className="small">Campaign</Form.Label>
              <Form.Select
                value={filters.campaign_id}
                onChange={(e) => setFilters((f) => ({ ...f, campaign_id: e.target.value }))}
                style={inputStyle}
                disabled={!effectiveCompanyId}
              >
                <option value="">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} lg={2}>
              <Form.Label className="small">Call Status</Form.Label>
              <Form.Select
                value={filters.call_status}
                onChange={(e) => setFilters((f) => ({ ...f, call_status: e.target.value }))}
                style={inputStyle}
              >
                {CALL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} lg={2}>
              <Form.Label className="small">Date From</Form.Label>
              <Form.Control
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                style={inputStyle}
              />
            </Col>
            <Col md={6} lg={2}>
              <Form.Label className="small">Date To</Form.Label>
              <Form.Control
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                style={inputStyle}
              />
            </Col>
            <Col md={6} lg={2}>
              <Form.Label className="small">Duration Min (s)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={filters.duration_min}
                onChange={(e) => setFilters((f) => ({ ...f, duration_min: Number(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </Col>
            <Col md={6} lg={2}>
              <Form.Label className="small">Duration Max (s)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={filters.duration_max}
                onChange={(e) => setFilters((f) => ({ ...f, duration_max: Number(e.target.value) || 3600 }))}
                style={inputStyle}
              />
            </Col>
            
            <Col xs={12} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleSearch} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                Search
              </Button>
            </Col>
          </Row>
        </div>
      </div>

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
          uniqueKey="id"
          hover
          striped={false}
        />
      )}

      {!hasSearched && (
        <p className="text-muted">Set filters and click Search to load call reports.</p>
      )}
    </React.Fragment>
  );
};

OutboundReportsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default OutboundReportsPage;
