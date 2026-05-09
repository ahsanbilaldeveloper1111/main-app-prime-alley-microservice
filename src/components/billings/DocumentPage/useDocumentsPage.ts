import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  DeleteCompanyDocument,
  GetCompanyDocumentDownload,
  GetCompanyDocuments,
  PostCompanyDocuments,
} from "@utils/accounting";
import { HEADER_CONSTANTS, type PermissionName } from "@constants/headerConstants";
import {
  buildCompanyDocumentsFormData,
  getCompanyIdFromSession,
  getDocumentId,
  getDocumentName,
  normalizeCompanyDocumentsResponse,
} from "./documentPageHelpers";

export function useDocumentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const companyId = useMemo(() => getCompanyIdFromSession(session), [session]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadVersionRef = useRef(0);

  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentPendingDelete, setDocumentPendingDelete] = useState<Record<string, unknown> | null>(
    null,
  );
  const [deletingDocument, setDeletingDocument] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!companyId) {
      setDocuments([]);
      setLoadState("idle");
      return;
    }
    loadVersionRef.current += 1;
    const version = loadVersionRef.current;
    setLoadState("loading");
    try {
      const raw = await GetCompanyDocuments(companyId);
      if (version !== loadVersionRef.current) return;
      setDocuments(normalizeCompanyDocumentsResponse(raw));
      setLoadState("idle");
    } catch (err) {
      if (version !== loadVersionRef.current) return;
      console.error("DocumentsPage GetCompanyDocuments error:", err);
      setDocuments([]);
      setLoadState("error");
    }
  }, [companyId]);

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

  useEffect(() => {
    if (sessionStatus === "loading") {
      return undefined;
    }

    if (!companyId) {
      loadVersionRef.current += 1;
      setDocuments([]);
      setLoadState("idle");
      return undefined;
    }

    loadDocuments().catch(() => undefined);

    return () => {
      loadVersionRef.current += 1;
    };
  }, [companyId, sessionStatus, loadDocuments]);

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

  const confirmDeleteDocument = useCallback(async () => {
    if (!canDeleteDocumentBilling || !companyId || !documentPendingDelete) return;
    const docId = getDocumentId(documentPendingDelete);
    if (docId == null) return;
    setDeletingDocument(true);
    try {
      const response = await DeleteCompanyDocument(companyId, docId);
      const payload = response as { message?: string } | null | undefined;
      const apiMessage =
        payload && typeof payload.message === "string" ? payload.message.trim() : "";
      toast.success(apiMessage || "Document deleted successfully.");
      setShowDeleteDocumentModal(false);
      setDocumentPendingDelete(null);
      await loadDocuments();
    } catch (error: unknown) {
      console.error("DocumentsPage DeleteCompanyDocument error:", error);
    } finally {
      setDeletingDocument(false);
    }
  }, [canDeleteDocumentBilling, companyId, documentPendingDelete, loadDocuments]);

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
        await loadDocuments();
      }
    } catch (error) {
      console.error("DocumentsPage PostCompanyDocuments error:", error);
      toast.error("Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  }, [companyId, pendingFiles, loadDocuments, canAddDocumentBilling]);

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
