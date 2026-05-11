import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import {
  type CreateTenantFAQPayload,
  type FAQData,
  createTenantFAQ,
  deleteTenantFAQ,
  getTenantFAQs,
} from "@utils/chat";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
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

let aiFaqTenantDraftIdSeq = 0;

function nextDraftRow(question = "", answer = ""): AiFaqDraftItem {
  const c = globalThis.crypto;
  const draftId =
    c !== undefined && typeof c.randomUUID === "function"
      ? c.randomUUID()
      : `draft_${Date.now()}_${(++aiFaqTenantDraftIdSeq).toString(36)}`;
  return {
    question,
    answer,
    draftId,
  };
}

export function useAIFaqsTenantPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const companiesQuery = useChatCompaniesQuery(true);
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isFetching;

  const [refreshKey, setRefreshKey] = useState(0);
  const [tenantId, setTenantId] = useState("");
  const [selectedCompanyForFilter, setSelectedCompanyForFilter] = useState("");
  const [filterTenantId, setFilterTenantId] = useState("");

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

  const getTenantId = useCallback((): string => {
    if (tenantId?.trim()) return tenantId.trim();
    if (filterTenantId?.trim()) return filterTenantId.trim();
    if (selectedCompanyForFilter?.trim()) return selectedCompanyForFilter.trim();
    const u = session?.user as { tenant_id?: string } | undefined;
    if (u?.tenant_id) return String(u.tenant_id);
    return "";
  }, [tenantId, filterTenantId, selectedCompanyForFilter, session?.user]);

  const handleEditFAQ = useCallback(
    (faq: FAQData) => {
      setSelectedFAQ(faq);
      setFaqItems([faqToDraft({ question: faq.question, answer: faq.answer })]);
      clearAttachments();
      setTenantId(filterTenantId || selectedCompanyForFilter || tenantId || "");
      setShowEditModal(true);
    },
    [clearAttachments, filterTenantId, selectedCompanyForFilter, setFaqItems, tenantId],
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
      const tenantForPayload = getTenantId();
      if (!tenantForPayload) {
        toast.error("Please select a tenant (company) first");
        return;
      }

      const fields = buildAiFaqSubmitFields(validFAQs, haveFiles, selectedFiles);
      const payload: CreateTenantFAQPayload = {
        tenant_id: tenantForPayload,
        faqs: fields.faqs,
        have_files: fields.have_files,
        files: fields.files,
      };

      await createTenantFAQ(payload);

      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedFAQ(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to save FAQs:", error);
    }
  }, [faqItems, getTenantId, haveFiles, resetForm, selectedFiles]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFAQ?.id) return;
    const tenantForDelete = getTenantId();
    if (!tenantForDelete) {
      toast.error("Please select a tenant (company) first");
      return;
    }
    try {
      await deleteTenantFAQ({
        tenant_id: tenantForDelete,
        faq_id: selectedFAQ.id,
      });

      setShowDeleteModal(false);
      setSelectedFAQ(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  }, [getTenantId, selectedFAQ]);

  const fetchData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!filterTenantId?.trim()) {
        return emptyFaqListPage(perPage);
      }
      try {
        const allFAQs = await getTenantFAQs(filterTenantId.trim(), search || undefined);
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
    },
    [filterTenantId],
  );

  const handleApplyFilter = useCallback(() => {
    if (!selectedCompanyForFilter?.trim()) {
      toast.info("Please select a company first");
      return;
    }
    setFilterTenantId(selectedCompanyForFilter.trim());
    setRefreshKey((k) => k + 1);
  }, [selectedCompanyForFilter]);

  const stableFilters = useMemo(() => ({}), []);

  const openAddModalWithTenant = useCallback(() => {
    setTenantId(filterTenantId || selectedCompanyForFilter || "");
    setShowAddModal(true);
  }, [filterTenantId, selectedCompanyForFilter]);

  const columns = useAiFaqListColumns({
    variant: "tenant",
    onEdit: handleEditFAQ,
    onDelete: handleDeleteFAQ,
  });

  return {
    router,
    refreshKey,
    columns,
    fetchData,
    stableFilters,
    companies,
    companiesLoading,
    tenantId,
    setTenantId,
    selectedCompanyForFilter,
    setSelectedCompanyForFilter,
    filterTenantId,
    handleApplyFilter,
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
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleConfirmDelete,
    openAddModalWithTenant,
  };
}
