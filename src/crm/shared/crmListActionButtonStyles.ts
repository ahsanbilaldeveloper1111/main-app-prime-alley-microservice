import type { CSSProperties } from "react";

const ACTION_BUTTON_BASE: CSSProperties = {
  padding: "9px 13px",
  color: "#ffffff",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

export const CRM_LIST_DELETE_BUTTON_STYLE: CSSProperties = {
  ...ACTION_BUTTON_BASE,
  backgroundColor: "#dc3545",
  gap: "6px",
};

export const CRM_LIST_PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...ACTION_BUTTON_BASE,
  backgroundColor: "#000000",
  gap: "8px",
};

export const CRM_LIST_DROPDOWN_STYLE: CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: "4px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "5px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  minWidth: "160px",
  zIndex: 1000,
  overflow: "hidden",
};

export const CRM_LIST_DROPDOWN_ITEM_STYLE: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "transparent",
  border: "none",
  textAlign: "left",
  fontSize: "14px",
  color: "#141414",
  cursor: "pointer",
};

export function makeHoverHandlers(
  normalBg: string,
  hoverBg: string,
): {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void;
} {
  return {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = hoverBg;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = normalBg;
    },
  };
}

export const DELETE_BUTTON_HOVER = makeHoverHandlers("#dc3545", "#c82333");
export const PRIMARY_BUTTON_HOVER = makeHoverHandlers("#000000", "#1a1a1a");
export const DROPDOWN_ITEM_HOVER = makeHoverHandlers("transparent", "#f7fafc");
