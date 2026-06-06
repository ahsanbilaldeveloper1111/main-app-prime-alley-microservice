import { useEffect, useMemo, useState } from "react";
import { DROPDOWN_MENU_POPPER_CONFIG } from "./dropdownMenuPopperConfig";
import type { FilterPillMenuPopperConfig } from "./genericTableFilterPills";
import type { ToolbarConfig } from "./genericTableTypes";

function resolveInitialShowMetrics(defaultShowMetrics?: boolean): boolean {
  if (defaultShowMetrics !== undefined) {
    return defaultShowMetrics;
  }
  if (globalThis.window === undefined) {
    return true;
  }
  return globalThis.window.innerWidth >= 1920;
}

export function useGenericTableToolbarUiState({
  toolbar,
  defaultShowMetrics,
}: {
  toolbar: ToolbarConfig | undefined;
  defaultShowMetrics?: boolean;
}) {
  const [showFilterPills, setShowFilterPills] = useState(
    () => toolbar?.showFilterPills ?? false,
  );
  const [showMetrics, setShowMetrics] = useState(() =>
    resolveInitialShowMetrics(defaultShowMetrics),
  );
  const [openFilterPillId, setOpenFilterPillId] = useState<string | null>(null);
  const [filterPillSearch, setFilterPillSearch] = useState<
    Record<string, string>
  >({});
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  useEffect(() => {
    if (toolbar?.showFilterPills !== undefined) {
      setShowFilterPills(toolbar.showFilterPills);
    }
  }, [toolbar?.showFilterPills]);

  const filterPillMenuPopperConfig = useMemo(
    (): FilterPillMenuPopperConfig => DROPDOWN_MENU_POPPER_CONFIG,
    [],
  );

  return {
    showFilterPills,
    setShowFilterPills,
    showMetrics,
    setShowMetrics,
    openFilterPillId,
    setOpenFilterPillId,
    filterPillSearch,
    setFilterPillSearch,
    hoveredRowIndex,
    setHoveredRowIndex,
    filterPillMenuPopperConfig,
  };
}
