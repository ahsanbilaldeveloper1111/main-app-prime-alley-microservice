import { useCallback, useState } from "react";

export type CrmSettingsTablePaginationState = {
  currentPage: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type UseCrmSettingsTableStateOptions = {
  defaultSelectedColumns: readonly string[];
  selectableColumnKeys?: readonly string[];
  columnStorageKey?: string;
  initialPagination?: Partial<CrmSettingsTablePaginationState>;
  normalizeSelectedColumns?: (columns: string[]) => string[];
};

const DEFAULT_PAGINATION: CrmSettingsTablePaginationState = {
  currentPage: 1,
  rowsPerPage: 15,
  sortBy: "",
  sortOrder: "asc",
};

function unique(values: string[]): string[] {
  return values.reduce<string[]>((acc, value) => {
    if (!acc.includes(value)) {
      acc.push(value);
    }
    return acc;
  }, []);
}

function sanitizeSelectedColumns(
  input: unknown,
  defaultSelectedColumns: readonly string[],
  selectableColumnKeys?: readonly string[],
  normalizeSelectedColumns?: (columns: string[]) => string[],
): string[] {
  const fallback = [...defaultSelectedColumns];
  if (!Array.isArray(input)) {
    return fallback;
  }

  const normalizedInput = input.filter(
    (value): value is string => typeof value === "string",
  );

  const allowed = selectableColumnKeys
    ? new Set<string>(selectableColumnKeys)
    : null;
  const filtered = allowed
    ? normalizedInput.filter((value) => allowed.has(value))
    : normalizedInput;
  const normalized = normalizeSelectedColumns
    ? normalizeSelectedColumns(filtered)
    : filtered;
  const uniqueColumns = unique(
    allowed
      ? normalized.filter((value) => allowed.has(value))
      : normalized,
  );

  return uniqueColumns.length > 0 ? uniqueColumns : fallback;
}

function readStoredSelectedColumns(
  columnStorageKey: string | undefined,
  defaultSelectedColumns: readonly string[],
  selectableColumnKeys?: readonly string[],
  normalizeSelectedColumns?: (columns: string[]) => string[],
): string[] {
  if (!columnStorageKey || globalThis.window === undefined) {
    return [...defaultSelectedColumns];
  }

  try {
    const raw = globalThis.localStorage.getItem(columnStorageKey);
    if (!raw) {
      return [...defaultSelectedColumns];
    }

    const parsed: unknown = JSON.parse(raw);
    return sanitizeSelectedColumns(
      parsed,
      defaultSelectedColumns,
      selectableColumnKeys,
      normalizeSelectedColumns,
    );
  } catch {
    return [...defaultSelectedColumns];
  }
}

export function useCrmSettingsTableState({
  defaultSelectedColumns,
  selectableColumnKeys,
  columnStorageKey,
  initialPagination,
  normalizeSelectedColumns,
}: UseCrmSettingsTableStateOptions) {
  const [pagination, setPagination] =
    useState<CrmSettingsTablePaginationState>(() => ({
      ...DEFAULT_PAGINATION,
      ...initialPagination,
    }));

  const [columnSelection, setColumnSelection] = useState<string[]>(() =>
    readStoredSelectedColumns(
      columnStorageKey,
      defaultSelectedColumns,
      selectableColumnKeys,
      normalizeSelectedColumns,
    ),
  );

  const setSelectedColumns = useCallback(
    (columns: string[]) => {
      const next = sanitizeSelectedColumns(
        columns,
        defaultSelectedColumns,
        selectableColumnKeys,
        normalizeSelectedColumns,
      );

      setColumnSelection(next);

      if (columnStorageKey && globalThis.window !== undefined) {
        try {
          globalThis.localStorage.setItem(
            columnStorageKey,
            JSON.stringify(next),
          );
        } catch {
          /* ignore storage failures */
        }
      }
    },
    [
      columnStorageKey,
      defaultSelectedColumns,
      normalizeSelectedColumns,
      selectableColumnKeys,
    ],
  );

  const handlePaginationChange = useCallback(
    (page: number, rowsPerPage: number) => {
      setPagination((prev) => ({
        ...prev,
        currentPage: rowsPerPage === prev.rowsPerPage ? page : 1,
        rowsPerPage,
      }));
    },
    [],
  );

  const handleSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setPagination((prev) => ({
        ...prev,
        sortBy: column,
        sortOrder: direction,
        currentPage: 1,
      }));
    },
    [],
  );

  const resetToFirstPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  return {
    pagination,
    setPagination,
    selectedColumns: columnSelection,
    setSelectedColumns,
    handlePaginationChange,
    handleSort,
    resetToFirstPage,
  };
}
