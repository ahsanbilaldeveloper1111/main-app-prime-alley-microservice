import { useState } from "react";

export type ProjectSettingsTabPagination = Readonly<{
  currentPage: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}>;

/**
 * Pagination, search, and row selection defaults shared by Planner project
 * settings tabs (Labels, Members, Statuses).
 */
export function useProjectSettingsTabListState(defaultColumnKeys: string[]) {
  const [pagination, setPagination] = useState<ProjectSettingsTabPagination>({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc",
  });
  const [searchValue, setSearchValue] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedColumns] = useState<string[]>(defaultColumnKeys);

  return {
    pagination,
    setPagination,
    searchValue,
    setSearchValue,
    selectedItems,
    setSelectedItems,
    selectedColumns,
  };
}
