import type { TableAction, TableColumn } from "@components/GenericTable";
import { useAllFAQTopicsQuery } from "@page-modules/faqs/useAllFAQTopicsQuery";
import { useFAQItemsListQuery } from "@page-modules/faqs/useFAQItemsListQuery";
import { faqsKeys } from "../../../query/keys";
import { createFAQItem, deleteFAQItem, updateFAQItem } from "@utils/faqs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import {
  EMPTY_FORM_DATA,
  type FAQItemFormData,
  type FAQItemRow,
} from "./faqItemsTypes";

const PAGE_SIZE = 15;

export function useFAQItemsPage() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);
  const [searchValue, setSearchValue] = useState("");

  const listQuery = useFAQItemsListQuery({
    page: currentPage,
    perPage: rowsPerPage,
    search: searchValue,
  });

  const tableData = (listQuery.data?.data ?? []) as FAQItemRow[];
  const totalRows = listQuery.data?.total ?? 0;
  const isLoading = listQuery.isFetching;

  const invalidateItemsAndTypes = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: faqsKeys.items.all() });
    await queryClient.invalidateQueries({ queryKey: faqsKeys.itemTypes.all() });
  }, [queryClient]);

  const [formData, setFormData] = useState<FAQItemFormData>(EMPTY_FORM_DATA);
  const [selectedItemId, setSelectedItemId] = useState<string | number | null>(null);

  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showEditSidebar, setShowEditSidebar] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const sidebarOpen = showCreateSidebar || showEditSidebar;
  const topicsQuery = useAllFAQTopicsQuery(sidebarOpen);

  const topicOptions = useMemo(
    () =>
      (topicsQuery.data ?? []).map((t: any) => {
        let label = t.name as string;
        if (t.faq_module) {
          label += ` (${String(t.faq_module.name)})`;
        }
        return { value: t.id, label };
      }),
    [topicsQuery.data],
  );

  const closeCreateSidebar = useCallback(() => {
    setShowCreateSidebar(false);
    setFormData(EMPTY_FORM_DATA);
  }, []);

  const closeEditSidebar = useCallback(() => {
    setShowEditSidebar(false);
    setSelectedItemId(null);
    setFormData(EMPTY_FORM_DATA);
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: {
      topic_id: number;
      question: string;
      answer: string;
      description: string;
      type: string;
    }) => createFAQItem(payload),
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateItemsAndTypes();
      closeCreateSidebar();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string | number;
      topic_id: number;
      question: string;
      answer: string;
      description: string;
      type: string;
    }) => updateFAQItem(Number(vars.id), vars),
    onSuccess: async (response) => {
      if (!response) return;
      await invalidateItemsAndTypes();
      closeEditSidebar();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteFAQItem(Number(id)),
    onSuccess: async (ok) => {
      if (!ok) return;
      setSelectedItemId(null);
      setShowDeleteItemModal(false);
      setSuccessModalTitle("FAQ Deleted");
      setSuccessModalDescription("FAQ has been deleted successfully");
      setTimeout(() => setShowSuccessfulModal(true), 100);
      await invalidateItemsAndTypes();
    },
  });

  const handleTopicChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, topic_id: value }));
  }, []);
  const handleQuestionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, question: e.target.value }));
  }, []);
  const handleAnswerChange = useCallback((html: string) => {
    setFormData((prev) => ({ ...prev, answer: html }));
  }, []);
  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  }, []);
  const handleTypeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, type: e.target.value }));
  }, []);

  const openCreateSidebar = useCallback(() => {
    setFormData(EMPTY_FORM_DATA);
    setShowCreateSidebar(true);
  }, []);

  const handleSubmitCreateItem = useCallback(async () => {
    if (!formData.topic_id || !formData.question || !formData.answer) return;
    await createMutation.mutateAsync({
      topic_id: Number.parseInt(formData.topic_id, 10),
      question: formData.question,
      answer: formData.answer,
      description: formData.description,
      type: formData.type,
    });
  }, [formData, createMutation]);

  const handleEditItem = useCallback((row: FAQItemRow) => {
    setSelectedItemId(row.id);
    setFormData({
      topic_id: row.topic_id?.toString() || "",
      question: row.question || "",
      answer: row.answer || "",
      description: row.description || "",
      type: row.type || "",
    });
    setShowEditSidebar(true);
  }, []);

  const handleSubmitEditItem = useCallback(async () => {
    if (!formData.topic_id || !formData.question || !formData.answer || selectedItemId == null) {
      return;
    }
    await updateMutation.mutateAsync({
      id: selectedItemId,
      topic_id: Number.parseInt(formData.topic_id, 10),
      question: formData.question,
      answer: formData.answer,
      description: formData.description,
      type: formData.type,
    });
  }, [formData, selectedItemId, updateMutation]);

  const handleDeleteItem = useCallback((row: FAQItemRow) => {
    setSelectedItemId(row.id);
    setShowDeleteItemModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteItemModal(false);
    setSelectedItemId(null);
  }, []);

  const handleSubmitDeleteItem = useCallback(async () => {
    if (selectedItemId == null) return;
    await deleteMutation.mutateAsync(selectedItemId);
  }, [selectedItemId, deleteMutation]);

  const closeSuccessModal = useCallback(() => setShowSuccessfulModal(false), []);

  const handlePaginationChange = useCallback((page: number, perPage: number) => {
    setCurrentPage(page);
    setRowsPerPage(perPage);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const columns: TableColumn<FAQItemRow>[] = useMemo(
    () => [
      {
        key: "question",
        label: "Question",
        sortable: true,
        type: "text",
      },
      {
        key: "topic",
        label: "Topic",
        sortable: false,
        render: (row: FAQItemRow) => {
          if (!row.topic) return <span className="text-muted">No topic</span>;
          return (
            <div>
              <span className="status-badge primary" title={row.topic.description || ""}>
                {row.topic.name}
                {row.topic.faq_module && (
                  <span className="text-muted ms-1" style={{ fontSize: "0.85em" }}>
                    ({row.topic.faq_module.name})
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        key: "type",
        label: "Type",
        sortable: true,
        render: (row: FAQItemRow) => {
          if (!row.type) return <span className="text-muted">N/A</span>;
          return <span className="status-badge primary">{row.type}</span>;
        },
      },
      {
        key: "view_count",
        label: "Views",
        sortable: true,
        render: (row: FAQItemRow) => (
          <span className="status-badge primary">{row.view_count || 0}</span>
        ),
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        render: (row: FAQItemRow) => (
          <span>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}</span>
        ),
      },
    ],
    [],
  );

  const actions: TableAction<FAQItemRow>[] = useMemo(
    () => [
      {
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: handleEditItem,
        variant: "light",
        className: "btn-action-style-2 p-1 text-primary",
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: handleDeleteItem,
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
      },
    ],
    [handleEditItem, handleDeleteItem],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return {
    tableData,
    totalRows,
    isLoading,
    columns,
    actions,
    currentPage,
    rowsPerPage,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
    formData,
    topicOptions,
    isLoadingTopics: topicsQuery.isFetching,
    showCreateSidebar,
    showEditSidebar,
    selectedItemId,
    handleTopicChange,
    handleQuestionChange,
    handleAnswerChange,
    handleDescriptionChange,
    handleTypeChange,
    openCreateSidebar,
    closeCreateSidebar,
    closeEditSidebar,
    handleSubmitCreateItem,
    handleSubmitEditItem,
    showDeleteItemModal,
    closeDeleteModal,
    handleSubmitDeleteItem,
    showSuccessfulModal,
    successModalTitle,
    successModalDescription,
    closeSuccessModal,
    isSubmitting,
  };
}

export type { FAQItemRow };
