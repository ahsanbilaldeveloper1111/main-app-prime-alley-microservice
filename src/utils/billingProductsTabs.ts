import type { ToolbarTabsDropdownItem } from "@components/GenericTable";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";

const { PERMISSIONS } = HEADER_CONSTANTS;

type BillingCustomerPortalTab = ToolbarTabsDropdownItem & {
  permission?: string;
};

const BILLING_CUSTOMER_PORTAL_TABS: BillingCustomerPortalTab[] = [
  {
    label: "Account Overview",
    href: billingCustomerRoutes.accountOverview(),
    permission: PERMISSIONS.VIEW_CUSTOMER_ACCOUNT_OVERVIEW_BILLING,
  },
  {
    label: "Products",
    href: billingCustomerRoutes.products(),
    permission: PERMISSIONS.VIEW_CUSTOMER_PRODUCTS_BILLING,
  },
  {
    label: "Quotes",
    href: billingCustomerRoutes.quotes(),
    permission: PERMISSIONS.VIEW_CUSTOMER_QUOTES_BILLING,
  },
  {
    label: "Order Invoicing",
    href: billingCustomerRoutes.orderInvoicing(),
    permission: PERMISSIONS.VIEW_CUSTOMER_ORDERS_BILLING,
  },
  {
    label: "Subscriptions",
    href: billingCustomerRoutes.subscriptions(),
    permission: PERMISSIONS.VIEW_CUSTOMER_SUBSCRIPTION_BILLING,
  },
  {
    label: "Invoices",
    href: billingCustomerRoutes.invoices(),
    permission: PERMISSIONS.VIEW_CUSTOMER_INVOICES_BILLING,
  },
  {
    label: "Payments",
    href: billingCustomerRoutes.payments(),
    permission: PERMISSIONS.VIEW_CUSTOMER_PAYMENTS_BILLING,
  },
  {
    label: "Transactions",
    href: billingCustomerRoutes.transactions(),
    permission: PERMISSIONS.VIEW_TRANSACTIONS_BILLING,
  },
];

/**
 * Toolbar “section” dropdown for customer billing pages (`/billing/customer/*`).
 * Note: this unfiltered export is kept for backward compatibility.
 */
export const BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS: ToolbarTabsDropdownItem[] =
  BILLING_CUSTOMER_PORTAL_TABS.map(({ permission, ...item }) => item);

/**
 * Permission-filtered customer billing dropdown items.
 */
export function getBillingCustomerPortalTabsDropdownItems(
  hasPermission: (permission: string) => boolean,
): ToolbarTabsDropdownItem[] {
  return BILLING_CUSTOMER_PORTAL_TABS
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map(({ permission, ...dropdownItem }) => dropdownItem);
}

/** @deprecated Prefer {@link BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS}. */
export const BILLING_PRODUCTS_TABS_DROPDOWN_ITEMS =
  BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS;
