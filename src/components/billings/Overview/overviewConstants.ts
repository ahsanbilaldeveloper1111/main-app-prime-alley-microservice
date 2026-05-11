import {
  BarChart3,
  CreditCard,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const commonActions = [
  {
    Icon: FileText,
    label: "View or download invoices",
    url: "/billing/account-billing/billing-history",
    isStaticSection: false,
  },
  {
    Icon: Settings,
    label: "View subscriptions",
    url: "/billing/account-billing/subscriptions",
    isStaticSection: true,
  },
  {
    Icon: CreditCard,
    label: "View Transactions",
    url: "/billing/account-billing/transactions",
    isStaticSection: false,
  },
  {
    Icon: BarChart3,
    label: "View usage & limits",
    url: "/billing/account-billing/usage-limits",
    isStaticSection: true,
  },
  {
    Icon: CreditCard,
    label: "Add a payment method",
    url: "/billing/account-billing/payment-methods",
    isStaticSection: false,
  },
] as const satisfies ReadonlyArray<{
  Icon: LucideIcon;
  label: string;
  url: string;
  isStaticSection: boolean;
}>;

export const starterIncludes = [
  "Smart CRM ",
  "Communications",
  "Planner",
  "Pulse",
  "Workforce",
] as const;

export const billingHelpLinks = [
  ["How do I cancel this subscription?", "Understand marketing contacts billing"],
  ["Billing and payment FAQs", "How do I update my payment method?"],
  [
    "Where do I find my subscription and service limits?",
    "View or download your invoices and receipts",
  ],
] as const;
