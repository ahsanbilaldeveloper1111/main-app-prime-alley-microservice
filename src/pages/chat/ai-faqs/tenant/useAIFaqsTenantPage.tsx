import type { Column } from "@components/CustomDataTable";
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
import { Button } from "react-bootstrap";
import { Edit, Trash2 } from "lucide-react";

import { getValidFaqItemsForSubmit } from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../useAiFaqDraftFormState";

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
      seedSingleFaqItem({ question: faq.question, answer: faq.answer });
      setTenantId(filterTenantId || selectedCompanyForFilter || tenantId || "");
      setShowEditModal(true);
    },
    [filterTenantId, selectedCompanyForFilter, tenantId, seedSingleFaqItem],
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

      const faqsJson = JSON.stringify(validFAQs);
      const filePaths: string[] = selectedFiles.map((file) => file.name);

      const payload: CreateTenantFAQPayload = {
        tenant_id: tenantForPayload,
        faqs: faqsJson,
        have_files: haveFiles && selectedFiles.length > 0 ? "true" : "false",
        files: filePaths.length > 0 ? filePaths : undefined,
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
  }, [faqItems, haveFiles, selectedFiles, getTenantId, resetForm]);

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
  }, [selectedFAQ, getTenantId]);

  const fetchData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      if (!filterTenantId?.trim()) {
        return {
          data: [],
          total: 0,
          page: 1,
          per_page: perPage,
          last_page: 1,
        };
      }
      try {
        const allFAQs = await getTenantFAQs(filterTenantId.trim(), search || undefined);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginated = allFAQs.slice(start, end);

        return {
          data: paginated,
          total: allFAQs.length,
          page,
          per_page: perPage,
          last_page: Math.ceil(allFAQs.length / perPage),
        };
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        return {
          data: [],
          total: 0,
          page: 1,
          per_page: perPage,
          last_page: 1,
        };
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

  const columns: Column<FAQData & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "question",
        name: "Question",
        selector: (row: FAQData) => row.question,
        sortable: true,
        cell: (props: FAQData) => (
          <div style={{ maxWidth: "400px" }}>
            <strong>{props.question}</strong>
          </div>
        ),
      },
      {
        key: "answer",
        name: "Answer",
        selector: (row: FAQData) => row.answer,
        sortable: true,
        cell: (props: FAQData) => (
          <div style={{ maxWidth: "500px" }}>
            {props.answer.length > 100 ? (
              <span>{props.answer.substring(0, 100)}...</span>
            ) : (
              <span>{props.answer}</span>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created At",
        selector: (row: FAQData) => row.created_at || "",
        sortable: true,
        cell: (props: FAQData) => (
          <span>{props.created_at ? new Date(props.created_at).toLocaleDateString() : "N/A"}</span>
        ),
      },
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
    [handleEditFAQ, handleDeleteFAQ],
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
    closeDeleteModal,
  };
}
