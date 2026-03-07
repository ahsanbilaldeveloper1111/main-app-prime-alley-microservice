import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getVoicebots,
  postVoicebots,
  getVoicebot,
  putVoicebot,
  deleteVoicebot,
  type CreateVoicebotPayload,
  type UpdateVoicebotPayload,
  type ListVoicebotsParams,
} from "@utils/voicebot/outbound";
import { getCompanies } from "@utils/voicebot/inbound";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

interface VoicebotRow {
  id?: number | string;
  bot_id?: number | string;
  company_id?: string;
  name: string;
  description?: string;
  status?: string;
  system_prompt?: string;
  first_message?: string;
  llm_model?: string;
  tts_model?: string;
  stt_model?: string;
  voice?: string;
  temperature?: number;
  max_tokens?: number;
  transfer_number?: string;
  enable_transfer?: boolean;
  idle_timeout_seconds?: number;
  max_call_duration_seconds?: number;
  [key: string]: unknown;
}

const defaultForm: CreateVoicebotPayload & { company_id: string } = {
  company_id: "",
  name: "",
  description: "",
  system_prompt: "",
  first_message: "",
  llm_model: "gpt-4o-mini",
  tts_model: "gpt-4o-mini-tts",
  stt_model: "nova-3",
  voice: "alloy",
  temperature: 0.7,
  max_tokens: 150,
  transfer_number: "",
  enable_transfer: false,
  idle_timeout_seconds: 30,
  max_call_duration_seconds: 300,
  status: "active",
};

