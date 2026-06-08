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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (globalThis.document === undefined) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className="reports-modal-overlay"
      role="presentation"
      onClick={() => onCloseRef.current()}
    >
      <div
        className={`reports-modal-dialog ${dialogClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
