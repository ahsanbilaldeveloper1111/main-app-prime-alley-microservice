import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import {
  getTools,
  createTool,
  updateTool,
  deleteTool,
  toggleTool,
  testTool,
  getToolsExecutor,
  reloadToolsExecutor,
  type Tool,
  type ToolPayload,
} from "@utils/tools";
import { Button, Form, Modal, Spinner, Table, Badge } from "react-bootstrap";
import { Plus, Pencil, Trash2, Power, Play, RefreshCw, FileJson } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import ConfirmModal from "@pages/partial/ConfirmModal";

const ToolProfiles = () => {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showExecutorModal, setShowExecutorModal] = useState(false);
  const [executorConfig, setExecutorConfig] = useState<unknown>(null);
  const [executorLoading, setExecutorLoading] = useState(false);
  const [reloadExecutorLoading, setReloadExecutorLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const [formPayload, setFormPayload] = useState<Partial<ToolPayload>>({
    display_name: "",
    tool_name: "",
    description: "",
    method: "GET",
    endpoint_url: "",
    auth_type: "none",
    auth_config: {},
    enabled: true,
    parameters: [],
    headers: [],
    response_mapping: {},
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [testParamsJson, setTestParamsJson] = useState("{}");
  const [testLoading, setTestLoading] = useState(false);

  const formPayloadRef = useRef(formPayload);
  formPayloadRef.current = formPayload;
  const addEndpointUrlRef = useRef<HTMLInputElement>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTools();
      setTools(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools, refreshKey]);

  const openAdd = () => {
    setFormPayload({
      display_name: "",
      tool_name: "",
      description: "",
      method: "GET",
      endpoint_url: "",
      auth_type: "none",
      auth_config: {},
      enabled: true,
      parameters: [],
      headers: [],
      response_mapping: {},
    });
    setShowAddModal(true);
  };

  const openEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setFormPayload({
      display_name: tool.display_name ?? "",
      description: tool.description ?? "",
      method: tool.method ?? "GET",
      endpoint_url: tool.endpoint_url ?? "",
      auth_type: tool.auth_type ?? "none",
      auth_config: tool.auth_config ?? {},
      enabled: tool.enabled ?? true,
      parameters: tool.parameters ?? [],
      headers: tool.headers ?? [],
      response_mapping: tool.response_mapping ?? {},
    });
    setShowEditModal(true);
  };

  const handleCreate = async () => {
    const payload = formPayloadRef.current;
    const endpointUrl =
      String(payload.endpoint_url ?? "").trim() ||
      (addEndpointUrlRef.current?.value ?? "").trim();
    const submitPayload = { ...payload, endpoint_url: endpointUrl };

    const missing: string[] = [];
    if (!String(submitPayload.tool_name ?? "").trim()) missing.push("Tool name");
    if (!String(submitPayload.display_name ?? "").trim()) missing.push("Display name");
    if (!endpointUrl) missing.push("Endpoint URL");
    if (missing.length > 0) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }
    setSubmitLoading(true);
    try {
      await createTool(submitPayload as ToolPayload);
      toast.success("Tool created");
      setShowAddModal(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTool?.id || !formPayload.display_name?.trim() || !formPayload.endpoint_url?.trim()) {
      toast.error("Display name and endpoint URL are required");
      return;
    }
    setSubmitLoading(true);
    try {
      await updateTool(selectedTool.id, formPayload);
      toast.success("Tool updated");
      setShowEditModal(false);
      setSelectedTool(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTool?.id) return;
    try {
      await deleteTool(selectedTool.id);
      toast.success("Tool deleted");
      setShowDeleteModal(false);
      setSelectedTool(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (tool: Tool) => {
    try {
      await toggleTool(tool.id, { enabled: !tool.enabled });
      toast.success(tool.enabled ? "Tool disabled" : "Tool enabled");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const openTest = (tool: Tool) => {
    setSelectedTool(tool);
    setTestParamsJson("{}");
    setShowTestModal(true);
  };

  const handleTest = async () => {
    if (!selectedTool?.id) return;
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(testParamsJson || "{}");
    } catch {
      toast.error("Invalid JSON for parameters");
      return;
    }
    setTestLoading(true);
    try {
      const result = await testTool(selectedTool.id, { parameters: params });
      toast.success("Test completed. Check response in console.");
      console.log("Tool test result:", result);
    } catch (e) {
      console.error(e);
    } finally {
      setTestLoading(false);
    }
  };

  const handleReloadExecutor = async () => {
    setReloadExecutorLoading(true);
    try {
      await reloadToolsExecutor();
      toast.success("Executor reloaded. Enabled tools are now in sync.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to reload executor");
    } finally {
      setReloadExecutorLoading(false);
    }
  };

  const handleViewExecutor = async () => {
    setExecutorLoading(true);
    setShowExecutorModal(true);
    setExecutorConfig(null);
    try {
      const config = await getToolsExecutor();
      setExecutorConfig(config);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load executor config");
      setExecutorConfig(undefined);
    } finally {
      setExecutorLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="" />
      <PageHeader
        title=""
        showSearch={false}
        buttons={
          <>
            <Button variant="primary" onClick={openAdd}>
              <Plus size={16} className="me-2" />
              Add Tool
            </Button>
            <Button variant="outline-primary" onClick={handleViewExecutor} disabled={executorLoading}>
              {executorLoading ? <Spinner size="sm" className="me-2" /> : <FileJson size={16} className="me-2" />}
              View Executor
            </Button>
            <Button variant="outline-secondary" onClick={handleReloadExecutor} disabled={reloadExecutorLoading}>
              {reloadExecutorLoading ? <Spinner size="sm" className="me-2" /> : <RefreshCw size={16} className="me-2" />}
              Reload Executor
            </Button>
          </>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Display Name</th>
                  <th>Tool Name</th>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tools.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No tools yet. Add a tool to get started.
                    </td>
                  </tr>
                )}
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td>{tool.display_name ?? "—"}</td>
                    <td><code className="small">{tool.tool_name ?? "—"}</code></td>
                    <td><Badge bg="secondary">{tool.method ?? "GET"}</Badge></td>
                    <td className="small text-break" style={{ maxWidth: 200 }}>{tool.endpoint_url ?? "—"}</td>
                    <td>
                      <Badge bg={tool.enabled ? "success" : "secondary"}>
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(tool)} title="Edit">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="light" size="sm" className="me-1" onClick={() => handleToggle(tool)} title={tool.enabled ? "Disable" : "Enable"}>
                        <Power size={14} />
                      </Button>
                      <Button variant="light" size="sm" className="me-1" onClick={() => openTest(tool)} title="Test">
                        <Play size={14} />
                      </Button>
                      <Button variant="light" size="sm" className="text-danger" onClick={() => { setSelectedTool(tool); setShowDeleteModal(true); }} title="Delete">
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Tool Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Tool</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tool Name *</Form.Label>
            <Form.Control
              value={formPayload.tool_name ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, tool_name: e.target.value }))}
              placeholder="e.g. get_faqs"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Display Name *</Form.Label>
            <Form.Control
              value={formPayload.display_name ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, display_name: e.target.value }))}
              placeholder="e.g. Get FAQs"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formPayload.description ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, description: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Method *</Form.Label>
            <Form.Select
              value={formPayload.method ?? "GET"}
              onChange={(e) => setFormPayload((p) => ({ ...p, method: e.target.value }))}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Endpoint URL *</Form.Label>
            <Form.Control
              ref={addEndpointUrlRef}
              value={formPayload.endpoint_url ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, endpoint_url: e.target.value }))}
              placeholder="https://..."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              label="Enabled"
              checked={!!formPayload.enabled}
              onChange={(e) => setFormPayload((p) => ({ ...p, enabled: e.target.checked }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={submitLoading}>
            {submitLoading ? <Spinner size="sm" className="me-2" /> : null}
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Tool Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedTool(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Tool</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Display Name *</Form.Label>
            <Form.Control
              value={formPayload.display_name ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, display_name: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formPayload.description ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, description: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Method *</Form.Label>
            <Form.Select
              value={formPayload.method ?? "GET"}
              onChange={(e) => setFormPayload((p) => ({ ...p, method: e.target.value }))}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Endpoint URL *</Form.Label>
            <Form.Control
              value={formPayload.endpoint_url ?? ""}
              onChange={(e) => setFormPayload((p) => ({ ...p, endpoint_url: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              label="Enabled"
              checked={!!formPayload.enabled}
              onChange={(e) => setFormPayload((p) => ({ ...p, enabled: e.target.checked }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedTool(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} disabled={submitLoading}>
            {submitLoading ? <Spinner size="sm" className="me-2" /> : null}
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Test Tool Modal */}
      <Modal show={showTestModal} onHide={() => { setShowTestModal(false); setSelectedTool(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Test Tool {selectedTool?.display_name ?? ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Parameters (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={testParamsJson}
              onChange={(e) => setTestParamsJson(e.target.value)}
              placeholder='{"tenant_id": "tenant123"}'
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowTestModal(false); setSelectedTool(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleTest} disabled={testLoading}>
            {testLoading ? <Spinner size="sm" className="me-2" /> : null}
            Run Test
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedTool(null); }}
        title="Delete Tool"
        description={`Are you sure you want to delete the tool "${selectedTool?.display_name ?? selectedTool?.tool_name ?? ""}"?`}
        targetName={selectedTool?.tool_name ?? ""}
        onConfirm={() => handleDelete()}
        onCancel={() => { setShowDeleteModal(false); setSelectedTool(null); }}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />

      {/* Executor config modal */}
      <Modal show={showExecutorModal} onHide={() => setShowExecutorModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Executor config (LangGraph)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {executorLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : executorConfig !== null && executorConfig !== undefined ? (
            <pre className="bg-light p-3 rounded small mb-0" style={{ maxHeight: 400, overflow: "auto" }}>
              {JSON.stringify(executorConfig, null, 2)}
            </pre>
          ) : (
            <p className="text-muted mb-0">No config or failed to load.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExecutorModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

ToolProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ToolProfiles;
