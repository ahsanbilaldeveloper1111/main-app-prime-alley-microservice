import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Plus, AlertCircle } from "lucide-react";
import { listStatuses, createStatus, updateStatus, deleteStatus } from "@utils/work-planner";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import GenericTable from "@components/GenericTable";
import { toast } from "react-toastify";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  emptyPlannerStatusForm,
  plannerStatusFormFromRow,
  normalizedStatusesFromListResponse,
  buildPlannerStatusApiPayload,
  type PlannerWorkPlannerStatusRow,
  type PlannerStatusFormState,
} from "@components/planner/plannerStatuses/plannerStatusesDomain";
import { PlannerStatusFormModal } from "@components/planner/plannerStatuses/PlannerStatusFormModal";
import { usePlannerStatusesTableConfig } from "@components/planner/plannerStatuses/usePlannerStatusesTableConfig";
import "@components/planner/plannerStatuses/plannerStatuses.scss";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { plannerKeys } from "../../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

const WorkPlannerStatuses = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canCreateGlobalStatus = hasPermission(PERMISSIONS.CREATE_STATUSES_WORK_PLANNER);
  const canUpdateGlobalStatus = hasPermission(PERMISSIONS.UPDATE_STATUSES_WORK_PLANNER);
  const canDeleteGlobalStatus = hasPermission(PERMISSIONS.DELETE_STATUSES_WORK_PLANNER);

  const { data: statuses = [], isPending: loading } = useQuery({
    queryKey: plannerKeys.statuses.global(),
    queryFn: async () => {
      try {
        return normalizedStatusesFromListResponse(await listStatuses());
      } catch (error) {
        console.error("Error fetching statuses:", error);
        return [];
      }
    },
  });

  const invalidatePlannerStatuses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: plannerKeys.statuses.all() });
  }, [queryClient]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PlannerWorkPlannerStatusRow | null>(null);
  const [formData, setFormData] = useState<PlannerStatusFormState>(emptyPlannerStatusForm());
  const [processing, setProcessing] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(emptyPlannerStatusForm());
  }, []);

  const handleCreateStatus = async () => {
    if (!canCreateGlobalStatus) return;
    if (!formData.name.trim()) {
      toast.error("Status name is required");
      return;
    }

    try {
      setProcessing(true);
      const response = await createStatus(buildPlannerStatusApiPayload(formData));

      if (response) {
        setShowCreateModal(false);
        resetForm();
        invalidatePlannerStatuses();
      }
    } catch (error) {
      console.error("Error creating status:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditStatus = async () => {
    if (!canUpdateGlobalStatus) return;
    if (!selectedStatus || !formData.name.trim()) {
      toast.error("Status name is required");
      return;
    }

    try {
      setProcessing(true);
      const response = await updateStatus(selectedStatus.id, buildPlannerStatusApiPayload(formData));

      if (response) {
        setShowEditModal(false);
        setSelectedStatus(null);
        resetForm();
        invalidatePlannerStatuses();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!canDeleteGlobalStatus || !selectedStatus) return;

    try {
      setProcessing(true);
      const response = await deleteStatus(selectedStatus.id);

      if (response) {
        setShowDeleteModal(false);
        setSelectedStatus(null);
        invalidatePlannerStatuses();
      }
    } catch (error) {
      console.error("Error deleting status:", error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = useCallback((status: PlannerWorkPlannerStatusRow) => {
    setSelectedStatus(status);
    setFormData(plannerStatusFormFromRow(status));
    setShowEditModal(true);
  }, []);

  const openDeleteModal = useCallback((status: PlannerWorkPlannerStatusRow) => {
    setSelectedStatus(status);
    setShowDeleteModal(true);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const { columns, actions } = usePlannerStatusesTableConfig({
    canUpdateGlobalStatus,
    canDeleteGlobalStatus,
    onEdit: openEditModal,
    onDelete: openDeleteModal,
  });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Statuses" />

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
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateModal}
                      className="mt-3"
                    >
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
        onHide={() => setShowCreateModal(false)}
        formData={formData}
        setFormData={setFormData}
        processing={processing}
        onSubmit={handleCreateStatus}
      />

      <PlannerStatusFormModal
        show={showEditModal}
        mode="edit"
        onHide={() => {
          setShowEditModal(false);
          setSelectedStatus(null);
        }}
        formData={formData}
        setFormData={setFormData}
        processing={processing}
        onSubmit={handleEditStatus}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedStatus(null);
        }}
        onConfirm={handleDeleteStatus}
        itemName={selectedStatus?.name}
        itemType="status"
        loading={processing}
      />
    </React.Fragment>
  );
};

WorkPlannerStatuses.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default WorkPlannerStatuses;
