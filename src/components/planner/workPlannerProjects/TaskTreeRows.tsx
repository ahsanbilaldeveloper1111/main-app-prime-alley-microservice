import React, { memo, useCallback, useState, type CSSProperties } from "react";
import { ChevronRight, ChevronDown as ChevronDownIcon, Eye, Trash2, type LucideIcon } from "lucide-react";
import { formatDateGlobal } from "@utils/Helper";
import { TaskCompleteCircleButton } from "@utils/taskListing/taskListUiPrimitives";
import { type SubTask, type Task } from "@planner/workPlannerProjectsDomain";
import {
  getSubtaskBadgeCounts,
  plannerChildTasksToSubTasks,
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
  canToggleComplete: boolean;
  canDeleteTask: boolean;
  completeBtnTitle: string;
  deleteBtnTitle: string;
  isCompleting: boolean;
  onToggleComplete: () => void | Promise<void>;
  onDeleteTask: () => void;
  getSubtaskActions: (
    sub: SubTask,
  ) => Pick<
    SubtaskRowProps,
    | "canToggleComplete"
    | "canDeleteTask"
    | "completeBtnTitle"
    | "deleteBtnTitle"
    | "isCompleting"
    | "onToggleComplete"
    | "onDeleteTask"
  >;
}

function runTaskPreview(task: Task, onPreview: TaskRowProps["onPreview"]): void {
  Promise.resolve(onPreview(task)).catch(() => undefined);
}

function formatTaskAssigneeLabel(task: {
  assignee?: string;
  assigneeExtensionNumbers?: string[];
}): string {
  const label = task.assignee?.trim();
  if (label) {
    return label;
  }
  const ext = task.assigneeExtensionNumbers?.[0]?.trim();
  return ext ?? "—";
}

type TaskRowNameCellProps = {
  task: Task;
  nameCellPad: number;
  hasSubtasks: boolean;
  isExpanded: boolean;
  subtaskBadge: ReturnType<typeof getSubtaskBadgeCounts>;
  statusIconClass: string;
  StatusIcon: LucideIcon;
  canPreviewEditTask: boolean;
  onToggleTask: (taskId: string) => void;
  onPreview: TaskRowProps["onPreview"];
  hovered: boolean;
  canToggleComplete: boolean;
  completeBtnTitle: string;
  isCompleting: boolean;
  onToggleComplete: () => void | Promise<void>;
};

function TaskRowNameCell({
  task,
  nameCellPad,
  hasSubtasks,
  isExpanded,
  subtaskBadge,
  statusIconClass,
  StatusIcon,
  canPreviewEditTask,
  onToggleTask,
  onPreview,
  hovered,
  canToggleComplete,
  completeBtnTitle,
  isCompleting,
  onToggleComplete,
}: Readonly<TaskRowNameCellProps>) {
  return (
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

        {canToggleComplete ? (
          <TaskCompleteCircleButton
            isCompleted={task.status === "done"}
            title={completeBtnTitle}
            disabled={isCompleting}
            onClick={(e) => {
              e.stopPropagation();
              Promise.resolve(onToggleComplete()).catch(() => undefined);
            }}
          />
        ) : (
          <StatusIcon size={14} className={`${statusIconClass} wp-flex-shrink-0`} />
        )}

        <button
          type="button"
          className={`wp-task-title-btn${canPreviewEditTask ? " wp-task-title-btn--clickable" : " wp-task-title-btn--default-cursor"}${task.status === "done" ? " wp-task-title-btn--done" : ""}`}
          onClick={() => {
            if (canPreviewEditTask) {
              runTaskPreview(task, onPreview);
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
              runTaskPreview(task, onPreview);
            }}
          >
            Preview/Edit
          </button>
        ) : null}
      </div>
    </td>
  );
}

function TaskRowActionsCell({
  canDeleteTask,
  deleteBtnTitle,
  onDeleteTask,
}: Readonly<{
  canDeleteTask: boolean;
  deleteBtnTitle: string;
  onDeleteTask: () => void;
}>) {
  if (!canDeleteTask) {
    return <td className="generic-table-actions-cell" />;
  }
  return (
    <td className="generic-table-actions-cell" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="wp-icon-btn-transparent wp-task-delete-btn"
        title={deleteBtnTitle}
        aria-label={deleteBtnTitle}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteTask();
        }}
      >
        <Trash2 size={14} />
      </button>
    </td>
  );
}

