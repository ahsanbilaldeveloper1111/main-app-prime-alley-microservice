import React from "react";
import type { MyDayPastDayStats } from "@page-modules/planner/my-day/myDayHistoryDomain";
import { toMinutesDisplay } from "@page-modules/planner/my-day/myDayDomain";

type MyDayDailySummaryPanelProps = Readonly<{
  stats: MyDayPastDayStats;
  title?: string;
  showCapacityBar?: boolean;
}>;

export function MyDayDailySummaryPanel({
  stats,
  title = "Daily summary",
  showCapacityBar = true,
}: MyDayDailySummaryPanelProps) {
  const pctRounded = Math.round(stats.capacityUsedPercent);
  const barWidth = Math.min(100, Math.max(0, pctRounded));
  const completionRounded =
    stats.completionRatePercent % 1 === 0
      ? String(Math.round(stats.completionRatePercent))
      : String(stats.completionRatePercent);

  return (
    <section className="myday-daily-summary" aria-label={title}>
      <h3 className="myday-daily-summary__title">{title}</h3>
      <div className="myday-past-stats myday-daily-summary__card">
        <div className="myday-past-stats__grid myday-daily-summary__grid">
          <div className="myday-past-stats__item">
            <span className="myday-past-stats__label">Tasks planned</span>
            <strong>{stats.tasksPlanned}</strong>
          </div>
          <div className="myday-past-stats__item">
            <span className="myday-past-stats__label">Tasks completed</span>
            <strong>{stats.tasksCompleted}</strong>
          </div>
          <div className="myday-past-stats__item">
            <span className="myday-past-stats__label">Planned hours</span>
            <strong>{toMinutesDisplay(stats.plannedMinutes)}</strong>
          </div>
          <div className="myday-past-stats__item">
            <span className="myday-past-stats__label">Completed hours</span>
            <strong>{toMinutesDisplay(stats.completedMinutes)}</strong>
          </div>
          <div className="myday-past-stats__item myday-daily-summary__completion">
            <span className="myday-past-stats__label">Completion rate</span>
            <strong>{completionRounded}%</strong>
          </div>
        </div>
        {showCapacityBar ? (
          <div className="myday-past-stats__capacity">
            <div className="myday-past-stats__capacity-head">
              <span>Capacity used (planned vs today&apos;s capacity)</span>
              <strong>{pctRounded}%</strong>
            </div>
            <div className="myday-progress-track myday-progress-track--capacity">
              <div
                className="myday-progress-fill myday-progress-fill--medium"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
