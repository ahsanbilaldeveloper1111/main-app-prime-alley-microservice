import React from "react";
import "./plannerTasksListing.scss";

export type PlannerTasksPageHeaderProps = Readonly<{
  total: number;
  showCreateTaskButton: boolean;
  onCreateTaskClick: () => void;
}>;

export function PlannerTasksPageHeader({
  total,
  showCreateTaskButton,
  onCreateTaskClick,
}: PlannerTasksPageHeaderProps) {
  return (
    <div className="ptl-header">
      <div>
        <h4 className="ptl-title">Tasks</h4>
        <p className="ptl-subtitle">{total} records</p>
      </div>
      <div className="ptl-header-actions">
        {showCreateTaskButton ? (
          <button type="button" className="ptl-filled-btn" onClick={onCreateTaskClick}>
            Create task
          </button>
        ) : null}
      </div>
    </div>
  );
}
