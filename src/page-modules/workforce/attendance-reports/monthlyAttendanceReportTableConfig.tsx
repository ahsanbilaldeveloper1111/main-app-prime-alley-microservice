import type { TableColumn } from "@components/GenericTable";
import { formatDailyReportLabel } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import {
  formatMonthlyAttendanceRate,
  formatMonthlyReportCount,
  formatMonthlyReportLateArrivals,
  formatMonthlyReportOvertime,
  resolveMonthlyReportUserLabel,
} from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import type { MonthlyAttendanceReportRow } from "@utils/staffManagement";

export type MonthlyAttendanceReportTableContext = Readonly<{
  userLabelById: ReadonlyMap<string, string>;
}>;

export function buildMonthlyAttendanceReportTableColumns(
  context: MonthlyAttendanceReportTableContext,
): TableColumn<MonthlyAttendanceReportRow>[] {
  return [
    {
      key: "user_id",
      label: "User",
      sortable: true,
      render: (row) => resolveMonthlyReportUserLabel(row, context.userLabelById),
    },
    {
      key: "department_name",
      label: "Department",
      sortable: true,
      render: (row) => formatDailyReportLabel(row.department_name),
    },
    {
      key: "attendance_rate",
      label: "Attendance rate",
      sortable: true,
      render: (row) => formatMonthlyAttendanceRate(row.attendance_rate),
    },
    {
      key: "present_days",
      label: "Present",
      sortable: true,
      render: (row) => formatMonthlyReportCount(row.present_days),
    },
    {
      key: "absent_days",
      label: "Absent",
      sortable: true,
      render: (row) => formatMonthlyReportCount(row.absent_days),
    },
    {
      key: "late_arrivals",
      label: "Late arrivals",
      sortable: true,
      render: (row) => formatMonthlyReportLateArrivals(row),
    },
    {
      key: "overtime_hours",
      label: "Overtime",
      sortable: true,
      render: (row) => formatMonthlyReportOvertime(row),
    },
  ];
}
