import {
  buildEmployeeReportSummaryCards,
  formatEmployeeReportDayHours,
  formatEmployeeReportDayLabel,
  formatEmployeeReportDayStatus,
  formatEmployeeReportDayTime,
  readEmployeeReportDayRowKey,
  resolveEmployeeReportStatusModifier,
} from "@page-modules/workforce/check-in-out/employeeAttendanceReportDomain";
import { useEmployeeAttendanceReportQuery } from "@page-modules/workforce/check-in-out/useEmployeeAttendanceReportQuery";
import { defaultMonthlyReportMonth } from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import React, { useMemo, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { CalendarRange, RefreshCw } from "lucide-react";

export type EmployeeAttendanceReportPanelProps = Readonly<{
  tenantId: string | null;
  userId: string | null;
}>;

export function EmployeeAttendanceReportPanel({
  tenantId,
  userId,
}: EmployeeAttendanceReportPanelProps) {
  const [reportMonth, setReportMonth] = useState(defaultMonthlyReportMonth);

  const reportQuery = useEmployeeAttendanceReportQuery({
    tenantId,
    userId,
    month: reportMonth,
    enabled: Boolean(tenantId && userId),
  });

  const summaryCards = useMemo(
    () => buildEmployeeReportSummaryCards(reportQuery.data?.summary ?? {}),
    [reportQuery.data?.summary],
  );

  const days = reportQuery.data?.days ?? [];
  const resolvedMonth = reportQuery.data?.month?.trim() || reportMonth;

  if (!userId) {
    return (
      <div className="check-in-out-page__card check-in-out-page__report-card">
        <div className="check-in-out-page__header">
          <h2 className="check-in-out-page__title">My attendance report</h2>
          <p className="check-in-out-page__subtitle">
            Your extension is not available. Contact your administrator to view monthly attendance.
          </p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="check-in-out-page__card check-in-out-page__report-card">
        <div className="check-in-out-page__header">
          <h2 className="check-in-out-page__title">My attendance report</h2>
          <p className="check-in-out-page__subtitle">
            Company context is not available. Sign in again to load your attendance report.
          </p>
        </div>
      </div>
    );
  }

  if (reportQuery.isError) {
    return (
      <div className="check-in-out-page__card check-in-out-page__report-card">
        <div className="check-in-out-page__header check-in-out-page__report-header">
          <div>
            <h2 className="check-in-out-page__title">My attendance report</h2>
            <p className="check-in-out-page__subtitle">
              Monthly summary and daily log for extension {userId}.
            </p>
          </div>
          <div className="check-in-out-page__report-controls">
            <Form.Group
              controlId="check-in-out-report-month"
              className="check-in-out-page__month-field"
            >
              <Form.Label className="check-in-out-page__month-label">
                <CalendarRange size={14} aria-hidden />
                Report month
              </Form.Label>
              <Form.Control
                type="month"
                value={reportMonth}
                className="check-in-out-page__month-input"
                onChange={(event) => setReportMonth(event.target.value)}
              />
            </Form.Group>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              className="check-in-out-page__report-refresh"
              disabled={reportQuery.isFetching}
              onClick={() => reportQuery.refetch()}
            >
              <RefreshCw size={14} aria-hidden />
              Refresh
            </Button>
          </div>
        </div>

        <div className="check-in-out-page__report-status check-in-out-page__report-status--error">
          <p>Failed to load your attendance report.</p>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => reportQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="check-in-out-page__card check-in-out-page__report-card">
      <div className="check-in-out-page__header check-in-out-page__report-header">
        <div>
          <h2 className="check-in-out-page__title">My attendance report</h2>
          <p className="check-in-out-page__subtitle">
            Monthly summary and daily log for extension {userId}.
          </p>
        </div>
        <div className="check-in-out-page__report-controls">
          <Form.Group controlId="check-in-out-report-month" className="check-in-out-page__month-field">
            <Form.Label className="check-in-out-page__month-label">
              <CalendarRange size={14} aria-hidden />
              Report month
            </Form.Label>
            <Form.Control
              type="month"
              value={reportMonth}
              className="check-in-out-page__month-input"
              onChange={(event) => setReportMonth(event.target.value)}
            />
          </Form.Group>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="check-in-out-page__report-refresh"
            disabled={reportQuery.isFetching}
            onClick={() => reportQuery.refetch()}
          >
            <RefreshCw size={14} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>
      <div className="check-in-out-page__report-columns">
        <section
          className="check-in-out-page__report-summary-col"
          aria-label={`Summary for ${resolvedMonth}`}
        >
          <h3 className="check-in-out-page__report-summary-title">
            Summary — {resolvedMonth}
          </h3>
          <div className="check-in-out-page__report-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.key} className="check-in-out-page__report-summary-card">
                <span className="check-in-out-page__report-summary-label">{card.label}</span>
                <strong className="check-in-out-page__report-summary-value">
                  {reportQuery.isFetching && !reportQuery.data ? "…" : card.value}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className="check-in-out-page__report-days-col">
          <h3 className="check-in-out-page__section-label">Daily log</h3>
          {reportQuery.isFetching && days.length === 0 ? (
            <p className="check-in-out-page__report-empty">Loading attendance days…</p>
          ) : null}
          {!reportQuery.isFetching && days.length === 0 ? (
            <p className="check-in-out-page__report-empty">
              No attendance days found for this month.
            </p>
          ) : null}
          {days.length > 0 ? (
            <div className="check-in-out-page__report-table-wrap">
              <Table responsive hover size="sm" className="check-in-out-page__report-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check in</th>
                    <th>Check out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, index) => {
                    const statusModifier = resolveEmployeeReportStatusModifier(day.status);
                    return (
                      <tr key={readEmployeeReportDayRowKey(day, index)}>
                        <td data-label="Date">{formatEmployeeReportDayLabel(day)}</td>
                        <td data-label="Check in">{formatEmployeeReportDayTime(day.check_in_at)}</td>
                        <td data-label="Check out">
                          {formatEmployeeReportDayTime(day.check_out_at)}
                          {day.is_auto_checkout ? (
                            <span className="check-in-out-page__auto-checkout-badge">Auto</span>
                          ) : null}
                        </td>
                        <td data-label="Hours">{formatEmployeeReportDayHours(day)}</td>
                        <td data-label="Status">
                          <span
                            className={`check-in-out-page__day-status check-in-out-page__day-status--${statusModifier}`}
                          >
                            {formatEmployeeReportDayStatus(day)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
