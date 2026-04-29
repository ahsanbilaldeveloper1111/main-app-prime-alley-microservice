import type { ToolbarTabsDropdownItem } from "@components/GenericTable";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";

/**
 * Toolbar “section” dropdown for customer billing pages (`/billing/customer/*`).
 */
export const BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS: ToolbarTabsDropdownItem[] =
  [
    {
      label: "Account Overview",
      href: billingCustomerRoutes.accountOverview(),
    },
    { label: "Products", href: billingCustomerRoutes.products() },
    { label: "Quotes", href: billingCustomerRoutes.quotes() },
    {
      label: "Order Invoicing",
      href: billingCustomerRoutes.orderInvoicing(),
    },
    {
      label: "Subscriptions",
      href: billingCustomerRoutes.subscriptions(),
    },
    { label: "Invoices", href: billingCustomerRoutes.invoices() },
    { label: "Payments", href: billingCustomerRoutes.payments() },
    {
      label: "Transactions",
      href: billingCustomerRoutes.transactions(),
    },
  ];

/** @deprecated Prefer {@link BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS}. */
export const BILLING_PRODUCTS_TABS_DROPDOWN_ITEMS =
  BILLING_CUSTOMER_PORTAL_TABS_DROPDOWN_ITEMS;
