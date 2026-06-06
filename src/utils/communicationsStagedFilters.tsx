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

/** Apply button for staged filter toolbars. Use `toolbar.clearAllFilters` for reset (Clear all). */
export function renderApplyFilterActions(
  hasUnappliedFilterChanges: boolean,
  onApply: () => void,
  classPrefix: string,
) {
  return (
    <button
      type="button"
      onClick={onApply}
      disabled={!hasUnappliedFilterChanges}
      className={`gt-filter-pill-add gt-apply-filters-btn ${classPrefix}-apply-filters-btn`}
    >
      Apply filters
    </button>
  );
}

/** @deprecated Use {@link renderApplyFilterActions} — Reset is handled by Clear all. */
export function renderApplyResetFilterActions(
  _hasNonDefaultFilters: boolean,
  hasUnappliedFilterChanges: boolean,
  _onReset: () => void,
  onApply: () => void,
  classPrefix: string,
) {
  return renderApplyFilterActions(
    hasUnappliedFilterChanges,
    onApply,
    classPrefix,
  );
}
