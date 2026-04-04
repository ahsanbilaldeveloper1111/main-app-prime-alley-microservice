import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";

interface UseCrmListFilterActionsParams {
  currentFilters: Record<string, any>;
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  setPagination: Dispatch<SetStateAction<any>>;
  computeAdvancedFiltersApplied: (filters: Record<string, any>) => boolean;
  pruneFilters?: (filters: Record<string, any>) => void;
}

function defaultPruneFilters(filters: Record<string, any>) {
  Object.keys(filters).forEach((k) => {
    const v = filters[k];
    if (
      v === undefined ||
      v === null ||
      v === "" ||
      (Array.isArray(v) && v.length === 0)
    ) {
      delete filters[k];
    }
  });
}

export function useCrmListFilterActions({
  currentFilters,
  setCurrentFilters,
  setRefreshKey,
  setPagination,
  computeAdvancedFiltersApplied,
  pruneFilters = defaultPruneFilters,
}: UseCrmListFilterActionsParams) {
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const applyTableFiltersPatch = useCallback(
    (patch: Record<string, any>) => {
      const next: Record<string, any> = { ...currentFilters, ...patch };
      pruneFilters(next);
      handleFiltersChange(next);
      setPagination((prev: any) => ({ ...prev, currentPage: 1 }));
    },
    [currentFilters, handleFiltersChange, setPagination, pruneFilters],
  );

  const hasAdvancedFiltersApplied = useMemo(
    () => computeAdvancedFiltersApplied(currentFilters),
    [currentFilters, computeAdvancedFiltersApplied],
  );

  return { handleFiltersChange, applyTableFiltersPatch, hasAdvancedFiltersApplied };
}
