import { X } from "lucide-react";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export type MainSettingsFormSidebarProps = Readonly<{
  show: boolean;
  onHide: () => void;
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  disableClose?: boolean;
  /** Extra class on the dialog root — use section-specific modifiers (e.g. Policies & Attendance). */
  sidebarClassName?: string;
}>;

const SIDEBAR_Z_INDEX = 99999;
const BACKDROP_Z_INDEX = 99998;

export function MainSettingsFormSidebar({
  show,
  onHide,
  title,
  titleIcon,
  headerExtra,
  children,
  footer,
  disableClose = false,
  sidebarClassName,
}: MainSettingsFormSidebarProps) {
  useEffect(() => {
    if (!show || globalThis.document === undefined) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [show]);

  if (!show || globalThis.document === undefined) {
    return null;
  }

  const handleBackdropClick = () => {
    if (disableClose) return;
    onHide();
  };

  return createPortal(
    <>
      <button
        type="button"
        className="main-settings-form-sidebar-backdrop"
        aria-label="Close panel"
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: BACKDROP_Z_INDEX,
          border: "none",
          padding: 0,
          margin: 0,
          background: "rgba(0, 0, 0, 0.35)",
          cursor: disableClose ? "default" : "pointer",
        }}
      />
      <dialog
        open
        className={[
          "main-settings-form-sidebar",
          "main-settings-form-sidebar--open",
          "contact-sidebar-container",
          sidebarClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Form panel"}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: "auto",
          height: "100dvh",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
          zIndex: SIDEBAR_Z_INDEX,
          display: "flex",
          flexDirection: "column",
          margin: 0,
        }}
      >
        <div
          className="main-settings-form-sidebar__header contact-sidebar-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            borderBottom: "1px solid #eaf0f6",
            flexShrink: 0,
          }}
        >
          <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
            {titleIcon}
            <h2 className="contact-sidebar-title mb-0">{title}</h2>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {headerExtra}
            <button
              type="button"
              className="contact-sidebar-close-btn"
              onClick={onHide}
              disabled={disableClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: disableClose ? "not-allowed" : "pointer",
                color: "#718096",
                display: "flex",
                alignItems: "center",
                opacity: disableClose ? 0.5 : 1,
              }}
            >
              <X size={24} aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="main-settings-form-sidebar__body contact-sidebar-content"
          style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        >
          {children}
        </div>

        {footer ? (
          <div className="main-settings-form-sidebar__footer contact-sidebar-footer">
            {footer}
          </div>
        ) : null}
      </dialog>
    </>,
    document.body,
  );
}
