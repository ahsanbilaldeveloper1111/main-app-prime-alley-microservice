import PageHeader from "@components/PageHeader";
import type { TableColumn } from "@components/GenericTable";
import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import FormModal from "@components/page-partials/FormModal";
import type { TicketType } from "../ticketTypesTypes";
import React from "react";
import { Button, Form } from "react-bootstrap";
import { Plus, Info, Ticket } from "lucide-react";

type TicketTypesPageViewProps = Readonly<{
  embeddedInMainSettings?: boolean;
  data: TicketType[];
  loading: boolean;
  columns: TableColumn<TicketType>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  canViewList: boolean;
  canCreate: boolean;
  showEditTypeModal: boolean;
  showDeleteTypeModal: boolean;
  showCreateTypeModal: boolean;
  selectedTypeName: string;
  selectedTypeDescription: string;
  newTypeName: string;
  newTypeDescription: string;
  onNewTypeNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewTypeDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEditTypeNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditTypeDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmitEditType: () => void;
  onSubmitDeleteType: () => void;
  onSubmitCreateType: () => void;
  onCloseEditTypeModal: () => void;
  onCloseDeleteTypeModal: () => void;
  onCloseCreateTypeModal: () => void;
  onOpenCreateTypeModal: () => void;
}>;

export const TicketTypesPageView: React.FC<TicketTypesPageViewProps> = ({
  embeddedInMainSettings = false,
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
  showEditTypeModal,
  showDeleteTypeModal,
  showCreateTypeModal,
  selectedTypeName,
  selectedTypeDescription,
  newTypeName,
  newTypeDescription,
  onNewTypeNameChange,
  onNewTypeDescriptionChange,
  onEditTypeNameChange,
  onEditTypeDescriptionChange,
  onSubmitEditType,
  onSubmitDeleteType,
  onSubmitCreateType,
  onCloseEditTypeModal,
  onCloseDeleteTypeModal,
  onCloseCreateTypeModal,
  onOpenCreateTypeModal,
}) => {
  const addButton = canCreate ? (
    <Button variant="primary" size="sm" onClick={onOpenCreateTypeModal} className="shadow-sm">
      <Plus size={18} className="me-2" aria-hidden />
      Add Type
    </Button>
  ) : null;

  return (
  <div className={embeddedInMainSettings ? "tickets-settings-page" : undefined}>
    {embeddedInMainSettings ? (
      <SettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search types..."
        actions={addButton}
      />
    ) : (
      <PageHeader
        title=""
        description=""
        showSearch={false}
        buttons={addButton}
        leftGrid={3}
        rightGrid={9}
      />
    )}

    {canViewList ? (
      <EmbeddedSettingsTable<TicketType>
        embedded={embeddedInMainSettings}
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No ticket types found."
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
          searchPlaceholder: "Search types...",
          onSearchChange,
        }}
      />
    ) : null}

    {showEditTypeModal && (
      <FormModal
        show={showEditTypeModal}
        onHide={onCloseEditTypeModal}
        title="Edit Ticket Type"
        titleIcon={<Ticket size={20} className="text-primary" />}
        desc="Fill in the details below to edit the ticket type"
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="editTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type Name <span className="text-danger">*</span>
                <span
                  className="text-muted"
                  title="Enter a clear name that represents the ticket type"
                  style={{ cursor: "help" }}
                >
                  <Info size={14} />
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                id="editTypeName"
                value={selectedTypeName}
                onChange={onEditTypeNameChange}
                placeholder="e.g., Incident, Problem, Service Request"
                required
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: "0.813rem" }}>
                  Use descriptive names that clearly indicate the type of ticket.
                </span>
              </Form.Text>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="editTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type Description{" "}
                <span
                  className="text-muted"
                  title="Enter a description that explains the ticket type"
                  style={{ cursor: "help" }}
                >
                  <Info size={14} />
                </span>
              </label>
              <textarea
                className="form-control"
                id="editTypeDescription"
                value={selectedTypeDescription}
                onChange={onEditTypeDescriptionChange}
                placeholder="e.g., A problem that occurs when the user tries to login to the system"
                rows={3}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: "0.813rem" }}>
                  Provide a clear definition to help users select the correct type.
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Update Type"
        isSubmitDisabled={!selectedTypeName}
        cancelButtonText="Cancel"
        onSubmit={async () => {
          await onSubmitEditType();
        }}
        onCancel={onCloseEditTypeModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />
    )}

    {showDeleteTypeModal && (
      <ConfirmModal
        show={showDeleteTypeModal}
        onHide={onCloseDeleteTypeModal}
        title="Delete Ticket Type?"
        description="Are you sure you want to delete this {targetName} ticket type? This action cannot be undone."
        targetName={selectedTypeName}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={async () => {
          await onSubmitDeleteType();
        }}
        onCancel={onCloseDeleteTypeModal}
      />
    )}

    {showCreateTypeModal && (
      <FormModal
        show={showCreateTypeModal}
        onHide={onCloseCreateTypeModal}
        title="New Ticket Type"
        titleIcon={<Ticket size={20} className="text-primary" />}
        desc="Fill in the details below to create a new ticket type"
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="newTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type Name <span className="text-danger">*</span>
                <span
                  className="text-muted"
                  title="Enter a clear name that represents the ticket type"
                  style={{ cursor: "help" }}
                >
                  <Info size={14} />
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                id="newTypeName"
                value={newTypeName}
                onChange={onNewTypeNameChange}
                placeholder="e.g., Incident, Problem, Service Request"
                required
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: "0.813rem" }}>
                  Use descriptive names that clearly indicate the type of ticket.
                </span>
              </Form.Text>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="newTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type Description{" "}
                <span
                  className="text-muted"
                  title="Enter a description that explains the ticket type"
                  style={{ cursor: "help" }}
                >
                  <Info size={14} />
                </span>
              </label>
              <textarea
                className="form-control"
                id="newTypeDescription"
                value={newTypeDescription}
                onChange={onNewTypeDescriptionChange}
                placeholder="e.g., A problem that occurs when the user tries to login to the system"
                rows={3}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: "0.813rem" }}>
                  Provide a clear definition to help users select the correct type.
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Create Type"
        isSubmitDisabled={!newTypeName}
        cancelButtonText="Cancel"
        onSubmit={async () => {
          await onSubmitCreateType();
        }}
        onCancel={onCloseCreateTypeModal}
      />
    )}
  </div>
  );
};
