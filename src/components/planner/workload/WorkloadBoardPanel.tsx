import React, { useCallback, useMemo, useState } from "react";
import type { WorkloadBoardColumn, WorkloadBoardData, WorkloadTaskCard } from "@utils/tasks";
import {
  formatWorkloadMinutes,
  formatWorkloadPercent,
  listWorkloadDaysInRange,
  WORKLOAD_DRAG_TASK_MIME,
  workloadCellBandClass,
  workloadPassesPriorityFilter,
  type WorkloadPriorityFilterValue,
} from "@page-modules/planner/workload/workloadDomain";
import { WorkloadBoardLegendBar, WorkloadMemberIdentity } from "./WorkloadPlannerSubviews";
import { WorkloadBoardTaskCard } from "./WorkloadBoardTaskCard";

export type WorkloadBoardDropIntent = Readonly<{
  task: WorkloadTaskCard;
  fromExtension: string;
  toExtension: string;
  toDate: string | null;
}>;

type WorkloadBoardPanelProps = Readonly<{
  boardData: WorkloadBoardData;
  hierarchyExtensions?: unknown[] | null;
  priorityFilter: WorkloadPriorityFilterValue;
  dragSaving: boolean;
  onDropIntent: (intent: WorkloadBoardDropIntent) => void;
}>;

function filterColumnTasks(
  col: WorkloadBoardColumn,
  priorityFilter: WorkloadPriorityFilterValue,
): WorkloadTaskCard[] {
  return col.tasks.filter((t) => workloadPassesPriorityFilter(t.priority, priorityFilter));
}

export function WorkloadBoardPanel({
  boardData,
  hierarchyExtensions,
  priorityFilter,
  dragSaving,
  onDropIntent,
}: WorkloadBoardPanelProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dropHighlight, setDropHighlight] = useState<string | null>(null);

  const rangeDays = useMemo(
    () => listWorkloadDaysInRange(boardData.range.start, boardData.range.end),
    [boardData.range.end, boardData.range.start],
  );

  const resolveTaskFromDrag = useCallback(
    (taskId: number): { task: WorkloadTaskCard; fromExtension: string } | null => {
      for (const col of boardData.columns) {
        const task = col.tasks.find((t) => t.id === taskId);
        if (task) {
          return {
            task,
            fromExtension:
              task.primary_assignee_extension?.trim() || col.extension_number,
          };
        }
      }
      return null;
    },
    [boardData.columns],
  );

  const handleDragStart = useCallback((e: React.DragEvent, task: WorkloadTaskCard) => {
    e.dataTransfer.setData(WORKLOAD_DRAG_TASK_MIME, String(task.id));
    e.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(task.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDropHighlight(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toExtension: string, toDate: string | null) => {
      e.preventDefault();
      setDropHighlight(null);
      setDraggingTaskId(null);
      const raw = e.dataTransfer.getData(WORKLOAD_DRAG_TASK_MIME);
      const taskId = Number.parseInt(raw, 10);
      if (!Number.isFinite(taskId)) return;
      const resolved = resolveTaskFromDrag(taskId);
      if (!resolved) return;
      const { task, fromExtension } = resolved;
      if (!toExtension) return;
      if (fromExtension === toExtension && !toDate) return;
      if (toDate && task.due_date?.slice(0, 10) === toDate && fromExtension === toExtension) {
        return;
      }
      onDropIntent({ task, fromExtension, toExtension, toDate });
    },
    [onDropIntent, resolveTaskFromDrag],
  );

  const allowDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleMove = useCallback(
    (task: WorkloadTaskCard, columnExtension: string, toDate: string) => {
      const fromExtension = task.primary_assignee_extension?.trim() || columnExtension;
      if (task.due_date?.slice(0, 10) === toDate && fromExtension === columnExtension) {
        return;
      }
      onDropIntent({ task, fromExtension, toExtension: columnExtension, toDate });
    },
    [onDropIntent],
  );

  return (
    <div className="workload-board-dnd">
      <WorkloadBoardLegendBar />
      <div className="workload-board">
        {boardData.columns.map((col) => {
          const tasks = filterColumnTasks(col, priorityFilter);
          const barPct = Math.min(100, Math.max(0, col.load_percent));
          const periodCapacity = col.effective_capacity_minutes_period;
          return (
            <div
              key={col.extension_number}
              className={`workload-board__column ${
                dropHighlight === col.extension_number
                  ? "workload-board__column--drop-target"
                  : ""
              }`}
              onDragOver={allowDrop}
              onDragEnter={() => setDropHighlight(col.extension_number)}
              onDragLeave={() => setDropHighlight(null)}
              onDrop={(e) => handleDrop(e, col.extension_number, null)}
            >
              <div className="workload-board__column-head">
                <WorkloadMemberIdentity
                  extensionNumber={col.extension_number}
                  hierarchyExtensions={hierarchyExtensions}
                  member={col}
                  isOwner={col.is_owner}
                  displayMode="inline"
                />
                <div className="workload-board__progress-row">
                  <div
                    className={`workload-cell__bar workload-board__progress-bar ${workloadCellBandClass(col.load_band)}`}
                  >
                    <div
                      className="workload-cell__bar-fill"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="workload-board__progress-pct">
                    {formatWorkloadPercent(col.load_percent)}
                  </span>
                </div>
                <div className="workload-board__hours small text-muted">
                  {formatWorkloadMinutes(col.estimated_minutes)} /{" "}
                  {formatWorkloadMinutes(periodCapacity)}
                </div>
              </div>
              <div className="workload-board__column-body">
                {tasks.length === 0 ? (
                  <p className="small text-muted mb-0 px-1">No tasks</p>
                ) : (
                  tasks.map((task) => (
                    <WorkloadBoardTaskCard
                      key={task.id}
                      task={task}
                      columnExtension={col.extension_number}
                      rangeStart={boardData.range.start}
                      rangeEnd={boardData.range.end}
                      rangeDays={rangeDays}
                      dragSaving={dragSaving}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onMove={handleMove}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
