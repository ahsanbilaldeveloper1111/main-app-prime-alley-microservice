import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { ListTypes, CreateType, UpdateType, DeleteType } from "@utils/ticket-types";
import { Button, Form } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import PageHeader from "@components/PageHeader";
import { Plus, Edit, Trash2, Info, Ticket } from "lucide-react";
import ConfirmModal from "@pages/partial/ConfirmModal";
import FormModal from "@pages/partial/FormModal";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { GlobalDateTimeFormat } from "@utils/Helper";
import GenericTable, { TableColumn, TableAction } from "@components/GenericTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TicketType {
  id: string | number;
  name: string;
  description: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const TicketTypes = () => {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;

  // Table state
  const [data, setData] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("");

  // Edit state
  const [selectedType, setSelectedType] = useState<any>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<any>(null);
  const [selectedTypeDescription, setSelectedTypeDescription] = useState<any>(null);
  const [showEditTypeModal, setShowEditTypeModal] = useState<boolean>(false);

  // Delete state
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState<boolean>(false);

  // Create state
  const [showCreateTypeModal, setShowCreateTypeModal] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [newTypeDescription, setNewTypeDescription] = useState<string>("");

  // ---- Data Fetching ----
  const fetchTypes = useCallback(async (page: number, perPage: number, search: string) => {
    setLoading(true);
    try {
      const response = await ListTypes({ page, perPage, search, filters: {} });
      if (response) {
        setData(response.data || []);
        setTotalRows(response.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes(currentPage, rowsPerPage, searchValue);
  }, [fetchTypes, currentPage, rowsPerPage, searchValue]);

  const triggerRefresh = useCallback(() => {
    fetchTypes(currentPage, rowsPerPage, searchValue);
  }, [fetchTypes, currentPage, rowsPerPage, searchValue]);

  // ---- Pagination ----
  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  // ---- Search ----
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  // ---- Handlers: Edit ----
  const handleEditType = useCallback((row: TicketType) => {
    setSelectedType(row.id);
    setSelectedTypeName(row.name);
    setSelectedTypeDescription(row.description);
    setShowEditTypeModal(true);
  }, []);

  const closeEditTypeModal = useCallback(() => {
    setShowEditTypeModal(false);
    setSelectedType(null);
    setSelectedTypeName(null);
    setSelectedTypeDescription(null);
  }, []);

  const handleSubmitEditType = useCallback(async () => {
    const response = await UpdateType(selectedType, selectedTypeName, selectedTypeDescription);
    if (response) {
      closeEditTypeModal();
      triggerRefresh();
    }
  }, [selectedType, selectedTypeName, selectedTypeDescription, closeEditTypeModal, triggerRefresh]);

  // ---- Handlers: Delete ----
  const handleDeleteType = useCallback((row: TicketType) => {
    setSelectedType(row.id);
    setSelectedTypeName(row.name);
    setShowDeleteTypeModal(true);
  }, []);

  const closeDeleteTypeModal = useCallback(() => {
    setShowDeleteTypeModal(false);
    setSelectedType(null);
    setSelectedTypeName(null);
  }, []);

  const handleSubmitDeleteType = useCallback(async () => {
    const response = await DeleteType(selectedType);
    if (response) {
      closeDeleteTypeModal();
      triggerRefresh();
    }
  }, [selectedType, closeDeleteTypeModal, triggerRefresh]);

  // ---- Handlers: Create ----
  const openCreateTypeModal = useCallback(() => setShowCreateTypeModal(true), []);
  const closeCreateTypeModal = useCallback(() => {
    setShowCreateTypeModal(false);
    setNewTypeName("");
    setNewTypeDescription("");
  }, []);

  const handleSubmitCreateType = useCallback(async () => {
    const response = await CreateType(newTypeName, newTypeDescription);
    if (response) {
      closeCreateTypeModal();
      triggerRefresh();
    }
  }, [newTypeName, newTypeDescription, closeCreateTypeModal, triggerRefresh]);

  // ---- Input change handlers ----
  const handleNewTypeNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewTypeName(e.target.value), []);
  const handleNewTypeDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTypeDescription(e.target.value), []);
  const handleEditTypeNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedTypeName(e.target.value), []);
  const handleEditTypeDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedTypeDescription(e.target.value), []);

  // ---- Columns ----
  const columns: TableColumn<TicketType>[] = useMemo(() => [
    {
      key: "name",
      label: "Type Name",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: "500", fontSize: "0.938rem", color: "rgb(33, 37, 41)" }}>
          {row.name}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      render: (row) => (
        <span className="text-muted" style={{ fontSize: "0.875rem" }}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      sortable: true,
      render: (row) => (
        <span className="text-muted">
          {moment(row.created_at).format(GlobalDateTimeFormat)}
        </span>
      ),
    },
  ], []);

  // ---- Actions ----
  const actions: TableAction<TicketType>[] = useMemo(() => {
    const canEdit = permissions?.includes("update-ticket-types-tickets");
    const canDelete = permissions?.includes("delete-ticket-type-tickets");

    const acts: TableAction<TicketType>[] = [];

    if (canEdit) {
      acts.push({
        label: "Edit",
        icon: <Edit size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-primary",
        onClick: handleEditType,
      });
    }

    if (canDelete) {
      acts.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
        onClick: handleDeleteType,
      });
    }

    return acts;
  }, [permissions, handleEditType, handleDeleteType]);

  const canViewList = permissions?.includes("view-ticket-types-tickets");
  const canCreate = permissions?.includes("add-ticket-type-tickets");

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/types" subTitle="Ticket Types" />

      <PageHeader
        title=""
        description=""
        showSearch={false}
        buttons={
          canCreate ? (
            <Button variant="primary" onClick={openCreateTypeModal} className="shadow-sm">
              <Plus size={18} className="me-2" />
              Add Type
            </Button>
          ) : undefined
        }
        leftGrid={3}
        rightGrid={9}
      />

      {canViewList && (
        <GenericTable<TicketType>
          data={data}
          columns={columns}
          loading={loading}
          actions={actions}
          showActions={actions.length > 0}
          actionsLabel="Actions"
          pagination={{
            currentPage,
            rowsPerPage,
            totalRows,
            pageSizeOptions: [15, 25, 50, 100],
          }}
          onPaginationChange={handlePaginationChange}
          sortable={true}
          hover={true}
          emptyMessage="No ticket types found."
          showToolbar={true}
          toolbar={{
            showSearch: true,
            searchValue,
            searchPlaceholder: "Search types...",
            onSearchChange: handleSearchChange,
          }}
          showToolbarActions={false}
          uniqueKey="id"
        />
      )}

      {/* Edit Type Modal */}
      {showEditTypeModal && (
        <FormModal
          show={showEditTypeModal}
          onHide={closeEditTypeModal}
          title="Edit Ticket Type"
          titleIcon={<Ticket size={20} className="text-primary" />}
          desc="Fill in the details below to edit the ticket type"
          formHtml={
            <>
              <div className="form-group mb-3">
                <label htmlFor="editTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                  Type Name <span className="text-danger">*</span>
                  <span className="text-muted" title="Enter a clear name that represents the ticket type" style={{ cursor: "help" }}>
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="editTypeName"
                  value={selectedTypeName}
                  onChange={handleEditTypeNameChange}
                  placeholder="e.g., Incident, Problem, Service Request"
                  required
                />
                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                  <Info size={12} />
                  <span style={{ fontSize: "0.813rem" }}>Use descriptive names that clearly indicate the type of ticket.</span>
                </Form.Text>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="editTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                  Type Description<span className="text-muted" title="Enter a description that explains the ticket type" style={{ cursor: "help" }}><Info size={14} />
                  </span>
                </label>
                <textarea
                  className="form-control"
                  id="editTypeDescription"
                  value={selectedTypeDescription}
                  onChange={handleEditTypeDescriptionChange}
                  placeholder="e.g., A problem that occurs when the user tries to login to the system"
                  rows={3}
                />
                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                  <Info size={12} />
                  <span style={{ fontSize: "0.813rem" }}>Provide a clear definition to help users select the correct type.</span>
                </Form.Text>
              </div>
            </>
          }
          submitButtonText="Update Type"
          isSubmitDisabled={!selectedTypeName}
          cancelButtonText="Cancel"
          onSubmit={handleSubmitEditType}
          onCancel={closeEditTypeModal}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteTypeModal && (
        <ConfirmModal
          show={showDeleteTypeModal}
          onHide={closeDeleteTypeModal}
          title="Delete Ticket Type?"
          description="Are you sure you want to delete this {targetName} ticket type? This action cannot be undone."
          targetName={selectedTypeName}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          onConfirm={handleSubmitDeleteType}
          onCancel={closeDeleteTypeModal}
        />
      )}

      {/* Create Type Modal */}
      {showCreateTypeModal && (
        <FormModal
          show={showCreateTypeModal}
          onHide={closeCreateTypeModal}
          title="New Ticket Type"
          titleIcon={<Ticket size={20} className="text-primary" />}
          desc="Fill in the details below to create a new ticket type"
          formHtml={
            <>
              <div className="form-group mb-3">
                <label htmlFor="newTypeName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                  Type Name <span className="text-danger">*</span>
                  <span className="text-muted" title="Enter a clear name that represents the ticket type" style={{ cursor: "help" }}>
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="newTypeName"
                  value={newTypeName}
                  onChange={handleNewTypeNameChange}
                  placeholder="e.g., Incident, Problem, Service Request"
                  required
                />
                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                  <Info size={12} />
                  <span style={{ fontSize: "0.813rem" }}>Use descriptive names that clearly indicate the type of ticket.</span>
                </Form.Text>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="newTypeDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                  Type Description<span className="text-muted" title="Enter a description that explains the ticket type" style={{ cursor: "help" }}>
                    <Info size={14} />
                  </span>
                </label>
                <textarea
                  className="form-control"
                  id="newTypeDescription"
                  value={newTypeDescription}
                  onChange={handleNewTypeDescriptionChange}
                  placeholder="e.g., A problem that occurs when the user tries to login to the system"
                  rows={3}
                />
                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                  <Info size={12} />
                  <span style={{ fontSize: "0.813rem" }}>Provide a clear definition to help users select the correct type.</span>
                </Form.Text>
              </div>
            </>
          }
          submitButtonText="Create Type"
          isSubmitDisabled={!newTypeName}
          cancelButtonText="Cancel"
          onSubmit={handleSubmitCreateType}
          onCancel={closeCreateTypeModal}
        />
      )}
    </React.Fragment>
  );
};

TicketTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketTypes;
 