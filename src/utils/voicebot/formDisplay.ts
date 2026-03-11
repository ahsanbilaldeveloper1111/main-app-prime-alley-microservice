/**
 * Shared helpers for voicebot pages: safe string coercion for form fields and display.
 * Avoids '[object Object]' when values from API are objects.
 */

/** Safely coerce API value to string for form fields; avoids '[object Object]' when value is an object. */
export function toFormString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value instanceof Date) return value.toISOString();
  return "";
}

/** Safely coerce value for display in UI; returns fallback for null/undefined or non-primitive. */
export function safeDisplayString(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/** Pick first value that is a string; avoids stringifying objects. */
export function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string") return v;
  }
  return "";
}
