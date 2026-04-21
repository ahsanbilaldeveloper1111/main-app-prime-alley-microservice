import { useCallback, useState } from "react";
import type { CrmListPaginationSlice } from "@crm/shared/crmListCrmQueryParams";

const DEFAULT_PAGINATION: CrmListPaginationSlice = {
  currentPage: 1,
  rowsPerPage: 15,
  sortBy: "",
  sortOrder: "asc",
};

/**
 * Standard table pagination + sort slice for CRM-style list pages.
 * Compose with `buildCrmListTableCrmDataParams` / entity-specific builders.
 */
export function useListPaginationSort(
  initial?: Partial<CrmListPaginationSlice>,
) {
  const [pagination, setPagination] = useState<CrmListPaginationSlice>(() => ({
    ...DEFAULT_PAGINATION,
    ...initial,
  }));

  const resetToFirstPage = useCallback(() => {
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, []);

  return { pagination, setPagination, resetToFirstPage };
}
