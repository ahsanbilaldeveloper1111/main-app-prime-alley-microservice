import type { CSSProperties } from "react";
import { BILLING_FONT, billingSharedStyles } from "@components/billings/shared/styles";

export const overviewStyles: Record<string, CSSProperties> = {
  ...billingSharedStyles,
  companyHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: BILLING_FONT,
    letterSpacing: 0,
    lineHeight: "29px",
    marginBottom: 20,
  },
  sectionHeading: {
    ...billingSharedStyles.sectionHeading,
    boxSizing: "border-box" as const,
    fontStyle: "unset",
    textTransform: "unset" as const,
    margin: "0 0 16px 0",
    padding: 0,
    backgroundColor: "unset",
  },
  btnDark: {
    ...billingSharedStyles.btnDark,
    maxWidth: "100%",
    textUnderlineOffset: "24%",
  },
  btnLight: {
    ...billingSharedStyles.btnLight,
    maxWidth: "100%",
  },
  subHeading: {
    boxSizing: "border-box" as const,
    fontSize: 20,
    fontStyle: "unset",
    fontWeight: 600,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: BILLING_FONT,
    letterSpacing: 0,
    lineHeight: "24px",
  },
};
