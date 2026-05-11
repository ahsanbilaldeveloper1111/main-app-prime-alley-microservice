import type { Column } from "@components/CustomDataTable";
import {
  type CreateTenantFAQPayload,
  type FAQData,
  type FAQItem,
  createGlobalFAQ,
  deleteGlobalFAQ,
  getGlobalFAQs,
} from "@utils/chat";
import { useRouter } from "next/router";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { Edit, Eye, Trash2 } from "lucide-react";

import { emptyFaqDraft, faqToDraft, type FAQItemDraft } from "../faqItemDraft";

export function useAIFaqsGlobalPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  const [faqItems, setFaqItems] = useState<FAQItemDraft[]>([emptyFaqDraft()]);
  const [haveFiles, setHaveFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewFAQ, setViewFAQ] = useState<FAQData | null>(null);

  const resetForm = useCallback(() => {
    setFaqItems([emptyFaqDraft()]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
  }, []);

  const handleViewFAQ = useCallback((faq: FAQData) => {
    setViewFAQ(faq);
    setShowViewModal(true);
  }, []);

  const handleEditFAQ = useCallback((faq: FAQData) => {
    setSelectedFAQ(faq);
    setFaqItems([faqToDraft({ question: faq.question, answer: faq.answer })]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setShowEditModal(true);
  }, []);

  const handleDeleteFAQ = useCallback((faq: FAQData) => {
    setSelectedFAQ(faq);
    setShowDeleteModal(true);
  }, []);

  const handleAddFAQItem = useCallback(() => {
    setFaqItems((items) => [...items, emptyFaqDraft()]);
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
      const faqsJson = JSON.stringify(validFAQs);
      const filePaths: string[] = selectedFiles.map((file) => file.name);

      const payload: Omit<CreateTenantFAQPayload, "tenant_id"> = {
        faqs: faqsJson,
        have_files: haveFiles && selectedFiles.length > 0 ? "true" : "false",
        files: filePaths.length > 0 ? filePaths : undefined,
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
  }, []);

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
          <div>
            {props.answer.length > 50 ? <span>{props.answer.substring(0, 50)}...</span> : <span>{props.answer}</span>}
          </div>
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
