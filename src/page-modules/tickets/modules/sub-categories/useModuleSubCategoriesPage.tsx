import { useTicketHierarchyExtensionsQuery } from "@page-modules/tickets/useTicketHierarchyExtensionsQuery";
import { useTicketModulesAllQuery } from "@page-modules/tickets/useTicketModulesAllQuery";
import { useTicketSubmoduleChildrenListQuery } from "@page-modules/tickets/useTicketSubmoduleChildrenListQuery";
import { ticketsKeys } from "@query/keys";
import {
  ListSubmodules,
  CreateSubmoduleChild,
  DeleteSubmoduleChild,
} from "@utils/ticket-module";
import type { TableAction, TableColumn } from "@components/GenericTable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { Trash2 } from "lucide-react";
import moment from "moment";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "../categories/moduleCategoriesTypes";

export interface SubCategoryRow {
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useTicketSubmoduleChildrenListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = listQuery.data?.data ?? [];
  const totalRows = listQuery.data?.total ?? 0;
  const loading = listQuery.isFetching;

  const [showSubmoduleChildrenModal, setShowSubmoduleChildrenModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildDescription, setNewChildDescription] = useState("");
  const [newChildUserExtension] = useState<string | null>(null);
  const [newChildSubmoduleId, setNewChildSubmoduleId] = useState("");
  const [newChildModuleId, setNewChildModuleId] = useState("");

  const submodulesByModuleQuery = useQuery({
    queryKey: ticketsKeys.modules.submodulesByModule(newChildModuleId || "none"),
    queryFn: async () => {
      const res = await ListSubmodules({ filters: { module_id: newChildModuleId } });
      return (res?.data as TicketSubmoduleRow[]) ?? [];
    },
    enabled: Boolean(newChildModuleId),
  });
  const submodules = submodulesByModuleQuery.data ?? [];

  const [selectedSubcategoryForDelete, setSelectedSubcategoryForDelete] = useState<string | null>(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] = useState(false);

  const handleChangeModule = useCallback((moduleId: string) => {
    setNewChildModuleId(moduleId);
    setNewChildSubmoduleId("");
  }, []);

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
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.submoduleChildrenList.all() });
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
    },
    onError: () => toast.error("Failed to create subcategory"),
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: (id: string) => DeleteSubmoduleChild(id),
    onSuccess: async (ok) => {
      if (!ok) return;
      setSelectedSubcategoryForDelete(null);
      setShowSubmoduleDeleteModal(false);
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.submoduleChildrenList.all() });
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
  }, []);

  const handleDeleteSubCategoryRow = useCallback((row: SubCategoryRow) => {
    setSelectedSubcategoryForDelete(row.id);
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

  const columns = useMemo<TableColumn<SubCategoryRow>[]>(
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
            {row.description && row.description.length > 50
              ? `${row.description.substring(0, 50)}...`
              : row.description || "No description"}
          </span>
        ),
      },
      {
        key: "module",
        label: "Category",
        sortable: true,
        accessor: (row) => row.submodule?.name || "Unknown",
        render: (row) => (
          <span
            className="px-3 py-2 badge bg-outline-secondary text-secondary"
            style={{ fontSize: "0.813rem", border: `1px solid ${row.submodule?.color}40` }}
          >
            {row.submodule?.name || "Unknown"}
          </span>
        ),
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
    [],
  );

  const actions: TableAction<SubCategoryRow>[] = useMemo(
    () => [
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
        onClick: handleDeleteSubCategoryRow,
      },
    ],
    [handleDeleteSubCategoryRow],
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
