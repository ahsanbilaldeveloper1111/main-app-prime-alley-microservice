function stringFromErrorMessageField(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

/**
 * Typical client-side connectivity issues (offline, CORS/ad-block, DNS, tab backgrounded).
 * Not useful as Sentry errors and should not surface as "unhandled".
 */
export function isBenignNetworkFailure(reason: unknown): boolean {
  if (!reason || typeof reason !== "object") {
    return false;
  }

  const o = reason as Record<string, unknown>;
  if (o.response != null) {
    return false;
  }

  const message = stringFromErrorMessageField(o.message);
  const code = typeof o.code === "string" ? o.code : undefined;
  const name = typeof o.name === "string" ? o.name : undefined;
  const lower = message.toLowerCase();

  if (code === "ERR_NETWORK") {
    return true;
  }
  if (name === "TypeError" && lower.includes("failed to fetch")) {
    return true;
  }
  if (lower === "network error") {
    return true;
  }
  if (lower.includes("failed to fetch")) {
    return true;
  }
  if (lower.includes("load failed")) {
    return true;
  }
  return false;
}
