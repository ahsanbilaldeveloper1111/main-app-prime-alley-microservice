import { useEffect, type Dispatch, type SetStateAction } from "react";

/**
 * Keeps `currentFilters` in sync with tab ids used on CRM list pages:
 * `all` | `scheduled` | `has_leads`.
 */
export function useCrmListActiveTabFiltersEffect(
  activeFilter: string,
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>,
) {
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        // Preserve explicit false values (e.g. widget-driven filters like "Not Contacted"),
        // but clear tab-driven true flags when navigating back to "all".
        if (newFilters.has_scheduled_calls === true) {
          delete newFilters.has_scheduled_calls;
        }
        if (newFilters.has_tickets === true) {
          delete newFilters.has_tickets;
        }
        return newFilters;
      });
    } else if (activeFilter === "scheduled") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_tickets;
        newFilters.has_scheduled_calls = true;
        return newFilters;
      });
    } else if (activeFilter === "has_leads") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        newFilters.has_tickets = true;
        return newFilters;
      });
    }
  }, [activeFilter, setCurrentFilters]);
}
