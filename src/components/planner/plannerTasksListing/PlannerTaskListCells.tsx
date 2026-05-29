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
  const isCompleted = row.status === "completed";
  return (
    <div className="task-title-cell ptl-title-cell">
      <a
        className="ptl-title-link"
        href={`/planner/tasks/${row.id}`}
        onClick={onNavigate}
        title={row.title}
        style={{
          color: isCompleted ? "#9ca3af" : undefined,
          textDecoration: isCompleted ? "line-through" : undefined,
        }}
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
    <div className="ptl-priority-row">
      <div className={`ptl-priority-dot ptl-priority-dot--${plannerPriorityDotModifier(row.priority)}`} />
      <div className="ptl-list-cell">
        {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
      </div>
    </div>
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
    <div className={`ptl-list-cell ptl-due-date--${parts.tone}`}>
      {parts.label}
    </div>
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

function resolveStatusBadgeColors(row: Task): { bg: string; text: string } {
  // Future: when API provides color, use it
  if (row.workflowStatus?.color) {
    return { bg: row.workflowStatus.color + "22", text: row.workflowStatus.color };
  }
  // Fallback: name-based mapping
  const name = (row.workflowStatus?.name || row.status || "").toLowerCase().trim();
  if (name.includes("progress") || name.includes("in_progress")) return { bg: "#dbeafe", text: "#1e40af" };
  if (name.includes("done") || name.includes("completed")) return { bg: "#d1fae5", text: "#065f46" };
  if (name.includes("overdue")) return { bg: "#fee2e2", text: "#991b1b" };
  if (name.includes("review")) return { bg: "#fef3c7", text: "#92400e" };
  if (name.includes("new")) return { bg: "#ede9fe", text: "#5b21b6" };
  if (name.includes("pending")) return { bg: "#fef9c3", text: "#854d0e" };
  return { bg: "#e2e8f0", text: "#475569" };
}

export function PlannerTaskWorkflowStatusCell({ row }: Readonly<{ row: Task }>) {
  const { bg, text } = resolveStatusBadgeColors(row);
  return (
    <div
      className="ptl-status-badge"
      style={{ backgroundColor: bg, color: text }}
    >
      {taskStatusColumnLabel(row)}
    </div>
  );
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
