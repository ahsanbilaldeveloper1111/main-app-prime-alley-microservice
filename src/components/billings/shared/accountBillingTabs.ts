import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export const ACCOUNT_BILLING_TABS = [
  {
    label: "Overview",
    slug: "overview",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
    isStaticSection: false,
  },
  {
    label: "Subscriptions",
    slug: "subscriptions",
    permission: PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING,
    isStaticSection: true,
  },
  {
    label: "Usage & Limits",
    slug: "usage-limits",
    permission: PERMISSIONS.VIEW_USAGE_LIMITS_BILLING,
    isStaticSection: true,
  },
  {
    label: "Billing History",
    slug: "billing-history",
    permission: PERMISSIONS.VIEW_BILLING_HISTORY_BILLING,
    isStaticSection: false,
  },
  {
    label: "Company Info",
    slug: "company-info",
    permission: PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
    isStaticSection: false,
  },
  {
    label: "Transactions",
    slug: "transactions",
    permission: PERMISSIONS.VIEW_TRANSACTIONS_BILLING,
    isStaticSection: false,
  },
  {
    label: "Documents",
    slug: "documents",
    permission: PERMISSIONS.VIEW_DOCUMENTS_BILLING,
    isStaticSection: false,
  },
  {
    label: "Payment Methods",
    slug: "payment-methods",
    permission: PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING,
    isStaticSection: false,
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

export function getAllowedAccountBillingTabs(userPermissions: readonly string[]) {
  const canViewStaticBillingSections = userPermissions.includes(
    PERMISSIONS.VIEW_STATIC_SECTIONS_BILLING,
  );

  return ACCOUNT_BILLING_TABS.filter(
    (tab) =>
      userPermissions.includes(tab.permission) &&
      (!tab.isStaticSection || canViewStaticBillingSections),
  );
}

