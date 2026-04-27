import React from "react";

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: "8px",
  padding: "8px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "13px",
};

const labelRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 4px",
  fontSize: "13px",
  cursor: "pointer",
};

const applyButtonStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#6366f1",
  color: "white",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
};

const clearButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  color: "#374151",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
};

export type WorkforceUserMultiSelectRow = Readonly<{
  rowKey: string;
  selectionId: string;
  label: string;
}>;

export type WorkforceUserMultiSelectDropdownProps = Readonly<{
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  rows: readonly WorkforceUserMultiSelectRow[];
  selectedIds: readonly string[];
  onToggle: (selectionId: string, isCurrentlySelected: boolean) => void;
  onApply: () => void;
  onClear: () => void;
  /** When set, the user list scrolls inside a fixed-height panel (e.g. 220). */
  listMaxHeightPx?: number;
}>;

export function WorkforceUserMultiSelectDropdown(
  props: WorkforceUserMultiSelectDropdownProps,
): React.ReactElement {
  const {
    searchTerm,
    onSearchTermChange,
    rows,
    selectedIds,
    onToggle,
    onApply,
    onClear,
    listMaxHeightPx,
  } = props;

  const listScrolls =
    typeof listMaxHeightPx === "number" && Number.isFinite(listMaxHeightPx);

  const listStyle: React.CSSProperties = {
    marginBottom: "8px",
    ...(listScrolls
      ? { maxHeight: `${listMaxHeightPx}px`, overflowY: "auto" as const }
      : {}),
  };

  return (
    <div style={{ minWidth: "260px" }}>
      <input
        type="text"
        placeholder="Search user..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        style={searchInputStyle}
      />
      <div style={listStyle}>
        {rows.map((row) => {
          const isSelected = selectedIds.includes(row.selectionId);
          return (
            <label key={row.rowKey} style={labelRowStyle}>
              <input
                type="checkbox"
                checked={isSelected}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={() => onToggle(row.selectionId, isSelected)}
              />
              <span>{row.label}</span>
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={onApply} style={applyButtonStyle}>
          Apply
        </button>
        <button type="button" onClick={onClear} style={clearButtonStyle}>
          Clear
        </button>
      </div>
    </div>
  );
}
