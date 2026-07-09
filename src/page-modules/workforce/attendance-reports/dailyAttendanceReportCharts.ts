import {
  formatDailyReportStatus,
  resolveDailyReportUserLabel,
} from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import type { DailyAttendanceReportRow } from "@utils/staffManagement";
import type { ApexOptions } from "apexcharts";

const STATUS_COLORS: Record<string, string> = {
  present: "#059669",
  late: "#ea580c",
  absent: "#dc2626",
  leave: "#7c3aed",
  unknown: "#6b7280",
};

const DEPARTMENT_COLORS = ["#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#dc2626"];

export type DailyAttendanceSummaryStats = Readonly<{
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalWorkedHours: number;
  averageWorkedHours: number;
}>;

export function readDailyRowWorkedHours(row: DailyAttendanceReportRow): number {
  if (row.worked_hours != null && Number.isFinite(row.worked_hours)) {
    return row.worked_hours;
  }
  if (row.worked_minutes != null && Number.isFinite(row.worked_minutes)) {
    return row.worked_minutes / 60;
  }
  return 0;
}

function normalizeAttendanceStatusKey(status: string | null | undefined): string {
  const raw = status?.trim().toLowerCase() ?? "";
  if (!raw) return "unknown";
  if (raw.includes("present") || raw === "on_time" || raw === "checked_in") return "present";
  if (raw.includes("on_time_with_adjustment") || raw.includes("on time with adjustment")) {
    return "present";
  }
  if (raw.includes("late")) return "late";
  if (raw.includes("absent")) return "absent";
  if (raw.includes("leave")) return "leave";
  return "unknown";
}

function formatStatusLabel(statusKey: string): string {
  if (statusKey === "unknown") return "Other";
  return formatDailyReportStatus(statusKey);
}

export function buildDailyAttendanceSummaryStats(
  rows: readonly DailyAttendanceReportRow[],
): DailyAttendanceSummaryStats {
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let totalWorkedHours = 0;

  for (const row of rows) {
    const statusKey = normalizeAttendanceStatusKey(row.status);
    if (statusKey === "present") presentCount += 1;
    else if (statusKey === "late") lateCount += 1;
    else if (statusKey === "absent") absentCount += 1;
    totalWorkedHours += readDailyRowWorkedHours(row);
  }

  const totalEmployees = rows.length;
  const averageWorkedHours =
    totalEmployees > 0 ? totalWorkedHours / totalEmployees : 0;

  return {
    totalEmployees,
    presentCount,
    lateCount,
    absentCount,
    totalWorkedHours,
    averageWorkedHours,
  };
}

export function buildDailyStatusDonutChart(rows: readonly DailyAttendanceReportRow[]): {
  series: number[];
  labels: string[];
  colors: string[];
} {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = normalizeAttendanceStatusKey(row.status);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    series: entries.map(([, count]) => count),
    labels: entries.map(([key]) => formatStatusLabel(key)),
    colors: entries.map(([key]) => STATUS_COLORS[key] ?? STATUS_COLORS.unknown),
  };
}

export function buildDailyDepartmentDonutChart(rows: readonly DailyAttendanceReportRow[]): {
  series: number[];
  labels: string[];
  colors: string[];
} {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const department = row.department_name?.trim() || "Unassigned";
    counts.set(department, (counts.get(department) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    series: entries.map(([, count]) => count),
    labels: entries.map(([label]) => label),
    colors: entries.map((_, index) => DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]),
  };
}

const MAX_EMPLOYEE_BAR_ROWS = 15;

export function buildDailyWorkedHoursBarChart(
  rows: readonly DailyAttendanceReportRow[],
  userLabelById: ReadonlyMap<string, string>,
): {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
} {
  const ranked = [...rows]
    .map((row) => ({
      label: resolveDailyReportUserLabel(row, userLabelById),
      hours: readDailyRowWorkedHours(row),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, MAX_EMPLOYEE_BAR_ROWS);

  const categories = ranked.map((item) => item.label);
  const data = ranked.map((item) => Number(item.hours.toFixed(2)));

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: true },
      redrawOnParentResize: true,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "70%",
      },
    },
    colors: ["#2563eb"],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { fontSize: "11px" },
        formatter: (value: string) => `${Number(value).toFixed(1)}h`,
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px" },
        maxWidth: 140,
      },
    },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toFixed(2)} hrs`,
      },
    },
  };

  return {
    options,
    series: [{ name: "Worked hours", data }],
  };
}
