import type { ChangeEvent, CSSProperties, ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button, Modal } from "react-bootstrap";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import {
  getDocumentId,
  getDocumentName,
  getDocumentType,
  getExternalUrl,
  getUpdatedAtDisplay,
} from "./documentPageHelpers";
import { documentPageFont, documentPageStyles as s, termsOfServiceUrl } from "./documentPageStyles";

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
    </tr>
  );
}

function renderDocumentNameCell(
  doc: Record<string, unknown>,
  name: string,
  externalUrl: string | undefined,
  docNameStyle: CSSProperties,
  linkStyle: CSSProperties,
  onDownload: () => void,
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
  onDelete: (() => void) | undefined,
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

export type DocumentsPageViewProps = Readonly<{
  sessionStatus: string;
  companyId: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  documents: Record<string, unknown>[];
  loadState: "idle" | "loading" | "error";
  showUploadModal: boolean;
  pendingFiles: File[];
  uploading: boolean;
  showDeleteDocumentModal: boolean;
  documentPendingDelete: Record<string, unknown> | null;
  deletingDocument: boolean;
  showAddDocumentButton: boolean;
  showDeleteDocumentButton: boolean;
  onDownloadRow: (doc: Record<string, unknown>) => void;
  openDeleteDocumentModal: (doc: Record<string, unknown>) => void;
  closeDeleteDocumentModal: () => void;
  confirmDeleteDocument: () => Promise<void>;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  handlePendingFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUploadSubmit: () => Promise<void>;
}>;

export function DocumentsPageView({
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
}: DocumentsPageViewProps) {
  const bodyContent = () => {
    if (sessionStatus === "loading" || loadState === "loading") {
      return (
        <tr>
          <td colSpan={4} style={s.muted}>
            Loading documents…
          </td>
        </tr>
      );
    }

    if (!companyId) {
      return (
        <tr>
          <td colSpan={4} style={s.muted}>
            Company ID is not available. Sign in again or contact support.
          </td>
        </tr>
      );
    }

    if (loadState === "error") {
      return (
        <tr>
          <td colSpan={4} style={s.muted}>
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
          <Modal.Title style={{ fontFamily: documentPageFont, fontWeight: 600 }}>Add New Document</Modal.Title>
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
