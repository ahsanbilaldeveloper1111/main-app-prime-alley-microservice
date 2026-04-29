import type { ReactNode } from "react";

export const BILLING_CUSTOMER_PORTAL_TABLE_SHELL_STYLE = {
  display: "flex",
  gap: "0",
  height: "calc(100vh)",
  overflow: "hidden",
} as const;

export type BillingCustomerPortalTableShellProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Shared flex shell for customer billing pages that show a full-height table + optional sidebar.
 */
export function BillingCustomerPortalTableShell({
  children,
}: BillingCustomerPortalTableShellProps) {
  return <div style={BILLING_CUSTOMER_PORTAL_TABLE_SHELL_STYLE}>{children}</div>;
}
