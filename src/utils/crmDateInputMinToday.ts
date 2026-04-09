import moment from "moment";

/**
 * Returns YYYY-MM-DD for `<input type="date" min="...">` on CRM list pages.
 * If `startDateParam` parses to a date before "today", that earlier date is used (existing behavior).
 */
export function getMinIsoDateForDateInput(startDateParam = ""): string {
  let today = new Date();
  if (startDateParam) {
    const startDate = new Date(startDateParam);
    if (moment(startDate).isBefore(today)) {
      today = startDate;
    }
  }
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` for date inputs from API date/time strings. */
export function toIsoDateInputValueFromDbField(value: unknown): string {
  if (value == null || value === "") return "";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0] ?? "";
}
