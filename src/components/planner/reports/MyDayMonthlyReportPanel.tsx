import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Alert, Form, Spinner } from "react-bootstrap";
import {
  buildMyDayMonthlyReport,
  formatAverageCompletionRateLabel,
  formatAveragePlannedPerDayLabel,
  type MyDayMonthlyReport,
} from "@page-modules/planner/my-day/myDayMonthlyReportDomain";
import { listMyDayDailyLogs } from "@utils/tasks";

function MyDayMonthlyReportGrid({ report }: Readonly<{ report: MyDayMonthlyReport }>) {
  return (
    <div className="myday-monthly-report__grid">
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Working days</span>
        <strong>{report.workingDays}</strong>
        <span className="myday-monthly-report__hint">Days My Day was used</span>
      </div>
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Balanced days</span>
        <strong>{report.balancedDays}</strong>
        <span className="myday-monthly-report__hint">Planned within capacity</span>
      </div>
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Overloaded days</span>
        <strong>{report.overloadedDays}</strong>
        <span className="myday-monthly-report__hint">Planned above capacity</span>
      </div>
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Light days</span>
        <strong>{report.lightDays}</strong>
        <span className="myday-monthly-report__hint">Completed &lt; 50% of capacity</span>
      </div>
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Average planned / day</span>
        <strong>{formatAveragePlannedPerDayLabel(report.averagePlannedMinutesPerDay)}</strong>
      </div>
      <div className="myday-monthly-report__item">
        <span className="myday-monthly-report__label">Average completion rate</span>
        <strong>{formatAverageCompletionRateLabel(report.averageCompletionRatePercent)}</strong>
      </div>
    </div>
  );
}

export function MyDayMonthlyReportPanel() {
  const [monthIso, setMonthIso] = useState(() => moment().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof listMyDayDailyLogs>>>([]);

  const monthBounds = useMemo(() => {
    const start = moment(monthIso, "YYYY-MM", true).startOf("month");
    const end = start.clone().endOf("month");
    return {
      from: start.format("YYYY-MM-DD"),
      to: end.format("YYYY-MM-DD"),
    };
  }, [monthIso]);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const fetched = await listMyDayDailyLogs({
        from: monthBounds.from,
        to: monthBounds.to,
        limit: 62,
      });
      setLogs(fetched);
    } catch {
      setLogs([]);
      setLoadError("Unable to load My Day history for this month.");
    } finally {
      setLoading(false);
    }
  }, [monthBounds.from, monthBounds.to]);

  useEffect(() => {
    loadMonth().catch(() => undefined);
  }, [loadMonth]);

  const report = useMemo(
    () => buildMyDayMonthlyReport(logs, monthIso),
    [logs, monthIso],
  );

  return (
    <div className="reports-panel myday-monthly-report">
      <div className="myday-monthly-report__header">
        <div>
          <h2 className="reports-panel__title">My Day monthly report</h2>
          <p className="reports-panel__subtitle mb-0">
            Performance across {report.monthLabel} from end-of-day My Day logs.
          </p>
        </div>
        <Form.Group className="myday-monthly-report__month-picker mb-0">
          <Form.Label className="small fw-semibold mb-1">Month</Form.Label>
          <Form.Control
            type="month"
            value={monthIso}
            max={moment().format("YYYY-MM")}
            onChange={(e) => setMonthIso(e.target.value)}
            disabled={loading}
          />
        </Form.Group>
      </div>

      {loadError ? <Alert variant="warning">{loadError}</Alert> : null}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" role="status" />
        </div>
      ) : (
        <MyDayMonthlyReportGrid report={report} />
      )}

      {!loading && !loadError && report.workingDays === 0 ? (
        <p className="text-muted small mb-0 mt-3">
          No My Day activity recorded for this month yet. Use My Day during the month to build
          your monthly report.
        </p>
      ) : null}
    </div>
  );
}
