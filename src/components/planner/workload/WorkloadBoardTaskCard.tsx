import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Collapse, Form } from "react-bootstrap";
import { Calendar, ChevronDown, FolderKanban, GripVertical } from "lucide-react";
import type { WorkloadTaskCard } from "@utils/tasks";
import {
  formatWorkloadBoardMoveLabel,
  formatWorkloadRangeLabel,
  formatWorkloadShortDueDate,
  isWorkloadTaskUnestimated,
  workloadPriorityLabel,
  workloadPriorityTone,
  workloadTaskCardAccent,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";

type WorkloadBoardTaskCardProps = Readonly<{
  task: WorkloadTaskCard;
  columnExtension: string;
  rangeStart: string;
  rangeEnd: string;
  rangeDays: string[];
  dragSaving: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, task: WorkloadTaskCard) => void;
  onDragEnd: () => void;
  onMove: (task: WorkloadTaskCard, columnExtension: string, toDate: string) => void;
}>;

function defaultMoveDate(task: WorkloadTaskCard, rangeDays: string[]): string {
  const due = task.due_date?.slice(0, 10);
  if (due && rangeDays.includes(due)) return due;
  return rangeDays[0] ?? "";
}

export function WorkloadBoardTaskCard({
  task,
  columnExtension,
  rangeStart,
  rangeEnd,
  rangeDays,
  dragSaving,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
}: WorkloadBoardTaskCardProps) {
  const accent = workloadTaskCardAccent(task);
  const priorityTone = workloadPriorityTone(task.priority);
  const unestimated = isWorkloadTaskUnestimated(task);
  const statusLabel = task.status_name?.trim();
  const projectLabel = workloadTaskProjectLabel(task);
  const scheduleLabel = task.due_date
    ? formatWorkloadShortDueDate(task.due_date)
    : formatWorkloadRangeLabel(rangeStart, rangeEnd);

  const initialMoveDate = useMemo(
    () => defaultMoveDate(task, rangeDays),
    [rangeDays, task.due_date, task.id],
  );
  const [moveDate, setMoveDate] = useState(initialMoveDate);
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      className={`workload-board-task-card workload-board-task-card--${accent} ${
        isDragging ? "workload-board-task-card--dragging" : ""
      } ${task.is_completed ? "workload-board-task-card--completed" : ""}`}
    >
      <div className="workload-board-task-card__header">
        <button
          type="button"
          className="workload-board-task-card__drag-handle"
          draggable={!dragSaving}
          aria-label={`Drag ${task.title}`}
          disabled={dragSaving}
          onDragStart={(e) => onDragStart(e, task)}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={14} aria-hidden />
        </button>
        <div className="workload-board-task-card__title">{task.title}</div>
      </div>

      <div className="workload-board-task-card__project">
        <FolderKanban size={14} className="workload-board-task-card__project-icon" aria-hidden />
        <span>{projectLabel}</span>
      </div>

      <div className="workload-board-task-card__meta">
        <span className={`workload-priority-badge workload-priority-badge--${priorityTone}`}>
          {workloadPriorityLabel(task.priority)}
        </span>
        {statusLabel ? (
          <span
            className="workload-board-task-card__tag workload-board-task-card__tag--status"
            style={
              task.status_color
                ? { borderColor: task.status_color, color: task.status_color }
                : undefined
            }
          >
            {statusLabel}
          </span>
        ) : null}
        {unestimated ? (
          <span className="workload-board-task-card__tag workload-board-task-card__tag--warn">
            No estimate
          </span>
        ) : null}
      </div>

      <div className="workload-board-task-card__schedule">
        <Calendar size={13} aria-hidden />
        <span className={task.is_overdue ? "text-danger" : undefined}>{scheduleLabel}</span>
      </div>

      <div className="workload-board-task-card__footer">
        <button
          type="button"
          className="workload-board-task-card__move-toggle btn btn-link btn-sm p-0"
          onClick={() => setShowMove((open) => !open)}
          aria-expanded={showMove}
        >
          Move
          <ChevronDown
            size={14}
            className={`ms-1 workload-board-task-card__chevron ${showMove ? "workload-board-task-card__chevron--open" : ""}`}
            aria-hidden
          />
        </button>
        <Link
          href={`/planner/tasks/${task.id}`}
          className="btn btn-primary btn-sm workload-board-task-card__view"
        >
          View
        </Link>
      </div>

      <Collapse in={showMove} unmountOnExit>
        <div className="workload-board-task-card__move-panel">
          <Form.Select
            size="sm"
            value={moveDate}
            disabled={dragSaving || rangeDays.length === 0}
            onChange={(e) => setMoveDate(e.target.value)}
            aria-label={`Move ${task.title} to date`}
          >
            {rangeDays.map((day) => (
              <option key={day} value={day}>
                {formatWorkloadBoardMoveLabel(day)}
              </option>
            ))}
          </Form.Select>
          <Button
            size="sm"
            variant="outline-primary"
            disabled={dragSaving || !moveDate}
            onClick={() => onMove(task, columnExtension, moveDate)}
          >
            Apply
          </Button>
        </div>
      </Collapse>
    </div>
  );
}
