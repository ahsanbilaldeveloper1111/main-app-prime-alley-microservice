import { useTicketHierarchyExtensionsQuery } from "@page-modules/tickets/useTicketHierarchyExtensionsQuery";
import { useTicketModulesAllQuery } from "@page-modules/tickets/useTicketModulesAllQuery";
import { useTicketSubmodulesListQuery } from "@page-modules/tickets/useTicketSubmodulesListQuery";
import { ticketsKeys } from "@query/keys";
import { CreateSubmodule, DeleteSubmodule } from "@utils/ticket-module";
import type { TableAction, TableColumn } from "@components/GenericTable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useCallback, useMemo, useState } from "react";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { Trash2 } from "lucide-react";
import moment from "moment";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "./moduleCategoriesTypes";

export function useModuleCategoriesPage() {
  const queryClient = useQueryClient();
  const modulesQuery = useTicketModulesAllQuery();
  useTicketHierarchyExtensionsQuery();

  const modules: TicketModulePickerRow[] = modulesQuery.data ?? [];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useTicketSubmodulesListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = listQuery.data?.data ?? [];
  const totalRows = listQuery.data?.total ?? 0;
  const loading = listQuery.isFetching;

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newSubmoduleName, setNewSubmoduleName] = useState("");
  const [newSubmoduleDescription, setNewSubmoduleDescription] = useState("");
  const [newSubmoduleModuleId, setNewSubmoduleModuleId] = useState("");
  const [newSubmoduleUserExtension, setNewSubmoduleUserExtension] = useState<string | null>(null);

  const [selectedSubmoduleForDelete, setSelectedSubmoduleForDelete] = useState<string | null>(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] = useState(false);

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
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.submodulesList.all() });
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modulesAll() });
    },
    onError: () => toast.error("Failed to create submodule"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => DeleteSubmodule(id),
    onSuccess: async (ok) => {
      if (!ok) return;
      toast.success("Submodule deleted successfully");
      setSelectedSubmoduleForDelete(null);
      setShowSubmoduleDeleteModal(false);
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.submodulesList.all() });
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
    },
  });

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

  const handleDeleteCategoryRow = useCallback((row: TicketSubmoduleRow) => {
    setSelectedSubmoduleForDelete(row.id);
    setShowSubmoduleDeleteModal(true);
  }, []);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const columns: TableColumn<TicketSubmoduleRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        render: (row) => <span className="fw-medium">{row.name}</span>,
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        render: (row) => (
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {row.description || "No description"}
          </span>
        ),
      },
      {
        key: "module",
        label: "Module",
        sortable: true,
        accessor: (row) => {
          const moduleItem = modules.find((m) => m.id == row.module_id);
          return moduleItem?.name || "Unknown";
        },
        render: (row) => {
          const moduleItem = modules.find((m) => m.id == row.module_id);
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
        label: "Created At",
        sortable: true,
        render: (row) => (
          <span className="text-muted">{moment(row.created_at).format(GlobalDateTimeFormat)}</span>
        ),
      },
    ],
    [modules],
  );

  const actions: TableAction<TicketSubmoduleRow>[] = useMemo(
    () => [
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
        onClick: handleDeleteCategoryRow,
      },
    ],
    [handleDeleteCategoryRow],
  );

  return {
    data,
    loading,
    columns,
    actions,
    currentPage,
    rowsPerPage,
    totalRows,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
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
