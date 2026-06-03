import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { TableColumn } from "@components/GenericTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import { Edit, Trash2 } from "lucide-react";
import { useAllFAQModulesQuery } from "@page-modules/faqs/useAllFAQModulesQuery";
import { useFAQTopicsListQuery } from "@page-modules/faqs/useFAQTopicsListQuery";
import { faqsKeys } from "@query/keys";
import { createFAQTopic, deleteFAQTopic, updateFAQTopic } from "@utils/faqs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { renderFaqCountCell, renderFaqDescriptionCell, renderFaqModuleCell } from "@components/faqTableCells";

export interface FAQTopicRow {
  id: string | number;
  name: string;
  description: string;
  faq_module_id: number | null;
  faq_module: { name: string } | null;
  faqs_count: number;
}

export function useFAQTopicsPage() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useFAQTopicsListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const data = (listQuery.data?.data ?? []) as FAQTopicRow[];
  const totalRows = listQuery.data?.total ?? 0;
  const loading = listQuery.isFetching;

  const invalidateTopicsAndItems = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: faqsKeys.topics.all() });
    await queryClient.invalidateQueries({ queryKey: faqsKeys.items.all() });
  }, [queryClient]);

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"create" | "edit" | null>(null);
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topicModuleId, setTopicModuleId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | number | null>(null);

  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState(false);
  const [deleteTopicName, setDeleteTopicName] = useState("");

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const modulesQuery = useAllFAQModulesQuery(showSidebar);
  const moduleOptions = useMemo(
    () =>
      (modulesQuery.data ?? []).map((m: { id: unknown; name: string }) => ({
        value: m.id,
        label: m.name,
      })),
    [modulesQuery.data],
  );

  const closeSidebar = useCallback(() => {
    setShowSidebar(false);
    setSidebarMode(null);
    setTopicName("");
    setTopicDescription("");
    setTopicModuleId("");
    setSelectedTopicId(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: () =>
      createFAQTopic(Number.parseInt(topicModuleId, 10), topicName, topicDescription),
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateTopicsAndItems();
      closeSidebar();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (selectedTopicId == null) return Promise.resolve(null);
      return updateFAQTopic(
        Number(selectedTopicId),
        Number.parseInt(topicModuleId, 10),
        topicName,
        topicDescription,
      );
    },
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateTopicsAndItems();
      closeSidebar();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteFAQTopic(Number(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      setSelectedTopicId(null);
      setDeleteTopicName("");
      setShowDeleteTopicModal(false);
      setSuccessModalTitle("FAQ Topic Deleted");
      setSuccessModalDescription("FAQ topic has been deleted successfully");
      setTimeout(() => setShowSuccessfulModal(true), 100);
      await invalidateTopicsAndItems();
    },
  });

  const openCreateSidebar = useCallback(() => {
    setSidebarMode("create");
    setTopicName("");
    setTopicDescription("");
    setTopicModuleId("");
    setSelectedTopicId(null);
    setShowSidebar(true);
  }, []);

  const openEditSidebar = useCallback((row: FAQTopicRow) => {
    setSidebarMode("edit");
    setSelectedTopicId(row.id);
    setTopicName(row.name);
    setTopicDescription(row.description || "");
    setTopicModuleId(row.faq_module_id?.toString() || "");
    setShowSidebar(true);
  }, []);

  const handleSubmitTopic = useCallback(async () => {
    if (!topicModuleId || !topicName.trim()) return;
    if (sidebarMode === "create") {
      await createMutation.mutateAsync();
    } else if (sidebarMode === "edit") {
      await updateMutation.mutateAsync();
    }
  }, [topicModuleId, topicName, sidebarMode, createMutation, updateMutation]);

  const handleTopicNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTopicName(e.target.value);
  }, []);
  const handleTopicDescChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setTopicDescription(e.target.value);
  }, []);
  const handleTopicModuleChange = useCallback((value: string) => setTopicModuleId(value), []);

  const handleDeleteTopic = useCallback((row: FAQTopicRow) => {
    setSelectedTopicId(row.id);
    setDeleteTopicName(row.name);
    setShowDeleteTopicModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteTopicModal(false);
    setSelectedTopicId(null);
    setDeleteTopicName("");
  }, []);

  const handleSubmitDeleteTopic = useCallback(async () => {
    if (selectedTopicId == null) return;
    await deleteMutation.mutateAsync(selectedTopicId);
  }, [selectedTopicId, deleteMutation]);

  const closeSuccessModal = useCallback(() => setShowSuccessfulModal(false), []);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const baseColumns: TableColumn<FAQTopicRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        render: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
      },
      {
        key: "faq_module",
        label: "Module",
        sortable: false,
        render: (row) => renderFaqModuleCell(row),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        render: (row) => renderFaqDescriptionCell(row),
      },
      {
        key: "faqs_count",
        label: "FAQs Count",
        sortable: true,
        render: (row) => renderFaqCountCell(row),
      },
    ],
    [],
  );

  const columns = useMemo(
    () =>
      appendSettingsActionsColumn<FAQTopicRow>(baseColumns, (row): CrmTableRowAction[] => [
        {
          label: `Edit ${row.name}`,
          icon: <Edit size={22} aria-hidden />,
          tone: "primary",
          onClick: () => openEditSidebar(row),
        },
        {
          label: `Delete ${row.name}`,
          icon: <Trash2 size={22} aria-hidden />,
          tone: "danger",
          onClick: () => handleDeleteTopic(row),
        },
      ]),
    [baseColumns, openEditSidebar, handleDeleteTopic],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return {
    data,
    loading,
    columns,
    currentPage,
    rowsPerPage,
    totalRows,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
    showSidebar,
    sidebarMode,
    moduleOptions,
    isLoadingModules: modulesQuery.isFetching,
    topicName,
    topicDescription,
    topicModuleId,
    handleTopicNameChange,
    handleTopicDescChange,
    handleTopicModuleChange,
    handleSubmitTopic,
    openCreateSidebar,
    closeSidebar,
    showDeleteTopicModal,
    deleteTopicName,
    closeDeleteModal,
    handleSubmitDeleteTopic,
    showSuccessfulModal,
    successModalTitle,
    successModalDescription,
    closeSuccessModal,
    isSubmitting,
  };
}
