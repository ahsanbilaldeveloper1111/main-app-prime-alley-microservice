import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";

export const GENERIC_TABLE_ACTION_COLUMN_KEY = "actions";

const GENERIC_TABLE_MIN_COLUMN_WIDTH_PX = 72;
const GENERIC_TABLE_COLUMN_WIDTHS_STORAGE_SUFFIX = "-widths";
const GENERIC_TABLE_CHECKBOX_COLUMN_KEY = "__select__";
const GENERIC_TABLE_COLUMN_PICKER_WIDTH_PX = 52;
const GENERIC_TABLE_SELECT_COLUMN_WIDTH_PX = 40;
const GENERIC_TABLE_DEFAULT_COLUMN_WIDTH_PX = 96;
const GENERIC_TABLE_COLUMN_RESIZE_DRAG_THRESHOLD_PX = 3;
const GENERIC_TABLE_ACTIONS_COLUMN_BUTTON_PX = 36;
const GENERIC_TABLE_ACTIONS_COLUMN_PADDING_PX = 16;

type ResizableTableColumn = { key: string; width?: string };

function parseGenericTablePxWidth(width: string | undefined): number | undefined {
  if (!width) return undefined;
  const match = /^(\d+(?:\.\d+)?)px$/i.exec(width.trim());
  return match ? Number.parseFloat(match[1]) : undefined;
}

function readStoredGenericTableColumnWidths(
  storageKey: string | undefined,
): Record<string, number> {
  if (!storageKey || globalThis.window === undefined) return {};
  try {
    const raw = globalThis.localStorage.getItem(
      `${storageKey}${GENERIC_TABLE_COLUMN_WIDTHS_STORAGE_SUFFIX}`,
    );
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          typeof value === "number" &&
          value >= GENERIC_TABLE_MIN_COLUMN_WIDTH_PX,
      ),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

export function getPersistableGenericTableColumnWidths(
  widths: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(widths).filter(
      ([key]) => key !== GENERIC_TABLE_CHECKBOX_COLUMN_KEY,
    ),
  );
}

function writeStoredGenericTableColumnWidths(
  storageKey: string | undefined,
  widths: Record<string, number>,
) {
  if (!storageKey || globalThis.window === undefined) return;
  const persistableWidths = getPersistableGenericTableColumnWidths(widths);
  const storageItemKey = `${storageKey}${GENERIC_TABLE_COLUMN_WIDTHS_STORAGE_SUFFIX}`;
  if (Object.keys(persistableWidths).length === 0) {
    globalThis.localStorage.removeItem(storageItemKey);
    return;
  }
  globalThis.localStorage.setItem(
    storageItemKey,
    JSON.stringify(persistableWidths),
  );
}

function clearStoredGenericTableColumnWidths(storageKey: string | undefined) {
  if (!storageKey || globalThis.window === undefined) return;
  globalThis.localStorage.removeItem(
    `${storageKey}${GENERIC_TABLE_COLUMN_WIDTHS_STORAGE_SUFFIX}`,
  );
}

function estimateGenericTableActionsColumnMinWidthPx(
  actionCount: number,
): number {
  if (actionCount <= 0) return 0;
  return Math.max(
    GENERIC_TABLE_MIN_COLUMN_WIDTH_PX,
    actionCount * GENERIC_TABLE_ACTIONS_COLUMN_BUTTON_PX +
      GENERIC_TABLE_ACTIONS_COLUMN_PADDING_PX,
  );
}

function resolveGenericTableColumnResizeMinWidthPx(
  columnKey: string,
  actionsCount: number,
): number {
  if (columnKey === GENERIC_TABLE_ACTION_COLUMN_KEY) {
    return estimateGenericTableActionsColumnMinWidthPx(actionsCount);
  }
  return GENERIC_TABLE_MIN_COLUMN_WIDTH_PX;
}

function snapshotGenericTableHeaderWidths(
  table: HTMLTableElement,
): Record<string, number> {
  const widths: Record<string, number> = {};
  table.querySelectorAll<HTMLTableCellElement>("thead th").forEach((header) => {
    const measuredWidth = Math.max(
      GENERIC_TABLE_MIN_COLUMN_WIDTH_PX,
      Math.round(header.getBoundingClientRect().width),
    );
    const key = header.dataset.colKey;
    if (key) {
      widths[key] = measuredWidth;
      return;
    }
    if (header.querySelector('.form-check-input[type="checkbox"]')) {
      widths[GENERIC_TABLE_CHECKBOX_COLUMN_KEY] = measuredWidth;
    }
  });
  return widths;
}

