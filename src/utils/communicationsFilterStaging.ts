export type StagedFilters = Record<string, unknown>;

export type StageFiltersFn = (
  next:
    | StagedFilters
    | ((previous: StagedFilters) => StagedFilters),
) => void;

export function createStageFiltersHandler(
  getCurrentFilters: () => StagedFilters,
  setCurrentFilters: (next: StagedFilters) => void,
): StageFiltersFn {
  return (nextOrUpdater) => {
    const previous = getCurrentFilters();
    const next =
      typeof nextOrUpdater === "function"
        ? nextOrUpdater(previous)
        : nextOrUpdater;
    setCurrentFilters(next);
  };
}
