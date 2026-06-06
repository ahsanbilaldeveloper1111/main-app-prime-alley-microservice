import React, { useEffect, useRef } from "react";

type ReportsModalOverlayProps = Readonly<{
  ariaLabel: string;
  onClose: () => void;
  dialogClassName: string;
  children: React.ReactNode;
}>;

export function ReportsModalOverlay({ ariaLabel, onClose, dialogClassName, children }: ReportsModalOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    dialog.showModal();

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} aria-label={ariaLabel} className="reports-modal-overlay">
      <div className={`reports-modal-dialog ${dialogClassName}`}>{children}</div>
    </dialog>
  );
}
