import PageHeader from "@components/PageHeader";
import type { TableColumn } from "@components/GenericTable";
import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { TicketModule } from "../ticketModulesTypes";
import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import Select, { type SingleValue } from "react-select";
import { Package, Eye, Info } from "lucide-react";

type ExtRow = { id?: string | number; display_name?: string };

type UserExtensionOption = { value: string; label: string };

export type TicketModulesPageViewProps = Readonly<{
  embeddedInMainSettings?: boolean;
  extensions: ExtRow[];
  data: TicketModule[];
  loading: boolean;
  columns: TableColumn<TicketModule>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  canViewList: boolean;
  canCreate: boolean;
  colorSuggestions: readonly string[];
  showEditModuleModal: boolean;
  selectedModuleName: string;
  selectedModuleDescription: string;
  selectedModuleColor: string;
  selectedModuleUserExtension: string | null;
  onSelectedModuleUserExtensionChange: (v: string | null) => void;
  onEditModuleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditModuleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEditModuleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetSelectedModuleColor: (c: string) => void;
  onSubmitEditModule: () => void;
  onCloseEditModuleModal: () => void;
  showDeleteModuleModal: boolean;
  deleteTargetName: string;
  onSubmitDeleteModule: () => void;
  onCloseDeleteModuleModal: () => void;
  showCreateModuleModal: boolean;
  newModuleName: string;
  newModuleDescription: string;
  newModuleColor: string;
  newModuleUserExtension: string | null;
  onNewModuleUserExtensionChange: (v: string | null) => void;
  onNewModuleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewModuleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNewModuleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetNewModuleColor: (c: string) => void;
  onSubmitCreateModule: () => void;
  onOpenCreateModuleModal: () => void;
  onCloseCreateModuleModal: () => void;
  showSubmoduleModal: boolean;
  selectedModuleForSubmodules: TicketModule | null;
  submodules: { id: string | number; name?: string; description?: string }[];
  onCloseSubmoduleModal: () => void;
  onDeleteSubmodule: (sub: { id: string | number; name?: string }) => void;
}>;

