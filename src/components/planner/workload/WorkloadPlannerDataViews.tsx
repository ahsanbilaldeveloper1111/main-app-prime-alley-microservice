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

  return (
    <>
      {!loadingMain && enabled && summaryData ? (
        <WorkloadSummaryCardsRow data={summaryData} />
      ) : null}

      {mainView === "board" && priorityFilter !== "all" ? (
        <p className="small text-muted mb-2">
          Priority filter applies to board task cards. Grid totals are unchanged.
        </p>
      ) : null}

      {!loadingMain && enabled && mainView === "grid" && gridData?.empty_team ? (
        <Alert variant="secondary" className="text-center">
          {gridData.empty_team_message?.trim() ||
            "There are no members in this team. Add them in team settings."}
        </Alert>
      ) : null}

      {!loadingMain && enabled && mainView === "grid" && gridData && !gridData.empty_team ? (
        <>
          <WorkloadLegendRow
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
      ) : null}

      {!loadingMain && enabled && mainView === "board" && boardData?.empty_team ? (
        <Alert variant="secondary" className="text-center">
          {boardData.empty_team_message?.trim() ||
            "There are no members in this team. Add them in team settings."}
        </Alert>
      ) : null}

      {!loadingMain && enabled && mainView === "board" && boardData && !boardData.empty_team ? (
        <WorkloadBoardPanel
          boardData={boardData}
          hierarchyExtensions={hierarchyExtensions}
          priorityFilter={priorityFilter}
          dragSaving={boardDragSaving}
          onDropIntent={onBoardDropIntent}
        />
      ) : null}
    </>
  );
}
