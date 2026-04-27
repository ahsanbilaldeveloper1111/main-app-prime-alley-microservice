import React from "react";
import { formatDateForTable } from "@utils/Helper";

export function PlannerCrmOrdersSidebarHistoryList(
  props: Readonly<{ histories: any[] }>,
): React.ReactElement {
  const { histories } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {histories.map((history: any, idx: number) => (
        <div
          key={history.id || idx}
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "10px",
            border: "1px solid #f3f4f6",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {history.action || "Activity"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            by {history.user?.name || history.created_by || "System"}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
            {history.created_at ? formatDateForTable(history.created_at) : "N/A"}
          </div>
          {history.description ? (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#4b5563",
                fontStyle: "italic",
              }}
            >
              {history.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
