import React from "react";
import {
  formatCrmAmount,
  formatCrmShortDate,
} from "@pages/crm/common/crm-detail-formatters";

type DealCardProps = {
  deal: Record<string, unknown>;
};

export default function CrmDealListItemCard({
  deal,
}: Readonly<DealCardProps>) {
  const dealRecordId = deal?.id;

  return (
    <div
      key={String(dealRecordId)}
      style={{
        marginBottom: "16px",
        border: "1px solid #cccccc",
        borderRadius: "10px",
        padding: "15px",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          color: "#006162",
          fontWeight: "500",
          display: "block",
          marginBottom: "8px",
        }}
      >
        {String(deal.name ?? "--")}
      </span>
      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
        Amount: {formatCrmAmount(deal)}
      </p>
      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
        Close Date: {formatCrmShortDate(deal.expected_close_date as string)}
      </p>
      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
        Deal Stage: {String(deal.status ?? "--")}
      </p>
    </div>
  );
}

