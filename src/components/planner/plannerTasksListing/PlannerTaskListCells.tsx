import React from "react";
import { Dropdown } from "react-bootstrap";
import { MoreVertical, Settings, Sun, Trash2 } from "lucide-react";
import {
  TaskCompleteCircleButton,
  TaskListingAssigneeCell,
  formatTaskDueDateCellParts,
} from "@utils/taskListing/taskListUiPrimitives";
import type { Task } from "./plannerTasksListingDomain";
import {
  TASK_TYPE_OPTIONS,
  apiDueTimeFromPlannerTaskRow,
  assigneeDisplayNamesForTaskRow,
  createTaskRowActionsToggleHandler,
  formatRepeatStatusLabel,
  taskStatusColumnLabel,
} from "./plannerTasksListingDomain";
import { plannerAddToMyDayDisabledTitle } from "./plannerTasksListingMyDay";
import "./plannerTasksListing.scss";

function plannerPriorityDotModifier(priority: string): "low" | "medium" | "normal" | "high" | "urgent" {
  const p = priority.toLowerCase();
  if (p === "low") return "low";
  if (p === "medium") return "medium";
  if (p === "normal") return "normal";
  if (p === "high") return "high";
  if (p === "urgent") return "urgent";
  return "medium";
}

export type PlannerTaskTitleCellProps = Readonly<{
  row: Task;
  canEdit: boolean;
  onNavigate: (e: React.MouseEvent) => void;
  onEditClick: (e: React.MouseEvent) => void;
}>;

export function PlannerTaskTitleCell({
  row,
  canEdit,
  onNavigate,
  onEditClick,
}: PlannerTaskTitleCellProps) {
  return (
    <div className="task-title-cell ptl-title-cell">
      <a
        className="ptl-title-link"
        href={`/planner/tasks/${row.id}`}
        onClick={onNavigate}
        title={row.title}
      >
        {row.title}
      </a>
      {canEdit ? (
        <button className="ptl-title-edit-btn" type="button" onClick={onEditClick}>
          Edit
        </button>
      ) : null}
    </div>
  );
}

export type PlannerTaskPriorityCellProps = Readonly<{
  row: Task;
}>;

