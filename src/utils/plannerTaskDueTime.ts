/**
 * Planner task `due_time` API helpers (UTC ISO from local calendar date + time).
 */

export function formatPlannerDueTimeAsUtcIso(
  calendarDateYmd: string | null | undefined,
  timeHhMm: string | null | undefined,
): string | undefined {
  const dateStr = calendarDateYmd?.trim() ?? "";
  const timeRaw = timeHhMm?.trim() ?? "";
  if (!dateStr || !timeRaw) return undefined;
  const time = timeRaw.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) return undefined;
  const local = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

/** Fill `<input type="time">` from API `due_time` (UTC ISO string or plain HH:mm). */
export function parseApiDueTimeToTimeInput(
  dueTimeRaw: string | null | undefined,
): string {
  if (dueTimeRaw == null || dueTimeRaw === "") return "";
  const s = String(dueTimeRaw).trim();
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  const timePattern = /(\d{1,2}):(\d{2})(?::\d{2})?/;
  const timeMatch = timePattern.exec(s);
  if (timeMatch) {
    const h = Math.min(23, Math.max(0, Number.parseInt(timeMatch[1], 10)));
    const m = Math.min(59, Math.max(0, Number.parseInt(timeMatch[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return "";
}
