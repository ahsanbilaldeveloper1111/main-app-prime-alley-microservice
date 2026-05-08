import type { CustomerData } from "@utils/accounts";

/** CRM accounting customer plus optional API-only fields used on this page. */
export type BillingCustomerView = CustomerData & {
  country?: string;
  account_balance?: unknown;
};

export type BillingInfoFormState = {
  name: string;
  email: string;
  phone: string;
  country: string;
  profile: {
    address: string;
    postal_code: string;
  };
};

export type CountrySelectOption = {
  value: string;
  label: string;
};

export type OverviewInvoiceRow = {
  id?: string | number;
  invoice_number: string;
  status?: string;
  invoice_date?: string;
  currency_code?: string;
  total_amount?: unknown;
};

export type OverviewPaymentRow = {
  id?: string | number;
  status?: string;
  payment_date?: string;
  invoice?: { invoice_number?: string };
};

export type OverviewDashboardCounters = {
  invoices?: { total_amount?: unknown };
};

export type PaymentMethodCard = {
  last4?: string;
  brand?: string;
  exp_month?: string | number;
  exp_year?: string | number;
};

export type PaymentMethod = {
  id?: string | number;
  is_default?: boolean;
  card?: PaymentMethodCard;
};

export const INITIAL_BILLING_FORM: BillingInfoFormState = {
  name: "",
  email: "",
  phone: "",
  country: "",
  profile: { address: "", postal_code: "" },
};
