import React from "react";
import {
  formatCrmAmount
} from "@utils/crm/common/crm-detail-formatters";

type DealCardProps = {
  deal: Record<string, unknown>;
};

const getSafeDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "--";
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
        {getSafeDisplayValue(deal.name)}
      </span>
      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
      Deal Value: {formatCrmAmount(deal)}
      </p>
    </div>
  );
}

