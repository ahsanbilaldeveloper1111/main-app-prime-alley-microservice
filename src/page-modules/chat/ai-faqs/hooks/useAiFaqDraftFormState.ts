import type { FAQItem } from "@utils/chat";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { emptyFaqDraft, type FAQItemDraft } from "../faqItemDraft";

export function useAiFaqDraftFormState() {
  const [faqItems, setFaqItems] = useState<FAQItemDraft[]>(() => [emptyFaqDraft()]);
  const [haveFiles, setHaveFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const faqItemsRef = useRef(faqItems);
  const selectedFilesRef = useRef(selectedFiles);
  faqItemsRef.current = faqItems;
  selectedFilesRef.current = selectedFiles;

  const clearFileFieldState = useCallback(() => {
    setHaveFiles(false);
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
  }, []);

  const clearAttachments = clearFileFieldState;

  const resetForm = useCallback(() => {
    setFaqItems([emptyFaqDraft()]);
    clearFileFieldState();
  }, [clearFileFieldState]);

  const handleAddFAQItem = useCallback(() => {
    setFaqItems((items) => [...items, emptyFaqDraft()]);
  }, []);

  const handleRemoveFAQItem = useCallback((clientKey: string) => {
    setFaqItems((items) =>
      items.length > 1 ? items.filter((item) => item.clientKey !== clientKey) : items,
    );
  }, []);

  const handleUpdateFAQItem = useCallback(
    (clientKey: string, field: keyof FAQItem, value: string) => {
      setFaqItems((items) =>
        items.map((item) =>
          item.clientKey === clientKey ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
    setHaveFiles(files.length > 0);
  }, []);

  const getDraftSnapshot = useCallback(
    () => ({
      faqItems: faqItemsRef.current,
      selectedFiles: selectedFilesRef.current,
    }),
    [],
  );

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
    getDraftSnapshot,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
  };
}
