import type { TableAction, TableColumn } from "@components/GenericTable";
import { useTicketTypesListQuery } from "@page-modules/tickets/useTicketTypesListQuery";
import { ticketsKeys } from "../../../query/keys";
import { CreateType, DeleteType, UpdateType } from "@utils/ticket-types";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import moment from "moment";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { TicketType } from "./ticketTypesTypes";

export function useTicketTypesPage() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useTicketTypesListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = listQuery.data?.data ?? [];
  const totalRows = listQuery.data?.total ?? 0;
  const loading = listQuery.isFetching;

  const invalidateTypes = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ticketsKeys.types.all() });
  }, [queryClient]);

  const [selectedTypeId, setSelectedTypeId] = useState<string | number | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string>("");
  const [selectedTypeDescription, setSelectedTypeDescription] = useState<string>("");
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);

  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);

  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");

  const closeEditTypeModal = useCallback(() => {
    setShowEditTypeModal(false);
    setSelectedTypeId(null);
    setSelectedTypeName("");
    setSelectedTypeDescription("");
  }, []);

  const closeDeleteTypeModal = useCallback(() => {
    setShowDeleteTypeModal(false);
    setSelectedTypeId(null);
    setSelectedTypeName("");
  }, []);

  const closeCreateTypeModal = useCallback(() => {
    setShowCreateTypeModal(false);
    setNewTypeName("");
    setNewTypeDescription("");
  }, []);

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      CreateType(name, description),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateTypes();
      closeCreateTypeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string | number; name: string; description: string }) =>
      UpdateType(String(vars.id), vars.name, vars.description),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateTypes();
      closeEditTypeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => DeleteType(String(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateTypes();
      closeDeleteTypeModal();
    },
  });

  const handleEditType = useCallback((row: TicketType) => {
    setSelectedTypeId(row.id);
    setSelectedTypeName(row.name);
    setSelectedTypeDescription(row.description);
    setShowEditTypeModal(true);
  }, []);

  const handleSubmitEditType = useCallback(async () => {
    if (selectedTypeId == null) return;
    await updateMutation.mutateAsync({
      id: selectedTypeId,
      name: selectedTypeName,
      description: selectedTypeDescription,
    });
  }, [selectedTypeId, selectedTypeName, selectedTypeDescription, updateMutation]);

  const handleDeleteType = useCallback((row: TicketType) => {
    setSelectedTypeId(row.id);
    setSelectedTypeName(row.name);
    setShowDeleteTypeModal(true);
  }, []);

  const handleSubmitDeleteType = useCallback(async () => {
    if (selectedTypeId == null) return;
    await deleteMutation.mutateAsync(selectedTypeId);
  }, [selectedTypeId, deleteMutation]);

  const handleSubmitCreateType = useCallback(async () => {
    await createMutation.mutateAsync({ name: newTypeName, description: newTypeDescription });
  }, [createMutation, newTypeName, newTypeDescription]);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleNewTypeNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewTypeName(e.target.value);
  }, []);
  const handleNewTypeDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewTypeDescription(e.target.value);
  }, []);
  const handleEditTypeNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedTypeName(e.target.value);
  }, []);
  const handleEditTypeDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setSelectedTypeDescription(e.target.value);
  }, []);

  const columns: TableColumn<TicketType>[] = useMemo(
    () => [
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
          <span className="text-muted">{moment(row.created_at).format(GlobalDateTimeFormat)}</span>
        ),
      },
    ],
    [],
  );

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

  const canViewList = permissions?.includes("view-ticket-types-tickets") ?? false;
  const canCreate = permissions?.includes("add-ticket-type-tickets") ?? false;

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
    canViewList,
    canCreate,
    showEditTypeModal,
    showDeleteTypeModal,
    showCreateTypeModal,
    selectedTypeName,
    selectedTypeDescription,
    newTypeName,
    newTypeDescription,
    handleNewTypeNameChange,
    handleNewTypeDescriptionChange,
    handleEditTypeNameChange,
    handleEditTypeDescriptionChange,
    handleSubmitEditType,
    handleSubmitDeleteType,
    handleSubmitCreateType,
    closeEditTypeModal,
    closeDeleteTypeModal,
    closeCreateTypeModal,
    openCreateTypeModal: () => setShowCreateTypeModal(true),
  };
}
