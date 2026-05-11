import React from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import {
  Clock,
  DollarSign,
  Eye,
  FileText,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type {
  OverviewInvoiceRow,
  OverviewPaymentRow,
} from "./accountOverviewTypes";
import { PaymentHistoryRowItem } from "./PaymentHistoryRowItem";
import { RecentInvoiceRowItem } from "./RecentInvoiceRowItem";

export type AccountOverviewBottomSectionProps = Readonly<{
  recentInvoices: OverviewInvoiceRow[];
  paymentHistory: OverviewPaymentRow[];
  onViewAllInvoices: () => void;
  onViewAllPayments: () => void;
  onInvoicesStatus: () => void;
  onUpdatePaymentMethod: () => void;
  onViewSubscriptions: () => void;
}>;

export function AccountOverviewBottomSection({
  recentInvoices,
  paymentHistory,
  onViewAllInvoices,
  onViewAllPayments,
  onInvoicesStatus,
  onUpdatePaymentMethod,
  onViewSubscriptions,
}: AccountOverviewBottomSectionProps) {
  return (
    <Row>
      <Col md={6} lg={4} className="mb-3">
        <Card className="billing-details-cards" style={{ height: "100%" }}>
          <Card.Body className="p-2">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "rgba(251, 191, 36, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={14} style={{ color: "#fbbf24" }} />
                </div>
                <h6
                  className="mb-0"
                  style={{ fontWeight: "600", fontSize: "0.85rem" }}
                >
                  Recent Invoices
                </h6>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center"
                onClick={onViewAllInvoices}
                style={{ textDecoration: "none", fontSize: "0.75rem" }}
              >
                <Eye size={12} className="me-1" /> View All
              </Button>
            </div>

            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice, index) => (
                <RecentInvoiceRowItem
                  key={
                    invoice.id !== undefined && invoice.id !== ""
                      ? String(invoice.id)
                      : `${invoice.invoice_number}-${index}`
                  }
                  invoice={invoice}
                  isLast={index === recentInvoices.length - 1}
                />
              ))
            ) : (
              <div className="text-center py-3">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  No invoices available
                </small>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4} className="mb-3">
        <Card className="billing-details-cards" style={{ height: "100%" }}>
          <Card.Body className="p-2">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={14} style={{ color: "#22c55e" }} />
                </div>
                <h6
                  className="mb-0"
                  style={{ fontWeight: "600", fontSize: "0.85rem" }}
                >
                  Payment History
                </h6>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center"
                onClick={onViewAllPayments}
                style={{ textDecoration: "none", fontSize: "0.75rem" }}
              >
                <Eye size={12} className="me-1" /> View All
              </Button>
            </div>

            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, index) => (
                <PaymentHistoryRowItem
                  key={
                    payment.id !== undefined && payment.id !== ""
                      ? String(payment.id)
                      : `pay-${index}`
                  }
                  payment={payment}
                  isLast={index === paymentHistory.length - 1}
                />
              ))
            ) : (
              <div className="text-center py-3">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  No payment history available
                </small>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={4} className="mb-3">
        <Card className="billing-details-cards" style={{ height: "100%" }}>
          <Card.Body className="p-2">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "rgba(168, 85, 247, 0.1)",
                  flexShrink: 0,
                }}
              >
                <DollarSign size={14} style={{ color: "#a855f7" }} />
              </div>
              <h6
                className="mb-0"
                style={{ fontWeight: "600", fontSize: "0.85rem" }}
              >
                Quick Actions
              </h6>
            </div>

            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="d-flex align-items-center gap-2 py-2 px-2"
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "transparent",
                  textAlign: "left",
                }}
                onClick={onInvoicesStatus}
                aria-label="Invoices status"
              >
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={12} style={{ color: "#3b82f6" }} />
                </div>
                <small style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                  Invoices status
                </small>
              </button>

              <button
                type="button"
                className="d-flex align-items-center gap-2 py-2 px-2"
                onClick={onUpdatePaymentMethod}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "transparent",
                  textAlign: "left",
                }}
                aria-label="Update Payment Method"
              >
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Wallet size={12} style={{ color: "#22c55e" }} />
                </div>
                <small style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                  Update Payment Method
                </small>
              </button>

              <button
                type="button"
                className="d-flex align-items-center gap-2 py-2 px-2"
                onClick={onViewSubscriptions}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: "transparent",
                  textAlign: "left",
                }}
                aria-label="View Subscriptions"
              >
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: "rgba(168, 85, 247, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Package size={12} style={{ color: "#a855f7" }} />
                </div>
                <small style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                  View Subscriptions
                </small>
              </button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
