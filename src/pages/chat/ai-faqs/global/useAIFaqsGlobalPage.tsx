import type { Column } from "@components/CustomDataTable";
import {
  type CreateTenantFAQPayload,
  type FAQData,
  createGlobalFAQ,
  deleteGlobalFAQ,
  getGlobalFAQs,
} from "@utils/chat";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { Edit, Eye, Trash2 } from "lucide-react";

import {
  aiFaqAnswerPreviewColumn,
  aiFaqQuestionColumn,
} from "../aiFaqListColumns";
import {
  buildAiFaqSubmitFields,
  emptyFaqListPage,
  getValidFaqItemsForSubmit,
  paginateArrayForTable,
} from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../useAiFaqDraftFormState";

export function useAIFaqsGlobalPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  const {
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
    seedSingleFaqItem,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
  } = useAiFaqDraftFormState();

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewFAQ, setViewFAQ] = useState<FAQData | null>(null);

  const handleViewFAQ = useCallback((faq: FAQData) => {
    setViewFAQ(faq);
    setShowViewModal(true);
  }, []);

  const handleEditFAQ = useCallback(
    (faq: FAQData) => {
      setSelectedFAQ(faq);
      seedSingleFaqItem({ question: faq.question, answer: faq.answer });
      setShowEditModal(true);
    },
    [seedSingleFaqItem],
  );

  const handleDeleteFAQ = useCallback((faq: FAQData) => {
    setSelectedFAQ(faq);
    setShowDeleteModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    const validFAQs = getValidFaqItemsForSubmit(faqItems);
    if (validFAQs.length === 0) {
      toast.error("Please add at least one FAQ with both question and answer");
      return;
    }

    try {
      const payload: Omit<CreateTenantFAQPayload, "tenant_id"> = buildAiFaqSubmitFields(
        validFAQs,
        haveFiles,
        selectedFiles,
      );

      await createGlobalFAQ(payload);

      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedFAQ(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to save FAQs:", error);
    }
  }, [faqItems, haveFiles, selectedFiles, resetForm]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFAQ?.id) return;

    try {
      await deleteGlobalFAQ(selectedFAQ.id);
      setShowDeleteModal(false);
      setSelectedFAQ(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  }, [selectedFAQ]);

  const fetchData = useCallback(async (page = 1, perPage = 15, search = "") => {
    try {
      const allFAQs = await getGlobalFAQs(search || undefined);
      return paginateArrayForTable(allFAQs, page, perPage);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return emptyFaqListPage<FAQData>(perPage);
    }
  }, []);

  const columns: Column<FAQData & Record<string, unknown>>[] = useMemo(
    () => [
      aiFaqQuestionColumn(),
      aiFaqAnswerPreviewColumn({ previewLength: 50 }),
      {
        key: "Action",
        name: "Actions",
        selector: (row: FAQData) => row.id,
        sortable: false,
        cell: (props: FAQData) => (
          <div className="d-flex gap-2">
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-primary"
              title="View"
              onClick={() => handleViewFAQ(props)}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-primary"
              title="Edit"
              onClick={() => handleEditFAQ(props)}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="light"
              className="btn-action-style-2 p-1 text-danger"
              title="Delete"
              onClick={() => handleDeleteFAQ(props)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    [handleViewFAQ, handleEditFAQ, handleDeleteFAQ],
  );

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedFAQ(null);
  }, []);

  return {
    router,
    refreshKey,
    columns,
    fetchData,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedFAQ,
    setSelectedFAQ,
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    showViewModal,
    setShowViewModal,
    viewFAQ,
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleConfirmDelete,
    closeDeleteModal,
  };
}
