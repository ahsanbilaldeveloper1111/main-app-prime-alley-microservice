import React from "react";
import { Modal, Spinner } from "react-bootstrap";
import { OrderViewModalHeader } from "./OrderViewModalHeader";
import { OrderViewModalLoadedBody } from "./OrderViewModalLoadedBody";
import { OrderViewModalFooter } from "./OrderViewModalFooter";

export type CrmOrderViewModalProps = Readonly<{
  viewingOrder: any;
  show: boolean;
  onHide: () => void;
  loadingOrder: boolean;
  relatedDeal: any;
  relatedLead: any;
  extensions: any[];
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  session: { user?: { permissions?: string[] } } | null;
  ignoredHistoryKeys: Set<string>;
}>;

export function CrmOrderViewModal({
  viewingOrder,
  show,
  onHide,
  loadingOrder,
  relatedDeal,
  relatedLead,
  extensions,
  activeTab,
  onActiveTabChange,
  session,
  ignoredHistoryKeys,
}: CrmOrderViewModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="order-view-modal"
    >
      <OrderViewModalHeader viewingOrder={viewingOrder} onHide={onHide} />
      <Modal.Body
        style={{
          padding: 0,
          maxHeight: "calc(90vh - 200px)",
          overflowY: "auto",
        }}
      >
        {loadingOrder ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <Spinner
              animation="border"
              variant="primary"
              size="sm"
              style={{ marginBottom: "12px" }}
            />
            <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>
              Loading order details...
            </p>
          </div>
        ) : (
          <OrderViewModalLoadedBody
            activeTab={activeTab}
            onActiveTabChange={onActiveTabChange}
            viewingOrder={viewingOrder}
            relatedDeal={relatedDeal}
            relatedLead={relatedLead}
            extensions={extensions}
            session={session}
            ignoredHistoryKeys={ignoredHistoryKeys}
            onHide={onHide}
          />
        )}
      </Modal.Body>
      <OrderViewModalFooter viewingOrder={viewingOrder} onHide={onHide} />
    </Modal>
  );
}
