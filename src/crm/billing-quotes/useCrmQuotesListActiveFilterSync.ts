import { useEffect, type Dispatch, type SetStateAction } from "react";

export function useCrmQuotesListActiveFilterSync(
  activeFilter: string,
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>,
) {
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.expiring_soon;
        delete newFilters.status;
        delete newFilters.pending_approval;
        return newFilters;
      });
      return;
    }
    if (activeFilter === "expiring_soon") {
      setCurrentFilters((prev) => ({ ...prev, expiring_soon: true }));
      return;
    }
    if (activeFilter === "pending_acceptance") {
      setCurrentFilters((prev) => ({ ...prev, status: "Pending" }));
      return;
    }
    if (activeFilter === "pending_approval") {
      setCurrentFilters((prev) => ({ ...prev, pending_approval: true }));
    }
  }, [activeFilter, setCurrentFilters]);
}