function computeResizedGenericTableWidthPx({
  columnWidths,
  selectable,
  visibleColumns,
  showColumnPickerPlaceholder,
  actionsColumnVisible,
  actionsCount,
}: {
  columnWidths: Record<string, number>;
  selectable: boolean;
  visibleColumns: ResizableTableColumn[];
  showColumnPickerPlaceholder: boolean;
  actionsColumnVisible: boolean;
  actionsCount: number;
}): number | undefined {
  if (Object.keys(columnWidths).length === 0) return undefined;

  let total = 0;
  if (selectable) {
    total +=
      columnWidths[GENERIC_TABLE_CHECKBOX_COLUMN_KEY] ??
      GENERIC_TABLE_SELECT_COLUMN_WIDTH_PX;
  }

  visibleColumns.forEach((col) => {
    total +=
      columnWidths[col.key] ??
      parseGenericTablePxWidth(col.width) ??
      GENERIC_TABLE_DEFAULT_COLUMN_WIDTH_PX;
  });

  if (showColumnPickerPlaceholder) {
    total += GENERIC_TABLE_COLUMN_PICKER_WIDTH_PX;
  }

  if (actionsColumnVisible) {
    total +=
      columnWidths[GENERIC_TABLE_ACTION_COLUMN_KEY] ??
      estimateGenericTableActionsColumnMinWidthPx(actionsCount);
  }

  return total;
}

export function buildFixedGenericTableColumnWidthStyle(
  widthPx: number,
): CSSProperties {
  return {
    width: `${widthPx}px`,
    minWidth: `${widthPx}px`,
    maxWidth: `${widthPx}px`,
  };
}

function buildGenericTableActionsColumnWidthStyle(
  actionCount: number,
  columnWidths: Record<string, number>,
  active: boolean,
): CSSProperties | undefined {
  if (!active || actionCount <= 0) return undefined;
  const widthPx =
    columnWidths[GENERIC_TABLE_ACTION_COLUMN_KEY] ??
    estimateGenericTableActionsColumnMinWidthPx(actionCount);
  return buildFixedGenericTableColumnWidthStyle(widthPx);
}

export function buildGenericTableColumnWidthStyle(
  col: ResizableTableColumn,
  columnWidths: Record<string, number>,
): CSSProperties | undefined {
  const resizedWidth = columnWidths[col.key];
  if (resizedWidth !== undefined) {
    return buildFixedGenericTableColumnWidthStyle(resizedWidth);
  }
  if (col.width) {
    return {
      width: col.width,
      maxWidth: col.width,
      minWidth: 0,
      overflow: "hidden",
    };
  }
  return undefined;
}

export function isGenericTableActionsColumnWidthCustom(
  columnWidths: Record<string, number>,
): boolean {
  return columnWidths[GENERIC_TABLE_ACTION_COLUMN_KEY] !== undefined;
}

export function isGenericTableColumnWidthCustom(
  col: ResizableTableColumn,
  columnWidths: Record<string, number>,
): boolean {
  return columnWidths[col.key] !== undefined;
}

