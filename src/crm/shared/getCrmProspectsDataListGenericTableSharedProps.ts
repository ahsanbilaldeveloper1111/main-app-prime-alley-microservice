import type { Dispatch, SetStateAction } from "react";

/** Matches CRM list pagination state (`useCrmListFiltersMetricsHistoryState`). */
export type CrmProspectsDataListPagination = {
  currentPage: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export type GetCrmProspectsDataListGenericTableSharedPropsArgs<T extends { id: number }> =
  Readonly<{
    session: { user?: { permissions?: string[] } } | null;
    dataList: T[];
    selectedItems: number[];
    setSelectedItems: Dispatch<SetStateAction<number[]>>;
    setClearSelectedRows: Dispatch<SetStateAction<boolean>>;
    pagination: CrmProspectsDataListPagination;
    setPagination: Dispatch<SetStateAction<CrmProspectsDataListPagination>>;
    loading: boolean;
    totalRecords: number;
    emptyMessage: string;
    loadingMessage: string;
    onPreviewClick: (row: T) => void;
    onFirstColumnClick: (row: T) => void;
    onRowDoubleClick: (row: T) => void;
  }>;

/**
 * Shared GenericTable wiring for CRM prospects data lists (selection, pagination, sort, chrome).
 */
export function getCrmProspectsDataListGenericTableSharedProps<
  T extends { id: number },
>(args: GetCrmProspectsDataListGenericTableSharedPropsArgs<T>) {
  const {
    session,
    dataList,
    selectedItems,
    setSelectedItems,
    setClearSelectedRows,
    pagination,
    setPagination,
    loading,
    totalRecords,
    emptyMessage,
    loadingMessage,
    onPreviewClick,
    onFirstColumnClick,
    onRowDoubleClick,
  } = args;

  return {
    showActions: false,
    selectable: !!session?.user?.permissions?.includes(
      "delete-crm-data-management",
    ),
    selectedRows: dataList.filter((item) => selectedItems.includes(item.id)),
    onSelectionChange: (selected: T[]) => {
      setSelectedItems(selected.map((item) => item.id));
      setClearSelectedRows(false);
    },
    pagination: {
      currentPage: pagination.currentPage,
      rowsPerPage: pagination.rowsPerPage,
      totalRows: totalRecords,
      pageSizeOptions: [10, 15, 25, 50, 100] as number[],
    },
    onPaginationChange: (page: number, rowsPerPage: number) => {
      setPagination({
        ...pagination,
        currentPage: page,
        rowsPerPage,
      });
    },
    sortable: true,
    defaultSortBy: pagination.sortBy,
    defaultSortOrder: pagination.sortOrder,
    onSort: (column: string, direction: "asc" | "desc") => {
      setPagination((prev) => ({
        ...prev,
        sortBy: column,
        sortOrder: direction,
        currentPage: 1,
      }));
    },
    onPreviewClick,
    onFirstColumnClick,
    onRowDoubleClick,
    loading,
    emptyMessage,
    loadingMessage,
    hover: true,
    uniqueKey: "id",
    fixedHeight: true,
    maxHeight: "calc(100vh - 345px)",
    showToolbar: true,
  };
}
