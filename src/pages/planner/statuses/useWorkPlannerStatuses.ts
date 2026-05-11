import {
  buildPlannerStatusApiPayload,
  emptyPlannerStatusForm,
  normalizedStatusesFromListResponse,
  plannerStatusFormFromRow,
  type PlannerStatusFormState,
  type PlannerWorkPlannerStatusRow,
} from "@components/planner/plannerStatuses/plannerStatusesDomain";
import { usePlannerStatusesTableConfig } from "@components/planner/plannerStatuses/usePlannerStatusesTableConfig";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { createStatus, deleteStatus, listStatuses, updateStatus } from "@utils/work-planner";
import { usePermissions } from "@utils/permissionUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { plannerKeys } from "../../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

export function useWorkPlannerStatuses() {
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
    queryClient
      .invalidateQueries({ queryKey: plannerKeys.statuses.all() })
      .catch((error: unknown) => {
        console.error("Error invalidating planner statuses:", error);
      });
  }, [queryClient]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PlannerWorkPlannerStatusRow | null>(null);
  const [formData, setFormData] = useState<PlannerStatusFormState>(emptyPlannerStatusForm());

  const resetForm = useCallback(() => {
    setFormData(emptyPlannerStatusForm());
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPlannerStatusApiPayload>) => createStatus(payload),
    onSuccess: (response) => {
      if (!response) return;
      setShowCreateModal(false);
      resetForm();
      invalidatePlannerStatuses();
    },
    onError: (error) => {
      console.error("Error creating status:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number | string; payload: ReturnType<typeof buildPlannerStatusApiPayload> }) =>
      updateStatus(vars.id, vars.payload),
    onSuccess: (response) => {
      if (!response) return;
      setShowEditModal(false);
      setSelectedStatus(null);
      resetForm();
      invalidatePlannerStatuses();
    },
    onError: (error) => {
      console.error("Error updating status:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteStatus(id),
    onSuccess: (response) => {
      if (!response) return;
      setShowDeleteModal(false);
      setSelectedStatus(null);
      invalidatePlannerStatuses();
    },
    onError: (error) => {
      console.error("Error deleting status:", error);
    },
  });

  const processing = useMemo(
    () => createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    [createMutation.isPending, updateMutation.isPending, deleteMutation.isPending],
  );

  const handleCreateStatus = async () => {
    if (!canCreateGlobalStatus) return;
    if (!formData.name.trim()) {
      toast.error("Status name is required");
      return;
    }
    await createMutation.mutateAsync(buildPlannerStatusApiPayload(formData));
  };

  const handleEditStatus = async () => {
    if (!canUpdateGlobalStatus) return;
    if (!selectedStatus || !formData.name.trim()) {
      toast.error("Status name is required");
      return;
    }
    await updateMutation.mutateAsync({
      id: selectedStatus.id,
      payload: buildPlannerStatusApiPayload(formData),
    });
  };

  const handleDeleteStatus = async () => {
    if (!canDeleteGlobalStatus || !selectedStatus) return;
    await deleteMutation.mutateAsync(selectedStatus.id);
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

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedStatus(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedStatus(null);
  }, []);

  const { columns, actions } = usePlannerStatusesTableConfig({
    canUpdateGlobalStatus,
    canDeleteGlobalStatus,
    onEdit: openEditModal,
    onDelete: openDeleteModal,
  });

  return {
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
  };
}
