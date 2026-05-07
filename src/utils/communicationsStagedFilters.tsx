import React, { useCallback, useMemo } from "react";

type Filters = Record<string, any>;

export function useStagedFiltersActions(
  currentFilters: Filters,
  appliedFilters: Filters,
  defaultFilters: Filters,
  setCurrentFilters: (filters: Filters) => void,
  applyFilters: (filters: Filters) => void,
) {
  const handleApplyFiltersClick = useCallback(() => {
    applyFilters(currentFilters);
  }, [applyFilters, currentFilters]);

  const handleResetFiltersClick = useCallback(() => {
    setCurrentFilters(defaultFilters);
    applyFilters(defaultFilters);
  }, [setCurrentFilters, defaultFilters, applyFilters]);

  const hasUnappliedFilterChanges = useMemo(
    () => JSON.stringify(currentFilters) !== JSON.stringify(appliedFilters),
    [currentFilters, appliedFilters],
  );

  const hasNonDefaultFilters = useMemo(
    () => JSON.stringify(currentFilters) !== JSON.stringify(defaultFilters),
    [currentFilters, defaultFilters],
  );

  return {
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  };
}

export function renderApplyResetFilterActions(
  hasNonDefaultFilters: boolean,
  hasUnappliedFilterChanges: boolean,
  onReset: () => void,
  onApply: () => void,
  classPrefix: string,
) {
  return (
    <>
      {hasNonDefaultFilters && (
        <button
          type="button"
          onClick={onReset}
          className={`gt-toolbar-btn ${classPrefix}-reset-filters-btn`}
        >
          Reset
        </button>
      )}
      <button
        type="button"
        onClick={onApply}
        disabled={!hasUnappliedFilterChanges}
        className={`gt-toolbar-btn gt-toolbar-btn--primary ${classPrefix}-apply-filters-btn`}
      >
        Apply Filters
      </button>
    </>
  );
}
