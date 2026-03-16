import type { CSSProperties } from "react";

export const FONT = "Lexend Deca, Helvetica, Arial, sans-serif";
export const PRIMARY_TEXT = "#141414";

export const BASE_BUTTON: CSSProperties = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(138, 138, 138)",
  color: PRIMARY_TEXT,
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: "12px",
  paddingInline: "27px",
  maxWidth: "100%",
  fontFamily: FONT,
  fontSize: "14px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
};

