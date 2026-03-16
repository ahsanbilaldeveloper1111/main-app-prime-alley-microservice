export type PaymentMethodLike = {
  is_default?: boolean;
  card?: { brand?: string; last4?: string };
  billing_details?: { name?: string };
  [key: string]: unknown;
};

export function normalizePaymentMethods(paymentMethods: unknown): PaymentMethodLike[] {
  if (Array.isArray(paymentMethods)) return paymentMethods as PaymentMethodLike[];
  const pm = paymentMethods as { data?: unknown; payment_methods?: unknown } | null | undefined;
  const list = pm?.data ?? pm?.payment_methods ?? [];
  if (!Array.isArray(list)) return [];
  return list.filter((x): x is PaymentMethodLike => typeof x === "object" && x !== null);
}

export function pickDisplayPaymentMethod(list: readonly PaymentMethodLike[]): PaymentMethodLike | undefined {
  return list.find((pm) => pm?.is_default) ?? list[0];
}

export function hasDefaultPaymentMethod(list: readonly PaymentMethodLike[]): boolean {
  return list.some((pm) => Boolean(pm?.is_default));
}

