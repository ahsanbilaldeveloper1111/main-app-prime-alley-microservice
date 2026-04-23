import React, { type CSSProperties } from "react";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";

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
  width: "600px",
  height: "100vh",
  backgroundColor: "#ffffff",
  boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
  zIndex: 999999,
  display: "flex",
  flexDirection: "column",
};

const sidebarHeaderStyle: CSSProperties = {
  padding: "20px 24px",
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
  padding: "40px",
};

const sidebarFooterStyle: CSSProperties = {
  padding: "16px 24px",
  borderTop: "1px solid #eaf0f6",
  display: "flex",
  gap: "12px",
  justifyContent: "flex-start",
};

const sidebarSecondaryButtonStyle: CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "transparent",
  color: "#141414",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: 500,
};

function getPrimaryButtonStyle(isDisabled: boolean): CSSProperties {
  return {
    padding: "10px 20px",
    backgroundColor: isDisabled ? "#cbd5e0" : "#0091ae",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: isDisabled ? "not-allowed" : "pointer",
  };
}

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

      <div className={className} style={sidebarPanelStyle}>
        <div style={sidebarHeaderStyle}>
          <h2 style={sidebarTitleStyle}>{title}</h2>
          <button type="button" onClick={onClose} style={sidebarCloseButtonStyle}>
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={onSubmit} style={sidebarFormStyle}>
          <div style={sidebarContentStyle}>{children}</div>

          <div style={sidebarFooterStyle}>
            <button type="submit" disabled={primaryDisabled} style={getPrimaryButtonStyle(primaryDisabled)}>
              {submitting ? submittingLabel : submitLabel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              style={{
                ...sidebarSecondaryButtonStyle,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
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
