import { chatKeys } from "@query/keys";
import {
  type CreateGlobalFAQPayload,
  type FAQData,
  createGlobalFAQ,
  deleteGlobalFAQ,
  getGlobalFAQs,
} from "@utils/chat";
import type { GenericListPageQueryParams } from "@components/GenericListPage";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { useAiFaqListColumns } from "../aiFaqListColumns";

const { PERMISSIONS } = HEADER_CONSTANTS;
import {
  buildAiFaqSubmitFields,
  emptyFaqListPage,
  paginateArrayForTable,
  validateAiFaqDraftSubmit,
} from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../hooks/useAiFaqDraftFormState";

export function useAIFaqsGlobalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canDeleteFaq = hasPermission(PERMISSIONS.DELETE_GLOBAL_FAQS_AI_CHAT);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  const {
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
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

  const handleDeleteFAQ = useCallback(
    (faq: FAQData) => {
      if (!canDeleteFaq) {
        toast.error("You do not have permission to delete global FAQs.");
        return;
      }
      setSelectedFAQ(faq);
      setShowDeleteModal(true);
    },
    [canDeleteFaq],
  );

  const openAddModal = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    const validation = validateAiFaqDraftSubmit(faqItems, haveFiles, selectedFiles);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const { validFAQs } = validation;

    try {
      const fields = buildAiFaqSubmitFields(validFAQs, haveFiles, selectedFiles);
      const payload: CreateGlobalFAQPayload = {
        faqs: fields.faqs,
        have_files: fields.have_files,
        ...(fields.files?.length ? { files: fields.files } : {}),
      };

      await createGlobalFAQ(payload);

      resetForm();
      setShowAddModal(false);
      setSelectedFAQ(null);
      await queryClient.invalidateQueries({ queryKey: chatKeys.aiFaqs.global.all() });
    } catch (error) {
      console.error("Failed to save FAQs:", error);
    }
  }, [faqItems, haveFiles, selectedFiles, resetForm, queryClient]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFAQ?.id) return;
    if (!canDeleteFaq) {
      toast.error("You do not have permission to delete global FAQs.");
      return;
    }

    try {
      await deleteGlobalFAQ({ faq_id: selectedFAQ.id });
      setShowDeleteModal(false);
      setSelectedFAQ(null);
      await queryClient.invalidateQueries({ queryKey: chatKeys.aiFaqs.global.all() });
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  }, [canDeleteFaq, selectedFAQ, queryClient]);

  const stableFilters = useMemo(() => ({}), []);

  const getListQueryOptions = useCallback((params: GenericListPageQueryParams) => {
    return {
      queryKey: chatKeys.aiFaqs.global.list({
        page: params.page,
        perPage: params.perPage,
        search: params.search,
      }),
      queryFn: async () => {
        try {
          const allFAQs = await getGlobalFAQs(params.search || undefined);
          const { slice, total, last_page } = paginateArrayForTable(
            allFAQs,
            params.page,
            params.perPage,
          );
          return {
            data: slice,
            total,
            page: params.page,
            per_page: params.perPage,
            last_page,
          };
        } catch (error) {
          console.error("Error fetching FAQs:", error);
          return emptyFaqListPage(params.perPage);
        }
      },
    };
  }, []);

  const columns = useAiFaqListColumns({
    variant: "global",
    onView: handleViewFAQ,
    onDelete: handleDeleteFAQ,
    canDelete: canDeleteFaq,
  });

  return {
    router,
    columns,
    getListQueryOptions,
    stableFilters,
    showAddModal,
    setShowAddModal,
    openAddModal,
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
