import { useCallback, useState } from "react";

/**
 * Shared open/close pair for Bootstrap modals and side panels (CRM / Planner / Billing).
 */
export function useModalDisclosure(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const onClose = useCallback(() => {
    setOpen(false);
  }, []);
  return { open, setOpen, onOpen, onClose };
}