const VoicebotsPage = () => {
  const router = useRouter();
  const [data, setData] = useState<VoicebotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<VoicebotRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<typeof defaultForm>({ ...defaultForm });

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: true });
      const list = Array.isArray(res) ? res : (res as { results?: { company_id?: string; id?: string; name?: string }[] })?.results ?? (res as { data?: { company_id?: string; id?: string; name?: string }[] })?.data ?? [];
      const opts = (Array.isArray(list) ? list : []).map((c) => ({
        id: c.company_id ?? c.id ?? "",
        company_id: c.company_id ?? c.id,
        name: c.name ?? "",
      }));
      setCompanies(opts);
      if (opts.length && !form.company_id) setForm((f) => ({ ...f, company_id: opts[0].id }));
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchVoicebots = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListVoicebotsParams = { page, page_size: pageSize };
      if (companyFilter) params.company_id = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getVoicebots(params);
      const list = Array.isArray(res) ? res : (res as { results?: VoicebotRow[] })?.results ?? (res as { data?: VoicebotRow[] })?.data ?? [];
      const rawList = Array.isArray(list) ? list : [];
      setTotalRows((res as { count?: number })?.count ?? rawList.length);
      const rows = rawList.map((r, i) => ({
        ...r,
        id: r.bot_id ?? r.id ?? `bot-${i}`,
      }));
      setData(rows);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Failed to load voicebots");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchVoicebots();
  }, [fetchVoicebots]);

  const botId = (row: VoicebotRow) => String(row.bot_id ?? row.id ?? "");
  const selectedCompanyId = selectedRow?.company_id ?? companyFilter;

  const columns: TableColumn<VoicebotRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description", render: (r) => (r.description as string) || "—" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.status === "active" ? (
          <span className="status-badge success">Active</span>
        ) : (
          <span className="status-badge secondary">{r.status || "—"}</span>
        ),
    },
    { key: "company_id", label: "Company ID", render: (r) => (r.company_id as string) || "—" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={async () => {
              setSelectedRow(row);
              try {
                const detail = await getVoicebot(botId(row), { company_id: row.company_id as string });
                setForm({
                  company_id: (detail.company_id ?? row.company_id ?? "") as string,
                  name: (detail.name ?? row.name) as string,
                  description: (detail.description ?? row.description) as string,
                  system_prompt: (detail.system_prompt ?? row.system_prompt) as string,
                  first_message: (detail.first_message ?? row.first_message) as string,
                  llm_model: (detail.llm_model ?? row.llm_model ?? defaultForm.llm_model) as string,
                  tts_model: (detail.tts_model ?? row.tts_model ?? defaultForm.tts_model) as string,
                  stt_model: (detail.stt_model ?? row.stt_model ?? defaultForm.stt_model) as string,
                  voice: (detail.voice ?? row.voice ?? defaultForm.voice) as string,
                  temperature: (detail.temperature ?? row.temperature ?? defaultForm.temperature) as number,
                  max_tokens: (detail.max_tokens ?? row.max_tokens ?? defaultForm.max_tokens) as number,
                  transfer_number: (detail.transfer_number ?? row.transfer_number ?? "") as string,
                  enable_transfer: (detail.enable_transfer ?? row.enable_transfer ?? false) as boolean,
                  idle_timeout_seconds: (detail.idle_timeout_seconds ?? row.idle_timeout_seconds ?? defaultForm.idle_timeout_seconds) as number,
                  max_call_duration_seconds: (detail.max_call_duration_seconds ?? row.max_call_duration_seconds ?? defaultForm.max_call_duration_seconds) as number,
                  status: (detail.status ?? row.status ?? "active") as string,
                });
                setShowEditModal(true);
              } catch (e: unknown) {
                const err = e as { response?: { data?: { detail?: string } } };
                toast.error(err?.response?.data?.detail || "Failed to load bot details");
              }
            }}
          >
            <Pencil size={14} />
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
      ),
    },
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_id || !form.name) {
      toast.error("Company and name are required");
      return;
    }
    setFormLoading(true);
    try {
      await postVoicebots({
        company_id: form.company_id,
        name: form.name,
        description: form.description || undefined,
        system_prompt: form.system_prompt || undefined,
        first_message: form.first_message || undefined,
        llm_model: form.llm_model || undefined,
        tts_model: form.tts_model || undefined,
        stt_model: form.stt_model || undefined,
        voice: form.voice || undefined,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        transfer_number: form.transfer_number || undefined,
        enable_transfer: form.enable_transfer,
        idle_timeout_seconds: form.idle_timeout_seconds,
        max_call_duration_seconds: form.max_call_duration_seconds,
        status: form.status || undefined,
      });
      toast.success("Voicebot created");
      setShowAddModal(false);
      setForm({ ...defaultForm, company_id: companies[0]?.id ?? "" });
      fetchVoicebots();
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
    setFormLoading(true);
    try {
      const payload: UpdateVoicebotPayload = {
        company_id: form.company_id || undefined,
        name: form.name,
        description: form.description || undefined,
        system_prompt: form.system_prompt || undefined,
        first_message: form.first_message || undefined,
        llm_model: form.llm_model || undefined,
        tts_model: form.tts_model || undefined,
        stt_model: form.stt_model || undefined,
        voice: form.voice || undefined,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        transfer_number: form.transfer_number || undefined,
        enable_transfer: form.enable_transfer,
        idle_timeout_seconds: form.idle_timeout_seconds,
        max_call_duration_seconds: form.max_call_duration_seconds,
        status: form.status || undefined,
      };
      await putVoicebot(botId(selectedRow), payload);
      toast.success("Voicebot updated");
      setShowEditModal(false);
      setSelectedRow(null);
      fetchVoicebots();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Update failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    const id = botId(selectedRow);
    if (!id) {
      toast.error("Cannot delete: missing bot id");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteVoicebot(id, selectedCompanyId ? { company_id: selectedCompanyId } : undefined);
      toast.success("Voicebot deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchVoicebots();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || (e?.message as string) || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formFields = (
    <>
      <Form.Group className="mb-2">
        <Form.Label>Company *</Form.Label>
        <Form.Select
          value={form.company_id}
          onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))}
          required
        >
          <option value="">Select company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Name *</Form.Label>
        <Form.Control
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          placeholder="e.g. Sales Bot"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="AI bot for sales calls"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Status</Form.Label>
        <Form.Select
          value={form.status ?? "active"}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>System prompt</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.system_prompt ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
          placeholder="You are a professional sales representative..."
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>First message</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.first_message ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, first_message: e.target.value }))}
          placeholder="Hello! This is Sarah calling from..."
        />
      </Form.Group>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>LLM model</Form.Label>
            <Form.Control
              value={form.llm_model ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, llm_model: e.target.value }))}
              placeholder="gpt-4o-mini"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>TTS model</Form.Label>
            <Form.Control
              value={form.tts_model ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tts_model: e.target.value }))}
              placeholder="gpt-4o-mini-tts"
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>STT model</Form.Label>
            <Form.Control
              value={form.stt_model ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, stt_model: e.target.value }))}
              placeholder="nova-3"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>Voice</Form.Label>
            <Form.Control
              value={form.voice ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, voice: e.target.value }))}
              placeholder="alloy"
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>Temperature</Form.Label>
            <Form.Control
              type="number"
              step={0.1}
              min={0}
              max={2}
              value={form.temperature ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="0.7"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>Max tokens</Form.Label>
            <Form.Control
              type="number"
              value={form.max_tokens ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_tokens: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="150"
            />
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-2">
        <Form.Check
          type="switch"
          id="enable-transfer"
          label="Enable transfer"
          checked={form.enable_transfer ?? false}
          onChange={(e) => setForm((f) => ({ ...f, enable_transfer: e.target.checked }))}
        />
      </Form.Group>
      {form.enable_transfer && (
        <Form.Group className="mb-2">
          <Form.Label>Transfer number</Form.Label>
          <Form.Control
            value={form.transfer_number ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, transfer_number: e.target.value }))}
            placeholder="+1234567890"
          />
        </Form.Group>
      )}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>Idle timeout (seconds)</Form.Label>
            <Form.Control
              type="number"
              value={form.idle_timeout_seconds ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, idle_timeout_seconds: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="30"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label>Max call duration (seconds)</Form.Label>
            <Form.Control
              type="number"
              value={form.max_call_duration_seconds ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_call_duration_seconds: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="300"
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Voice Bots" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0" onClick={() => router.push("/voicebot/outbound")}>
                ← Back
              </Button>
              <h2 className="mb-0">Voice Bots</h2>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Form.Select
                style={{ width: "180px" }}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
              <Form.Select
                style={{ width: "120px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
              <Button
                variant="primary"
                onClick={() => {
                  setForm({ ...defaultForm, company_id: companies[0]?.id ?? "" });
                  setShowAddModal(true);
                }}
              >
                <Plus size={18} className="me-1" /> Add Voice Bot
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericTable<VoicebotRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No voice bots found."
        loadingMessage="Loading voice bots..."
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

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Voice Bot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.company_id || !form.name}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedRow(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Voice Bot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRow(null); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.name}>
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
        itemType="voice bot"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

VoicebotsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default VoicebotsPage;
