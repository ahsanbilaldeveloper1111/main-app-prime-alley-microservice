import React from "react";
import { Check, ChevronDown } from "lucide-react";

export type ValidationChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  message?: string;
};

export function ValidationChecklist({
  items,
  expandedId,
  onToggle,
}: Readonly<{
  items: ValidationChecklistItem[];
  expandedId?: string | null;
  onToggle?: (id: string | null) => void;
}>) {
  const isExpandable = typeof onToggle === "function";

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h6 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Validation Checklist</h6>
        <span style={{ fontSize: "12px", color: "#6b7280" }}>
          {items.filter((i) => i.checked).length}/{items.length} Complete
        </span>
      </div>

      {items.map((item, index) => {
        const isExpanded = isExpandable && expandedId === item.id;
        const rowBottomBorder = index < items.length - 1 ? "1px solid #f3f4f6" : "none";

        if (!isExpandable) {
          return (
            <div
              key={item.id}
              style={{
                borderBottom: rowBottomBorder,
                paddingBottom: "12px",
                paddingTop: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: item.checked ? "#10b981" : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.checked ? <Check size={14} color="white" /> : <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "bold" }}>?</span>}
                </div>
                <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>{item.label}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            style={{
              borderBottom: rowBottomBorder,
              paddingBottom: isExpanded ? "12px" : "0",
            }}
          >
            <button
              type="button"
              onClick={() => onToggle(isExpanded ? null : item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                cursor: "pointer",
                transition: "all 0.2s",
                width: "100%",
                border: "none",
                background: "none",
                textAlign: "left",
                font: "inherit",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: item.checked ? "#d1fae5" : "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.checked ? (
                    <Check size={14} color="#059669" />
                  ) : (
                    <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "bold" }}>!</span>
                  )}
                </div>
                <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>{item.label}</span>
              </div>

              <ChevronDown
                size={16}
                color="#9ca3af"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {isExpanded && item.message && (
              <div
                style={{
                  fontSize: "13px",
                  color: item.checked ? "#059669" : "#dc2626",
                  backgroundColor: item.checked ? "#f0fdf4" : "#fef2f2",
                  padding: "8px 12px 8px 30px",
                  borderRadius: "6px",
                  marginTop: "4px",
                }}
              >
                {item.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

