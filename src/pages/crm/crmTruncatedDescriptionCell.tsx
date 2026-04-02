import React from "react";

/**
 * Shared max width for CRM Smart module description columns so action columns stay visible.
 */
export const CRM_TABLE_DESCRIPTION_MAX_WIDTH = "min(260px, 32vw)";

type CrmTruncatedDescriptionCellProps = Readonly<{
  text: string | null | undefined;
  emptyDisplay?: React.ReactNode;
  className?: string;
}>;

/**
 * Single-line ellipsis + native `title` tooltip for long descriptions in GenericTable.
 */
export function CrmTruncatedDescriptionCell({
  text,
  emptyDisplay = "—",
  className = "text-muted small",
}: CrmTruncatedDescriptionCellProps): React.ReactElement {
  const raw = (text ?? "").trim();
  if (!raw) {
    return <span className={className}>{emptyDisplay}</span>;
  }
  return (
    <span
      className={className}
      title={raw}
      style={{
        display: "block",
        maxWidth: CRM_TABLE_DESCRIPTION_MAX_WIDTH,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {raw}
    </span>
  );
}

type CrmDescriptionDetailsBlockProps = Readonly<{
  text: string | null | undefined;
  emptyDisplay?: React.ReactNode;
  className?: string;
  maxHeight?: string;
}>;

/**
 * Multi-line description for CRM view/detail modals.
 */
export function CrmDescriptionDetailsBlock({
  text,
  emptyDisplay = "No description",
  className = "mb-0",
  maxHeight = "180px",
}: CrmDescriptionDetailsBlockProps): React.ReactElement {
  const raw = (text ?? "").trim();
  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "30px",
      }}
    >
      {raw ? (
        <div
          className={className}
          style={{
            fontSize: "15px",
            color: "#1f2937",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            maxHeight,
            overflowY: "auto",
          }}
        >
          {raw}
        </div>
      ) : (
        <span className="text-muted fst-italic">{emptyDisplay}</span>
      )}
    </div>
  );
}
