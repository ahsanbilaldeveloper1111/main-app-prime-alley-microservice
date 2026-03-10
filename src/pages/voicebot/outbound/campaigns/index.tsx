import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCampaigns,
  postCampaigns,
  getCampaign,
  putCampaign,
  deleteCampaign,
  postCampaignDispatch,
  postCampaignPause,
  postCampaignResume,
  postCampaignStop,
  getCampaignStatus,
  getVoicebots,
  getTrunks,
  type ListCampaignsParams,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
} from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { Row, Col, Button, Modal, Form, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Play, Pause, RotateCw, Square, Activity } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

interface VoicebotOption {
  id: number | string;
  name: string;
}

interface TrunkOption {
  id: string;
  trunk_id?: string;
  name: string;
}

interface CampaignRow {
  id?: number | string;
  campaign_id?: number | string;
  company_id?: string;
  name: string;
  description?: string;
  voicebot_id?: number;
  trunk_id?: string;
  caller_id?: string;
  target_list?: string[];
  schedule_start?: string;
  schedule_end?: string;
  retry_attempts?: number;
  retry_interval_minutes?: number;
  status?: string;
  [key: string]: unknown;
}

const defaultCreateForm: CreateCampaignPayload & {
  target_list_raw?: string;
  campaign_script?: string;
  custom_greeting?: string;
  input_method?: "manual" | "csv";
} = {
  company_id: "",
  name: "",
  description: "",
  voicebot_id: undefined,
  trunk_id: "",
  caller_id: "",
  target_list: [],
  target_list_raw: "",
  campaign_script: "",
  custom_greeting: "",
  input_method: "manual",
  schedule_start: "",
  schedule_end: "",
  retry_attempts: 3,
  retry_interval_minutes: 60,
  status: "draft",
};

const defaultEditForm: UpdateCampaignPayload = {
  company_id: "",
  name: "",
  description: "",
  retry_attempts: 3,
};

const CampaignsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<CampaignRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [voicebots, setVoicebots] = useState<VoicebotOption[]>([]);
  const [trunks, setTrunks] = useState<TrunkOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CampaignRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [opLoading, setOpLoading] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<typeof defaultCreateForm>({ ...defaultCreateForm });
  const [editForm, setEditForm] = useState<typeof defaultEditForm>({ ...defaultEditForm });
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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
        const id = item.company_id ?? item.identifier ?? item.id ?? "";
        return { id, company_id: item.company_id ?? item.identifier ?? item.id, name: item.name ?? "" };
      });
      setCompanies(opts);
      if (opts.length && !createForm.company_id) setCreateForm((f) => ({ ...f, company_id: opts[0].id }));
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchVoicebots = useCallback(async () => {
    try {
      const res = await getVoicebots({ page: 1, page_size: 500 });
      const list = Array.isArray(res)
        ? res
        : (res as { results?: { bot_id?: number; id?: number; name?: string }[] })?.results ??
          (res as { data?: { bot_id?: number; id?: number; name?: string }[] })?.data ??
          [];
      const raw = Array.isArray(list) ? list : [];
      setVoicebots(
        raw.map((b) => ({
          id: b.bot_id ?? (b as { id?: number }).id ?? 0,
          name: (b as { name?: string }).name ?? "",
        }))
      );
    } catch {
      setVoicebots([]);
    }
  }, []);

  const fetchTrunks = useCallback(async () => {
    try {
      const res = await getTrunks();
      const list = Array.isArray(res)
        ? res
        : (res as { results?: TrunkOption[] })?.results ?? (res as { data?: TrunkOption[] })?.data ?? [];
      const raw = Array.isArray(list) ? list : [];
      setTrunks(
        raw.map((t) => ({
          id: t.trunk_id ?? t.id ?? "",
          trunk_id: t.trunk_id ?? t.id,
          name: (t as { name?: string }).name ?? "",
        }))
      );
    } catch {
      setTrunks([]);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListCampaignsParams = { page, page_size: pageSize };
      if (companyFilter) params.company_id = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getCampaigns(params);
      const list = Array.isArray(res)
        ? res
        : (res as { results?: CampaignRow[] })?.results ?? (res as { data?: CampaignRow[] })?.data ?? [];
      const rawList = Array.isArray(list) ? list : [];
      setTotalRows((res as { count?: number })?.count ?? rawList.length);
      const rows = rawList.map((r, i) => ({
        ...r,
        id: r.campaign_id ?? r.id ?? `campaign-${i}`,
      }));
      setData(rows);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Failed to load campaigns");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
    if (!isAdmin && companyIdentifier) {
      setCompanyFilter(companyIdentifier);
    }
  }, [isAdmin, session?.user]);

  useEffect(() => {
    fetchVoicebots();
    fetchTrunks();
  }, [fetchVoicebots, fetchTrunks]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const campaignId = (row: CampaignRow) => String(row.campaign_id ?? row.id ?? "");
  const selectedCompanyId = selectedRow?.company_id ?? companyFilter;

  const handleOp = async (
    op: "dispatch" | "pause" | "resume" | "stop",
    row: CampaignRow
  ) => {
    const id = campaignId(row);
    const companyId = (row.company_id ?? companyFilter) as string;
    if (!id) {
      toast.error("Missing campaign id");
      return;
    }
    setOpLoading(`${op}-${id}`);
    try {
      const payload = companyId ? { company_id: companyId } : undefined;
      if (op === "dispatch") await postCampaignDispatch(id, payload);
      else if (op === "pause") await postCampaignPause(id, payload);
      else if (op === "resume") await postCampaignResume(id, payload);
      else if (op === "stop") await postCampaignStop(id, payload);
      toast.success(`Campaign ${op} succeeded`);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || `${op} failed`);
    } finally {
      setOpLoading(null);
    }
  };

  const loadStatus = useCallback(
    async (row: CampaignRow) => {
      const id = campaignId(row);
      const companyId = (row.company_id ?? companyFilter) as string;
      setStatusLoading(true);
      setStatusData(null);
      setSelectedRow(row);
      setShowStatusModal(true);
      try {
        const params = companyId ? { company_id: companyId } : undefined;
        const res = await getCampaignStatus(id, params);
        setStatusData(typeof res === "object" ? res : { data: res });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(e?.response?.data?.detail || (e?.message as string) || "Failed to load status");
      } finally {
        setStatusLoading(false);
      }
    },
    [companyFilter]
  );

  const columns: TableColumn<CampaignRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description", render: (r) => (r.description as string) || "—" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const s = (r.status as string) || "—";
        const variant =
          s === "active" ? "success" : s === "paused" ? "warning" : s === "running" ? "primary" : "secondary";
        return <Badge bg={variant}>{s}</Badge>;
      },
    },
    { key: "company_id", label: "Company ID", render: (r) => (r.company_id as string) || "—" },
    {
      key: "schedule",
      label: "Schedule",
      render: (r) => {
        const start = r.schedule_start ? new Date(r.schedule_start as string).toLocaleString() : "—";
        const end = r.schedule_end ? new Date(r.schedule_end as string).toLocaleString() : "—";
        return (
          <span className="small">
            {start} → {end}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const id = campaignId(row);
        const loadingKey = opLoading;
        const status = (row.status as string) || "";
        return (
          <div className="d-flex flex-wrap gap-1 align-items-center">
            <Button
              size="sm"
              variant="outline-primary"
              onClick={async () => {
                setSelectedRow(row);
                try {
                  const detail = await getCampaign(id, row.company_id ? { company_id: row.company_id } : undefined);
                  setEditForm({
                    company_id: (detail.company_id ?? row.company_id) as string,
                    name: (detail.name ?? row.name) as string,
                    description: (detail.description ?? row.description) as string,
                    retry_attempts: (detail.retry_attempts ?? row.retry_attempts ?? 3) as number,
                  });
                  setShowEditModal(true);
                } catch (e: unknown) {
                  const err = e as { response?: { data?: { detail?: string } } };
                  toast.error(err?.response?.data?.detail || "Failed to load campaign details");
                }
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button size="sm" variant="outline-success" onClick={() => handleOp("dispatch", row)} disabled={!!loadingKey}>
              {loadingKey === `dispatch-${id}` ? <Spinner animation="border" size="sm" /> : <Play size={14} />}
            </Button>
            <Button
              size="sm"
              variant="outline-warning"
              onClick={() => handleOp("pause", row)}
              disabled={!!loadingKey || (status !== "active" && status !== "running")}
            >
              {loadingKey === `pause-${id}` ? <Spinner animation="border" size="sm" /> : <Pause size={14} />}
            </Button>
            <Button
              size="sm"
              variant="outline-info"
              onClick={() => handleOp("resume", row)}
              disabled={!!loadingKey || status !== "paused"}
            >
              {loadingKey === `resume-${id}` ? <Spinner animation="border" size="sm" /> : <RotateCw size={14} />}
            </Button>
            <Button size="sm" variant="outline-danger" onClick={() => handleOp("stop", row)} disabled={!!loadingKey}>
              {loadingKey === `stop-${id}` ? <Spinner animation="border" size="sm" /> : <Square size={14} />}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => loadStatus(row)} title="Campaign status">
              <Activity size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => {
                setSelectedRow(row);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.company_id || !createForm.name) {
      toast.error("Company and name are required");
      return;
    }
    if (!(createForm.campaign_script ?? "").trim()) {
      toast.error("Campaign Script is required");
      return;
    }
    setFormLoading(true);
    try {
      const targetList = (createForm.target_list_raw ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: CreateCampaignPayload & Record<string, unknown> = {
        company_id: createForm.company_id,
        name: createForm.name,
        description: createForm.description || undefined,
        voicebot_id: createForm.voicebot_id,
        trunk_id: createForm.trunk_id || undefined,
        caller_id: createForm.caller_id || undefined,
        target_list: targetList.length ? targetList : undefined,
        schedule_start: createForm.schedule_start || undefined,
        schedule_end: createForm.schedule_end || undefined,
        retry_attempts: createForm.retry_attempts,
        retry_interval_minutes: createForm.retry_interval_minutes,
        status: createForm.status || undefined,
      };
      const script = (createForm.campaign_script ?? "").trim();
      const greeting = (createForm.custom_greeting ?? "").trim();
      if (script) payload.campaign_script = script;
      if (greeting) payload.custom_greeting = greeting;
      await postCampaigns(payload);
      toast.success("Campaign created");
      setShowAddModal(false);
      setCreateForm({ ...defaultCreateForm, company_id: companies[0]?.id ?? "" });
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Create failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;
    const id = campaignId(selectedRow);
    setFormLoading(true);
    try {
      const payload: UpdateCampaignPayload = {
        company_id: editForm.company_id || undefined,
        name: editForm.name,
        description: editForm.description || undefined,
        retry_attempts: editForm.retry_attempts,
      };
      await putCampaign(id, payload);
      toast.success("Campaign updated");
      setShowEditModal(false);
      setSelectedRow(null);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Update failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    const id = campaignId(selectedRow);
    if (!id) {
      toast.error("Cannot delete: missing campaign id");
      return;
    }
    setDeleteLoading(true);
    try {
      const params = selectedCompanyId ? { company_id: selectedCompanyId } : undefined;
      await deleteCampaign(id, params);
      toast.success("Campaign deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Campaigns" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              
              <h2 className="mb-0">Campaigns</h2>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {isAdmin && (
                <Form.Select
                  style={{ width: "180px" }}
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Form.Select
                style={{ width: "120px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
              </Form.Select>
              <Button
                variant="primary"
                onClick={() => {
                  setCreateForm({ ...defaultCreateForm, company_id: (companyFilter || companies[0]?.id) ?? "" });
                  setShowAddModal(true);
                }}
              >
                <Plus size={18} className="me-1" /> Add Campaign
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericTable<CampaignRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No campaigns found."
        loadingMessage="Loading campaigns..."
        pagination={{
          currentPage: page,
          rowsPerPage: pageSize,
          totalRows: totalRows || data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        onPaginationChange={(newPage, newRowsPerPage) => {
          setPage(newPage);
          setPageSize(newRowsPerPage);
        }}
        uniqueKey="id"
        hover
        striped={false}
      />

      {/* Create Campaign Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Campaign</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <h6 className="mb-3" id="campaign-configuration">Campaign Configuration</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Campaign Name *</Form.Label>
                  <Form.Control
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Q1 2026 Sales Campaign"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={createForm.description ?? ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Lead generation campaign for Q1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Company *</Form.Label>
                  <Form.Select
                    value={createForm.company_id}
                    onChange={(e) => setCreateForm((f) => ({ ...f, company_id: e.target.value }))}
                    required
                  >
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Select VoiceBot *</Form.Label>
                  <Form.Select
                    value={createForm.voicebot_id ?? ""}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, voicebot_id: e.target.value ? Number(e.target.value) : undefined }))
                    }
                  >
                    <option value="">—</option>
                    {voicebots.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={createForm.status ?? "draft"}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <hr className="my-3" />
            <p className="fw-bold mb-2">Target Numbers</p>
            <Form.Group className="mb-2">
              <Form.Label>Input Method</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="input-manual"
                  name="input_method"
                  label="Manual Entry"
                  checked={(createForm.input_method ?? "manual") === "manual"}
                  onChange={() => setCreateForm((f) => ({ ...f, input_method: "manual" }))}
                />
                <Form.Check
                  type="radio"
                  id="input-csv"
                  name="input_method"
                  label="Upload CSV"
                  checked={(createForm.input_method ?? "manual") === "csv"}
                  onChange={() => setCreateForm((f) => ({ ...f, input_method: "csv" }))}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone Numbers (one per line) *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createForm.target_list_raw ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, target_list_raw: e.target.value }))}
                placeholder={"+1234567890\n+0987654321"}
              />
              <Form.Text className="text-muted">
                Total numbers: {(createForm.target_list_raw ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length}
              </Form.Text>
            </Form.Group>
            <hr className="my-3" />
            <p className="fw-bold mb-2">Campaign Script</p>
            <Form.Group className="mb-2">
              <Form.Label>Campaign Script *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createForm.campaign_script ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, campaign_script: e.target.value }))}
                placeholder="You are calling to discuss our new product. Focus on benefits..."
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Custom Greeting (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createForm.custom_greeting ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, custom_greeting: e.target.value }))}
                placeholder="Hello, this is John from ABC Company..."
              />
            </Form.Group>
            <Row className="mt-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Trunk</Form.Label>
                  <Form.Select
                    value={createForm.trunk_id ?? ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, trunk_id: e.target.value }))}
                  >
                    <option value="">—</option>
                    {trunks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Caller ID</Form.Label>
                  <Form.Control
                    value={createForm.caller_id ?? ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, caller_id: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Schedule start (ISO)</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={
                      createForm.schedule_start
                        ? new Date(createForm.schedule_start).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        schedule_start: e.target.value ? new Date(e.target.value).toISOString() : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Schedule end (ISO)</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={
                      createForm.schedule_end ? new Date(createForm.schedule_end).toISOString().slice(0, 16) : ""
                    }
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        schedule_end: e.target.value ? new Date(e.target.value).toISOString() : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Retry attempts</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={createForm.retry_attempts ?? ""}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        retry_attempts: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Retry interval (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={createForm.retry_interval_minutes ?? ""}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        retry_interval_minutes: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                formLoading ||
                !createForm.company_id ||
                !createForm.name ||
                !(createForm.campaign_script ?? "").trim()
              }
            >
              {formLoading ? <Spinner animation="border" size="sm" /> : "Save Campaign"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedRow(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Campaign</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Company</Form.Label>
              <Form.Select
                value={editForm.company_id ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, company_id: e.target.value }))}
              >
                <option value="">—</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Campaign name"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Retry attempts</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={editForm.retry_attempts ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    retry_attempts: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRow(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading || !editForm.name}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="campaign"
        loading={deleteLoading}
      />

      {/* Campaign Status Modal */}
      <Modal show={showStatusModal} onHide={() => { setShowStatusModal(false); setStatusData(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Campaign Status {selectedRow?.name ? `— ${selectedRow.name}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : statusData ? (
            <pre className="bg-light p-3 rounded small mb-0" style={{ maxHeight: "70vh", overflow: "auto" }}>
              {JSON.stringify(statusData, null, 2)}
            </pre>
          ) : (
            <p className="text-muted mb-0">No status data.</p>
          )}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

CampaignsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CampaignsPage;
