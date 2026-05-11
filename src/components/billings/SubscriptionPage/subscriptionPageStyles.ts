import type { CSSProperties } from "react";
import { BILLING_PAGE, billingSharedStyles } from "@components/billings/shared/styles";

export const subscriptionPageStyles: Record<string, CSSProperties> = {
  body: BILLING_PAGE,
  ...billingSharedStyles,
  strikethrough: {
    textDecoration: "line-through",
    color: "#999",
    fontSize: 14,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  },
  discountText: {
    fontSize: 14,
    color: "#141414",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    color: "#141414",
  },
  divider: {
    borderTop: "1px dashed #ccc",
    margin: "16px 0",
  },
  includedItem: {
    fontSize: 14,
    color: "#141414",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    marginBottom: 4,
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
};

export const PRO_PLAN_INCLUDES = [
  "Smart CRM ",
  "Communications",
  "Planner",
  "Pulse",
  "Workforce",
] as const;
