import React from "react";
import type { EmployeesDashboardOverviewCounters } from "../employeesDomain";

export interface EmployeesDashboardOverviewPanelProps {
  counters: EmployeesDashboardOverviewCounters | null | undefined;
  loading: boolean;
}

const EmployeesDashboardOverviewPanel: React.FC<EmployeesDashboardOverviewPanelProps> = ({
  counters,
  loading,
}) => (
  <div className="employees-page__chart-card">
    <h2 className="employees-page__overview-title">Dashboard overview</h2>

    {loading || counters == null ? (
      <div className="employees-page__overview-loading">Loading…</div>
    ) : (
      <div className="employees-page__overview-stack">
        {counters.employees && (
          <div className="employees-page__overview-block employees-page__overview-block--muted">
            <div className="employees-page__overview-block-title">Employees</div>
            <div className="employees-page__overview-inline-metrics">
              <span className="employees-page__overview-metric">
                Total: <strong className="employees-page__overview-strong">{counters.employees.total ?? 0}</strong>
              </span>
              <span className="employees-page__overview-metric">
                Active:{" "}
                <strong className="employees-page__overview-strong employees-page__overview-strong--green">
                  {counters.employees.active ?? 0}
                </strong>
              </span>
              <span className="employees-page__overview-metric">
                Inactive:{" "}
                <strong className="employees-page__overview-strong employees-page__overview-strong--red">
                  {counters.employees.inactive ?? 0}
                </strong>
              </span>
            </div>
          </div>
        )}

        {counters.approvals && (
          <div className="employees-page__overview-block employees-page__overview-block--amber">
            <div className="employees-page__overview-block-title">Approvals</div>
            <div className="employees-page__overview-col-metrics">
              <span className="employees-page__overview-metric">
                Pending:{" "}
                <strong className="employees-page__overview-strong">{counters.approvals.pending ?? 0}</strong>
              </span>
              {counters.approvals.aging && (
                <span className="employees-page__overview-metric">
                  Aging: 0–3d: {counters.approvals.aging["0_3_days"] ?? 0}, 4–7d:{" "}
                  {counters.approvals.aging["4_7_days"] ?? 0}, 8+d:{" "}
                  {counters.approvals.aging["8_plus_days"] ?? 0}
                </span>
              )}
              {typeof counters.approvals.avg_aging === "number" && (
                <span className="employees-page__overview-metric">
                  Avg aging: <strong>{counters.approvals.avg_aging.toFixed(1)}</strong> days
                </span>
              )}
              <span className="employees-page__overview-metric">
                Pending leave: {counters.approvals.pending_leave ?? 0}, Pending other:{" "}
                {counters.approvals.pending_other ?? 0}
              </span>
            </div>
          </div>
        )}

        {counters.leave && (
          <div className="employees-page__overview-block employees-page__overview-block--green">
            <div className="employees-page__overview-block-title">Leave</div>
            <div className="employees-page__overview-inline-metrics">
              <span className="employees-page__overview-metric">
                On leave today:{" "}
                <strong className="employees-page__overview-strong">{counters.leave.on_leave_today ?? 0}</strong>
              </span>
              <span className="employees-page__overview-metric">
                Upcoming 7 days:{" "}
                <strong className="employees-page__overview-strong">{counters.leave.upcoming_7_days ?? 0}</strong>
              </span>
            </div>
          </div>
        )}

        {counters.journey && (
          <div className="employees-page__overview-block employees-page__overview-block--blue">
            <div className="employees-page__overview-block-title">Journey</div>
            <div className="employees-page__overview-wrap-metrics">
              <span>
                Total: <strong className="employees-page__overview-strong">{counters.journey.total ?? 0}</strong>
              </span>
              <span>
                In progress:{" "}
                <strong className="employees-page__overview-strong employees-page__overview-strong--blue">
                  {counters.journey.in_progress ?? 0}
                </strong>
              </span>
              <span>On track: {counters.journey.on_track ?? 0}</span>
              <span>
                Overdue:{" "}
                <strong className="employees-page__overview-strong employees-page__overview-strong--red">
                  {counters.journey.overdue ?? 0}
                </strong>
              </span>
              <span>Completed: {counters.journey.completed ?? 0}</span>
            </div>
          </div>
        )}

        {counters.attendance?.today && (
          <div className="employees-page__overview-block employees-page__overview-block--purple">
            <div className="employees-page__overview-block-title">Attendance (today)</div>
            <div className="employees-page__overview-wrap-metrics">
              <span>With record: {counters.attendance.today.with_record ?? 0}</span>
              <span>Checked in: {counters.attendance.today.checked_in ?? 0}</span>
              <span>Checked out: {counters.attendance.today.checked_out ?? 0}</span>
              <span>No record (est.): {counters.attendance.today.no_record_estimate ?? 0}</span>
            </div>
          </div>
        )}

        {counters.compliance_alerts && (
          <div className="employees-page__overview-block employees-page__overview-block--rose">
            <div className="employees-page__overview-block-title">Compliance alerts</div>
            {(counters.compliance_alerts.total ?? 0) > 0 ? (
              <div className="employees-page__overview-wrap-metrics">
                <span>
                  High:{" "}
                  <strong className="employees-page__overview-strong employees-page__overview-strong--red">
                    {counters.compliance_alerts.high ?? 0}
                  </strong>
                </span>
                <span>
                  Medium:{" "}
                  <strong className="employees-page__overview-strong employees-page__overview-strong--amber">
                    {counters.compliance_alerts.medium ?? 0}
                  </strong>
                </span>
                <span>
                  Low:{" "}
                  <strong className="employees-page__overview-strong employees-page__overview-strong--green">
                    {counters.compliance_alerts.low ?? 0}
                  </strong>
                </span>
                <span>
                  Total:{" "}
                  <strong className="employees-page__overview-strong">{counters.compliance_alerts.total ?? 0}</strong>
                </span>
              </div>
            ) : (
              <div className="employees-page__overview-metric">No compliance alerts at this time.</div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

export default EmployeesDashboardOverviewPanel;
