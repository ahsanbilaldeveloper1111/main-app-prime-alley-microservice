import type { FAQItem } from "@utils/chat";
import type React from "react";
import { useCallback, useState } from "react";
import { emptyFaqDraft, type FAQItemDraft } from "../faqItemDraft";

export function useAiFaqDraftFormState() {
  const [faqItems, setFaqItems] = useState<FAQItemDraft[]>(() => [emptyFaqDraft()]);
  const [haveFiles, setHaveFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const clearAttachments = useCallback(() => {
    setHaveFiles(false);
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
  }, []);

  const resetForm = useCallback(() => {
    setFaqItems([emptyFaqDraft()]);
    setHaveFiles(false);
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
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

  return {
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
  };
}
