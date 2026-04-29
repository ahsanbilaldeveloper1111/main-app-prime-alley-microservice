/**
 * Canonical path prefix for customer billing portal pages (`src/pages/billing/customer/**`).
 * Use {@link billingCustomerHref} or {@link billingCustomerRoutes} instead of string literals.
 */
export const BILLING_CUSTOMER_PORTAL_BASE_PATH = "/billing/customer" as const;

/** Linear-time trim of `/` at both ends (avoids regex backtracking per Sonar S5852). */
function trimPathSlashes(segment: string): string {
  let start = 0;
  let end = segment.length;
  while (start < end && segment[start] === "/") {
    start += 1;
  }
  while (end > start && segment[end - 1] === "/") {
    end -= 1;
  }
  return segment.slice(start, end);
}

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
    .map((s) => trimPathSlashes(String(s)))
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
  /** Main Settings → Billing (redirects to default billing sub-tab, e.g. payment methods). */
  mainSettingsBilling: () => "/main-settings/billing" as const,
} as const;

/** Tenant “Account & Billing” hub (separate from customer portal). */
export const BILLING_ACCOUNT_BILLING_BASE_PATH = "/billing/account-billing" as const;
