import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export const ACCOUNT_BILLING_TABS = [
  {
    label: "Overview",
    slug: "overview",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
  },
  {
    label: "Subscriptions",
    slug: "subscriptions",
    permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING,
  },
  {
    label: "Usage & Limits",
    slug: "usage-limits",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
  },
  {
    label: "Billing History",
    slug: "billing-history",
    permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING,
  },
  {
    label: "Company Info",
    slug: "company-info",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
  },
  {
    label: "Transactions",
    slug: "transactions",
    permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING,
  },
  {
    label: "Documents",
    slug: "documents",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
  },
  {
    label: "Payment Methods",
    slug: "payment-methods",
    permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING,
  },
] as const;

export type AccountBillingTab = (typeof ACCOUNT_BILLING_TABS)[number]["label"];
export type AccountBillingTabSlug = (typeof ACCOUNT_BILLING_TABS)[number]["slug"];
export type AccountBillingTabPermission =
  (typeof ACCOUNT_BILLING_TABS)[number]["permission"];

export const ACCOUNT_BILLING_TAB_PAYMENT_METHODS: AccountBillingTab = "Payment Methods";
export const ACCOUNT_BILLING_TAB_PAYMENT_METHODS_SLUG: AccountBillingTabSlug = "payment-methods";

export function tabLabelFromQuery(value: string | null | undefined): AccountBillingTab | null {
  if (!value) return null;

  const trimmed = value.trim();
  const bySlug = ACCOUNT_BILLING_TABS.find((t) => t.slug === trimmed);
  if (bySlug) return bySlug.label;

  const byLabel = ACCOUNT_BILLING_TABS.find((t) => t.label === trimmed);
  return byLabel ? byLabel.label : null;
}

export function tabSlugFromLabel(label: AccountBillingTab): AccountBillingTabSlug {
  // Labels and slugs are defined together above, so this must exist.
  return (ACCOUNT_BILLING_TABS.find((t) => t.label === label) ?? ACCOUNT_BILLING_TABS[0]).slug;
}

