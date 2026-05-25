import type { AnalysisPerCallCostFilters } from "@utils/aiAnalytics";

export type PerCallCostFilterForm = {
  dateFrom: string;
  dateTo: string;
  status: "" | "success" | "failed";
};

/** Matches call logs table pagination options. */
export const PER_CALL_TABLE_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

export const DEFAULT_PER_CALL_ROWS_PER_PAGE = 15;

export type PerCallCostTablePaginationState = {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions: number[];
};

export function defaultPerCallCostFilterForm(): PerCallCostFilterForm {
  return {
    dateFrom: "",
    dateTo: "",
    status: "",
  };
}

export function defaultPerCallCostTablePagination(): PerCallCostTablePaginationState {
  return {
    currentPage: 1,
    rowsPerPage: DEFAULT_PER_CALL_ROWS_PER_PAGE,
    totalRows: 0,
    pageSizeOptions: [...PER_CALL_TABLE_PAGE_SIZE_OPTIONS],
  };
}

export function toAppliedPerCallCostFilters(
  form: PerCallCostFilterForm,
  currentPage: number,
  rowsPerPage: number,
): AnalysisPerCallCostFilters {
  const limit = Math.min(500, Math.max(1, rowsPerPage));
  const page = Math.max(1, currentPage);

  const filters: AnalysisPerCallCostFilters = {
    limit,
    offset: (page - 1) * limit,
  };

  const dateFrom = form.dateFrom.trim();
  if (dateFrom) {
    filters.date_from = dateFrom;
  }
  const dateTo = form.dateTo.trim();
  if (dateTo) {
    filters.date_to = dateTo;
  }
  if (form.status === "success" || form.status === "failed") {
    filters.status = form.status;
  }

  return filters;
}
