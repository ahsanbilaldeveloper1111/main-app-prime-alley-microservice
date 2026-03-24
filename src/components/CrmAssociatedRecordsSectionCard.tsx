import React, { type ReactNode } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

type CrmAssociatedRecordsSectionCardProps<TItem> = {
  sectionId: string;
  title: string;
  count: number;
  collapsedSections: Set<string>;
  toggleSection: (id: string) => void;
  items: TItem[];
  renderItem: (item: TItem, index: number) => ReactNode;
  emptyState: ReactNode;
  viewAllLabel?: string;
  onViewAllClick?: () => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
};

export default function CrmAssociatedRecordsSectionCard<TItem>({
  sectionId,
  title,
  count,
  collapsedSections,
  toggleSection,
  items,
  renderItem,
  emptyState,
  viewAllLabel,
  onViewAllClick,
  showAddButton = false,
  onAddClick,
}: Readonly<CrmAssociatedRecordsSectionCardProps<TItem>>) {
  const isCollapsed = collapsedSections.has(sectionId);
  const sectionContentId = `${sectionId}-content`;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        marginBottom: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        border: "1px solid #cccccc",
      }}
    >
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          textAlign: "left",
          padding: "14px 20px 0",
          cursor: "pointer",
          backgroundColor: "#ffffff",
        }}
        onClick={() => toggleSection(sectionId)}
        aria-expanded={!isCollapsed}
        aria-controls={sectionContentId}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <ChevronDown
            size={18}
            style={{
              color: "#141414",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0, lineHeight: "1.2" }}>
            {title} ({count})
          </h3>
        </div>
        {showAddButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#141414",
              fontSize: "20px",
              padding: "6px",
              borderRadius: "3px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
            <span style={{ fontSize: "12px", fontWeight: "500" }}>Add</span>
          </button>
        )}
      </button>

      {!isCollapsed && (
        <div id={sectionContentId} style={{ padding: "20px" }}>
          {items.length === 0 ? (
            emptyState
          ) : (
            <>
              {items.map((item, index) => renderItem(item, index))}
              {viewAllLabel && onViewAllClick && (
                <button
                  type="button"
                  onClick={onViewAllClick}
                  style={{
                    fontSize: "12px",
                    color: "#141414",
                    textDecoration: "none",
                    fontWeight: "300",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid #cccccc",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  {viewAllLabel}
                  <ExternalLink size={12} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