export const TicketModulesPageView: React.FC<TicketModulesPageViewProps> = ({
  embeddedInMainSettings = false,
  extensions,
  data,
  loading,
  columns,
  currentPage,
  rowsPerPage,
  totalRows,
  searchValue,
  onSearchChange,
  onPaginationChange,
  canViewList,
  canCreate,
  colorSuggestions,
  showEditModuleModal,
  selectedModuleName,
  selectedModuleDescription,
  selectedModuleColor,
  selectedModuleUserExtension,
  onSelectedModuleUserExtensionChange,
  onEditModuleNameChange,
  onEditModuleDescriptionChange,
  onEditModuleColorChange,
  onSetSelectedModuleColor,
  onSubmitEditModule,
  onCloseEditModuleModal,
  showDeleteModuleModal,
  deleteTargetName,
  onSubmitDeleteModule,
  onCloseDeleteModuleModal,
  showCreateModuleModal,
  newModuleName,
  newModuleDescription,
  newModuleColor,
  newModuleUserExtension,
  onNewModuleUserExtensionChange,
  onNewModuleNameChange,
  onNewModuleDescriptionChange,
  onNewModuleColorChange,
  onSetNewModuleColor,
  onSubmitCreateModule,
  onOpenCreateModuleModal,
  onCloseCreateModuleModal,
  showSubmoduleModal,
  selectedModuleForSubmodules,
  submodules,
  onCloseSubmoduleModal,
  onDeleteSubmodule,
}) => {
  const addButton = canCreate ? (
    <Button variant="primary" size="sm" onClick={onOpenCreateModuleModal}>
      New Module
    </Button>
  ) : null;

  return (
  <div className={embeddedInMainSettings ? "tickets-settings-page" : undefined}>
    {embeddedInMainSettings ? (
      <SettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search modules..."
        actions={addButton}
      />
    ) : (
      <PageHeader title="" buttons={addButton} />
    )}

    {canViewList ? (
      <EmbeddedSettingsTable<TicketModule>
        embedded={embeddedInMainSettings}
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No modules found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [15, 25, 50, 100],
        }}
        onPaginationChange={onPaginationChange}
        uniqueKey="id"
        toolbar={{
          showSearch: true,
          searchValue,
          searchPlaceholder: "Search modules...",
          onSearchChange,
        }}
      />
    ) : null}

    <FormModal
      show={showEditModuleModal}
      onHide={onCloseEditModuleModal}
      title="Edit Module"
      size="lg"
      titleIcon={<Package size={20} className="text-primary" />}
      desc="Update the module details below"
      formHtml={
        <>
          <div className="form-group mb-3">
            <label
              htmlFor="editModuleName"
              className="fw-semibold d-flex align-items-center gap-2 form-label"
            >
              Module Name <span className="text-danger">*</span>
              <span className="text-muted ms-2" title="Enter module name">
                <Info size={14} />
              </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="editModuleName"
              value={selectedModuleName}
              onChange={onEditModuleNameChange}
              placeholder="Module Name"
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: "0.813rem" }}>
                Use descriptive names that clearly indicate the purpose of the module.
              </span>
            </Form.Text>
          </div>

          <div className="form-group mb-3">
            <label
              htmlFor="editModuleDescription"
              className="fw-semibold d-flex align-items-center gap-2 form-label"
            >
              Module Description <span className="text-danger">*</span>
              <span className="text-muted ms-2" title="Enter module description">
                <Info size={14} />
              </span>
            </label>
            <textarea
              className="form-control"
              id="editModuleDescription"
              value={selectedModuleDescription}
              onChange={onEditModuleDescriptionChange}
              placeholder="Module Description"
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: "0.813rem" }}>Provide a clear description of the module.</span>
            </Form.Text>
          </div>

          <Row>
            <Col md={6}>
              <div className="form-group mb-3">
                <label
                  htmlFor="editModuleColor"
                  className="fw-semibold d-flex align-items-center gap-2 form-label"
                >
                  Color <span className="text-danger">*</span>
                  <span className="text-muted ms-2" title="Select a color">
                    <Info size={14} />
                  </span>
                </label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    id="editModuleColorPicker"
                    value={selectedModuleColor}
                    onChange={onEditModuleColorChange}
                    style={{ width: "50px", height: "38px" }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    id="editModuleColor"
                    value={selectedModuleColor}
                    onChange={onEditModuleColorChange}
                    placeholder="e.g., #FF5733"
                  />
                </div>
                <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                  <Info size={12} />
                  <span style={{ fontSize: "0.813rem" }}>Choose colors that align with module meaning.</span>
                </Form.Text>
                <div className="d-flex gap-2 mt-2">
                  {colorSuggestions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Select color ${color}`}
                      onClick={() => onSetSelectedModuleColor(color)}
                      className="p-0"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        backgroundColor: color,
                        cursor: "pointer",
                        border:
                          selectedModuleColor === color ? "3px solid #000" : "2px solid #dee2e6",
                        transition: "all 0.2s",
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label
                  htmlFor="editModuleUserExtension"
                  className="fw-semibold d-flex align-items-center gap-2 form-label"
                >
                  User Extension (Optional){" "}
                  <span className="text-muted ms-2" title="Select a user extension">
                    <Info size={14} />
                  </span>
                </label>
                <Select<UserExtensionOption>
                  id="editModuleUserExtension"
                  value={
                    selectedModuleUserExtension
                      ? {
                          value: selectedModuleUserExtension,
                          label:
                            extensions.find(
                              (ext) => ext.id?.toString() === selectedModuleUserExtension?.toString(),
                            )?.display_name || "",
                        }
                      : null
                  }
                  onChange={(selectedOption: SingleValue<UserExtensionOption>) =>
                    onSelectedModuleUserExtensionChange(selectedOption?.value ?? null)
                  }
                  options={extensions.map((ext) => ({
                    value: String(ext.id),
                    label: ext.display_name ?? "",
                  }))}
                  placeholder="Select User Extension (Optional)"
                  isClearable
                  isSearchable
                />
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="border-0 bg-light mt-3">
                <Card.Body className="p-3">
                  <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <Eye size={16} />
                    Preview
                  </Form.Label>
                  <div className="d-flex align-items-center gap-3 p-3 bg-white rounded border">
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: selectedModuleColor,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-medium mb-1">{selectedModuleName || "Module Name"}</div>
                      <div className="text-muted small mb-2">
                        {selectedModuleDescription || "Module description..."}
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        {selectedModuleUserExtension && (
                          <div
                            style={{
                              backgroundColor: `${selectedModuleColor}20`,
                              color: selectedModuleColor,
                              border: `1px solid ${selectedModuleColor}40`,
                            }}
                            className="px-3 py-1"
                          >
                            {extensions.find(
                              (ext) =>
                                ext.id?.toString() === selectedModuleUserExtension?.toString(),
                            )?.display_name || selectedModuleUserExtension}
                          </div>
                        )}
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "4px",
                              backgroundColor: selectedModuleColor,
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <code className="small">{selectedModuleColor || "#0d6efd"}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      }
      submitButtonText="Update Module"
      isSubmitDisabled={!selectedModuleName}
      cancelButtonText="Cancel"
      onSubmit={async () => {
        await onSubmitEditModule();
      }}
      onCancel={onCloseEditModuleModal}
      submitButtonVariant="primary"
      cancelButtonVariant="secondary"
    />

    <ConfirmModal
      show={showDeleteModuleModal}
      onHide={onCloseDeleteModuleModal}
      title="Delete Module?"
      description="Are you sure you want to delete module {targetName}? This action cannot be undone."
      targetName={deleteTargetName || ""}
      confirmButtonText="Delete"
      cancelButtonText="Cancel"
      onConfirm={async () => {
        await onSubmitDeleteModule();
      }}
      onCancel={onCloseDeleteModuleModal}
      confirmButtonVariant="danger"
      cancelButtonVariant="secondary"
    />

    <FormModal
      show={showCreateModuleModal}
      onHide={onCloseCreateModuleModal}
      title="New Module"
      size="lg"
      titleIcon={<Package size={20} className="text-primary" />}
      desc="Fill in the details below to create a new module"
      formHtml={
        <>
          <div className="form-group mb-3">
            <label
              htmlFor="newModuleName"
              className="fw-semibold d-flex align-items-center gap-2 form-label"
            >
              Module Name <span className="text-danger">*</span>
              <span className="text-muted ms-2" title="Enter module name">
                <Info size={14} />
              </span>
            </label>
            <input
              type="text"
              className="form-control"
              id="newModuleName"
              value={newModuleName}
              onChange={onNewModuleNameChange}
              placeholder="Module Name"
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: "0.813rem" }}>
                Use descriptive names that clearly indicate the purpose of the module.
              </span>
            </Form.Text>
          </div>

          <div className="form-group mb-3">
            <label
              htmlFor="newModuleDescription"
              className="fw-semibold d-flex align-items-center gap-2 form-label"
            >
              Module Description{" "}
              <span className="text-muted ms-2" title="Enter module description">
                <Info size={14} />
              </span>
            </label>
            <textarea
              className="form-control"
              id="newModuleDescription"
              value={newModuleDescription}
              onChange={onNewModuleDescriptionChange}
              placeholder="Module Description"
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: "0.813rem" }}>Provide a clear description of the module.</span>
            </Form.Text>
          </div>

          <Row>
            <Col md={6}>
              <div className="form-group mb-3">
                <label
                  htmlFor="newModuleColor"
                  className="fw-semibold d-flex align-items-center gap-2 form-label"
                >
                  Color <span className="text-danger">*</span>
                  <span className="text-muted ms-2" title="Select a color">
                    <Info size={14} />
                  </span>
                </label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    id="colorPicker"
                    value={newModuleColor}
                    onChange={onNewModuleColorChange}
                    style={{ width: "60px", height: "48px" }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    id="newModuleColor"
                    value={newModuleColor}
                    onChange={onNewModuleColorChange}
                    placeholder="e.g., #FF5733"
                  />
                </div>
                <div className="d-flex gap-2 mt-2">
                  {colorSuggestions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Select color ${color}`}
                      onClick={() => onSetNewModuleColor(color)}
                      className="p-0"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        backgroundColor: color,
                        cursor: "pointer",
                        border: newModuleColor === color ? "3px solid #000" : "2px solid #dee2e6",
                        transition: "all 0.2s",
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-group mb-3">
                <label
                  htmlFor="newModuleUserExtension"
                  className="fw-semibold d-flex align-items-center gap-2 form-label"
                >
                  User Extension (Optional){" "}
                  <span className="text-muted ms-2" title="Select a user extension">
                    <Info size={14} />
                  </span>
                </label>
                <Select<UserExtensionOption>
                  id="newModuleUserExtension"
                  value={
                    newModuleUserExtension
                      ? {
                          value: newModuleUserExtension,
                          label:
                            extensions.find(
                              (ext) => ext.id?.toString() === newModuleUserExtension?.toString(),
                            )?.display_name || "",
                        }
                      : null
                  }
                  onChange={(selectedOption: SingleValue<UserExtensionOption>) =>
                    onNewModuleUserExtensionChange(selectedOption?.value ?? null)
                  }
                  options={extensions.map((ext) => ({
                    value: String(ext.id),
                    label: ext.display_name ?? "",
                  }))}
                  placeholder="Select User Extension (Optional)"
                  isClearable
                  isSearchable
                />
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="border-0 bg-light mt-3">
                <Card.Body className="p-3">
                  <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <Eye size={16} />
                    Preview
                  </Form.Label>
                  <div className="d-flex align-items-center gap-3 p-3 bg-white rounded border">
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: newModuleColor,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-medium mb-1">{newModuleName || "Module Name"}</div>
                      <div className="text-muted small mb-2">
                        {newModuleDescription || "Module description..."}
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        {newModuleUserExtension && (
                          <div
                            style={{
                              backgroundColor: `${newModuleColor}20`,
                              color: newModuleColor,
                              border: `1px solid ${newModuleColor}40`,
                            }}
                            className="px-3 py-1"
                          >
                            {extensions.find(
                              (ext) => ext.id?.toString() === newModuleUserExtension?.toString(),
                            )?.display_name || newModuleUserExtension}
                          </div>
                        )}
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "4px",
                              backgroundColor: newModuleColor,
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <code className="small">{newModuleColor || "#0d6efd"}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      }
      submitButtonText="Create Module"
      isSubmitDisabled={!newModuleName}
      cancelButtonText="Cancel"
      onSubmit={async () => {
        await onSubmitCreateModule();
      }}
      onCancel={onCloseCreateModuleModal}
      submitButtonVariant="primary"
      cancelButtonVariant="secondary"
    />

    <FormModal
      show={showSubmoduleModal}
      onHide={onCloseSubmoduleModal}
      title={`Module Submodules - ${selectedModuleForSubmodules?.name || ""}`}
      desc="Manage submodules for this module"
      formHtml={
        <>
          <div className="text-center mb-4">
            <h5>Submodule Management</h5>
            <p className="text-muted">
              This module has {submodules.length} submodule{submodules.length === 1 ? "" : "s"}.
            </p>
            <Button
              variant="outline-info"
              onClick={() => {
                onCloseSubmoduleModal();
                globalThis.location.href = "/tickets/modules/submodules";
              }}
            >
              Go to Submodules Management Page
            </Button>
          </div>

          {submodules.length > 0 && (
            <div>
              <h6>Current Submodules:</h6>
              <div className="submodules-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {submodules.map((submodule) => (
                  <div key={submodule.id} className="card mb-2">
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{submodule.name}</h6>
                          <p className="mb-1 text-muted small">
                            {submodule.description || "No description"}
                          </p>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteSubmodule(submodule)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
      ShowSubmitButton={false}
      cancelButtonText="Close"
      onCancel={onCloseSubmoduleModal}
      submitButtonText="Create"
      onSubmit={onCloseSubmoduleModal}
      submitButtonVariant="primary"
      cancelButtonVariant="secondary"
    />
  </div>
  );
};
