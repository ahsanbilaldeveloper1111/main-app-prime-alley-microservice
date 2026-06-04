import React from "react";
import type { MyDayPastDayStats } from "@page-modules/planner/my-day/myDayHistoryDomain";
import { MyDayDailySummaryPanel } from "@components/planner/my-day/MyDayDailySummaryPanel";

type MyDayPastDayStatsPanelProps = Readonly<{
  stats: MyDayPastDayStats;
}>;

/** Past-day snapshot stats inside the history modal (same metrics as live daily summary). */
export function MyDayPastDayStatsPanel({ stats }: MyDayPastDayStatsPanelProps) {
  return <MyDayDailySummaryPanel stats={stats} title="Day summary" showCapacityBar />;
}
