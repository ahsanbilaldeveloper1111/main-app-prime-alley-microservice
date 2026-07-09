import { formatDailyReportLabel, formatDailyReportStatus } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import { formatDateTimeToLocal } from "@utils/Helper";
import type {
  EmployeeAttendanceReportDay,
  EmployeeAttendanceReportSummary,
} from "@utils/staffManagement";

const EMPLOYEE_REPORT_TIME_FORMAT = "hh:mm A";

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
  const statusModifier = resolveEmployeeReportStatusModifier(day.status);
  const label = formatDailyReportStatus(day.status);

  if (statusModifier === "late") {
    const lateMinutes = day.late_minutes;
    if (lateMinutes != null && Number.isFinite(lateMinutes) && lateMinutes > 0) {
      const rawStatus = day.status?.trim() ?? "";
      if (!/\d/.test(rawStatus)) {
        return `${label} · ${Math.round(lateMinutes)} min`;
      }
    }
    return label;
  }

  if (statusModifier === "early_exit") {
    const earlyExitMinutes = day.early_exit_minutes;
    if (
      earlyExitMinutes != null &&
      Number.isFinite(earlyExitMinutes) &&
      earlyExitMinutes > 0
    ) {
      const rawStatus = day.status?.trim() ?? "";
      if (!/\d/.test(rawStatus)) {
        return `${label} · ${Math.round(earlyExitMinutes)} min`;
      }
    }
    return label;
  }

  if (statusModifier === "adjusted") {
    return label;
  }

  return label;
}

export function formatEmployeeReportDayTime(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "—";
  }
  const formatted = formatDateTimeToLocal(trimmed, EMPLOYEE_REPORT_TIME_FORMAT);
  return formatted === "Invalid Date" ? trimmed : formatted;
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
): "present" | "late" | "early_exit" | "adjusted" | "absent" | "other" {
  const raw = status?.trim().toLowerCase() ?? "";
  if (raw.includes("on_time_with_adjustment") || raw.includes("on time with adjustment")) {
    return "adjusted";
  }
  if (raw.includes("early_exit") || raw.includes("early exit")) {
    return "early_exit";
  }
  if (raw.includes("late")) {
    return "late";
  }
  if (raw.includes("absent")) {
    return "absent";
  }
  if (raw.includes("present")) {
    return "present";
  }
  if (raw.includes("on_time") || raw === "checked_in") {
    return "present";
  }
  return "other";
}
