import React from "react";

type TicketCardProps = {
  lead: Record<string, unknown>;
};

function toDisplayText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "--";
}

export default function CrmTicketListItemCard({
  lead,
}: Readonly<TicketCardProps>) {
  const leadRecordId = lead?.id;

  const dealsCount = (lead?.deals as unknown[] | undefined)?.length ?? 0;

  return (
    <div
      key={String(leadRecordId)}
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
        {toDisplayText(lead.name)}
      </span>

      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
        Company: {toDisplayText(lead.company_name)}
      </p>

      <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
        Status: {toDisplayText(lead.status)}
      </p>

      {dealsCount > 0 && (
        <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
          Deals: {dealsCount}
        </p>
      )}
    </div>
  );
}

