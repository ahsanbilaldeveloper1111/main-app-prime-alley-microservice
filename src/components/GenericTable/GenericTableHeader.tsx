import React from "react";
import { Form } from "react-bootstrap";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";
import {
  GENERIC_TABLE_ACTION_COLUMN_KEY,
  isGenericTableActionsColumnWidthCustom,
  isGenericTableColumnWidthCustom,
} from "./genericTableColumnResize";
import type { TableColumn } from "./index";

const ACTION_COLUMN_KEY = GENERIC_TABLE_ACTION_COLUMN_KEY;

function GenericTableColumnWidthResetButton({
  columnKey,
  onResizeReset,
}: Readonly<{
  columnKey: string;
  onResizeReset: (columnKey: string) => void;
}>) {
  return (
    <button
      type="button"
      className="generic-table-th__reset-width"
      aria-label={`Reset ${columnKey} column width`}
      title="Reset column width"
      tabIndex={-1}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onResizeReset(columnKey);
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <RotateCcw size={11} aria-hidden />
    </button>
  );
}

function GenericTableColumnResizeHandle({
  columnKey,
  onResizeStart,
}: Readonly<{
  columnKey: string;
  onResizeStart: (columnKey: string, event: React.MouseEvent) => void;
}>) {
  return (
    <button
      type="button"
      className="generic-table-th__resize-handle"
      aria-label={`Resize ${columnKey} column`}
      title="Drag to resize"
      tabIndex={-1}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onResizeStart(columnKey, e);
      }}
    />
  );
}

function renderSortIcon(
  sortBy: string,
  sortOrder: "asc" | "desc",
  column: string,
) {
  if (sortBy !== column) {
    return <ArrowUpDown size={14} className="ms-1 text-muted" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp size={14} className="ms-1" />
  ) : (
    <ArrowDown size={14} className="ms-1" />
  );
}

function shouldIgnoreHeaderClick(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest(
      ".generic-table-th__resize-handle, .generic-table-th__reset-width",
    ),
  );
}

function shouldIgnoreHeaderSortClick(
  target: EventTarget | null,
  showCustomizerInDataHeader: boolean,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return showCustomizerInDataHeader && Boolean(target.closest(".dropdown"));
}

export type GenericTableHeaderProps<T> = Readonly<{
  selectable: boolean;
  sortedData: T[];
  isSelected: (row: T) => boolean;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  checkboxColumnWidthStyle: React.CSSProperties | undefined;
  visibleColumns: TableColumn<T>[];
  sortable: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  customizableColumns: boolean;
  actionsColumnVisible: boolean;
  columnCustomizerHeaderId: string;
  columnCustomizerPlaceholderId: string;
  columnCustomizerActionsHeaderId: string;
  renderColumnCustomizer: (toggleId: string) => React.ReactNode;
  resizableColumns: boolean;
  columnWidths: Record<string, number>;
  getColumnWidthStyle: (col: TableColumn<T>) => React.CSSProperties | undefined;
  onColumnWidthReset: (columnKey: string) => void;
  onColumnResizeStart: (columnKey: string, event: React.MouseEvent) => void;
  showColumnPickerPlaceholder: boolean;
  actionsLabel: string;
  actionsColumnWidthStyle: React.CSSProperties | undefined;
}>;

export function GenericTableHeader<T extends Record<string, unknown>>({
  selectable,
  sortedData,
  isSelected,
  onSelectAll,
  checkboxColumnWidthStyle,
  visibleColumns,
  sortable,
  sortBy,
  sortOrder,
  onSort,
  customizableColumns,
  actionsColumnVisible,
  columnCustomizerHeaderId,
  columnCustomizerPlaceholderId,
  columnCustomizerActionsHeaderId,
  renderColumnCustomizer,
  resizableColumns,
  columnWidths,
  getColumnWidthStyle,
  onColumnWidthReset,
  onColumnResizeStart,
  showColumnPickerPlaceholder,
  actionsLabel,
  actionsColumnWidthStyle,
}: GenericTableHeaderProps<T>) {
  return (
    <thead className="generic-table-header">
      <tr>
        {selectable && (
          <th className="generic-table-th" style={checkboxColumnWidthStyle}>
            <Form.Check
              type="checkbox"
              checked={
                sortedData.length > 0 &&
                sortedData.every((row) => isSelected(row))
              }
              onChange={onSelectAll}
            />
          </th>
        )}
        {visibleColumns.map((col, colIndex) => {
          const isLastColumn = colIndex === visibleColumns.length - 1;
          const showCustomizerInDataHeader =
            customizableColumns && isLastColumn && !actionsColumnVisible;

          return (
            <th
              key={col.key}
              data-col-key={col.key}
              className={`generic-table-th ${col.sortable !== false && sortable ? "sortable" : ""}`}
              style={{
                textAlign: col.align || "left",
                ...getColumnWidthStyle(col),
              }}
              onClick={(e) => {
                if (shouldIgnoreHeaderClick(e.target)) {
                  return;
                }
                if (
                  shouldIgnoreHeaderSortClick(
                    e.target,
                    showCustomizerInDataHeader,
                  )
                ) {
                  return;
                }
                if (col.sortable !== false && sortable) {
                  onSort(col.key);
                }
              }}
            >
              <div className="th-content d-flex align-items-center justify-content-between">
                <span>{col.label}</span>
                {col.sortable !== false &&
                  sortable &&
                  renderSortIcon(sortBy, sortOrder, col.key)}
                {showCustomizerInDataHeader &&
                  renderColumnCustomizer(columnCustomizerHeaderId)}
              </div>
              {resizableColumns && (
                <>
                  {isGenericTableColumnWidthCustom(col, columnWidths) && (
                    <GenericTableColumnWidthResetButton
                      columnKey={col.key}
                      onResizeReset={onColumnWidthReset}
                    />
                  )}
                  <GenericTableColumnResizeHandle
                    columnKey={col.key}
                    onResizeStart={onColumnResizeStart}
                  />
                </>
              )}
            </th>
          );
        })}
        {showColumnPickerPlaceholder && (
          <th
            className="generic-table-th"
            style={{ width: "52px" }}
            aria-label="Column visibility"
          >
            <div className="d-flex align-items-center justify-content-center">
              {renderColumnCustomizer(columnCustomizerPlaceholderId)}
            </div>
          </th>
        )}
        {actionsColumnVisible && (
          <th
            className="generic-table-th generic-table-actions-header"
            data-col-key={ACTION_COLUMN_KEY}
            style={actionsColumnWidthStyle}
          >
            <div className="d-flex align-items-center justify-content-center gap-1 w-100">
              <span className="text-center">{actionsLabel}</span>
              {customizableColumns &&
                renderColumnCustomizer(columnCustomizerActionsHeaderId)}
            </div>
            {resizableColumns && (
              <>
                {isGenericTableActionsColumnWidthCustom(columnWidths) && (
                  <GenericTableColumnWidthResetButton
                    columnKey={ACTION_COLUMN_KEY}
                    onResizeReset={onColumnWidthReset}
                  />
                )}
                <GenericTableColumnResizeHandle
                  columnKey={ACTION_COLUMN_KEY}
                  onResizeStart={onColumnResizeStart}
                />
              </>
            )}
          </th>
        )}
      </tr>
    </thead>
  );
}
