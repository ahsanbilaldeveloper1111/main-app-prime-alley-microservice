const MINUTES_PER_HOUR = 60;

export function formatWorkloadMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0m";
  }
  const h = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const m = Math.round(totalMinutes % MINUTES_PER_HOUR);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatWorkloadPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
}

const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function formatWorkloadDayHeader(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const wd = WEEKDAY_SHORT[d.getDay()];
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return `${wd} ${month} ${day}`;
}

export function isSameCalendarDay(isoDate: string, now = new Date()): boolean {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function workloadPriorityLabel(priority: number): string {
  if (priority >= 2) return "High";
  if (priority === 1) return "Medium";
  return "Low";
}

/** API `load_band` values (TaskWorkloadController). */
export const WORKLOAD_LOAD_BANDS = [
  "available",
  "incomplete_data",
  "comfortable",
  "near_full",
  "overloaded",
] as const;

export type WorkloadLoadBand = (typeof WORKLOAD_LOAD_BANDS)[number];

const LOAD_BAND_LABELS: Record<string, string> = {
  available: "Available",
  incomplete_data: "Incomplete data",
  comfortable: "Comfortable",
  near_full: "Near full",
  overloaded: "Overloaded",
};

export function workloadLoadBandLabel(band: string): string {
  return LOAD_BAND_LABELS[band] ?? band.replaceAll("_", " ");
}

/** BEM-style modifier for cell backgrounds (see `workload-view.scss`). */
export function workloadCellBandClass(band: string): string {
  const safe = band.replace(/[^a-z0-9_-]/gi, "");
  return `workload-cell--${safe || "unknown"}`;
}

export function workloadCellKey(extensionNumber: string, isoDate: string): string {
  return `${extensionNumber}|${isoDate}`;
}

export function memberInitials(extensionNumber: string): string {
  const t = extensionNumber.trim();
  if (t.length <= 2) return t || "?";
  return t.slice(-2).toUpperCase();
}

export type WorkloadWeekPreset = "this_week" | "next_week";

export type WorkloadIsoDateRange = Readonly<{
  start: string;
  end: string;
}>;

/** Format a local calendar date as `YYYY-MM-DD`. */
export function formatWorkloadIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the ISO-style week (Mon–Sun) containing `ref`. */
function mondayOfWorkloadWeek(ref: Date): Date {
  const monday = new Date(ref);
  monday.setHours(12, 0, 0, 0);
  const weekday = monday.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  monday.setDate(monday.getDate() + offset);
  return monday;
}

/** Preset week ranges (Monday–Sunday) for workload filters. */
export function getWorkloadWeekRange(
  preset: WorkloadWeekPreset,
  ref = new Date(),
): WorkloadIsoDateRange {
  const monday = mondayOfWorkloadWeek(ref);
  if (preset === "next_week") {
    monday.setDate(monday.getDate() + 7);
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: formatWorkloadIsoDate(monday),
    end: formatWorkloadIsoDate(sunday),
  };
}

export function isWorkloadCustomRangeValid(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start <= end;
}
