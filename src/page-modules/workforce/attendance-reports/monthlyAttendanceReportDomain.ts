import {
  buildDailyReportUserOptions,
  resolveDailyReportUserLabel,
} from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import type {
  MonthlyAttendanceReportRow,
  MonthlyAttendanceReportSummary,
  MonthlyAttendanceReportTrendPoint,
} from "@utils/staffManagement";

export const MONTHLY_ATTENDANCE_REPORT_LIST_DEFAULT_LIMIT = 25;

export const MONTHLY_ATTENDANCE_REPORT_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function defaultMonthlyReportMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function isValidMonthlyReportMonth(value: string): boolean {
  return MONTH_PATTERN.test(value.trim());
}

export function formatMonthlyAttendanceRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

export function formatMonthlyReportHours(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value} hrs`;
}

export function formatMonthlyReportCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return String(value);
}

export function formatMonthlyReportWorkedTotal(row: MonthlyAttendanceReportRow): string {
  if (row.worked_hours != null && Number.isFinite(row.worked_hours)) {
    return `${row.worked_hours} hrs`;
  }
  if (row.worked_minutes != null && Number.isFinite(row.worked_minutes)) {
    const hours = Math.floor(row.worked_minutes / 60);
    const minutes = row.worked_minutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes} min`;
  }
  return "—";
}

export function formatMonthlyReportOvertime(row: MonthlyAttendanceReportRow): string {
  if (row.overtime_hours != null && Number.isFinite(row.overtime_hours)) {
    return formatMonthlyReportHours(row.overtime_hours);
  }
  if (row.overtime_minutes != null && Number.isFinite(row.overtime_minutes)) {
    const hours = Math.floor(row.overtime_minutes / 60);
    const minutes = row.overtime_minutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes} min`;
  }
  return "—";
}

export function formatMonthlyReportLateArrivals(row: MonthlyAttendanceReportRow): string {
  if (row.late_arrivals != null && Number.isFinite(row.late_arrivals)) {
    return formatMonthlyReportCount(row.late_arrivals);
  }
  return formatMonthlyReportCount(row.late_days);
}

export function resolveMonthlyReportUserLabel(
  row: MonthlyAttendanceReportRow,
  userLabelById: ReadonlyMap<string, string>,
): string {
  return resolveDailyReportUserLabel(row, userLabelById);
}

export function filterMonthlyAttendanceReportBySearch(
  rows: readonly MonthlyAttendanceReportRow[],
  searchValue: string,
  userLabelById: ReadonlyMap<string, string>,
): MonthlyAttendanceReportRow[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const haystack = [
      resolveMonthlyReportUserLabel(row, userLabelById),
      row.user_id,
      row.department_name,
      row.month,
      row.present_days,
      row.absent_days,
      row.leave_days,
      row.late_days,
      row.late_arrivals,
      row.attendance_rate,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

export function readMonthlyAttendanceReportRowId(
  row: MonthlyAttendanceReportRow,
  index: number,
): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  const userId = row.user_id?.trim();
  if (userId) {
    return `${userId}-${row.month ?? index}`;
  }
  return `monthly-report-row-${index}`;
}

export function buildMonthlyReportUserLabelMap(
  users: ReadonlyArray<{ name: string; phone: string; department_id?: number | null }>,
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const option of buildDailyReportUserOptions(users)) {
    map.set(option.value, option.label);
  }
  return map;
}

export function formatMonthlyTrendLabel(point: MonthlyAttendanceReportTrendPoint): string {
  const label = point.label?.trim();
  if (label) return label;
  const date = point.date?.trim();
  return date || "—";
}

export function readMonthlyAttendanceTrendRowId(
  point: MonthlyAttendanceReportTrendPoint,
  index: number,
): string {
  const date = point.date?.trim();
  if (date) return `trend-${date}`;
  const label = point.label?.trim();
  if (label) return `trend-${label}`;
  return `monthly-trend-row-${index}`;
}

export type MonthlyReportSummaryCard = Readonly<{
  key: string;
  label: string;
  value: string;
}>;

export function buildMonthlyReportSummaryCards(
  summary: MonthlyAttendanceReportSummary,
): MonthlyReportSummaryCard[] {
  return [
    {
      key: "average_attendance_rate",
      label: "Average attendance rate",
      value: formatMonthlyAttendanceRate(summary.average_attendance_rate),
    },
    {
      key: "total_late_arrivals",
      label: "Total late arrivals",
      value: formatMonthlyReportCount(summary.total_late_arrivals),
    },
    {
      key: "total_absent_days",
      label: "Total absent days",
      value: formatMonthlyReportCount(summary.total_absent_days),
    },
    {
      key: "total_overtime_hours",
      label: "Total overtime hours",
      value: formatMonthlyReportHours(summary.total_overtime_hours),
    },
  ];
}
