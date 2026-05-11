import React from "react";
import moment from "moment";
import {
  Check,
  Clock,
  Edit,
  FileText,
  Send,
  X,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { formatNumber } from "@utils/Helper";
import type { OverviewInvoiceRow } from "./accountOverviewTypes";

type InvoiceOverviewVisual = {
  circleBg: string;
  iconColor: string;
  Icon: React.ComponentType<LucideProps>;
};

function getInvoiceOverviewRowVisual(
  statusRaw: string | undefined,
): InvoiceOverviewVisual {
  const s = statusRaw?.trim().toLowerCase() ?? "";
  if (s === "paid") {
    return { circleBg: "#22c55e", iconColor: "#ffffff", Icon: Check };
  }
  if (s === "overdue" || s === "failed" || s === "refunded") {
    return {
      circleBg: "rgba(239, 68, 68, 0.2)",
      iconColor: "#ef4444",
      Icon: X,
    };
  }
  if (s === "partially_paid" || s === "pending") {
    return {
      circleBg: "rgba(251, 191, 36, 0.2)",
      iconColor: "#fbbf24",
      Icon: Clock,
    };
  }
  if (s === "sent") {
    return {
      circleBg: "rgba(59, 130, 246, 0.2)",
      iconColor: "#3b82f6",
      Icon: Send,
    };
  }
  if (s === "draft") {
    return {
      circleBg: "rgba(107, 114, 128, 0.2)",
      iconColor: "#6b7280",
      Icon: Edit,
    };
  }
  if (s === "cancelled") {
    return {
      circleBg: "rgba(55, 65, 81, 0.2)",
      iconColor: "#374151",
      Icon: X,
    };
  }
  return {
    circleBg: "rgba(156, 163, 175, 0.2)",
    iconColor: "#9ca3af",
    Icon: FileText,
  };
}

export type RecentInvoiceRowItemProps = Readonly<{
  invoice: OverviewInvoiceRow;
  isLast: boolean;
}>;

export function RecentInvoiceRowItem({
  invoice,
  isLast,
}: RecentInvoiceRowItemProps) {
  const visual = getInvoiceOverviewRowVisual(invoice.status);
  const IconCmp = visual.Icon;

  return (
    <div className={`py-1 ${isLast ? "" : "border-bottom"}`}>
      <div className="d-flex justify-content-between align-items-center">
        <div
          className="flex-grow-1 d-flex align-items-center gap-2"
          style={{ minWidth: 0 }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: visual.circleBg,
              flexShrink: 0,
            }}
          >
            <IconCmp size={10} style={{ color: visual.iconColor }} />
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <small
              className="d-block text-truncate"
              style={{ fontSize: "0.75rem", fontWeight: "500" }}
            >
              #{invoice.invoice_number}
            </small>
            <small className="text-muted" style={{ fontSize: "0.7rem" }}>
              {invoice.invoice_date
                ? moment(invoice.invoice_date).format("DD-MMM-YYYY")
                : ""}
            </small>
          </div>
        </div>
        <small
          className="fw-semibold ms-2"
          style={{ fontSize: "0.75rem", flexShrink: 0 }}
        >
          {invoice.currency_code || "AED"}{" "}
          {formatNumber(Number(invoice.total_amount ?? 0))}
        </small>
      </div>
    </div>
  );
}
