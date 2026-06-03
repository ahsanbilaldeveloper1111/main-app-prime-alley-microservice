import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { TableColumn } from "@components/GenericTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import { useTicketHierarchyExtensionsQuery } from "@page-modules/tickets/useTicketHierarchyExtensionsQuery";
import { useTicketModulesListQuery } from "@page-modules/tickets/useTicketModulesListQuery";
import { ticketsKeys } from "@query/keys";
import {
  CreateModule,
  DeleteModule,
  DeleteSubmodule,
  ListSubmodules,
  UpdateModule,
  type TicketModuleRecord,
} from "@utils/ticket-module";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import moment from "moment";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { Package, Edit, Trash2 } from "lucide-react";
import {
  DEFAULT_TICKET_MODULE_COLOR,
  TICKET_MODULE_COLOR_SUGGESTIONS,
  type TicketModule,
} from "./ticketModulesTypes";

export function useTicketModulesPage() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const queryClient = useQueryClient();

  const extensionsQuery = useTicketHierarchyExtensionsQuery();
  const extensions = extensionsQuery.data ?? [];

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const modulesListQuery = useTicketModulesListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = modulesListQuery.data?.data ?? [];
  const totalRows = modulesListQuery.data?.total ?? 0;
  const loading = modulesListQuery.isFetching;

  const invalidateModules = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
  }, [queryClient]);

  const [selectedModuleId, setSelectedModuleId] = useState<string | number | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState("");
  const [selectedModuleDescription, setSelectedModuleDescription] = useState("");
  const [selectedModuleColor, setSelectedModuleColor] = useState("");
  const [selectedModuleUserExtension, setSelectedModuleUserExtension] = useState<string | null>(
    null,
  );
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);

  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [newModuleColor, setNewModuleColor] = useState(DEFAULT_TICKET_MODULE_COLOR);
  const [newModuleUserExtension, setNewModuleUserExtension] = useState<string | null>(null);

  const [selectedModuleForSubmodules, setSelectedModuleForSubmodules] =
    useState<TicketModuleRecord | null>(null);
  const [showSubmoduleModal, setShowSubmoduleModal] = useState(false);

  const submodulesQuery = useQuery({
    queryKey: ticketsKeys.modules.submodulesByModule(
      selectedModuleForSubmodules?.id == null
        ? "__none__"
        : String(selectedModuleForSubmodules.id),
    ),
    queryFn: async () => {
      const mid = selectedModuleForSubmodules?.id;
      if (mid == null) return [];
      const response = await ListSubmodules({ filters: { module_id: String(mid) } });
      return response?.data ?? [];
    },
    enabled: showSubmoduleModal && selectedModuleForSubmodules != null,
  });

  const submodules = submodulesQuery.data ?? [];

  const closeCreateModuleModal = useCallback(() => {
    setShowCreateModuleModal(false);
    setNewModuleName("");
    setNewModuleDescription("");
    setNewModuleColor(DEFAULT_TICKET_MODULE_COLOR);
    setNewModuleUserExtension(null);
  }, []);

  const closeEditModuleModal = useCallback(() => {
    setShowEditModuleModal(false);
    setSelectedModuleId(null);
    setSelectedModuleName("");
    setSelectedModuleDescription("");
    setSelectedModuleColor("");
    setSelectedModuleUserExtension(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: (vars: {
      name: string;
      description: string;
      color: string;
      userExtension: string | null;
    }) => CreateModule(vars.name, vars.description, vars.color, vars.userExtension),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateModules();
      closeCreateModuleModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string | number;
      name: string;
      description: string;
      color: string;
      userExtension: string | null;
    }) =>
      UpdateModule(
        String(vars.id),
        vars.name,
        vars.description,
        vars.color,
        vars.userExtension,
      ),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateModules();
      closeEditModuleModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => DeleteModule(String(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      await invalidateModules();
      setSelectedModuleId(null);
      setDeleteTargetName("");
      setShowDeleteModuleModal(false);
    },
  });

  const deleteSubmoduleMutation = useMutation({
    mutationFn: (submoduleId: string | number) => DeleteSubmodule(String(submoduleId)),
    onSuccess: async (ok) => {
      if (!ok) return;
      await queryClient.invalidateQueries({ queryKey: ticketsKeys.modules.all() });
      await submodulesQuery.refetch();
    },
  });

  const openCreateModuleModal = useCallback(() => setShowCreateModuleModal(true), []);

  const closeDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(false), []);

  const handleEditModule = useCallback((row: TicketModule) => {
    setSelectedModuleId(row.id);
    setSelectedModuleName(row.name);
    setSelectedModuleDescription(row.description);
    setSelectedModuleColor(row.color);
    setSelectedModuleUserExtension(row.user_extension || null);
    setShowEditModuleModal(true);
  }, []);

  const handleSubmitEditModule = useCallback(async () => {
    if (selectedModuleId == null) return;
    await updateMutation.mutateAsync({
      id: selectedModuleId,
      name: selectedModuleName,
      description: selectedModuleDescription,
      color: selectedModuleColor,
      userExtension: selectedModuleUserExtension,
    });
  }, [
    selectedModuleId,
    selectedModuleName,
    selectedModuleDescription,
    selectedModuleColor,
    selectedModuleUserExtension,
    updateMutation,
  ]);

  const handleDeleteModule = useCallback((row: TicketModule) => {
    setSelectedModuleId(row.id);
    setDeleteTargetName(row.name);
    setShowDeleteModuleModal(true);
  }, []);

  const handleSubmitDeleteModule = useCallback(async () => {
    if (selectedModuleId == null) return;
    await deleteMutation.mutateAsync(selectedModuleId);
  }, [selectedModuleId, deleteMutation]);

  const handleSubmitCreateModule = useCallback(async () => {
    await createMutation.mutateAsync({
      name: newModuleName,
      description: newModuleDescription,
      color: newModuleColor,
      userExtension: newModuleUserExtension,
    });
  }, [createMutation, newModuleName, newModuleDescription, newModuleColor, newModuleUserExtension]);

  const openSubmoduleModal = useCallback((module: TicketModule) => {
    setSelectedModuleForSubmodules(module);
    setShowSubmoduleModal(true);
  }, []);

  const closeSubmoduleModal = useCallback(() => {
    setShowSubmoduleModal(false);
    setSelectedModuleForSubmodules(null);
  }, []);

  const handleDeleteSubmodule = useCallback(
    async (submodule: { id: string | number; name?: string }) => {
      if (
        !globalThis.confirm(
          `Are you sure you want to delete submodule "${submodule.name ?? ""}"?`,
        )
      ) {
        return;
      }
      await deleteSubmoduleMutation.mutateAsync(submodule.id);
    },
    [deleteSubmoduleMutation],
  );

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleNewModuleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewModuleName(e.target.value);
  }, []);
  const handleNewModuleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewModuleDescription(e.target.value);
  }, []);
  const handleNewModuleColorChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewModuleColor(e.target.value);
  }, []);
  const handleEditModuleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedModuleName(e.target.value);
  }, []);
  const handleEditModuleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setSelectedModuleDescription(e.target.value);
  }, []);
  const handleEditModuleColorChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedModuleColor(e.target.value);
  }, []);

  const baseColumns: TableColumn<TicketModule>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        render: (row) => (
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: row.color,
                flexShrink: 0,
              }}
            />
            <span className="fw-medium">{row.name}</span>
          </div>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        render: (row) => (
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {row.description}
          </span>
        ),
      },
      {
        key: "color",
        label: "Color",
        sortable: true,
        render: (row) => (
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: row.color,
                border: "1px solid #dee2e6",
                flexShrink: 0,
              }}
            />
            <code style={{ fontSize: "0.813rem", color: "#6c757d" }}>{row.color}</code>
          </div>
        ),
      },
      {
        key: "user_extension",
        label: "User Extension",
        sortable: true,
        render: (row) => (
          <span
            className="px-3 py-2 badge"
            style={{
              fontWeight: 500,
              fontSize: "0.813rem",
              backgroundColor: `${row.color}20`,
              color: row.color,
              border: `1px solid ${row.color}40`,
            }}
          >
            {(extensions as { id?: string | number; display_name?: string }[]).find(
              (ext) => ext.id?.toString() === row.user_extension?.toString(),
            )?.display_name ||
              row.user_extension ||
              "Not assigned"}
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
    [extensions],
  );

  const canViewList = permissions?.includes("ticket-modules-tickets") ?? false;
  const canEdit = permissions?.includes("edit-ticket-module-tickets") ?? false;
  const canDelete = permissions?.includes("delete-ticket-module-tickets") ?? false;

  const columns = useMemo(() => {
    if (!canEdit && !canDelete && !canViewList) {
      return baseColumns;
    }
    return appendSettingsActionsColumn<TicketModule>(baseColumns, (row): CrmTableRowAction[] => [
      ...(canEdit
        ? [
            {
              label: `Edit ${row.name}`,
              icon: <Edit size={22} aria-hidden />,
              tone: "primary" as const,
              onClick: () => handleEditModule(row),
            },
          ]
        : []),
      ...(canViewList
        ? [
            {
              label: `Submodules for ${row.name}`,
              icon: <Package size={22} aria-hidden />,
              tone: "info" as const,
              onClick: () => openSubmoduleModal(row),
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              label: `Delete ${row.name}`,
              icon: <Trash2 size={22} aria-hidden />,
              tone: "danger" as const,
              onClick: () => handleDeleteModule(row),
            },
          ]
        : []),
    ]);
  }, [
    baseColumns,
    canEdit,
    canDelete,
    canViewList,
    handleEditModule,
    handleDeleteModule,
    openSubmoduleModal,
  ]);

  const canCreate = permissions?.includes("create-ticket-module-tickets") ?? false;

  return {
    extensions,
    data,
    loading,
    columns,
    currentPage,
    rowsPerPage,
    totalRows,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
    canViewList,
    canCreate,
    showEditModuleModal,
    selectedModuleName,
    selectedModuleDescription,
    selectedModuleColor,
    selectedModuleUserExtension,
    setSelectedModuleUserExtension,
    handleEditModuleNameChange,
    handleEditModuleDescriptionChange,
    handleEditModuleColorChange,
    setSelectedModuleColor,
    handleSubmitEditModule,
    closeEditModuleModal,
    showDeleteModuleModal,
    deleteTargetName,
    handleSubmitDeleteModule,
    closeDeleteModuleModal,
    showCreateModuleModal,
    newModuleName,
    newModuleDescription,
    newModuleColor,
    newModuleUserExtension,
    setNewModuleUserExtension,
    handleNewModuleNameChange,
    handleNewModuleDescriptionChange,
    handleNewModuleColorChange,
    setNewModuleColor,
    handleSubmitCreateModule,
    openCreateModuleModal,
    closeCreateModuleModal,
    showSubmoduleModal,
    selectedModuleForSubmodules,
    submodules,
    closeSubmoduleModal,
    handleDeleteSubmodule,
    colorSuggestions: TICKET_MODULE_COLOR_SUGGESTIONS,
  };
}
