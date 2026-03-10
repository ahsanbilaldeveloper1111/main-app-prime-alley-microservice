import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getBots,
  postBots,
  deleteBot,
  publishBot,
  unpublishBot,
  getCompanies,
  type CreateBotPayload,
  type BotConfiguration,
} from "@utils/voicebot/inbound";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Plus, Pencil, Trash2, Send, Undo2 } from "lucide-react";
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

const BotsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<BotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      const params = companyFilter ? { company_id: companyFilter, limit: 100 } : { limit: 100 };
      const res = await getBots(params);
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to load bots");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

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
            size="sm"
            variant="outline-primary"
            onClick={() => router.push(`/voicebot/inbound/bots/edit?id=${encodeURIComponent(botId(row))}`)}
          >
            <Pencil size={14} />
          </Button>
          <Button
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
            disabled={row.status === "published"}
          >
            <Send size={14} />
          </Button>
          <Button
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
            disabled={row.status !== "published"}
          >
            <Undo2 size={14} />
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
