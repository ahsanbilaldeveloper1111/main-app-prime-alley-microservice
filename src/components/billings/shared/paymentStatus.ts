type PaymentRecord = Record<string, unknown>;

function readString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalize(v: unknown): string {
  return readString(v).toLowerCase();
}

function readNestedString(obj: PaymentRecord, path: string[]): string {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as PaymentRecord)[key];
  }
  return readString(cur);
}

function isStripeLikeMethod(method: unknown): boolean {
  const m = normalize(method);
  return m === "stripe" || m === "card";
}

function looksLikeDeclineSignal(payment: PaymentRecord): boolean {
  const candidates: string[] = [
    readNestedString(payment, ["gateway_response", "status"]),
    readNestedString(payment, ["gatewayResponse", "status"]),
    readString(payment.gateway_status),
    readString(payment.payment_intent_status),
    readString(payment.intent_status),
    readString(payment.stripe_status),
    readString(payment.payment_status),
    readString(payment.failure_code),
    readString(payment.failure_message),
    readString(payment.decline_code),
    readString(payment.error),
    readString(payment.error_message),
    readString(payment.errorMessage),
  ].filter(Boolean);

  if (candidates.length === 0) return false;

  const exact = new Set(["failed", "canceled", "cancelled", "requires_payment_method"]);
  const substrings = ["declin", "insufficient", "invalid", "expired"];

  return candidates.some((raw) => {
    const s = raw.toLowerCase();
    if (exact.has(s)) return true;
    return substrings.some((sub) => s.includes(sub));
  });
}

export type PaymentDisplayStatus = Readonly<{
  /** Human label for UI */
  label: string;
  /** GenericTable badge variant */
  variant: "success" | "danger" | "secondary";
  /** Normalized internal status for filters */
  normalized: string;
}>;

export function resolvePaymentDisplayStatus(payment: unknown): PaymentDisplayStatus {
  const p = (payment ?? {}) as PaymentRecord;
  const rawStatus = readString(p.status);
  const normalizedStatus = rawStatus.toLowerCase();

  if (normalizedStatus === "completed") {
    return { label: "Processed", variant: "success", normalized: "completed" };
  }

  if (
    normalizedStatus === "failed" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    return { label: "Failed", variant: "danger", normalized: "failed" };
  }

  // Stripe declines can be persisted as "pending" even when the gateway already failed.
  const paymentMethod = p.payment_method ?? p.paymentMethod;
  if (normalizedStatus === "pending" && isStripeLikeMethod(paymentMethod)) {
    if (looksLikeDeclineSignal(p)) {
      return { label: "Failed", variant: "danger", normalized: "failed" };
    }
  }

  // Default: show whatever backend stored.
  const label = rawStatus.length > 0 ? rawStatus : "-";
  return { label, variant: "secondary", normalized: normalizedStatus || "-" };
}

