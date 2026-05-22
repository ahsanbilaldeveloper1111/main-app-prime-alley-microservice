import type { TaskReportsOverview } from "@utils/taskReports";
import { ReportsTeamBoardPanel } from "./WorkloadReportsBoardViews";

export function ReportsTeamBoardPanelWrapper({
  data,
  memberRows,
  hierarchyExtensions,
}: Readonly<{
  data: TaskReportsOverview;
  memberRows: TaskReportsOverview["member_report"];
  hierarchyExtensions?: unknown[] | null;
}>) {
  return (
    <ReportsTeamBoardPanel
      summary={data.summary}
      statusRows={data.status_breakdown}
      memberRows={memberRows}
      trends={data.trends}
      hierarchyExtensions={hierarchyExtensions}
    />
  );
}
