import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { Alert, Form, Spinner } from "react-bootstrap";
import {
  formatAverageCompletionRateLabel,
  formatAveragePlannedPerDayLabel,
  mapMyDayMonthlyReportFromApi,
  resolveMyDayMonthlyReportMonthBounds,
  type MyDayMonthlyReport,
} from "@page-modules/planner/my-day/myDayMonthlyReportDomain";
import { getMyDayMonthlyReport } from "@utils/tasks";

const EMPTY_MONTHLY_REPORT: MyDayMonthlyReport = {
  monthLabel: "",
  workingDays: 0,
  balancedDays: 0,
  overloadedDays: 0,
  lightDays: 0,
  averagePlannedMinutesPerDay: 0,
  averageCompletionRatePercent: 0,
  daysInMonth: 0,
};

function emptyMonthlyReportForMonth(monthIso: string): MyDayMonthlyReport {
  const { monthLabel, monthEnd } = resolveMyDayMonthlyReportMonthBounds(monthIso);
  return {
    ...EMPTY_MONTHLY_REPORT,
    monthLabel,
    daysInMonth: monthEnd.date(),
  };
}

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

export type MyDayMonthlyReportSectionProps = Readonly<{
  /** When false, skip fetching until the parent view is visible. */
  active?: boolean;
}>;

/** Monthly My Day performance — same layout as former Reports → My Day Monthly tab. */
export function MyDayMonthlyReportSection({ active = true }: MyDayMonthlyReportSectionProps) {
  const [monthIso, setMonthIso] = useState(() => moment().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [report, setReport] = useState<MyDayMonthlyReport>(() =>
    emptyMonthlyReportForMonth(moment().format("YYYY-MM")),
  );

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await getMyDayMonthlyReport({ month: monthIso });
      setReport(mapMyDayMonthlyReportFromApi(payload, monthIso));
    } catch {
      setReport(emptyMonthlyReportForMonth(monthIso));
      setLoadError("Unable to load My Day history for this month.");
    } finally {
      setLoading(false);
    }
  }, [monthIso]);

  useEffect(() => {
    if (!active) return;
    loadMonth().catch(() => undefined);
  }, [active, loadMonth]);

  const showEmptyMonth =
    !loading && !loadError && report.workingDays === 0;

  return (
    <div className="reports-panel myday-monthly-report">
      <div className="myday-monthly-report__header">
        <div>
          <h2 className="reports-panel__title">My Day monthly report</h2>
          <p className="reports-panel__subtitle mb-0">
            An overview of your My Day tasks and performance for the month.
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

      {showEmptyMonth ? (
        <Alert variant="warning" className="mb-3">
          No data found for My Day history for this month.
        </Alert>
      ) : null}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" role="status" />
        </div>
      ) : (
        <MyDayMonthlyReportGrid report={report} />
      )}
    </div>
  );
}
