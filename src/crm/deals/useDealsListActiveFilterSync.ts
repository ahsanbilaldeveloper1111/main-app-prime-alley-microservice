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
      if (activeFilter === "all") {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.stage_id;
          delete newFilters.include_archived;
          delete newFilters.include_lost;
          return newFilters;
        });
        clearStageDropdown();
      } else if (activeFilter === "lost") {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.stage_id;
          delete newFilters.include_archived;
          newFilters.include_lost = true;
          return newFilters;
        });
        clearStageDropdown();
      } else if (activeFilter === "deleted") {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.stage_id;
          delete newFilters.include_lost;
          newFilters.include_archived = true;
          return newFilters;
        });
        clearStageDropdown();
      } else if (activeFilter && stages.length > 0) {
        const selectedStage = stages.find(
          (s) => s.id.toString() === activeFilter,
        );
        if (selectedStage) {
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
      }
      return;
    }

    if (activeFilter === "all") {
      setCurrentFilters((prev) => applyDealTabAllFilters(prev));
      clearStageDropdown();
    } else if (activeFilter === "lost") {
      setCurrentFilters((prev) => applyDealTabLostFilters(prev));
      clearStageDropdown();
    } else if (activeFilter === "deleted") {
      setCurrentFilters((prev) => applyDealTabDeletedFilters(prev));
      clearStageDropdown();
    } else if (activeFilter === "rejected") {
      setCurrentFilters((prev) => applyDealTabRejectedFilters(prev));
      clearStageDropdown();
    } else if (activeFilter && stages.length > 0) {
      const selectedStage = stages.find(
        (s) => s.id.toString() === activeFilter,
      );
      if (selectedStage) {
        const stageId = selectedStage.id.toString();
        setCurrentFilters((prev) => applyDealTabStageFilters(prev, stageId));
        setDealsFilters((prev) => ({
          ...prev,
          stage: stageId,
        }));
      }
    }
  }, [activeFilter, isApprovalsList, stages, setCurrentFilters, setDealsFilters]);
}
