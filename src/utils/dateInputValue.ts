/**
 * Normalizes API / Date values to `YYYY-MM-DD` for HTML `input[type="date"]`.
 * Full ISO strings (e.g. `2024-03-15T00:00:00.000Z`) are not valid `value`s for date inputs.
 */
export function toDateInputValue(value: unknown): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    return new Date(t).toISOString().slice(0, 10);
  }
  return "";
}