export function PlannerTaskPriorityCell({ row }: PlannerTaskPriorityCellProps) {
  if (!row.priority) {
    return (
      <span className="ptl-list-cell ptl-muted-dash">—</span>
    );
  }
  return (
    <span className={`ptl-priority-badge ptl-priority-badge--${plannerPriorityDotModifier(row.priority)}`}>
      {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
    </span>
  );
}

export type PlannerTaskDueDateCellProps = Readonly<{
  row: Task;
}>;

export function PlannerTaskDueDateCell({ row }: PlannerTaskDueDateCellProps) {
  const parts = formatTaskDueDateCellParts(
    row.due_date,
    row.status,
    apiDueTimeFromPlannerTaskRow(row),
  );
  return (
    <span className={`ptl-list-cell ptl-due-date--${parts.tone}`}>
      {parts.label}
    </span>
  );
}

export type PlannerTaskNotesCellProps = Readonly<{
  row: Task;
}>;

export function PlannerTaskNotesCell({ row }: PlannerTaskNotesCellProps) {
  return (
    <span className="ptl-list-cell ptl-notes-truncate" title={row.notes || ""}>
      {row.notes || "—"}
    </span>
  );
}

export type PlannerTaskRowActionsMenuProps = Readonly<{
  row: Task;
  isOpen: boolean;
  showAddToMyDay: boolean;
  canAddToMyDay: boolean;
  alreadyInMyDay: boolean;
  canEditRow: boolean;
  canDeleteRow: boolean;
  addToMyDayTitle?: string | null;
  editTitle?: string | null;
  deleteTitle?: string | null;
  setOpenTaskActionsId: React.Dispatch<React.SetStateAction<number | null>>;
  onAddToMyDay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}>;

export function PlannerTaskRowActionsMenu({
  row,
  isOpen,
  showAddToMyDay,
  canAddToMyDay,
  alreadyInMyDay,
  canEditRow,
  canDeleteRow,
  addToMyDayTitle,
  editTitle,
  deleteTitle,
  setOpenTaskActionsId,
  onAddToMyDay,
  onEdit,
  onDelete,
}: PlannerTaskRowActionsMenuProps) {
  return (
    <Dropdown
      show={isOpen}
      onToggle={createTaskRowActionsToggleHandler(row.id, setOpenTaskActionsId)}
      onClick={(e) => e.stopPropagation()}
    >
      <Dropdown.Toggle
        variant="link"
        size="sm"
        className="ptl-actions-toggle p-1 text-decoration-none shadow-none"
        id={`task-row-actions-${row.id}`}
        aria-label="Task actions"
      >
        <MoreVertical size={16} />
      </Dropdown.Toggle>
      <Dropdown.Menu align="end">
        {showAddToMyDay ? (
          <>
            <Dropdown.Item
              as="button"
              type="button"
              aria-disabled={!canAddToMyDay}
              className={`dropdown-item ptl-dropdown-item ${canAddToMyDay ? "" : "ptl-dropdown-item--disabled text-muted"}`}
              title={
                addToMyDayTitle ?? plannerAddToMyDayDisabledTitle(showAddToMyDay, alreadyInMyDay)
              }
              onClick={() => {
                if (!canAddToMyDay) return;
                setOpenTaskActionsId(null);
                onAddToMyDay();
              }}
            >
              <Sun size={14} className="me-2" />
              {alreadyInMyDay ? "Already in My Day" : "Add to My Day"}
            </Dropdown.Item>
            <Dropdown.Divider />
          </>
        ) : null}
        <Dropdown.Item
          as="button"
          type="button"
          aria-disabled={!canEditRow}
          className={`dropdown-item ptl-dropdown-item ${canEditRow ? "" : "ptl-dropdown-item--disabled text-muted"}`}
          title={editTitle ?? undefined}
          onClick={() => {
            if (!canEditRow) return;
            setOpenTaskActionsId(null);
            onEdit();
          }}
        >
          <Settings size={14} className="me-2" />
          Edit Task
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item
          as="button"
          type="button"
          aria-disabled={!canDeleteRow}
          className={`dropdown-item ptl-dropdown-item ${canDeleteRow ? "text-danger" : "ptl-dropdown-item--disabled text-muted"}`}
          title={deleteTitle ?? undefined}
          onClick={() => {
            if (!canDeleteRow) return;
            setOpenTaskActionsId(null);
            onDelete();
          }}
        >
          <Trash2 size={14} className="me-2" />
          Delete Task
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function plannerTaskTypeCellLabel(row: Task): string {
  return TASK_TYPE_OPTIONS.find((t) => t.value === row.task_type)?.label || row.task_type;
}

export function PlannerTaskTypeCell({ row }: Readonly<{ row: Task }>) {
  return <span className="ptl-list-cell">{plannerTaskTypeCellLabel(row)}</span>;
}

export function PlannerTaskAssigneeCell({
  row,
  hierarchyDataExtensions,
}: Readonly<{ row: Task; hierarchyDataExtensions: unknown[] | null | undefined }>) {
  const names = assigneeDisplayNamesForTaskRow(row, hierarchyDataExtensions);
  const display = names.length > 0 ? names.join(", ") : "";
  return <TaskListingAssigneeCell label={display} />;
}

export function PlannerTaskWorkflowStatusCell({ row }: Readonly<{ row: Task }>) {
  return <span className="ptl-status-badge">{taskStatusColumnLabel(row)}</span>;
}

export function PlannerTaskRepeatStatusCell({ row }: Readonly<{ row: Task }>) {
  const label = formatRepeatStatusLabel(row.repeat_status);
  return <span className="ptl-list-cell">{label || "—"}</span>;
}

export type PlannerTaskCompleteColumnRenderProps = Readonly<{
  row: Task;
  canToggleComplete: boolean;
  completeBtnTitle: string;
  onToggleComplete: (e: React.MouseEvent) => void | Promise<void>;
}>;

export function PlannerTaskCompleteColumnRender({
  row,
  canToggleComplete,
  completeBtnTitle,
  onToggleComplete,
}: PlannerTaskCompleteColumnRenderProps) {
  return (
    <TaskCompleteCircleButton
      isCompleted={row.status === "completed"}
      title={completeBtnTitle}
      disabled={!canToggleComplete}
      onClick={onToggleComplete}
    />
  );
}
