import ChartDonut from "@components/ChartDonut";
import { resolveDonutChartHeight } from "@page-modules/chat/shared/chatbotsDashboardChart";
import { useMediaQuery } from "@page-modules/chat/shared/useMediaQuery";
import {
  AttendanceAnalyticsChartCard,
  AttendanceAnalyticsChartEmpty,
  AttendanceAnalyticsStatCard,
} from "@page-modules/workforce/attendance-reports/attendanceAnalyticsUi";
import { buildTeamSnapshotStatusDonutChart } from "@page-modules/workforce/attendance-reports/teamAttendanceSnapshotCharts";
import {
  formatTeamSnapshotStatus,
  formatTeamSnapshotWorkedMinutes,
  readTeamSnapshotEmployeeRowKey,
  readTeamSnapshotSummaryCount,
  resolveTeamSnapshotDepartmentLabel,
  resolveTeamSnapshotEmployeeName,
  resolveTeamSnapshotStatusModifier,
} from "@page-modules/workforce/attendance-reports/teamAttendanceSnapshotDomain";
import type {
  TeamAttendanceSnapshotEmployee,
  TeamAttendanceSnapshotSummary,
} from "@utils/staffManagement";
import {
  AlertTriangle,
  ClipboardEdit,
  Coffee,
  Palmtree,
  Timer,
  UserCheck,
  UserMinus,
  Users,
  UserX,
} from "lucide-react";
import React, { useMemo } from "react";
import { Button, Table } from "react-bootstrap";

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export type TeamAttendanceSnapshotChartsViewProps = Readonly<{
  summary: TeamAttendanceSnapshotSummary;
  employees: readonly TeamAttendanceSnapshotEmployee[];
  userNameByExtension: ReadonlyMap<string, string>;
  departmentNameById: ReadonlyMap<number, string>;
  reportDate: string;
  loading: boolean;
  onCorrectEmployee?: (employee: TeamAttendanceSnapshotEmployee) => void;
}>;

export function TeamAttendanceSnapshotChartsView({
  summary,
  employees,
  userNameByExtension,
  departmentNameById,
  reportDate,
  loading,
  onCorrectEmployee,
}: TeamAttendanceSnapshotChartsViewProps) {
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const isTablet = useMediaQuery("(max-width: 991.98px)");
  const donutChartHeight = resolveDonutChartHeight(isMobile, isTablet, 320);

  const statusDonut = useMemo(() => buildTeamSnapshotStatusDonutChart(summary), [summary]);
  const statusHasData = statusDonut.series.some((value) => value > 0);
  const totalEmployees =
    readTeamSnapshotSummaryCount(summary, "total") > 0
      ? readTeamSnapshotSummaryCount(summary, "total")
      : employees.length;

  if (loading && employees.length === 0) {
    return (
      <div className="attendance-analytics-dashboard">
        <AttendanceAnalyticsChartEmpty message="Loading team attendance snapshot…" />
      </div>
    );
  }

  if (!loading && employees.length === 0 && totalEmployees === 0) {
    return (
      <div className="attendance-analytics-dashboard">
        <AttendanceAnalyticsChartEmpty message="No team attendance records found for the selected filters." />
      </div>
    );
  }

  return (
    <div className="attendance-analytics-dashboard">
      <div className="attendance-analytics-stats-grid attendance-analytics-stats-grid--snapshot">
        <AttendanceAnalyticsStatCard
          title="Total"
          value={intFmt.format(totalEmployees)}
          icon={<Users size={20} />}
          accent="#2563eb"
        />
        <AttendanceAnalyticsStatCard
          title="Present"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "present"))}
          icon={<UserCheck size={20} />}
          accent="#059669"
        />
        <AttendanceAnalyticsStatCard
          title="Absent"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "absent"))}
          icon={<UserX size={20} />}
          accent="#dc2626"
        />
        <AttendanceAnalyticsStatCard
          title="Late"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "late"))}
          icon={<AlertTriangle size={20} />}
          accent="#ea580c"
        />
        <AttendanceAnalyticsStatCard
          title="On break"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "on_break"))}
          icon={<Coffee size={20} />}
          accent="#7c3aed"
        />
        <AttendanceAnalyticsStatCard
          title="Overtime"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "on_overtime"))}
          icon={<Timer size={20} />}
          accent="#b45309"
        />
        <AttendanceAnalyticsStatCard
          title="On leave"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "on_leave"))}
          icon={<Palmtree size={20} />}
          accent="#0891b2"
        />
        <AttendanceAnalyticsStatCard
          title="No show"
          value={intFmt.format(readTeamSnapshotSummaryCount(summary, "no_show"))}
          icon={<UserMinus size={20} />}
          accent="#6b7280"
        />
      </div>

      <div className="attendance-analytics-charts-grid attendance-analytics-charts-grid--snapshot-chart">
        <AttendanceAnalyticsChartCard
          title="Team status breakdown"
          subtitle={`Attendance status for ${reportDate}.`}
        >
          {statusHasData ? (
            <ChartDonut
              series={statusDonut.series}
              labels={statusDonut.labels}
              colors={statusDonut.colors}
              height={donutChartHeight}
              dataType="custom"
              customTooltipFormatter={(value) => `${Math.round(value)} employees`}
              legendPosition="bottom"
              showDataLabels
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No status data to chart." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>

      <div className="attendance-analytics-charts-grid attendance-analytics-charts-grid--roster">
        <AttendanceAnalyticsChartCard
          title="Team roster"
          subtitle="Live attendance status for each team member."
          fillHeight={false}
          className="team-attendance-snapshot-roster-card"
        >
          {employees.length > 0 ? (
            <div className="team-attendance-snapshot-table-wrap">
              <Table hover size="sm" className="team-attendance-snapshot-table mb-0">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Extension</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Hours</th>
                    <th>Details</th>
                    {onCorrectEmployee ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => {
                    const statusModifier = resolveTeamSnapshotStatusModifier(employee.status);
                    return (
                      <tr key={readTeamSnapshotEmployeeRowKey(employee, index)}>
                        <td data-label="Employee">
                          {resolveTeamSnapshotEmployeeName(employee, userNameByExtension)}
                        </td>
                        <td data-label="Extension">{employee.user_id?.trim() || "—"}</td>
                        <td data-label="Designation">{employee.designation?.trim() || "—"}</td>
                        <td data-label="Department">
                          {resolveTeamSnapshotDepartmentLabel(
                            employee.department_id,
                            departmentNameById,
                          )}
                        </td>
                        <td data-label="Status">
                          <span
                            className={`team-attendance-snapshot-status team-attendance-snapshot-status--${statusModifier}`}
                          >
                            {formatTeamSnapshotStatus(employee.status)}
                          </span>
                        </td>
                        <td data-label="Hours">
                          {formatTeamSnapshotWorkedMinutes(employee.hours_worked_minutes)}
                        </td>
                        <td data-label="Details" title={employee.banner?.trim() || undefined}>
                          {employee.banner?.trim() || "—"}
                        </td>
                        {onCorrectEmployee ? (
                          <td data-label="Actions">
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              className="team-attendance-snapshot-table__action-btn"
                              disabled={!employee.user_id?.trim()}
                              onClick={() => onCorrectEmployee(employee)}
                            >
                              <ClipboardEdit size={14} aria-hidden />
                              <span className="d-none d-xl-inline">Correct</span>
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <AttendanceAnalyticsChartEmpty message="No employees match the selected filters." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>
    </div>
  );
}
