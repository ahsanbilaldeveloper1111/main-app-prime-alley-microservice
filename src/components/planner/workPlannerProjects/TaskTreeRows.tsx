import React, { memo, useCallback, useState, type CSSProperties } from "react";
import { ChevronRight, ChevronDown as ChevronDownIcon, Eye } from "lucide-react";
import { formatDateGlobal } from "@utils/Helper";
import { countAssignees, type SubTask, type Task } from "@planner/workPlannerProjectsDomain";
import {
  computeOpenSubtaskCount,
  getSubtaskBadgeCounts,
} from "@components/planner/workPlannerProjects/taskTreeUtils";
import { TASK_STATUS_ICONS, taskStatusClassSuffix } from "@components/planner/workPlannerProjects/taskTreeStatus";

import "@components/planner/workPlannerProjects/workPlannerProjectsPage.scss";

export interface TaskRowProps {
  task: Task;
  depth?: number;
  onPreview: (task: Task) => void | Promise<void>;
  expandedTasks: Set<string>;
  onToggleTask: (taskId: string) => void;
  canPreviewEditTask: boolean;
  onPreviewSubtask: (parentTask: Task, sub: SubTask) => void | Promise<void>;
}

const TaskRowInner: React.FC<TaskRowProps> = ({
  task,
  depth = 1,
  onPreview,
  expandedTasks,
  onToggleTask,
  canPreviewEditTask,
  onPreviewSubtask,
}) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expandedTasks.has(task.id);
  const hasChildTasks = (task.children?.length ?? 0) > 0;
  const subtasksLoaded = Boolean(task.subtasks && task.subtasks.length > 0);
  const hasSubtaskCounts = task.sub_task_count != null && task.sub_task_count > 0;
  const hasSubtasks = hasChildTasks || subtasksLoaded || hasSubtaskCounts;
  const openSubtaskCount = computeOpenSubtaskCount(task);
  const subtaskBadge = getSubtaskBadgeCounts(task);
  const StatusIcon = TASK_STATUS_ICONS[task.status];
  const indentLeft = depth * 24;
  const nameCellPad = 40 + indentLeft + 8;

  const onEnter = useCallback(() => {
    setHovered(true);
  }, []);
  const onLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const statusIconClass = `wp-status-icon--${taskStatusClassSuffix(task.status)}`;

  return (
    <>
      <tr
        className={`task-tree-row wp-task-tree-row${hovered ? " wp-task-tree-row--hover" : ""}`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <td
          className="wp-task-tree-row__cell-name"
          style={{ "--wp-task-indent": `${nameCellPad}px` } as CSSProperties}
        >
          <div className="wp-task-tree-row__cell-name-inner">
            <span className="wp-task-toggler-wrap">
              {hasSubtasks ? (
                <button
                  type="button"
                  className="wp-icon-btn-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="wp-task-indent-spacer" />
              )}
            </span>

            <StatusIcon size={14} className={`${statusIconClass} wp-flex-shrink-0`} />

            <button
              type="button"
              className={`wp-task-title-btn${canPreviewEditTask ? " wp-task-title-btn--clickable" : " wp-task-title-btn--default-cursor"}${task.status === "done" ? " wp-task-title-btn--done" : ""}`}
              onClick={() => {
                if (canPreviewEditTask) {
                  Promise.resolve(onPreview(task)).catch(() => undefined);
                }
              }}
            >
              {task.title}
            </button>

            {subtaskBadge ? (
              <span className="wp-subtask-count-badge">
                {subtaskBadge.completed}/{subtaskBadge.total}
              </span>
            ) : null}

            {task.labels && task.labels.length > 0 ? (
              <div className="wp-task-labels">
                {task.labels.slice(0, 2).map((label) => (
                  <span key={label} className="wp-task-label-chip">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            {hovered && canPreviewEditTask ? (
              <button
                type="button"
                className="wp-task-preview-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  Promise.resolve(onPreview(task)).catch(() => undefined);
                }}
              >
                Preview/Edit
              </button>
            ) : null}
          </div>
        </td>

        <td>
          <div className="member-avatar bg-primary">
            {countAssignees(task.assigneeExtensionNumbers, task.assignee)}
          </div>
        </td>

        <td className="wp-task-cell-muted">{openSubtaskCount ?? "—"}</td>

        <td className="wp-task-cell-muted">
          {task.status === "overdue" ? (
            <span className="wp-overdue-text">Overdue</span>
          ) : (
            <span className="wp-dash-muted">—</span>
          )}
        </td>

        <td className="wp-task-cell-muted">
          {task.dueDate ? formatDateGlobal(task.dueDate) || "—" : "—"}
        </td>

        <td className="generic-table-actions-cell" />
      </tr>

      {isExpanded && hasChildTasks
        ? task.children!.map((child) => (
            <TaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              onPreview={onPreview}
              expandedTasks={expandedTasks}
              onToggleTask={onToggleTask}
              canPreviewEditTask={canPreviewEditTask}
              onPreviewSubtask={onPreviewSubtask}
            />
          ))
        : null}
      {isExpanded && subtasksLoaded && !hasChildTasks
        ? task.subtasks!.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              depth={depth + 1}
              canPreviewEditTask={canPreviewEditTask}
              parentTask={task}
              onPreviewSubtask={onPreviewSubtask}
            />
          ))
        : null}
    </>
  );
};

export const TaskRow = memo(TaskRowInner);

interface SubtaskRowProps {
  subtask: SubTask;
  depth: number;
  parentTask: Task;
  onPreviewSubtask: (parentTask: Task, sub: SubTask) => void | Promise<void>;
  canPreviewEditTask: boolean;
}

const SubtaskRowInner: React.FC<SubtaskRowProps> = ({
  subtask,
  depth,
  parentTask,
  onPreviewSubtask,
  canPreviewEditTask,
}) => {
  const [hovered, setHovered] = useState(false);
  const StatusIcon = TASK_STATUS_ICONS[subtask.status];
  const indentLeft = depth * 24;
  const nameCellPad = 40 + indentLeft + 8;
  const statusIconClass = `wp-status-icon--${taskStatusClassSuffix(subtask.status)}`;

  const onEnter = useCallback(() => setHovered(true), []);
  const onLeave = useCallback(() => setHovered(false), []);

  return (
    <tr
      className={`task-tree-row subtask-row wp-task-tree-row wp-task-tree-row--subtask${hovered ? " wp-task-tree-row--hover" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <td
        className="wp-task-tree-row__cell-name"
        style={{ "--wp-task-indent": `${nameCellPad}px` } as CSSProperties}
      >
        <div className="wp-task-tree-row__cell-name-inner">
          <span className="wp-task-indent-spacer" />
          <StatusIcon size={13} className={`${statusIconClass} wp-flex-shrink-0`} />
          <button
            type="button"
            className={`wp-task-title-btn wp-task-title-btn--sub${canPreviewEditTask ? " wp-task-title-btn--clickable" : " wp-task-title-btn--default-cursor"}${subtask.status === "done" ? " wp-task-title-btn--done" : ""}`}
              onClick={() => {
                if (canPreviewEditTask) {
                  Promise.resolve(onPreviewSubtask(parentTask, subtask)).catch(() => undefined);
                }
              }}
          >
            {subtask.title}
          </button>

          {hovered && canPreviewEditTask ? (
            <button
              type="button"
              className="wp-task-preview-btn wp-task-preview-btn--sub"
              onClick={(e) => {
                e.stopPropagation();
                Promise.resolve(onPreviewSubtask(parentTask, subtask)).catch(() => undefined);
              }}
            >
              <Eye size={11} />
              Preview
            </button>
          ) : null}
        </div>
      </td>

      <td>
        <div className="member-avatar bg-primary">
          {countAssignees(subtask.assigneeExtensionNumbers, subtask.assignee)}
        </div>
      </td>
      <td className="wp-task-cell-muted wp-task-cell-muted--faint">—</td>
      <td className="wp-task-cell-muted">
        {subtask.status === "overdue" ? <span className="wp-overdue-text">Overdue</span> : "—"}
      </td>
      <td className="wp-task-cell-muted wp-task-cell-muted--faint">
        {subtask.dueDate ? formatDateGlobal(subtask.dueDate) || "—" : "—"}
      </td>
      <td className="generic-table-actions-cell" />
    </tr>
  );
};

export const SubtaskRow = memo(SubtaskRowInner);
