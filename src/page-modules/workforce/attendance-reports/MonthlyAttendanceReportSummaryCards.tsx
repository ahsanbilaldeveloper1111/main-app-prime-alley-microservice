import { buildMonthlyReportSummaryCards } from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import type { MonthlyAttendanceReportSummary } from "@utils/staffManagement";
import React from "react";

export type MonthlyAttendanceReportSummaryCardsProps = Readonly<{
  summary: MonthlyAttendanceReportSummary;
  reportMonth: string;
  apiMonth?: string | null;
}>;

export function MonthlyAttendanceReportSummaryCards({
  summary,
  reportMonth,
  apiMonth,
}: MonthlyAttendanceReportSummaryCardsProps) {
  const cards = buildMonthlyReportSummaryCards(summary);
  const resolvedMonth = apiMonth?.trim() || reportMonth;

  return (
    <section className="attendance-report-panel__summary" aria-label="Monthly report summary">
      <h4 className="attendance-report-panel__summary-title">Summary for {resolvedMonth}</h4>
      <div className="attendance-report-panel__summary-grid">
        {cards.map((card) => (
          <article key={card.key} className="attendance-report-panel__summary-card">
            <span className="attendance-report-panel__summary-label">{card.label}</span>
            <strong className="attendance-report-panel__summary-value">{card.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
