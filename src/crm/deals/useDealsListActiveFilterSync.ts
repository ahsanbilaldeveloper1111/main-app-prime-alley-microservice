import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  applyDealTabAllFilters,
  applyDealTabDeletedFilters,
  applyDealTabLostFilters,
  applyDealTabRejectedFilters,
  applyDealTabStageFilters,
} from "@crm/deals/dealsListTabFilterHelpers";

type StageLike = { id: string | number };

type Params<T extends Record<string, any>> = Readonly<{
  activeFilter: string;
  isApprovalsList: boolean;
  stages: StageLike[];
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>;
  /** Sidebar filter state; hook only updates `stage` via `{ ...prev, stage }`. */
  setDealsFilters: Dispatch<SetStateAction<T>>;
}>;

function runApprovalsListActiveFilterSync<T extends Record<string, any>>(
  activeFilter: string,
  stages: StageLike[],
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>,
  setDealsFilters: Dispatch<SetStateAction<T>>,
  clearStageDropdown: () => void,
): void {
  if (activeFilter === "all") {
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters.stage_id;
      delete newFilters.include_archived;
      delete newFilters.include_lost;
      return newFilters;
    });
    clearStageDropdown();
    return;
  }
  if (activeFilter === "lost") {
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters.stage_id;
      delete newFilters.include_archived;
      newFilters.include_lost = true;
      return newFilters;
    });
    clearStageDropdown();
    return;
  }
  if (activeFilter === "deleted") {
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters.stage_id;
      delete newFilters.include_lost;
      newFilters.include_archived = true;
      return newFilters;
    });
    clearStageDropdown();
    return;
  }
  if (!activeFilter || stages.length === 0) {
    return;
  }
  const selectedStage = stages.find((s) => s.id.toString() === activeFilter);
  if (!selectedStage) {
    return;
  }
  setCurrentFilters((prev) => {
    const newFilters = { ...prev };
    delete newFilters.include_archived;
    delete newFilters.include_lost;
    newFilters.stage_id = selectedStage.id.toString();
    return newFilters;
  });
  setDealsFilters((prev) => ({
    ...prev,
    stage: selectedStage.id.toString(),
  }));
}

function runStandardDealsListActiveFilterSync<T extends Record<string, any>>(
  activeFilter: string,
  stages: StageLike[],
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>,
  setDealsFilters: Dispatch<SetStateAction<T>>,
  clearStageDropdown: () => void,
): void {
  if (activeFilter === "all") {
    setCurrentFilters((prev) => applyDealTabAllFilters(prev));
    clearStageDropdown();
    return;
  }
  if (activeFilter === "lost") {
    setCurrentFilters((prev) => applyDealTabLostFilters(prev));
    clearStageDropdown();
    return;
  }
  if (activeFilter === "deleted") {
    setCurrentFilters((prev) => applyDealTabDeletedFilters(prev));
    clearStageDropdown();
    return;
  }
  if (activeFilter === "rejected") {
    setCurrentFilters((prev) => applyDealTabRejectedFilters(prev));
    clearStageDropdown();
    return;
  }
  if (!activeFilter || stages.length === 0) {
    return;
  }
  const selectedStage = stages.find((s) => s.id.toString() === activeFilter);
  if (!selectedStage) {
    return;
  }
  const stageId = selectedStage.id.toString();
  setCurrentFilters((prev) => applyDealTabStageFilters(prev, stageId));
  setDealsFilters((prev) => ({
    ...prev,
    stage: stageId,
  }));
}

/**
 * Keeps deal list `currentFilters` and sidebar stage dropdown aligned with the active tab
 * (all / lost / deleted / rejected / stage). Extracted to lower cognitive complexity of the page shell.
 */
export function useDealsListActiveFilterSync<T extends Record<string, any>>({
  activeFilter,
  isApprovalsList,
  stages,
  setCurrentFilters,
  setDealsFilters,
}: Params<T>): void {
  useEffect(() => {
    const clearStageDropdown = () =>
      setDealsFilters((prev) => ({ ...prev, stage: null }));

    if (isApprovalsList) {
      runApprovalsListActiveFilterSync(
        activeFilter,
        stages,
        setCurrentFilters,
        setDealsFilters,
        clearStageDropdown,
      );
      return;
    }

    runStandardDealsListActiveFilterSync(
      activeFilter,
      stages,
      setCurrentFilters,
      setDealsFilters,
      clearStageDropdown,
    );
  }, [activeFilter, isApprovalsList, stages, setCurrentFilters, setDealsFilters]);
}
