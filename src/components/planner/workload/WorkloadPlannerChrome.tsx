import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { LayoutGrid, Table2 } from "lucide-react";

type MainView = "grid" | "board";

type WorkloadViewToggleProps = Readonly<{
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  disabled?: boolean;
}>;

export function WorkloadViewToggle({
  mainView,
  onMainViewChange,
  disabled = false,
}: WorkloadViewToggleProps) {
  return (
    <ButtonGroup size="sm" className="workload-page__view-toggle" aria-label="Workload view mode">
      <Button
        variant={mainView === "grid" ? "primary" : "outline-secondary"}
        disabled={disabled}
        aria-pressed={mainView === "grid"}
        onClick={() => onMainViewChange("grid")}
      >
        <Table2 size={15} className="me-1" aria-hidden />
        Spreadsheet
      </Button>
      <Button
        variant={mainView === "board" ? "primary" : "outline-secondary"}
        disabled={disabled}
        aria-pressed={mainView === "board"}
        onClick={() => onMainViewChange("board")}
      >
        <LayoutGrid size={15} className="me-1" aria-hidden />
        Board
      </Button>
    </ButtonGroup>
  );
}

export type WorkloadProjectOption = Readonly<{ id: number; name: string }>;

type WorkloadPlannerPageHeaderProps = Readonly<{
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  enabled: boolean;
}>;

export function WorkloadPlannerPageHeader({
  mainView,
  onMainViewChange,
  enabled,
}: WorkloadPlannerPageHeaderProps) {
  return (
    <div className="workload-page__header">
      <div>
        <h1 className="workload-page__title">Workload</h1>
        <p className="text-muted small mb-0">
          Team capacity across the week — spreadsheet or board view
        </p>
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <WorkloadViewToggle
          mainView={mainView}
          onMainViewChange={onMainViewChange}
          disabled={!enabled}
        />
      </div>
    </div>
  );
}

export { WorkloadPlannerFilterBar } from "./WorkloadPlannerFilterBar";
