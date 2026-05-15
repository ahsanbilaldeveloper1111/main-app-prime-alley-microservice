import React from "react";
import { Alert, Spinner } from "react-bootstrap";
import type { WorkloadBoardData, WorkloadGridCell, WorkloadGridData, WorkloadSummaryData } from "@utils/tasks";
import {
  WorkloadBoardColumns,
  WorkloadGridPanel,
  WorkloadLegendRow,
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
  onSelectCell: (extension: string, date: string) => void;
}>;

export function WorkloadPlannerDataViews({
  loadingMain,
  enabled,
  mainView,
  summaryData,
  gridData,
  boardData,
  cellMap,
  onSelectCell,
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

      {!loadingMain && enabled && mainView === "grid" && gridData?.empty_team ? (
        <Alert variant="secondary" className="text-center">
          {gridData.empty_team_message?.trim() ||
            "There are no members in this team. Add them in team settings."}
        </Alert>
      ) : null}

      {!loadingMain && enabled && mainView === "grid" && gridData && !gridData.empty_team ? (
        <>
          <WorkloadLegendRow />
          <WorkloadGridPanel gridData={gridData} cellMap={cellMap} onSelectCell={onSelectCell} />
        </>
      ) : null}

      {!loadingMain && enabled && mainView === "board" && boardData?.empty_team ? (
        <Alert variant="secondary" className="text-center">
          {boardData.empty_team_message?.trim() ||
            "There are no members in this team. Add them in team settings."}
        </Alert>
      ) : null}

      {!loadingMain && enabled && mainView === "board" && boardData && !boardData.empty_team ? (
        <WorkloadBoardColumns columns={boardData.columns} />
      ) : null}
    </>
  );
}
