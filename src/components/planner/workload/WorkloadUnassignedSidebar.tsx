import React from "react";
import { Alert, Button, Form, Offcanvas, Spinner } from "react-bootstrap";
import { AlertTriangle, Calendar, Clock, Inbox } from "lucide-react";
import type { WorkloadTaskCard, WorkloadUnassignedData } from "@utils/tasks";
import {
  formatWorkloadMemberAssignOption,
  formatWorkloadMinutes,
  formatWorkloadShortDueDate,
  formatWorkloadTaskEstimate,
  isWorkloadTaskUnestimated,
  workloadPriorityLabel,
  workloadPriorityTone,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";

type UnassignedQuerySlice = Readonly<{
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: WorkloadUnassignedData | undefined;
}>;

type WorkloadUnassignedTaskRowProps = Readonly<{
  task: WorkloadTaskCard;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  assignTarget: string;
  onAssignTargetChange: (value: string) => void;
  onAssign: () => void;
  isAssigning: boolean;
}>;

function WorkloadUnassignedTaskRow({
  task,
  memberExtensions,
  hierarchyExtensions,
  assignTarget,
  onAssignTargetChange,
  onAssign,
  isAssigning,
}: WorkloadUnassignedTaskRowProps) {
  const priorityTone = workloadPriorityTone(task.priority);
  const unestimated = isWorkloadTaskUnestimated(task);

  return (
    <div className="workload-unassigned-task">
      <p className="workload-unassigned-task__title">
        {task.title}
        {unestimated ? (
          <span
            className="workload-unestimated-dot ms-1"
            title="No estimate"
            aria-label="No estimate"
          />
        ) : null}
      </p>
      <div className="workload-unassigned-task__tags">
        <span className={`workload-priority-badge workload-priority-badge--${priorityTone}`}>
          {workloadPriorityLabel(task.priority)}
        </span>
        <span className="workload-unassigned-task__tag">{workloadTaskProjectLabel(task)}</span>
        {unestimated ? (
          <span className="workload-unassigned-task__tag workload-unassigned-task__tag--warn">
            <AlertTriangle size={12} aria-hidden />
            No est.
          </span>
        ) : (
          <span className="workload-unassigned-task__tag">
            <Clock size={12} aria-hidden />
            {formatWorkloadTaskEstimate(task)}
          </span>
        )}
        <span className="workload-unassigned-task__tag">
          <Calendar size={12} aria-hidden />
          {formatWorkloadShortDueDate(task.due_date)}
        </span>
      </div>
      <div className="workload-unassigned-task__assign">
        <Form.Select
          size="sm"
          value={assignTarget}
          onChange={(e) => onAssignTargetChange(e.target.value)}
          disabled={isAssigning}
          aria-label={`Assign ${task.title}`}
        >
          <option value="">Assign to…</option>
          {memberExtensions.map((ext) => (
            <option key={ext} value={ext}>
              {formatWorkloadMemberAssignOption(ext, hierarchyExtensions)}
            </option>
          ))}
        </Form.Select>
        <Button
          size="sm"
          variant="primary"
          disabled={isAssigning || !assignTarget}
          onClick={onAssign}
        >
          Assign
        </Button>
      </div>
    </div>
  );
}

export type WorkloadUnassignedSidebarProps = Readonly<{
  show: boolean;
  onClose: () => void;
  unassignedQuery: UnassignedQuerySlice;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  assignTargets: Record<number, string>;
  setAssignTargets: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  assignMutation: Readonly<{
    isPending: boolean;
    mutate: (vars: { task: WorkloadTaskCard; toExtension: string }) => void;
  }>;
  formatError: (err: unknown) => string;
}>;

export function WorkloadUnassignedSidebar({
  show,
  onClose,
  unassignedQuery,
  memberExtensions,
  hierarchyExtensions,
  assignTargets,
  setAssignTargets,
  assignMutation,
  formatError,
}: WorkloadUnassignedSidebarProps) {
  const count = unassignedQuery.data?.count ?? unassignedQuery.data?.tasks.length ?? 0;
  const subtitle =
    count === 1 ? "1 task needs assignment" : `${count} tasks need assignment`;

  return (
    <Offcanvas
      show={show}
      onHide={onClose}
      placement="end"
      className="workload-unassigned-offcanvas"
    >
      <Offcanvas.Header closeButton className="workload-unassigned-offcanvas__header border-0 pb-0">
        <div className="workload-unassigned-offcanvas__title-block">
          <div className="workload-unassigned-offcanvas__title-row">
            <Inbox size={20} className="text-primary" aria-hidden />
            <Offcanvas.Title className="mb-0">Unassigned Tasks</Offcanvas.Title>
          </div>
          <p className="workload-unassigned-offcanvas__subtitle text-muted small mb-0">
            {unassignedQuery.isPending ? "Loading…" : subtitle}
          </p>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body className="workload-unassigned-offcanvas__body pt-2">
        {unassignedQuery.isPending ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : null}
        {unassignedQuery.isError ? (
          <Alert variant="danger">{formatError(unassignedQuery.error)}</Alert>
        ) : null}
        {!unassignedQuery.isPending && !unassignedQuery.isError && count === 0 ? (
          <p className="text-muted small text-center py-4 mb-0">No unassigned tasks.</p>
        ) : null}
        {unassignedQuery.data?.tasks.map((task) => (
          <WorkloadUnassignedTaskRow
            key={task.id}
            task={task}
            memberExtensions={memberExtensions}
            hierarchyExtensions={hierarchyExtensions}
            assignTarget={assignTargets[task.id] ?? ""}
            onAssignTargetChange={(value) =>
              setAssignTargets((prev) => ({ ...prev, [task.id]: value }))
            }
            onAssign={() => {
              const toExtension = assignTargets[task.id] ?? "";
              if (!toExtension) return;
              assignMutation.mutate({ task, toExtension });
            }}
            isAssigning={assignMutation.isPending}
          />
        ))}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
