/**
 * Current local date/time as `YYYY-MM-DDTHH:mm` for
 * `input[type="datetime-local"]` `min` and comparisons.
 */
export function getDatetimeLocalMinNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
