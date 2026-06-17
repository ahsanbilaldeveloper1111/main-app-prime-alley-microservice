import type { TableColumn } from "@components/GenericTable";
import {
  formatDailyReportDateTime,
  formatDailyReportLabel,
  formatDailyReportStatus,
  formatDailyReportWorkedDuration,
  resolveDailyReportUserLabel,
} from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import type { DailyAttendanceReportRow } from "@utils/staffManagement";

export type DailyAttendanceReportTableContext = Readonly<{
  userLabelById: ReadonlyMap<string, string>;
}>;

export function buildDailyAttendanceReportTableColumns(
  context: DailyAttendanceReportTableContext,
): TableColumn<DailyAttendanceReportRow>[] {
  return [
    {
      key: "user_id",
      label: "User",
      sortable: true,
      render: (row) => resolveDailyReportUserLabel(row, context.userLabelById),
    },
    {
      key: "department_name",
      label: "Department",
      sortable: true,
      render: (row) => formatDailyReportLabel(row.department_name),
    },
    {
      key: "shift_name",
      label: "Shift",
      sortable: true,
      render: (row) => formatDailyReportLabel(row.shift_name),
    },
    {
      key: "check_in_at",
      label: "Check in",
      sortable: true,
      render: (row) => formatDailyReportDateTime(row.check_in_at),
    },
    {
      key: "check_out_at",
      label: "Check out",
      sortable: true,
      render: (row) => formatDailyReportDateTime(row.check_out_at),
    },
    {
      key: "worked_minutes",
      label: "Worked",
      sortable: true,
      render: (row) => formatDailyReportWorkedDuration(row),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => formatDailyReportStatus(row.status),
    },
  ];
}