function beginGenericTableColumnResizeDrag({
  columnKey,
  event,
  actionsCount,
  columnStorageKey,
  setColumnWidths,
  columnResizeDragRef,
  columnWidthsHydratedRef,
}: {
  columnKey: string;
  event: ReactMouseEvent;
  actionsCount: number;
  columnStorageKey: string | undefined;
  setColumnWidths: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  columnResizeDragRef: React.MutableRefObject<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>;
  columnWidthsHydratedRef: React.MutableRefObject<boolean>;
}) {
  const table = (event.currentTarget as HTMLElement).closest("table");
  const th = (event.currentTarget as HTMLElement).closest("th");
  if (!table || !th) return;

  const minWidthPx = resolveGenericTableColumnResizeMinWidthPx(
    columnKey,
    actionsCount,
  );
  const startWidth = Math.max(
    minWidthPx,
    Math.round(th.getBoundingClientRect().width),
  );

  columnResizeDragRef.current = {
    columnKey,
    startX: event.clientX,
    startWidth,
  };

  let didDrag = false;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const drag = columnResizeDragRef.current;
    if (!drag) return;

    const deltaX = moveEvent.clientX - drag.startX;
    if (!didDrag) {
      if (Math.abs(deltaX) < GENERIC_TABLE_COLUMN_RESIZE_DRAG_THRESHOLD_PX) {
        return;
      }
      didDrag = true;
      const snappedWidths = snapshotGenericTableHeaderWidths(table);
      setColumnWidths((prev) => ({
        ...snappedWidths,
        ...prev,
        [drag.columnKey]: drag.startWidth,
      }));
      columnWidthsHydratedRef.current = true;
      document.body.classList.add("generic-table-col-resizing");
    }

    const dragMinWidthPx = resolveGenericTableColumnResizeMinWidthPx(
      drag.columnKey,
      actionsCount,
    );
    const nextWidth = Math.max(dragMinWidthPx, drag.startWidth + deltaX);
    setColumnWidths((prev) => ({ ...prev, [drag.columnKey]: nextWidth }));
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.classList.remove("generic-table-col-resizing");
    if (didDrag && columnStorageKey) {
      setColumnWidths((prev) => {
        writeStoredGenericTableColumnWidths(columnStorageKey, prev);
        return prev;
      });
    }
    columnResizeDragRef.current = null;
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

export function useGenericTableColumnResize<T extends ResizableTableColumn>({
  resizableColumns,
  columnStorageKey,
  actionsCount,
  actionsColumnVisible,
  selectable,
  visibleColumns,
  showColumnPickerPlaceholder,
}: {
  resizableColumns: boolean;
  columnStorageKey: string | undefined;
  actionsCount: number;
  actionsColumnVisible: boolean;
  selectable: boolean;
  visibleColumns: T[];
  showColumnPickerPlaceholder: boolean;
}) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => readStoredGenericTableColumnWidths(columnStorageKey),
  );
  const columnResizeDragRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const columnWidthsHydratedRef = useRef(false);

  const handleColumnResizeStart = useCallback(
    (columnKey: string, event: ReactMouseEvent) => {
      if (!resizableColumns) return;
      beginGenericTableColumnResizeDrag({
        columnKey,
        event,
        actionsCount,
        columnStorageKey,
        setColumnWidths,
        columnResizeDragRef,
        columnWidthsHydratedRef,
      });
    },
    [resizableColumns, columnStorageKey, actionsCount],
  );

  const persistColumnWidths = useCallback(
    (widths: Record<string, number>) => {
      if (columnStorageKey) {
        writeStoredGenericTableColumnWidths(columnStorageKey, widths);
      }
    },
    [columnStorageKey],
  );

  const handleColumnWidthReset = useCallback(
    (columnKey: string) => {
      setColumnWidths((prev) => {
        if (prev[columnKey] === undefined) {
          return prev;
        }
        const next = { ...prev };
        delete next[columnKey];
        persistColumnWidths(next);
        return next;
      });
    },
    [persistColumnWidths],
  );

  const handleResetAllColumnWidths = useCallback(() => {
    setColumnWidths({});
    clearStoredGenericTableColumnWidths(columnStorageKey);
  }, [columnStorageKey]);

  const hasCustomColumnWidths = useMemo(
    () =>
      Object.keys(getPersistableGenericTableColumnWidths(columnWidths)).length >
      0,
    [columnWidths],
  );

  useLayoutEffect(() => {
    if (!resizableColumns || !hasCustomColumnWidths) {
      columnWidthsHydratedRef.current = false;
      return;
    }

    const table = tableScrollRef.current?.querySelector("table");
    if (!table) return;

    const persistable = getPersistableGenericTableColumnWidths(columnWidths);
    if (Object.keys(persistable).length === 0) return;

    if (columnWidthsHydratedRef.current) return;

    const hasMissingDataColumn = visibleColumns.some(
      (col) => columnWidths[col.key] === undefined,
    );
    if (!hasMissingDataColumn) {
      columnWidthsHydratedRef.current = true;
      return;
    }

    const snapped = snapshotGenericTableHeaderWidths(table);
    setColumnWidths((prev) => ({ ...snapped, ...prev }));
    columnWidthsHydratedRef.current = true;
  }, [
    resizableColumns,
    hasCustomColumnWidths,
    visibleColumns,
    columnWidths,
  ]);

  const actionsColumnWidthStyle = useMemo(
    () =>
      buildGenericTableActionsColumnWidthStyle(
        actionsCount,
        columnWidths,
        resizableColumns && hasCustomColumnWidths && actionsColumnVisible,
      ),
    [
      actionsCount,
      columnWidths,
      resizableColumns,
      hasCustomColumnWidths,
      actionsColumnVisible,
    ],
  );

  const getColumnWidthStyle = useCallback(
    (col: T) => buildGenericTableColumnWidthStyle(col, columnWidths),
    [columnWidths],
  );

  const checkboxColumnWidthStyle = useMemo((): CSSProperties => {
    if (!selectable) return { width: "40px" };
    if (!hasCustomColumnWidths) return { width: "40px" };
    const widthPx =
      columnWidths[GENERIC_TABLE_CHECKBOX_COLUMN_KEY] ??
      GENERIC_TABLE_SELECT_COLUMN_WIDTH_PX;
    return buildFixedGenericTableColumnWidthStyle(widthPx);
  }, [selectable, hasCustomColumnWidths, columnWidths]);

  const resizedTableWidthPx = useMemo(() => {
    if (!resizableColumns) return undefined;
    return computeResizedGenericTableWidthPx({
      columnWidths,
      selectable,
      visibleColumns,
      showColumnPickerPlaceholder,
      actionsColumnVisible,
      actionsCount,
    });
  }, [
    resizableColumns,
    columnWidths,
    selectable,
    visibleColumns,
    showColumnPickerPlaceholder,
    actionsColumnVisible,
    actionsCount,
  ]);

  const resizedTableStyle = useMemo((): CSSProperties | undefined => {
    if (!resizableColumns || !hasCustomColumnWidths) return undefined;
    if (resizedTableWidthPx === undefined) return undefined;
    return buildFixedGenericTableColumnWidthStyle(resizedTableWidthPx);
  }, [resizableColumns, hasCustomColumnWidths, resizedTableWidthPx]);

  return {
    tableScrollRef,
    columnWidths,
    hasCustomColumnWidths,
    handleColumnResizeStart,
    handleColumnWidthReset,
    handleResetAllColumnWidths,
    actionsColumnWidthStyle,
    getColumnWidthStyle,
    checkboxColumnWidthStyle,
    resizedTableStyle,
  };
}
