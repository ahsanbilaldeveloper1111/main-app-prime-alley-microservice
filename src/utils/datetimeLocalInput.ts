import moment from "moment";

/**
 * Current local date/time as `YYYY-MM-DDTHH:mm` for
 * `input[type="datetime-local"]` `min` and comparisons.
 */
export function getDatetimeLocalMinNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converts a `datetime-local` value (local wall time, no offset) to an ISO-8601 UTC
 * string for APIs that store `scheduled_call_at` in UTC.
 */
export function datetimeLocalToIsoUtc(datetimeLocal: string): string | undefined {
  const raw = datetimeLocal?.trim();
  if (!raw) {
    return undefined;
  }
  const m = moment(raw, "YYYY-MM-DDTHH:mm", true);
  if (!m.isValid()) {
    return undefined;
  }
  return m.toISOString();
}