const TaskRowInner: React.FC<TaskRowProps> = ({
  task,
  depth = 1,
  onPreview,
  expandedTasks,
  onToggleTask,
  canPreviewEditTask,
  onPreviewSubtask,
  canToggleComplete,
  canDeleteTask,
  completeBtnTitle,
  deleteBtnTitle,
  isCompleting,
  onToggleComplete,
  onDeleteTask,
  getSubtaskActions,
}) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expandedTasks.has(task.id);
  const hasChildTasks = (task.children?.length ?? 0) > 0;
  const subtasksLoaded = Boolean(task.subtasks && task.subtasks.length > 0);
  const hasSubtaskCounts = task.sub_task_count != null && task.sub_task_count > 0;
  const hasSubtasks = hasChildTasks || subtasksLoaded || hasSubtaskCounts;
  const subtaskBadge = hasChildTasks ? null : getSubtaskBadgeCounts(task);
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
        <TaskRowNameCell
          task={task}
          nameCellPad={nameCellPad}
          hasSubtasks={hasSubtasks}
          isExpanded={isExpanded}
          subtaskBadge={subtaskBadge}
          statusIconClass={statusIconClass}
          StatusIcon={StatusIcon}
          canPreviewEditTask={canPreviewEditTask}
          onToggleTask={onToggleTask}
          onPreview={onPreview}
          hovered={hovered}
          canToggleComplete={canToggleComplete}
          completeBtnTitle={completeBtnTitle}
          isCompleting={isCompleting}
          onToggleComplete={onToggleComplete}
        />

        <td className="wp-task-cell-muted">{formatTaskAssigneeLabel(task)}</td>

        <td className="wp-task-cell-muted">—</td>

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

        <TaskRowActionsCell
          canDeleteTask={canDeleteTask}
          deleteBtnTitle={deleteBtnTitle}
          onDeleteTask={onDeleteTask}
        />
      </tr>

      <TaskRowExpandedBranches
        isExpanded={isExpanded}
        hasChildTasks={hasChildTasks}
        subtasksLoaded={subtasksLoaded}
        task={task}
        depth={depth}
        canPreviewEditTask={canPreviewEditTask}
        onPreviewSubtask={onPreviewSubtask}
        getSubtaskActions={getSubtaskActions}
      />
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
  canToggleComplete: boolean;
  canDeleteTask: boolean;
  completeBtnTitle: string;
  deleteBtnTitle: string;
  isCompleting: boolean;
  onToggleComplete: () => void | Promise<void>;
  onDeleteTask: () => void;
}

const SubtaskRowInner: React.FC<SubtaskRowProps> = ({
  subtask,
  depth,
  parentTask,
  onPreviewSubtask,
  canPreviewEditTask,
  canToggleComplete,
  canDeleteTask,
  completeBtnTitle,
  deleteBtnTitle,
  isCompleting,
  onToggleComplete,
  onDeleteTask,
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
          {canToggleComplete ? (
            <TaskCompleteCircleButton
              isCompleted={subtask.status === "done"}
              title={completeBtnTitle}
              disabled={isCompleting}
              onClick={(e) => {
                e.stopPropagation();
                Promise.resolve(onToggleComplete()).catch(() => undefined);
              }}
            />
          ) : (
            <StatusIcon size={13} className={`${statusIconClass} wp-flex-shrink-0`} />
          )}
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

      <td className="wp-task-cell-muted">{formatTaskAssigneeLabel(subtask)}</td>
      <td className="wp-task-cell-muted wp-task-cell-muted--faint">—</td>
      <td className="wp-task-cell-muted">
        {subtask.status === "overdue" ? <span className="wp-overdue-text">Overdue</span> : "—"}
      </td>
      <td className="wp-task-cell-muted wp-task-cell-muted--faint">
        {subtask.dueDate ? formatDateGlobal(subtask.dueDate) || "—" : "—"}
      </td>
      <TaskRowActionsCell
        canDeleteTask={canDeleteTask}
        deleteBtnTitle={deleteBtnTitle}
        onDeleteTask={onDeleteTask}
      />
    </tr>
  );
};

export const SubtaskRow = memo(SubtaskRowInner);

type TaskRowExpandedBranchesProps = {
  isExpanded: boolean;
  hasChildTasks: boolean;
  subtasksLoaded: boolean;
  task: Task;
  depth: number;
  canPreviewEditTask: boolean;
  onPreviewSubtask: TaskRowProps["onPreviewSubtask"];
  getSubtaskActions: TaskRowProps["getSubtaskActions"];
};

function TaskRowExpandedBranches({
  isExpanded,
  hasChildTasks,
  subtasksLoaded,
  task,
  depth,
  canPreviewEditTask,
  onPreviewSubtask,
  getSubtaskActions,
}: Readonly<TaskRowExpandedBranchesProps>) {
  if (!isExpanded) {
    return null;
  }

  const childTasks = task.children;
  if (hasChildTasks && childTasks && childTasks.length > 0) {
    return (
      <>
        {plannerChildTasksToSubTasks(childTasks).map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            depth={depth + 1}
            canPreviewEditTask={canPreviewEditTask}
            parentTask={task}
            onPreviewSubtask={onPreviewSubtask}
            {...getSubtaskActions(sub)}
          />
        ))}
      </>
    );
  }

  const subs = task.subtasks;
  if (subtasksLoaded && !hasChildTasks && subs && subs.length > 0) {
    return (
      <>
        {subs.map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            depth={depth + 1}
            canPreviewEditTask={canPreviewEditTask}
            parentTask={task}
            onPreviewSubtask={onPreviewSubtask}
            {...getSubtaskActions(sub)}
          />
        ))}
      </>
    );
  }

  return null;
}
