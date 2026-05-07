import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { FileText, Trash2, Upload, Download } from "lucide-react";
import "./plannerTaskDetail.scss";

export type TaskDocumentRow = Readonly<{
  id?: number | string | null;
  original_name?: string;
  name?: string;
  file_name?: string;
}>;

export type PlannerTaskDocumentsTabPanelProps = Readonly<{
  loadingDocuments: boolean;
  taskDocuments: TaskDocumentRow[];
  uploadingDocument: boolean;
  documentInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onDownload: (doc: TaskDocumentRow) => void | Promise<void>;
  onDelete: (doc: TaskDocumentRow) => void | Promise<void>;
  /** When false, hide upload and delete (offcanvas / read-only). */
  allowMutations?: boolean;
  sectionClassName?: string;
}>;

export function PlannerTaskDocumentsTabPanel({
  loadingDocuments,
  taskDocuments,
  uploadingDocument,
  documentInputRef,
  onUploadChange,
  onUploadClick,
  onDownload,
  onDelete,
  allowMutations = true,
  sectionClassName,
}: PlannerTaskDocumentsTabPanelProps) {
  const documentCountLabel = taskDocuments.length === 1 ? "document" : "documents";

  let content: React.ReactNode;
  if (loadingDocuments) {
    content = (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  } else {
    content = (
      <>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <span className="small text-muted">
            {taskDocuments.length} {documentCountLabel}
          </span>
          {allowMutations ? (
            <div className="d-flex align-items-center gap-2">
              <input
                ref={documentInputRef}
                type="file"
                accept="*/*"
                multiple
                className="ptd-hidden-input"
                onChange={onUploadChange}
                disabled={uploadingDocument}
              />
              <Button
                variant="primary"
                size="sm"
                disabled={uploadingDocument}
                onClick={onUploadClick}
              >
                {uploadingDocument ? (
                  <Spinner animation="border" size="sm" className="ptd-spinner-inline" />
                ) : (
                  <Upload size={14} className="me-1" />
                )}
                Upload
              </Button>
            </div>
          ) : null}
        </div>
        {taskDocuments.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No documents yet. Upload a file to attach it to this task.
          </div>
        ) : (
          <ul className="list-unstyled mb-0">
            {taskDocuments.map((doc, idx) => {
              const label = doc.original_name || doc.name || doc.file_name || `Document ${idx + 1}`;
              const rowKey =
                doc.id === undefined || doc.id === null ? `doc-${label}-${idx}` : String(doc.id);
              return (
                <li
                  key={rowKey}
                  className="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-2"
                >
                  <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                    <FileText size={18} className="text-muted flex-shrink-0" />
                    <span className="small text-truncate">{label}</span>
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-1"
                      onClick={() => onDownload(doc)}
                      title="Download"
                    >
                      <Download size={16} />
                    </Button>
                    {allowMutations ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-1 text-danger"
                        onClick={() => onDelete(doc)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return sectionClassName ? <div className={sectionClassName}>{content}</div> : content;
}
