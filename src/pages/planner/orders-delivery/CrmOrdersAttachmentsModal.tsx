import React from "react";
import {
  Button,
  Card,
  Form,
  Modal,
  Badge,
} from "@crm/orders/orderListBootstrap";
import {
  Paperclip,
  FileText,
  Trash2,
  Upload,
  DownloadIcon,
} from "@crm/orders/orderListLucideHeavy";
import { formatDateForTable } from "@utils/Helper";

export type CrmOrdersAttachmentsModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  order: any;
  attachments: any[];
  dealAttachments: any[];
  loadingAttachments: boolean;
  uploadingFile: boolean;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (bytes: number) => string;
  onDownloadOrderAttachment: (attachmentId: number) => void;
  onDownloadDealAttachment: (attachmentId: number) => void;
  onRequestDeleteAttachment: (id: number, name: string) => void;
}>;

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

function AttachmentLoadingBlock(): React.ReactElement {
  return (
    <div className="text-center py-5" aria-busy="true">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <output className="visually-hidden">Loading...</output>
    </div>
  );
}

function OrderAttachmentsBody(
  props: Readonly<{
    loading: boolean;
    attachments: any[];
    formatFileSize: (bytes: number) => string;
    onDownloadOrderAttachment: (attachmentId: number) => void;
    onRequestDeleteAttachment: (id: number, name: string) => void;
  }>,
): React.ReactElement {
  const {
    loading,
    attachments,
    formatFileSize,
    onDownloadOrderAttachment,
    onRequestDeleteAttachment,
  } = props;
  if (loading) {
    return <AttachmentLoadingBlock />;
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
      {attachments.map((attachment: any) => (
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

function DealAttachmentsBody(
  props: Readonly<{
    loading: boolean;
    dealAttachments: any[];
    formatFileSize: (bytes: number) => string;
    onDownloadDealAttachment: (attachmentId: number) => void;
  }>,
): React.ReactElement {
  const { loading, dealAttachments, formatFileSize, onDownloadDealAttachment } =
    props;
  if (loading) {
    return <AttachmentLoadingBlock />;
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
      {dealAttachments.map((attachment: any) => (
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

export function CrmOrdersAttachmentsModal(props: CrmOrdersAttachmentsModalProps) {
  const {
    show,
    onHide,
    order,
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
  } = props;

  const orderTitle =
    order?.order_number || order?.name || `Order #${order?.id ?? ""}`;

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
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <Paperclip size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              Manage Attachments
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#6c757d",
                fontWeight: "normal",
              }}
            >
              {orderTitle}
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
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

        <div>
          <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
            <FileText size={18} />
            Order Attachments ({attachments.length})
          </h6>

          <OrderAttachmentsBody
            loading={loadingAttachments}
            attachments={attachments}
            formatFileSize={formatFileSize}
            onDownloadOrderAttachment={onDownloadOrderAttachment}
            onRequestDeleteAttachment={onRequestDeleteAttachment}
          />

          {order?.deal_id ? (
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

              <DealAttachmentsBody
                loading={loadingAttachments}
                dealAttachments={dealAttachments}
                formatFileSize={formatFileSize}
                onDownloadDealAttachment={onDownloadDealAttachment}
              />
            </>
          ) : null}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide} type="button">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
