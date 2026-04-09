import type { CSSProperties } from "react";

/** Shared primary (submit/edit) action — matches stage details dialog. */
export const CRM_DIALOG_PRIMARY_BUTTON_STYLE: CSSProperties = {
  padding: "10px 20px",
  borderRadius: "8px",
  fontWeight: 500,
  fontSize: "14px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#4680ff",
  border: "none",
};

/** Shared secondary (cancel/close) action — outlined, no icon. */
export const CRM_DIALOG_SECONDARY_BUTTON_STYLE: CSSProperties = {
  padding: "10px 20px",
  borderRadius: "8px",
  fontWeight: 500,
  fontSize: "14px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "white",
  color: "#6b7280",
  border: "2px solid #e5e7eb",
};

/** Row wrapper for dialog footer primary + secondary actions. */
export const CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
};
