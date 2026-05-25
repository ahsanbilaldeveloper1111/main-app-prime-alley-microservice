import React from "react";
import { Alert, Spinner } from "react-bootstrap";
import type {
  WorkloadBoardData,
  WorkloadGridCell,
  WorkloadGridData,
  WorkloadSummaryData,
  WorkloadSummaryMember,
} from "@utils/tasks";
import type { WorkloadPriorityFilterValue } from "@page-modules/planner/workload/workloadDomain";
import { WorkloadBoardPanel } from "./WorkloadBoardPanel";
import type { WorkloadBoardDropIntent } from "./WorkloadBoardPanel";
import {
  WorkloadGridPanel,
  WorkloadLegendRow,
  WorkloadPeriodMembersPanel,
  WorkloadSummaryCardsRow,
} from "./WorkloadPlannerSubviews";

type MainView = "grid" | "board";

const DEFAULT_EMPTY_TEAM_MESSAGE =
  "There are no members in this team. Add them in team settings.";

type WorkloadPlannerDataViewsProps = Readonly<{
  loadingMain: boolean;
  enabled: boolean;
  mainView: MainView;
  summaryData: WorkloadSummaryData | undefined;
  gridData: WorkloadGridData | undefined;
  boardData: WorkloadBoardData | undefined;
  cellMap: Map<string, WorkloadGridCell>;
  hierarchyExtensions?: unknown[] | null;
  priorityFilter: WorkloadPriorityFilterValue;
  boardDragSaving: boolean;
  onBoardDropIntent: (intent: WorkloadBoardDropIntent) => void;
  onSelectCell: (extension: string, date: string) => void;
  showWorkloadPerDay: boolean;
  onToggleWorkloadPerDay: () => void;
  periodMembers?: WorkloadSummaryMember[];
}>;

function WorkloadEmptyTeamAlert({ message }: Readonly<{ message?: string | null }>) {
  return (
    <Alert variant="secondary" className="text-center">
      {message?.trim() || DEFAULT_EMPTY_TEAM_MESSAGE}
    </Alert>
  );
}

function WorkloadPlannerSummarySection({
  ready,
  summaryData,
}: Readonly<{ ready: boolean; summaryData: WorkloadSummaryData | undefined }>) {
  if (!ready || !summaryData) return null;
  return <WorkloadSummaryCardsRow data={summaryData} />;
}

function WorkloadPlannerPriorityHint({
  mainView,
  priorityFilter,
}: Readonly<{ mainView: MainView; priorityFilter: WorkloadPriorityFilterValue }>) {
  if (mainView !== "board" || priorityFilter === "all") return null;
  return (
    <p className="workload-board-priority-hint small text-muted">
      Priority filter applies to board task cards. Grid totals are unchanged.
    </p>
  );
}

function WorkloadPlannerGridSection({
  ready,
  mainView,
  gridData,
  cellMap,
  hierarchyExtensions,
  showWorkloadPerDay,
  onToggleWorkloadPerDay,
  onSelectCell,
  periodMembers,
}: Readonly<{
  ready: boolean;
  mainView: MainView;
  gridData: WorkloadGridData | undefined;
  cellMap: Map<string, WorkloadGridCell>;
  hierarchyExtensions?: unknown[] | null;
  showWorkloadPerDay: boolean;
  onToggleWorkloadPerDay: () => void;
  onSelectCell: (extension: string, date: string) => void;
  periodMembers: WorkloadSummaryMember[];
}>) {
  if (!ready || mainView !== "grid" || !gridData) return null;
  if (gridData.empty_team) {
    return <WorkloadEmptyTeamAlert message={gridData.empty_team_message} />;
  }
  return (
    <>
      <WorkloadLegendRow
        mainView={mainView}
        showWorkloadPerDay={showWorkloadPerDay}
        onToggleWorkloadPerDay={onToggleWorkloadPerDay}
      />
      {showWorkloadPerDay ? (
        <WorkloadGridPanel
          gridData={gridData}
          cellMap={cellMap}
          hierarchyExtensions={hierarchyExtensions}
          onSelectCell={onSelectCell}
        />
      ) : (
        <WorkloadPeriodMembersPanel
          members={periodMembers}
          hierarchyExtensions={hierarchyExtensions}
        />
      )}
    </>
  );
}

function WorkloadPlannerBoardSection({
  ready,
  mainView,
  boardData,
  hierarchyExtensions,
  priorityFilter,
  boardDragSaving,
  onBoardDropIntent,
}: Readonly<{
  ready: boolean;
  mainView: MainView;
  boardData: WorkloadBoardData | undefined;
  hierarchyExtensions?: unknown[] | null;
  priorityFilter: WorkloadPriorityFilterValue;
  boardDragSaving: boolean;
  onBoardDropIntent: (intent: WorkloadBoardDropIntent) => void;
}>) {
  if (!ready || mainView !== "board" || !boardData) return null;
  if (boardData.empty_team) {
    return <WorkloadEmptyTeamAlert message={boardData.empty_team_message} />;
  }
  return (
    <div className="workload-board-view">
      <WorkloadBoardPanel
        boardData={boardData}
        hierarchyExtensions={hierarchyExtensions}
        priorityFilter={priorityFilter}
        dragSaving={boardDragSaving}
        onDropIntent={onBoardDropIntent}
      />
    </div>
  );
}

export function WorkloadPlannerDataViews({
  loadingMain,
  enabled,
  mainView,
  summaryData,
  gridData,
  boardData,
  cellMap,
  hierarchyExtensions,
  priorityFilter,
  boardDragSaving,
  onBoardDropIntent,
  onSelectCell,
  showWorkloadPerDay,
  onToggleWorkloadPerDay,
  periodMembers = [],
}: WorkloadPlannerDataViewsProps) {
  if (loadingMain && enabled) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  const ready = !loadingMain && enabled;

  return (
    <>
      <WorkloadPlannerSummarySection ready={ready} summaryData={summaryData} />
      <WorkloadPlannerPriorityHint mainView={mainView} priorityFilter={priorityFilter} />
      <WorkloadPlannerGridSection
        ready={ready}
        mainView={mainView}
        gridData={gridData}
        cellMap={cellMap}
        hierarchyExtensions={hierarchyExtensions}
        showWorkloadPerDay={showWorkloadPerDay}
        onToggleWorkloadPerDay={onToggleWorkloadPerDay}
        onSelectCell={onSelectCell}
        periodMembers={periodMembers}
      />
      <WorkloadPlannerBoardSection
        ready={ready}
        mainView={mainView}
        boardData={boardData}
        hierarchyExtensions={hierarchyExtensions}
        priorityFilter={priorityFilter}
        boardDragSaving={boardDragSaving}
        onBoardDropIntent={onBoardDropIntent}
      />
    </>
  );
}
