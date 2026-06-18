import {
  formatMonthlyTrendLabel,
  resolveMonthlyReportUserLabel,
} from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import type {
  MonthlyAttendanceReportRow,
  MonthlyAttendanceReportTrendPoint,
} from "@utils/staffManagement";
import type { ApexOptions } from "apexcharts";

const MAX_EMPLOYEE_BAR_ROWS = 12;

function readAttendanceRatePercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

function readCount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value;
}

export function buildMonthlyTrendLineChart(trend: readonly MonthlyAttendanceReportTrendPoint[]): {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
} {
  const categories = trend.map((point) => formatMonthlyTrendLabel(point));
  const attendanceRateSeries = trend.map((point) =>
    Number(readAttendanceRatePercent(point.attendance_rate).toFixed(1)),
  );
  const presentSeries = trend.map((point) => readCount(point.present_count));

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: true },
      zoom: { enabled: false },
      redrawOnParentResize: true,
    },
    stroke: { width: [3, 3], curve: "smooth" },
    colors: ["#2563eb", "#059669"],
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories,
      labels: {
        rotate: categories.length > 14 ? -45 : 0,
        style: { fontSize: "11px" },
      },
    },
    yaxis: [
      {
        title: { text: "Attendance rate (%)" },
        min: 0,
        max: 100,
        labels: {
          formatter: (value: string | number) => `${Number(value).toFixed(0)}%`,
        },
      },
      {
        opposite: true,
        title: { text: "Present" },
        labels: {
          formatter: (value: string | number) => `${Math.round(Number(value))}`,
        },
      },
    ],
    legend: { position: "top" },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (value: number) => `${Number(value).toFixed(1)}%`,
        },
        {
          formatter: (value: number) => `${Math.round(Number(value))} present`,
        },
      ],
    },
  };

  return {
    options,
    series: [
      { name: "Attendance rate", data: attendanceRateSeries },
      { name: "Present", data: presentSeries },
    ],
  };
}

export function buildMonthlyAttendanceMixDonut(rows: readonly MonthlyAttendanceReportRow[]): {
  series: number[];
  labels: string[];
  colors: string[];
} {
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;

  for (const row of rows) {
    presentDays += readCount(row.present_days);
    absentDays += readCount(row.absent_days);
    leaveDays += readCount(row.leave_days);
  }

  return {
    series: [presentDays, absentDays, leaveDays],
    labels: ["Present days", "Absent days", "Leave days"],
    colors: ["#059669", "#dc2626", "#7c3aed"],
  };
}

export function buildMonthlyEmployeeDaysBarChart(
  rows: readonly MonthlyAttendanceReportRow[],
  userLabelById: ReadonlyMap<string, string>,
): {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
} {
  const ranked = [...rows]
    .map((row) => ({
      label: resolveMonthlyReportUserLabel(row, userLabelById),
      present: readCount(row.present_days),
      absent: readCount(row.absent_days),
      leave: readCount(row.leave_days),
      total: readCount(row.present_days) + readCount(row.absent_days) + readCount(row.leave_days),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, MAX_EMPLOYEE_BAR_ROWS);

  const categories = ranked.map((item) => item.label);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
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
    colors: ["#059669", "#dc2626", "#7c3aed"],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px" },
        maxWidth: 140,
      },
    },
    legend: { position: "top" },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${Math.round(Number(value))} days`,
      },
    },
  };

  return {
    options,
    series: [
      { name: "Present", data: ranked.map((item) => item.present) },
      { name: "Absent", data: ranked.map((item) => item.absent) },
      { name: "Leave", data: ranked.map((item) => item.leave) },
    ],
  };
}

export function buildMonthlyAttendanceRateBarChart(
  rows: readonly MonthlyAttendanceReportRow[],
  userLabelById: ReadonlyMap<string, string>,
): {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
} {
  const ranked = [...rows]
    .map((row) => ({
      label: resolveMonthlyReportUserLabel(row, userLabelById),
      rate: readAttendanceRatePercent(row.attendance_rate),
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, MAX_EMPLOYEE_BAR_ROWS);

  const categories = ranked.map((item) => item.label);
  const data = ranked.map((item) => Number(item.rate.toFixed(1)));

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
      min: 0,
      max: 100,
      labels: {
        style: { fontSize: "11px" },
        formatter: (value: string) => `${Number(value).toFixed(0)}%`,
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
        formatter: (value: number) => `${value.toFixed(1)}%`,
      },
    },
  };

  return {
    options,
    series: [{ name: "Attendance rate", data }],
  };
}
