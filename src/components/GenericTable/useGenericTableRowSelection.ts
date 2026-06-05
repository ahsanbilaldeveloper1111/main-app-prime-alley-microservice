import { useCallback } from "react";

export function useGenericTableRowSelection<T extends Record<string, unknown>>({
  selectedRows,
  uniqueKey,
  onSelectionChange,
  sortedData,
}: {
  selectedRows: T[];
  uniqueKey: string;
  onSelectionChange?: (selected: T[]) => void;
  sortedData: T[];
}) {
  const isSelected = useCallback(
    (row: T) =>
      selectedRows.some(
        (selectedRow) =>
          selectedRow[uniqueKey as keyof T] === row[uniqueKey as keyof T],
      ),
    [selectedRows, uniqueKey],
  );

  const handleSelectAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        onSelectionChange?.(sortedData);
        return;
      }
      onSelectionChange?.([]);
    },
    [onSelectionChange, sortedData],
  );

  const applyRowCheckboxChange = useCallback(
    (row: T, e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.target.checked) {
        onSelectionChange?.([...selectedRows, row]);
        return;
      }
      onSelectionChange?.(
        selectedRows.filter(
          (selectedRow) =>
            selectedRow[uniqueKey as keyof T] !== row[uniqueKey as keyof T],
        ),
      );
    },
    [onSelectionChange, selectedRows, uniqueKey],
  );

  return { isSelected, handleSelectAll, applyRowCheckboxChange };
}
