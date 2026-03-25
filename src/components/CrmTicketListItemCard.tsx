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
    </div>
  );
}

