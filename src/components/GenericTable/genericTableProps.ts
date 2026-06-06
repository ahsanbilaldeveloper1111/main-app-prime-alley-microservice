import type React from "react";
import type { StatsCardData } from "@components/GenericStatsCards";
import type { ToolbarConfig } from "./genericTableTypes";
import type { TableAction, TableColumn } from "./index";

export interface PaginationConfig {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions?: number[];
}

export interface GenericTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: PaginationConfig;
  onPaginationChange?: (page: number, rowsPerPage: number) => void;
  sortable?: boolean;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;
  actions?: TableAction<T>[];
  showActions?: boolean;
  actionsLabel?: string;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  customizableColumns?: boolean;
  /** When provided, column selection is controlled by the parent (e.g. from ColumnEditorModal) */
  selectedColumns?: string[];
  defaultSelectedColumns?: string[];
  onColumnChange?: (selectedColumns: string[]) => void;
  columnStorageKey?: string;
  /** When true (default), data column headers can be resized by dragging. */
  resizableColumns?: boolean;
  /**
   * Keeps the actions column visible. Defaults to true when row actions are enabled.
   * Set false to let users hide Actions via the column picker.
   */
  pinActionsColumn?: boolean;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onPreviewClick?: (row: T, index: number) => void;
  onFirstColumnClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  emptyMessage?: string | React.ReactNode;
  loadingMessage?: string | React.ReactNode;
  toolbar?: ToolbarConfig;
  showToolbar?: boolean;
  uniqueKey?: string;
  fixedHeight?: boolean;
  maxHeight?: string;
  statsCards?: StatsCardData[];
  metricsGridMinWidth?: string;
  metricsColumns?: number;
  /** When true, stats cards show on load; default is visible only at viewport >= 1920px. */
  defaultShowMetrics?: boolean;
  showToolbarActions?: boolean;
  noBorder?: boolean;
  /** When provided (e.g. when currentTableView === 'board'), render this instead of the table */
  customBody?: React.ReactNode;
}
