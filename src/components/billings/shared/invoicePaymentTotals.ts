/** Processing fee applied when charging by card (matches product copy: 3%). */
export const CARD_PAYMENT_PROCESSING_FEE_RATE = 0.03;

export type InvoicePaymentLike = Readonly<{
  amount_due?: string | number | null;
  total_amount?: string | number | null;
  status?: string | null;
  card_processing_fee?: string | number | null;
  card_charge_total?: string | number | null;
  payments?: ReadonlyArray<{
    amount?: string | number | null;
    status?: string | null;
    payment_method?: string | null;
  }> | null;
}>;

export type CardPaymentTotals = Readonly<{
  base_amount: number;
  processing_fee: number;
  amount: number;
}>;

export type ManualPaymentMethod = "bank_transfer" | "cash" | "check";

const COMPLETED_PAYMENT_STATUSES = new Set(["completed", "succeeded", "processed"]);

export function parseInvoiceMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function roundCurrency2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function hasAmountDueField(invoice: InvoicePaymentLike): boolean {
  return (
    invoice.amount_due !== undefined &&
    invoice.amount_due !== null &&
    String(invoice.amount_due).trim() !== ""
  );
}

function sumCompletedPayments(invoice: InvoicePaymentLike): number {
  const payments = invoice.payments;
  if (!Array.isArray(payments)) {
    return 0;
  }

  return payments.reduce((sum, payment) => {
    const status = String(payment?.status ?? "").trim().toLowerCase();
    if (!COMPLETED_PAYMENT_STATUSES.has(status)) {
      return sum;
    }
    return sum + parseInvoiceMoney(payment?.amount);
  }, 0);
}

export function isInvoicePartiallyPaid(invoice: InvoicePaymentLike | null | undefined): boolean {
  if (!invoice) {
    return false;
  }

  const status = String(invoice.status ?? "").trim().toLowerCase();
  if (status === "partially_paid" || status === "partial") {
    return true;
  }

  const total = parseInvoiceMoney(invoice.total_amount);
  const due = parseInvoiceMoney(invoice.amount_due);
  if (total > 0 && due > 0 && due < total - 0.009) {
    return true;
  }

  const paid = sumCompletedPayments(invoice);
  return paid > 0 && total > 0 && paid < total - 0.009;
}

/**
 * Outstanding balance for payment — always prefers `amount_due` when the API sends it.
 * Never charges card fee against `total_amount` when the invoice is partially paid.
 */
export function getInvoiceOutstandingAmount(
  invoice: InvoicePaymentLike | null | undefined,
): number {
  if (!invoice) {
    return 0;
  }

  if (hasAmountDueField(invoice)) {
    return Math.max(0, roundCurrency2(parseInvoiceMoney(invoice.amount_due)));
  }

  const total = parseInvoiceMoney(invoice.total_amount);
  const paid = sumCompletedPayments(invoice);
  if (paid > 0 && total > paid) {
    return roundCurrency2(total - paid);
  }

  return Math.max(0, roundCurrency2(total));
}

function readBackendCardTotals(invoice: InvoicePaymentLike): CardPaymentTotals | null {
  const feeRaw = invoice.card_processing_fee;
  const totalRaw = invoice.card_charge_total;
  const hasFeeField = feeRaw !== undefined && feeRaw !== null && String(feeRaw).trim() !== "";
  const hasTotalField =
    totalRaw !== undefined && totalRaw !== null && String(totalRaw).trim() !== "";

  if (!hasFeeField || !hasTotalField) {
    return null;
  }

  const base_amount = getInvoiceOutstandingAmount(invoice);
  const processing_fee = roundCurrency2(parseInvoiceMoney(feeRaw));
  const amount = roundCurrency2(parseInvoiceMoney(totalRaw));
  if (base_amount <= 0 || amount <= 0) {
    return null;
  }

  return { base_amount, processing_fee, amount };
}

/** Card charge breakdown — fee is on outstanding `amount_due`, not original invoice total. */
export function resolveCardPaymentTotals(
  invoice: InvoicePaymentLike | null | undefined,
): CardPaymentTotals {
  if (!invoice) {
    return { base_amount: 0, processing_fee: 0, amount: 0 };
  }

  const fromApi = readBackendCardTotals(invoice);
  if (fromApi) {
    return fromApi;
  }

  const base_amount = getInvoiceOutstandingAmount(invoice);
  if (base_amount <= 0) {
    return { base_amount: 0, processing_fee: 0, amount: 0 };
  }

  const processing_fee = roundCurrency2(
    base_amount * CARD_PAYMENT_PROCESSING_FEE_RATE,
  );
  const amount = roundCurrency2(base_amount + processing_fee);
  return { base_amount, processing_fee, amount };
}

export function buildManualPaymentAmounts(amount: number): Readonly<{
  amount: number;
  base_amount: number;
}> {
  const normalized = roundCurrency2(Math.max(0, amount));
  return { amount: normalized, base_amount: normalized };
}
