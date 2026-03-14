import type { CSSProperties } from "react";

export const BILLING_FONT = "Lexend Deca, Helvetica, Arial, sans-serif";

export const BILLING_CARD: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: 0,
  backgroundColor: "rgb(255, 255, 255)",
  boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
  border: "1px solid rgb(204, 204, 204)",
  marginBlockEnd: 16,
  borderRadius: 8,
  boxSizing: "border-box",
};

export const BILLING_CARD_PADDING: CSSProperties = { padding: "40px" };

export const BILLING_SECTION_HEADING: CSSProperties = {
  fontSize: 24,
  fontWeight: 300,
  fontFamily: BILLING_FONT,
  margin: 0,
  letterSpacing: 0,
  lineHeight: "29px",
  color: "#141414",
};

export const BILLING_LABEL: CSSProperties = {
  color: "rgb(102, 102, 102)",
  fontFamily: BILLING_FONT,
  fontSize: 12,
  fontWeight: 300,
  letterSpacing: 0,
  lineHeight: "18px",
};

export const BILLING_VALUE: CSSProperties = {
  fontFamily: BILLING_FONT,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: 0,
  lineHeight: "18px",
};

export const BILLING_LINK: CSSProperties = {
  fontWeight: 600,
  color: "rgb(0, 97, 98)",
  cursor: "pointer",
  textUnderlineOffset: "24%",
  textDecoration: "underline",
  fontFamily: BILLING_FONT,
  fontSize: 14,
};

export const BILLING_BUTTON_DARK: CSSProperties = {
  display: "inline-flex",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(20, 20, 20)",
  borderColor: "rgba(20, 20, 20, 0)",
  color: "rgb(255, 255, 255)",
  textDecoration: "none",
  borderRadius: 4,
  borderWidth: 1,
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: 8,
  paddingInline: 16,
  fontFamily: BILLING_FONT,
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: 0,
  lineHeight: "14px",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  cursor: "pointer",
  transition: "150ms ease-out",
};

export const BILLING_BUTTON_LIGHT: CSSProperties = {
  ...BILLING_BUTTON_DARK,
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(204, 204, 204)",
  color: "rgb(20, 20, 20)",
};

export const BILLING_SUBHEADING: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  fontFamily: BILLING_FONT,
  margin: 0,
  letterSpacing: 0,
  lineHeight: "20px",
  color: "#141414",
};

export const BILLING_PAGE: CSSProperties = {
  fontFamily: BILLING_FONT,
  color: "#141414",
  backgroundColor: "#f5f5f5",
  margin: 0,
  padding: 0,
  fontSize: 14,
};

export const billingSharedStyles = {
  card: BILLING_CARD,
  cardPadding: BILLING_CARD_PADDING,
  sectionHeading: BILLING_SECTION_HEADING,
  label: BILLING_LABEL,
  value: BILLING_VALUE,
  link: BILLING_LINK,
  btnDark: BILLING_BUTTON_DARK,
  btnLight: BILLING_BUTTON_LIGHT,
  subHeading: BILLING_SUBHEADING,
} as const satisfies Record<string, CSSProperties>;

