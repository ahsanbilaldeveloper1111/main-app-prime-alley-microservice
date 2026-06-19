import React from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { Plus, Calendar } from "lucide-react";
import { getExtensionDisplay } from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import {
  offcanvasAssigneeKey,
  offcanvasWatcherKey,
} from "@components/planner/taskDetailOffcanvas/taskDetailOffcanvasDomain";
import type {
  HierarchyExtension,
  TaskDetailTask,
  TaskDetailWatcher,
} from "@components/planner/taskDetailOffcanvas/taskDetailOffcanvasTypes";

export type TaskDetailOffcanvasSummaryProps = Readonly<{
  selectedTask: TaskDetailTask;
  hierarchyDataExtensions: HierarchyExtension[] | undefined;
  watchersList: TaskDetailWatcher[];
  canEditPlannerTask: boolean;
  onEditTask: () => void;
  getStatusVariant: (status: string) => string;
  getPriorityVariant: (priority: string) => string;
}>;

export function TaskDetailOffcanvasSummary({
  selectedTask,
  hierarchyDataExtensions,
  watchersList,
  canEditPlannerTask,
  onEditTask,
  getStatusVariant,
  getPriorityVariant,
}: TaskDetailOffcanvasSummaryProps) {
  return (
    <>
      <Row className="g-2 mb-3">
        <Col xs={6}>
          <div className="detail-section">
            <div className="detail-label">Status</div>
            <Badge bg={getStatusVariant(selectedTask.status)} className="px-3 py-2 w-100">
              {selectedTask.status}
            </Badge>
          </div>
        </Col>
        <Col xs={6}>
          <div className="detail-section">
            <div className="detail-label">Priority</div>
            <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100">
              {selectedTask.priority}
            </Badge>
          </div>
        </Col>
      </Row>

      <div className="detail-section">
        <div className="detail-label">Assignees</div>
        <div className="assignee-group">
          {selectedTask.rawData?.assignees?.map((assignee, idx) => {
            const extNumber = assignee.extension_number || "";
            const { name, initials } = getExtensionDisplay(extNumber, hierarchyDataExtensions);
            return (
              <div key={offcanvasAssigneeKey(assignee, idx)} className="assignee-badge" title={name}>
                {initials || "UN"}
              </div>
            );
          })}
          {canEditPlannerTask ? (
            <button
              type="button"
              className="add-assignee border-0"
              onClick={onEditTask}
              aria-label="Edit assignees"
            >
              <Plus size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-label">Watchers</div>
        <div className="assignee-group">
          {watchersList.length === 0 ? (
            <span className="text-muted small">No watchers</span>
          ) : (
            watchersList.map((watcher, idx) => {
              const extNumber = watcher.extension_number ?? "";
              const { name, initials } = getExtensionDisplay(String(extNumber), hierarchyDataExtensions);
              const displayName = name || String(extNumber) || "Unknown";
              return (
                <div
                  key={offcanvasWatcherKey(watcher, idx)}
                  className="tdo-watcher-chip"
                  title={displayName}
                >
                  <div className="assignee-badge">{initials || "—"}</div>
                  <span className="tdo-watcher-chip__name">{displayName}</span>
                </div>
              );
            })
          )}
          {canEditPlannerTask ? (
            <button
              type="button"
              className="add-assignee border-0"
              onClick={onEditTask}
              aria-label="Edit watchers"
              title="Edit watchers"
            >
              <Plus size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {selectedTask.dueDate ? (
        <div className="detail-section">
          <div className="detail-label">Due Date</div>
          <div className="tdo-due-row">
            <Calendar size={16} className="me-2 text-muted" />
            <span>{selectedTask.dueDate}</span>
          </div>
        </div>
      ) : null}

      <div className="detail-section">
        <div className="detail-label">Project</div>
        {selectedTask.project}
      </div>

      <div className="detail-section">
        <div className="detail-label">Description</div>
        <div
          className="task-description-html tdo-description"
          dangerouslySetInnerHTML={{
            __html:
              (selectedTask.rawData?.description ?? selectedTask.description)?.trim() ||
              '<span class="text-muted">No description provided</span>',
          }}
        />
      </div>
    </>
  );
}
