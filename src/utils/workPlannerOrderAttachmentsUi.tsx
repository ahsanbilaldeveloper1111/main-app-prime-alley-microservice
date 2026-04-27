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

function WorkPlannerAttachmentsEmptyState(props: Readonly<{
  kind: "order" | "deal";
}>): React.ReactElement {
  if (props.kind === "order") {
    return (
      <div className="text-center py-4 text-muted">
        <Paperclip size={48} className="mb-3 opacity-25" />
        <div>No order attachments yet</div>
        <small>Upload files using the form above</small>
      </div>
    );
  }
  return (
    <div className="text-center py-4 text-muted">
      <Paperclip size={48} className="mb-3 opacity-25" />
      <div>No deal attachments</div>
    </div>
  );
}

type WorkPlannerAttachmentRowCardProps = Readonly<{
  attachment: WorkPlannerAttachmentListItem;
  formatFileSize: (bytes: number) => string;
  onDownload: () => void;
  onDelete?: () => void;
  cardStyle?: React.CSSProperties;
}>;

function WorkPlannerAttachmentRowCard(
  props: WorkPlannerAttachmentRowCardProps,
): React.ReactElement {
  const { attachment, formatFileSize, onDownload, onDelete, cardStyle } = props;
  return (
    <Card className="border shadow-sm" style={cardStyle}>
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
                {formatFileSize(Number(attachment.file_size) || 0)} •{" "}
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
              onClick={onDownload}
            >
              <DownloadIcon size={18} />
            </Button>
            {onDelete ? (
              <Button
                variant="link"
                size="sm"
                className="p-2 text-danger"
                title="Delete"
                type="button"
                onClick={onDelete}
              >
                <Trash2 size={18} />
              </Button>
            ) : null}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

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
    return <WorkPlannerAttachmentsEmptyState kind="order" />;
  }
  return (
    <div className="d-flex flex-column gap-2 mb-4">
      {attachments.map((attachment) => (
        <WorkPlannerAttachmentRowCard
          key={attachment.id}
          attachment={attachment}
          formatFileSize={formatFileSize}
          onDownload={() => onDownloadOrderAttachment(attachment.id)}
          onDelete={() =>
            onRequestDeleteAttachment(attachment.id, attachment.name)
          }
        />
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
    return <WorkPlannerAttachmentsEmptyState kind="deal" />;
  }
  return (
    <div className="d-flex flex-column gap-2">
      {dealAttachments.map((attachment) => (
        <WorkPlannerAttachmentRowCard
          key={`deal-${attachment.id}`}
          attachment={attachment}
          formatFileSize={formatFileSize}
          cardStyle={{ opacity: 0.9 }}
          onDownload={() => onDownloadDealAttachment(attachment.id)}
        />
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
