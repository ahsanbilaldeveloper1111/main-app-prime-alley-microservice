import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

type ReportsModalOverlayProps = Readonly<{
  ariaLabel: string;
  onClose: () => void;
  dialogClassName: string;
  children: React.ReactNode;
}>;

export function ReportsModalOverlay({
  ariaLabel,
  onClose,
  dialogClassName,
  children,
}: ReportsModalOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => {
      onCloseRef.current();
    };

    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  if (globalThis.document === undefined) {
    return null;
  }

  return ReactDOM.createPortal(
    <dialog ref={dialogRef} aria-label={ariaLabel} className="reports-modal-overlay">
      <div className={`reports-modal-dialog ${dialogClassName}`}>{children}</div>
    </dialog>,
    document.body,
  );
}
