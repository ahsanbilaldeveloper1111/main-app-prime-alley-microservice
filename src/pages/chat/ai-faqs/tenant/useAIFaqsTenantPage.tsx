import type { Column } from "@components/CustomDataTable";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import {
  type CreateTenantFAQPayload,
  type FAQData,
  type FAQItem,
  createTenantFAQ,
  deleteTenantFAQ,
  getTenantFAQs,
} from "@utils/chat";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { Edit, Trash2 } from "lucide-react";

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

  const [faqItems, setFaqItems] = useState<AiFaqDraftItem[]>([nextDraftRow()]);
  const [haveFiles, setHaveFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const getTenantId = useCallback((): string => {
    if (tenantId?.trim()) return tenantId.trim();
    if (filterTenantId?.trim()) return filterTenantId.trim();
    if (selectedCompanyForFilter?.trim()) return selectedCompanyForFilter.trim();
    const u = session?.user as { tenant_id?: string } | undefined;
    if (u?.tenant_id) return String(u.tenant_id);
    return "";
  }, [tenantId, filterTenantId, selectedCompanyForFilter, session?.user]);

  const resetForm = useCallback(() => {
    setFaqItems([nextDraftRow()]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
  }, []);

  const handleEditFAQ = useCallback(
    (faq: FAQData) => {
      setSelectedFAQ(faq);
      setFaqItems([nextDraftRow(faq.question, faq.answer)]);
      setHaveFiles(false);
      setSelectedFiles([]);
      setTenantId(filterTenantId || selectedCompanyForFilter || tenantId || "");
      setShowEditModal(true);
    },
    [filterTenantId, selectedCompanyForFilter, tenantId],
  );

  const handleDeleteFAQ = useCallback((faq: FAQData) => {
    setSelectedFAQ(faq);
    setShowDeleteModal(true);
  }, []);

  const handleAddFAQItem = useCallback(() => {
    setFaqItems((items) => [...items, nextDraftRow()]);
  }, []);

  const handleRemoveFAQItem = useCallback((index: number) => {
    setFaqItems((items) => (items.length > 1 ? items.filter((_, i) => i !== index) : items));
  }, []);

  const handleUpdateFAQItem = useCallback((index: number, field: keyof FAQItem, value: string) => {
    setFaqItems((items) => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setHaveFiles(files.length > 0);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setHaveFiles(next.length > 0);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const validFAQs: FAQItem[] = faqItems
      .filter((item) => item.question.trim() && item.answer.trim())
      .map(({ question, answer }) => ({ question, answer }));

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

  const columns: Column<FAQData>[] = useMemo(
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
