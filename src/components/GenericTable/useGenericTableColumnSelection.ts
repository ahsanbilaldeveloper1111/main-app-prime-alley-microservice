import { useCallback, useEffect, useMemo, useState } from "react";
import { GENERIC_TABLE_ACTION_COLUMN_KEY } from "./genericTableColumnResize";

function parseStoredColumnKeys(
  raw: string | null,
  defaults: string[],
): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const keys = parsed.filter((key): key is string => typeof key === "string");
    const allowed = new Set(defaults);
    const filtered = keys.filter((key) => allowed.has(key));
    return filtered.length > 0 ? filtered : null;
  } catch {
    return null;
  }
}

function resolveInitialGenericTableSelectedColumns({
  selectedColumnsProp,
  defaultSelectedColumns,
  allSelectableColumnKeys,
  columnStorageKey,
  pinActionsColumn,
  baseActionsEnabled,
}: {
  selectedColumnsProp: string[] | undefined;
  defaultSelectedColumns: string[] | undefined;
  allSelectableColumnKeys: string[];
  columnStorageKey: string | undefined;
  pinActionsColumn: boolean;
  baseActionsEnabled: boolean;
}): string[] {
  if (selectedColumnsProp !== undefined) return selectedColumnsProp;

  const defaults = defaultSelectedColumns || allSelectableColumnKeys;
  if (columnStorageKey && globalThis.window !== undefined) {
    const stored = parseStoredColumnKeys(
      globalThis.localStorage.getItem(columnStorageKey),
      defaults,
    );
    if (stored) {
      if (
        pinActionsColumn &&
        baseActionsEnabled &&
        !stored.includes(GENERIC_TABLE_ACTION_COLUMN_KEY)
      ) {
        return [...stored, GENERIC_TABLE_ACTION_COLUMN_KEY];
      }
      return stored;
    }
  }

  return defaults.filter((key) => allSelectableColumnKeys.includes(key));
}

function withPinnedActionsColumn(
  keys: string[],
  pinActionsColumn: boolean,
  baseActionsEnabled: boolean,
): string[] {
  if (
    pinActionsColumn &&
    baseActionsEnabled &&
    !keys.includes(GENERIC_TABLE_ACTION_COLUMN_KEY)
  ) {
    return [...keys, GENERIC_TABLE_ACTION_COLUMN_KEY];
  }
  return keys;
}

type GenericTableColumnLike = { key: string };

export function useGenericTableColumnSelection<T extends GenericTableColumnLike>({
  columns,
  selectedColumnsProp,
  defaultSelectedColumns,
  columnStorageKey,
  pinActionsColumn,
  baseActionsEnabled,
  onColumnChange,
}: {
  columns: T[];
  selectedColumnsProp: string[] | undefined;
  defaultSelectedColumns: string[] | undefined;
  columnStorageKey: string | undefined;
  pinActionsColumn: boolean;
  baseActionsEnabled: boolean;
  onColumnChange?: (selectedColumns: string[]) => void;
}) {
  const allSelectableColumnKeys = useMemo(() => {
    const keys = columns.map((c) => c.key);
    if (baseActionsEnabled) keys.push(GENERIC_TABLE_ACTION_COLUMN_KEY);
    return keys;
  }, [columns, baseActionsEnabled]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
    resolveInitialGenericTableSelectedColumns({
      selectedColumnsProp,
      defaultSelectedColumns,
      allSelectableColumnKeys,
      columnStorageKey,
      pinActionsColumn,
      baseActionsEnabled,
    }),
  );

  const [columnCatalog, setColumnCatalog] = useState(columns);

  const effectiveSelectedColumns = useMemo(
    () =>
      withPinnedActionsColumn(
        selectedColumnsProp ?? selectedColumns,
        pinActionsColumn,
        baseActionsEnabled,
      ),
    [
      selectedColumnsProp,
      selectedColumns,
      pinActionsColumn,
      baseActionsEnabled,
    ],
  );

  useEffect(() => {
    setColumnCatalog((prev) => {
      const mergedByKey = new Map(prev.map((col) => [col.key, col]));
      columns.forEach((col) => {
        mergedByKey.set(col.key, col);
      });
      return Array.from(mergedByKey.values());
    });
  }, [columns]);

  useEffect(() => {
    setSelectedColumns((prev) => {
      const source = selectedColumnsProp ?? prev;
      return source.filter((key) => allSelectableColumnKeys.includes(key));
    });
  }, [allSelectableColumnKeys, selectedColumnsProp]);

  useEffect(() => {
    if (selectedColumnsProp === undefined) return;
    setSelectedColumns(
      selectedColumnsProp.filter((key) =>
        allSelectableColumnKeys.includes(key),
      ),
    );
  }, [selectedColumnsProp, allSelectableColumnKeys]);

  useEffect(() => {
    if (!pinActionsColumn || !baseActionsEnabled || selectedColumnsProp !== undefined) {
      return;
    }
    setSelectedColumns((prev) => {
      if (prev.includes(GENERIC_TABLE_ACTION_COLUMN_KEY)) {
        return prev;
      }
      const next = [...prev, GENERIC_TABLE_ACTION_COLUMN_KEY];
      if (columnStorageKey && globalThis.window !== undefined) {
        globalThis.localStorage.setItem(
          columnStorageKey,
          JSON.stringify(next),
        );
      }
      return next;
    });
  }, [
    pinActionsColumn,
    baseActionsEnabled,
    selectedColumnsProp,
    columnStorageKey,
  ]);

  const handleColumnToggle = useCallback(
    (columnKey: string) => {
      if (pinActionsColumn && columnKey === GENERIC_TABLE_ACTION_COLUMN_KEY) {
        return;
      }
      const current =
        selectedColumnsProp ??
        withPinnedActionsColumn(
          selectedColumns,
          pinActionsColumn,
          baseActionsEnabled,
        );
      if (current.includes(columnKey) && current.length <= 1) {
        return;
      }
      const newSelected = current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey];

      if (selectedColumnsProp === undefined) {
        setSelectedColumns(newSelected);
      }
      if (columnStorageKey) {
        globalThis.localStorage.setItem(
          columnStorageKey,
          JSON.stringify(newSelected),
        );
      }
      onColumnChange?.(newSelected);
    },
    [
      pinActionsColumn,
      selectedColumnsProp,
      selectedColumns,
      baseActionsEnabled,
      columnStorageKey,
      onColumnChange,
    ],
  );

  return {
    allSelectableColumnKeys,
    columnCatalog,
    selectedColumns,
    setSelectedColumns,
    effectiveSelectedColumns,
    handleColumnToggle,
  };
}
