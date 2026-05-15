import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  DeleteCompanyDocument,
  GetCompanyDocumentDownload,
  PostCompanyDocuments,
} from "@utils/accounting";
import { HEADER_CONSTANTS, type PermissionName } from "@constants/headerConstants";
import { accountBillingKeys } from "@query/keys";
import { useAccountBillingCompanyDocumentsQuery } from "@page-modules/billing/account-billing/useAccountBillingCompanyDocumentsQuery";
import {
  buildCompanyDocumentsFormData,
  getCompanyIdFromSession,
  getDocumentId,
  getDocumentName,
} from "./documentPageHelpers";

export function useDocumentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const companyId = useMemo(() => getCompanyIdFromSession(session), [session]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentsQuery = useAccountBillingCompanyDocumentsQuery(companyId, {
    enabled: sessionStatus !== "loading" && Boolean(companyId),
  });

  const documents = documentsQuery.data ?? [];
  const loadState = useMemo((): "idle" | "loading" | "error" => {
    if (!companyId) return "idle";
    if (documentsQuery.isError) return "error";
    if (documentsQuery.isFetching) return "loading";
    return "idle";
  }, [companyId, documentsQuery.isError, documentsQuery.isFetching]);

  const invalidateDocuments = useCallback(async () => {
    if (!companyId) return;
    await queryClient.invalidateQueries({
      queryKey: accountBillingKeys.documents.list(companyId),
    });
  }, [companyId, queryClient]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentPendingDelete, setDocumentPendingDelete] = useState<Record<string, unknown> | null>(
    null,
  );
  const [deletingDocument, setDeletingDocument] = useState(false);

  const handleDownloadDocument = useCallback(
    async (doc: Record<string, unknown>) => {
      const docId = getDocumentId(doc);
      if (!companyId || docId == null) return;
      try {
        const blob = await GetCompanyDocumentDownload(companyId, docId);
        if (!blob || !(blob instanceof Blob)) return;
        const url = globalThis.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = getDocumentName(doc);
        anchor.click();
        globalThis.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("DocumentsPage download error:", err);
      }
    },
    [companyId],
  );

  const onDownloadRow = useCallback(
    (doc: Record<string, unknown>) => {
      handleDownloadDocument(doc).catch(() => undefined);
    },
    [handleDownloadDocument],
  );

  const canUseCompanyActions =
    Boolean(companyId) && sessionStatus !== "loading";

  const canAddDocumentBilling = Boolean(
    (session?.user as { permissions?: string[] } | undefined)?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.ADD_DOCUMENT_BILLING as PermissionName,
    ),
  );

  const showAddDocumentButton = canUseCompanyActions && canAddDocumentBilling;

  const canDeleteDocumentBilling = Boolean(
    (session?.user as { permissions?: string[] } | undefined)?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.DELETE_DOCUMENT_BILLING as PermissionName,
    ),
  );

  const showDeleteDocumentButton = canUseCompanyActions && canDeleteDocumentBilling;

  const openDeleteDocumentModal = useCallback(
    (doc: Record<string, unknown>) => {
      if (!canDeleteDocumentBilling) return;
      setDocumentPendingDelete(doc);
      setShowDeleteDocumentModal(true);
    },
    [canDeleteDocumentBilling],
  );

  const closeDeleteDocumentModal = useCallback(() => {
    if (!deletingDocument) {
      setShowDeleteDocumentModal(false);
      setDocumentPendingDelete(null);
    }
  }, [deletingDocument]);

  const deleteMutation = useMutation({
    mutationFn: async (args: { companyId: string; doc: Record<string, unknown> }) => {
      const docId = getDocumentId(args.doc);
      if (docId == null) throw new Error("Missing document id");
      return DeleteCompanyDocument(args.companyId, docId);
    },
    onSuccess: async (response) => {
      const payload = response as { message?: string } | null | undefined;
      const apiMessage =
        payload && typeof payload.message === "string" ? payload.message.trim() : "";
      toast.success(apiMessage || "Document deleted successfully.");
      setShowDeleteDocumentModal(false);
      setDocumentPendingDelete(null);
      await invalidateDocuments();
    },
    onError: (error: unknown) => {
      console.error("DocumentsPage DeleteCompanyDocument error:", error);
    },
  });

  const confirmDeleteDocument = useCallback(async () => {
    if (!canDeleteDocumentBilling || !companyId || !documentPendingDelete) return;
    const docId = getDocumentId(documentPendingDelete);
    if (docId == null) return;
    setDeletingDocument(true);
    try {
      await deleteMutation.mutateAsync({ companyId, doc: documentPendingDelete });
    } catch {
      /* toast / log via onError */
    } finally {
      setDeletingDocument(false);
    }
  }, [canDeleteDocumentBilling, companyId, documentPendingDelete, deleteMutation]);

  const openUploadModal = useCallback(() => {
    if (!showAddDocumentButton) return;
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowUploadModal(true);
  }, [showAddDocumentButton]);

  const closeUploadModal = useCallback(() => {
    if (!uploading) {
      setShowUploadModal(false);
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploading]);

  const handlePendingFilesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    setPendingFiles(list ? Array.from(list) : []);
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!companyId || pendingFiles.length === 0 || !canAddDocumentBilling) return;
    setUploading(true);
    try {
      const formData = buildCompanyDocumentsFormData(pendingFiles);
      const response = await PostCompanyDocuments(companyId, formData);
      if ((response as { success?: boolean })?.success === false) {
        toast.error((response as { message?: string })?.message ?? "Failed to upload documents.");
      } else {
        toast.success((response as { message?: string })?.message ?? "Documents uploaded successfully.");
        setShowUploadModal(false);
        setPendingFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await invalidateDocuments();
      }
    } catch (error) {
      console.error("DocumentsPage PostCompanyDocuments error:", error);
      toast.error("Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  }, [companyId, pendingFiles, canAddDocumentBilling, invalidateDocuments]);

  return {
    sessionStatus,
    companyId,
    fileInputRef,
    documents,
    loadState,
    showUploadModal,
    pendingFiles,
    uploading,
    showDeleteDocumentModal,
    documentPendingDelete,
    deletingDocument,
    showAddDocumentButton,
    showDeleteDocumentButton,
    onDownloadRow,
    openDeleteDocumentModal,
    closeDeleteDocumentModal,
    confirmDeleteDocument,
    openUploadModal,
    closeUploadModal,
    handlePendingFilesChange,
    handleUploadSubmit,
  };
}
