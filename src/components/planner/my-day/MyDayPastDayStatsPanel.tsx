import React from "react";
import type { MyDayPastDayStats } from "@page-modules/planner/my-day/myDayHistoryDomain";
import { toMinutesDisplay } from "@page-modules/planner/my-day/myDayDomain";

type MyDayPastDayStatsPanelProps = Readonly<{
  stats: MyDayPastDayStats;
}>;

export function MyDayPastDayStatsPanel({ stats }: MyDayPastDayStatsPanelProps) {
  const pctRounded = Math.round(stats.capacityUsedPercent);
  const barWidth = Math.min(100, Math.max(0, pctRounded));

  return (
    <div className="myday-past-stats">
      <div className="myday-past-stats__grid">
        <div className="myday-past-stats__item">
          <span className="myday-past-stats__label">Planned tasks</span>
          <strong>{stats.tasksPlanned}</strong>
        </div>
        <div className="myday-past-stats__item">
          <span className="myday-past-stats__label">Completed tasks</span>
          <strong>{stats.tasksCompleted}</strong>
        </div>
        <div className="myday-past-stats__item">
          <span className="myday-past-stats__label">Planned time</span>
          <strong>{toMinutesDisplay(stats.plannedMinutes)}</strong>
        </div>
        <div className="myday-past-stats__item">
          <span className="myday-past-stats__label">Completed time</span>
          <strong>{toMinutesDisplay(stats.completedMinutes)}</strong>
        </div>
        <div className="myday-past-stats__item">
          <span className="myday-past-stats__label">Original capacity</span>
          <strong>{toMinutesDisplay(stats.originalCapacityMinutes)}</strong>
        </div>
      </div>
      <div className="myday-past-stats__capacity">
        <div className="myday-past-stats__capacity-head">
          <span>Capacity used</span>
          <strong>{pctRounded}% of capacity used</strong>
        </div>
        <div className="myday-progress-track myday-progress-track--capacity">
          <div
            className="myday-progress-fill myday-progress-fill--medium"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
