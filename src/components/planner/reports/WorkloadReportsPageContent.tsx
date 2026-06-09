import React from "react";
import { Alert, Col, Row } from "react-bootstrap";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TaskReportsOverview } from "@utils/taskReports";
import type { ReportsTeamSubView } from "@page-modules/planner/reports/projectReportsDomain";
import { ReportsErrorBlock, ReportsLoadingBlock } from "./WorkloadReportsViews";
import { ReportsTeamLivePanel } from "./WorkloadReportsLiveViews";
import { ReportsTeamBoardPanelWrapper } from "./WorkloadReportsTeamViews";
import { ReportsHistoricalTrendsPanel } from "./WorkloadReportsHistoricalViews";
import {
  ReportsOverdueByProject,
  ReportsProjectDetailList,
  ReportsProjectKpiRow,
  ReportsTasksByProject,
  ReportsTeamSubTabs,
} from "./WorkloadReportsProjectViews";
import { reportsErrorMessage } from "./useWorkloadReportsPage";
import type { useWorkloadReportsPage } from "./useWorkloadReportsPage";

type ReportsVm = ReturnType<typeof useWorkloadReportsPage>;

type WorkloadReportsPageContentProps = Readonly<{
  vm: ReportsVm;
  overviewQuery: UseQueryResult<TaskReportsOverview, Error>;
}>;

export function WorkloadReportsPageContent({
  vm,
  overviewQuery,
}: WorkloadReportsPageContentProps) {
  const showEmptyState =
    !vm.loadingOverview && vm.enabled && !vm.data && !overviewQuery.isError;

  return (
    <>
      {vm.loadingOverview ? <ReportsLoadingBlock /> : null}
      {vm.enabled && overviewQuery.isError ? (
        <ReportsErrorBlock message={reportsErrorMessage(overviewQuery.error)} />
      ) : null}
      {showEmptyState ? (
        <Alert variant="secondary" className="text-center">
          No report data for the selected filters. Try a wider date range or different project.
        </Alert>
      ) : null}
      {vm.data && !vm.loadingOverview ? (
        <WorkloadReportsActiveView vm={vm} data={vm.data} />
      ) : null}
    </>
  );
}

type ActiveViewProps = Readonly<{
  vm: ReportsVm;
  data: NonNullable<ReportsVm["data"]>;
}>;

function WorkloadReportsActiveView({ vm, data }: ActiveViewProps) {
  if (vm.mainView === "team") {
    return (
      <WorkloadReportsTeamView
        vm={vm}
        data={data}
        teamSubView={vm.teamSubView}
        onTeamSubViewChange={vm.setTeamSubView}
      />
    );
  }
  if (vm.mainView === "project") {
    return <WorkloadReportsProjectView vm={vm} />;
  }
  if (vm.mainView === "historical") {
    return (
      <ReportsHistoricalTrendsPanel
        completionPoints={vm.completionRateChartPoints}
        overduePoints={vm.overdueTrendChartPoints}
        completionChartSubtitle={vm.completionChartSubtitle}
        overdueChartSubtitle={vm.overdueChartSubtitle}
        memberTrendRows={vm.historicalMemberTrendRows}
        memberTrendWeekHeaders={vm.historicalMemberTrendWeekHeaders}
        taskFilter={vm.historicalTaskFilter}
        onTaskFilterChange={vm.setHistoricalTaskFilter}
      />
    );
  }
  return null;
}

function WorkloadReportsTeamView({
  vm,
  data,
  teamSubView,
  onTeamSubViewChange,
}: ActiveViewProps & {
  teamSubView: ReportsTeamSubView;
  onTeamSubViewChange: (view: ReportsTeamSubView) => void;
}) {
  return (
    <>
      <ReportsTeamSubTabs activeSubView={teamSubView} onChange={onTeamSubViewChange} />
      {teamSubView === "live" ? (
        <ReportsTeamLivePanel
          kpiCards={vm.liveKpiCards}
          memberRows={vm.liveMembers}
          overdueTasks={vm.liveOverdueTasks}
          inProgressTasks={vm.liveInProgressTasks}
        />
      ) : null}
      {teamSubView === "board" ? (
        <ReportsTeamBoardPanelWrapper
          data={data}
          memberRows={vm.teamMemberRows}
          hierarchyExtensions={vm.hierarchyDataExtensions}
        />
      ) : null}
    </>
  );
}

function WorkloadReportsProjectView({ vm }: Readonly<{ vm: ReportsVm }>) {
  return (
    <>
      <ReportsProjectKpiRow summary={vm.projectReportSummary} subtexts={vm.projectKpiSubtexts} />
      <div className="reports-panel mb-3">
        <h2 className="reports-panel__title">Project Health</h2>
        <p className="reports-panel__subtitle">Progress and delivery status</p>
        <ReportsProjectDetailList rows={vm.projectReportRows} />
      </div>
      <Row className="g-3">
        <Col md={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Overdue by Project</h2>
            <p className="reports-panel__subtitle">Tasks past their due date</p>
            <ReportsOverdueByProject
              entries={
                vm.overdueByProjectEntries.length > 0 ? vm.overdueByProjectEntries : undefined
              }
              rows={vm.overdueByProjectFallback}
              grouped={vm.overdueByProjectEntries.length === 0}
            />
          </div>
        </Col>
        <Col md={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Tasks by Project</h2>
            <p className="reports-panel__subtitle">Task volume across projects</p>
            <ReportsTasksByProject segments={vm.tasksByProjectSegments} />
          </div>
        </Col>
      </Row>
    </>
  );
}
