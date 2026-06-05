import { useCallback, useEffect, useMemo, useState } from "react";

type SortableTableColumn = {
  key: string;
  label: string;
  sortKey?: string;
  sortable?: boolean;
  type?: string;
};

function safeStringifySortValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (
    typeof val === "number" ||
    typeof val === "boolean" ||
    typeof val === "bigint"
  ) {
    return String(val);
  }
  try {
    return JSON.stringify(val);
  } catch {
    return "";
  }
}

export function compareGenericTableSortValues(
  aVal: unknown,
  bVal: unknown,
  sortOrder: "asc" | "desc",
  sortColumnType?: string,
): number {
  const aText = safeStringifySortValue(aVal).trim();
  const bText = safeStringifySortValue(bVal).trim();

  if (sortColumnType === "date") {
    const aTime = Date.parse(aText);
    const bTime = Date.parse(bText);
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    }
  }

  const aStr = aText.toLowerCase();
  const bStr = bText.toLowerCase();
  if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
  if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
  return 0;
}

export function useGenericTableSorting<T extends Record<string, unknown>>({
  data,
  visibleColumns,
  sortable,
  defaultSortBy,
  defaultSortOrder,
  onSort,
}: {
  data: T[];
  visibleColumns: SortableTableColumn[];
  sortable: boolean;
  defaultSortBy: string;
  defaultSortOrder: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;
}) {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  useEffect(() => {
    setSortBy(defaultSortBy);
    setSortOrder(defaultSortOrder);
  }, [defaultSortBy, defaultSortOrder]);

  const sortableColumns = useMemo(
    () =>
      visibleColumns.filter(
        (col) => sortable && col.sortable !== false && col.key,
      ),
    [visibleColumns, sortable],
  );

  const sortColumnDef = useMemo(
    () => visibleColumns.find((col) => col.key === sortBy),
    [visibleColumns, sortBy],
  );

  const getRowSortValue = useCallback(
    (row: T): unknown => {
      if (!sortBy) {
        return "";
      }
      const fieldKey = sortColumnDef?.sortKey ?? sortBy;
      return row[fieldKey as keyof T] ?? row[sortBy as keyof T] ?? "";
    },
    [sortBy, sortColumnDef?.sortKey],
  );

  const sortedData = useMemo(() => {
    if (onSort || !sortBy) return data;

    return [...data].sort((a, b) =>
      compareGenericTableSortValues(
        getRowSortValue(a),
        getRowSortValue(b),
        sortOrder,
        sortColumnDef?.type,
      ),
    );
  }, [data, sortBy, onSort, sortOrder, sortColumnDef?.type, getRowSortValue]);

  const handleSort = useCallback(
    (column: string) => {
      if (!sortable) return;

      const nextOrder =
        sortBy === column && sortOrder === "asc" ? "desc" : "asc";
      setSortBy(column);
      setSortOrder(nextOrder);
      onSort?.(column, nextOrder);
    },
    [sortable, sortBy, sortOrder, onSort],
  );

  return {
    sortBy,
    sortOrder,
    sortableColumns,
    sortColumnDef,
    sortedData,
    handleSort,
  };
}
