/**
 * Normalizes API / Date values to `YYYY-MM-DD` for HTML `input[type="date"]`.
 * Full ISO strings (e.g. `2024-03-15T00:00:00.000Z`) are not valid `value`s for date inputs.
 */
function normalizeDateString(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const ymd = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const t = Date.parse(trimmed);
  if (!Number.isNaN(t)) {
    return new Date(t).toISOString().slice(0, 10);
  }
  return "";
}

export function toDateInputValue(value: unknown): string {
  if (value == null || value === "") return "";

  if (typeof value === "string") {
    return normalizeDateString(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }

  return "";
}
