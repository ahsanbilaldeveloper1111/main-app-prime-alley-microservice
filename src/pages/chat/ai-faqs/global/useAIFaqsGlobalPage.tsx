import {
  type CreateTenantFAQPayload,
  type FAQData,
  createGlobalFAQ,
  deleteGlobalFAQ,
  getGlobalFAQs,
} from "@utils/chat";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { useAiFaqListColumns } from "../aiFaqListColumns";
import {
  buildAiFaqSubmitFields,
  emptyFaqListPage,
  faqToDraft,
  getValidFaqItemsForSubmit,
  paginateArrayForTable,
} from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../hooks/useAiFaqDraftFormState";

type AiFaqDraftItem = FAQItem & Readonly<{ draftId: string }>;

let aiFaqGlobalDraftIdSeq = 0;

function nextDraftRow(question = "", answer = ""): AiFaqDraftItem {
  const c = globalThis.crypto;
  const draftId =
    c !== undefined && typeof c.randomUUID === "function"
      ? c.randomUUID()
      : `draft_${Date.now()}_${(++aiFaqGlobalDraftIdSeq).toString(36)}`;
  return {
    question,
    answer,
    draftId,
  };
}

export function useAIFaqsGlobalPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  const {
    faqItems,
    setFaqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
    clearAttachments,
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
      setFaqItems([faqToDraft({ question: faq.question, answer: faq.answer })]);
      clearAttachments();
      setShowEditModal(true);
    },
    [clearAttachments, setFaqItems],
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
      const fields = buildAiFaqSubmitFields(validFAQs, haveFiles, selectedFiles);
      const payload: Omit<CreateTenantFAQPayload, "tenant_id"> = {
        faqs: fields.faqs,
        have_files: fields.have_files,
        files: fields.files,
      };

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
      const { slice, total, last_page } = paginateArrayForTable(allFAQs, page, perPage);

      return {
        data: slice,
        total,
        page,
        per_page: perPage,
        last_page,
      };
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return emptyFaqListPage(perPage);
    }
  }, []);

  const columns = useAiFaqListColumns({
    variant: "global",
    onView: handleViewFAQ,
    onEdit: handleEditFAQ,
    onDelete: handleDeleteFAQ,
  });

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
  };
}
