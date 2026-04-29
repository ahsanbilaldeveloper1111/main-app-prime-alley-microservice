/**
 * Canonical path prefix for customer billing portal pages (`src/pages/billing/customer/**`).
 * Use {@link billingCustomerHref} or {@link billingCustomerRoutes} instead of string literals.
 */
export const BILLING_CUSTOMER_PORTAL_BASE_PATH = "/billing/customer" as const;

/**
 * Build a URL under `/billing/customer/...`.
 *
 * @example billingCustomerHref("create-invoice") → `/billing/customer/create-invoice`
 * @example billingCustomerHref("invoices", "edit", 12) → `/billing/customer/invoices/edit/12`
 */
export function billingCustomerHref(
  ...pathSegments: Array<string | number | undefined | null>
): string {
  const parts = pathSegments
    .filter((s) => s !== undefined && s !== null && String(s).length > 0)
    .map((s) => String(s).replaceAll(/^\/+|\/+$/g, ""))
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return BILLING_CUSTOMER_PORTAL_BASE_PATH;
  }
  return `${BILLING_CUSTOMER_PORTAL_BASE_PATH}/${parts.join("/")}`;
}

/** Named helpers for common customer billing routes (single source of truth). */
export const billingCustomerRoutes = {
  portalRoot: () => BILLING_CUSTOMER_PORTAL_BASE_PATH,
  dashboard: () => billingCustomerHref("dashboard"),
  accountOverview: () => billingCustomerHref("account-overview"),
  products: () => billingCustomerHref("products"),
  productsManageCategories: () =>
    billingCustomerHref("products", "manage-categories"),
  quotes: () => billingCustomerHref("quotes"),
  orderInvoicing: () => billingCustomerHref("order-invoicing"),
  subscriptions: () => billingCustomerHref("subscriptions"),
  invoices: () => billingCustomerHref("invoices"),
  invoicesEdit: (id: string | number) =>
    billingCustomerHref("invoices", "edit", id),
  createInvoice: () => billingCustomerHref("create-invoice"),
  payments: () => billingCustomerHref("payments"),
  transactions: () => billingCustomerHref("transactions"),
  paymentHistory: () => billingCustomerHref("payment-history"),
  paymentMethods: () => billingCustomerHref("payment-methods"),
} as const;

/** Tenant “Account & Billing” hub (separate from customer portal). */
export const BILLING_ACCOUNT_BILLING_BASE_PATH = "/billing/account-billing" as const;
