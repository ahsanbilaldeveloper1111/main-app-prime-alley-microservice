export interface StripePaymentMethodRow {
  id: string | number;
  is_default?: boolean;
  isDefault?: boolean;
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: string | number;
    exp_year?: string | number;
  };
  billing_details?: { name?: string };
}

export function isDefaultPaymentMethod(method: StripePaymentMethodRow): boolean {
  return Boolean(method.is_default ?? method.isDefault);
}
