import { useTicketHierarchyExtensionsQuery } from "@page-modules/tickets/useTicketHierarchyExtensionsQuery";
import { useTicketModulesAllQuery } from "@page-modules/tickets/useTicketModulesAllQuery";
import { ticketsKeys } from "../../../../query/keys";
import { CreateSubmodule, DeleteSubmodule, ListSubmodules } from "@utils/ticket-module";
import { Column } from "@components/CustomDataTable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useCallback, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { Trash2 } from "lucide-react";
import moment from "moment";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "./moduleCategoriesTypes";

export function useModuleCategoriesPage() {
  const queryClient = useQueryClient();
  const modulesQuery = useTicketModulesAllQuery();
  useTicketHierarchyExtensionsQuery();

  const modules: TicketModulePickerRow[] = modulesQuery.data ?? [];

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters] = useState({ search: "" });
  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newSubmoduleName, setNewSubmoduleName] = useState("");
  const [newSubmoduleDescription, setNewSubmoduleDescription] = useState("");
  const [newSubmoduleModuleId, setNewSubmoduleModuleId] = useState("");
  const [newSubmoduleUserExtension, setNewSubmoduleUserExtension] = useState<string | null>(null);

  const [selectedSubmoduleForDelete, setSelectedSubmoduleForDelete] = useState<string | null>(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] = useState(false);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      CreateSubmodule(
        newSubmoduleName,
        newSubmoduleDescription,
        newSubmoduleModuleId,
        newSubmoduleUserExtension,
      ),
    onSuccess: async (ok) => {
      if (!ok) return;
      setNewSubmoduleName("");
      setNewSubmoduleDescription("");
      setNewSubmoduleModuleId("");
      setNewSubmoduleUserExtension(null);
      setShowCreateModal(false);
      bumpRefresh();
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modulesAll() });
    },
    onError: () => toast.error("Failed to create submodule"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => DeleteSubmodule(id),
    onSuccess: async (ok) => {
      if (!ok) return;
      bumpRefresh();
      toast.success("Submodule deleted successfully");
      setSelectedSubmoduleForDelete(null);
      setShowSubmoduleDeleteModal(false);
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
    },
  });

  const fetchSubmodules = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListSubmodules({
        page,
        perPage,
        search: memoizedFilters.search || search,
        filters: memoizedFilters,
      });
    },
    [memoizedFilters],
  );

  const handleCreateSubmodule = useCallback(() => {
    if (!newSubmoduleName.trim() || !newSubmoduleModuleId) {
      toast.error("Please fill in all required fields");
      return;
    }
    createCategoryMutation.mutate();
  }, [newSubmoduleName, newSubmoduleModuleId, createCategoryMutation]);

  const handleDeleteSubmodule = useCallback(() => {
    if (!selectedSubmoduleForDelete) return;
    deleteCategoryMutation.mutate(selectedSubmoduleForDelete);
  }, [selectedSubmoduleForDelete, deleteCategoryMutation]);

  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: TicketSubmoduleRow) => row.name,
        sortable: true,
        cell: (props: TicketSubmoduleRow) => <span className="fw-medium">{props.name}</span>,
      },
      {
        key: "description",
        name: "Description",
        selector: (row: TicketSubmoduleRow) => row.description || "No description",
        sortable: true,
        cell: (props: TicketSubmoduleRow) => (
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {props.description || "No description"}
          </span>
        ),
      },
      {
        key: "module",
        name: "Module",
        selector: (row: TicketSubmoduleRow) => {
          const moduleItem = modules.find((m) => m.id == row.module_id);
          return moduleItem?.name || "Unknown";
        },
        sortable: true,
        cell: (props: TicketSubmoduleRow) => {
          const moduleItem = modules.find((m) => m.id == props.module_id);
          return (
            <span
              className="px-3 py-2 badge bg-outline-secondary text-secondary"
              style={{
                fontWeight: "500",
                fontSize: "0.813rem",
                backgroundColor: `${moduleItem?.color}20`,
                color: moduleItem?.color,
                border: `1px solid ${moduleItem?.color}40`,
              }}
            >
              {moduleItem?.name || "Unknown"}
            </span>
          );
        },
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: TicketSubmoduleRow) => row.created_at,
        sortable: true,
        cell: (props: TicketSubmoduleRow) => (
          <span className="text-muted">{moment(props.created_at).format(GlobalDateTimeFormat)}</span>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: TicketSubmoduleRow) => row.id,
        sortable: false,
        cell: (props: TicketSubmoduleRow) => (
          <div className="d-flex gap-2">
            <Button
              variant="light"
              size="sm"
              className="btn-action-style-2 p-1 text-danger"
              title="Delete"
              type="button"
              onClick={() => {
                setSelectedSubmoduleForDelete(props.id);
                setShowSubmoduleDeleteModal(true);
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    [modules],
  );

  return {
    refreshKey,
    memoizedFilters,
    columns,
    fetchSubmodules,
    showCreateModal,
    setShowCreateModal,
    newSubmoduleName,
    setNewSubmoduleName,
    newSubmoduleDescription,
    setNewSubmoduleDescription,
    newSubmoduleModuleId,
    setNewSubmoduleModuleId,
    newSubmoduleUserExtension,
    setNewSubmoduleUserExtension,
    modules,
    handleCreateSubmodule,
    showSubmoduleDeleteModal,
    setShowSubmoduleDeleteModal,
    handleDeleteSubmodule,
    setSelectedSubmoduleForDelete,
  };
}
