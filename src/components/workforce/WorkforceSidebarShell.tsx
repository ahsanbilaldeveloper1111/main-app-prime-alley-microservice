import React, { type CSSProperties } from "react";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import "@assets/scss/add-form-sidebar.scss";
import "@page-modules/workforce/shared/workforcePages.scss";

type WorkforceSidebarShellProps = {
  isOpen: boolean;
  className?: string;
  title: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
  /** Shown on the primary button while `submitting` is true (e.g. "Saving…" for edit flows). */
  submittingLabel?: string;
  submitting: boolean;
  primaryDisabled: boolean;
  children: React.ReactNode;
};

const sidebarPanelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  height: "100vh",
  backgroundColor: "#ffffff",
  boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
  zIndex: 999999,
  display: "flex",
  flexDirection: "column",
};

const sidebarHeaderStyle: CSSProperties = {
  borderBottom: "1px solid #eaf0f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const sidebarTitleStyle: CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#141414",
  margin: 0,
};

const sidebarCloseButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  color: "#718096",
  display: "flex",
  alignItems: "center",
};

const sidebarFormStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
};

const sidebarContentStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
};

const sidebarFooterStyle: CSSProperties = {
  borderTop: "1px solid #eaf0f6",
  display: "flex",
  gap: "12px",
  justifyContent: "flex-start",
};

const WorkforceSidebarShell: React.FC<WorkforceSidebarShellProps> = ({
  isOpen,
  className,
  title,
  onClose,
  onSubmit,
  submitLabel,
  submittingLabel = "Creating…",
  submitting,
  primaryDisabled,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
        aria-hidden="true"
      />

      <div className={["contact-sidebar-container", className].filter(Boolean).join(" ")} style={sidebarPanelStyle}>
        <div className="contact-sidebar-header" style={sidebarHeaderStyle}>
          <h2 className="contact-sidebar-title" style={sidebarTitleStyle}>{title}</h2>
          <button type="button" onClick={onClose} style={sidebarCloseButtonStyle}>
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={onSubmit} style={sidebarFormStyle}>
          <div className="contact-sidebar-content" style={sidebarContentStyle}>{children}</div>

          <div className="contact-sidebar-footer" style={sidebarFooterStyle}>
            <button
              type="submit"
              disabled={primaryDisabled}
              className="contact-form-btn-create workforce-sidebar-btn-create"
            >
              {submitting ? submittingLabel : submitLabel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="contact-form-btn-cancel workforce-sidebar-btn-cancel"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default WorkforceSidebarShell;
