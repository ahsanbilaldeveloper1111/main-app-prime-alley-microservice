import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
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
import ConfirmModal from "@pages/partial/ConfirmModal";
import ToolEditSidebar, { type ToolFormState } from "@components/ToolEditSidebar";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: ToolFormState = {
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFormFromTool(tool: Tool): ToolFormState {
  return {
    display_name: tool.display_name ?? "",
    tool_name: tool.tool_name ?? "",
    description: tool.description ?? "",
    method: tool.method ?? "GET",
    endpoint_url: tool.endpoint_url ?? "",
    auth_type: tool.auth_type ?? "none",
    auth_config: tool.auth_config ?? {},
    enabled: tool.enabled ?? true,
    parameters: tool.parameters ?? [],
    headers: tool.headers ?? [],
    response_mapping: tool.response_mapping ?? {},
  };
}

function getToolLabel(tool: Tool | null): string {
  return tool?.display_name ?? tool?.tool_name ?? "";
}

function isCreatePayloadValid(payload: ToolFormState): boolean {
  return (
    Boolean(String(payload.tool_name ?? "").trim()) &&
    Boolean(String(payload.display_name ?? "").trim()) &&
    Boolean(String(payload.endpoint_url ?? "").trim())
  );
}

function isUpdatePayloadValid(tool: Tool | null, payload: ToolFormState): boolean {
  return (
    Boolean(tool?.id) &&
    Boolean(payload.display_name?.trim()) &&
    Boolean(payload.endpoint_url?.trim())
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const ToolProfiles = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showExecutorModal, setShowExecutorModal] = useState(false);
  const [executorConfig, setExecutorConfig] = useState<unknown>(null);
  const [executorLoading, setExecutorLoading] = useState(false);
  const [reloadExecutorLoading, setReloadExecutorLoading] = useState(false);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ToolFormState>(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [testParamsJson, setTestParamsJson] = useState("{}");
  const [testLoading, setTestLoading] = useState(false);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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

  // ─── Sidebar open/close ───────────────────────────────────────────────────

  const openAdd = () => {
    setFormState(EMPTY_FORM);
    setIsEditing(false);
    setSelectedTool(null);
    setSidebarOpen(true);
  };

  const openEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setFormState(buildFormFromTool(tool));
    setIsEditing(true);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedTool(null);
  };

  // ─── CRUD handlers ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!isCreatePayloadValid(formState)) {
      toast.error("Tool name, display name, and endpoint URL are required");
      return;
    }
    setSubmitLoading(true);
    try {
      await createTool(formState as ToolPayload);
      toast.success("Tool created");
      closeSidebar();
      triggerRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!isUpdatePayloadValid(selectedTool, formState)) {
      toast.error("Display name and endpoint URL are required");
      return;
    }
    setSubmitLoading(true);
    try {
      await updateTool(selectedTool!.id, formState);
      toast.success("Tool updated");
      closeSidebar();
      triggerRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isEditing) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const handleDelete = async () => {
    if (!selectedTool?.id) return;
    try {
      await deleteTool(selectedTool.id);
      toast.success("Tool deleted");
      setShowDeleteModal(false);
      setSelectedTool(null);
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (tool: Tool) => {
    try {
      await toggleTool(tool.id, { enabled: !tool.enabled });
      toast.success(tool.enabled ? "Tool disabled" : "Tool enabled");
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Test ─────────────────────────────────────────────────────────────────

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

  // ─── Executor ─────────────────────────────────────────────────────────────

  const handleReloadExecutor = async () => {
    setReloadExecutorLoading(true);
    try {
      await reloadToolsExecutor();
      toast.success("Executor reloaded. Enabled tools are now in sync.");
      triggerRefresh();
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

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderTableBody = () => {
    if (tools.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-center text-muted py-4">
            No tools yet. Add a tool to get started.
          </td>
        </tr>
      );
    }

    return tools.map((tool) => (
      <tr key={tool.id}>
        <td>{tool.display_name ?? "—"}</td>
        <td>
          <code className="small">{tool.tool_name ?? "—"}</code>
        </td>
        <td>
          <Badge bg="secondary">{tool.method ?? "GET"}</Badge>
        </td>
        <td className="small text-break" style={{ maxWidth: 200 }}>
          {tool.endpoint_url ?? "—"}
        </td>
        <td>
          <Badge bg={tool.enabled ? "success" : "secondary"}>
            {tool.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </td>
        <td className="text-end">
          <Button
            variant="light"
            size="sm"
            className="me-1"
            onClick={() => openEdit(tool)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="me-1"
            onClick={() => handleToggle(tool)}
            title={tool.enabled ? "Disable" : "Enable"}
          >
            <Power size={14} />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="me-1"
            onClick={() => openTest(tool)}
            title="Test"
          >
            <Play size={14} />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="text-danger"
            onClick={() => {
              setSelectedTool(tool);
              setShowDeleteModal(true);
            }}
            title="Delete"
          >
            <Trash2 size={14} />
          </Button>
        </td>
      </tr>
    ));
  };

  const renderExecutorContent = () => {
    if (executorLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }
    if (executorConfig !== null && executorConfig !== undefined) {
      return (
        <pre
          className="bg-light p-3 rounded small mb-0"
          style={{ maxHeight: 400, overflow: "auto" }}
        >
          {JSON.stringify(executorConfig, null, 2)}
        </pre>
      );
    }
    return <p className="text-muted mb-0">No config or failed to load.</p>;
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

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
            <Button
              variant="outline-primary"
              onClick={handleViewExecutor}
              disabled={executorLoading}
            >
              {executorLoading ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <FileJson size={16} className="me-2" />
              )}
              View Executor
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleReloadExecutor}
              disabled={reloadExecutorLoading}
            >
              {reloadExecutorLoading ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <RefreshCw size={16} className="me-2" />
              )}
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
              <tbody>{renderTableBody()}</tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Add / Edit Tool Sidebar */}
      <ToolEditSidebar
        isOpen={sidebarOpen}
        isEditing={isEditing}
        formState={formState}
        setFormState={setFormState}
        submitLoading={submitLoading}
        isFormValid={
          isEditing
            ? Boolean(selectedTool?.id) &&
              Boolean(formState.display_name?.trim()) &&
              Boolean(formState.endpoint_url?.trim())
            : Boolean(formState.tool_name?.trim()) &&
              Boolean(formState.display_name?.trim()) &&
              Boolean(formState.endpoint_url?.trim())
        }
        onClose={closeSidebar}
        onSubmit={handleSubmit}
      />

      {/* Test Tool Modal */}
      <Modal
        show={showTestModal}
        onHide={() => {
          setShowTestModal(false);
          setSelectedTool(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Test Tool {selectedTool?.display_name ?? ""}
          </Modal.Title>
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
          <Button
            variant="secondary"
            onClick={() => {
              setShowTestModal(false);
              setSelectedTool(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTest}
            disabled={testLoading}
          >
            {testLoading && <Spinner size="sm" className="me-2" />}
            Run Test
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedTool(null);
        }}
        title="Delete Tool"
        description={`Are you sure you want to delete the tool "${getToolLabel(selectedTool)}"?`}
        targetName={selectedTool?.tool_name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedTool(null);
        }}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation
        requiredConfirmationText="delete"
      />

      {/* Executor Config Modal */}
      <Modal
        show={showExecutorModal}
        onHide={() => setShowExecutorModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Executor config (LangGraph)</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderExecutorContent()}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowExecutorModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

ToolProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ToolProfiles;
