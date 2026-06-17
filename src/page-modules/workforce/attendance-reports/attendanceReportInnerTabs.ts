export const ATTENDANCE_REPORT_INNER_TABS = [
  { id: "daily-report", label: "Daily Report" },
  { id: "monthly-report", label: "Monthly Report" },
  { id: "team-snapshot", label: "Team Snapshot" },
] as const;

export type AttendanceReportInnerTabId =
  (typeof ATTENDANCE_REPORT_INNER_TABS)[number]["id"];

export function isAttendanceReportInnerTabId(
  value: string,
): value is AttendanceReportInnerTabId {
  return ATTENDANCE_REPORT_INNER_TABS.some((tab) => tab.id === value);
}
