import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import moment from "moment";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  DeleteCompanyDocument,
  GetCompanyDocumentDownload,
  GetCompanyDocuments,
  PostCompanyDocuments,
} from "@utils/accounting";
import { GlobalDateFormat } from "@utils/Helper";
import { HEADER_CONSTANTS, type PermissionName } from "@constants/headerConstants";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

type SessionUserWithCompanyIds = {
  company_indentifier?: string;
  company_identifier?: string;
};

function getCompanyIdFromSession(session: ReturnType<typeof useSession>["data"]): string {
  const user = session?.user as SessionUserWithCompanyIds | undefined;
  const raw = user?.company_indentifier ?? user?.company_identifier ?? "";
  return typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
}

function normalizeCompanyDocumentsResponse(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is Record<string, unknown> => item != null && typeof item === "object");
  }
  if (raw != null && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const inner = obj.data ?? obj.documents ?? obj.items;
    if (Array.isArray(inner)) {
      return inner.filter((item): item is Record<string, unknown> => item != null && typeof item === "object");
    }
  }
  return [];
}

function getDocumentId(doc: Record<string, unknown>): string | number | undefined {
  const v = doc.id ?? doc.document_id ?? doc.documentId;
  if (typeof v === "string" || typeof v === "number") return v;
  return undefined;
}

function getDocumentName(doc: Record<string, unknown>): string {
  const v = doc.name ?? doc.filename ?? doc.title ?? doc.file_name;
  return typeof v === "string" && v.trim() ? v : "Document";
}

function getDocumentType(doc: Record<string, unknown>): string {
  const v = doc.type ?? doc.document_type ?? doc.category;
  return typeof v === "string" ? v : "";
}

function getUpdatedAtDisplay(doc: Record<string, unknown>): string {
  const v = doc.updated_at ?? doc.updatedAt ?? doc.modified_at;
  if (v == null || v === "") return "";
  if (typeof v === "string" || typeof v === "number") {
    const parsed = moment(v);
    return parsed.isValid() ? parsed.format(GlobalDateFormat) : String(v);
  }
  return "";
}

function getExternalUrl(doc: Record<string, unknown>): string | undefined {
  const url = doc.external_url ?? doc.url ?? doc.file_url;
  if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;
  return undefined;
}

function buildCompanyDocumentsFormData(files: File[]): FormData {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files[]", file);
    formData.append("name[]", file.name);
    formData.append("types[]", file.type || "application/octet-stream");
  }
  return formData;
}

const s: Record<string, CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "24px",
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 20px 0",
    lineHeight: "29px",
  },
  pageHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    fontFamily: font,
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "rgb(0, 97, 98)",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  modalHint: {
    fontFamily: font,
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  fileList: {
    marginTop: 16,
    paddingLeft: 20,
    fontFamily: font,
    fontSize: 14,
    color: "#141414",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    overflow: "hidden",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontFamily: font,
  },
  thead: {
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #e5e5e5",
  },
  th: {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  td: {
    padding: "16px 16px",
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    verticalAlign: "middle" as const,
    borderBottom: "1px solid #e5e5e5",
    lineHeight: "20px",
  },
  link: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: font,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    padding: 0,
  },
  docName: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    fontFamily: font,
    fontSize: 14,
    textDecoration: "underline",
  },
  muted: {
    fontSize: 14,
    fontFamily: font,
    color: "#666",
    padding: "24px 16px",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  actionDivider: {
    color: "#ccc",
    fontWeight: 300,
    fontSize: 14,
    userSelect: "none" as const,
  },
  deleteButton: {
    fontWeight: 600,
    color: "#b71c1c",
    cursor: "pointer",
    fontFamily: font,
    fontSize: 14,
    background: "none",
    border: "none",
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: "24%",
  },
};

const termsOfServiceUrl =
  typeof process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL === "string"
    ? process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL.trim()
    : "";

