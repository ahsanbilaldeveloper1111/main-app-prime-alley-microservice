import type { TableColumn } from "@components/GenericTable";
import {
  formatMonthlyAttendanceRate,
  formatMonthlyReportCount,
  formatMonthlyTrendLabel,
} from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import type { MonthlyAttendanceReportTrendPoint } from "@utils/staffManagement";

export function buildMonthlyAttendanceTrendTableColumns(): TableColumn<MonthlyAttendanceReportTrendPoint>[] {
  return [
    {
      key: "date",
      label: "Period",
      sortable: true,
      render: (row) => formatMonthlyTrendLabel(row),
    },
    {
      key: "attendance_rate",
      label: "Attendance rate",
      sortable: true,
      render: (row) => formatMonthlyAttendanceRate(row.attendance_rate),
    },
    {
      key: "present_count",
      label: "Present",
      sortable: true,
      render: (row) => formatMonthlyReportCount(row.present_count),
    },
    {
      key: "absent_count",
      label: "Absent",
      sortable: true,
      render: (row) => formatMonthlyReportCount(row.absent_count),
    },
    {
      key: "late_arrivals",
      label: "Late arrivals",
      sortable: true,
      render: (row) => formatMonthlyReportCount(row.late_arrivals),
    },
  ];
}
