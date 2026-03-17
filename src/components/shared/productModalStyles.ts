import type { CSSProperties } from "react";

export const BASE_BUTTON: CSSProperties = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(138, 138, 138)",
  color: "rgb(20, 20, 20)",
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: "8px",
  paddingInline: "16px",
  maxWidth: "100%",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "12px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
  textUnderlineOffset: "24%",
};

export const FIELD_LABEL: CSSProperties = {
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  color: "#141414",
  marginBottom: "6px",
  display: "block",
};

export const FIELD_INPUT: CSSProperties = {
  height: "42px",
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
};

export const FIELD_TEXTAREA: CSSProperties = {
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "10px 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
  minHeight: "72px",
  backgroundColor: "#fff",
};

export const FIELD_SELECT: CSSProperties = {
  height: "42px",
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "0 36px 0 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: "#141414",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
};

export const SECTION_CARD: CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "28px 32px",
  marginBottom: "16px",
};

export const SECTION_TITLE: CSSProperties = {
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  color: "#141414",
  marginBottom: "24px",
  marginTop: 0,
};

