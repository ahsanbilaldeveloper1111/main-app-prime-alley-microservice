export const AI_CHATBOT_DECIMAL_PLACES = 2;

/** Format a user- or API-provided decimal string for inputs and payloads (max 2 fraction digits). */
export function formatDecimalInputValue(
  value: string,
  fractionDigits = AI_CHATBOT_DECIMAL_PLACES,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }
  return parsed.toFixed(fractionDigits);
}

/** Read a numeric or string API value as a decimal string with fixed fraction digits. */
export function readDecimalStringValue(
  raw: unknown,
  fractionDigits = AI_CHATBOT_DECIMAL_PLACES,
): string {
  if (typeof raw === "string" && raw.trim()) {
    return formatDecimalInputValue(raw.trim(), fractionDigits);
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw.toFixed(fractionDigits);
  }
  return "";
}
