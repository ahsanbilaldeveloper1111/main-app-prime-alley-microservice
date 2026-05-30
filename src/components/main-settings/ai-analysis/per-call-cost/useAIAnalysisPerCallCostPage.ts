import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  defaultPerCallCostFilterForm,
  defaultPerCallCostTablePagination,
  toAppliedPerCallCostFilters,
  type PerCallCostFilterForm,
} from "./types";
import { useAnalysisPerCallCostQuery } from "./useAnalysisPerCallCostQuery";

function parseFilterForm(form: PerCallCostFilterForm): string | null {
  if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) {
    return "Date from must be on or before date to.";
  }
  return null;
}

export function useAIAnalysisPerCallCostPage() {
  const { status: sessionStatus } = useSession();

  const [filterForm, setFilterForm] = useState(defaultPerCallCostFilterForm);
  const [appliedFilterForm, setAppliedFilterForm] = useState(
    defaultPerCallCostFilterForm,
  );
  const [tablePagination, setTablePagination] = useState(
    defaultPerCallCostTablePagination,
  );
  const [filtersApplied, setFiltersApplied] = useState(false);

  const appliedFilters = useMemo(
    () =>
      toAppliedPerCallCostFilters(
        appliedFilterForm,
        tablePagination.currentPage,
        tablePagination.rowsPerPage,
      ),
    [
      appliedFilterForm,
      tablePagination.currentPage,
      tablePagination.rowsPerPage,
    ],
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setAppliedFilterForm(defaultPerCallCostFilterForm());
    setFiltersApplied(true);
  }, [sessionStatus]);

  const callsQuery = useAnalysisPerCallCostQuery(
    appliedFilters,
    sessionStatus === "authenticated" && filtersApplied,
  );

  useEffect(() => {
    const total = callsQuery.data?.total;
    if (total == null || !Number.isFinite(total)) {
      return;
    }
    setTablePagination((prev) =>
      prev.totalRows === total ? prev : { ...prev, totalRows: total },
    );
  }, [callsQuery.data?.total]);

  const handleApplyFilter = useCallback(() => {
    const validationError = parseFilterForm(filterForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setAppliedFilterForm(filterForm);
    setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
    setFiltersApplied(true);
  }, [filterForm]);

  const handlePaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setTablePagination((prev) => ({
      ...prev,
      currentPage: page,
      rowsPerPage,
    }));
  }, []);

  const updateFilterField = useCallback(
    <K extends keyof PerCallCostFilterForm>(
      key: K,
      value: PerCallCostFilterForm[K],
    ) => {
      setFilterForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return {
    filterForm,
    updateFilterField,
    handleApplyFilter,
    callsQuery,
    filtersApplied,
    tablePagination,
    handlePaginationChange,
    rows: callsQuery.data?.items ?? [],
  };
}
