import React, { useCallback, useMemo } from "react";
import { Button } from "react-bootstrap";

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
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onReset}
          className={`${classPrefix}-reset-filters-btn`}
        >
          Reset
        </Button>
      )}
      <Button
        variant="primary"
        size="sm"
        onClick={onApply}
        disabled={!hasUnappliedFilterChanges}
        className={`${classPrefix}-apply-filters-btn`}
      >
        Apply Filters
      </Button>
    </>
  );
}
