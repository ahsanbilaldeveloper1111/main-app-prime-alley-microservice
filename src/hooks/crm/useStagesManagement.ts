import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  createStage,
  deleteStage,
  getStages,
  restoreStage,
  updateStage,
} from "@utils/crm";
import { normalizeSearchQuery } from "@utils/Helper";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import {
  DEFAULT_STAGES_SELECTED_COLUMNS,
  INITIAL_STAGE_FORM,
  normalizeSelectedStageColumns,
  paginateStagesData,
  sortStagesData,
  STAGES_TABLE_COLUMN_STORAGE_KEY,
  STAGES_TABLE_SELECTABLE_KEYS,
  type StageFilterState,
  type StageFormState,
  type StageRow,
  type StageType,
} from "@page-modules/crm/stages/stagesPageModel";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { crmAppKeys } from "@query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "StagesManagement" });
}

export function useStagesManagement() {
  const { data: session } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [submittingStageForm, setSubmittingStageForm] = useState(false);
  const [deletingStage, setDeletingStage] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [stageToDelete, setStageToDelete] = useState<StageRow | null>(null);
  const [stageToUpdate, setStageToUpdate] = useState<StageRow | null>(null);
  const [viewingStage, setViewingStage] = useState<StageRow | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState<StageFormState>(() => ({
    ...INITIAL_STAGE_FORM,
  }));

  const [currentFilters, setCurrentFilters] = useState<StageFilterState>({
    search: "",
    type: "",
  });
  const {
    inputValue: stagesSearch,
    queryValue: stagesSearchQuery,
    handleInputChange: handleToolbarSearchChange,
    submitQuery: handleToolbarSearchSubmit,
  } = useDebouncedSearchInput({
    normalize: normalizeSearchQuery,
  });
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showStagesAnalytics, setShowStagesAnalytics] = useState(false);

  const {
    selectedColumns: selectedStagesColumns,
    setSelectedColumns: setSelectedStagesColumns,
    pagination: stagesPagination,
    setPagination,
    handlePaginationChange: handleStagesPaginationChange,
    handleSort: handleStagesSort,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_STAGES_SELECTED_COLUMNS,
    selectableColumnKeys: STAGES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: STAGES_TABLE_COLUMN_STORAGE_KEY,
    initialPagination: { rowsPerPage: 15 },
    normalizeSelectedColumns: normalizeSelectedStageColumns,
  });
  const filteredStagesQuery = useQuery({
    queryKey: [
      ...crmAppKeys.crmStages.all(),
      "filteredList",
      refreshKey,
      activeFilter,
    ] as const,
    queryFn: async () => {
      const includeArchived = activeFilter === "deleted";
      const typeFilter =
        activeFilter === "all" || activeFilter === "deleted"
          ? undefined
          : (activeFilter as StageType);
      try {
        return await getStages(
          typeFilter,
          includeArchived ? { include_archived: true } : undefined,
        );
      } catch (error: unknown) {
        consumeHandledApiError(error, "StagesManagement.fetchStages");
        throw error;
      }
    },
  });

  const allStagesQuery = useQuery({
    queryKey: [...crmAppKeys.crmStages.all(), "allForCounts", refreshKey] as const,
    queryFn: async () => {
      try {
        return await getStages();
      } catch (error: unknown) {
        consumeHandledApiError(error, "StagesManagement.fetchAllStagesForCounts");
        throw error;
      }
    },
  });

  const stagesData = filteredStagesQuery.data ?? [];
  const allStagesData = allStagesQuery.data ?? [];
  const loadingStages = filteredStagesQuery.isFetching;

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [stageToRestore, setStageToRestore] = useState<StageRow | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleCloseSuccessfulModal = useCallback(() => {
    setShowSuccessfulModal(false);
  }, []);

  useEffect(() => {
    setCurrentFilters((prev) =>
      prev.search === stagesSearchQuery
        ? prev
        : { ...prev, search: stagesSearchQuery },
    );
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [setPagination, stagesSearchQuery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSubmittingStageForm(true);
      await createStage(formData);
      toast.success("Stage created successfully!");
      setShowCreateModal(false);
      setFormData({ ...INITIAL_STAGE_FORM });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Created");
      setSuccessModalDescription("Stage created successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleSubmit");
      toast.error("Failed to create stage");
    } finally {
      setSubmittingStageForm(false);
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setStageToUpdate(null);
    setFormData({ ...INITIAL_STAGE_FORM });
  };

  const handleUpdateStage = async (e: FormEvent) => {
    e.preventDefault();
    if (!stageToUpdate) return;

    try {
      setSubmittingStageForm(true);
      await updateStage(stageToUpdate.id, formData);
      toast.success("Stage updated successfully!");
      setShowUpdateModal(false);
      setStageToUpdate(null);
      setFormData({ ...INITIAL_STAGE_FORM });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Updated");
      setSuccessModalDescription("Stage updated successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleUpdateStage");
      toast.error("Failed to update stage");
    } finally {
      setSubmittingStageForm(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    try {
      setDeletingStage(true);
      await deleteStage(stageToDelete.id);
      toast.success("Stage deleted successfully!");
      setShowDeleteModal(false);
      setStageToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Deleted");
      setSuccessModalDescription("Stage deleted successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleDeleteStage");
      toast.error("Failed to delete stage");
    } finally {
      setDeletingStage(false);
    }
  };

  const openRestoreModal = useCallback((stage: StageRow) => {
    setStageToRestore(stage);
    setShowRestoreModal(true);
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!stageToRestore) return;
    setRestoring(true);
    try {
      await restoreStage(stageToRestore.id);
      toast.success("Stage restored successfully!");
      setShowRestoreModal(false);
      setStageToRestore(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Restored");
      setSuccessModalDescription("Stage has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleConfirmRestore");
      toast.error("Failed to restore stage");
    } finally {
      setRestoring(false);
    }
  }, [stageToRestore]);

  const openStageView = useCallback((stage: StageRow) => {
    setViewingStage(stage);
    setShowViewModal(true);
  }, []);

  const openStageEdit = useCallback((stage: StageRow) => {
    setStageToUpdate(stage);
    setFormData({
      name: stage.name,
      sequence: stage.sequence,
      is_won: stage.is_won,
      fold: stage.fold,
      color: stage.color,
      description: stage.description || "",
      is_default: stage.is_default,
      active: stage.active,
      type: stage.type,
      probability: stage.probability,
    });
    setShowUpdateModal(true);
  }, []);

  const openStageDelete = useCallback((stage: StageRow) => {
    setStageToDelete(stage);
    setShowDeleteModal(true);
  }, []);

  const handleInputChange = <K extends keyof StageFormState>(
    field: K,
    value: StageFormState[K],
  ) => {
    setFormData((prev) => {
      if (field === "type" && value === "lost_reason") {
        return { ...prev, type: "lost_reason", probability: 0 };
      }
      return { ...prev, [field]: value };
    });
  };

  const filteredStages = useMemo(() => {
    const searchTerm = normalizeSearchQuery(currentFilters.search);
    const query = searchTerm.toLowerCase();

    return stagesData.filter((stage) => {
      if (!searchTerm) return true;

      const nameNorm = normalizeSearchQuery(stage.name).toLowerCase();
      const descNorm = normalizeSearchQuery(stage.description).toLowerCase();
      return nameNorm.includes(query) || descNorm.includes(query);
    });
  }, [stagesData, currentFilters]);

  const sortedStages = useMemo(
    () =>
      sortStagesData(
        filteredStages,
        stagesPagination.sortBy,
        stagesPagination.sortOrder,
      ),
    [filteredStages, stagesPagination.sortBy, stagesPagination.sortOrder],
  );

  const paginatedStages = useMemo(
    () =>
      paginateStagesData(
        sortedStages,
        stagesPagination.currentPage,
        stagesPagination.rowsPerPage,
      ),
    [sortedStages, stagesPagination.currentPage, stagesPagination.rowsPerPage],
  );

  const analyticsData = useMemo(() => {
    const total = filteredStages.length;
    const byType = {
      lead: filteredStages.filter((s) => s.type === "lead").length,
      deal: filteredStages.filter((s) => s.type === "deal").length,
      order: filteredStages.filter((s) => s.type === "order").length,
      lost_reason: filteredStages.filter((s) => s.type === "lost_reason")
        .length,
    };

    const stagesByType = [
      { type: "Lead", count: byType.lead, fill: "#0d6efd" },
      { type: "Deal", count: byType.deal, fill: "#ffc107" },
      { type: "Order", count: byType.order, fill: "#20c997" },
      { type: "Lost Reason", count: byType.lost_reason, fill: "#dc3545" },
    ].filter((item) => item.count > 0);

    return { total, byType, stagesByType };
  }, [filteredStages]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allStagesData.length,
      lead: allStagesData.filter((s) => s.type === "lead").length,
      deal: allStagesData.filter((s) => s.type === "deal").length,
      order: allStagesData.filter((s) => s.type === "order").length,
      lost_reason: allStagesData.filter((s) => s.type === "lost_reason").length,
      deleted: 0,
    };
    return counts;
  }, [allStagesData]);

  const handleToolbarTabChange = useCallback(
    (tabId: string) => {
      setActiveFilter(tabId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setPagination],
  );

  const toggleStagesAnalytics = useCallback(() => {
    setShowStagesAnalytics((open) => !open);
  }, []);

  const openCreateStageModal = useCallback(() => setShowCreateModal(true), []);

  return {
    session,
    PERMISSIONS,
    showCreateModal,
    setShowCreateModal,
    showUpdateModal,
    showDeleteModal,
    setShowDeleteModal,
    showViewModal,
    setShowViewModal,
    showSuccessfulModal,
    submittingStageForm,
    deletingStage,
    successModalTitle,
    successModalDescription,
    stageToDelete,
    setStageToDelete,
    stageToUpdate,
    viewingStage,
    formData,
    stagesSearch,
    handleToolbarSearchChange,
    handleToolbarSearchSubmit,
    activeFilter,
    showStagesAnalytics,
    selectedStagesColumns,
    setSelectedStagesColumns,
    stagesPagination,
    handleStagesPaginationChange,
    handleStagesSort,
    loadingStages,
    showRestoreModal,
    setShowRestoreModal,
    stageToRestore,
    setStageToRestore,
    restoring,
    handleCloseSuccessfulModal,
    handleSubmit,
    handleCloseUpdateModal,
    handleUpdateStage,
    handleDeleteStage,
    handleConfirmRestore,
    openRestoreModal,
    openStageView,
    openStageEdit,
    openStageDelete,
    handleInputChange,
    filteredStages,
    paginatedStages,
    analyticsData,
    filterCounts,
    handleToolbarTabChange,
    toggleStagesAnalytics,
    openCreateStageModal,
  };
}
