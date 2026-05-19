import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import ToolEditSidebar from "@components/ToolEditSidebar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { useToolsProfilesPage } from "../useToolsProfilesPage";
import { getToolLabel } from "../toolsProfilesHelpers";
import { Button, Form, Modal, Spinner, Table, Badge } from "react-bootstrap";
import { FileJson, Pencil, Play, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import type { Tool } from "@utils/tools";
import React from "react";

export type ToolsProfilesPageViewProps = Readonly<{
  ctx: ReturnType<typeof useToolsProfilesPage>;
}>;

export function ToolsProfilesPageView({ ctx }: ToolsProfilesPageViewProps) {
  const {
    tools,
    loading,
    showDeleteModal,
    setShowDeleteModal,
    showTestModal,
    setShowTestModal,
    showExecutorModal,
    setShowExecutorModal,
    executorConfig,
    executorLoading,
    executorFetchError,
    reloadExecutorLoading,
    selectedTool,
    setSelectedTool,
    sidebarOpen,
    isEditing,
    formState,
    setFormState,
    submitLoading,
    testParamsJson,
    setTestParamsJson,
    testLoading,
    openAdd,
    openEdit,
    closeSidebar,
    handleSubmit,
    handleDelete,
    handleToggle,
    openTest,
    handleTest,
    handleReloadExecutor,
    handleViewExecutor,
  } = ctx;

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

    return tools.map((tool: Tool) => (
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
          <Badge bg={tool.enabled ? "success" : "secondary"}>{tool.enabled ? "Enabled" : "Disabled"}</Badge>
        </td>
        <td className="text-end">
          <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(tool)} title="Edit">
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
          <Button variant="light" size="sm" className="me-1" onClick={() => openTest(tool)} title="Test">
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
    if (executorFetchError) {
      return <p className="text-danger mb-0">Failed to load executor config.</p>;
    }
    if (executorLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }
    if (executorConfig !== null && executorConfig !== undefined) {
      return (
        <pre className="bg-light p-3 rounded small mb-0" style={{ maxHeight: 400, overflow: "auto" }}>
          {JSON.stringify(executorConfig, null, 2)}
        </pre>
      );
    }
    return <p className="text-muted mb-0">No config or failed to load.</p>;
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
              {executorLoading ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <FileJson size={16} className="me-2" />
              )}
              View Executor
            </Button>
            <Button variant="outline-secondary" onClick={handleReloadExecutor} disabled={reloadExecutorLoading}>
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

      <ToolEditSidebar
        isOpen={sidebarOpen}
        isEditing={isEditing}
        formState={formState}
        setFormState={setFormState}
        submitLoading={submitLoading}
        onClose={closeSidebar}
        onSubmit={handleSubmit}
      />

      <Modal
        show={showTestModal}
        onHide={() => {
          setShowTestModal(false);
          setSelectedTool(null);
        }}
        centered
      >
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
          <Button
            variant="secondary"
            onClick={() => {
              setShowTestModal(false);
              setSelectedTool(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTest} disabled={testLoading}>
            {testLoading ? <Spinner size="sm" className="me-2" /> : null}
            Run Test
          </Button>
        </Modal.Footer>
      </Modal>

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

      <Modal show={showExecutorModal} onHide={() => setShowExecutorModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Executor config (LangGraph)</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderExecutorContent()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExecutorModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
