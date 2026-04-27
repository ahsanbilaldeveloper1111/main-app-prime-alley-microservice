import React from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import {
  Download as DownloadIcon,
  FileText,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { formatDateForTable } from "@utils/Helper";

function attachmentThumbBackground(mimeType: string | undefined): string {
  if (!mimeType) return "#6c757d";
  if (mimeType.includes("pdf")) return "#dc3545";
  if (
    mimeType.includes("csv") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet")
  ) {
    return "#198754";
  }
  if (mimeType.includes("image")) return "#0d6efd";
  return "#6c757d";
}

export function WorkPlannerAttachmentLoadingBlock(): React.ReactElement {
  return (
    <div className="text-center py-5" aria-busy="true">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <output className="visually-hidden">Loading...</output>
    </div>
  );
}

/** Minimal row shape for order/deal attachment lists (API rows are often untyped). */
export type WorkPlannerAttachmentListItem = Readonly<{
  id: number;
  name: string;
  mime_type?: string;
  file_size: number | string;
  created_at?: string | null;
}>;

export type WorkPlannerOrderAttachmentsBodyProps = Readonly<{
  loading: boolean;
  attachments: readonly WorkPlannerAttachmentListItem[];
  formatFileSize: (bytes: number) => string;
  onDownloadOrderAttachment: (attachmentId: number) => void;
  onRequestDeleteAttachment: (id: number, name: string) => void;
}>;

export function WorkPlannerOrderAttachmentsBody(
  props: WorkPlannerOrderAttachmentsBodyProps,
): React.ReactElement {
  const {
    loading,
    attachments,
    formatFileSize,
    onDownloadOrderAttachment,
    onRequestDeleteAttachment,
  } = props;
  if (loading) {
    return <WorkPlannerAttachmentLoadingBlock />;
  }
  if (attachments.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <Paperclip size={48} className="mb-3 opacity-25" />
        <div>No order attachments yet</div>
        <small>Upload files using the form above</small>
      </div>
    );
  }
  return (
    <div className="d-flex flex-column gap-2 mb-4">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="border shadow-sm">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3 flex-grow-1">
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: "45px",
                    height: "45px",
                    background: attachmentThumbBackground(attachment.mime_type),
                    color: "white",
                  }}
                >
                  <FileText size={22} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold" style={{ fontSize: "14px" }}>
                    {attachment.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    {formatFileSize(attachment.file_size)} •{" "}
                    {attachment.created_at
                      ? formatDateForTable(attachment.created_at)
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="d-flex gap-1">
                <Button
                  variant="link"
                  size="sm"
                  className="p-2 text-primary"
                  title="Download"
                  type="button"
                  onClick={() => onDownloadOrderAttachment(attachment.id)}
                >
                  <DownloadIcon size={18} />
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="p-2 text-danger"
                  title="Delete"
                  type="button"
                  onClick={() =>
                    onRequestDeleteAttachment(attachment.id, attachment.name)
                  }
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export type WorkPlannerDealAttachmentsBodyProps = Readonly<{
  loading: boolean;
  dealAttachments: readonly WorkPlannerAttachmentListItem[];
  formatFileSize: (bytes: number) => string;
  onDownloadDealAttachment: (attachmentId: number) => void;
}>;

export function WorkPlannerDealAttachmentsBody(
  props: WorkPlannerDealAttachmentsBodyProps,
): React.ReactElement {
  const { loading, dealAttachments, formatFileSize, onDownloadDealAttachment } =
    props;
  if (loading) {
    return <WorkPlannerAttachmentLoadingBlock />;
  }
  if (dealAttachments.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <Paperclip size={48} className="mb-3 opacity-25" />
        <div>No deal attachments</div>
      </div>
    );
  }
  return (
    <div className="d-flex flex-column gap-2">
      {dealAttachments.map((attachment) => (
        <Card
          key={`deal-${attachment.id}`}
          className="border shadow-sm"
          style={{ opacity: 0.9 }}
        >
          <Card.Body className="p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3 flex-grow-1">
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: "45px",
                    height: "45px",
                    background: attachmentThumbBackground(attachment.mime_type),
                    color: "white",
                  }}
                >
                  <FileText size={22} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold" style={{ fontSize: "14px" }}>
                    {attachment.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    {formatFileSize(attachment.file_size)} •{" "}
                    {attachment.created_at
                      ? formatDateForTable(attachment.created_at)
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="d-flex gap-1">
                <Button
                  variant="link"
                  size="sm"
                  className="p-2 text-primary"
                  title="Download"
                  type="button"
                  onClick={() => onDownloadDealAttachment(attachment.id)}
                >
                  <DownloadIcon size={18} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export type WorkPlannerAttachmentsUploadSectionProps = Readonly<{
  uploadingFile: boolean;
  fileInputRef: React.Ref<HTMLInputElement> | React.RefCallback<HTMLInputElement>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}>;

export function WorkPlannerAttachmentsUploadSection(
  props: WorkPlannerAttachmentsUploadSectionProps,
): React.ReactElement {
  const { uploadingFile, fileInputRef, onFileChange } = props;

  let uploadButtonInner: React.ReactNode;
  if (uploadingFile) {
    uploadButtonInner = (
      <>
        <div className="spinner-border spinner-border-sm" aria-hidden="true" />
        <output className="visually-hidden">Uploading</output>
        <span>Uploading...</span>
      </>
    );
  } else {
    uploadButtonInner = (
      <>
        <Upload size={16} />
        Upload
      </>
    );
  }

  return (
    <div
      className="mb-4 p-4 border rounded"
      style={{ background: "#f8f9fa" }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 className="mb-1 fw-bold">Upload New Attachments</h6>
          <small className="text-muted">
            Supported formats: PDF, CSV, Excel, or Image (Max 5MB)
          </small>
        </div>
      </div>
      <div className="d-flex gap-2">
        <Form.Control
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          accept=".pdf,.csv,.xls,.xlsx,.xlsm,.png,.jpg,.jpeg,.gif,.webp"
          style={{ flex: 1 }}
          disabled={uploadingFile}
        />
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          disabled={uploadingFile}
          type="button"
        >
          {uploadButtonInner}
        </Button>
      </div>
    </div>
  );
}

export type WorkPlannerAttachmentsModalBodyProps = Readonly<{
  attachments: WorkPlannerOrderAttachmentsBodyProps["attachments"];
  dealAttachments: WorkPlannerDealAttachmentsBodyProps["dealAttachments"];
  loadingAttachments: boolean;
  uploadingFile: boolean;
  fileInputRef: WorkPlannerAttachmentsUploadSectionProps["fileInputRef"];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (bytes: number) => string;
  onDownloadOrderAttachment: (attachmentId: number) => void;
  onDownloadDealAttachment: (attachmentId: number) => void;
  onRequestDeleteAttachment: (id: number, name: string) => void;
  showDealSection: boolean;
}>;

export function WorkPlannerAttachmentsModalBody(
  props: WorkPlannerAttachmentsModalBodyProps,
): React.ReactElement {
  const {
    attachments,
    dealAttachments,
    loadingAttachments,
    uploadingFile,
    fileInputRef,
    onFileChange,
    formatFileSize,
    onDownloadOrderAttachment,
    onDownloadDealAttachment,
    onRequestDeleteAttachment,
    showDealSection,
  } = props;

  return (
    <>
      <WorkPlannerAttachmentsUploadSection
        uploadingFile={uploadingFile}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
      />

      <div>
        <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
          <FileText size={18} />
          Order Attachments ({attachments.length})
        </h6>

        <WorkPlannerOrderAttachmentsBody
          loading={loadingAttachments}
          attachments={attachments}
          formatFileSize={formatFileSize}
          onDownloadOrderAttachment={onDownloadOrderAttachment}
          onRequestDeleteAttachment={onRequestDeleteAttachment}
        />

        {showDealSection ? (
          <>
            <h6 className="mb-3 fw-bold d-flex align-items-center gap-2 mt-4">
              <FileText size={18} />
              Deal Attachments ({dealAttachments.length})
              <Badge
                bg="secondary"
                className="ms-2"
                style={{ fontSize: "11px" }}
              >
                Read-only
              </Badge>
            </h6>

            <WorkPlannerDealAttachmentsBody
              loading={loadingAttachments}
              dealAttachments={dealAttachments}
              formatFileSize={formatFileSize}
              onDownloadDealAttachment={onDownloadDealAttachment}
            />
          </>
        ) : null}
      </div>
    </>
  );
}
