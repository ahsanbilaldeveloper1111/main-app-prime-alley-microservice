import BreadcrumbItem from "@common/BreadcrumbItem";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import GenericTable from "@components/GenericTable";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { Info, Layers, Plus, Search, X } from "lucide-react";
import React from "react";
import {
  CREATE_MODULE_CONFIG,
  EDIT_MODULE_CONFIG,
  type FAQModuleRow,
  type ModuleSidebarConfig,
} from "../faqModulesTypes";
import type { TableAction, TableColumn } from "@components/GenericTable";

interface ModuleNameFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint: string;
}

const ModuleNameField: React.FC<ModuleNameFieldProps> = ({ id, value, onChange, hint }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Module Name <span style={{ color: "#f2545b" }}>*</span>
      <span title="Enter the name of the FAQ module" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Module Name"
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #8a8a8a",
        borderRadius: "4px",
        fontSize: "14px",
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
      }}
    />
    <p
      style={{
        fontSize: "0.813rem",
        color: "#6c757d",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Info size={12} />
      {hint}
    </p>
  </div>
);

interface ModuleDescriptionFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ModuleDescriptionField: React.FC<ModuleDescriptionFieldProps> = ({ id, value, onChange }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Description{" "}
      <span title="Enter a description for the FAQ module" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <textarea
      id={id}
      rows={3}
      value={value}
      onChange={onChange}
      placeholder="Module Description"
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #8a8a8a",
        borderRadius: "4px",
        fontSize: "14px",
        outline: "none",
        resize: "vertical",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
      }}
    />
    <p
      style={{
        fontSize: "0.813rem",
        color: "#6c757d",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Info size={12} />
      Optional description for the FAQ module
    </p>
  </div>
);

interface ModuleIconFieldProps {
  id: string;
  value: string;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPickerOpen: () => void;
}

const ModuleIconField: React.FC<ModuleIconFieldProps> = ({ id, value, onTextChange, onPickerOpen }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Icon{" "}
      <span title="Enter icon identifier" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onTextChange}
        placeholder="e.g., question-circle"
        style={{
          flex: 1,
          padding: "10px 12px",
          border: "1px solid #8a8a8a",
          borderRadius: "4px",
          fontSize: "14px",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#0091ae";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#8a8a8a";
        }}
      />
      <button
        type="button"
        onClick={onPickerOpen}
        title="Choose Icon"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 14px",
          backgroundColor: "transparent",
          border: "1px solid #8a8a8a",
          borderRadius: "4px",
          cursor: "pointer",
          color: "#141414",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f7fafc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Layers size={16} />
      </button>
    </div>
    {value ? (
      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.813rem", color: "#6c757d" }}>Preview:</span>
        <i className="material-icons-two-tone" style={{ fontSize: "24px" }}>
          {value}
        </i>
      </div>
    ) : null}
    <p
      style={{
        fontSize: "0.813rem",
        color: "#6c757d",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Info size={12} />
      Optional icon identifier for the FAQ module
    </p>
  </div>
);

interface FAQModuleSidebarProps {
  isOpen: boolean;
  config: ModuleSidebarConfig;
  name: string;
  description: string;
  icon: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onIconTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIconPickerOpen: () => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  nameHint: string;
}

const FAQModuleSidebar: React.FC<FAQModuleSidebarProps> = ({
  isOpen,
  config,
  name,
  description,
  icon,
  onNameChange,
  onDescriptionChange,
  onIconTextChange,
  onIconPickerOpen,
  onSubmit,
  onClose,
  isSubmitting = false,
  nameHint,
}) => {
  if (!isOpen) return null;

  const canSubmit = name.trim() !== "" && !isSubmitting;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers size={20} style={{ color: "#0091ae" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#141414", margin: 0 }}>
              {config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
            <ModuleNameField id={config.nameInputId} value={name} onChange={onNameChange} hint={nameHint} />
            <ModuleDescriptionField
              id={config.descInputId}
              value={description}
              onChange={onDescriptionChange}
            />
            <ModuleIconField
              id={config.iconInputId}
              value={icon}
              onTextChange={onIconTextChange}
              onPickerOpen={onIconPickerOpen}
            />
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "10px 20px",
                backgroundColor: canSubmit ? "#0091ae" : "#cbd5e0",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#007a94";
              }}
              onMouseLeave={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#0091ae";
              }}
            >
              {isSubmitting ? config.submittingLabel : config.submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

interface IconPickerBodyProps {
  allIcons: string[];
  filteredIcons: string[];
  iconSearchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIconSelect: (name: string) => void;
}

const IconPickerBody: React.FC<IconPickerBodyProps> = ({
  allIcons,
  filteredIcons,
  iconSearchQuery,
  onSearchChange,
  onIconSelect,
}) => (
  <>
    <div className="mb-3">
      <InputGroup>
        <InputGroup.Text>
          <Search size={16} />
        </InputGroup.Text>
        <Form.Control type="text" placeholder="Search icons..." value={iconSearchQuery} onChange={onSearchChange} />
      </InputGroup>
    </div>

    <div
      style={{
        maxHeight: "400px",
        overflowY: "auto",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        padding: "10px",
      }}
    >
      {filteredIcons.length === 0 ? (
        <div className="text-center text-muted py-4">
          {allIcons.length === 0 ? "Loading icons..." : "No icons found"}
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          {filteredIcons.map((iconName) => (
            <button
              key={iconName}
              type="button"
              title={iconName}
              onClick={() => onIconSelect(iconName)}
              style={{
                width: "60px",
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
                background: "#fff",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8f9fa";
                e.currentTarget.style.borderColor = "#4680ff";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#dee2e6";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <i className="material-icons-two-tone" style={{ fontSize: "24px" }}>
                {iconName}
              </i>
              <span
                style={{
                  fontSize: "10px",
                  color: "#6c757d",
                  marginTop: "4px",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                  padding: "0 2px",
                }}
              >
                {iconName.length > 10 ? `${iconName.substring(0, 8)}...` : iconName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="mt-2 text-muted small">
      Showing {filteredIcons.length} of {allIcons.length} icons
    </div>
  </>
);

export type FaqModulesPageViewProps = Readonly<{
  data: FAQModuleRow[];
  loading: boolean;
  columns: TableColumn<FAQModuleRow>[];
  actions: TableAction<FAQModuleRow>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  showCreateSidebar: boolean;
  newModuleName: string;
  newModuleDescription: string;
  newModuleIcon: string;
  onNewModuleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewModuleDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNewModuleIconTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openCreateIconPicker: () => void;
  onSubmitCreateModule: () => void;
  onOpenCreateSidebar: () => void;
  onCloseCreateSidebar: () => void;
  showEditSidebar: boolean;
  selectedModuleName: string;
  selectedModuleDescription: string;
  selectedModuleIcon: string;
  onEditModuleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditModuleDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEditModuleIconTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openEditIconPicker: () => void;
  onSubmitEditModule: () => void;
  onCloseEditSidebar: () => void;
  showDeleteModuleModal: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  showSuccessfulModal: boolean;
  successModalTitle: string;
  successModalDescription: string;
  onCloseSuccessModal: () => void;
  showIconPicker: boolean;
  onCloseIconPicker: () => void;
  allIcons: string[];
  filteredIcons: string[];
  iconSearchQuery: string;
  onIconSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIconSelect: (name: string) => void;
  isSubmitting: boolean;
  showBreadcrumb?: boolean;
  breadcrumbMainLink?: string;
}>;

export const FaqModulesPageView: React.FC<FaqModulesPageViewProps> = ({
  data,
  loading,
  columns,
  actions,
  currentPage,
  rowsPerPage,
  totalRows,
  searchValue,
  onSearchChange,
  onPaginationChange,
  showCreateSidebar,
  newModuleName,
  newModuleDescription,
  newModuleIcon,
  onNewModuleNameChange,
  onNewModuleDescChange,
  onNewModuleIconTextChange,
  openCreateIconPicker,
  onSubmitCreateModule,
  onOpenCreateSidebar,
  onCloseCreateSidebar,
  showEditSidebar,
  selectedModuleName,
  selectedModuleDescription,
  selectedModuleIcon,
  onEditModuleNameChange,
  onEditModuleDescChange,
  onEditModuleIconTextChange,
  openEditIconPicker,
  onSubmitEditModule,
  onCloseEditSidebar,
  showDeleteModuleModal,
  onCloseDeleteModal,
  onConfirmDelete,
  showSuccessfulModal,
  successModalTitle,
  successModalDescription,
  onCloseSuccessModal,
  showIconPicker,
  onCloseIconPicker,
  allIcons,
  filteredIcons,
  iconSearchQuery,
  onIconSearchChange,
  onIconSelect,
  isSubmitting,
  showBreadcrumb = true,
  breadcrumbMainLink = "/main-settings/help-center/modules",
}) => {
  return (
    <React.Fragment>
      {showBreadcrumb ? (
        <BreadcrumbItem mainTitle="FAQs" mainLink={breadcrumbMainLink} subTitle="Modules" />
      ) : null}

      <div className="page-header-title style-2 mb-3">
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={onOpenCreateSidebar}>
            <Plus size={16} className="me-1" />
            Add Module
          </Button>
        </div>
      </div>

      <GenericTable<FAQModuleRow>
        data={data}
        columns={columns}
        loading={loading}
        actions={actions}
        showActions={true}
        actionsLabel="Actions"
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [15, 25, 50, 100],
        }}
        onPaginationChange={onPaginationChange}
        sortable={true}
        hover={true}
        emptyMessage="No FAQ modules found."
        showToolbar={true}
        toolbar={{
          showSearch: true,
          searchValue,
          searchPlaceholder: "Search modules...",
          onSearchChange,
        }}
        showToolbarActions={false}
        uniqueKey="id"
      />

      <FAQModuleSidebar
        isOpen={showCreateSidebar}
        config={CREATE_MODULE_CONFIG}
        name={newModuleName}
        description={newModuleDescription}
        icon={newModuleIcon}
        onNameChange={onNewModuleNameChange}
        onDescriptionChange={onNewModuleDescChange}
        onIconTextChange={onNewModuleIconTextChange}
        onIconPickerOpen={openCreateIconPicker}
        onSubmit={onSubmitCreateModule}
        onClose={onCloseCreateSidebar}
        nameHint="Enter the name of the FAQ module you want to create"
        isSubmitting={isSubmitting}
      />

      <FAQModuleSidebar
        isOpen={showEditSidebar}
        config={EDIT_MODULE_CONFIG}
        name={selectedModuleName}
        description={selectedModuleDescription}
        icon={selectedModuleIcon}
        onNameChange={onEditModuleNameChange}
        onDescriptionChange={onEditModuleDescChange}
        onIconTextChange={onEditModuleIconTextChange}
        onIconPickerOpen={openEditIconPicker}
        onSubmit={onSubmitEditModule}
        onClose={onCloseEditSidebar}
        nameHint="Change the name of the FAQ module"
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        show={showDeleteModuleModal}
        onHide={onCloseDeleteModal}
        title="Delete FAQ Module"
        description="Are you sure you want to delete the following FAQ module?"
        targetName={selectedModuleName}
        onConfirm={onConfirmDelete}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={onCloseSuccessModal}
        title={successModalTitle}
        description={successModalDescription}
      />

      <Modal show={showIconPicker} onHide={onCloseIconPicker} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Layers size={20} />
            Choose Icon
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <IconPickerBody
            allIcons={allIcons}
            filteredIcons={filteredIcons}
            iconSearchQuery={iconSearchQuery}
            onSearchChange={onIconSearchChange}
            onIconSelect={onIconSelect}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCloseIconPicker}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};
