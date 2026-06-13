import { useId, useMemo } from "react";
import {
  GENERIC_TABLE_ACTION_COLUMN_KEY,
  useGenericTableColumnResize,
} from "./genericTableColumnResize";
import { useGenericTableColumnSelection } from "./useGenericTableColumnSelection";
import { useGenericTableContextMenu } from "./useGenericTableContextMenu";
import { useGenericTableRowSelection } from "./useGenericTableRowSelection";
import { useGenericTableSorting } from "./useGenericTableSorting";
import { useGenericTableToolbarSearch } from "./useGenericTableToolbarSearch";
import { useGenericTableToolbarUiState } from "./useGenericTableToolbarUiState";
import type { GenericTableProps } from "./genericTableProps";

const ACTION_COLUMN_KEY = GENERIC_TABLE_ACTION_COLUMN_KEY;

export function useGenericTableViewModel<T extends Record<string, unknown>>(
  props: GenericTableProps<T>,
) {
  const {
    data,
    columns,
    pagination,
    onPaginationChange,
    sortable = true,
    defaultSortBy = "",
    defaultSortOrder = "asc",
    onSort,
    actions = [],
    showActions = true,
    actionsLabel = "Actions",
    selectable = false,
    selectedRows = [],
    onSelectionChange,
    customizableColumns = false,
    selectedColumns: selectedColumnsProp,
    defaultSelectedColumns,
    onColumnChange,
    columnStorageKey,
    resizableColumns = true,
    pinActionsColumn: pinActionsColumnProp,
    onRowClick,
    onRowDoubleClick,
    onPreviewClick,
    onFirstColumnClick,
    rowClassName,
    striped = false,
    hover = true,
    bordered = false,
    size = "md",
    loading = false,
    emptyMessage = "No data available",
    loadingMessage = "Loading...",
    toolbar,
    showToolbar = false,
    uniqueKey = "id",
    fixedHeight = false,
    maxHeight = "calc(100vh - 300px)",
    statsCards,
    metricsGridMinWidth = "200px",
    metricsColumns,
    metricsEmbedded = true,
    defaultShowMetrics,
    showToolbarActions = true,
    noBorder = false,
    customBody,
  } = props;

  const columnCustomizerHeaderId = useId();
  const columnCustomizerPlaceholderId = useId();
  const columnCustomizerActionsHeaderId = useId();

  const toolbarSearch = useGenericTableToolbarSearch({ showToolbar, toolbar });
  const baseActionsEnabled = showActions && actions.length > 0;
  const pinActionsColumn = pinActionsColumnProp ?? baseActionsEnabled;

  const columnSelection = useGenericTableColumnSelection({
    columns,
    selectedColumnsProp,
    defaultSelectedColumns,
    columnStorageKey,
    pinActionsColumn,
    baseActionsEnabled,
    onColumnChange,
  });

  const actionsColumnVisible =
    baseActionsEnabled &&
    (!customizableColumns ||
      columnSelection.effectiveSelectedColumns.includes(ACTION_COLUMN_KEY));

  const contextMenuState = useGenericTableContextMenu<T>();
  const toolbarUi = useGenericTableToolbarUiState({ toolbar, defaultShowMetrics });

  const visibleColumns = useMemo(() => {
    if (!customizableColumns) {
      return columns;
    }
    return columns.filter((col) =>
      columnSelection.effectiveSelectedColumns.includes(col.key),
    );
  }, [columns, columnSelection.effectiveSelectedColumns, customizableColumns]);

  const showColumnPickerPlaceholder =
    customizableColumns &&
    visibleColumns.length === 0 &&
    !actionsColumnVisible;

  const columnResize = useGenericTableColumnResize({
    resizableColumns,
    columnStorageKey,
    actionsCount: actions.length,
    actionsColumnVisible,
    selectable,
    visibleColumns,
    showColumnPickerPlaceholder,
  });

  const sorting = useGenericTableSorting({
    data,
    visibleColumns,
    sortable,
    defaultSortBy,
    defaultSortOrder,
    onSort,
  });

  const rowSelection = useGenericTableRowSelection({
    selectedRows,
    uniqueKey,
    onSelectionChange,
    sortedData: sorting.sortedData,
  });

  return {
    pagination,
    onPaginationChange,
    sortable,
    actions,
    actionsLabel,
    selectable,
    customizableColumns,
    selectedColumnsProp,
    defaultSelectedColumns,
    onColumnChange,
    columnStorageKey,
    resizableColumns,
    pinActionsColumn,
    onRowClick,
    onRowDoubleClick,
    onPreviewClick,
    onFirstColumnClick,
    rowClassName,
    striped,
    hover,
    bordered,
    size,
    loading,
    emptyMessage,
    loadingMessage,
    toolbar,
    showToolbar,
    uniqueKey,
    fixedHeight,
    maxHeight,
    statsCards,
    metricsGridMinWidth,
    metricsColumns,
    metricsEmbedded,
    showToolbarActions,
    noBorder,
    customBody,
    baseActionsEnabled,
    actionsColumnVisible,
    visibleColumns,
    showColumnPickerPlaceholder,
    columnCustomizerHeaderId,
    columnCustomizerPlaceholderId,
    columnCustomizerActionsHeaderId,
    ...toolbarSearch,
    ...columnSelection,
    ...contextMenuState,
    ...toolbarUi,
    ...columnResize,
    ...sorting,
    ...rowSelection,
  };
}

export type GenericTableViewModel<T extends Record<string, unknown>> =
  ReturnType<typeof useGenericTableViewModel<T>>;
