import { formatDailyReportLabel, formatDailyReportStatus } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import { formatWorkforceAttendanceTime } from "@page-modules/workforce/attendance/workforceAttendanceDateTime";
import type {
  EmployeeAttendanceReportDay,
  EmployeeAttendanceReportSummary,
} from "@utils/staffManagement";

export type EmployeeReportSummaryCard = Readonly<{
  key: string;
  label: string;
  value: string;
}>;

export function formatEmployeeReportCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return String(value);
}

export function formatEmployeeReportHours(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value} hrs`;
}

export function formatEmployeeReportRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

export function buildEmployeeReportSummaryCards(
  summary: EmployeeAttendanceReportSummary,
): EmployeeReportSummaryCard[] {
  return [
    { key: "working_days", label: "Working days", value: formatEmployeeReportCount(summary.working_days) },
    { key: "present_days", label: "Present", value: formatEmployeeReportCount(summary.present_days) },
    { key: "absent_days", label: "Absent", value: formatEmployeeReportCount(summary.absent_days) },
    { key: "late_count", label: "Late arrivals", value: formatEmployeeReportCount(summary.late_count) },
    {
      key: "overtime_hours",
      label: "Overtime",
      value: formatEmployeeReportHours(summary.overtime_hours),
    },
    {
      key: "break_violations",
      label: "Break violations",
      value: formatEmployeeReportCount(summary.break_violations),
    },
    {
      key: "attendance_rate",
      label: "Attendance rate",
      value: formatEmployeeReportRate(summary.attendance_rate),
    },
  ];
}

export function formatEmployeeReportDayLabel(day: EmployeeAttendanceReportDay): string {
  return formatDailyReportLabel(day.date);
}

export function formatEmployeeReportDayStatus(day: EmployeeAttendanceReportDay): string {
  return formatDailyReportStatus(day.status);
}

export function formatEmployeeReportDayTime(value: string | null | undefined): string {
  return formatWorkforceAttendanceTime(value);
}

export function formatEmployeeReportDayHours(day: EmployeeAttendanceReportDay): string {
  if (day.total_hours?.trim()) {
    return day.total_hours.trim();
  }
  if (day.overtime_minutes != null && day.overtime_minutes > 0) {
    return `OT ${day.overtime_minutes} min`;
  }
  return "—";
}

export function readEmployeeReportDayRowKey(day: EmployeeAttendanceReportDay, index: number): string {
  const date = day.date?.trim();
  if (date) {
    return `employee-report-day-${date}`;
  }
  return `employee-report-day-${index}`;
}

export function resolveEmployeeReportStatusModifier(
  status: string | null | undefined,
): "present" | "late" | "absent" | "other" {
  const raw = status?.trim().toLowerCase() ?? "";
  if (raw.includes("late")) {
    return "late";
  }
  if (raw.includes("absent")) {
    return "absent";
  }
  if (raw.includes("present")) {
    return "present";
  }
  return "other";
}
