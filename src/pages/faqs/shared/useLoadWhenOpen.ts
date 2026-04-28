import { useEffect } from 'react';

// ===== useLoadWhenOpen =====
/**
 * Hook to load data when a sidebar/modal opens.
 * Prevents redundant loading if data is already present.
 * 
 * @param open - Whether the sidebar/modal is open
 * @param hasData - Whether data is already loaded
 * @param load - Async function to load the data
 */
export function useLoadWhenOpen(
  open: boolean,
  hasData: boolean,
  load: () => Promise<void>
) {
  useEffect(() => {
    if (open && !hasData) {
      load();
    }
  }, [open, hasData, load]);
}
export default {};