import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  deleteDealAttachment,
  downloadDealAttachment,
  getDealAttachments,
  uploadDealAttachment,
} from "@utils/crm";

export type CrmDealAttachmentDeleteTarget = {
  id: number;
  name: string;
};

type Args = {
  selectedDealForAttachments: { id?: number } | null | undefined;
  showAttachmentModal: boolean;
};

export function useCrmDealAttachmentModal({
  selectedDealForAttachments,
  showAttachmentModal,
}: Args) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
    null,
  );
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] =
    useState(false);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<CrmDealAttachmentDeleteTarget | null>(null);

  const refreshAttachmentsList = useCallback(async () => {
    const dealId = selectedDealForAttachments?.id;
    if (!dealId) return;
    setLoadingAttachments(true);
    try {
      const data = await getDealAttachments(dealId);
      setAttachments(data || []);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, [selectedDealForAttachments?.id]);

  useEffect(() => {
    if (showAttachmentModal && selectedDealForAttachments?.id) {
      refreshAttachmentsList().catch((err) => {
        console.error("Failed to refresh attachments:", err);
      });
    } else {
      setAttachments([]);
    }
  }, [
    showAttachmentModal,
    selectedDealForAttachments?.id,
    refreshAttachmentsList,
  ]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const dealId = selectedDealForAttachments?.id;
      if (!dealId) return;

      setUploadingFile(true);
      try {
        await uploadDealAttachment(dealId, file, file.name);
        await refreshAttachmentsList();
        if (fileInputRef) {
          fileInputRef.value = "";
        }
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
        setUploadingFile(false);
      }
    },
    [selectedDealForAttachments?.id, refreshAttachmentsList, fileInputRef],
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      const dealId = selectedDealForAttachments?.id;
      if (!dealId) return;

      try {
        await deleteDealAttachment(dealId, attachmentId);
        await refreshAttachmentsList();
        toast.success("Attachment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete attachment:", error);
        toast.error("Failed to delete attachment");
      }
    },
    [selectedDealForAttachments?.id, refreshAttachmentsList],
  );

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;

    await handleDeleteAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteAttachment]);

  const handleDownloadAttachment = useCallback(
    async (attachmentId: number) => {
      const dealId = selectedDealForAttachments?.id;
      if (!dealId) return;

      try {
        await downloadDealAttachment(dealId, attachmentId);
      } catch (error) {
        console.error("Failed to download attachment:", error);
      }
    },
    [selectedDealForAttachments?.id],
  );

  return {
    attachments,
    loadingAttachments,
    uploadingFile,
    fileInputRef,
    setFileInputRef,
    showDeleteAttachmentModal,
    setShowDeleteAttachmentModal,
    attachmentToDelete,
    setAttachmentToDelete,
    handleFileUpload,
    handleDeleteAttachment,
    confirmDeleteAttachment,
    handleDownloadAttachment,
  };
}
