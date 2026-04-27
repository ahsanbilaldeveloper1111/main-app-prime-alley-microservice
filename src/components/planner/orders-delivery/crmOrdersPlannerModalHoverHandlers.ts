import type React from "react";

type HoverHost = HTMLButtonElement;

function patchButtonStyle(
  e: React.MouseEvent<HoverHost> | React.FocusEvent<HoverHost>,
  patch: Record<string, string>,
): void {
  Object.assign(e.currentTarget.style, patch);
}

/**
 * Shared mouse/focus hover handlers for modal buttons that mutate inline styles.
 */
export function crmOrdersPlannerModalButtonHoverHandlers(
  active: Record<string, string>,
  inactive: Record<string, string>,
): Readonly<{
  onMouseOver: (e: React.MouseEvent<HoverHost>) => void;
  onFocus: (e: React.FocusEvent<HoverHost>) => void;
  onMouseOut: (e: React.MouseEvent<HoverHost>) => void;
  onBlur: (e: React.FocusEvent<HoverHost>) => void;
}> {
  return {
    onMouseOver: (e) => patchButtonStyle(e, active),
    onFocus: (e) => patchButtonStyle(e, active),
    onMouseOut: (e) => patchButtonStyle(e, inactive),
    onBlur: (e) => patchButtonStyle(e, inactive),
  };
}

const HEADER_CLOSE_ACTIVE: Record<string, string> = {
  background: "rgba(255,255,255,0.25)",
  transform: "scale(1.05)",
};

const HEADER_CLOSE_INACTIVE: Record<string, string> = {
  background: "rgba(255,255,255,0.15)",
  transform: "scale(1)",
};

export const crmOrdersOrderViewModalHeaderCloseHoverHandlers =
  crmOrdersPlannerModalButtonHoverHandlers(HEADER_CLOSE_ACTIVE, HEADER_CLOSE_INACTIVE);

const EDIT_ROW_ACTIVE: Record<string, string> = {
  borderColor: "#f59e0b",
  background: "#fffbeb",
  transform: "translateX(4px)",
};

const EDIT_ROW_INACTIVE: Record<string, string> = {
  borderColor: "#e5e7eb",
  background: "white",
  transform: "translateX(0)",
};

export const crmOrdersOrderViewModalEditRowHoverHandlers =
  crmOrdersPlannerModalButtonHoverHandlers(EDIT_ROW_ACTIVE, EDIT_ROW_INACTIVE);

const FOOTER_CLOSE_ACTIVE: Record<string, string> = {
  borderColor: "#f59e0b",
  color: "#f59e0b",
  background: "#fffbeb",
};

const FOOTER_CLOSE_INACTIVE: Record<string, string> = {
  borderColor: "#e5e7eb",
  color: "#6c757d",
  background: "white",
};

export const crmOrdersOrderViewModalFooterCloseHoverHandlers =
  crmOrdersPlannerModalButtonHoverHandlers(FOOTER_CLOSE_ACTIVE, FOOTER_CLOSE_INACTIVE);
