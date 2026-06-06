import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import type { WorkloadTaskCard } from "@utils/tasks";
import {
  formatWorkloadBoardMoveLabel,
  formatWorkloadRangeLabel,
  formatWorkloadShortDueDate,
  formatWorkloadTaskEstimate,
  isWorkloadOrganizationTask,
  isWorkloadTaskUnestimated,
  workloadBoardStatusBdgTone,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";
import { WorkloadBdg, WorkloadPriorityBadge } from "./WorkloadPlannerSubviews";

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

function shouldPreventCardDrag(eventTarget: EventTarget | null): boolean {
  if (!(eventTarget instanceof HTMLElement)) return false;
  return Boolean(
    eventTarget.closest(
      "a, button, input, select, textarea, label, [contenteditable='true'], .workload-board-task-card__date-row",
    ),
  );
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
  const unestimated = isWorkloadTaskUnestimated(task);
  const isOrg = isWorkloadOrganizationTask(task);
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

  useEffect(() => {
    setMoveDate(initialMoveDate);
  }, [initialMoveDate]);

  const handleCardDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (shouldPreventCardDrag(e.target)) {
      e.preventDefault();
      return;
    }
    onDragStart(e, task);
  };

  const cardClassName = [
    "workload-board-task-card",
    task.is_completed ? "workload-board-task-card--done" : "",
    task.is_completed ? "workload-board-task-card--completed" : "",
    task.is_overdue && !task.is_completed ? "workload-board-task-card--overdue" : "",
    isDragging ? "workload-board-task-card--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="workload-board-task-card-item">
      <article
        className={cardClassName}
        draggable={!dragSaving}
        title={dragSaving ? undefined : "Drag to another column to reassign"}
        onDragStart={handleCardDragStart}
        onDragEnd={onDragEnd}
      >
      <div className="workload-board-task-card__header">
        <span className="workload-board-task-card__drag-handle" aria-hidden>
          <GripVertical size={12} />
        </span>
        <div className="workload-board-task-card__title-wrap">
          <div className="workload-board-task-card__title">{task.title}</div>
        </div>
      </div>

      <div className="workload-board-task-card__meta">
        {isOrg ? (
          <WorkloadBdg tone="green">
            Org task
          </WorkloadBdg>
        ) : null}
        <WorkloadPriorityBadge priority={task.priority} />
        {projectLabel && projectLabel !== "—" && projectLabel !== "Personal" ? (
          <WorkloadBdg tone="gray">{projectLabel}</WorkloadBdg>
        ) : null}
        {statusLabel ? (
          <WorkloadBdg tone={workloadBoardStatusBdgTone(statusLabel)}>{statusLabel}</WorkloadBdg>
        ) : null}
      </div>

      <div className="workload-board-task-card__meta workload-board-task-card__meta--secondary">
        <WorkloadBdg tone={task.is_overdue && !task.is_completed ? "red" : "gray"}>
          <i className="ti ti-calendar" style={{ fontSize: "10px" }} aria-hidden />
          {scheduleLabel}
        </WorkloadBdg>
        {unestimated ? (
          <WorkloadBdg tone="orange">
            <i className="ti ti-clock" style={{ fontSize: "10px" }} aria-hidden />
            {" No est."}
          </WorkloadBdg>
        ) : (
          <WorkloadBdg tone="gray">
            <i className="ti ti-clock" style={{ fontSize: "10px" }} aria-hidden />
            {formatWorkloadTaskEstimate(task)}
          </WorkloadBdg>
        )}
      </div>

      <div className="workload-board-task-card__date-row">
        <span className="workload-board-task-card__date-label">Move to:</span>
        <select
          className="workload-board-task-card__date-select"
          value={moveDate}
          disabled={dragSaving || rangeDays.length === 0}
          onChange={(e) => setMoveDate(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Move ${task.title} to date`}
        >
          {rangeDays.map((day) => (
            <option key={day} value={day}>
              {formatWorkloadBoardMoveLabel(day)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="workload-board-task-card__move-btn"
          disabled={dragSaving || !moveDate}
          onClick={(e) => {
            e.stopPropagation();
            onMove(task, columnExtension, moveDate);
          }}
        >
          Move
        </button>
      </div>

      <div className="workload-board-task-card__footer">
        <Link href={`/planner/tasks/${task.id}`} className="workload-board-task-card__view">
          View
        </Link>
      </div>
      </article>
    </li>
  );
}