/** Always shown as the last row (after API documents), matching the original static list. */
function TermsOfServiceTableRow(): ReactNode {
  return (
    <tr style={{ backgroundColor: "#fff", borderBottom: "none" }}>
      <td style={s.td}>
        {termsOfServiceUrl ? (
          <a href={termsOfServiceUrl} rel="noopener noreferrer" target="_blank" style={s.link}>
            Terms of Service
            <ExternalLink size={13} aria-hidden />
          </a>
        ) : (
          <span
            style={{
              ...s.docName,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            Terms of Service
            <ExternalLink size={13} aria-hidden />
          </span>
        )}
      </td>
      <td style={{ ...s.td, color: "#141414" }} />
      <td style={{ ...s.td, color: "#141414" }} />
      <td style={s.td} />
      <td style={s.td}></td>
    </tr>
  );
}

function renderDocumentNameCell(
  doc: Record<string, unknown>,
  name: string,
  externalUrl: string | undefined,
  docNameStyle: CSSProperties,
  linkStyle: CSSProperties,
  onDownload: () => void
): ReactNode {
  if (externalUrl) {
    return (
      <a href={externalUrl} rel="noopener noreferrer" target="_blank" style={linkStyle}>
        {name}
        <ExternalLink size={13} aria-hidden />
      </a>
    );
  }
  const docId = getDocumentId(doc);
  if (docId != null) {
    return (
      <button
        type="button"
        style={{ ...linkStyle, ...docNameStyle }}
        aria-label={`Download ${name}`}
        onClick={() => {
          onDownload();
        }}
      >
        {name}
      </button>
    );
  }
  return <span style={docNameStyle}>{name}</span>;
}

function renderDocumentActionsCell(
  doc: Record<string, unknown>,
  linkStyle: CSSProperties,
  onDownload: () => void,
  onDelete: (() => void) | undefined
): ReactNode {
  if (getExternalUrl(doc)) {
    return "—";
  }
  const docId = getDocumentId(doc);
  if (docId == null) {
    return "—";
  }
  return (
    <div style={s.actionRow}>
      <button type="button" style={{ ...linkStyle, textDecoration: "underline" }} onClick={onDownload}>
        Download
      </button>
      {onDelete ? (
        <>
          <span style={s.actionDivider} aria-hidden>
            |
          </span>
          <button
            type="button"
            style={s.deleteButton}
            onClick={onDelete}
            aria-label={`Delete ${getDocumentName(doc)}`}
          >
            Delete
          </button>
        </>
      ) : null}
    </div>
  );
}

type BillingDocumentTableRowProps = Readonly<{
  doc: Record<string, unknown>;
  onDownloadRow: (doc: Record<string, unknown>) => void;
  onRequestDeleteRow: (doc: Record<string, unknown>) => void;
  showDeleteDocumentButton: boolean;
}>;

function BillingDocumentTableRow({
  doc,
  onDownloadRow,
  onRequestDeleteRow,
  showDeleteDocumentButton,
}: BillingDocumentTableRowProps): ReactNode {
  const externalUrl = getExternalUrl(doc);
  const name = getDocumentName(doc);

  const downloadThisDoc = () => {
    onDownloadRow(doc);
  };

  const deleteThisDoc = () => {
    onRequestDeleteRow(doc);
  };

  const deleteHandler = showDeleteDocumentButton ? deleteThisDoc : undefined;

  return (
    <tr
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      <td style={s.td}>
        {renderDocumentNameCell(doc, name, externalUrl, s.docName, s.link, downloadThisDoc)}
      </td>
      <td style={{ ...s.td, color: "#141414" }}>{getUpdatedAtDisplay(doc)}</td>
      <td style={{ ...s.td, color: "#141414" }}>{getDocumentType(doc)}</td>
      <td style={s.td}>
        {renderDocumentActionsCell(doc, s.link, downloadThisDoc, deleteHandler)}
      </td>
    </tr>
  );
}

export default function DocumentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const companyId = useMemo(() => getCompanyIdFromSession(session), [session]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentPendingDelete, setDocumentPendingDelete] = useState<Record<string, unknown> | null>(
    null
  );
  const [deletingDocument, setDeletingDocument] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!companyId) {
      setDocuments([]);
      setLoadState("idle");
      return;
    }
    setLoadState("loading");
    try {
      console.log("DocumentsPage companyId:", companyId);
      const raw = await GetCompanyDocuments(companyId);
      console.log("GetCompanyDocuments response:", raw);
      setDocuments(normalizeCompanyDocumentsResponse(raw));
      setLoadState("idle");
    } catch (err) {
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
    [companyId]
  );

  const onDownloadRow = useCallback(
    (doc: Record<string, unknown>) => {
      handleDownloadDocument(doc).catch(() => undefined);
    },
    [handleDownloadDocument]
  );

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!companyId) {
      console.log("DocumentsPage: no company id on session.user (company_indentifier / company_identifier)");
      setDocuments([]);
      setLoadState("idle");
      return;
    }

    loadDocuments().catch(() => undefined);
  }, [companyId, sessionStatus, loadDocuments]);

  const canUseCompanyActions =
    Boolean(companyId) && sessionStatus !== "loading";

  const canAddDocumentBilling = Boolean(
    (session?.user as { permissions?: string[] } | undefined)?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.ADD_DOCUMENT_BILLING as PermissionName
    )
  );

  const showAddDocumentButton = canUseCompanyActions && canAddDocumentBilling;

  const canDeleteDocumentBilling = Boolean(
    (session?.user as { permissions?: string[] } | undefined)?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.DELETE_DOCUMENT_BILLING as PermissionName
    )
  );

  const showDeleteDocumentButton = canUseCompanyActions && canDeleteDocumentBilling;

  const openDeleteDocumentModal = useCallback(
    (doc: Record<string, unknown>) => {
      if (!canDeleteDocumentBilling) return;
      setDocumentPendingDelete(doc);
      setShowDeleteDocumentModal(true);
    },
    [canDeleteDocumentBilling]
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
     const response = await  DeleteCompanyDocument(companyId, docId);
     console.log("DeleteCompanyDocument response:", response);
     if ((response as any)?.success === true) {
      toast.success((response as any)?.message ?? "Document deleted.");
      setShowDeleteDocumentModal(false);
      setDocumentPendingDelete(null);
      await loadDocuments();
    } else {
      toast.error((response as any)?.message ?? "Failed to delete document.");
    }
    } catch (error) {
      console.error("DocumentsPage DeleteCompanyDocument error:", error);
      toast.error("Failed to delete document.");
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
      console.log("PostCompanyDocuments response:", response);
      if ((response as any)?.success === false) {
        toast.error((response as any)?.message ?? "Failed to upload documents.");
      } else {
        toast.success((response as any)?.message ?? "Documents uploaded successfully.");
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

  const bodyContent = () => {
    if (sessionStatus === "loading" || loadState === "loading") {
      return (
        <tr>
          <td colSpan={5} style={s.muted}>
            Loading documents…
          </td>
        </tr>
      );
    }

    if (!companyId) {
      return (
        <tr>
          <td colSpan={5} style={s.muted}>
            Company ID is not available. Sign in again or contact support.
          </td>
        </tr>
      );
    }

    if (loadState === "error") {
      return (
        <tr>
          <td colSpan={5} style={s.muted}>
            Could not load documents. Please try again later.
          </td>
        </tr>
      );
    }

    if (documents.length === 0) {
      return <TermsOfServiceTableRow />;
    }

    return (
      <>
        {documents.map((doc, idx) => (
          <BillingDocumentTableRow
            key={String(getDocumentId(doc) ?? `row-${idx}`)}
            doc={doc}
            onDownloadRow={onDownloadRow}
            onRequestDeleteRow={openDeleteDocumentModal}
            showDeleteDocumentButton={showDeleteDocumentButton}
          />
        ))}
        <TermsOfServiceTableRow key="terms-of-service" />
      </>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeaderRow}>
        <h1 style={{ ...s.pageHeading, margin: 0 }}>Documents</h1>
        {showAddDocumentButton ? (
          <button
            type="button"
            style={s.primaryButton}
            onClick={openUploadModal}
          >
            Add New Document
          </button>
        ) : null}
      </div>

      <Modal show={showUploadModal && showAddDocumentButton} onHide={closeUploadModal} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: font, fontWeight: 600 }}>Add New Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={s.modalHint}>Select one or more files to upload.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            aria-label="Choose files to upload"
            style={{ display: "none" }}
            onChange={handlePendingFilesChange}
          />
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Choose files
          </Button>
          {pendingFiles.length > 0 ? (
            <ul style={s.fileList}>
              {pendingFiles.map((file) => (
                <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                  {file.name}
                  <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>
                    ({file.type || "application/octet-stream"})
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeUploadModal} disabled={uploading}>
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "rgb(0, 97, 98)", borderColor: "rgb(0, 97, 98)" }}
            onClick={() => {
              handleUploadSubmit().catch(() => undefined);
            }}
            disabled={uploading || pendingFiles.length === 0}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteDocumentModal}
        onHide={closeDeleteDocumentModal}
        onConfirm={() => {
          confirmDeleteDocument().catch(() => undefined);
        }}
        itemType="document"
        itemName={
          documentPendingDelete ? getDocumentName(documentPendingDelete) : undefined
        }
        loading={deletingDocument}
      />

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Updated At</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>{bodyContent()}</tbody>
        </table>
      </div>
    </div>
  );
}
