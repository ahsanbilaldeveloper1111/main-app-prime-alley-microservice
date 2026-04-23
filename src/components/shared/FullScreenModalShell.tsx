import type { CSSProperties, ReactNode } from "react";
import { BASE_BUTTON } from "@components/shared/productModalStyles";
import {
  onDarkBorderEnter,
  onDarkBorderLeave,
  onSubBarBtnEnter,
  onSubBarBtnLeave,
} from "@components/shared/modalUiHelpers";
import { ToggleSwitch } from "@components/shared/ToggleSwitch";

const modalContainerStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  backgroundColor: "#f0f0f0",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
};

const topBarStyle: CSSProperties = {
  height: "52px",
  backgroundColor: "#1a1a1a",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingInline: "20px",
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  color: "#fff",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
};

const topBarActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const subBarStyle: CSSProperties = {
  height: "44px",
  backgroundColor: "#fff",
  borderBottom: "1px solid #e0e0e0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingInline: "20px",
  flexShrink: 0,
};

const scrollBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
  maxWidth: "90%",
  width: "90%",
  margin: "0 auto",
  boxSizing: "border-box",
};

const activeWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const activeLabelStyle: CSSProperties = {
  fontSize: "12px",
  color: "#141414",
  fontWeight: 300,
};

const activeInfoStyle: CSSProperties = {
  fontSize: "11px",
  color: "#888",
  cursor: "help",
};

export function FullScreenModalShell({
  title,
  onClose,
  topBarActions,
  subBarLeft,
  isActive,
  onToggleActive,
  hideActiveToggle = false,
  hideSubBar = false,
  activeInfoTitle = "When active, this will available for use.",
  children,
}: Readonly<{
  title: string;
  onClose: () => void;
  topBarActions?: ReactNode;
  subBarLeft?: ReactNode;
  isActive: boolean;
  onToggleActive: () => void;
  hideActiveToggle?: boolean;
  hideSubBar?: boolean;
  activeInfoTitle?: string;
  children: ReactNode;
}>) {
  return (
    <div style={modalContainerStyle}>
      <div style={topBarStyle}>
        <button
          onClick={onClose}
          style={{
            ...BASE_BUTTON,
            backgroundColor: "transparent",
            borderColor: "rgba(255,255,255,0.35)",
            color: "#fff",
          }}
          onMouseEnter={onDarkBorderEnter}
          onMouseLeave={onDarkBorderLeave}
        >
          Exit
        </button>

        <span style={titleStyle}>{title}</span>

        <div style={topBarActionsStyle}>{topBarActions}</div>
      </div>

      {!hideSubBar && (
        <div style={subBarStyle}>
          <div>{subBarLeft}</div>

          {!hideActiveToggle && (
            <div style={activeWrapStyle}>
              <span style={activeLabelStyle}>Active:</span>
              <span style={activeInfoStyle} title={activeInfoTitle}>
                ⓘ
              </span>
              <ToggleSwitch
                checked={isActive}
                onChange={() => onToggleActive()}
                ariaLabel="Toggle active"
              />
              {isActive && <span style={{ fontSize: "14px", color: "#2d6ae0" }}>✓</span>}
            </div>
          )}
        </div>
      )}

      <div style={scrollBodyStyle}>{children}</div>
    </div>
  );
}

export function SubBarButton({
  children,
  onClick,
}: Readonly<{ children: ReactNode; onClick?: () => void }>) {
  return (
    <button
      type="button"
      style={{ ...BASE_BUTTON,cursor: "auto" }}
      onClick={onClick}
      onMouseEnter={onSubBarBtnEnter}
      onMouseLeave={onSubBarBtnLeave}
    >
      {children}
    </button>
  );
}

