import type { TableAction, TableColumn } from "@components/GenericTable";
import { useFAQModulesListQuery } from "@page-modules/faqs/useFAQModulesListQuery";
import { faqsKeys } from "../../../query/keys";
import { createFAQModule, deleteFAQModule, updateFAQModule } from "@utils/faqs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { ICON_FALLBACK, type FAQModuleRow } from "./faqModulesTypes";

export function useFAQModulesPage() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useFAQModulesListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = (listQuery.data?.data ?? []) as FAQModuleRow[];
  const totalRows = listQuery.data?.total ?? 0;
  const loading = listQuery.isFetching;

  const invalidateModules = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: faqsKeys.modules.all() });
  }, [queryClient]);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [newModuleIcon, setNewModuleIcon] = useState("");

  const [showEditSidebar, setShowEditSidebar] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | number | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState("");
  const [selectedModuleDescription, setSelectedModuleDescription] = useState("");
  const [selectedModuleIcon, setSelectedModuleIcon] = useState("");

  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerMode, setIconPickerMode] = useState<"create" | "edit">("create");
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [allIcons, setAllIcons] = useState<string[]>([]);

  useEffect(() => {
    const loadIcons = async () => {
      try {
        const iconData = await import("./icon-list.json");
        const iconList = iconData.default || iconData;
        if (Array.isArray(iconList) && iconList.length > 0) {
          setAllIcons(iconList);
        } else {
          throw new Error("Invalid icon data format");
        }
      } catch (e) {
        console.error("Error loading icons from JSON file:", e);
        setAllIcons(ICON_FALLBACK);
      }
    };
    loadIcons();
  }, []);

  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery) return allIcons;
    return allIcons.filter((icon) => icon.toLowerCase().includes(iconSearchQuery.toLowerCase()));
  }, [allIcons, iconSearchQuery]);

  const closeCreateSidebar = useCallback(() => {
    setShowCreateSidebar(false);
    setNewModuleName("");
    setNewModuleDescription("");
    setNewModuleIcon("");
  }, []);

  const closeEditSidebar = useCallback(() => {
    setShowEditSidebar(false);
    setSelectedModuleId(null);
    setSelectedModuleName("");
    setSelectedModuleDescription("");
    setSelectedModuleIcon("");
  }, []);

  const createMutation = useMutation({
    mutationFn: () =>
      createFAQModule(newModuleName, newModuleDescription, newModuleIcon),
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateModules();
      closeCreateSidebar();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (selectedModuleId == null) return Promise.resolve(null);
      return updateFAQModule(
        Number(selectedModuleId),
        selectedModuleName,
        selectedModuleDescription,
        selectedModuleIcon,
      );
    },
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateModules();
      closeEditSidebar();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteFAQModule(Number(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      setSelectedModuleId(null);
      setSelectedModuleName("");
      setShowDeleteModuleModal(false);
      setSuccessModalTitle("FAQ Module Deleted");
      setSuccessModalDescription("FAQ module has been deleted successfully");
      setTimeout(() => setShowSuccessfulModal(true), 100);
      await invalidateModules();
    },
  });

  const openIconPicker = useCallback((mode: "create" | "edit") => {
    setIconPickerMode(mode);
    setShowIconPicker(true);
  }, []);

  const closeIconPicker = useCallback(() => {
    setShowIconPicker(false);
    setIconSearchQuery("");
  }, []);

  const handleIconSelect = useCallback(
    (iconName: string) => {
      if (iconPickerMode === "create") {
        setNewModuleIcon(iconName);
      } else {
        setSelectedModuleIcon(iconName);
      }
      setShowIconPicker(false);
      setIconSearchQuery("");
    },
    [iconPickerMode],
  );

  const handleIconSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setIconSearchQuery(e.target.value);
  }, []);

  const openCreateSidebar = useCallback(() => setShowCreateSidebar(true), []);

  const handleSubmitCreateModule = useCallback(async () => {
    await createMutation.mutateAsync();
  }, [createMutation]);

  const handleEditModule = useCallback((row: FAQModuleRow) => {
    setSelectedModuleId(row.id);
    setSelectedModuleName(row.name);
    setSelectedModuleDescription(row.description || "");
    setSelectedModuleIcon(row.icon || "");
    setShowEditSidebar(true);
  }, []);

  const handleSubmitEditModule = useCallback(async () => {
    await updateMutation.mutateAsync();
  }, [updateMutation]);

  const handleNewModuleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewModuleName(e.target.value);
  }, []);
  const handleNewModuleDescChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewModuleDescription(e.target.value);
  }, []);
  const handleNewModuleIconTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewModuleIcon(e.target.value);
  }, []);
  const openCreateIconPicker = useCallback(() => openIconPicker("create"), [openIconPicker]);

  const handleEditModuleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedModuleName(e.target.value);
  }, []);
  const handleEditModuleDescChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setSelectedModuleDescription(e.target.value);
  }, []);
  const handleEditModuleIconTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedModuleIcon(e.target.value);
  }, []);
  const openEditIconPicker = useCallback(() => openIconPicker("edit"), [openIconPicker]);

  const handleDeleteModule = useCallback((row: FAQModuleRow) => {
    setSelectedModuleId(row.id);
    setSelectedModuleName(row.name);
    setShowDeleteModuleModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModuleModal(false);
    setSelectedModuleId(null);
    setSelectedModuleName("");
  }, []);

  const handleSubmitDeleteModule = useCallback(async () => {
    if (selectedModuleId == null) return;
    await deleteMutation.mutateAsync(selectedModuleId);
  }, [selectedModuleId, deleteMutation]);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const closeSuccessModal = useCallback(() => setShowSuccessfulModal(false), []);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const columns: TableColumn<FAQModuleRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        render: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
      },
      {
        key: "icon",
        label: "Icon",
        sortable: true,
        render: (row) => (
          <div>
            <i className="material-icons-two-tone" style={{ fontSize: "24px" }}>
              {row.icon}
            </i>
          </div>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        render: (row) => (
          <div style={{ maxWidth: "200px", whiteSpace: "normal" }}>
            <span className={row.description ? "" : "text-muted"}>
              {row.description || "No description"}
            </span>
          </div>
        ),
      },
    ],
    [],
  );

  const actions: TableAction<FAQModuleRow>[] = useMemo(
    () => [
      {
        label: "Edit",
        icon: <Edit size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-primary",
        onClick: handleEditModule,
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
        onClick: handleDeleteModule,
      },
    ],
    [handleEditModule, handleDeleteModule],
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
    showCreateSidebar,
    newModuleName,
    newModuleDescription,
    newModuleIcon,
    onNewModuleNameChange: handleNewModuleNameChange,
    onNewModuleDescChange: handleNewModuleDescChange,
    onNewModuleIconTextChange: handleNewModuleIconTextChange,
    openCreateIconPicker,
    handleSubmitCreateModule,
    openCreateSidebar,
    closeCreateSidebar,
    showEditSidebar,
    selectedModuleName,
    selectedModuleDescription,
    selectedModuleIcon,
    onEditModuleNameChange: handleEditModuleNameChange,
    onEditModuleDescChange: handleEditModuleDescChange,
    onEditModuleIconTextChange: handleEditModuleIconTextChange,
    openEditIconPicker,
    handleSubmitEditModule,
    closeEditSidebar,
    handleEditModule,
    showDeleteModuleModal,
    closeDeleteModal,
    handleSubmitDeleteModule,
    handleDeleteModule,
    showSuccessfulModal,
    successModalTitle,
    successModalDescription,
    closeSuccessModal,
    showIconPicker,
    closeIconPicker,
    allIcons,
    filteredIcons,
    iconSearchQuery,
    handleIconSearchChange,
    handleIconSelect,
    isSubmitting,
  };
}

export type { FAQModuleRow } from "./faqModulesTypes";
