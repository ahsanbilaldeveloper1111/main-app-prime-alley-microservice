export const ACCOUNT_BILLING_TABS = [
  { label: "Overview", slug: "overview" },
  { label: "Subscriptions", slug: "subscriptions" },
  { label: "Usage & Limits", slug: "usage-limits" },
  { label: "Billing History", slug: "billing-history" },
  { label: "Company Info", slug: "company-info" },
  { label: "Transactions", slug: "transactions" },
  { label: "Documents", slug: "documents" },
  { label: "Payment Methods", slug: "payment-methods" },
] as const;

export type AccountBillingTab = (typeof ACCOUNT_BILLING_TABS)[number]["label"];
export type AccountBillingTabSlug = (typeof ACCOUNT_BILLING_TABS)[number]["slug"];

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

