import { useTicketHierarchyExtensionsQuery } from "@page-modules/tickets/useTicketHierarchyExtensionsQuery";
import { useTicketModulesAllQuery } from "@page-modules/tickets/useTicketModulesAllQuery";
import { ticketsKeys } from "../../../../query/keys";
import {
  ListSubmodules,
  CreateSubmoduleChild,
  DeleteSubmoduleChild,
  ListSubmoduleChildren,
} from "@utils/ticket-module";
import { Column } from "@components/CustomDataTable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { Trash2 } from "lucide-react";
import moment from "moment";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "../categories/moduleCategoriesTypes";

export interface SubCategoryRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  submodule?: { name?: string; color?: string };
}

export function useModuleSubCategoriesPage() {
  const queryClient = useQueryClient();
  const modulesQuery = useTicketModulesAllQuery();
  useTicketHierarchyExtensionsQuery();

  const modules: TicketModulePickerRow[] = modulesQuery.data ?? [];

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters] = useState({ search: "" });
  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const [showSubmoduleChildrenModal, setShowSubmoduleChildrenModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildDescription, setNewChildDescription] = useState("");
  const [newChildUserExtension] = useState<string | null>(null);
  const [newChildSubmoduleId, setNewChildSubmoduleId] = useState("");
  const [newChildModuleId, setNewChildModuleId] = useState("");
  const [submodules, setSubmodules] = useState<TicketSubmoduleRow[]>([]);

  const [selectedSubcategoryForDelete, setSelectedSubcategoryForDelete] = useState<string | null>(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] = useState(false);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleChangeModule = useCallback(async (moduleId: string) => {
    setSubmodules([]);
    setNewChildModuleId(moduleId);
    const res = await ListSubmodules({ filters: { module_id: moduleId } });
    if (res?.data) {
      setSubmodules(res.data as TicketSubmoduleRow[]);
    }
  }, []);

  const fetchSubCategories = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const { search: _, ...filtersWithoutSearch } = memoizedFilters;
      return await ListSubmoduleChildren({
        page,
        perPage,
        search: search || memoizedFilters.search || "",
        filters: filtersWithoutSearch,
      });
    },
    [memoizedFilters],
  );

  const createSubCategoryMutation = useMutation({
    mutationFn: () =>
      CreateSubmoduleChild(
        newChildName,
        newChildDescription,
        newChildModuleId,
        newChildSubmoduleId,
        newChildUserExtension,
      ),
    onSuccess: async (ok) => {
      if (!ok) return;
      setNewChildName("");
      setNewChildDescription("");
      setNewChildSubmoduleId("");
      setNewChildModuleId("");
      setShowSubmoduleChildrenModal(false);
      bumpRefresh();
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
    },
    onError: () => toast.error("Failed to create subcategory"),
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: (id: string) => DeleteSubmoduleChild(id),
    onSuccess: async (ok) => {
      if (!ok) return;
      bumpRefresh();
      setSelectedSubcategoryForDelete(null);
      setShowSubmoduleDeleteModal(false);
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
    },
  });

  const handleCreateChild = useCallback(async () => {
    if (!newChildName.trim() || !newChildModuleId || !newChildSubmoduleId) {
      toast.error("Please fill in all required fields");
      return;
    }
    await createSubCategoryMutation.mutateAsync();
  }, [newChildName, newChildModuleId, newChildSubmoduleId, createSubCategoryMutation]);

  const handleDeleteChild = useCallback(async () => {
    if (!selectedSubcategoryForDelete) return;
    await deleteSubCategoryMutation.mutateAsync(selectedSubcategoryForDelete);
  }, [selectedSubcategoryForDelete, deleteSubCategoryMutation]);

  const closeSubCategoryModal = useCallback(() => {
    setShowSubmoduleChildrenModal(false);
    setNewChildName("");
    setNewChildDescription("");
    setNewChildSubmoduleId("");
    setNewChildModuleId("");
    setSubmodules([]);
  }, []);

  const columns = useMemo<Column<SubCategoryRow>[]>(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row) => row.name,
        sortable: true,
        cell: (props) => <span className="fw-medium">{props.name}</span>,
      },
      {
        key: "description",
        name: "Description",
        selector: (row) => row.description || "No description",
        sortable: true,
        cell: (props) => (
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {props.description && props.description.length > 50 ? (
              <span className="text-muted text-overflow-ellipsis" style={{ fontSize: "0.875rem" }}>
                {props.description.substring(0, 50) + "..."}
              </span>
            ) : (
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                {props.description || "No description"}
              </span>
            )}
          </span>
        ),
      },
      {
        key: "module",
        name: "Category",
        selector: (row) => row.submodule?.name || "Unknown",
        sortable: true,
        cell: (props) => (
          <span
            className="px-3 py-2 badge bg-outline-secondary text-secondary"
            style={{ fontSize: "0.813rem", border: `1px solid ${props.submodule?.color}40` }}
          >
            {props.submodule?.name || "Unknown"}
          </span>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row) => row.created_at,
        sortable: true,
        cell: (props) => (
          <span className="text-muted">{moment(props.created_at).format(GlobalDateTimeFormat)}</span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row) => row.id,
        sortable: false,
        cell: (props) => (
          <div className="d-flex gap-2">
            <Button
              variant="light"
              size="sm"
              className="btn-action-style-2 p-1 text-danger"
              title="Delete"
              type="button"
              onClick={() => {
                setSelectedSubcategoryForDelete(props.id);
                setShowSubmoduleDeleteModal(true);
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return {
    refreshKey,
    memoizedFilters,
    columns,
    fetchSubCategories,
    showSubmoduleChildrenModal,
    setShowSubmoduleChildrenModal,
    closeSubCategoryModal,
    newChildModuleId,
    newChildSubmoduleId,
    submodules,
    modules,
    handleChangeModule,
    newChildName,
    setNewChildName,
    newChildDescription,
    setNewChildDescription,
    setNewChildSubmoduleId,
    handleCreateChild,
    showSubmoduleDeleteModal,
    setShowSubmoduleDeleteModal,
    handleDeleteChild,
    openNewSubcategoryModal: () => setShowSubmoduleChildrenModal(true),
  };
}
