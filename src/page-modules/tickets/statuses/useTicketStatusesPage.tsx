import type { TableAction, TableColumn } from "@components/GenericTable";
import { ticketsKeys } from "@query/keys";
import { useTicketStatusesListQuery } from "@page-modules/tickets/useTicketStatusesListQuery";
import { CreateStatus, DeleteStatus, UpdateStatus } from "@utils/ticket-statuses";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import moment from "moment";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import {
  CREATE_SIDEBAR_CONFIG,
  DEFAULT_STATUS_COLOR,
  EDIT_SIDEBAR_CONFIG,
  type TicketStatus,
} from "./ticketStatusesTypes";

export function useTicketStatusesPage() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [searchValue, setSearchValue] = useState<string>("");

  const [selectedStatusId, setSelectedStatusId] = useState<string | number | null>(null);
  const [selectedStatusName, setSelectedStatusName] = useState<string>("");
  const [selectedStatusColor, setSelectedStatusColor] = useState<string>("");
  const [showEditStatusModal, setShowEditStatusModal] = useState<boolean>(false);

  const [showDeleteStatusModal, setShowDeleteStatusModal] = useState<boolean>(false);

  const [showCreateStatusSidebar, setShowCreateStatusSidebar] = useState<boolean>(false);
  const [newStatusName, setNewStatusName] = useState<string>("");
  const [newStatusColor, setNewStatusColor] = useState<string>(DEFAULT_STATUS_COLOR);

  const statusesListQuery = useTicketStatusesListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = statusesListQuery.data?.data ?? [];
  const totalRows = statusesListQuery.data?.total ?? 0;
  const loading = statusesListQuery.isFetching;

  const invalidateStatusesList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ticketsKeys.statuses.all() });
  }, [queryClient]);

  const openCreateStatusSidebar = useCallback(() => setShowCreateStatusSidebar(true), []);

  const closeCreateStatusSidebar = useCallback(() => {
    setShowCreateStatusSidebar(false);
    setNewStatusName("");
    setNewStatusColor(DEFAULT_STATUS_COLOR);
  }, []);

  const closeEditStatusModal = useCallback(() => setShowEditStatusModal(false), []);

  const closeDeleteStatusModal = useCallback(() => setShowDeleteStatusModal(false), []);

  const createStatusMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => CreateStatus(name, color),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateStatusesList();
      closeCreateStatusSidebar();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: string | number; name: string; color: string }) =>
      UpdateStatus(String(vars.id), vars.name, vars.color),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateStatusesList();
      setSelectedStatusId(null);
      setSelectedStatusName("");
      setSelectedStatusColor("");
      setShowEditStatusModal(false);
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: string | number) => DeleteStatus(String(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateStatusesList();
      setSelectedStatusId(null);
      setSelectedStatusName("");
      setShowDeleteStatusModal(false);
    },
  });

  const handleEditStatus = useCallback((row: TicketStatus) => {
    setSelectedStatusId(row.id);
    setSelectedStatusName(row.name);
    setSelectedStatusColor(row.color);
    setShowEditStatusModal(true);
  }, []);

  const handleSubmitEditStatus = useCallback(async () => {
    if (selectedStatusId == null) return;
    await updateStatusMutation.mutateAsync({
      id: selectedStatusId,
      name: selectedStatusName,
      color: selectedStatusColor,
    });
  }, [selectedStatusId, selectedStatusName, selectedStatusColor, updateStatusMutation]);

  const handleEditStatusNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedStatusName(e.target.value);
  }, []);
  const handleEditStatusColorChange = useCallback((color: string) => setSelectedStatusColor(color), []);

  const handleDeleteStatus = useCallback((row: TicketStatus) => {
    setSelectedStatusId(row.id);
    setSelectedStatusName(row.name);
    setShowDeleteStatusModal(true);
  }, []);

  const handleSubmitDeleteStatus = useCallback(async () => {
    if (selectedStatusId == null) return;
    await deleteStatusMutation.mutateAsync(selectedStatusId);
  }, [selectedStatusId, deleteStatusMutation]);

  const handleNewStatusNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewStatusName(e.target.value);
  }, []);
  const handleNewStatusColorChange = useCallback((color: string) => setNewStatusColor(color), []);

  const handleSubmitCreateStatus = useCallback(async () => {
    await createStatusMutation.mutateAsync({ name: newStatusName, color: newStatusColor });
  }, [createStatusMutation, newStatusName, newStatusColor]);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const columns: TableColumn<TicketStatus>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Status Name",
        sortable: true,
        render: (row) => (
          <div className="font-weight-500" style={{ display: "flex", alignItems: "center" }}>
            <span
              className="rounded-circle"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: row.color,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span className="ms-2">{row.name}</span>
          </div>
        ),
      },
      {
        key: "color",
        label: "Color",
        sortable: true,
        render: (row) => (
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor: row.color,
                width: "24px",
                height: "24px",
                borderRadius: "8px",
                display: "inline-block",
              }}
            />
            <code
              style={{
                fontSize: "0.813rem",
                color: row.color,
                backgroundColor: "#f8f9fa",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {row.color}
            </code>
          </div>
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
    []
  );

  const actions: TableAction<TicketStatus>[] = useMemo(() => {
    const canEdit = permissions?.includes("edit-ticket-status-tickets");
    const canDelete = permissions?.includes("delete-ticket-status-tickets");

    const acts: TableAction<TicketStatus>[] = [];

    if (canEdit) {
      acts.push({
        label: "Edit",
        icon: <Edit size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-primary",
        onClick: handleEditStatus,
      });
    }

    if (canDelete) {
      acts.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
        onClick: handleDeleteStatus,
      });
    }

    return acts;
  }, [permissions, handleEditStatus, handleDeleteStatus]);

  const canViewList = permissions?.includes("ticket-statuses-tickets") ?? false;
  const canCreate = permissions?.includes("create-ticket-status-tickets") ?? false;

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
    showCreateStatusSidebar,
    newStatusName,
    newStatusColor,
    handleNewStatusNameChange,
    handleNewStatusColorChange,
    handleSubmitCreateStatus,
    openCreateStatusSidebar,
    closeCreateStatusSidebar,
    createSidebarConfig: CREATE_SIDEBAR_CONFIG,
    showEditStatusModal,
    selectedStatusName,
    selectedStatusColor,
    handleEditStatusNameChange,
    handleEditStatusColorChange,
    handleSubmitEditStatus,
    closeEditStatusModal,
    editSidebarConfig: EDIT_SIDEBAR_CONFIG,
    showDeleteStatusModal,
    closeDeleteStatusModal,
    handleSubmitDeleteStatus,
  };
}
