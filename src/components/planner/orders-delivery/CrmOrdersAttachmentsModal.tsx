import React from "react";
import { Button, Modal } from "@crm/orders/orderListBootstrap";
import { Paperclip } from "@crm/orders/orderListLucideHeavy";
import { WorkPlannerAttachmentsModalBody } from "@utils/workPlannerOrderAttachmentsUi";

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
        <WorkPlannerAttachmentsModalBody
          attachments={attachments}
          dealAttachments={dealAttachments}
          loadingAttachments={loadingAttachments}
          uploadingFile={uploadingFile}
          fileInputRef={fileInputRef}
          onFileChange={onFileChange}
          formatFileSize={formatFileSize}
          onDownloadOrderAttachment={onDownloadOrderAttachment}
          onDownloadDealAttachment={onDownloadDealAttachment}
          onRequestDeleteAttachment={onRequestDeleteAttachment}
          showDealSection={Boolean(order?.deal_id)}
        />
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide} type="button">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
