import React from "react";
import moment from "moment";
import { Check, FileText, X } from "lucide-react";
import type { OverviewPaymentRow } from "./accountOverviewTypes";

function paymentHistoryRowIcon(status: string | undefined): React.ReactElement {
  if (status === "completed") {
    return (
      <Check size={12} className="mt-1 text-success" style={{ flexShrink: 0 }} />
    );
  }
  if (status === "failed" || status === "cancelled") {
    return (
      <X size={12} className="mt-1 text-danger" style={{ flexShrink: 0 }} />
    );
  }
  return (
    <FileText size={12} className="mt-1 text-info" style={{ flexShrink: 0 }} />
  );
}

function paymentHistoryDescription(payment: OverviewPaymentRow): string {
  const invoiceNumber = payment.invoice?.invoice_number;
  const invoiceSuffix = invoiceNumber ? ` - ${invoiceNumber}` : "";
  const st = payment.status ?? "";
  if (st === "completed") return `Payment completed${invoiceSuffix}`;
  if (st === "failed") return `Payment failed${invoiceSuffix}`;
  if (st === "cancelled") return `Payment cancelled${invoiceSuffix}`;
  return `Payment ${st}${invoiceSuffix}`;
}

export type PaymentHistoryRowItemProps = Readonly<{
  payment: OverviewPaymentRow;
  isLast: boolean;
}>;

export function PaymentHistoryRowItem({
  payment,
  isLast,
}: PaymentHistoryRowItemProps) {
  return (
    <div className={`d-flex gap-2 py-1 ${isLast ? "" : "border-bottom"}`}>
      {paymentHistoryRowIcon(payment.status)}
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <small
          className="d-block"
          style={{ fontSize: "0.75rem", fontWeight: "500" }}
        >
          {paymentHistoryDescription(payment)}
        </small>
        <small className="text-muted" style={{ fontSize: "0.7rem" }}>
          {payment.payment_date
            ? moment(payment.payment_date).fromNow()
            : ""}
        </small>
      </div>
    </div>
  );
}
