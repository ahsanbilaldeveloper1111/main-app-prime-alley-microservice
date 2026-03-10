import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getBots,
  getBot,
  getBotVersions,
  rollbackBot,
  postBots,
  deleteBot,
  publishBot,
  unpublishBot,
  getCompanies,
  type CreateBotPayload,
  type BotConfiguration,
  type BotVersionItem,
} from "@utils/voicebot/inbound";
import { Row, Col, Button, Modal, Form, Spinner, Nav, Tab, Accordion } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Plus, Pencil, Trash2, Send, Undo2, Eye, History } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

interface BotRow {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  company?: string;
  configuration?: BotConfiguration;
  [key: string]: unknown;
}

const defaultConfig: BotConfiguration = {
  instructions: "",
  knowledge_base: "",
  voice_name: "onyx",
  voice_model: "gpt-4o-mini-tts",
  voice_speed: 1,
  llm_model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  greeting_message: "",
  transfer_enabled: false,
  max_duration: 1800,
  idle_timeout: 300,
};

/** Renders version configuration_snapshot (API shape: instructions, knowledge_base, voice_settings, llm_settings, behavior_settings, sip_settings) */
const VersionConfigSnapshot = ({ config }: { config: Record<string, unknown> }) => {
  const v = (o: Record<string, unknown> | undefined, k: string) => (o && typeof o[k] !== "undefined" ? String(o[k]) : "—");
  const voice = (config.voice_settings as Record<string, unknown>) ?? {};
  const llm = (config.llm_settings as Record<string, unknown>) ?? {};
  const behavior = (config.behavior_settings as Record<string, unknown>) ?? {};
  const sip = (config.sip_settings as Record<string, unknown>) ?? {};
  return (
    <div className="" style={{ maxHeight: "320px", overflow: "auto" }}>
      <table className="table table-bordered mb-2">
        <tbody>
          <tr><th style={{ width: "140px" }}>Instructions</th><td><div className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{v(config, "instructions")}</div></td></tr>
          <tr><th>Knowledge Base</th><td><div className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{v(config, "knowledge_base")}</div></td></tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">Voice settings</h6>
      <table className="table  table-bordered mb-2">
        <tbody>
          <tr><th style={{ width: "140px" }}>Voice</th><td>{v(voice, "voice")}</td></tr>
          <tr><th>Model</th><td>{v(voice, "model")}</td></tr>
          <tr><th>Speed</th><td>{v(voice, "speed")}</td></tr>
          <tr><th>Instructions</th><td><div className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{v(voice, "instructions")}</div></td></tr>
        </tbody>
      </table>
      <h6 className="mb-1 mt-2">LLM settings</h6>
      <table className="table table-bordered mb-2">
        <tbody>
          <tr><th style={{ width: "140px" }}>Model</th><td>{v(llm, "model")}</td></tr>
          <tr><th>Temperature</th><td>{v(llm, "temperature")}</td></tr>
          <tr><th>Max tokens</th><td>{v(llm, "max_tokens")}</td></tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">Behavior settings</h6>
      <table className="table table-sm table-bordered mb-2">
        <tbody>
          <tr><th style={{ width: "140px" }}>Greeting</th><td><div className="mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{v(behavior, "greeting")}</div></td></tr>

          <tr><th>Transfer enabled</th><td>{v(behavior, "transfer_enabled")}</td></tr>
          <tr><th>Transfer number</th><td>{v(behavior, "transfer_number")}</td></tr>
          <tr><th>Max duration (s)</th><td>{v(behavior, "max_duration")}</td></tr>
          <tr><th>Idle timeout (s)</th><td>{v(behavior, "idle_timeout")}</td></tr>
          <tr><th>Allow interruptions</th><td>{v(behavior, "allow_interruptions")}</td></tr>
          <tr><th>Min endpointing delay</th><td>{v(behavior, "min_endpointing_delay")}</td></tr>
          <tr><th>Noise cancellation</th><td>{v(behavior, "noise_cancellation")}</td></tr>
        </tbody>
      </table>
      <h6 className="mb-2 mt-2">SIP settings</h6>
      <table className="table table-sm table-bordered mb-0">
        <tbody>
          <tr><th style={{ width: "140px" }}>Trunk ID</th><td>{v(sip, "trunk_id")}</td></tr>
          <tr><th>Phone number</th><td>{v(sip, "phone_number")}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

const BotsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<BotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBotId, setViewBotId] = useState<string | null>(null);
  const [viewBot, setViewBot] = useState<Record<string, unknown> | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewActiveTab, setViewActiveTab] = useState("basic");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBotId, setHistoryBotId] = useState<string | null>(null);
  const [historyBotName, setHistoryBotName] = useState<string>("");
  const [historyVersions, setHistoryVersions] = useState<BotVersionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BotRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateBotPayload>({
    company: "",
    name: "",
    description: "",
    status: "draft",
    configuration: { ...defaultConfig },
  });

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: false });
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      const opts = (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c.company_id ?? c.id ?? "",
        company_id: c.company_id ?? c.id,
        name: c.name ?? "",
      }));
      setCompanies(opts);
      if (opts.length && !form.company) setForm((f) => ({ ...f, company: opts[0].id }));
    } catch (_) {
      setCompanies([]);
    }
  }, []);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    try {
      const params: { company_id?: string; limit: number; status?: string } = { limit: 100 };
      if (companyFilter) params.company_id = companyFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await getBots(params);
      let list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      if (statusFilter && Array.isArray(list)) {
        list = list.filter((row: BotRow) => String(row.status ?? "") === statusFilter);
      }
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to load bots");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (showViewModal && viewBotId) {
      setViewLoading(true);
      getBot(viewBotId)
        .then((data: Record<string, unknown>) => setViewBot(data))
        .catch(() => toast.error("Failed to load bot details"))
        .finally(() => setViewLoading(false));
    } else {
      setViewBot(null);
    }
  }, [showViewModal, viewBotId]);

  useEffect(() => {
    if (showHistoryModal && historyBotId) {
      setHistoryLoading(true);
      getBotVersions(historyBotId)
        .then(setHistoryVersions)
        .catch(() => {
          toast.error("Failed to load version history");
          setHistoryVersions([]);
        })
        .finally(() => setHistoryLoading(false));
    } else {
      setHistoryVersions([]);
    }
  }, [showHistoryModal, historyBotId]);

  const botId = (row: BotRow) => row.id ?? "";

  const columns: TableColumn<BotRow>[] = [
    { key: "name", label: "Name", sortable: true },
    ...(isAdmin ? [{ key: "company_name", label: "Company", render: (r: BotRow) => (r.company_name as string) || "—" }] : []),
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.status === "published" ? (
          <span className="status-badge success">Published</span>
        ) : (
          <span className="status-badge secondary">Draft</span>
        ),
    },
    
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          <Button
            title="View"
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              setViewBotId(botId(row));
              setShowViewModal(true);
            }}
          >
            <Eye size={14} />
          </Button>
          <Button
            title="Edit"
            size="sm"
            variant="outline-primary"
            onClick={() => router.push(`/voicebot/inbound/bots/edit?id=${encodeURIComponent(botId(row))}`)}
          >
            <Pencil size={14} />
          </Button>
          {row.status !== "published" && (
            <Button
              title="Publish"
              size="sm"
              variant="outline-success"
              onClick={async () => {
                try {
                  await publishBot(botId(row));
                  toast.success("Bot published");
                  fetchBots();
                } catch (e: any) {
                  toast.error(e?.response?.data?.detail || "Publish failed");
                }
              }}
            >
              <Send size={14} />
            </Button>
          )}
          {row.status === "published" && (
            <Button
              title="Unpublish"
              size="sm"
              variant="outline-warning"
              onClick={async () => {
                try {
                  await unpublishBot(botId(row));
                  toast.success("Bot unpublished");
                  fetchBots();
                } catch (e: any) {
                  toast.error(e?.response?.data?.detail || "Unpublish failed");
                }
              }}
            >
              <Undo2 size={14} />
            </Button>
          )}
          <Button
            title="Show history"
            size="sm"
            variant="outline-info"
            onClick={() => {
              setHistoryBotId(botId(row));
              setHistoryBotName(row.name ?? "");
              setShowHistoryModal(true);
            }}
          >
            <History size={14} />
          </Button>
          <Button
            title="Delete"
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
    if (!form.company || !form.name) {
      toast.error("Company and name are required");
      return;
    }
    setFormLoading(true);
    try {
      await postBots(form);
      toast.success("Bot created");
      setShowAddModal(false);
      setForm({ company: form.company, name: "", description: "", status: "draft", configuration: { ...defaultConfig } });
      fetchBots();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Create failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    try {
      await deleteBot(botId(selectedRow));
      toast.success("Bot deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchBots();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const configForm = (
    <>
      <Form.Group className="mb-2">
        <Form.Label>Instructions</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.configuration?.instructions ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, configuration: { ...f.configuration, instructions: e.target.value } }))}
          placeholder="Bot system instructions"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Greeting message</Form.Label>
        <Form.Control
          value={form.configuration?.greeting_message ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, configuration: { ...f.configuration, greeting_message: e.target.value } }))}
          placeholder="Hello! How can I help?"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Voice name</Form.Label>
        <Form.Control
          value={form.configuration?.voice_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, configuration: { ...f.configuration, voice_name: e.target.value } }))}
          placeholder="onyx"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>LLM model</Form.Label>
        <Form.Control
          value={form.configuration?.llm_model ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, configuration: { ...f.configuration, llm_model: e.target.value } }))}
          placeholder="gpt-4o-mini"
        />
      </Form.Group>
    </>
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Bots" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Bots</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              
              {String(session?.user?.is_admin ?? "") === "1" && (
              <Form.Select
                style={{ width: "200px" }}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
              )}
              <Form.Select
                style={{ width: "140px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Bots</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Form.Select>

              <Button variant="primary" onClick={() => { router.push("/voicebot/inbound/bots/create"); }}>
                <Plus size={18} className="me-1" /> Add Bot
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericTable<BotRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No bots found."
        loadingMessage="Loading bots..."
        pagination={{
          currentPage: 1,
          rowsPerPage: 10,
          totalRows: data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        uniqueKey="id"
        hover
        striped={false}
      />

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Bot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Company *</Form.Label>
              <Form.Select
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
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
                placeholder="Bot name"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
              />
            </Form.Group>
            {configForm}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.company || !form.name}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setViewBotId(null); setViewBot(null); setViewActiveTab("basic"); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bot Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" />
            </div>
          ) : viewBot ? (
            <Tab.Container activeKey={viewActiveTab} onSelect={(k) => setViewActiveTab(k ?? "basic")}>
              <Nav variant="tabs" className="mb-3">
                <Nav.Item><Nav.Link eventKey="basic">Basic Information</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="configuration">Configuration</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="voice">Voice Settings</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="llm">LLM Settings</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="behavior">Behavior</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="sip">SIP Settings</Nav.Link></Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="basic">
                  <table className="table table-sm table-bordered mb-0">
                    <tbody>
                      <tr><th style={{ width: "140px" }}>Name</th><td>{String(viewBot.name ?? "—")}</td></tr>
                      <tr><th>Description</th><td>{String(viewBot.description ?? "—")}</td></tr>
                      <tr><th>Status</th><td>{viewBot.status === "published" ? <span className="status-badge success">Published</span> : <span className="status-badge secondary">Draft</span>}</td></tr>
                      <tr><th>Company</th><td>{String(viewBot.company ?? "—")}</td></tr>
                    </tbody>
                  </table>
                </Tab.Pane>
                <Tab.Pane eventKey="configuration">
                  {viewBot.configuration && typeof viewBot.configuration === "object" ? (
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        <tr><th style={{ width: "140px" }}>Instructions</th><td><pre className="mb-0 small text-break" style={{ whiteSpace: "pre-wrap" }}>{String((viewBot.configuration as Record<string, unknown>).instructions ?? "—")}</pre></td></tr>
                        <tr><th>Knowledge Base</th><td><pre className="mb-0 small text-break" style={{ whiteSpace: "pre-wrap" }}>{String((viewBot.configuration as Record<string, unknown>).knowledge_base ?? "—")}</pre></td></tr>
                      </tbody>
                    </table>
                  ) : <p className="text-muted mb-0">No configuration.</p>}
                </Tab.Pane>
                <Tab.Pane eventKey="voice">
                  {viewBot.configuration && typeof viewBot.configuration === "object" ? (
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        <tr><th style={{ width: "160px" }}>Voice</th><td>{String((viewBot.configuration as Record<string, unknown>).voice_name ?? "—")}</td></tr>
                        <tr><th>Voice Model</th><td>{String((viewBot.configuration as Record<string, unknown>).voice_model ?? "—")}</td></tr>
                        <tr><th>Voice Speed</th><td>{String((viewBot.configuration as Record<string, unknown>).voice_speed ?? "—")}</td></tr>
                        <tr><th>Voice Instructions</th><td>{String((viewBot.configuration as Record<string, unknown>).voice_instructions ?? "—")}</td></tr>
                        <tr><th>Greeting Message</th><td>{String((viewBot.configuration as Record<string, unknown>).greeting_message ?? "—")}</td></tr>
                      </tbody>
                    </table>
                  ) : <p className="text-muted mb-0">No voice settings.</p>}
                </Tab.Pane>
                <Tab.Pane eventKey="llm">
                  {viewBot.configuration && typeof viewBot.configuration === "object" ? (
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        <tr><th style={{ width: "160px" }}>LLM Model</th><td>{String((viewBot.configuration as Record<string, unknown>).llm_model ?? "—")}</td></tr>
                        <tr><th>Temperature</th><td>{String((viewBot.configuration as Record<string, unknown>).temperature ?? "—")}</td></tr>
                        <tr><th>Max Tokens</th><td>{String((viewBot.configuration as Record<string, unknown>).max_tokens ?? "—")}</td></tr>
                      </tbody>
                    </table>
                  ) : <p className="text-muted mb-0">No LLM settings.</p>}
                </Tab.Pane>
                <Tab.Pane eventKey="behavior">
                  {viewBot.configuration && typeof viewBot.configuration === "object" ? (
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        <tr><th style={{ width: "160px" }}>Transfer Enabled</th><td>{String((viewBot.configuration as Record<string, unknown>).transfer_enabled ?? false)}</td></tr>
                        <tr><th>Transfer Number</th><td>{String((viewBot.configuration as Record<string, unknown>).transfer_number ?? "—")}</td></tr>
                        <tr><th>Max Duration (s)</th><td>{String((viewBot.configuration as Record<string, unknown>).max_duration ?? "—")}</td></tr>
                        <tr><th>Idle Timeout (s)</th><td>{String((viewBot.configuration as Record<string, unknown>).idle_timeout ?? "—")}</td></tr>
                        <tr><th>Allow Interruptions</th><td>{String((viewBot.configuration as Record<string, unknown>).allow_interruptions ?? "—")}</td></tr>
                        <tr><th>Noise Cancellation</th><td>{String((viewBot.configuration as Record<string, unknown>).noise_cancellation ?? "—")}</td></tr>
                        <tr><th>Min Endpointing Delay</th><td>{String((viewBot.configuration as Record<string, unknown>).min_endpointing_delay ?? "—")}</td></tr>
                      </tbody>
                    </table>
                  ) : <p className="text-muted mb-0">No behavior settings.</p>}
                </Tab.Pane>
                <Tab.Pane eventKey="sip">
                  {viewBot.configuration && typeof viewBot.configuration === "object" ? (
                    <table className="table table-sm table-bordered mb-0">
                      <tbody>
                        <tr><th style={{ width: "160px" }}>SIP Trunk ID</th><td>{String((viewBot.configuration as Record<string, unknown>).sip_trunk_id ?? "—")}</td></tr>
                        <tr><th>Phone Number</th><td>{String((viewBot.configuration as Record<string, unknown>).phone_number ?? "—")}</td></tr>
                      </tbody>
                    </table>
                  ) : <p className="text-muted mb-0">No SIP settings.</p>}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          ) : (
            <p className="text-muted mb-0">No details to show.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowViewModal(false); setViewBotId(null); setViewBot(null); setViewActiveTab("basic"); }}>Close</Button>
          {viewBot && viewBotId && (
            <Button variant="primary" onClick={() => { setShowViewModal(false); setViewBotId(null); setViewBot(null); setViewActiveTab("basic"); router.push(`/voicebot/inbound/bots/edit?id=${encodeURIComponent(viewBotId)}`); }}>Edit</Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showHistoryModal} onHide={() => { setShowHistoryModal(false); setHistoryBotId(null); setHistoryBotName(""); setHistoryVersions([]); setRollbackVersion(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Version history — {historyBotName || "Bot"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" />
            </div>
          ) : historyVersions.length === 0 ? (
            <p className="text-muted mb-0">No version history.</p>
          ) : (
            <Accordion defaultActiveKey="">
              {historyVersions.map((v) => (
                <Accordion.Item key={v.id} eventKey={v.id}>
                  <Accordion.Header>
                    <span className="me-2">v{v.version}</span>
                    <span className="text-muted  me-2">
                      {v.created_at ? new Date(v.created_at).toLocaleString() : "—"}
                    </span>
                    {v.change_description && (
                      <span className=" me-2">— {v.change_description}</span>
                    )}
                  </Accordion.Header>
                  <Accordion.Body>
                    {v.configuration_snapshot && typeof v.configuration_snapshot === "object" ? (
                      <VersionConfigSnapshot config={v.configuration_snapshot as Record<string, unknown>} />
                    ) : (
                      <p className="text-muted mb-0 small">No configuration snapshot.</p>
                    )}
                    {historyBotId && (
                      <div className="mt-3 d-flex justify-content-end">
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => {
                            if (!historyBotId) return;
                            setRollbackVersion(v.version);
                            rollbackBot(historyBotId, { version: v.version })
                              .then(() => {
                                toast.success(`Rolled back to v${v.version}`);
                                setShowHistoryModal(false);
                                setHistoryBotId(null);
                                setHistoryBotName("");
                                setHistoryVersions([]);
                                fetchBots();
                              })
                              .catch((err: any) => {
                                toast.error(err?.response?.data?.detail || "Rollback failed");
                              })
                              .finally(() => setRollbackVersion(null));
                          }}
                          disabled={rollbackVersion !== null}
                        >
                          {rollbackVersion === v.version ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                          Rollback to v{v.version}
                        </Button>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowHistoryModal(false); setHistoryBotId(null); setHistoryBotName(""); setHistoryVersions([]); setRollbackVersion(null); }}>Close</Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="bot"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

BotsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default BotsPage;
