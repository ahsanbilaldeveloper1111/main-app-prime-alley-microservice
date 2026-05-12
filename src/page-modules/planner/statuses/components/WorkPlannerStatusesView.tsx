import type { TableAction, TableColumn } from "@components/GenericTable";
import GenericTable from "@components/GenericTable";
import type {
  PlannerStatusFormState,
  PlannerWorkPlannerStatusRow,
} from "@components/planner/plannerStatuses/plannerStatusesDomain";
import { PlannerStatusFormModal } from "@components/planner/plannerStatuses/PlannerStatusFormModal";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { AlertCircle, Plus } from "lucide-react";
import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

type Props = Readonly<{
  canCreateGlobalStatus: boolean;
  statuses: PlannerWorkPlannerStatusRow[];
  loading: boolean;
  columns: TableColumn<PlannerWorkPlannerStatusRow>[];
  actions: TableAction<PlannerWorkPlannerStatusRow>[];
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  selectedStatus: PlannerWorkPlannerStatusRow | null;
  formData: PlannerStatusFormState;
  setFormData: React.Dispatch<React.SetStateAction<PlannerStatusFormState>>;
  processing: boolean;
  handleCreateStatus: () => Promise<void>;
  handleEditStatus: () => Promise<void>;
  handleDeleteStatus: () => Promise<void>;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  closeEditModal: () => void;
  closeDeleteModal: () => void;
}>;

export function WorkPlannerStatusesView({
  canCreateGlobalStatus,
  statuses,
  loading,
  columns,
  actions,
  showCreateModal,
  showEditModal,
  showDeleteModal,
  selectedStatus,
  formData,
  setFormData,
  processing,
  handleCreateStatus,
  handleEditStatus,
  handleDeleteStatus,
  openCreateModal,
  closeCreateModal,
  closeEditModal,
  closeDeleteModal,
}: Props) {
  return (
    <>
      <div className="wps-toolbar">
        <div className="wps-toolbar-spacer" />
        <div className="d-flex flex-wrap gap-2">
          {canCreateGlobalStatus ? (
            <Button
              variant="primary"
              onClick={openCreateModal}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Add Status
            </Button>
          ) : null}
        </div>
      </div>

      <Container fluid className="py-4">
        <Row>
          <Col>
            <GenericTable<PlannerWorkPlannerStatusRow>
              data={statuses}
              columns={columns}
              actions={actions}
              showActions={actions.length > 0}
              actionsLabel="Actions"
              sortable
              loading={loading}
              emptyMessage={
                <div className="text-center py-5">
                  <AlertCircle size={48} className="text-muted wps-empty-icon" />
                  <p className="text-muted">No statuses found</p>
                  {canCreateGlobalStatus ? (
                    <Button variant="primary" size="sm" onClick={openCreateModal} className="mt-3">
                      <Plus size={16} className="me-2" />
                      Create First Status
                    </Button>
                  ) : null}
                </div>
              }
              loadingMessage="Loading statuses..."
              hover
              uniqueKey="id"
              customizableColumns
              columnStorageKey="planner-status-columns"
            />
          </Col>
        </Row>
      </Container>

      <PlannerStatusFormModal
        show={showCreateModal}
        mode="create"
        onHide={closeCreateModal}
        formData={formData}
        setFormData={setFormData}
        processing={processing}
        onSubmit={handleCreateStatus}
      />

      <PlannerStatusFormModal
        show={showEditModal}
        mode="edit"
        onHide={closeEditModal}
        formData={formData}
        setFormData={setFormData}
        processing={processing}
        onSubmit={handleEditStatus}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        onConfirm={handleDeleteStatus}
        itemName={selectedStatus?.name}
        itemType="status"
        loading={processing}
      />
    </>
  );
}
